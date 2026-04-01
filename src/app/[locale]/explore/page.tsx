import ExplorePage from '@/components/pages/ExplorePage';
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
    title: t('exploreTitle'),
    description: t('exploreDescription'),
    path: '/explore',
    locale: params.locale,
    keywords: [
      'supply chain explorer',
      'interactive map',
      'company relationships',
      'sector visualization',
    ],
  });
}

export default function Page() {
  return <ExplorePage />;
}
