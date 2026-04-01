import ExplorePage from '@/components/pages/ExplorePage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: 'Supply Chain Explorer - Interactive Map',
    description:
      'Interactive supply chain visualization. Click any company to see suppliers, partners, and institutional flow signals across 5 major sectors.',
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
