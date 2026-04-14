import { Redis } from '@upstash/redis';

export interface TickerNewsCache {
  score: number;
  articles: number;
  updatedAt: string;
  headlines?: string[];
}

// Redis key for news gap cache
const KEY = 'chainflow:news-gap:v1';
// 26-hour TTL — ensures data refreshes daily even if cron fires slightly late
const TTL = 26 * 60 * 60;

function createRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function getNewsGapCache(): Promise<Record<string, TickerNewsCache> | null> {
  try {
    const redis = createRedis();
    if (!redis) return null;
    return await redis.get<Record<string, TickerNewsCache>>(KEY);
  } catch {
    return null;
  }
}

export async function setNewsGapCache(
  data: Record<string, TickerNewsCache>
): Promise<void> {
  try {
    const redis = createRedis();
    if (!redis) return;
    await redis.set(KEY, data, { ex: TTL });
  } catch {
    // Silent — page still works via static fallback
  }
}

/**
 * Merge incoming fresh data into existing cache.
 * Preserves entries for tickers not in the new batch (e.g. if partial refresh).
 */
export function mergeNewsGapCache(
  existing: Record<string, TickerNewsCache> | null,
  incoming: Record<string, TickerNewsCache>
): Record<string, TickerNewsCache> {
  return { ...(existing ?? {}), ...incoming };
}
