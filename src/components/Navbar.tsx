'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Menu, X, Link as LinkIcon, MessageCircle } from 'lucide-react';

const navLinks = [
  { href: '/explore', key: 'explore' },
  { href: '/cascade', key: 'cascade' },
  { href: '/signals', key: 'signals' },
  { href: '/news-gap', key: 'newsGap' },
  { href: '/about', key: 'about' },
] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'glass shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cf-primary/10 group-hover:bg-cf-primary/20 transition-colors duration-200">
                <LinkIcon className="w-4 h-4 text-cf-primary" />
              </div>
              <span className="text-xl font-heading font-bold text-cf-text-primary tracking-tight">
                Flow<span className="text-cf-primary">vium</span>
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-cf-text-secondary
                             hover:text-cf-text-primary hover:bg-cf-primary/5
                             transition-all duration-200"
                >
                  {t(link.key)}
                </Link>
              ))}
              <a
                href="mailto:taeshinkim11@gmail.com"
                className="px-3 py-2 rounded-lg text-xs font-medium text-cf-text-secondary/70
                           hover:text-cf-primary hover:bg-cf-primary/5
                           transition-all duration-200 flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                {t('feedback')}
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg
                         text-cf-text-secondary hover:text-cf-text-primary hover:bg-cf-primary/5
                         transition-all duration-200"
              aria-label={isOpen ? t('close') : t('menu')}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl
                     transform transition-transform duration-300 ease-out md:hidden
                     ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-cf-border">
          <span className="text-lg font-heading font-bold text-cf-text-primary">
            Flow<span className="text-cf-primary">vium</span>
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-10 h-10 rounded-lg
                       text-cf-text-secondary hover:text-cf-text-primary hover:bg-cf-primary/5
                       transition-all duration-200"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 rounded-lg text-sm font-medium text-cf-text-secondary
                         hover:text-cf-text-primary hover:bg-cf-primary/5
                         transition-all duration-200"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
