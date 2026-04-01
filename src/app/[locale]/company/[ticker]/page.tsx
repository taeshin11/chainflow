import CompanyPage from '@/components/pages/CompanyPage';
import { generateSeoMetadata } from '@/lib/seo';
import { companies } from '@/data/companies';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; ticker: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  const company = companies.find(
    (c) => c.ticker.toLowerCase() === params.ticker.toLowerCase()
  );
  const companyName = company ? `${company.name} (${company.ticker})` : params.ticker.toUpperCase();

  return generateSeoMetadata({
    title: `${companyName} - ${t('exploreTitle')}`,
    description: `${companyName} - ${t('exploreDescription')}`,
    path: `/company/${params.ticker}`,
    locale: params.locale,
    keywords: [
      company?.name?.toLowerCase() || params.ticker.toLowerCase(),
      params.ticker.toUpperCase(),
      'supply chain analysis',
      'institutional signals',
      'revenue breakdown',
    ],
  });
}

export default function Page({ params }: { params: { locale: string; ticker: string } }) {
  return <CompanyPage ticker={params.ticker} />;
}
