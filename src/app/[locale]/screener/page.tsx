import ScreenerPage from '@/components/pages/ScreenerPage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: '스크리너 — Flowvium',
    description: '기관 13F 매집 + 공매도 데이터 기반 종목 스크리너. 숏 스퀴즈 후보, 기관 신규 편입 종목을 필터링합니다.',
    path: '/screener',
    locale: params.locale,
    keywords: ['stock screener', '주식 스크리너', 'institutional buying', 'short squeeze', '13F'],
  });
}

export default function Page() {
  return <ScreenerPage />;
}
