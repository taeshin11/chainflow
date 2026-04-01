import HomePage from '@/components/pages/HomePage';
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
    title: t('homeTitle'),
    description: t('homeDescription'),
    path: '',
    locale: params.locale,
    keywords: [
      'institutional flow tracker',
      'supply chain map',
      'cascade detection',
      'smart money tracker',
    ],
  });
}

export default function Page() {
  return <HomePage />;
}
