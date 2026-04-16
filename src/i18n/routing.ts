import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'ko', 'ja', 'zh-CN', 'zh-TW', 'es', 'de', 'fr', 'pt', 'hi', 'ar', 'vi', 'th', 'id', 'ru', 'tr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // Auto-detect browser language from Accept-Language header on first visit
  localeDetection: true,
});

export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);
