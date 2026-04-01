import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Link as LinkIcon } from 'lucide-react';

const footerLinks = [
  { href: '/explore', key: 'explore' },
  { href: '/cascade', key: 'cascade' },
  { href: '/signals', key: 'signals' },
  { href: '/news-gap', key: 'newsGap' },
  { href: '/about', key: 'about' },
] as const;

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cf-border bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cf-primary/10">
                <LinkIcon className="w-4 h-4 text-cf-primary" />
              </div>
              <span className="text-xl font-heading font-bold text-cf-text-primary tracking-tight">
                Chain<span className="text-cf-primary">Flow</span>
              </span>
            </div>
            <p className="text-sm text-cf-text-secondary leading-relaxed max-w-xs">
              {t('tagline')}
            </p>
            <p className="text-xs text-cf-text-secondary">
              {t('builtBy')}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">Navigation</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                  >
                    {tNav(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">{t('contact')}</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:taeshinkim11@gmail.com"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  taeshinkim11@gmail.com
                </a>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  {t('documentation')}
                </Link>
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
