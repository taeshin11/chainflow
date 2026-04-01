import NewsGapPage from '@/components/pages/NewsGapPage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: 'News Gap Analyzer - The Silence IS the Signal',
    description:
      'Compare institutional buying activity against media coverage. Find stocks where smart money is accumulating but headlines show zero coverage.',
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
