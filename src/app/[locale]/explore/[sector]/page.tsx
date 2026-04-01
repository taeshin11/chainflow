import ExplorePage from '@/components/pages/ExplorePage';
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
    title: `${sectorName} Supply Chain Map`,
    description: `Explore the ${sectorName} supply chain. See company relationships, institutional flows, and leader-to-midcap cascades.`,
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
