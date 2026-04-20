/**
 * Stooq batch quote client — free CSV endpoint, no auth required.
 * Used as primary price source since Yahoo Finance v7 now returns 401 from Vercel.
 */
import { logger } from './logger';

export interface StooqQuote {
  symbol: string;
  date: string | null;
  time: string | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  /** Intraday % change: (close - open) / open * 100 */
  changePct: number | null;
}

/** Fetch up to ~40 symbols at once; Stooq supports batch queries separated by `+` */
export async function fetchStooqQuotes(tickers: string[]): Promise<StooqQuote[]> {
  if (!tickers.length) return [];

  // Stooq uses lowercase + .us suffix for US stocks
  const stooqSymbols = tickers.map(t => `${t.toLowerCase().replace('-', '-')}.us`);

  // Split into batches of 40 to stay within URL limits
  const BATCH = 35;
  const out: StooqQuote[] = [];

  for (let i = 0; i < stooqSymbols.length; i += BATCH) {
    const batch = stooqSymbols.slice(i, i + BATCH);
    const batchStart = Date.now();
    try {
      const url = `https://stooq.com/q/l/?s=${batch.join('+')}&f=sd2t2ohlcv&h&e=csv`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        cache: 'no-store',
      });
      if (!res.ok) {
        logger.warn('stooq', 'http_error', { batchStart: i, batchEnd: i + BATCH, status: res.status, durationMs: Date.now() - batchStart });
        continue;
      }
      const text = await res.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) continue;

      // Skip header
      for (let j = 1; j < lines.length; j++) {
        const cols = lines[j].split(',');
        if (cols.length < 8) continue;
        const symbol = cols[0].replace(/\.us$/i, '').toUpperCase();
        const date = cols[1] && cols[1] !== 'N/D' ? cols[1] : null;
        const time = cols[2] && cols[2] !== 'N/D' ? cols[2] : null;
        const open = parseFloat(cols[3]);
        const high = parseFloat(cols[4]);
        const low = parseFloat(cols[5]);
        const close = parseFloat(cols[6]);
        const volume = parseFloat(cols[7]);
        const changePct = (open > 0 && !isNaN(close)) ? ((close - open) / open) * 100 : null;

        out.push({
          symbol,
          date,
          time,
          open: isNaN(open) ? null : open,
          high: isNaN(high) ? null : high,
          low: isNaN(low) ? null : low,
          close: isNaN(close) ? null : close,
          volume: isNaN(volume) ? null : volume,
          changePct: changePct != null ? parseFloat(changePct.toFixed(2)) : null,
        });
      }
    } catch (err) {
      logger.error('stooq', 'batch_failed', { batchStart: i, batchEnd: i + BATCH, error: err, durationMs: Date.now() - batchStart });
    }
  }

  logger.info('stooq', 'fetched', { requested: tickers.length, returned: out.length });
  return out;
}
