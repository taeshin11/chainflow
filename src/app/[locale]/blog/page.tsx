import BlogClient from './BlogClient';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return generateSeoMetadata({
    title: 'Supply Chain Investment Insights',
    description:
      'Expert analysis on supply chain investing, institutional flow patterns, and cascade trading strategies.',
    path: '/blog',
    locale: params.locale,
    keywords: [
      'supply chain investing',
      'investment insights',
      'flow patterns',
      'cascade trading',
      'financial analysis',
    ],
  });
}

export default function Page() {
  return <BlogClient />;
}
