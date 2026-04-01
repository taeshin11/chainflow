'use client';

import { useTranslations } from 'next-intl';
import { Mail, ExternalLink, Shield, Eye, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-heading font-bold text-cf-text-primary mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-cf-text-secondary max-w-2xl mx-auto">
          Supply chain intelligence for the modern investor
        </p>
      </div>

      {/* Mission */}
      <section className="cf-card p-8 mb-8">
        <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-4">
          {t('mission')}
        </h2>
        <p className="text-cf-text-secondary leading-relaxed">{t('missionText')}</p>
      </section>

      {/* Story */}
      <section className="cf-card p-8 mb-8">
        <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-4">
          {t('story')}
        </h2>
        <p className="text-cf-text-secondary leading-relaxed">{t('storyText')}</p>
      </section>

      {/* Values */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-6 text-center">
          {t('values')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="cf-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-cf-primary/10 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-cf-primary" />
            </div>
            <h3 className="font-heading font-bold text-cf-text-primary mb-2">
              {t('valuesTransparency')}
            </h3>
            <p className="text-sm text-cf-text-secondary">{t('valuesTransparencyText')}</p>
          </div>
          <div className="cf-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-cf-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-cf-secondary" />
            </div>
            <h3 className="font-heading font-bold text-cf-text-primary mb-2">
              {t('valuesAccuracy')}
            </h3>
            <p className="text-sm text-cf-text-secondary">{t('valuesAccuracyText')}</p>
          </div>
          <div className="cf-card p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-cf-accent/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-cf-accent" />
            </div>
            <h3 className="font-heading font-bold text-cf-text-primary mb-2">
              {t('valuesAccessibility')}
            </h3>
            <p className="text-sm text-cf-text-secondary">{t('valuesAccessibilityText')}</p>
          </div>
        </div>
      </section>

      {/* About SPINAI */}
      <section className="cf-card p-8 mb-8">
        <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-4">
          About SPINAI
        </h2>
        <p className="text-cf-text-secondary leading-relaxed">
          SPINAI is a technology company focused on building AI-powered tools that democratize
          access to institutional-grade financial intelligence. We believe that supply chain
          transparency and investment signal detection should not be exclusive to hedge funds and
          investment banks. ChainFlow is our flagship product, combining alternative data
          analysis, supply chain mapping, and AI-driven insights to level the playing field for
          all investors.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="cf-card p-8 mb-8 border-l-4 border-cf-accent">
        <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-4">
          Disclaimer
        </h2>
        <p className="text-cf-text-secondary leading-relaxed text-sm">
          ChainFlow provides supply chain data and institutional flow analysis for informational
          and educational purposes only. Nothing on this platform constitutes financial advice,
          investment advice, trading advice, or any other sort of advice. You should not treat any
          of the content as such. ChainFlow does not recommend that any securities, transactions,
          or investment strategies are suitable for any specific person. The data presented may
          contain inaccuracies or be delayed. Always conduct your own research and consult with a
          licensed financial advisor before making any investment decisions.
        </p>
      </section>

      {/* Contact */}
      <section className="cf-card p-8">
        <h2 className="text-2xl font-heading font-bold text-cf-text-primary mb-6">
          {t('contact')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-cf-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-cf-primary" />
            </div>
            <div>
              <h3 className="font-medium text-cf-text-primary mb-1">Feedback & Suggestions</h3>
              <a
                href="mailto:taeshinkim11@gmail.com"
                className="text-cf-primary hover:underline flex items-center gap-1 text-sm"
              >
                <Mail className="w-4 h-4" />
                taeshinkim11@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-cf-accent/10 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-cf-accent" />
            </div>
            <div>
              <h3 className="font-medium text-cf-text-primary mb-1">Business Inquiries</h3>
              <a
                href="mailto:spinaiceo@gmail.com"
                className="text-cf-primary hover:underline flex items-center gap-1 text-sm"
              >
                <Mail className="w-4 h-4" />
                spinaiceo@gmail.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
