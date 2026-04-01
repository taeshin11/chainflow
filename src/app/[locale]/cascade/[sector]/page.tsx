import CascadeDetailPage from '@/components/pages/CascadeDetailPage';

export default function Page({ params }: { params: { locale: string; sector: string } }) {
  return <CascadeDetailPage sector={params.sector} />;
}
