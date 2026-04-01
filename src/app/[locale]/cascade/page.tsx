import CascadePage from '@/components/pages/CascadePage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: 'Leader-to-Midcap Cascade Tracker',
    description:
      'Track how institutional buying cascades from sector leaders to mid-cap stocks. Historical patterns across semiconductors, AI, EV, defense, pharma.',
    path: '/cascade',
    locale: params.locale,
    keywords: [
      'cascade tracker',
      'leader to midcap',
      'institutional buying patterns',
      'sector cascades',
      'mid-cap stocks',
    ],
  });
}

export default function Page() {
  return <CascadePage />;
}
