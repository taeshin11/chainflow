import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeedbackWidget from '@/components/FeedbackWidget';
import { generateSeoMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });
  return generateSeoMetadata({
    title: t('homeTitle'),
    description: t('homeDescription'),
    locale: params.locale,
    keywords: [
      'supply chain',
      'institutional buying',
      'cascade trading',
      '13F filings',
      'mid-cap stocks',
    ],
  });
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://chainflow-mu.vercel.app/#organization',
      name: 'THE ELIOT FINANCIAL',
      url: 'https://chainflow-mu.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://chainflow-mu.vercel.app/og-default.png',
      },
      sameAs: [],
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://chainflow-mu.vercel.app/#webapp',
      name: 'ChainFlow',
      url: 'https://chainflow-mu.vercel.app',
      description:
        'Track where smart money flows through the supply chain. Free institutional flow tracker, supply chain maps, and leader-to-midcap cascade analysis.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      creator: {
        '@type': 'Organization',
        name: 'THE ELIOT FINANCIAL',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://chainflow-mu.vercel.app/#website',
      url: 'https://chainflow-mu.vercel.app',
      name: 'ChainFlow',
      publisher: {
        '@id': 'https://chainflow-mu.vercel.app/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate:
            'https://chainflow-mu.vercel.app/en/explore?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <FeedbackWidget />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </NextIntlClientProvider>
  );
}
