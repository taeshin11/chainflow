import CascadePage from '@/components/pages/CascadePage';
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
    title: t('cascadeTitle'),
    description: t('cascadeDescription'),
    path: '/cascade',
    locale: params.locale,
    keywords: [
      'cascade tracker',
      'leader to midcap',
      'institutional buying patterns',
      'sector cascades',
      'mid-cap stocks',
    ],
  });
}

export default function Page() {
  return <CascadePage />;
}
