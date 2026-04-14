import { revalidatePath } from 'next/cache';
import { getSignals } from '@/lib/signals-service';
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'ko', 'ja', 'zh', 'es', 'pt', 'de', 'fr'];

/**
 * Vercel Cron handler — runs daily at 02:00 UTC (see vercel.json).
 *
 * Steps:
 * 1. Force-refresh news gap scores for all 23 US tickers via Alpha Vantage
 * 2. Persist results to Upstash Redis (26h TTL)
 * 3. Revalidate ISR cache for signals pages across all locales
 *
 * Protected by CRON_SECRET to prevent abuse.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  // Force fresh fetch → writes new scores to Redis
  const result = await getSignals(true);

  // Revalidate ISR pages
  revalidatePath('/api/signals');
  for (const locale of SUPPORTED_LOCALES) {
    revalidatePath(`/${locale}/signals`);
  }

  return NextResponse.json({
    ok: true,
    source: result.source,
    updatedTickers: result.updatedTickers,
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString(),
  });
}
