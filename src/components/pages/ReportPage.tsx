'use client';

import { useState, useEffect, useCallback } from 'react';

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

const TF_LABELS: Record<Timeframe, string> = {
  '1w': '1주',
  '4w': '4주',
  '13w': '13주',
};

const SECTION_CONFIG = [
  { key: 'market' as const, label: '글로벌 시장', icon: '📊', color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
  { key: 'capital' as const, label: '자본 흐름', icon: '💰', color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
  { key: 'company' as const, label: '기업 신호', icon: '🏢', color: 'from-violet-500/10 to-violet-600/5 border-violet-500/20' },
  { key: 'signals' as const, label: '기관 시그널', icon: '📡', color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
];

export default function ReportPage() {
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
      setExpanded({});
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
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0d1220]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">AI 리포트</h1>
            <p className="text-xs text-gray-500 mt-0.5">글로벌 자금 흐름 · 기관 시그널 · 기업 분석</p>
          </div>
          <button
            onClick={() => fetchBrief(tf)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            <span className={loading ? 'animate-spin' : ''}>↻</span>
            새로고침
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Timeframe selector */}
        <div className="flex gap-2 mb-8">
          {(Object.keys(TF_LABELS) as Timeframe[]).map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tf === t
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {TF_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">AI 리포트 생성 중...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchBrief(tf)}
              className="mt-3 text-xs text-red-400/70 hover:text-red-400 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && data && (
          <>
            {/* Meta */}
            <div className="flex items-center gap-3 mb-6 text-xs text-gray-600">
              <span>생성: {new Date(data.generatedAt).toLocaleString('ko-KR')}</span>
              <span>·</span>
              <span className="text-gray-500">{data.source || 'AI'}</span>
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
                    className={`rounded-xl border bg-gradient-to-br ${color} p-5 cursor-pointer transition-all hover:border-white/20`}
                    onClick={() => toggleSection(key)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="text-sm font-semibold text-white/90">{label}</span>
                      </div>
                      <span className="text-gray-600 text-sm transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </div>
                    <p className="text-sm text-gray-400 font-medium mb-3">{section.title}</p>
                    {isOpen && section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-1.5 mt-3 border-t border-white/5 pt-3">
                        {section.bullets.map((b, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-400">
                            <span className="text-gray-600 mt-0.5 shrink-0">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {!isOpen && (
                      <p className="text-xs text-gray-600 mt-1">클릭하여 상세 보기</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Outlook bar */}
            {data.outlook && (
              <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-violet-600/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🔮</span>
                  <span className="text-sm font-semibold text-violet-300">AI 전망</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{data.outlook}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
