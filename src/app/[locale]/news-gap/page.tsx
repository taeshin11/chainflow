import NewsGapPage from '@/components/pages/NewsGapPage';
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

export default function Page() {
  return <NewsGapPage />;
}
