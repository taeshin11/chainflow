import ExplorePage from '@/components/pages/ExplorePage';
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
    title: `${sectorName} - ${t('exploreTitle')}`,
    description: `${sectorName} - ${t('exploreDescription')}`,
    path: `/explore/${params.sector}`,
    locale: params.locale,
    keywords: [
      sectorName.toLowerCase(),
      'supply chain map',
      'company relationships',
      'institutional flows',
      'cascade analysis',
    ],
  });
}

export default function Page({ params }: { params: { locale: string; sector: string } }) {
  return <ExplorePage initialSector={params.sector} />;
}
