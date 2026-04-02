'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

const translationCache = new Map<string, string>();

export function useTranslatedText(text: string | undefined): string {
  const locale = useLocale();
  const [translated, setTranslated] = useState(text || '');

  useEffect(() => {
    if (!text || locale === 'en') {
      setTranslated(text || '');
      return;
    }

    const cacheKey = `${locale}:${text.substring(0, 50)}`;
    if (translationCache.has(cacheKey)) {
      setTranslated(translationCache.get(cacheKey)!);
      return;
    }

    // Translate
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLocale: locale }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.translated) {
          translationCache.set(cacheKey, data.translated);
          setTranslated(data.translated);
        }
      })
      .catch(() => setTranslated(text));
  }, [text, locale]);

  return translated;
}

// Batch translate multiple strings at once
export function useTranslatedTexts(texts: Record<string, string>): Record<string, string> {
  const locale = useLocale();
  const [translated, setTranslated] = useState(texts);

  useEffect(() => {
    if (locale === 'en') {
      setTranslated(texts);
      return;
    }

    const toTranslate: Record<string, string> = {};
    const cached: Record<string, string> = {};

    for (const [key, text] of Object.entries(texts)) {
      const cacheKey = `${locale}:${text.substring(0, 50)}`;
      if (translationCache.has(cacheKey)) {
        cached[key] = translationCache.get(cacheKey)!;
      } else {
        toTranslate[key] = text;
      }
    }

    if (Object.keys(toTranslate).length === 0) {
      setTranslated({ ...texts, ...cached });
      return;
    }

    // Batch translate
    const combinedText = Object.entries(toTranslate)
      .map(([key, text]) => `[${key}]: ${text}`)
      .join('\n---\n');

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: combinedText, targetLocale: locale }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.translated) {
          // Parse back
          const parts = data.translated.split('\n---\n');
          const result: Record<string, string> = { ...cached };
          const keys = Object.keys(toTranslate);
          parts.forEach((part: string, i: number) => {
            const cleaned = part.replace(/^\[.*?\]:\s*/, '').trim();
            if (keys[i]) {
              result[keys[i]] = cleaned;
              translationCache.set(`${locale}:${toTranslate[keys[i]].substring(0, 50)}`, cleaned);
            }
          });
          setTranslated({ ...texts, ...result });
        }
      })
      .catch(() => setTranslated(texts));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, JSON.stringify(texts)]);

  return translated;
}
