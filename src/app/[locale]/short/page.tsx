import ShortPage from '@/components/pages/ShortPage';
import { generateSeoMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: '공매도 · 숏 스퀴즈 — Flowvium',
    description: 'Short Interest % of Float, Days to Cover, 기관 매집 충돌 분석으로 숏 스퀴즈 후보 종목을 발굴합니다.',
    path: '/short',
    locale: params.locale,
    keywords: ['short interest', 'short squeeze', '공매도', 'days to cover', 'FINRA', 'SEC'],
  });
}

export default function Page() {
  return <ShortPage />;
}
