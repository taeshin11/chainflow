import HeatmapPage from '@/components/pages/HeatmapPage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: '시장 히트맵 — Flowvium',
    description: 'S&P 500 섹터 ETF와 추적 종목의 실시간 등락률 히트맵. 시장 흐름을 한눈에 파악합니다.',
    path: '/heatmap',
    locale: params.locale,
    keywords: ['market heatmap', '시장 히트맵', 'sector ETF', 'stock heatmap', 'S&P 500'],
  });
}

export default function Page() {
  return <HeatmapPage />;
}
