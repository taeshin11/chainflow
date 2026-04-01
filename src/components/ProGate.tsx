'use client';

import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';

interface ProGateProps {
  feature?: string;
  children?: React.ReactNode;
}

export default function ProGate({ feature, children }: ProGateProps) {
  const t = useTranslations('pro');

  return (
    <div className="relative">
      {/* Blurred content behind the gate */}
      {children && (
        <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
        <div className="flex flex-col items-center text-center px-6 py-8 max-w-sm animate-fade-in-up">
          {/* Lock icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-cf-accent/10 mb-4">
            <Lock className="w-6 h-6 text-cf-accent" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-heading font-semibold text-cf-text-primary mb-2">
            {t('upgradeTitle')}
          </h3>

          {/* Description */}
          <p className="text-sm text-cf-text-secondary leading-relaxed mb-4">
            {feature || t('upgradeDescription')}
          </p>

          {/* Coming Soon badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                          bg-cf-accent/10 text-cf-accent text-xs font-semibold">
            {t('upgradeCta')}
            <span className="ml-1 px-2 py-0.5 rounded-full bg-cf-accent/20 text-[10px] uppercase tracking-wider">
              Coming Soon
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
