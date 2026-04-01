import { blogPosts, getBlogPostBySlug } from '@/data/blog-posts';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogArticleClient from './BlogArticleClient';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: `${post.title} - ChainFlow Blog`,
    description: post.metaDescription,
  };
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
