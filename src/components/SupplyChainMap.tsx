'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { type Company, allCompanies } from '@/data/companies';

/** Parse a revenue-impact string like "~12.5%" or "5-8%" into a sortable number */
function parseRevImpact(raw: string): number {
  const m = raw.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// ---------------------------------------------------------------------------

interface CardProps {
  rel: Company['relationships'][number];
  target: Company | undefined;
  side: 'supplier' | 'customer';
}

function RelCard({ rel, target, side }: CardProps) {
  const bg = side === 'supplier' ? '#4a1a1a' : '#1a3a1a';
  const border = side === 'supplier' ? '#7a3333' : '#2a5a2a';
  const name = target?.name ?? rel.targetId;
  const ticker = target?.ticker ?? '';

  return (
    <Link
      href={`/company/${target?.ticker ?? rel.targetId}`}
      className="block rounded px-2 py-1.5 hover:brightness-125 transition-all"
      style={{ backgroundColor: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className="font-mono text-[11px] font-bold text-gray-100 truncate"
          title={name}
        >
          {truncate(name, 22)}
        </span>
        {ticker && (
          <span className="font-mono text-[9px] text-gray-400 flex-shrink-0">
            {ticker}
          </span>
        )}
      </div>
      {rel.revenueImpact && (
        <p className="font-mono text-[10px] text-amber-400 mt-0.5">
          Rev: {rel.revenueImpact}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-1">
        {rel.products.slice(0, 2).map((p) => (
          <span
            key={p}
            className="text-[8px] px-1 py-px rounded font-mono"
            style={{
              backgroundColor: side === 'supplier' ? '#6a2a2a' : '#2a5a2a',
              color: '#ccc',
            }}
          >
            {truncate(p, 18)}
          </span>
        ))}
        {rel.products.length > 2 && (
          <span className="text-[8px] text-gray-500 font-mono">
            +{rel.products.length - 2}
          </span>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------

export default function SupplyChainMap({ company }: { company: Company }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number; side: string }[]
  >([]);

  // Categorise relationships
  const { suppliers, customers, competitors, partners } = useMemo(() => {
    const s: (Company['relationships'][number] & { target?: Company })[] = [];
    const c: (Company['relationships'][number] & { target?: Company })[] = [];
    const comp: (Company['relationships'][number] & { target?: Company })[] = [];
    const p: (Company['relationships'][number] & { target?: Company })[] = [];

    for (const rel of company.relationships) {
      const target = allCompanies.find(
        (co) => co.id === rel.targetId || co.ticker === rel.targetId
      );
      const enriched = { ...rel, target };
      switch (rel.type) {
        case 'supplier':
          s.push(enriched);
          break;
        case 'customer':
          c.push(enriched);
          break;
        case 'competitor':
          comp.push(enriched);
          break;
        case 'partner':
          p.push(enriched);
          break;
      }
    }

    s.sort((a, b) => parseRevImpact(b.revenueImpact) - parseRevImpact(a.revenueImpact));
    c.sort((a, b) => parseRevImpact(b.revenueImpact) - parseRevImpact(a.revenueImpact));
    return { suppliers: s, customers: c, competitors: comp, partners: p };
  }, [company]);

  // Draw connection lines
  useEffect(() => {
    function calc() {
      const container = containerRef.current;
      const center = document.getElementById('scm-center');
      if (!container || !center) return;

      const cRect = container.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const cx = centerRect.left + centerRect.width / 2 - cRect.left;
      const cy = centerRect.top + centerRect.height / 2 - cRect.top;

      const newLines: typeof lines = [];

      document.querySelectorAll('[data-scm-supplier]').forEach((el) => {
        const r = el.getBoundingClientRect();
        newLines.push({
          x1: r.right - cRect.left,
          y1: r.top + r.height / 2 - cRect.top,
          x2: centerRect.left - cRect.left,
          y2: cy,
          side: 'supplier',
        });
      });

      document.querySelectorAll('[data-scm-customer]').forEach((el) => {
        const r = el.getBoundingClientRect();
        newLines.push({
          x1: centerRect.right - cRect.left,
          y1: cy,
          x2: r.left - cRect.left,
          y2: r.top + r.height / 2 - cRect.top,
          side: 'customer',
        });
      });

      setLines(newLines);
    }

    calc();
    window.addEventListener('resize', calc);
    const timer = setTimeout(calc, 200);
    return () => {
      window.removeEventListener('resize', calc);
      clearTimeout(timer);
    };
  }, [company]);

  const topProducts = company.products.slice(0, 4);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1a1a2e', color: '#e0e0e0' }}
    >
      {/* ── HEADER BAR ── */}
      <div
        className="px-4 py-2 flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: '#ff8c00' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-black text-black tracking-wide">
            SUPPLY CHAIN ANALYSIS
          </span>
          <span className="font-mono text-xs font-bold text-black/70">
            {company.ticker}
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] text-black/80">
          <span>{company.sector.toUpperCase()}</span>
          <span>{company.subSector}</span>
          <span>MKT CAP: {company.marketCap.toUpperCase()}</span>
        </div>
      </div>

      {/* ── COUNTS BAR ── */}
      <div
        className="px-4 py-1.5 flex items-center gap-6 font-mono text-[10px] border-b"
        style={{ backgroundColor: '#12122a', borderColor: '#2a2a4a' }}
      >
        <span>
          <span style={{ color: '#ff6b6b' }}>■</span> {suppliers.length} SUPPLIERS
        </span>
        <span>
          <span style={{ color: '#51cf66' }}>■</span> {customers.length} CUSTOMERS
        </span>
        <span>
          <span style={{ color: '#e8a945' }}>■</span> {competitors.length} COMPETITORS
        </span>
        <span>
          <span style={{ color: '#4fc3f7' }}>■</span> {partners.length} PARTNERS
        </span>
        <span className="ml-auto text-gray-500">
          {company.relationships.length} TOTAL LINKS
        </span>
      </div>

      {/* ── MAIN MAP ── */}
      <div ref={containerRef} className="relative px-4 py-6">
        {/* SVG connection lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
          style={{ zIndex: 0 }}
        >
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={l.side === 'supplier' ? '#0d6e7e' : '#0d7e5e'}
              strokeWidth={1}
              opacity={0.35}
            />
          ))}
        </svg>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-2 items-start">
          {/* ── SUPPLIERS COLUMN ── */}
          <div>
            <div
              className="font-mono text-[10px] font-bold px-2 py-1 mb-2 rounded"
              style={{ backgroundColor: '#3a1515', color: '#ff6b6b' }}
            >
              ◀ SUPPLIERS ({suppliers.length}) — SORTED BY COST EXPOSURE
            </div>
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {suppliers.map((rel, i) => (
                <div key={i} data-scm-supplier>
                  <RelCard rel={rel} target={rel.target} side="supplier" />
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="font-mono text-[10px] text-gray-600 px-2">
                  No supplier relationships recorded
                </p>
              )}
            </div>
          </div>

          {/* ── CENTER COMPANY BOX ── */}
          <div className="flex items-center justify-center">
            <div
              id="scm-center"
              className="rounded-lg px-5 py-4 w-full lg:w-72 shadow-2xl"
              style={{
                backgroundColor: '#0d4f5a',
                border: '2px solid #17a2b8',
                boxShadow: '0 0 30px rgba(13,79,90,0.5)',
              }}
            >
              <div className="text-center mb-3">
                <div
                  className="font-mono text-lg font-black tracking-wide"
                  style={{ color: '#7fdbff' }}
                >
                  {company.name}
                </div>
                <div className="font-mono text-xs text-cyan-300 mt-0.5">
                  {company.ticker} &nbsp;|&nbsp; {company.role.toUpperCase()}
                </div>
              </div>

              <div
                className="rounded px-3 py-2 space-y-1.5 font-mono text-[10px]"
                style={{ backgroundColor: '#0a3a42' }}
              >
                <div className="flex justify-between">
                  <span className="text-gray-400">REVENUE</span>
                  <span className="text-amber-400 font-bold">{company.revenue.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EMPLOYEES</span>
                  <span className="text-gray-200">{company.employees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SECTOR</span>
                  <span className="text-gray-200 text-right">{company.sector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">SUB-SECTOR</span>
                  <span className="text-gray-200 text-right truncate ml-2">
                    {company.subSector}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">HQ</span>
                  <span className="text-gray-200 text-right truncate ml-2">
                    {company.headquarters}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">FOUNDED</span>
                  <span className="text-gray-200">{company.founded}</span>
                </div>
              </div>

              {/* Key products */}
              <div className="mt-3">
                <p className="font-mono text-[9px] text-gray-500 mb-1">KEY PRODUCTS</p>
                <div className="flex flex-wrap gap-1">
                  {topProducts.map((p) => (
                    <span
                      key={p.name}
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: '#17a2b8', color: '#fff' }}
                    >
                      {truncate(p.name, 16)} ({p.revenueShare}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Revenue segments mini-bar */}
              <div className="mt-3">
                <p className="font-mono text-[9px] text-gray-500 mb-1">REVENUE SEGMENTS</p>
                <div className="flex rounded overflow-hidden h-2">
                  {company.revenue.segments.map((seg, i) => {
                    const colors = ['#4F8FBF', '#6CB4A8', '#E8A945', '#D97171', '#5CB88A', '#7C5CFC'];
                    return (
                      <div
                        key={seg.name}
                        title={`${seg.name}: ${seg.percentage}%`}
                        style={{
                          width: `${seg.percentage}%`,
                          backgroundColor: colors[i % colors.length],
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-2 mt-1">
                  {company.revenue.segments.slice(0, 4).map((seg, i) => {
                    const colors = ['#4F8FBF', '#6CB4A8', '#E8A945', '#D97171'];
                    return (
                      <span key={seg.name} className="text-[7px] font-mono text-gray-400">
                        <span style={{ color: colors[i % colors.length] }}>●</span>{' '}
                        {truncate(seg.name, 12)} {seg.percentage}%
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── CUSTOMERS COLUMN ── */}
          <div>
            <div
              className="font-mono text-[10px] font-bold px-2 py-1 mb-2 rounded"
              style={{ backgroundColor: '#152a15', color: '#51cf66' }}
            >
              CUSTOMERS ({customers.length}) — SORTED BY REVENUE EXPOSURE ▶
            </div>
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {customers.map((rel, i) => (
                <div key={i} data-scm-customer>
                  <RelCard rel={rel} target={rel.target} side="customer" />
                </div>
              ))}
              {customers.length === 0 && (
                <p className="font-mono text-[10px] text-gray-600 px-2">
                  No customer relationships recorded
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM: COMPETITORS & PARTNERS ── */}
      {(competitors.length > 0 || partners.length > 0) && (
        <div
          className="px-4 py-3 border-t"
          style={{ backgroundColor: '#12122a', borderColor: '#2a2a4a' }}
        >
          {competitors.length > 0 && (
            <div className="mb-2">
              <span className="font-mono text-[10px] font-bold text-amber-500 mr-3">
                COMPETITORS ({competitors.length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {competitors.map((rel, i) => {
                  const target = rel.target;
                  return (
                    <Link
                      key={i}
                      href={`/company/${target?.ticker ?? rel.targetId}`}
                      className="font-mono text-[10px] px-2 py-1 rounded hover:brightness-125 transition-all"
                      style={{
                        backgroundColor: '#3a2a10',
                        border: '1px solid #5a4020',
                        color: '#e8a945',
                      }}
                    >
                      {target?.ticker ?? rel.targetId}
                      {rel.revenueImpact && (
                        <span className="text-[8px] text-gray-500 ml-1">
                          {rel.revenueImpact}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          {partners.length > 0 && (
            <div>
              <span className="font-mono text-[10px] font-bold text-sky-400 mr-3">
                PARTNERS ({partners.length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {partners.map((rel, i) => {
                  const target = rel.target;
                  return (
                    <Link
                      key={i}
                      href={`/company/${target?.ticker ?? rel.targetId}`}
                      className="font-mono text-[10px] px-2 py-1 rounded hover:brightness-125 transition-all"
                      style={{
                        backgroundColor: '#102030',
                        border: '1px solid #204060',
                        color: '#4fc3f7',
                      }}
                    >
                      {target?.ticker ?? rel.targetId}
                      {rel.revenueImpact && (
                        <span className="text-[8px] text-gray-500 ml-1">
                          {rel.revenueImpact}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FOOTER STATUS BAR ── */}
      <div
        className="px-4 py-1 flex items-center justify-between font-mono text-[9px] text-gray-500 border-t"
        style={{ backgroundColor: '#0f0f20', borderColor: '#2a2a4a' }}
      >
        <span>CHAINFLOW TERMINAL v2.0</span>
        <span>
          {company.name} ({company.ticker}) — {company.relationships.length} RELATIONSHIPS
        </span>
        <span>SUPPLY CHAIN MAP</span>
      </div>
    </div>
  );
}
