/**
 * src/lib/unusual-whales.ts
 *
 * Unusual Whales API — institutional options flow ($48/mo personal tier).
 * Pre-wired with UNUSUAL_WHALES_KEY env. When the key is absent, every
 * fetch returns [] so the rest of the site works on free data only.
 *
 * API docs: https://api.unusualwhales.com/docs
 */

export interface OptionsFlowAlert {
  id: string;
  timestamp: string;          // ISO
  ticker: string;
  optionType: 'call' | 'put';
  strike: number | null;
  expiry: string | null;       // YYYY-MM-DD
  size: number | null;          // number of contracts
  premiumUsd: number | null;    // $ premium spent
  side: 'ask' | 'bid' | 'mid';  // trade side — ask=bullish, bid=bearish
  isUnusual: boolean;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sourceUrl?: string;
}

import { logger } from './logger';

const UW_BASE = 'https://api.unusualwhales.com/api';

export function unusualWhalesKey(): string | null {
  return process.env.UNUSUAL_WHALES_KEY?.trim() || null;
}

/** Fetch the most recent institutional-size option trades (flow alerts). */
export async function fetchOptionsFlow(limit = 40): Promise<OptionsFlowAlert[]> {
  const key = unusualWhalesKey();
  if (!key) {
    logger.info('uw.flow', 'no_key', { message: 'UNUSUAL_WHALES_KEY not set — returning []' });
    return [];
  }
  const start = Date.now();
  try {
    const res = await fetch(`${UW_BASE}/option-trades/flow-alerts?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      logger.warn('uw.flow', 'http_error', { status: res.status, durationMs: Date.now() - start });
      return [];
    }
    const json = await res.json();
    const rows = (json?.data ?? []) as Array<Record<string, unknown>>;
    logger.info('uw.flow', 'fetched', { rows: rows.length, durationMs: Date.now() - start });
    return rows.map((r, i) => {
      const side = (r.side as string)?.toLowerCase() as OptionsFlowAlert['side'];
      const optType = ((r.option_type ?? r.type) as string)?.toLowerCase() as OptionsFlowAlert['optionType'];
      const sentiment: OptionsFlowAlert['sentiment'] =
        side === 'ask' && optType === 'call' ? 'bullish' :
        side === 'ask' && optType === 'put' ? 'bearish' :
        side === 'bid' && optType === 'call' ? 'bearish' :
        side === 'bid' && optType === 'put' ? 'bullish' :
        'neutral';
      return {
        id: (r.id as string) ?? `uw-${i}`,
        timestamp: (r.created_at ?? r.timestamp) as string,
        ticker: ((r.ticker ?? r.underlying) as string)?.toUpperCase() ?? '',
        optionType: optType,
        strike: r.strike != null ? Number(r.strike) : null,
        expiry: (r.expiry ?? r.expiration) as string | null,
        size: r.size != null ? Number(r.size) : null,
        premiumUsd: r.premium != null ? Number(r.premium) : (r.total_premium != null ? Number(r.total_premium) : null),
        side,
        isUnusual: Boolean(r.is_unusual ?? r.unusual),
        sentiment,
        sourceUrl: r.source_url as string | undefined,
      };
    });
  } catch (err) {
    logger.error('uw.flow', 'fetch_exception', { error: err, durationMs: Date.now() - start });
    return [];
  }
}
