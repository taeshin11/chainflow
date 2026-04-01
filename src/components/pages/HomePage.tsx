'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { sectors } from '@/data/sectors';
import { institutionalSignals } from '@/data/institutional-signals';
import {
  ArrowRight,
  Network,
  TrendingUp,
  Layers,
  Newspaper,
  Cpu,
  Cloud,
  Zap,
  Shield,
  FlaskConical,
  Users,
  BarChart3,
  Globe,
  Plus,
  LogOut,
  TrendingDown,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EmailCTA from '@/components/EmailCTA';

const sectorIcons: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-6 h-6" />,
  Cloud: <Cloud className="w-6 h-6" />,
  Battery: <Zap className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  FlaskConical: <FlaskConical className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
};

const actionIcons: Record<string, React.ReactNode> = {
  accumulating: <TrendingUp className="w-3.5 h-3.5" />,
  reducing: <TrendingDown className="w-3.5 h-3.5" />,
  new_position: <Plus className="w-3.5 h-3.5" />,
  exit: <LogOut className="w-3.5 h-3.5" />,
};

const actionColors: Record<string, string> = {
  accumulating: 'text-green-600 bg-green-50',
  reducing: 'text-red-600 bg-red-50',
  new_position: 'text-blue-600 bg-blue-50',
  exit: 'text-orange-600 bg-orange-50',
};

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function MiniGraph() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-full h-64 bg-cf-border/30 rounded-xl animate-pulse" />;

  const nodes = [
    { id: 'NVDA', x: 200, y: 120, r: 28, color: '#4F8FBF' },
    { id: 'TSM', x: 80, y: 80, r: 22, color: '#6366f1' },
    { id: 'MSFT', x: 320, y: 60, r: 26, color: '#3b82f6' },
    { id: 'AMD', x: 120, y: 200, r: 18, color: '#6366f1' },
    { id: 'SMCI', x: 300, y: 190, r: 14, color: '#6366f1' },
    { id: 'GOOGL', x: 370, y: 140, r: 24, color: '#3b82f6' },
    { id: 'ASML', x: 50, y: 170, r: 16, color: '#6366f1' },
  ];
  const links = [
    { from: 'TSM', to: 'NVDA' },
    { from: 'NVDA', to: 'MSFT' },
    { from: 'TSM', to: 'AMD' },
    { from: 'NVDA', to: 'SMCI' },
    { from: 'NVDA', to: 'GOOGL' },
    { from: 'ASML', to: 'TSM' },
    { from: 'AMD', to: 'MSFT' },
  ];
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox="0 0 420 260" className="w-full h-64">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {links.map((l, i) => {
        const from = nodeMap[l.from];
        const to = nodeMap[l.to];
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#E2E8F0"
            strokeWidth={2}
            opacity={0.6}
          />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} opacity={0.15} />
          <circle cx={n.x} cy={n.y} r={n.r * 0.7} fill={n.color} opacity={0.8} filter="url(#glow)" />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fill="white"
            fontSize={n.r > 20 ? 10 : 8}
            fontWeight="bold"
          >
            {n.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function HomePage() {
  const t = useTranslations('hero');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');

  const socialProof = useInView();
  const featuredSectors = useInView();
  const latestSignals = useInView();
  const features = useInView();
  const howItWorks = useInView();

  // Get the 5 most recent/interesting signals
  const topSignals = institutionalSignals
    .filter((s) => s.action === 'accumulating' || s.action === 'new_position')
    .slice(0, 5);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cf-primary/5 via-cf-secondary/5 to-cf-accent/5" />
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background:
                'radial-gradient(ellipse at 30% 50%, rgba(79,143,191,0.15) 0%, transparent 70%)',
            }}
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cf-primary/10 text-cf-primary text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-cf-primary animate-pulse" />
                {tCommon('beta')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-cf-text-primary leading-tight mb-6">
                {tHome.rich('heroHeadline', { accent: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-cf-primary to-cf-secondary">{chunks}</span> })}
              </h1>
              <p className="text-lg md:text-xl text-cf-text-secondary mb-8 max-w-lg">
                {t('description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore" className="cf-btn-primary text-base px-8 py-3.5 gap-2 shadow-lg shadow-cf-primary/25 hover:shadow-xl hover:shadow-cf-primary/30 transition-all">
                  {tHome('exploreSupplyChains')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/signals" className="cf-btn-secondary text-base px-8 py-3.5">
                  {tHome('viewSignals')}
                </Link>
              </div>
            </div>
            <div className="cf-card p-6">
              <p className="text-xs text-cf-text-secondary mb-2 font-medium uppercase tracking-wider">
                {tHome('livePreview')}
              </p>
              <MiniGraph />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section
        ref={socialProof.ref}
        className={`border-y border-cf-border bg-white transition-all duration-700 ${
          socialProof.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: tHome('socialProof.investors'), icon: <Users className="w-5 h-5" /> },
              { value: '30+', label: tHome('socialProof.companies'), icon: <Network className="w-5 h-5" /> },
              { value: '5', label: tHome('socialProof.sectors'), icon: <Globe className="w-5 h-5" /> },
              { value: '$12B+', label: tHome('socialProof.flows'), icon: <BarChart3 className="w-5 h-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cf-primary/10 text-cf-primary mb-3">
                  {stat.icon}
                </div>
                <p className="text-2xl md:text-3xl font-heading font-bold text-cf-text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-cf-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sectors */}
      <section
        ref={featuredSectors.ref}
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 transition-all duration-700 ${
          featuredSectors.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-4">
            {tHome('featuredSectors')}
          </h2>
          <p className="text-cf-text-secondary max-w-2xl mx-auto">
            {tHome('featuredSectorsDesc')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {sectors.map((sector) => (
            <Link
              key={sector.id}
              href={`/explore/${sector.id}`}
              className="cf-card p-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center border-2 border-transparent hover:border-current/10"
              style={{ '--tw-border-opacity': '0.1', borderColor: 'transparent' } as React.CSSProperties}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: sector.color + '15', color: sector.color }}
              >
                {sectorIcons[sector.icon] || <Network className="w-6 h-6" />}
              </div>
              <h3 className="font-heading font-bold text-cf-text-primary text-base mb-2 group-hover:text-cf-primary transition-colors">
                {sector.name}
              </h3>
              <p className="text-xs text-cf-text-secondary mb-3 line-clamp-2">
                {sector.description.split('.')[0]}.
              </p>
              <div className="flex items-center justify-center gap-1 text-sm font-medium text-cf-primary opacity-0 group-hover:opacity-100 transition-opacity">
                {tHome('explore')}
                <ArrowRight className="w-4 h-4" />
              </div>
              <p className="text-xs text-cf-text-secondary mt-2">
                {tHome('companies', { count: sector.companyCount })}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Signals */}
      <section
        ref={latestSignals.ref}
        className={`bg-white py-20 transition-all duration-700 ${
          latestSignals.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-2">
                {tHome('latestSignals')}
              </h2>
              <p className="text-cf-text-secondary">
                {tHome('latestSignalsDesc')}
              </p>
            </div>
            <Link href="/signals" className="cf-btn-secondary gap-2 hidden md:inline-flex">
              {tHome('viewAllSignals')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topSignals.map((signal) => (
              <Link
                key={signal.id}
                href={`/company/${signal.ticker}`}
                className="cf-card p-5 group hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-cf-primary text-lg">
                    {signal.ticker}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${actionColors[signal.action]}`}
                  >
                    {actionIcons[signal.action]}
                    {signal.action.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-cf-text-primary font-medium mb-1 truncate">
                  {signal.companyName}
                </p>
                <p className="text-xs text-cf-text-secondary mb-3">
                  {signal.institution}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cf-text-secondary">{signal.filingDate}</span>
                  <span className="font-bold text-cf-text-primary">{signal.estimatedValue}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center md:hidden">
            <Link href="/signals" className="cf-btn-secondary gap-2">
              {tHome('viewAllSignals')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        ref={features.ref}
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 transition-all duration-700 ${
          features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-4">
            {tHome('fourLenses')}
          </h2>
          <p className="text-cf-text-secondary max-w-2xl mx-auto">
            {tHome('fourLensesDesc')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Network className="w-6 h-6" />,
              title: tHome('featureCards.supplyChainMaps'),
              desc: t('features.realtimeDesc'),
              color: 'text-cf-primary bg-cf-primary/10',
              href: '/explore',
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: tHome('featureCards.institutionalFlowSignals'),
              desc: t('features.signalsDesc'),
              color: 'text-cf-secondary bg-cf-secondary/10',
              href: '/signals',
            },
            {
              icon: <Layers className="w-6 h-6" />,
              title: tHome('featureCards.leaderToMidcapCascade'),
              desc: t('features.cascadeDesc'),
              color: 'text-cf-accent bg-cf-accent/10',
              href: '/cascade',
            },
            {
              icon: <Newspaper className="w-6 h-6" />,
              title: tHome('featureCards.newsGapAnalyzer'),
              desc: t('features.newsGapDesc'),
              color: 'text-cf-danger bg-cf-danger/10',
              href: '/news-gap',
            },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="cf-card p-6 group hover:shadow-lg transition-all"
            >
              <div
                className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
              >
                {feature.icon}
              </div>
              <h3 className="font-heading font-bold text-cf-text-primary mb-2 group-hover:text-cf-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-cf-text-secondary">{feature.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={howItWorks.ref}
        className={`bg-white py-20 transition-all duration-700 ${
          howItWorks.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-4">
              {tHome('howItWorks')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: tHome('steps.mapTheChain'),
                desc: tHome('steps.mapTheChainDesc'),
              },
              {
                step: '2',
                title: tHome('steps.detectTheSignal'),
                desc: tHome('steps.detectTheSignalDesc'),
              },
              {
                step: '3',
                title: tHome('steps.tradeTheCascade'),
                desc: tHome('steps.tradeTheCascadeDesc'),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cf-primary to-cf-secondary text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-heading font-bold text-cf-text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-cf-text-secondary max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/explore" className="cf-btn-primary text-base px-10 py-3.5 gap-2 shadow-lg shadow-cf-primary/25">
              {tHome('startExploringNow')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Email CTA */}
      <EmailCTA />

      {/* Disclaimer */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center text-xs text-cf-text-secondary max-w-2xl mx-auto bg-white/60 rounded-xl p-4 border border-cf-border">
          {tHome('disclaimer')}
        </div>
      </section>
    </div>
  );
}
