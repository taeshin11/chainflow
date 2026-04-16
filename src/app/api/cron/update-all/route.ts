/**
 * /api/cron/update-all
 *
 * 매일 06:00 KST (21:00 UTC) 실행
 * 모든 캐시를 순차적으로 워밍:
 *   1. macro-indicators (FRED 실시간)
 *   2. fedwatch (CME 기반)
 *   3. capital-flows (Yahoo Finance)
 *   4. flow-analysis (EXAONE AI)
 *   5. fear-greed (CNN + Yahoo)
 *   6. credit-balance
 */
import { NextResponse } from 'next/server';

function getBaseUrl(): string {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

async function warmEndpoint(base: string, path: string, label: string): Promise<{ label: string; ok: boolean; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(30000),
      headers: { 'x-cron-warm': '1' },
    });
    return { label, ok: res.ok, ms: Date.now() - start };
  } catch {
    return { label, ok: false, ms: Date.now() - start };
  }
}

export async function GET(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const base = getBaseUrl();
  const startTime = Date.now();

  // 1. Bust daily-keyed caches by calling endpoints (they auto-regenerate)
  // Run in parallel where safe, then flow-analysis after capital-flows
  const [macroResult, fedwatchResult, capitalResult, fearGreedResult, creditResult] =
    await Promise.all([
      warmEndpoint(base, '/api/macro-indicators', 'macro-indicators'),
      warmEndpoint(base, '/api/fedwatch', 'fedwatch'),
      warmEndpoint(base, '/api/capital-flows', 'capital-flows'),
      warmEndpoint(base, '/api/fear-greed', 'fear-greed'),
      warmEndpoint(base, '/api/credit-balance', 'credit-balance'),
    ]);

  // Flow analysis depends on capital-flows
  const flowResult = await warmEndpoint(base, '/api/flow-analysis?tf=4w', 'flow-analysis');

  // News cascade pre-warm (fire and forget — it's slow)
  fetch(`${base}/api/news-cascade`, { signal: AbortSignal.timeout(60000) }).catch(() => {});

  const results = [macroResult, fedwatchResult, capitalResult, fearGreedResult, creditResult, flowResult];
  const allOk = results.every(r => r.ok);

  return NextResponse.json({
    success: allOk,
    totalMs: Date.now() - startTime,
    results,
    updatedAt: new Date().toISOString(),
  });
}
