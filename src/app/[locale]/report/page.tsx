import ReportPage from '@/components/pages/ReportPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Report — Flowvium',
  description: 'AI-powered daily brief: global money flows, institutional signals, supply chain alerts',
};

export default function Page() {
  return <ReportPage />;
}
