import BlogClient from './BlogClient';
import { generateSeoMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  return generateSeoMetadata({
    title: t('homeTitle') + ' - Blog',
    description: t('homeDescription'),
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
