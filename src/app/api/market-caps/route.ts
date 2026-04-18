/**
 * /api/market-caps
 *
 * Fetches live market caps for every ticker in allCompanies via Yahoo batch
 * quote, computes the UI band (titan/mega/large/mid/small), and returns a
 * flat { ticker: band } map. ExplorePage overlays this over the static
 * `marketCap` field so filtering reflects today's real market cap instead
 * of stale classifications baked into the data files.
 *
 * Redis cache: 24h. On miss, falls back to empty map (client keeps static).
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { allCompanies } from '@/data/companies';
import { fetchYFMarketCaps, type MarketCapBand } from '@/lib/yahoo-finance';

const CACHE_KEY = 'flowvium:market-caps:v1';
const CACHE_TTL = 24 * 60 * 60; // 24h

export const maxDuration = 60;

export interface MarketCapPayload {
  bands: Record<string, MarketCapBand>;  // ticker → band
  caps: Record<string, number>;          // ticker → raw USD cap
  updatedAt: string;
  count: number;
  cached?: boolean;
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET(req: Request) {
  const redis = createRedis();
  const force = new URL(req.url).searchParams.get('refresh') === '1';

  if (redis && !force) {
    try {
      const cached = await redis.get<MarketCapPayload>(CACHE_KEY);
      if (cached) return NextResponse.json({ ...cached, cached: true });
    } catch { /* non-fatal */ }
  }

  // Deduplicate tickers across batches (allCompanies concatenates multiple files
  // which can contain the same ticker with drifted marketCap enums — exactly
  // the bug this endpoint is addressing).
  const tickers = Array.from(new Set(allCompanies.map(c => c.ticker).filter(Boolean)));
  const results = await fetchYFMarketCaps(tickers);

  const bands: Record<string, MarketCapBand> = {};
  const caps: Record<string, number> = {};
  for (const r of results) {
    if (r.band) bands[r.ticker] = r.band;
    if (r.marketCap != null) caps[r.ticker] = r.marketCap;
  }

  const payload: MarketCapPayload = {
    bands,
    caps,
    updatedAt: new Date().toISOString(),
    count: Object.keys(bands).length,
  };

  if (redis) {
    try { await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ...payload, cached: false });
}
