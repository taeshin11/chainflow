'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { trackEvent } from '@/utils/collect';

export default function EmailCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    await trackEvent('email_subscribe', { email });
    setSubmitted(true);
    setEmail('');
  };

  if (submitted) {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="cf-card p-8 bg-gradient-to-r from-cf-primary/5 to-cf-secondary/5 border-cf-primary/20 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cf-success/10 mb-4">
            <Check className="w-6 h-6 text-cf-success" />
          </div>
          <h3 className="text-lg font-heading font-bold text-cf-text-primary mb-2">
            You are subscribed!
          </h3>
          <p className="text-sm text-cf-text-secondary">
            We will send you weekly supply chain insights. Stay tuned.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="cf-card p-8 bg-gradient-to-r from-cf-primary/5 to-cf-secondary/5 border-cf-primary/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-cf-primary" />
              <h3 className="text-lg font-heading font-bold text-cf-text-primary">
                Get Weekly Supply Chain Insights
              </h3>
            </div>
            <p className="text-sm text-cf-text-secondary">
              Institutional flow signals, cascade alerts, and news gap analysis delivered to your inbox every Monday.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-64">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="cf-input w-full"
              />
              {error && <p className="text-xs text-cf-danger mt-1">{error}</p>}
            </div>
            <button type="submit" className="cf-btn-primary gap-2 flex-shrink-0">
              Subscribe
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
