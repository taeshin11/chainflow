import { institutionalSignals, type InstitutionalSignal } from '@/data/institutional-signals';
import { fetchNewsData, computeNewsGapScore } from '@/lib/alpha-vantage';
import {
  getNewsGapCache,
  setNewsGapCache,
  mergeNewsGapCache,
  type TickerNewsCache,
} from '@/lib/signals-cache';

/**
 * All US-listed tickers we track.
 * Ordered mid/small caps FIRST — news gap is most meaningful for less-covered stocks.
 * Large caps (always in the news) are at the end.
 *
 * 23 tickers × 1 AV call each = 23 calls/day → safely within 25/day free tier limit.
 */
const US_TICKERS_BY_PRIORITY = [
  // Mid/small caps — news gap signal is strongest here
  'MU',   'AMAT', 'LRCX', 'KLAC', 'ALB',
  'KTOS', 'MRVL', 'RTX',  'NOC',  'LHX',
  'REGN', 'MRNA', 'PFE',  'ORCL', 'NVO',
  'TSM',  'ASML',
  // Large caps — still useful but always in the news
  'NVDA', 'MSFT', 'GOOGL', 'META', 'AMZN',
  'TSLA', 'LLY',  'LMT',
]; // 25 tickers = Alpha Vantage free tier daily limit

export interface SignalsResult {
  signals: InstitutionalSignal[];
  lastUpdated: string;
  updatedTickers: number;
  source: 'live' | 'cached' | 'static';
}

/**
 * Fetch fresh news counts for all US tickers and return a gap cache map.
 * Fires in parallel but respects Alpha Vantage's 5 req/min limit via batching.
 */
async function refreshNewsGaps(
  apiKey: string
): Promise<Record<string, TickerNewsCache>> {
  const now = new Date().toISOString();
  const result: Record<string, TickerNewsCache> = {};

  // AV free tier: 5 req/min — process in batches of 5 with 12s gap
  const BATCH = 5;
  const DELAY_MS = 12_000;

  for (let i = 0; i < US_TICKERS_BY_PRIORITY.length; i += BATCH) {
    const batch = US_TICKERS_BY_PRIORITY.slice(i, i + BATCH);

    const results = await Promise.allSettled(
      batch.map((ticker) => fetchNewsData(ticker, apiKey))
    );

    for (let j = 0; j < batch.length; j++) {
      const ticker = batch[j];
      const r = results[j];
      if (r.status === 'fulfilled' && r.value !== null) {
        result[ticker] = {
          score: computeNewsGapScore(r.value.count),
          articles: r.value.count,
          recentArticles: r.value.articles,
          updatedAt: now,
        };
      }
    }

    // Wait between batches (skip delay after last batch)
    if (i + BATCH < US_TICKERS_BY_PRIORITY.length) {
      await new Promise((res) => setTimeout(res, DELAY_MS));
    }
  }

  return result;
}

/**
 * Apply a news gap cache map onto the static signal array.
 * Only newsGapScore + mediaArticles are overwritten — ownership data stays from 13F.
 */
function applyNewsGaps(
  base: InstitutionalSignal[],
  cache: Record<string, TickerNewsCache>
): InstitutionalSignal[] {
  return base.map((s) => {
    const entry = cache[s.ticker];
    if (!entry) return s;
    return { ...s, newsGapScore: entry.score, mediaArticles: entry.articles };
  });
}

/**
 * Main entry point called by the signals server component.
 *
 * Strategy:
 * 1. Try Redis cache (fast path — serves stale-while-revalidating in ISR)
 * 2. If no cache or forced refresh → fetch fresh news counts from Alpha Vantage
 * 3. Persist refreshed data to Redis (26h TTL)
 * 4. Merge into static signal list and return
 */
export async function getSignals(forceRefresh = false): Promise<SignalsResult> {
  const apiKey =
    process.env.ALPHA_VANTAGE_KEY ??
    process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY ??
    '';

  const lastUpdated = new Date().toISOString();

  // === No API key → pure static fallback ===
  if (!apiKey) {
    return {
      signals: institutionalSignals,
      lastUpdated,
      updatedTickers: 0,
      source: 'static',
    };
  }

  // === Try Redis cache ===
  const cached = await getNewsGapCache();

  if (cached && !forceRefresh) {
    return {
      signals: applyNewsGaps(institutionalSignals, cached),
      lastUpdated,
      updatedTickers: Object.keys(cached).length,
      source: 'cached',
    };
  }

  // === Fetch fresh news counts ===
  try {
    const fresh = await refreshNewsGaps(apiKey);
    const merged = mergeNewsGapCache(cached, fresh);

    // Persist to Redis asynchronously (don't block response)
    setNewsGapCache(merged).catch(() => undefined);

    return {
      signals: applyNewsGaps(institutionalSignals, merged),
      lastUpdated,
      updatedTickers: Object.keys(fresh).length,
      source: 'live',
    };
  } catch {
    // Fetch failed — serve from cache or static
    if (cached) {
      return {
        signals: applyNewsGaps(institutionalSignals, cached),
        lastUpdated,
        updatedTickers: Object.keys(cached).length,
        source: 'cached',
      };
    }
    return {
      signals: institutionalSignals,
      lastUpdated,
      updatedTickers: 0,
      source: 'static',
    };
  }
}
