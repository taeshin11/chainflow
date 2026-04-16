'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

type Timeframe = '1w' | '4w' | '13w';

interface Section {
  title: string;
  bullets: string[];
}

interface BriefData {
  generatedAt: string;
  timeframe: Timeframe;
  market: Section;
  capital: Section;
  company: Section;
  signals: Section;
  outlook: string;
  source: string;
}

export default function ReportPage() {
  const t = useTranslations('report');

  const TF_LABELS: Record<Timeframe, string> = {
    '1w': t('week1'),
    '4w': t('week4'),
    '13w': t('week13'),
  };

  const SECTION_CONFIG = [
    { key: 'market' as const, label: t('sectionMarket'), icon: '📊', color: 'bg-blue-50 border-blue-200' },
    { key: 'capital' as const, label: t('sectionCapital'), icon: '💰', color: 'bg-emerald-50 border-emerald-200' },
    { key: 'company' as const, label: t('sectionCompany'), icon: '🏢', color: 'bg-violet-50 border-violet-200' },
    { key: 'signals' as const, label: t('sectionSignals'), icon: '📡', color: 'bg-amber-50 border-amber-200' },
  ];

  const [tf, setTf] = useState<Timeframe>('1w');
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchBrief = useCallback(async (timeframe: Timeframe) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-brief?tf=${timeframe}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      // Auto-expand all sections
      setExpanded({ market: true, capital: true, company: true, signals: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrief(tf);
  }, [tf, fetchBrief]);

  const toggleSection = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => fetchBrief(tf)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 bg-white"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
            {t('refresh')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Timeframe selector */}
        <div className="flex gap-2 mb-8">
          {(Object.keys(TF_LABELS) as Timeframe[]).map(key => (
            <button
              key={key}
              onClick={() => setTf(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tf === key
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              {TF_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{t('loading')}</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => fetchBrief(tf)}
              className="mt-3 text-xs text-red-500 hover:text-red-700 underline"
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && data && (
          <>
            {/* Meta */}
            <div className="flex items-center gap-3 mb-6 text-xs text-gray-400">
              <span>{t('generatedAt').replace('{date}', new Date(data.generatedAt).toLocaleString())}</span>
              <span>·</span>
              <span>{data.source || 'AI'}</span>
            </div>

            {/* Section grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {SECTION_CONFIG.map(({ key, label, icon, color }) => {
                const section = data[key] as Section | undefined;
                if (!section) return null;
                const isOpen = expanded[key];
                return (
                  <div
                    key={key}
                    className={`rounded-xl border ${color} p-5 cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => toggleSection(key)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm font-semibold text-gray-800">{label}</span>
                      </div>
                      <span className="text-gray-400 text-sm transition-transform inline-block" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mb-2">{section.title}</p>
                    {isOpen && section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-2 mt-3 border-t border-gray-200 pt-3">
                        {section.bullets.map((b, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isOpen && (
                      <p className="text-xs text-gray-400 mt-1">{t('collapse')}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Outlook bar */}
            {data.outlook && (
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🔮</span>
                  <span className="text-sm font-semibold text-violet-700">{t('aiOutlook')}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{data.outlook}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
