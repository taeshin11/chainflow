import BlogClient from './BlogClient';
import { generateSeoMetadata } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';
import { translateBlogSummary } from '@/lib/blog-translate';
import { blogPosts } from '@/data/blog-posts';
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

export default async function Page({ params }: { params: { locale: string } }) {
  // Translate all post summaries in parallel (uses Redis cache — fast after first visit)
  const translatedPosts = await Promise.all(
    blogPosts.map(async (post) => {
      const { title, metaDescription } = await translateBlogSummary(
        params.locale,
        post.slug,
        post.title,
        post.metaDescription,
      );
      return { ...post, title, metaDescription };
    })
  );

  return <BlogClient posts={translatedPosts} />;
}
