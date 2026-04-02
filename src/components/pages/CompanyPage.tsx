'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { allCompanies, type Company } from '@/data/companies';
import { institutionalSignals } from '@/data/institutional-signals';
import { newsGapData } from '@/data/news-gap';
import { cascadePatterns } from '@/data/cascades';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Building2,
  Calendar,
  Users,
  Globe,
  TrendingUp,
  TrendingDown,
  Plus,
  LogOut,
  Sparkles,
  Gauge,
  Loader2,
} from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';
import Breadcrumbs from '@/components/Breadcrumbs';
import SupplyChainMap from '@/components/SupplyChainMap';
import { useTranslatedText } from '@/hooks/useTranslatedText';

function T({ text }: { text: string }) {
  const translated = useTranslatedText(text);
  return <>{translated}</>;
}

const COLORS = ['#4F8FBF', '#6CB4A8', '#E8A945', '#D97171', '#5CB88A', '#7C5CFC'];

const relationshipColors: Record<string, string> = {
  supplier: '#4F8FBF',
  customer: '#5CB88A',
  partner: '#E8A945',
  competitor: '#D97171',
};

const actionIcons: Record<string, React.ReactNode> = {
  accumulating: <TrendingUp className="w-4 h-4" />,
  reducing: <TrendingDown className="w-4 h-4" />,
  new_position: <Plus className="w-4 h-4" />,
  exit: <LogOut className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  accumulating: 'text-green-600 bg-green-50',
  reducing: 'text-red-600 bg-red-50',
  new_position: 'text-blue-600 bg-blue-50',
  exit: 'text-orange-600 bg-orange-50',
};

export default function CompanyPage({ ticker }: { ticker: string }) {
  const t = useTranslations('company');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [terminalView, setTerminalView] = useState(false);

  const company = useMemo(
    () => allCompanies.find((c) => c.ticker.toUpperCase() === ticker.toUpperCase()),
    [ticker]
  );

  const signals = useMemo(
    () => institutionalSignals.filter((s) => s.ticker.toUpperCase() === ticker.toUpperCase()),
    [ticker]
  );

  const newsGap = useMemo(
    () => newsGapData.find((n) => n.ticker.toUpperCase() === ticker.toUpperCase()),
    [ticker]
  );

  const cascadePosition = useMemo(() => {
    if (!company) return null;
    for (const pattern of cascadePatterns) {
      const step = pattern.sequence.find(
        (s) => s.ticker.toUpperCase() === ticker.toUpperCase()
      );
      if (step) return { pattern, step };
    }
    return null;
  }, [company, ticker]);

  if (!company) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-heading font-bold text-cf-text-primary mb-4">
          {t('notFound')}
        </h1>
        <p className="text-cf-text-secondary mb-6">
          {t('notFoundDesc', { ticker })}
        </p>
        <Link href="/explore" className="cf-btn-primary">
          {t('backToExplorer')}
        </Link>
      </div>
    );
  }

  const pieData = company.revenue.segments.map((s) => ({
    name: s.name,
    value: s.percentage,
  }));

  const productBarData = company.products.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
    share: p.revenueShare,
  }));

  const groupedRelationships = company.relationships.reduce(
    (acc, rel) => {
      if (!acc[rel.type]) acc[rel.type] = [];
      acc[rel.type].push(rel);
      return acc;
    },
    {} as Record<string, typeof company.relationships>
  );

  const getAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze ${company.name} (${company.ticker}) in the context of its supply chain position. Company sector: ${company.sector}. Key products: ${company.products.map((p) => p.name).join(', ')}. Key relationships: ${company.relationships.slice(0, 5).map((r) => `${r.type}: ${r.targetId}`).join(', ')}. Provide a concise investment-relevant analysis.`,
          type: 'company_analysis',
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch {
      setAiAnalysis('AI analysis is currently unavailable. Please try again later.');
    }
    setAiLoading(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs overrides={{ [company.ticker]: { label: company.name } }} />

      {/* Back */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm text-cf-text-secondary hover:text-cf-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToExplorer')}
      </Link>

      {/* Header — always visible */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-3xl font-heading font-bold text-cf-text-primary">
            {company.name}
          </h1>
          <span className="font-mono text-sm font-bold bg-cf-primary/10 text-cf-primary px-3 py-1 rounded-lg">
            {company.ticker}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-cf-text-secondary capitalize">
            {company.role}
          </span>
        </div>
        <p className="text-cf-text-secondary leading-relaxed mb-4"><T text={company.description} /></p>
        <div className="flex items-center gap-3">
          <ShareButtons title={`${company.name} (${company.ticker}) - Supply Chain Analysis | ChainFlow`} />
          <button
            onClick={() => setTerminalView((v) => !v)}
            className={`inline-flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded transition-colors ${
              terminalView
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-gray-800 text-amber-400 hover:bg-gray-700 border border-gray-600'
            }`}
          >
            <span className="text-[10px]">▣</span>
            {terminalView ? 'Standard View' : 'Terminal View'}
          </button>
        </div>
      </div>

      {terminalView ? (
        <SupplyChainMap company={company} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Products & Revenue */}
          <div className="cf-card p-6">
            <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-6">
              {t('productsAndRevenue')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Products bar chart */}
              <div>
                <h3 className="text-sm font-bold text-cf-text-primary mb-3">
                  {t('productRevenueShare')}
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar dataKey="share" fill="#4F8FBF" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Revenue pie */}
              <div>
                <h3 className="text-sm font-bold text-cf-text-primary mb-3">
                  {t('revenueBreakdown')} ({company.revenue.total})
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-cf-text-secondary truncate">
                        {item.name} ({item.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue segments table */}
            <div className="mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cf-border">
                    <th className="text-left py-2 text-cf-text-secondary font-medium">
                      {t('segment')}
                    </th>
                    <th className="text-right py-2 text-cf-text-secondary font-medium">
                      {t('revenue')}
                    </th>
                    <th className="text-right py-2 text-cf-text-secondary font-medium">
                      {t('share')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {company.revenue.segments.map((s) => (
                    <tr key={s.name} className="border-b border-cf-border/50">
                      <td className="py-2 text-cf-text-primary">{s.name}</td>
                      <td className="text-right py-2 text-cf-text-secondary">{s.amount}</td>
                      <td className="text-right py-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cf-primary"
                              style={{ width: `${s.percentage}%` }}
                            />
                          </div>
                          <span className="text-cf-text-secondary text-xs w-8 text-right">
                            {s.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supply Chain Relationships */}
          <div className="cf-card p-6">
            <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-6">
              {t('supplyChainRelationships')}
            </h2>
            {Object.entries(groupedRelationships).map(([type, rels]) => (
              <div key={type} className="mb-6 last:mb-0">
                <h3
                  className="text-sm font-bold capitalize mb-3 flex items-center gap-2"
                  style={{ color: relationshipColors[type] }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: relationshipColors[type] }}
                  />
                  {type === 'supplier'
                    ? t('suppliers')
                    : type === 'customer'
                    ? t('customers')
                    : type === 'competitor'
                    ? t('competitors')
                    : t('partners')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rels.map((rel, i) => {
                    const target = allCompanies.find(
                      (c) => c.id === rel.targetId || c.ticker === rel.targetId
                    );
                    return (
                      <Link
                        key={i}
                        href={`/company/${target?.ticker || rel.targetId}`}
                        className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-cf-text-primary text-sm group-hover:text-cf-primary transition-colors">
                            {target?.name || rel.targetId}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-cf-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-cf-text-secondary">
                          {rel.products.join(', ')}
                        </p>
                        {rel.revenueImpact && (
                          <p className="text-xs mt-1 text-cf-primary font-medium">
                            {t('impact')}: {rel.revenueImpact}
                          </p>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Signals */}
          {signals.length > 0 && (
            <div className="cf-card p-6">
              <h2 className="text-xl font-heading font-bold text-cf-text-primary mb-6">
                {t('institutionalSignals')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cf-border">
                      <th className="text-left py-2 text-cf-text-secondary font-medium">
                        {t('institution')}
                      </th>
                      <th className="text-left py-2 text-cf-text-secondary font-medium">
                        {t('action')}
                      </th>
                      <th className="text-right py-2 text-cf-text-secondary font-medium">
                        {t('share')}
                      </th>
                      <th className="text-right py-2 text-cf-text-secondary font-medium">
                        {t('value')}
                      </th>
                      <th className="text-right py-2 text-cf-text-secondary font-medium">
                        {t('date')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((sig) => (
                      <tr key={sig.id} className="border-b border-cf-border/50">
                        <td className="py-2.5 text-cf-text-primary font-medium">
                          {sig.institution}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${actionColors[sig.action]}`}
                          >
                            {actionIcons[sig.action]}
                            {sig.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-right py-2.5 text-cf-text-secondary font-mono text-xs">
                          {sig.sharesChanged.toLocaleString()}
                        </td>
                        <td className="text-right py-2.5 text-cf-text-primary font-medium">
                          {sig.estimatedValue}
                        </td>
                        <td className="text-right py-2.5 text-cf-text-secondary text-xs">
                          {sig.filingDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="cf-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-bold text-cf-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cf-accent" />
                {t('aiAnalysis')}
              </h2>
              <button
                onClick={getAiAnalysis}
                disabled={aiLoading}
                className="cf-btn-primary gap-2 text-sm"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('analyzing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t('getAiAnalysis')}
                  </>
                )}
              </button>
            </div>
            {aiAnalysis ? (
              <div className="text-sm text-cf-text-secondary leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                {aiAnalysis}
              </div>
            ) : (
              <p className="text-sm text-cf-text-secondary">
                {t('aiPrompt', { company: company.name })}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          <div className="cf-card p-6">
            <h3 className="text-lg font-heading font-bold text-cf-text-primary mb-4">
              {t('companyInfo')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-cf-text-secondary mt-0.5" />
                <div>
                  <p className="text-xs text-cf-text-secondary">{t('headquarters')}</p>
                  <p className="text-sm text-cf-text-primary">{company.headquarters}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-cf-text-secondary mt-0.5" />
                <div>
                  <p className="text-xs text-cf-text-secondary">{t('founded')}</p>
                  <p className="text-sm text-cf-text-primary">{company.founded}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-cf-text-secondary mt-0.5" />
                <div>
                  <p className="text-xs text-cf-text-secondary">{t('employees')}</p>
                  <p className="text-sm text-cf-text-primary">{company.employees}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-cf-text-secondary mt-0.5" />
                <div>
                  <p className="text-xs text-cf-text-secondary">{t('website')}</p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cf-primary hover:underline flex items-center gap-1"
                  >
                    {company.website.replace('https://', '').replace('www.', '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* News Gap */}
          {newsGap && (
            <div className="cf-card p-6">
              <h3 className="text-lg font-heading font-bold text-cf-text-primary mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                {t('newsGapScore')}
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-cf-text-secondary">{t('gapScore')}</span>
                    <span
                      className={`text-lg font-bold ${
                        newsGap.gapScore >= 70
                          ? 'text-cf-accent'
                          : newsGap.gapScore >= 40
                          ? 'text-cf-primary'
                          : 'text-cf-success'
                      }`}
                    >
                      {newsGap.gapScore}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${newsGap.gapScore}%`,
                        background:
                          newsGap.gapScore >= 70
                            ? 'linear-gradient(90deg, #E8A945, #D97171)'
                            : newsGap.gapScore >= 40
                            ? 'linear-gradient(90deg, #4F8FBF, #6CB4A8)'
                            : '#5CB88A',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-cf-text-secondary mt-1">
                    <span>{t('lowGap')}</span>
                    <span>{t('highGap')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-cf-text-secondary">{t('ibActivity')}</p>
                    <p className="text-lg font-bold text-cf-primary">
                      {newsGap.ibActivityScore}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-cf-text-secondary">{t('mediaScore')}</p>
                    <p className="text-lg font-bold text-cf-text-primary">
                      {newsGap.mediaScore}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cascade Position */}
          {cascadePosition && (
            <div className="cf-card p-6">
              <h3 className="text-lg font-heading font-bold text-cf-text-primary mb-4">
                {t('cascadePosition')}
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-cf-text-secondary mb-1">{t('roleInCascade')}</p>
                  <p className="text-sm font-medium text-cf-text-primary capitalize">
                    {cascadePosition.step.role.replace('_', ' ')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-cf-text-secondary mb-1">{t('typicalDelay')}</p>
                  <p className="text-sm font-medium text-cf-text-primary">
                    {cascadePosition.step.typicalDelay}
                  </p>
                </div>
                <p className="text-xs text-cf-text-secondary leading-relaxed">
                  <T text={cascadePosition.step.reason} />
                </p>
                <Link
                  href={`/cascade/${cascadePosition.pattern.sector}`}
                  className="cf-btn-secondary w-full justify-center gap-2 text-sm"
                >
                  {t('viewFullCascade')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
