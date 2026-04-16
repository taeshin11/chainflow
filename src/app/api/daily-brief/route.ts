import { NextResponse } from 'next/server';
import {
  createRedis, cacheKey, callAI, buildPrompt, parseAIResponse, fallbackBrief,
  type Timeframe,
} from '@/lib/daily-brief';

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

  // Always use the stable production domain for internal API fetches.
  // VERCEL_URL changes per deployment (preview URLs) — not reliable for self-calls.
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://flowvium.vercel.app';

  let capitalData: unknown = null;
  let macroData: unknown = null;
  try {
    const [cr, mr] = await Promise.allSettled([
      fetch(`${baseUrl}/api/capital-flows`, { signal: AbortSignal.timeout(20000) }),
      fetch(`${baseUrl}/api/macro-indicators`, { signal: AbortSignal.timeout(12000) }),
    ]);
    if (cr.status === 'fulfilled' && cr.value.ok) capitalData = await cr.value.json();
    if (mr.status === 'fulfilled' && mr.value.ok) macroData = await mr.value.json();
  } catch { /* proceed */ }

  const prompt = buildPrompt(tf, capitalData, macroData);
  let brief = null;
  try {
    const raw = await callAI(prompt);
    if (raw) brief = parseAIResponse(raw, tf);
  } catch { /* fallback */ }

  if (!brief) brief = fallbackBrief(tf, capitalData, macroData);

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
