'use client';

import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbOverride {
  label?: string;
}

interface BreadcrumbsProps {
  overrides?: Record<string, BreadcrumbOverride>;
}

function formatSegment(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs({ overrides = {} }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = overrides[segment]?.label || formatSegment(segment);
    const isLast = index === segments.length - 1;
    return { href, label, isLast, segment };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://chainflow-mu.vercel.app',
      },
      ...crumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: crumb.label,
        item: `https://chainflow-mu.vercel.app${crumb.href}`,
      })),
    ],
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center flex-wrap gap-1 text-sm text-cf-text-secondary">
          <li className="flex items-center">
            <Link
              href="/"
              className="hover:text-cf-primary transition-colors flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-cf-text-secondary/50" />
              {crumb.isLast ? (
                <span className="text-cf-text-primary font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-cf-primary transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
