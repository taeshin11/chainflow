'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { newsGapData, type NewsGapEntry } from '@/data/news-gap';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  TrendingUp,
  Newspaper,
  ArrowRight,
  Search,
} from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';

function GapBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'from-red-500 to-amber-500';
    if (score >= 60) return 'from-amber-500 to-yellow-500';
    if (score >= 40) return 'from-yellow-500 to-blue-500';
    return 'from-blue-500 to-green-500';
  };

  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function NewsGapPage() {
  const t = useTranslations('newsGap');
  const [sortBy, setSortBy] = useState<'gap' | 'ib' | 'media'>('gap');

  const sorted = useMemo(() => {
    const copy = [...newsGapData];
    if (sortBy === 'gap') copy.sort((a, b) => b.gapScore - a.gapScore);
    else if (sortBy === 'ib') copy.sort((a, b) => b.ibActivityScore - a.ibActivityScore);
    else copy.sort((a, b) => a.mediaScore - b.mediaScore);
    return copy;
  }, [sortBy]);

  const scatterData = newsGapData.map((d) => ({
    x: d.mediaScore,
    y: d.ibActivityScore,
    z: d.gapScore,
    ticker: d.ticker,
    name: d.companyName,
    isSignal: d.gapScore >= 60,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof scatterData[0] }> }) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-cf-border text-sm">
        <p className="font-bold text-cf-text-primary">
          {data.ticker} - {data.name}
        </p>
        <p className="text-cf-text-secondary">
          Media: {data.x} | IB Activity: {data.y}
        </p>
        <p className="font-medium" style={{ color: data.isSignal ? '#E8A945' : '#6B7B8D' }}>
          Gap Score: {data.z}
        </p>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cf-accent/10 text-cf-accent text-sm font-medium mb-4">
          <EyeOff className="w-4 h-4" />
          {t('title')}
        </div>
        <h1 className="text-4xl font-heading font-bold text-cf-text-primary mb-4">
          {t.rich('silenceIsSignal', { accent: (chunks) => <span className="text-cf-accent">{chunks}</span> })}
        </h1>
        <div className="flex justify-center mb-4">
          <ShareButtons title="News Gap Analyzer - The Silence IS the Signal | ChainFlow" />
        </div>
        <p className="text-lg text-cf-text-secondary max-w-2xl mx-auto">
          {t('heroExplanation')}
        </p>
      </div>

      {/* Scatter Plot */}
      <div className="cf-card p-6 mb-8">
        <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-2">
          {t('ibVsMedia')}
        </h2>
        <p className="text-sm text-cf-text-secondary mb-6">
          {t.rich('ibVsMediaDesc', { accent: (chunks) => <span className="font-bold text-cf-accent">{chunks}</span> })}
        </p>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                type="number"
                dataKey="x"
                name="Media Coverage"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Media Coverage Score',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fontSize: 12, fill: '#6B7B8D' },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="IB Activity"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{
                  value: 'IB Activity Score',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  style: { fontSize: 12, fill: '#6B7B8D' },
                }}
              />
              <ZAxis type="number" dataKey="z" range={[80, 400]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData} fill="#4F8FBF">
                {scatterData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.isSignal ? '#E8A945' : '#4F8FBF'}
                    stroke={entry.isSignal ? '#D97171' : '#4F8FBF'}
                    strokeWidth={entry.isSignal ? 2 : 1}
                    opacity={0.85}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-4 text-xs text-cf-text-secondary justify-center">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cf-accent" />
            {t('highGapSignal')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cf-primary" />
            {t('normal')}
          </span>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium text-cf-text-secondary">{t('sortBy')}:</span>
        {[
          { key: 'gap' as const, label: t('gapScore') },
          { key: 'ib' as const, label: t('ibActivity') },
          { key: 'media' as const, label: t('mediaLowFirst') },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === opt.key
                ? 'bg-cf-primary text-white'
                : 'bg-white text-cf-text-secondary border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Gap Cards */}
      <div className="space-y-4 mb-12">
        {sorted.map((entry) => (
          <div key={entry.ticker} className="cf-card p-6 hover:shadow-lg transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Company info */}
              <div className="lg:col-span-3">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/company/${entry.ticker}`}
                    className="font-mono font-bold text-cf-primary text-lg hover:underline"
                  >
                    {entry.ticker}
                  </Link>
                  {entry.gapScore >= 70 && (
                    <AlertTriangle className="w-4 h-4 text-cf-accent" />
                  )}
                </div>
                <p className="text-sm text-cf-text-primary font-medium">{entry.companyName}</p>
                <p className="text-xs text-cf-text-secondary capitalize mt-1">
                  {entry.sector.replace('-', ' / ')}
                </p>
              </div>

              {/* Center: Scores */}
              <div className="lg:col-span-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cf-text-secondary flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {t('ibActivity')}
                      </span>
                      <span className="font-bold text-cf-primary">{entry.ibActivityScore}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cf-primary"
                        style={{ width: `${entry.ibActivityScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cf-text-secondary flex items-center gap-1">
                        <Newspaper className="w-3 h-3" />
                        {t('mediaCoverage')}
                      </span>
                      <span className="font-bold text-cf-text-primary">{entry.mediaScore}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cf-text-secondary"
                        style={{ width: `${entry.mediaScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cf-text-secondary font-bold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {t('gapScore')}
                      </span>
                      <span
                        className={`font-bold text-lg ${
                          entry.gapScore >= 70
                            ? 'text-cf-accent'
                            : entry.gapScore >= 40
                            ? 'text-cf-primary'
                            : 'text-cf-success'
                        }`}
                      >
                        {entry.gapScore}
                      </span>
                    </div>
                    <GapBar score={entry.gapScore} />
                  </div>
                </div>
              </div>

              {/* Right: Headlines vs IB Actions */}
              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-cf-text-secondary uppercase tracking-wider mb-2">
                      {t('mediaSays')}
                    </p>
                    {entry.recentHeadlines.slice(0, 2).map((h, i) => (
                      <p
                        key={i}
                        className="text-xs text-cf-text-secondary mb-1.5 leading-relaxed"
                      >
                        &quot;{h}&quot;
                      </p>
                    ))}
                    {entry.recentHeadlines.length === 0 && (
                      <p className="text-xs text-cf-text-secondary italic">{t('minimalCoverage')}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cf-primary uppercase tracking-wider mb-2">
                      {t('ibsAreDoing')}
                    </p>
                    {entry.ibActions.slice(0, 2).map((a, i) => (
                      <p key={i} className="text-xs text-cf-text-primary mb-1.5 leading-relaxed">
                        {a}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Explanation */}
      <div className="cf-card p-8 border-l-4 border-cf-accent">
        <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-4">
          {t('howNewsGapWorks')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-cf-text-secondary leading-relaxed">
          <div>
            <h3 className="font-bold text-cf-text-primary mb-2">{t('theTheory')}</h3>
            <p>
              {t('theTheoryText')}
            </p>
          </div>
          <div>
            <h3 className="font-bold text-cf-text-primary mb-2">{t('whySilenceMatters')}</h3>
            <p>
              {t('whySilenceMattersText')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
