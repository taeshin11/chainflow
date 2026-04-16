'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, AlertTriangle, ExternalLink, Shield, Globe, Bitcoin,
  Building2, BookOpen, Loader2, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, MessageSquare, Newspaper, RefreshCw,
} from 'lucide-react';

type TabId = 'social' | 'crypto' | 'sanctions' | 'corporate' | 'guide';

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number, d = 6) {
  if (n === 0) return '0';
  if (n < 0.000001) return n.toExponential(3);
  return n.toLocaleString('en-US', { maximumFractionDigits: d });
}
function truncateHash(h: string, c = 8) {
  return h.length <= c * 2 + 3 ? h : `${h.slice(0, c)}...${h.slice(-c)}`;
}
function explorerAddr(chain: 'eth' | 'btc', addr: string) {
  return chain === 'eth'
    ? `https://etherscan.io/address/${addr}`
    : `https://www.blockchain.com/explorer/addresses/btc/${addr}`;
}
function explorerTx(chain: 'eth' | 'btc', hash: string) {
  return chain === 'eth'
    ? `https://etherscan.io/tx/${hash}`
    : `https://www.blockchain.com/explorer/transactions/btc/${hash}`;
}

function LoadingCard({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center text-cf-text-secondary">
      <Loader2 className="w-5 h-5 animate-spin text-cf-primary" />
      <span className="text-sm">{msg}</span>
    </div>
  );
}
function ErrorCard({ msg }: { msg: string }) {
  return (
    <div className="cf-card border-red-200 bg-red-50 flex items-start gap-3">
      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p className="text-sm text-red-700">{msg}</p>
    </div>
  );
}

// ── SENTIMENT colors ────────────────────────────────────────────────────────────
const SENTIMENT_STYLE: Record<string, string> = {
  hawkish: 'bg-red-100 text-red-700',
  dovish: 'bg-blue-100 text-blue-700',
  bullish: 'bg-green-100 text-green-700',
  bearish: 'bg-orange-100 text-orange-700',
  neutral: 'bg-gray-100 text-gray-600',
};
const SENTIMENT_LABEL: Record<string, string> = {
  hawkish: '매파', dovish: '비둘기파', bullish: '강세', bearish: '약세', neutral: '중립',
};

// ── X (Twitter) logo SVG ───────────────────────────────────────────────────────
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label="X">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ── Tab: Social (key figures) ─────────────────────────────────────────────────
interface SocialEntry {
  person: string; role: string; flag: string; tag: string;
  title: string; summary: string; source: string; url: string;
  publishedAt: string; sentiment: string; impact: string;
  istweet?: boolean;
  isFed?: boolean;
  votingMember?: boolean;
  cascade?: string[];
}

function CascadeChain({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-cf-border">
      <p className="text-xs text-cf-text-secondary mb-1 font-medium">📡 파급 효과</p>
      <div className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{item}</span>
            {i < items.length - 1 && <span className="text-slate-300 text-xs">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function SocialTab() {
  const [data, setData] = useState<SocialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [fedOnly, setFedOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/osint/social');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '로드 실패');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const baseData = fedOnly ? data.filter(e => e.isFed) : data;
  const people = ['all', ...Array.from(new Set<string>(baseData.map(e => e.tag)))];
  const filtered = filter === 'all' ? baseData : baseData.filter(e => e.tag === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-cf-text-secondary">
          주요 인물 발언·X 포스트 자동 수집 · 30분 캐시
        </p>
        <button onClick={load} className="flex items-center gap-1 text-xs text-cf-primary hover:underline">
          <RefreshCw className="w-3 h-3" /> 새로고침
        </button>
      </div>

      {/* Fed filter toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { setFedOnly(false); setFilter('all'); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!fedOnly ? 'bg-cf-primary text-white' : 'bg-white border border-cf-border text-cf-text-secondary'}`}
        >
          전체 인물
        </button>
        <button
          onClick={() => { setFedOnly(true); setFilter('all'); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${fedOnly ? 'bg-blue-600 text-white' : 'bg-white border border-cf-border text-cf-text-secondary'}`}
        >
          🏦 연준(Fed) 위원만
        </button>
      </div>

      {/* Person filter chips */}
      <div className="flex flex-wrap gap-2">
        {people.map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === p ? 'bg-cf-primary text-white' : 'bg-white border border-cf-border text-cf-text-secondary hover:border-cf-primary/40'
            }`}
          >
            {p === 'all' ? '전체' : p}
          </button>
        ))}
      </div>

      {loading && <LoadingCard msg="주요 인물 발언 수집 중..." />}
      {error && <ErrorCard msg={error} />}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-10 text-cf-text-secondary text-sm">현재 관련 뉴스 없음</div>
      )}

      <div className="grid gap-3">
        {filtered.map((entry, i) => (
          <a
            key={i}
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cf-card hover:border-cf-primary/30 hover:shadow-md transition-all group block"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{entry.flag}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-cf-text-primary group-hover:text-cf-primary">
                      {entry.person}
                    </p>
                    {entry.isFed && entry.votingMember && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">투표권</span>
                    )}
                    {entry.isFed && !entry.votingMember && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-medium">비투표</span>
                    )}
                  </div>
                  <p className="text-xs text-cf-text-secondary">{entry.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {entry.impact === 'high' && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">HIGH</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SENTIMENT_STYLE[entry.sentiment] ?? SENTIMENT_STYLE.neutral}`}>
                  {SENTIMENT_LABEL[entry.sentiment] ?? entry.sentiment}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-cf-text-primary leading-snug mb-1">{entry.title}</p>
            {entry.summary && (
              <p className="text-xs text-cf-text-secondary line-clamp-2">{entry.summary}</p>
            )}
            {/* Cascade */}
            {entry.cascade && entry.cascade.length > 0 && (
              <CascadeChain items={entry.cascade} />
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-cf-text-secondary">
              {entry.istweet
                ? <XLogo className="w-3 h-3 text-black" />
                : <Newspaper className="w-3 h-3" />
              }
              <span className={entry.istweet ? 'text-black font-medium' : ''}>
                {entry.istweet ? `X (트위터) · ${entry.source}` : entry.source}
              </span>
              <span>·</span>
              <span>{new Date(entry.publishedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Crypto (notable wallets + search) ────────────────────────────────────
const NOTABLE_WALLETS = [
  { label: 'Satoshi Genesis', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'btc' as const, note: '비트코인 최초 블록 채굴 주소' },
  { label: 'Binance Cold', address: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo', chain: 'btc' as const, note: '바이낸스 콜드 월렛' },
  { label: 'Ethereum Foundation', address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe', chain: 'eth' as const, note: '이더리움 재단 공식 주소' },
  { label: 'Vitalik Buterin', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chain: 'eth' as const, note: 'Vitalik 개인 지갑' },
  { label: 'US DOJ Seized BTC', address: '1HQ3Go3ggs8pFnXuHVHRytPCq5fGG8Hbhx', chain: 'btc' as const, note: '미 법무부 압수 비트코인' },
];

interface CryptoResult {
  chain: 'eth' | 'btc'; address: string; balance: number;
  totalReceived: number; totalSent: number; txCount: number;
  recentTxs: Array<{ hash: string; time: string; value: number; direction: 'in' | 'out' }>;
  riskFlags: string[]; error?: string;
}

function CryptoTab() {
  const [walletData, setWalletData] = useState<Record<string, CryptoResult | 'loading' | 'error'>>({});
  const [address, setAddress] = useState('');
  const [chainParam, setChainParam] = useState<'auto' | 'eth' | 'btc'>('auto');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<CryptoResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Auto-load notable wallets
  useEffect(() => {
    NOTABLE_WALLETS.forEach(async (w) => {
      setWalletData(prev => ({ ...prev, [w.address]: 'loading' }));
      try {
        const res = await fetch(`/api/osint/crypto?address=${encodeURIComponent(w.address)}&chain=${w.chain}`);
        const data = await res.json();
        setWalletData(prev => ({ ...prev, [w.address]: data.error ? 'error' : data }));
      } catch {
        setWalletData(prev => ({ ...prev, [w.address]: 'error' }));
      }
    });
  }, []);

  const search = useCallback(async () => {
    if (!address.trim()) return;
    setSearching(true); setSearchError(null); setSearchResult(null);
    try {
      const res = await fetch(`/api/osint/crypto?address=${encodeURIComponent(address.trim())}&chain=${chainParam}`);
      const data = await res.json();
      if (data.error) setSearchError(data.error); else setSearchResult(data);
    } catch { setSearchError('네트워크 오류'); }
    finally { setSearching(false); }
  }, [address, chainParam]);

  return (
    <div className="space-y-6">
      {/* Notable wallets */}
      <div>
        <h3 className="text-sm font-semibold text-cf-text-primary mb-3 flex items-center gap-2">
          <Bitcoin className="w-4 h-4 text-amber-500" /> 주목할 지갑
        </h3>
        <div className="grid gap-3">
          {NOTABLE_WALLETS.map((w) => {
            const d = walletData[w.address];
            const result = typeof d === 'object' && d !== null ? d : null;
            const ticker = w.chain === 'eth' ? 'ETH' : 'BTC';
            return (
              <div key={w.address} className="cf-card">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${w.chain === 'eth' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {ticker}
                      </span>
                      <p className="text-sm font-semibold text-cf-text-primary">{w.label}</p>
                    </div>
                    <p className="text-xs text-cf-text-secondary mt-0.5">{w.note}</p>
                  </div>
                  <a
                    href={explorerAddr(w.chain, w.address)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-cf-primary hover:text-cf-primary/70"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="font-mono text-xs text-cf-text-secondary bg-gray-50 rounded px-2 py-1 mb-2 truncate">{w.address}</p>
                {d === 'loading' && (
                  <div className="flex items-center gap-2 text-xs text-cf-text-secondary">
                    <Loader2 className="w-3 h-3 animate-spin" /> 잔고 조회 중...
                  </div>
                )}
                {d === 'error' && <p className="text-xs text-red-500">조회 실패</p>}
                {result && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '잔고', value: `${fmt(result.balance)} ${ticker}` },
                      { label: '거래 수', value: result.txCount.toLocaleString() },
                      { label: '리스크', value: result.riskFlags.length > 0 ? '⚠️ ' + result.riskFlags[0] : '✅ 없음' },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center bg-gray-50 rounded p-2">
                        <p className="text-xs text-cf-text-secondary">{label}</p>
                        <p className="text-xs font-semibold text-cf-text-primary mt-0.5 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="cf-card space-y-3">
        <h3 className="text-sm font-semibold text-cf-text-primary">직접 주소 분석</h3>
        <div className="flex gap-2">
          <input
            type="text" value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="지갑 주소 (ETH: 0x... / BTC: 1...bc1...)"
            className="cf-input flex-1 px-3 py-2 rounded-lg border border-cf-border text-sm"
          />
          <button onClick={search} disabled={searching || !address.trim()}
            className="cf-btn-primary px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            분석
          </button>
        </div>
        <div className="flex gap-3 text-sm">
          {(['auto', 'eth', 'btc'] as const).map(c => (
            <label key={c} className="flex items-center gap-1 cursor-pointer">
              <input type="radio" checked={chainParam === c} onChange={() => setChainParam(c)} className="accent-cf-primary" />
              {c === 'auto' ? '자동' : c.toUpperCase()}
            </label>
          ))}
        </div>
        {searching && <LoadingCard msg="블록체인 조회 중..." />}
        {searchError && <ErrorCard msg={searchError} />}
        {searchResult && (
          <div className="space-y-2 pt-2 border-t border-cf-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: '잔고', value: `${fmt(searchResult.balance)} ${searchResult.chain.toUpperCase()}` },
                { label: '총 수신', value: fmt(searchResult.totalReceived) },
                { label: '총 송신', value: fmt(searchResult.totalSent) },
                { label: '거래 수', value: searchResult.txCount.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="text-center bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-cf-text-secondary">{label}</p>
                  <p className="text-sm font-semibold font-mono mt-1">{value}</p>
                </div>
              ))}
            </div>
            {searchResult.riskFlags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                {searchResult.riskFlags.map(f => (
                  <span key={f} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{f}</span>
                ))}
              </div>
            )}
            {searchResult.riskFlags.length === 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" /> 위험 신호 없음
              </div>
            )}
            {searchResult.recentTxs?.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-cf-text-secondary border-b border-cf-border">
                      <th className="text-left py-2 pr-3">해시</th>
                      <th className="text-left py-2 pr-3">시간</th>
                      <th className="text-right py-2 pr-3">금액</th>
                      <th className="text-center py-2">방향</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResult.recentTxs.map(tx => (
                      <tr key={tx.hash} className="border-b border-cf-border/40">
                        <td className="py-2 pr-3">
                          <a href={explorerTx(searchResult.chain, tx.hash)} target="_blank" rel="noopener noreferrer"
                            className="font-mono text-cf-primary hover:underline">{truncateHash(tx.hash)}</a>
                        </td>
                        <td className="py-2 pr-3 text-cf-text-secondary">{new Date(tx.time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-2 pr-3 text-right font-mono">{fmt(tx.value)}</td>
                        <td className="py-2 text-center">
                          {tx.direction === 'in'
                            ? <span className="text-green-600 flex items-center justify-center gap-0.5"><ArrowDownRight className="w-3 h-3" />수신</span>
                            : <span className="text-red-500 flex items-center justify-center gap-0.5"><ArrowUpRight className="w-3 h-3" />송신</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Sanctions ────────────────────────────────────────────────────────────
interface SdnEntry { name: string; type: string; program: string; remarks: string; entNum: string }
interface SanctionsGroup { label: string; color: string; entries: SdnEntry[] }

const PROG_COLOR: Record<string, string> = {
  RUSSIA: 'red', IRAN: 'orange', DPRK: 'yellow', SDGT: 'red', CYBER2: 'purple', CHINA: 'blue',
};
const BADGE_STYLE: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
};

function SanctionsTab() {
  const [groups, setGroups] = useState<Record<string, SanctionsGroup>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SdnEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/osint/sanctions?featured=true')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setGroups(d.groups ?? {});
        setTotal(d.totalEntries ?? 0);
        const keys = Object.keys(d.groups ?? {});
        if (keys.length) setActiveGroup(keys[0]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchResult(null);
    try {
      const res = await fetch(`/api/osint/sanctions?q=${encodeURIComponent(query.trim())}`);
      const d = await res.json();
      setSearchResult(d.matches ?? []);
    } catch { /* silent */ }
    finally { setSearching(false); }
  }, [query]);

  const currentGroup = activeGroup ? groups[activeGroup] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-cf-text-secondary">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" />
          <span>OFAC SDN 명단 · 총 {total.toLocaleString()}개 제재 대상</span>
        </div>
        <span className="text-green-600 font-medium">24시간 자동 갱신</span>
      </div>

      {loading && <LoadingCard msg="OFAC 제재 명단 로딩 중 (최초 로딩은 시간이 걸림)..." />}
      {error && <ErrorCard msg={error} />}

      {!loading && !error && (
        <>
          {/* Group tabs */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(groups).map(([key, g]) => (
              <button key={key} onClick={() => setActiveGroup(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  activeGroup === key
                    ? `${BADGE_STYLE[PROG_COLOR[key] ?? 'red']} font-semibold`
                    : 'bg-white border-cf-border text-cf-text-secondary hover:border-cf-primary/30'
                }`}>
                {g.label} ({g.entries.length})
              </button>
            ))}
          </div>

          {/* Entries */}
          {currentGroup && (
            <div className="cf-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-cf-text-secondary border-b border-cf-border">
                    <th className="text-left py-2 pr-4 font-medium">이름</th>
                    <th className="text-left py-2 pr-4 font-medium">유형</th>
                    <th className="text-left py-2 pr-4 font-medium">프로그램</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGroup.entries.map((e, i) => (
                    <tr key={i} className="border-b border-cf-border/40 hover:bg-red-50/20">
                      <td className="py-2 pr-4 font-medium text-cf-text-primary text-xs">{e.name}</td>
                      <td className="py-2 pr-4 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs border ${BADGE_STYLE[PROG_COLOR[activeGroup ?? ''] ?? 'red']}`}>
                          {e.type || '-'}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-xs text-cf-text-secondary">
                        {(e as {programLabel?: string}).programLabel || e.program}
                      </td>
                      <td className="py-2 text-xs text-cf-text-secondary max-w-[200px] hidden md:table-cell">
                        {(e as {remarks?: string}).remarks || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Search */}
          <div className="cf-card space-y-3">
            <p className="text-sm font-medium text-cf-text-primary">인물/기업 직접 검색</p>
            <div className="flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="예: PUTIN, ROSNEFT, SAMSUNG"
                className="cf-input flex-1 px-3 py-2 rounded-lg border border-cf-border text-sm"
              />
              <button onClick={search} disabled={searching || !query.trim()}
                className="cf-btn-primary px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                검색
              </button>
            </div>
            {searchResult !== null && (
              searchResult.length === 0
                ? <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4" /> 제재 명단에 없음 ✓
                  </div>
                : <div className="space-y-2">
                    {searchResult.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-cf-text-primary">{e.name}</p>
                          <p className="text-xs text-cf-text-secondary">
                            {(e as {programLabel?: string}).programLabel || e.program} · {e.type}
                          </p>
                          {(e as {remarks?: string}).remarks && (
                            <p className="text-xs text-cf-text-secondary mt-0.5">{(e as {remarks?: string}).remarks}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tab: Corporate ────────────────────────────────────────────────────────────
const FEATURED_QUERIES = [
  { label: 'Gazprom', desc: '러시아 국영 가스 기업' },
  { label: 'Wagner Group', desc: '러시아 민간 군사 기업' },
  { label: 'Alibaba', desc: '중국 기술 대기업' },
  { label: 'Huawei', desc: '미국 제재 대상 통신 기업' },
];

interface CorporateCompany {
  name: string; number: string; jurisdiction: string;
  incorporated: string | null; dissolved: string | null;
  type: string | null; address: string | null; url: string;
}
interface CorporateResult { companies: CorporateCompany[]; total: number; source: string; error?: string }

const J_FLAGS: Record<string, string> = {
  us: '🇺🇸', gb: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', jp: '🇯🇵', cn: '🇨🇳',
  kr: '🇰🇷', sg: '🇸🇬', hk: '🇭🇰', ch: '🇨🇭', ky: '🇰🇾', vg: '🇻🇬',
  pa: '🇵🇦', bm: '🇧🇲', ie: '🇮🇪', nl: '🇳🇱', lu: '🇱🇺', cy: '🇨🇾',
};
function jFlag(code: string) { return J_FLAGS[code?.slice(0, 2).toLowerCase()] ?? '🌐'; }

function CorporateTab() {
  const [results, setResults] = useState<Record<string, CorporateResult>>({});
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<CorporateResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState<string>(FEATURED_QUERIES[0].label);

  useEffect(() => {
    FEATURED_QUERIES.forEach(async ({ label }) => {
      setLoadingKeys(prev => { const s = new Set<string>(Array.from(prev)); s.add(label); return s; });
      try {
        const res = await fetch(`/api/osint/corporate?q=${encodeURIComponent(label)}`);
        const d = await res.json();
        setResults(prev => ({ ...prev, [label]: d }));
      } catch { /* silent */ }
      finally { setLoadingKeys(prev => { const s = new Set<string>(Array.from(prev)); s.delete(label); return s; }); }
    });
  }, []);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchResult(null);
    try {
      const res = await fetch(`/api/osint/corporate?q=${encodeURIComponent(query.trim())}`);
      const d = await res.json();
      setSearchResult(d);
      setActive('__search__');
    } catch { /* silent */ }
    finally { setSearching(false); }
  }, [query]);

  const activeResult = active === '__search__' ? searchResult : (results[active] ?? null);
  const isLoading = active !== '__search__' && loadingKeys.has(active);

  return (
    <div className="space-y-4">
      <div className="text-xs text-cf-text-secondary">
        OpenCorporates · 전 세계 {'>'}200개국 기업 등록 정보
      </div>

      {/* Featured tabs */}
      <div className="flex flex-wrap gap-2">
        {FEATURED_QUERIES.map(({ label, desc }) => (
          <button key={label} onClick={() => setActive(label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              active === label ? 'bg-cf-primary text-white border-cf-primary' : 'bg-white border-cf-border text-cf-text-secondary hover:border-cf-primary/30'
            }`}>
            {label}
            <span className="hidden md:inline text-xs opacity-70"> · {desc}</span>
          </button>
        ))}
      </div>

      {isLoading && <LoadingCard msg="기업 정보 조회 중..." />}
      {!isLoading && activeResult && (
        <div className="space-y-3">
          <p className="text-xs text-cf-text-secondary">{activeResult.total?.toLocaleString()}건 · 상위 5건 표시</p>
          {activeResult.companies?.length === 0 && (
            <div className="text-center py-8 text-cf-text-secondary text-sm">검색 결과 없음</div>
          )}
          {activeResult.companies?.map((c, i) => (
            <div key={i} className="cf-card space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cf-text-primary">{c.name}</p>
                  <p className="text-xs text-cf-text-secondary mt-0.5">
                    {jFlag(c.jurisdiction)} {c.jurisdiction?.toUpperCase()} {c.number ? `· #${c.number}` : ''}
                  </p>
                </div>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-cf-primary">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-cf-text-secondary">
                {c.type && <span>유형: {c.type}</span>}
                {c.incorporated && <span>설립: {c.incorporated}</span>}
                {c.dissolved && <span className="text-red-600">해산: {c.dissolved}</span>}
              </div>
              {c.address && <p className="text-xs text-cf-text-secondary">📍 {c.address}</p>}
              {(c as {note?: string}).note && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mt-1">
                  💡 {(c as {note?: string}).note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="cf-card space-y-3">
        <p className="text-sm font-medium">기업 직접 검색</p>
        <div className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="기업명 (예: Samsung, Baidu, Rosneft)"
            className="cf-input flex-1 px-3 py-2 rounded-lg border border-cf-border text-sm"
          />
          <button onClick={search} disabled={searching || !query.trim()}
            className="cf-btn-primary px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-1">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            검색
          </button>
        </div>
        <div className="flex gap-2">
          <a href={`https://offshoreleaks.icij.org/search?q=${encodeURIComponent(query)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cf-primary border border-cf-primary/30 rounded px-2.5 py-1 hover:bg-cf-primary/5">
            <ExternalLink className="w-3 h-3" /> ICIJ Offshore Leaks
          </a>
          <a href={`https://opencorporates.com/companies?q=${encodeURIComponent(query)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cf-primary border border-cf-primary/30 rounded px-2.5 py-1 hover:bg-cf-primary/5">
            <Globe className="w-3 h-3" /> OpenCorporates
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Guide ────────────────────────────────────────────────────────────────
function GuideTab() {
  const methods = [
    { icon: <MessageSquare className="w-5 h-5 text-sky-500" />, title: '주요 인물 발언 추적', desc: '트럼프·파월·머스크 등 시장 영향력 있는 인물의 최근 발언을 뉴스 피드에서 자동 수집합니다. 발언 성격(매파/비둘기파/강세/약세)을 AI가 자동 분류합니다.', links: [{ label: 'X.com (Twitter)', url: 'https://x.com' }] },
    { icon: <Bitcoin className="w-5 h-5 text-amber-500" />, title: '블록체인 자금 추적', desc: '주목할 지갑(사토시, 바이낸스, Vitalik 등)의 실시간 잔고와 거래를 자동으로 표시합니다. 특정 지갑 분석도 직접 입력해 추적 가능합니다.', links: [{ label: 'Etherscan', url: 'https://etherscan.io' }, { label: 'Blockchain.com', url: 'https://www.blockchain.com/explorer' }] },
    { icon: <Shield className="w-5 h-5 text-red-500" />, title: 'OFAC 제재 명단', desc: '미 재무부 OFAC의 SDN(특별지정국민) 명단 전체를 매일 갱신합니다. 러시아·이란·북한·중국·테러 프로그램별로 분류해 자동 표시됩니다.', links: [{ label: 'OFAC 공식', url: 'https://sanctionssearch.ofac.treas.gov' }] },
    { icon: <Building2 className="w-5 h-5 text-blue-500" />, title: '기업 구조 추적', desc: '주목할 기업(Gazprom, Huawei 등)의 글로벌 법인 등록 현황을 자동으로 표시합니다. 조세피난처 등록 법인, 쉘컴퍼니 구조 파악에 활용합니다.', links: [{ label: 'ICIJ Offshore Leaks', url: 'https://offshoreleaks.icij.org' }, { label: 'OpenCorporates', url: 'https://opencorporates.com' }] },
    { icon: <Globe className="w-5 h-5 text-green-500" />, title: '실물자산 추적', desc: '부동산·요트·전용기 소유자는 공개 등기/항적 데이터로 확인 가능합니다.', links: [{ label: 'Flightradar24', url: 'https://www.flightradar24.com' }, { label: 'MarineTraffic', url: 'https://www.marinetraffic.com' }] },
    { icon: <BookOpen className="w-5 h-5 text-purple-500" />, title: '공개 기록 활용', desc: 'SEC EDGAR(미국 공시), PACER(연방법원 기록), 각국 기업등기소를 통해 법적·재무 관계를 파악합니다.', links: [{ label: 'SEC EDGAR', url: 'https://www.sec.gov/edgar' }, { label: 'OpenSanctions', url: 'https://www.opensanctions.org' }] },
  ];
  return (
    <div className="space-y-4">
      <div className="cf-card bg-slate-50 border-slate-200">
        <p className="text-sm text-cf-text-secondary leading-relaxed">OSINT(Open Source Intelligence)는 공개 정보 수집·분석 방법론입니다. 금융범죄 수사·기업실사·저널리즘·규정준수에 활용됩니다.</p>
      </div>
      {methods.map(m => (
        <div key={m.title} className="cf-card space-y-3">
          <div className="flex items-center gap-3">{m.icon}<h3 className="font-semibold text-cf-text-primary">{m.title}</h3></div>
          <p className="text-sm text-cf-text-secondary leading-relaxed">{m.desc}</p>
          <div className="flex flex-wrap gap-2">
            {m.links.map(l => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cf-primary border border-cf-primary/30 rounded px-2.5 py-1 hover:bg-cf-primary/5 transition-colors">
                <ExternalLink className="w-3 h-3" />{l.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OSINTPage() {
  const [activeTab, setActiveTab] = useState<TabId>('social');

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'social', label: '인물 발언', icon: <MessageSquare className="w-4 h-4" />, badge: 'LIVE' },
    { id: 'crypto', label: '암호화폐', icon: <Bitcoin className="w-4 h-4" /> },
    { id: 'sanctions', label: 'OFAC 제재', icon: <Shield className="w-4 h-4" /> },
    { id: 'corporate', label: '기업 구조', icon: <Building2 className="w-4 h-4" /> },
    { id: 'guide', label: '조사 가이드', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <main className="min-h-screen bg-cf-background">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-300 uppercase tracking-widest">글로벌 정보 추적</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">실시간 자금·정보 추적</h1>
          <p className="text-slate-300 mb-5">주요 인물 발언 · 블록체인 지갑 · 국제 제재 · 기업 연결망 실시간 모니터링</p>
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 rounded-full px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-300 text-sm font-medium">교육·연구·합법적 조사 목적으로만 사용하세요</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-cf-border overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-cf-primary text-white shadow-sm' : 'text-cf-text-secondary hover:text-cf-text-primary hover:bg-cf-border/40'
              }`}>
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-green-100 text-green-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'social' && <SocialTab />}
        {activeTab === 'crypto' && <CryptoTab />}
        {activeTab === 'sanctions' && <SanctionsTab />}
        {activeTab === 'corporate' && <CorporateTab />}
        {activeTab === 'guide' && <GuideTab />}
      </div>
    </main>
  );
}
