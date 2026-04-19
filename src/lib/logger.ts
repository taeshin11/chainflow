/**
 * src/lib/logger.ts
 *
 * Structured logger used across all server code. Purposes:
 *   1. Emit single-line JSON to stdout so Vercel's log dashboard shows a
 *      searchable/filterable stream (Vercel captures console.log/error).
 *   2. Push warn/error entries to a capped Redis list so the in-app
 *      /admin/errors page can surface recent failures without requiring
 *      Vercel dashboard access.
 *   3. Auto-time external fetches via `logger.time()` so slow calls get
 *      flagged with duration.
 *
 * Design choices:
 *   - Source tags are dotted strings (e.g. `yahoo.crumb`, `edgar.form4`,
 *     `api.insider-trades`) to group by subsystem.
 *   - `event` is a short slug so logs are grep-friendly (`fetch_failed`,
 *     `parse_ok`, `cache_hit`, `rate_limited`).
 *   - Errors are NEVER swallowed silently — every caller that used to
 *     `catch {}` should now call `logger.error(source, event, err)` before
 *     returning the fallback.
 */

import { Redis } from '@upstash/redis';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  t: string;                 // ISO timestamp
  level: LogLevel;
  source: string;            // dotted subsystem tag
  event: string;             // slug ("fetch_failed", etc.)
  message?: string;
  status?: number;           // HTTP status if applicable
  durationMs?: number;
  data?: Record<string, unknown>;
  error?: string;            // error message (stack truncated)
}

const REDIS_KEY = 'flowvium:log:recent';
const REDIS_MAX = 500;

function redis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Serialise errors (any kind) to a clean message string. */
function toErrorMessage(err: unknown): string {
  if (err == null) return '';
  if (err instanceof Error) {
    const name = err.name || 'Error';
    const msg = err.message || '';
    // Keep stack top frame if available (helps pinpoint source file)
    const stack = err.stack ? err.stack.split('\n').slice(0, 3).join(' | ') : '';
    return `${name}: ${msg}${stack ? ' @ ' + stack : ''}`.slice(0, 800);
  }
  if (typeof err === 'string') return err.slice(0, 800);
  try { return JSON.stringify(err).slice(0, 800); } catch { return String(err).slice(0, 800); }
}

/** Emit the entry: always to console, and to Redis for warn/error. */
async function emit(entry: LogEntry): Promise<void> {
  // Console: one line JSON (Vercel captures this)
  const line = JSON.stringify(entry);
  if (entry.level === 'error') console.error(line);
  else if (entry.level === 'warn') console.warn(line);
  else console.log(line);

  // Redis: only persist warn/error (avoid filling up with info noise)
  if (entry.level === 'warn' || entry.level === 'error') {
    const r = redis();
    if (!r) return;
    try {
      await r.lpush(REDIS_KEY, JSON.stringify(entry));
      await r.ltrim(REDIS_KEY, 0, REDIS_MAX - 1);
    } catch {
      // Intentionally silent — can't log an error about the error logger
      // failing. The console line above still went through.
    }
  }
}

function makeEntry(level: LogLevel, source: string, event: string, data?: unknown): LogEntry {
  const entry: LogEntry = {
    t: new Date().toISOString(),
    level,
    source,
    event,
  };
  if (data == null) return entry;
  if (data instanceof Error) {
    entry.error = toErrorMessage(data);
    return entry;
  }
  if (typeof data === 'string') {
    entry.message = data;
    return entry;
  }
  if (typeof data === 'object') {
    const rec = data as Record<string, unknown>;
    if (rec.error != null) {
      entry.error = toErrorMessage(rec.error);
    }
    if (typeof rec.message === 'string') entry.message = rec.message;
    if (typeof rec.status === 'number') entry.status = rec.status;
    if (typeof rec.durationMs === 'number') entry.durationMs = rec.durationMs;
    // Stash remaining fields into data
    const rest: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (['error', 'message', 'status', 'durationMs'].includes(k)) continue;
      rest[k] = v;
    }
    if (Object.keys(rest).length > 0) entry.data = rest;
    return entry;
  }
  entry.data = { value: data };
  return entry;
}

export const logger = {
  debug(source: string, event: string, data?: unknown) {
    emit(makeEntry('debug', source, event, data));
  },
  info(source: string, event: string, data?: unknown) {
    emit(makeEntry('info', source, event, data));
  },
  warn(source: string, event: string, data?: unknown) {
    emit(makeEntry('warn', source, event, data));
  },
  error(source: string, event: string, data?: unknown) {
    emit(makeEntry('error', source, event, data));
  },

  /**
   * Wrap an async operation with automatic timing + success/failure logging.
   * Logs `event_start` at debug, and `event` at info/error with durationMs.
   */
  async time<T>(source: string, event: string, fn: () => Promise<T>, extra?: Record<string, unknown>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - start;
      emit(makeEntry('info', source, event, { ...(extra ?? {}), durationMs, ok: true }));
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      emit(makeEntry('error', source, event, { ...(extra ?? {}), durationMs, ok: false, error: err }));
      throw err;
    }
  },

  /** Same as time() but never re-throws — returns fallback on error.
   *  Use when the existing behaviour was `catch { return fallback; }`. */
  async timeSafe<T>(source: string, event: string, fn: () => Promise<T>, fallback: T, extra?: Record<string, unknown>): Promise<T> {
    try { return await this.time(source, event, fn, extra); }
    catch { return fallback; }
  },
};

// ── Admin viewer helpers ──────────────────────────────────────────────────────

/** Fetch recent log entries (newest first). Returns [] if Redis is absent. */
export async function getRecentLogs(limit = 200, levelFilter?: LogLevel): Promise<LogEntry[]> {
  const r = redis();
  if (!r) return [];
  try {
    const raw = await r.lrange(REDIS_KEY, 0, limit - 1);
    const entries = raw
      .map((v: unknown) => {
        if (typeof v === 'string') {
          try { return JSON.parse(v) as LogEntry; } catch { return null; }
        }
        // Upstash sometimes pre-deserialises JSON
        return v as LogEntry;
      })
      .filter((e): e is LogEntry => !!e);
    return levelFilter ? entries.filter(e => e.level === levelFilter) : entries;
  } catch {
    return [];
  }
}

/** Clear the error buffer (admin action). */
export async function clearLogs(): Promise<void> {
  const r = redis();
  if (!r) return;
  try { await r.del(REDIS_KEY); } catch { /* non-fatal */ }
}
