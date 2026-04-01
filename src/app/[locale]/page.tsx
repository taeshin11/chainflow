import HomePage from '@/components/pages/HomePage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: 'Track Institutional Supply Chain Flows',
    description:
      'Free tool to track how institutional buying flows through supply chain relationships. Map companies, detect signals, and spot cascades before headlines.',
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
