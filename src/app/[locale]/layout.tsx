import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/Navbar';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <footer className="border-t border-cf-border bg-white py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-cf-text-secondary">
          <p className="font-heading font-bold text-cf-text-primary mb-2">
            Chain<span className="text-cf-primary">Flow</span>
          </p>
          <p className="mb-4">Mapping the world&apos;s supply chains, one connection at a time.</p>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} ChainFlow by SPINAI. All rights reserved.
          </p>
          <p className="text-xs mt-2 max-w-2xl mx-auto opacity-70">
            ChainFlow provides supply chain data for informational purposes only. It does not
            constitute financial advice. Always conduct your own research before making investment
            decisions.
          </p>
        </div>
      </footer>
    </NextIntlClientProvider>
  );
}
