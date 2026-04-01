'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Search, X } from 'lucide-react';

interface Company {
  name: string;
  ticker: string;
  sector?: string;
}

interface SearchBarProps {
  companies: Company[];
  className?: string;
}

export default function SearchBar({ companies, className = '' }: SearchBarProps) {
  const t = useTranslations('explore');
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query.trim().length > 0
    ? companies.filter((c) => {
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q);
      }).slice(0, 8)
    : [];

  const handleSelect = useCallback((company: Company) => {
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(`/company/${company.ticker}`);
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          handleSelect(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  useEffect(() => {
    setIsOpen(query.trim().length > 0);
    setActiveIndex(-1);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`relative w-full max-w-xl ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cf-text-secondary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          placeholder={t('searchPlaceholder')}
          className="cf-input pl-10 pr-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-item-${activeIndex}` : undefined}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cf-text-secondary hover:text-cf-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-cf-border overflow-hidden z-30 animate-scale-in">
          {filtered.length > 0 ? (
            <ul ref={listRef} role="listbox" className="py-1 max-h-64 overflow-y-auto">
              {filtered.map((company, index) => (
                <li
                  key={company.ticker}
                  id={`search-item-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(company)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors duration-150
                    ${index === activeIndex ? 'bg-cf-primary/5' : 'hover:bg-gray-50'}`}
                >
                  <div>
                    <p className="text-sm font-medium text-cf-text-primary">{company.name}</p>
                    {company.sector && (
                      <p className="text-xs text-cf-text-secondary">{company.sector}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-medium text-cf-primary bg-cf-primary/10 px-2 py-0.5 rounded">
                    {company.ticker}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-cf-text-secondary">{t('noResults')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
