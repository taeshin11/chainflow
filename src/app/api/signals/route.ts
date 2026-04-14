import { getSignals } from '@/lib/signals-service';
import { NextResponse } from 'next/server';

// Cache for 12 hours at the CDN level.
// Vercel cron revalidates daily via /api/cron/update-signals.
export const revalidate = 43200;

export async function GET() {
  const result = await getSignals();
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
    },
  });
}
