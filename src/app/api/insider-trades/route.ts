/**
 * /api/insider-trades
 *
 * Real-time Form 4 insider transactions (officer/director/10%+ holder open-market
 * buys and sells). Beats the 45-day 13F delay because Form 4 must be filed
 * within D+2 business days of the trade.
 *
 * Redis cache: 30 minutes (SEC publishes throughout the day).
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { fetchRecentForm4, type InsiderTransaction } from '@/lib/edgar-insider';

const CACHE_KEY = 'flowvium:insider-trades:v1';
const CACHE_TTL = 30 * 60;

export const maxDuration = 60;

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET(req: Request) {
  const redis = createRedis();
  const url = new URL(req.url);
  const force = url.searchParams.get('refresh') === '1';
  const tickerFilter = url.searchParams.get('ticker')?.toUpperCase();

  if (redis && !force) {
    try {
      const cached = await redis.get<InsiderTransaction[]>(CACHE_KEY);
      if (cached) {
        const filtered = tickerFilter ? cached.filter(t => t.ticker === tickerFilter) : cached;
        return NextResponse.json({ items: filtered, cached: true, total: cached.length });
      }
    } catch { /* non-fatal */ }
  }

  const transactions = await fetchRecentForm4({ feedCount: 80, includeOther: false });

  if (redis) {
    try { await redis.set(CACHE_KEY, transactions, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }

  const filtered = tickerFilter ? transactions.filter(t => t.ticker === tickerFilter) : transactions;
  return NextResponse.json({ items: filtered, cached: false, total: transactions.length });
}
