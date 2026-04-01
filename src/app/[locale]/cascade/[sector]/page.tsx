import CascadeDetailPage from '@/components/pages/CascadeDetailPage';
import { generateSeoMetadata } from '@/lib/seo';
import { getSectorById } from '@/data/sectors';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; sector: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  const sector = getSectorById(params.sector);
  const sectorName = sector?.name || params.sector.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return generateSeoMetadata({
    title: `${sectorName} - ${t('cascadeTitle')}`,
    description: `${sectorName} - ${t('cascadeDescription')}`,
    path: `/cascade/${params.sector}`,
    locale: params.locale,
    keywords: [
      sectorName.toLowerCase(),
      'cascade pattern',
      'leader stocks',
      'mid-cap cascade',
      'historical data',
    ],
  });
}

export default function Page({ params }: { params: { locale: string; sector: string } }) {
  return <CascadeDetailPage sector={params.sector} />;
}
