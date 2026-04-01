import CascadeDetailPage from '@/components/pages/CascadeDetailPage';
import { generateSeoMetadata } from '@/lib/seo';
import { getSectorById } from '@/data/sectors';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; sector: string };
}): Promise<Metadata> {
  const sector = getSectorById(params.sector);
  const sectorName = sector?.name || params.sector.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return generateSeoMetadata({
    title: `${sectorName} Cascade Pattern`,
    description: `See how ${sectorName} leader stocks trigger mid-cap cascades with historical data.`,
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
