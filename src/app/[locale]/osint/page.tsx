import OSINTPage from '@/components/pages/OSINTPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OSINT 자금 추적 — Flowvium',
  description: 'OSINT 기반 자금 흐름 추적: 암호화폐 지갑 분석, OFAC 제재 명단 조회, 기업 구조 역추적',
};

export default function Page() {
  return <OSINTPage />;
}
