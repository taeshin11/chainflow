import InsiderPage from '@/components/pages/InsiderPage';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: '실시간 수급 · 내부자 매매 — Flowvium',
    description: 'SEC Form 4 내부자 매매 + Schedule 13D/13G 5%+ 지분 알림 + 옵션 unusual flow + 한국 외인·기관 실시간 수급. 13F 45일 지연을 우회하는 Bloomberg 스타일 실시간 자금 추적.',
    path: '/insider',
    locale: params.locale,
    keywords: ['Form 4', 'insider trading', '13D', '13G', 'options flow', '외국인 수급', '기관 수급', 'KRX', 'SEC EDGAR'],
  });
}

export default function Page() {
  return <InsiderPage />;
}
