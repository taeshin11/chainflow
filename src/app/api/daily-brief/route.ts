import { NextResponse } from 'next/server';
import {
  createRedis, cacheKey, callAI, buildPrompt, parseAIResponse, fallbackBrief,
  gatherTabContext,
  type Timeframe,
} from '@/lib/daily-brief';

// Increase Vercel function timeout — required on Pro plan (60s), no-op on Hobby (10s)
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tf = (searchParams.get('tf') as Timeframe) ?? '4w';
  const force = searchParams.get('force') === '1';

  const redis = createRedis();
  if (redis && !force) {
    try {
      const cached = await redis.get(cacheKey(tf));
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch { /* non-fatal */ }
  }

  // Pull live data from every tab (heatmap, short, capital, fg, fed, macro,
  // credit, cascade, 13F signals). Feeds both the AI prompt and the
  // data-driven fallback so every section of the report reflects the
  // current site state.
  const ctx = await gatherTabContext(redis);

  const prompt = buildPrompt(tf, ctx);
  let brief = null;
  try {
    const { text, source } = await callAI(prompt);
    if (text) brief = parseAIResponse(text, tf, source);
  } catch { /* fallback */ }

  if (!brief) brief = fallbackBrief(tf, ctx);

  if (redis) {
    try { await redis.set(cacheKey(tf), brief, { ex: 26 * 60 * 60 }); } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ...brief, cached: false });
}

export async function DELETE(request: Request) {
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const redis = createRedis();
  if (!redis) return NextResponse.json({ error: 'No Redis' }, { status: 503 });
  const keys = (['1w', '4w', '13w'] as Timeframe[]).map(cacheKey);
  await Promise.allSettled(keys.map((k) => redis.del(k)));
  return NextResponse.json({ deleted: keys });
}
