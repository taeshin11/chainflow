'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { macroNarratives, type MacroNarrative } from '@/data/macro-narratives';
import {
  fearGreedByCountry,
  fearGreedByAsset,
  moneyFlowSectors,
  getLevel,
  levelLabels,
  type FearGreedEntry,
  type MoneyFlowSector,
} from '@/data/fear-greed';
import {
  Brain,
  Send,
  Loader2,
  BookOpen,
  Tag,
  ArrowRight,
  Scale,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw,
  Shield,
  Radar,
  Globe,
  Zap,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

// ── Icon map for narratives ───────────────────────────────────────────────────
const iconMap: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Eye: <Eye className="w-5 h-5" />,
  RefreshCw: <RefreshCw className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Radar: <Radar className="w-5 h-5" />,
  Globe: <Globe className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
};

const categoryColorMap: Record<string, string> = {
  'power-structure': 'bg-red-50 text-red-700 border-red-200',
  monetary: 'bg-blue-50 text-blue-700 border-blue-200',
  geopolitical: 'bg-teal-50 text-teal-700 border-teal-200',
  information: 'bg-purple-50 text-purple-700 border-purple-200',
  regulatory: 'bg-amber-50 text-amber-700 border-amber-200',
};

function categoryLabel(cat: MacroNarrative['category'], t: ReturnType<typeof useTranslations<'intelligence'>>): string {
  const map: Record<MacroNarrative['category'], string> = {
    'power-structure': t('categoryPower'),
    monetary: t('categoryMonetary'),
    geopolitical: t('categoryGeopolitical'),
    information: t('categoryInformation'),
    regulatory: t('categoryRegulatory'),
  };
  return map[cat];
}

// ── Fear & Greed Gauge ────────────────────────────────────────────────────────
function FearGreedGauge({ score }: { score: number }) {
  const level = getLevel(score);
  const pct = score / 100;
  // Arc: 0° = left (extreme fear) → 180° = right (extreme greed)
  const angle = -180 + pct * 180; // degrees from 12-o-clock perspective
  const rad = (angle * Math.PI) / 180;
  const cx = 60, cy = 60, r = 44;
  const needleX = cx + r * Math.sin(rad);
  const needleY = cy - r * Math.cos(rad);

  const gradColors = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#059669'];
  const segCount = gradColors.length;

  return (
    <svg viewBox="0 0 120 82" className="w-full max-w-[110px]">
      {/* Arc segments */}
      {gradColors.map((color, i) => {
        const startAngle = (i / segCount) * Math.PI;
        const endAngle = ((i + 1) / segCount) * Math.PI;
        const x1 = cx + r * Math.cos(Math.PI + startAngle);
        const y1 = cy + r * Math.sin(Math.PI + startAngle);
        const x2 = cx + r * Math.cos(Math.PI + endAngle);
        const y2 = cy + r * Math.sin(Math.PI + endAngle);
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="butt"
            opacity={0.85}
          />
        );
      })}
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#1e293b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="3.5" fill="#1e293b" />
      {/* Score */}
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">
        {score}
      </text>
    </svg>
  );
}

function FearGreedCard({ entry }: { entry: FearGreedEntry }) {
  const level = getLevel(entry.score);
  const meta = levelLabels[level];
  const delta = entry.prevScore !== undefined ? entry.score - entry.prevScore : 0;

  return (
    <div className={`cf-card p-4 border ${meta.border} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{entry.flag}</span>
          <span className="text-sm font-bold text-cf-text-primary leading-tight">{entry.label}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
          {meta.ko}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <FearGreedGauge score={entry.score} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            {entry.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
            {entry.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
            {entry.trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
            <span className={`text-xs font-semibold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {delta > 0 ? `+${delta}` : delta !== 0 ? delta : '±0'} (7d)
            </span>
          </div>
          <p className="text-[11px] text-cf-text-secondary leading-relaxed">{entry.driver}</p>
        </div>
      </div>
    </div>
  );
}

// ── Money Flow ────────────────────────────────────────────────────────────────
function weeksAgo(dateStr: string): string {
  const start = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return `${diffDays}일 전 시작`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전 시작`;
  const months = Math.floor(diffDays / 30);
  return `${months}개월 전 시작`;
}

const signalBadge: Record<string, { label: string; cls: string }> = {
  accelerating: { label: '▲ 가속중', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  holding:      { label: '→ 유지중', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  fading:       { label: '▼ 약화중', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
};

function MoneyFlowRow({ flow }: { flow: MoneyFlowSector }) {
  const isInflow = flow.direction === 'inflow';
  const sig = signalBadge[flow.signal];
  return (
    <div className={`rounded-xl border p-4 ${isInflow ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isInflow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isInflow ? '▲ INFLOW' : '▼ OUTFLOW'}
            </span>
            <span className="text-sm font-bold text-cf-text-primary">{flow.sector}</span>
            <span className="text-xs text-cf-text-secondary">({flow.sectorKo})</span>
          </div>
          <p className="text-xs text-cf-text-secondary leading-relaxed mb-2">{flow.reason}</p>
          {/* Timing row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-cf-text-secondary flex items-center gap-1">
              🕐 {weeksAgo(flow.sinceDate)}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sig.cls}`}>
              {sig.label}
            </span>
          </div>
        </div>
        {/* Magnitude bars */}
        <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-4 rounded-sm ${i < flow.magnitude
                ? isInflow ? 'bg-green-500' : 'bg-red-500'
                : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {flow.topMovers.map((m) => (
          <Link
            key={m.ticker}
            href={`/company/${m.ticker}`}
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
              isInflow
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            } transition-colors`}
          >
            {m.action} {m.ticker}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Narrative Card ────────────────────────────────────────────────────────────
function NarrativeCard({ n, t }: { n: MacroNarrative; t: ReturnType<typeof useTranslations<'intelligence'>> }) {
  return (
    <div className={`cf-card p-5 border ${n.color.split(' ').filter(c => c.startsWith('border')).join(' ')} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 p-2 rounded-lg ${n.color}`}>
          {iconMap[n.icon] ?? <Brain className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColorMap[n.category]}`}>
              {categoryLabel(n.category, t)}
            </span>
          </div>
          <h3 className="text-base font-heading font-bold text-cf-text-primary leading-tight">{n.title}</h3>
          <p className="text-xs text-cf-text-secondary mt-0.5">{n.titleKo}</p>
        </div>
      </div>
      <p className="text-sm text-cf-text-secondary leading-relaxed mb-3">{n.summary}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {n.keyConceptsEn.slice(0, 4).map((kc) => (
          <span key={kc} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />{kc}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {n.relatedTickers.slice(0, 5).map((tk) => (
          <Link key={tk} href={`/company/${tk}`}
            className="text-[10px] font-mono font-bold text-cf-primary bg-cf-primary/10 px-2 py-0.5 rounded hover:bg-cf-primary/20 transition-colors">
            {tk}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-cf-border">
        {n.blogSlug ? (
          <Link href={`/blog/${n.blogSlug}`} className="flex items-center gap-1.5 text-xs font-medium text-cf-primary hover:underline">
            <BookOpen className="w-3.5 h-3.5" />
            {t('readDeepDive')}
            <ArrowRight className="w-3 h-3" />
          </Link>
        ) : (
          <span className="text-xs text-cf-text-secondary/50 italic">{t('learnMore')}</span>
        )}
      </div>
    </div>
  );
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; }

function AiChat({ t }: { t: ReturnType<typeof useTranslations<'intelligence'>> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Only scroll on new messages, not on initial mount
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const narrativeContext = macroNarratives
        .map((n) => `${n.title}: ${n.summary}`)
        .join('\n');
      const flowContext = moneyFlowSectors
        .map((f) => `${f.direction === 'inflow' ? 'INFLOW' : 'OUTFLOW'} — ${f.sector}: ${f.reason}`)
        .join('\n');
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are Flowvium Macro Intelligence. You understand hidden structural forces: regulatory capture, Cantillon effect, dark pools, revolving door, military-industrial complex, sovereign wealth, crisis-as-wealth-transfer.

Current macro narratives:
${narrativeContext}

Current institutional money flows (today):
${flowContext}

User question: ${text}

Answer concisely (3–5 paragraphs). Be specific — name tickers, mechanisms, and investment implications. No generic platitudes.`,
          type: 'macro_intelligence',
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.analysis }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Analysis temporarily unavailable. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="cf-card overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center gap-3">
        <Brain className="w-5 h-5 text-amber-400" />
        <span className="text-white font-heading font-bold">{t('askQuestion')}</span>
        <span className="ml-auto text-xs text-slate-400">Powered by Gemini 2.5</span>
      </div>
      <div className="p-4 space-y-4 min-h-[100px] max-h-[360px] overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-cf-text-secondary text-center py-6 italic">{t('askPlaceholder')}</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-cf-primary text-white rounded-br-sm'
                : 'bg-gray-50 text-cf-text-primary border border-cf-border rounded-bl-sm'
            }`}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-cf-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-sm text-cf-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />{t('analyzing')}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-4 border-t border-cf-border pt-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t('askPlaceholder')} rows={2}
            className="flex-1 resize-none rounded-xl border border-cf-border bg-gray-50 px-4 py-3 text-sm text-cf-text-primary placeholder:text-cf-text-secondary/60 focus:outline-none focus:border-cf-primary focus:bg-white transition-colors"
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-cf-primary text-white disabled:opacity-40 hover:bg-cf-primary/90 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = ['flows', 'fear-greed', 'narratives'] as const;
type Tab = typeof TABS[number];

export default function IntelligencePage() {
  const t = useTranslations('intelligence');
  const [activeTab, setActiveTab] = useState<Tab>('flows');

  const tabConfig: Record<Tab, { label: string; icon: React.ReactNode }> = {
    'flows':       { label: '비밀 머니 흐름', icon: <Activity className="w-4 h-4" /> },
    'fear-greed':  { label: 'Fear & Greed',   icon: <BarChart3 className="w-4 h-4" /> },
    'narratives':  { label: '매크로 테마',     icon: <Brain className="w-4 h-4" /> },
  };

  const inflows = moneyFlowSectors.filter(f => f.direction === 'inflow').sort((a, b) => b.magnitude - a.magnitude);
  const outflows = moneyFlowSectors.filter(f => f.direction === 'outflow').sort((a, b) => b.magnitude - a.magnitude);

  return (
    <div className="min-h-screen bg-cf-bg">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span className="text-amber-200">{t('title')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold mb-3 leading-tight">
            {t('subtitle')}
          </h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">{t('description')}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-cf-text-primary shadow-sm'
                  : 'text-cf-text-secondary hover:text-cf-text-primary'
              }`}
            >
              {tabConfig[tab].icon}
              {tabConfig[tab].label}
            </button>
          ))}
        </div>

        {/* Tab: 비밀 머니 흐름 */}
        {activeTab === 'flows' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inflows */}
              <div>
                <h2 className="text-base font-heading font-bold text-green-700 mb-3 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  스마트 머니 유입 섹터
                </h2>
                <div className="space-y-3">
                  {inflows.map((f) => <MoneyFlowRow key={f.sector} flow={f} />)}
                </div>
              </div>
              {/* Outflows */}
              <div>
                <h2 className="text-base font-heading font-bold text-red-700 mb-3 flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  스마트 머니 이탈 섹터
                </h2>
                <div className="space-y-3">
                  {outflows.map((f) => <MoneyFlowRow key={f.sector} flow={f} />)}
                </div>
              </div>
            </div>
            <p className="text-xs text-cf-text-secondary text-center">
              데이터 소스: SEC 13F 공시 + 기관 포지션 변화 분석 · 매일 새벽 3시 자동 업데이트
            </p>
          </div>
        )}

        {/* Tab: Fear & Greed */}
        {activeTab === 'fear-greed' && (
          <div className="space-y-8">
            {/* By Country */}
            <div>
              <h2 className="text-lg font-heading font-bold text-cf-text-primary mb-1 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cf-primary" />
                국가별 Fear & Greed
              </h2>
              <p className="text-xs text-cf-text-secondary mb-4">각 국가 주식시장의 현재 심리 지수 (0 = 극단적 공포, 100 = 극단적 탐욕)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fearGreedByCountry.map((e) => <FearGreedCard key={e.id} entry={e} />)}
              </div>
            </div>

            {/* By Asset */}
            <div>
              <h2 className="text-lg font-heading font-bold text-cf-text-primary mb-1 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cf-primary" />
                자산별 Fear & Greed
              </h2>
              <p className="text-xs text-cf-text-secondary mb-4">섹터 및 자산 클래스별 시장 심리 지수</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fearGreedByAsset.map((e) => <FearGreedCard key={e.id} entry={e} />)}
              </div>
            </div>
            <p className="text-xs text-cf-text-secondary text-center">
              자체 산출 지수 (모멘텀 · 변동성 · 기관 포지셔닝 기반) · 매일 새벽 3시 업데이트
            </p>
          </div>
        )}

        {/* Tab: Macro Themes */}
        {activeTab === 'narratives' && (
          <div>
            <p className="text-sm text-cf-text-secondary mb-6">
              시장을 지배하는 8가지 구조적 힘 — 뉴스에 나오기 전에 이해하세요.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {macroNarratives.map((n) => (
                <NarrativeCard key={n.id} n={n} t={t} />
              ))}
            </div>
          </div>
        )}

        {/* AI Chat — always visible */}
        <AiChat t={t} />
      </div>
    </div>
  );
}
