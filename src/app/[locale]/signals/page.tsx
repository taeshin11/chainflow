import SignalsPage from '@/components/pages/SignalsPage';
import { generateSeoMetadata } from '@/lib/seo';
import { getSignals } from '@/lib/signals-service';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

// ISR: revalidate every 12 hours.
// Vercel cron at 02:00 UTC also calls /api/cron/update-signals for proactive refresh.
export const revalidate = 43200;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  return generateSeoMetadata({
    title: t('signalsTitle'),
    description: t('signalsDescription'),
    path: '/signals',
    locale: params.locale,
    keywords: [
      'institutional signals',
      '13F filings',
      'SEC filings',
      'accumulation patterns',
      'institutional buying',
    ],
  });
}

export default async function Page() {
  const { signals, lastUpdated, updatedTickers, source } = await getSignals();

  return (
    <SignalsPage
      initialSignals={signals}
      lastUpdated={lastUpdated}
      updatedTickers={updatedTickers}
      source={source}
    />
  );
}
