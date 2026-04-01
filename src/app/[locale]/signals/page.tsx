import SignalsPage from '@/components/pages/SignalsPage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: 'Institutional Flow Signals Dashboard',
    description:
      'Track institutional buying and selling signals from SEC 13F filings. Spot accumulation patterns before mainstream coverage.',
    path: '/signals',
    locale: params.locale,
    keywords: [
      'institutional signals',
      '13F filings',
      'SEC filings',
      'accumulation patterns',
      'institutional buying',
    ],
  });
}

export default function Page() {
  return <SignalsPage />;
}
