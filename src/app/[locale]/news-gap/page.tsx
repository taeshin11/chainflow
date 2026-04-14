import NewsGapPage from '@/components/pages/NewsGapPage';
import { generateSeoMetadata } from '@/lib/seo';
import { getNewsGapData } from '@/lib/news-gap-service';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

// ISR: revalidate every 12 hours (same cadence as signals page)
export const revalidate = 43200;

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  return generateSeoMetadata({
    title: t('newsGapTitle'),
    description: t('newsGapDescription'),
    path: '/news-gap',
    locale: params.locale,
    keywords: [
      'news gap',
      'media coverage gap',
      'institutional accumulation',
      'smart money signals',
      'news silence',
    ],
  });
}

export default async function Page() {
  const { entries, lastUpdated, source, updatedTickers } = await getNewsGapData();

  return (
    <NewsGapPage
      initialEntries={entries}
      lastUpdated={lastUpdated}
      source={source}
      updatedTickers={updatedTickers}
    />
  );
}
