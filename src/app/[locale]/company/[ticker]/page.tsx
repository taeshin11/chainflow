import CompanyPage from '@/components/pages/CompanyPage';

export default function Page({ params }: { params: { locale: string; ticker: string } }) {
  return <CompanyPage ticker={params.ticker} />;
}
