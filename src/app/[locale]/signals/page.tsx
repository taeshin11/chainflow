import SignalsPage from '@/components/pages/SignalsPage';
import { generateSeoMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

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

export default function Page() {
  return <SignalsPage />;
}
