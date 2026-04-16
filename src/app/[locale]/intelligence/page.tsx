import IntelligencePage from '@/components/pages/IntelligencePage';
import { generateSeoMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'intelligence' });
  return generateSeoMetadata({
    title: t('title') + ' — Flowvium',
    description: t('description'),
    path: '/intelligence',
    locale: params.locale,
    keywords: [
      'macro intelligence',
      'regulatory capture',
      'Cantillon effect',
      'dark pools',
      'revolving door',
      'military industrial complex',
      'sovereign wealth funds',
    ],
  });
}

export default function Page() {
  return <IntelligencePage />;
}
