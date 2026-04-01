import ExplorePage from '@/components/pages/ExplorePage';

export default function Page({ params }: { params: { locale: string; sector: string } }) {
  return <ExplorePage initialSector={params.sector} />;
}
