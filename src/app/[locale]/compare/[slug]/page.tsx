import ComparePage from '@/components/pages/ComparePage';
import { generateSeoMetadata } from '@/lib/seo';
import { allCompanies } from '@/data/companies';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  const [ticker1, , ticker2] = params.slug.toUpperCase().split('-');
  const c1 = allCompanies.find((c) => c.ticker === ticker1);
  const c2 = allCompanies.find((c) => c.ticker === ticker2);
  const title =
    c1 && c2
      ? `${c1.name} vs ${c2.name} — Supply Chain & Institutional Flow Comparison`
      : `${ticker1} vs ${ticker2} — ${t('exploreTitle')}`;

  return generateSeoMetadata({
    title,
    description: `Side-by-side comparison of ${ticker1} and ${ticker2}: revenue, supply chain position, institutional signals, and news gap score.`,
    path: `/compare/${params.slug}`,
    locale: params.locale,
    keywords: [
      ticker1?.toLowerCase(),
      ticker2?.toLowerCase(),
      'vs comparison',
      'supply chain comparison',
      'institutional flow',
    ],
  });
}

export default function Page({ params }: { params: { locale: string; slug: string } }) {
  return <ComparePage slug={params.slug} />;
}
