/**
 * /api/ownership-alerts
 *
 * Schedule 13D/13G filings — any entity crossing 5%+ ownership of a public
 * company must file within 10 days of the crossing. This is the "early-warning
 * system" for activist investors and major stake builds that won't appear in
 * 13F for another 45+ days.
 *
 * Redis cache: 2h (filings trickle in throughout the day, filings are weekly-ish
 * for any single name).
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { fetchRecentOwnershipAlerts, type OwnershipAlert } from '@/lib/edgar-insider';
import { logger, loggedRedisSet } from '@/lib/logger';

const CACHE_KEY = 'flowvium:ownership-alerts:v1';
const CACHE_TTL = 2 * 60 * 60;

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

  const reqStart = Date.now();
  if (redis && !force) {
    try {
      const cached = await redis.get<OwnershipAlert[]>(CACHE_KEY);
      if (cached) {
        const filtered = tickerFilter ? cached.filter(a => a.ticker === tickerFilter) : cached;
        logger.info('api.ownership-alerts', 'cache_hit', { total: cached.length, filtered: filtered.length });
        return NextResponse.json({ items: filtered, cached: true, total: cached.length });
      }
    } catch (err) { logger.warn('api.ownership-alerts', 'cache_read_error', { error: err }); }
  }

  const alerts = await fetchRecentOwnershipAlerts({ minPercent: 5 });

  await loggedRedisSet(redis, 'api.ownership-alerts', CACHE_KEY, alerts, { ex: CACHE_TTL });

  const filtered = tickerFilter ? alerts.filter(a => a.ticker === tickerFilter) : alerts;
  logger.info('api.ownership-alerts', 'served', { total: alerts.length, filtered: filtered.length, durationMs: Date.now() - reqStart });
  return NextResponse.json({ items: filtered, cached: false, total: alerts.length });
}
