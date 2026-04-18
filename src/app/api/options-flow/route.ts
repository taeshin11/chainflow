/**
 * /api/options-flow
 *
 * Institutional options flow via Unusual Whales (requires UNUSUAL_WHALES_KEY
 * env — $48/mo personal tier). When unset the endpoint returns an empty
 * list with `configured: false` so the UI can show a "upgrade locked" state
 * without crashing.
 *
 * Why this exists: options flow is the closest retail-accessible proxy for
 * real-time institutional positioning. A big call-sweep on SMCI before earnings
 * is visible here — in 13F you'd see it 45 days later.
 *
 * Redis cache: 10 minutes (flow data updates continuously intraday).
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { fetchOptionsFlow, unusualWhalesKey, type OptionsFlowAlert } from '@/lib/unusual-whales';

const CACHE_KEY = 'flowvium:options-flow:v1';
const CACHE_TTL = 10 * 60;

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function GET(req: Request) {
  const configured = unusualWhalesKey() != null;
  if (!configured) {
    return NextResponse.json({ items: [], configured: false, total: 0 });
  }

  const redis = createRedis();
  const force = new URL(req.url).searchParams.get('refresh') === '1';
  if (redis && !force) {
    try {
      const cached = await redis.get<OptionsFlowAlert[]>(CACHE_KEY);
      if (cached) return NextResponse.json({ items: cached, configured: true, cached: true, total: cached.length });
    } catch { /* non-fatal */ }
  }

  const items = await fetchOptionsFlow(60);
  if (redis) {
    try { await redis.set(CACHE_KEY, items, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }
  return NextResponse.json({ items, configured: true, cached: false, total: items.length });
}
