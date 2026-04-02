import { Metadata } from 'next';

const BASE_URL = 'https://chainflow-mu.vercel.app';
const SITE_NAME = 'ChainFlow';
const DEFAULT_DESC =
  'Track where smart money flows through the supply chain. Free institutional flow tracker, supply chain maps, and leader-to-midcap cascade analysis.';

export function generateSeoMetadata({
  title,
  description = DEFAULT_DESC,
  path = '',
  locale = 'en',
  keywords = [],
  image = '/og-default.png',
}: {
  title: string;
  description?: string;
  path?: string;
  locale?: string;
  keywords?: string[];
  image?: string;
}): Metadata {
  const url = `${BASE_URL}/${locale}${path}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: [
      'supply chain tracker',
      'institutional flow',
      'smart money',
      'investment tracker',
      ...keywords,
    ],
    authors: [{ name: 'THE ELIOT K FINANCIAL' }],
    creator: 'THE ELIOT K FINANCIAL',
    publisher: 'THE ELIOT K FINANCIAL',
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en${path}`,
        ko: `${BASE_URL}/ko${path}`,
        ja: `${BASE_URL}/ja${path}`,
        'zh-CN': `${BASE_URL}/zh-CN${path}`,
        es: `${BASE_URL}/es${path}`,
        de: `${BASE_URL}/de${path}`,
        fr: `${BASE_URL}/fr${path}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@spinai',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    },
  };
}
