/**
 * Vercel Cron — 21:00 UTC = 06:00 KST
 * Regenerates 1w / 4w / 13w daily briefs and stores in Redis.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  createRedis, cacheKey, callAI, buildPrompt, parseAIResponse, fallbackBrief,
  type Timeframe,
} from '@/lib/daily-brief';

const TIMEFRAMES: Timeframe[] = ['1w', '4w', '13w'];

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  let capitalData: unknown = null;
  let macroData: unknown = null;
  try {
    const [cr, mr] = await Promise.allSettled([
      fetch(`${baseUrl}/api/capital-flows`, { signal: AbortSignal.timeout(25000) }),
      fetch(`${baseUrl}/api/macro-indicators`, { signal: AbortSignal.timeout(15000) }),
    ]);
    if (cr.status === 'fulfilled' && cr.value.ok) capitalData = await cr.value.json();
    if (mr.status === 'fulfilled' && mr.value.ok) macroData = await mr.value.json();
  } catch { /* proceed */ }

  const redis = createRedis();
  const results: Record<string, string> = {};

  for (const tf of TIMEFRAMES) {
    try {
      if (redis) { try { await redis.del(cacheKey(tf)); } catch { /* ignore */ } }
      const raw = await callAI(buildPrompt(tf, capitalData, macroData));
      const brief = (raw && parseAIResponse(raw, tf)) ?? fallbackBrief(tf);
      if (redis) await redis.set(cacheKey(tf), brief, { ex: 26 * 60 * 60 });
      results[tf] = 'ok';
    } catch (e) {
      results[tf] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  const kstNow = new Date(Date.now() + 9 * 3600000);
  return NextResponse.json({
    ok: true,
    results,
    durationMs: Date.now() - start,
    kstTime: kstNow.toISOString().slice(0, 16).replace('T', ' ') + ' KST',
  });
}
