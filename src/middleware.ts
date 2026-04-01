import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|ko|ja|zh-CN|zh-TW|es|de|fr|pt|hi|ar|vi|th|id|ru|tr)/:path*']
};
