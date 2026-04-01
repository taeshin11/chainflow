'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { sectors } from '@/data/sectors';
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
} from 'lucide-react';
import { useEffect, useState } from 'react';

const sectorIcons: Record<string, React.ReactNode> = {
  Cpu: <Cpu className="w-6 h-6" />,
  Cloud: <Cloud className="w-6 h-6" />,
  Battery: <Zap className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  FlaskConical: <FlaskConical className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
};

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
  const tCommon = useTranslations('common');

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
                Track where{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cf-primary to-cf-secondary">
                  smart money
                </span>{' '}
                flows through the supply chain
              </h1>
              <p className="text-lg md:text-xl text-cf-text-secondary mb-8 max-w-lg">
                {t('description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore" className="cf-btn-primary text-base px-8 py-3 gap-2">
                  Explore Supply Chains
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/signals" className="cf-btn-secondary text-base px-8 py-3">
                  View Signals
                </Link>
              </div>
            </div>
            <div className="cf-card p-6">
              <p className="text-xs text-cf-text-secondary mb-2 font-medium uppercase tracking-wider">
                Live Supply Chain Preview
              </p>
              <MiniGraph />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-4">
            Four Lenses on Supply Chain Alpha
          </h2>
          <p className="text-cf-text-secondary max-w-2xl mx-auto">
            ChainFlow combines supply chain mapping, institutional signal detection, cascade
            analysis, and news gap scoring into one platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Network className="w-6 h-6" />,
              title: 'Supply Chain Maps',
              desc: t('features.realtimeDesc'),
              color: 'text-cf-primary bg-cf-primary/10',
              href: '/explore',
            },
            {
              icon: <TrendingUp className="w-6 h-6" />,
              title: 'Institutional Flow Signals',
              desc: t('features.signalsDesc'),
              color: 'text-cf-secondary bg-cf-secondary/10',
              href: '/signals',
            },
            {
              icon: <Layers className="w-6 h-6" />,
              title: 'Leader-to-Midcap Cascade',
              desc: t('features.cascadeDesc'),
              color: 'text-cf-accent bg-cf-accent/10',
              href: '/cascade',
            },
            {
              icon: <Newspaper className="w-6 h-6" />,
              title: 'News Gap Analyzer',
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
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-4">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Map the Chain',
                desc: 'Explore interactive supply chain graphs showing how companies are connected through supplier, customer, and partner relationships.',
              },
              {
                step: '2',
                title: 'Detect the Signal',
                desc: 'Monitor institutional 13F filings for unusual accumulation patterns. Cross-reference with media coverage to find the news gap.',
              },
              {
                step: '3',
                title: 'Trade the Cascade',
                desc: 'When a leader stock moves, use our cascade tracker to identify which downstream stocks will follow and when.',
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
        </div>
      </section>

      {/* Sector Selector */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-cf-text-primary mb-4">
            Explore by Sector
          </h2>
          <p className="text-cf-text-secondary">
            Dive into supply chain maps and cascade patterns for each major sector.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sectors.map((sector) => (
            <Link
              key={sector.id}
              href={`/explore/${sector.id}`}
              className="cf-card p-5 group hover:shadow-lg transition-all text-center"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: sector.color + '15', color: sector.color }}
              >
                {sectorIcons[sector.icon] || <Network className="w-6 h-6" />}
              </div>
              <h3 className="font-heading font-bold text-cf-text-primary text-sm mb-1 group-hover:text-cf-primary transition-colors">
                {sector.name}
              </h3>
              <p className="text-xs text-cf-text-secondary">
                {sector.companyCount} companies
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="text-center text-xs text-cf-text-secondary max-w-2xl mx-auto bg-white/60 rounded-xl p-4 border border-cf-border">
          ChainFlow provides supply chain data for informational purposes only. It does not
          constitute financial advice. Past institutional activity does not guarantee future
          returns. Always conduct your own research before making investment decisions.
        </div>
      </section>
    </div>
  );
}
