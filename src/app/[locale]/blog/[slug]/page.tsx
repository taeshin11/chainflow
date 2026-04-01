import { blogPosts, getBlogPostBySlug } from '@/data/blog-posts';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateSeoMetadata } from '@/lib/seo';
import BlogArticleClient from './BlogArticleClient';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return { title: 'Not Found' };
  return generateSeoMetadata({
    title: post.title,
    description: post.metaDescription,
    path: `/blog/${params.slug}`,
    locale: params.locale,
    keywords: [
      'supply chain blog',
      post.sector,
      'investment analysis',
      'cascade trading',
    ],
  });
}

export default function BlogArticlePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return notFound();
  return <BlogArticleClient post={post} />;
}
