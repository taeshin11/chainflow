'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Link as LinkIcon, Mail } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cf-border bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cf-primary/10">
                <LinkIcon className="w-4 h-4 text-cf-primary" />
              </div>
              <span className="text-xl font-heading font-bold text-cf-text-primary tracking-tight">
                Flow<span className="text-cf-primary">vium</span>
              </span>
            </div>
            <p className="text-sm text-cf-text-secondary leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
            <p className="text-xs text-cf-text-secondary">
              {t('builtBy')}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">{t('product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/explore"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('explore')}
                </Link>
              </li>
              <li>
                <Link
                  href="/cascade"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('cascade')}
                </Link>
              </li>
              <li>
                <Link
                  href="/signals"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('signals')}
                </Link>
              </li>
              <li>
                <Link
                  href="/news-gap"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('newsGap')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">{t('resources')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('blog')}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-use"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('howToUse')}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-use#faq"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">{t('legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('termsOfService')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">{t('company')}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:taeshinkim11@gmail.com"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200 flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  {t('contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-cf-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-cf-text-secondary">
              {t('copyright', { year: String(year) })}
            </p>
            <p className="text-xs text-cf-text-secondary text-center max-w-xl leading-relaxed">
              {t('disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
