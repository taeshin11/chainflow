'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import dynamic from 'next/dynamic';
import { companies, type Company } from '@/data/companies';
import { sectors } from '@/data/sectors';
import {
  X,
  ExternalLink,
  ArrowRight,
  Building2,
  DollarSign,
  Package,
  Users,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[500px]">Loading graph...</div>,
});

const sectorColorMap: Record<string, string> = {
  semiconductors: '#6366f1',
  'ai-cloud': '#3b82f6',
  'ev-battery': '#22c55e',
  defense: '#ef4444',
  'pharma-biotech': '#a855f7',
};

const relationshipColors: Record<string, string> = {
  supplier: '#4F8FBF',
  customer: '#5CB88A',
  partner: '#E8A945',
  competitor: '#D97171',
};

const marketCapSizes: Record<string, number> = {
  mega: 12,
  large: 10,
  mid: 8,
  small: 6,
};

function getRoleSize(role: string): number {
  if (role === 'leader') return 12;
  if (role === 'intermediary') return 10;
  if (role === 'mid-cap' || role === 'supplier') return 8;
  return 6;
}

interface SidePanelProps {
  company: Company;
  onClose: () => void;
}

function SidePanel({ company, onClose }: SidePanelProps) {
  const pieData = company.revenue.segments.map((s) => ({
    name: s.name,
    value: s.percentage,
  }));
  const COLORS = ['#4F8FBF', '#6CB4A8', '#E8A945', '#D97171', '#5CB88A', '#7C5CFC'];

  const relatedCompanies = company.relationships
    .slice(0, 6)
    .map((r) => {
      const target = companies.find(
        (c) => c.id === r.targetId || c.ticker === r.targetId
      );
      return { ...r, target };
    });

  return (
    <div className="fixed top-0 right-0 z-40 h-full w-96 max-w-[90vw] bg-white shadow-xl overflow-y-auto animate-slide-in-right">
      <div className="sticky top-0 bg-white z-10 border-b border-cf-border p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-bold text-cf-text-primary">
            {company.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono font-bold bg-cf-primary/10 text-cf-primary px-2 py-0.5 rounded">
              {company.ticker}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: (sectorColorMap[company.sector] || '#888') + '20',
                color: sectorColorMap[company.sector] || '#888',
              }}
            >
              {company.sector}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-cf-text-secondary" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Info badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-cf-text-secondary" />
            <span className="text-cf-text-secondary">Cap:</span>
            <span className="font-medium">{company.marketCap}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-cf-text-secondary" />
            <span className="text-cf-text-secondary">Role:</span>
            <span className="font-medium capitalize">{company.role}</span>
          </div>
        </div>

        <p className="text-sm text-cf-text-secondary leading-relaxed line-clamp-4">
          {company.description}
        </p>

        {/* Products */}
        <div>
          <h3 className="text-sm font-bold text-cf-text-primary mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" /> Products
          </h3>
          <div className="space-y-1">
            {company.products.slice(0, 4).map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2"
              >
                <span className="text-cf-text-primary font-medium truncate mr-2">
                  {p.name}
                </span>
                <span className="text-cf-text-secondary flex-shrink-0">
                  {p.revenueShare}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Pie */}
        <div>
          <h3 className="text-sm font-bold text-cf-text-primary mb-2">Revenue Breakdown</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => `${value}%`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-cf-text-secondary truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related Companies */}
        <div>
          <h3 className="text-sm font-bold text-cf-text-primary mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> Related Companies
          </h3>
          <div className="space-y-2">
            {relatedCompanies.map((rel, i) => (
              <Link
                key={i}
                href={`/company/${rel.target?.ticker || rel.targetId}`}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-xs group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: relationshipColors[rel.type] }}
                  />
                  <span className="font-medium text-cf-text-primary">
                    {rel.target?.name || rel.targetId}
                  </span>
                </div>
                <span
                  className="text-xs capitalize px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: relationshipColors[rel.type] + '20',
                    color: relationshipColors[rel.type],
                  }}
                >
                  {rel.type}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          <Link
            href={`/company/${company.ticker}`}
            className="cf-btn-primary w-full justify-center gap-2"
          >
            View Full Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/cascade/${company.sector}`}
            className="cf-btn-secondary w-full justify-center gap-2"
          >
            View Cascade
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ExplorePageProps {
  initialSector?: string;
}

export default function ExplorePage({ initialSector }: ExplorePageProps) {
  const t = useTranslations('explore');
  const [selectedSector, setSelectedSector] = useState<string>(initialSector || 'all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(800);
  const graphRef = useRef<{ zoomToFit: (ms?: number) => void }>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const filteredCompanies = useMemo(() => {
    let filtered = companies;
    if (selectedSector !== 'all') {
      filtered = filtered.filter((c) => c.sector === selectedSector);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [selectedSector, searchQuery]);

  const graphData = useMemo(() => {
    const nodeIds = new Set(filteredCompanies.map((c) => c.id));
    const nodes = filteredCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      ticker: c.ticker,
      sector: c.sector,
      val: marketCapSizes[c.marketCap] || getRoleSize(c.role),
      color: sectorColorMap[c.sector] || '#888',
    }));

    const links: { source: string; target: string; type: string; color: string }[] = [];
    const linkSet = new Set<string>();

    for (const c of filteredCompanies) {
      for (const rel of c.relationships) {
        const targetId = rel.targetId;
        if (nodeIds.has(targetId)) {
          const key = [c.id, targetId].sort().join('-') + rel.type;
          if (!linkSet.has(key)) {
            linkSet.add(key);
            links.push({
              source: c.id,
              target: targetId,
              type: rel.type,
              color: relationshipColors[rel.type],
            });
          }
        }
      }
    }

    return { nodes, links };
  }, [filteredCompanies]);

  const handleNodeClick = useCallback(
    (node: Record<string, unknown>) => {
      const id = node.id as string | undefined;
      if (id) {
        const company = companies.find((c) => c.id === id);
        if (company) setSelectedCompany(company);
      }
    },
    []
  );

  const handleZoomIn = () => {
    // Force graph zoom handled internally
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-3xl font-heading font-bold text-cf-text-primary mb-2">
          {t('title')}
        </h1>
        <p className="text-cf-text-secondary mb-6">{t('subtitle')}</p>

        {/* Search */}
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cf-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="cf-input pl-10"
          />
        </div>

        {/* Sector tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSector('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSector === 'all'
                ? 'bg-cf-primary text-white shadow-sm'
                : 'bg-white text-cf-text-secondary hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All
          </button>
          {sectors.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSector(s.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSector === s.id
                  ? 'text-white shadow-sm'
                  : 'bg-white text-cf-text-secondary hover:bg-gray-50 border border-gray-200'
              }`}
              style={
                selectedSector === s.id ? { backgroundColor: s.color } : undefined
              }
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-2">
        <div className="flex flex-wrap gap-4 text-xs text-cf-text-secondary">
          <span className="font-medium">Relationships:</span>
          {Object.entries(relationshipColors).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5 capitalize">
              <span
                className="w-3 h-0.5 rounded"
                style={{ backgroundColor: color }}
              />
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Graph */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={containerRef} className="cf-card relative overflow-hidden" style={{ height: '600px' }}>
          {mounted && graphData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef as React.MutableRefObject<never>}
              graphData={graphData}
              nodeLabel={(node: Record<string, unknown>) =>
                `${node.name as string} (${node.ticker as string})`
              }
              nodeColor={(node: Record<string, unknown>) => node.color as string}
              nodeVal={(node: Record<string, unknown>) => node.val as number}
              linkColor={(link: Record<string, unknown>) => link.color as string}
              linkWidth={1.5}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={0.005}
              linkDirectionalParticleWidth={2}
              onNodeClick={handleNodeClick}
              nodeCanvasObject={(
                node: Record<string, unknown>,
                ctx: CanvasRenderingContext2D,
                globalScale: number
              ) => {
                const x = node.x as number;
                const y = node.y as number;
                const val = (node.val as number) || 6;
                const color = (node.color as string) || '#888';
                const label = (node.ticker as string) || '';
                const r = Math.sqrt(val) * 3;

                // Outer glow
                ctx.beginPath();
                ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
                ctx.fillStyle = color + '30';
                ctx.fill();

                // Main circle
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();

                // Label
                const fontSize = Math.max(10 / globalScale, 3);
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#fff';
                ctx.fillText(label, x, y);
              }}
              backgroundColor="transparent"
              width={containerWidth}
              height={600}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-cf-text-secondary">
                {mounted ? 'No companies match your filters' : 'Loading graph...'}
              </p>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
              title="Zoom controls available via mouse wheel"
            >
              <ZoomIn className="w-4 h-4 text-cf-text-secondary" />
            </button>
            <button
              onClick={() => graphRef.current?.zoomToFit(400)}
              className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center hover:bg-gray-50"
              title="Fit to view"
            >
              <ZoomOut className="w-4 h-4 text-cf-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Company list below graph for mobile */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg font-heading font-bold text-cf-text-primary mb-4">
          {filteredCompanies.length} Companies
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCompanies.map((c) => (
            <Link
              key={c.id}
              href={`/company/${c.ticker}`}
              className="cf-card p-4 group hover:shadow-lg transition-all flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                style={{ backgroundColor: sectorColorMap[c.sector] || '#888' }}
              >
                {c.ticker.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-cf-text-primary truncate group-hover:text-cf-primary transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-cf-text-secondary">
                  {c.ticker} &middot; {c.revenue.total}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Side panel */}
      {selectedCompany && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedCompany(null)}
          />
          <SidePanel
            company={selectedCompany}
            onClose={() => setSelectedCompany(null)}
          />
        </>
      )}
    </div>
  );
}
