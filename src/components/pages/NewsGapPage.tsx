'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { type NewsGapEntry } from '@/data/news-gap';
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
  Zap,
  Database,
  ChevronDown,
  ChevronUp,
  Building2,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';

function GapBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'from-red-500 to-amber-500'
    : score >= 60 ? 'from-amber-500 to-yellow-500'
    : score >= 40 ? 'from-yellow-500 to-blue-500'
    : 'from-blue-500 to-green-500';
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

const sectorColors: Record<string, string> = {
  semiconductors: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'ai-cloud': 'bg-blue-50 text-blue-700 border-blue-200',
  'ev-battery': 'bg-green-50 text-green-700 border-green-200',
  defense: 'bg-red-50 text-red-700 border-red-200',
  'pharma-biotech': 'bg-purple-50 text-purple-700 border-purple-200',
};

interface NewsGapPageProps {
  initialEntries: NewsGapEntry[];
  lastUpdated: string;
  source: 'live' | 'cached' | 'static';
  updatedTickers: number;
}

function GapCard({ entry }: { entry: NewsGapEntry }) {
  const [expanded, setExpanded] = useState(false);
  const sectorClass = sectorColors[entry.sector] ?? 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="cf-card overflow-hidden hover:shadow-lg transition-all">
      {/* Collapsed row */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Company */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/company/${entry.ticker}`} className="font-mono font-bold text-cf-primary text-lg hover:underline">
              {entry.ticker}
            </Link>
            {entry.gapScore >= 70 && <AlertTriangle className="w-4 h-4 text-cf-accent flex-shrink-0" />}
          </div>
          <p className="text-sm font-medium text-cf-text-primary">{entry.companyName}</p>
          <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${sectorClass}`}>
            {entry.sector.replace('-', ' / ')}
          </span>
        </div>

        {/* Scores */}
        <div className="lg:col-span-4 space-y-2.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-cf-text-secondary flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 기관 활동</span>
              <span className="font-bold text-cf-primary">{entry.ibActivityScore}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-cf-primary" style={{ width: `${entry.ibActivityScore}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-cf-text-secondary flex items-center gap-1"><Newspaper className="w-3 h-3" /> 미디어 보도</span>
              <span className="font-bold text-cf-text-primary">{entry.mediaScore}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-cf-text-secondary" style={{ width: `${entry.mediaScore}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-cf-text-secondary flex items-center gap-1 font-bold"><Eye className="w-3 h-3" /> 갭 점수</span>
              <span className={`font-bold text-lg ${entry.gapScore >= 70 ? 'text-cf-accent' : entry.gapScore >= 40 ? 'text-cf-primary' : 'text-cf-success'}`}>
                {entry.gapScore}
              </span>
            </div>
            <GapBar score={entry.gapScore} />
          </div>
        </div>

        {/* Preview: top article + top IB action */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-bold text-cf-text-secondary uppercase tracking-wider mb-1.5">미디어 보도</p>
            {entry.recentArticles[0] ? (
              <div>
                <p className="text-cf-text-secondary leading-relaxed mb-1">
                  &quot;{entry.recentArticles[0].title}&quot;
                </p>
                <span className="inline-flex items-center gap-1 text-cf-text-muted">
                  <Calendar className="w-3 h-3" />
                  {entry.recentArticles[0].date}
                  {entry.recentArticles[0].source && (
                    <span className="text-gray-400">· {entry.recentArticles[0].source}</span>
                  )}
                </span>
              </div>
            ) : (
              <p className="text-cf-text-secondary italic">최소 보도</p>
            )}
          </div>
          <div>
            <p className="font-bold text-cf-primary uppercase tracking-wider mb-1.5">기관 행동</p>
            <p className="text-cf-text-primary leading-relaxed">{entry.ibActions[0]}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <div className="lg:col-span-1 flex justify-end">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-cf-text-secondary hover:text-cf-primary transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-cf-border/50 bg-gray-50/60 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 미디어 보도 전체 */}
          <div>
            <h4 className="text-xs font-bold text-cf-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> 미디어 보도 전체
            </h4>
            {entry.recentArticles.length === 0 ? (
              <p className="text-xs text-cf-text-secondary italic">최근 30일 보도 없음 — 강한 침묵 신호</p>
            ) : (
              <div className="space-y-3">
                {entry.recentArticles.map((article, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-cf-border/50">
                    {article.url ? (
                      <a href={article.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-cf-text-primary hover:text-cf-primary flex items-start gap-1 leading-relaxed">
                        &quot;{article.title}&quot;
                        <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      </a>
                    ) : (
                      <p className="text-xs font-medium text-cf-text-primary leading-relaxed">&quot;{article.title}&quot;</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 text-cf-text-muted text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{article.date}</span>
                      {article.source && <><span className="text-gray-300">·</span><span>{article.source}</span></>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 기관 행동 전체 */}
          <div>
            <h4 className="text-xs font-bold text-cf-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> 기관 행동 전체
            </h4>
            <div className="space-y-2">
              {entry.ibActions.map((action, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-cf-border/50 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cf-primary/10 text-cf-primary text-xs font-bold flex-shrink-0 flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-cf-text-primary leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 기관 & 요약 */}
          <div>
            <h4 className="text-xs font-bold text-cf-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> 주요 보유 기관
            </h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {entry.topInstitutions.map((inst) => (
                <span key={inst} className="text-xs px-2.5 py-1 rounded-full bg-white border border-cf-border text-cf-text-secondary font-medium">
                  {inst}
                </span>
              ))}
            </div>

            <div className="bg-white rounded-lg p-3 border border-cf-border/50">
              <p className="text-xs font-bold text-cf-text-primary mb-2">왜 주목받는가?</p>
              <div className="space-y-1.5 text-xs text-cf-text-secondary">
                <div className="flex justify-between">
                  <span>기관 활동 수준</span>
                  <span className={`font-bold ${entry.ibActivityLevel === 'high' ? 'text-cf-primary' : 'text-cf-text-secondary'}`}>
                    {entry.ibActivityLevel === 'high' ? '높음 🔥' : entry.ibActivityLevel === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>미디어 커버리지</span>
                  <span className={`font-bold ${entry.mediaScore <= 20 ? 'text-cf-accent' : 'text-cf-text-secondary'}`}>
                    {entry.mediaScore <= 20 ? '거의 없음 ⚡' : entry.mediaScore <= 50 ? '낮음' : '보통'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>갭 점수</span>
                  <span className={`font-bold text-sm ${entry.gapScore >= 70 ? 'text-cf-accent' : 'text-cf-primary'}`}>
                    {entry.gapScore} / 100
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewsGapPage({
  initialEntries,
  lastUpdated,
  source,
  updatedTickers,
}: NewsGapPageProps) {
  const t = useTranslations('newsGap');
  const [sortBy, setSortBy] = useState<'gap' | 'ib' | 'media'>('gap');

  const sorted = useMemo(() => {
    const copy = [...initialEntries];
    if (sortBy === 'gap') copy.sort((a, b) => b.gapScore - a.gapScore);
    else if (sortBy === 'ib') copy.sort((a, b) => b.ibActivityScore - a.ibActivityScore);
    else copy.sort((a, b) => a.mediaScore - b.mediaScore);
    return copy;
  }, [sortBy, initialEntries]);

  const scatterData = initialEntries.map((d) => ({
    x: d.mediaScore,
    y: d.ibActivityScore,
    z: d.gapScore,
    ticker: d.ticker,
    name: d.companyName,
    isSignal: d.gapScore >= 60,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: (typeof scatterData)[0] }> }) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-cf-border text-sm">
        <p className="font-bold text-cf-text-primary">{data.ticker} — {data.name}</p>
        <p className="text-cf-text-secondary">Media: {data.x} | IB: {data.y}</p>
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
        <div className="flex justify-center items-center gap-3 mb-4 flex-wrap">
          <ShareButtons title="News Gap Analyzer - The Silence IS the Signal | ChainFlow" />
          {source === 'cached' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium border border-blue-200">
              <Database className="w-3.5 h-3.5" />{updatedTickers} tickers live
            </div>
          ) : source === 'live' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
              <Zap className="w-3.5 h-3.5" />Live — {updatedTickers} tickers refreshed
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
              <Database className="w-3.5 h-3.5" />Static data
            </div>
          )}
          <span className="text-xs text-cf-text-muted">
            {new Date(lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-lg text-cf-text-secondary max-w-2xl mx-auto">{t('heroExplanation')}</p>
      </div>

      {/* Scatter Plot */}
      <div className="cf-card p-6 mb-8">
        <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-2">{t('ibVsMedia')}</h2>
        <p className="text-sm text-cf-text-secondary mb-6">
          {t.rich('ibVsMediaDesc', { accent: (chunks) => <span className="font-bold text-cf-accent">{chunks}</span> })}
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 40, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" dataKey="x" name="Media Coverage" domain={[0, 100]} tick={{ fontSize: 11 }}
                label={{ value: 'Media Coverage Score', position: 'insideBottom', offset: -10, style: { fontSize: 12, fill: '#6B7B8D' } }} />
              <YAxis type="number" dataKey="y" name="IB Activity" domain={[0, 100]} tick={{ fontSize: 11 }}
                label={{ value: 'IB Activity Score', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: '#6B7B8D' } }} />
              <ZAxis type="number" dataKey="z" range={[60, 300]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData} fill="#4F8FBF">
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.isSignal ? '#E8A945' : '#4F8FBF'} opacity={0.85} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs text-cf-text-secondary justify-center">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cf-accent" />{t('highGapSignal')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cf-primary" />{t('normal')}</span>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm font-medium text-cf-text-secondary">{t('sortBy')}:</span>
        {[
          { key: 'gap' as const, label: t('gapScore') },
          { key: 'ib' as const, label: t('ibActivity') },
          { key: 'media' as const, label: t('mediaLowFirst') },
        ].map((opt) => (
          <button key={opt.key} onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === opt.key ? 'bg-cf-primary text-white' : 'bg-white text-cf-text-secondary border border-gray-200 hover:bg-gray-50'
            }`}>
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-cf-text-muted">카드를 클릭해서 펼쳐보세요 ↓</span>
      </div>

      {/* Gap Cards */}
      <div className="space-y-3 mb-12">
        {sorted.map((entry) => (
          <GapCard key={entry.ticker} entry={entry} />
        ))}
      </div>

      {/* Explanation */}
      <div className="cf-card p-8 border-l-4 border-cf-accent">
        <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-4">{t('howNewsGapWorks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-cf-text-secondary leading-relaxed">
          <div>
            <h3 className="font-bold text-cf-text-primary mb-2">{t('theTheory')}</h3>
            <p>{t('theTheoryText')}</p>
          </div>
          <div>
            <h3 className="font-bold text-cf-text-primary mb-2">{t('whySilenceMatters')}</h3>
            <p>{t('whySilenceMattersText')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
