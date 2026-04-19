'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw, Trash2, Loader2, Lock } from 'lucide-react';

interface LogEntry {
  t: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  event: string;
  message?: string;
  status?: number;
  durationMs?: number;
  data?: Record<string, unknown>;
  error?: string;
}

interface BySource {
  total: number;
  errors: number;
  warns: number;
  lastSeen: string;
}

const LEVEL_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  error: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  warn:  { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  info:  { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', icon: <Info className="w-3.5 h-3.5" /> },
  debug: { bg: 'bg-white/5 border-white/10', text: 'text-cf-text-secondary', icon: <Info className="w-3.5 h-3.5" /> },
};

function fmtTime(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mn = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mn}:${ss}`;
}

export default function AdminLogsPage() {
  // Secret is kept only in localStorage — never committed or sent anywhere but the admin API
  const [secret, setSecret] = useState<string>('');
  const [secretInput, setSecretInput] = useState<string>('');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [bySource, setBySource] = useState<Record<string, BySource>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('flowvium_admin_secret') : null;
    if (saved) setSecret(saved);
  }, []);

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (levelFilter) params.set('level', levelFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { 'x-admin-secret': secret },
      });
      if (res.status === 401) { setError('Unauthorized — check CRON_SECRET'); setEntries([]); return; }
      if (!res.ok) { setError(`HTTP ${res.status}`); return; }
      const data = await res.json();
      setEntries(data.entries ?? []);
      setBySource(data.bySource ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fetch failed');
    } finally { setLoading(false); }
  }, [secret, levelFilter, sourceFilter]);

  useEffect(() => { load(); }, [load]);

  const saveSecret = () => {
    if (typeof window !== 'undefined') window.localStorage.setItem('flowvium_admin_secret', secretInput);
    setSecret(secretInput);
  };

  const clearBuffer = async () => {
    if (!secret || !confirm('Clear all log entries?')) return;
    await fetch('/api/admin/logs', { method: 'DELETE', headers: { 'x-admin-secret': secret } });
    load();
  };

  // ── Gate by secret ──────────────────────────────────────────────────────
  if (!secret) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="cf-card p-6">
          <div className="flex items-center gap-2 mb-4 text-cf-text-primary">
            <Lock className="w-5 h-5" /><h1 className="text-lg font-bold">Admin Logs</h1>
          </div>
          <p className="text-xs text-cf-text-secondary mb-4 leading-relaxed">
            Enter the CRON_SECRET environment variable to access. The value is kept in localStorage and only sent to <code>/api/admin/logs</code>.
          </p>
          <input
            type="password"
            value={secretInput}
            onChange={e => setSecretInput(e.target.value)}
            placeholder="CRON_SECRET"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-cf-text-primary mb-3"
            onKeyDown={e => e.key === 'Enter' && saveSecret()}
          />
          <button
            onClick={saveSecret}
            disabled={!secretInput}
            className="w-full bg-cf-accent/20 hover:bg-cf-accent/30 border border-cf-accent text-cf-accent text-sm font-semibold py-2 rounded-lg disabled:opacity-40"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const sources = Object.entries(bySource).sort((a, b) => b[1].errors - a[1].errors || b[1].total - a[1].total);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cf-text-primary flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            Admin · Logs
          </h1>
          <p className="text-sm text-cf-text-secondary mt-1">
            Recent warn/error events from Redis buffer · sorted newest first
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={clearBuffer}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="cf-card p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Source summary */}
      {sources.length > 0 && (
        <div className="cf-card p-3 mb-4">
          <p className="text-[11px] text-cf-text-secondary mb-2 font-bold">By source (click to filter)</p>
          <div className="flex flex-wrap gap-1.5">
            {sources.map(([src, s]) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`text-[10px] px-2 py-1 rounded-md border ${s.errors > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : s.warns > 0 ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' : 'bg-white/5 border-white/10 text-cf-text-secondary'} hover:bg-white/10`}
              >
                <span className="font-mono">{src}</span>
                <span className="ml-1.5 opacity-70">· {s.total}</span>
                {s.errors > 0 && <span className="ml-1 text-red-400">✕{s.errors}</span>}
                {s.warns > 0 && <span className="ml-1 text-amber-400">⚠{s.warns}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-cf-text-primary">
          <option value="">All levels</option>
          <option value="error">Errors only</option>
          <option value="warn">Warnings only</option>
          <option value="info">Info only</option>
        </select>
        <input
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          placeholder="Filter by source (e.g. yahoo)"
          className="flex-1 max-w-xs bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-cf-text-primary placeholder:text-cf-text-secondary/50"
        />
        {(levelFilter || sourceFilter) && (
          <button onClick={() => { setLevelFilter(''); setSourceFilter(''); }}
            className="text-xs text-cf-text-secondary hover:text-cf-text-primary">
            Clear filters
          </button>
        )}
        <span className="text-xs text-cf-text-secondary self-center ml-auto">{entries.length} entries</span>
      </div>

      {/* Entries */}
      <div className="space-y-1.5">
        {entries.map((e, i) => {
          const s = LEVEL_STYLES[e.level] ?? LEVEL_STYLES.info;
          return (
            <div key={i} className={`cf-card px-3 py-2 border ${s.bg} font-mono text-[11px]`}>
              <div className="flex items-start gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 font-bold ${s.text} w-14 shrink-0`}>
                  {s.icon}{e.level.toUpperCase()}
                </span>
                <span className="text-cf-text-secondary shrink-0">{fmtTime(e.t)}</span>
                <span className="text-cf-accent font-semibold">{e.source}</span>
                <span className="text-cf-text-primary">{e.event}</span>
                {e.status != null && <span className="text-cf-text-secondary">status={e.status}</span>}
                {e.durationMs != null && <span className="text-cf-text-secondary">{e.durationMs}ms</span>}
                {e.message && <span className="text-cf-text-secondary">· {e.message}</span>}
              </div>
              {e.error && (
                <pre className="mt-1 text-red-300/80 text-[10px] whitespace-pre-wrap break-all">{e.error}</pre>
              )}
              {e.data && Object.keys(e.data).length > 0 && (
                <pre className="mt-1 text-cf-text-secondary/80 text-[10px] whitespace-pre-wrap break-all">{JSON.stringify(e.data, null, 0)}</pre>
              )}
            </div>
          );
        })}
        {!loading && entries.length === 0 && (
          <div className="cf-card p-8 text-center text-sm text-cf-text-secondary">
            No log entries. If you just deployed, try hitting <code>/api/insider-trades?refresh=1</code> first.
          </div>
        )}
      </div>

      <p className="text-[10px] text-cf-text-secondary/40 mt-4">
        Redis buffer holds up to 500 most-recent warn+error entries. Full stream is in Vercel dashboard logs.
      </p>
    </div>
  );
}
