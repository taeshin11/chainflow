import { Link } from '@/i18n/routing';
import { Link as LinkIcon, Mail } from 'lucide-react';

export default function Footer() {
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
                Chain<span className="text-cf-primary">Flow</span>
              </span>
            </div>
            <p className="text-sm text-cf-text-secondary leading-relaxed max-w-xs">
              Mapping the world&apos;s supply chains, one connection at a time.
            </p>
            <p className="text-xs text-cf-text-secondary">
              Built with care by SPINAI
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/explore"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  Explore
                </Link>
              </li>
              <li>
                <Link
                  href="/cascade"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  Cascade
                </Link>
              </li>
              <li>
                <Link
                  href="/signals"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  Signals
                </Link>
              </li>
              <li>
                <Link
                  href="/news-gap"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  News Gap
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-use"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  How to Use
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-use#faq"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-cf-text-primary mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="mailto:taeshinkim11@gmail.com"
                  className="text-sm text-cf-text-secondary hover:text-cf-primary transition-colors duration-200 flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-cf-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-cf-text-secondary">
              &copy; {year} ChainFlow by SPINAI. All rights reserved.
            </p>
            <p className="text-xs text-cf-text-secondary text-center max-w-xl leading-relaxed">
              ChainFlow provides supply chain data for informational purposes only. It does not
              constitute financial advice. Always conduct your own research before making investment
              decisions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
