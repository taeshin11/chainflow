'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  AlertTriangle,
  ExternalLink,
  Shield,
  Globe,
  Bitcoin,
  Building2,
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ── TypeScript interfaces ──────────────────────────────────────────────────────

interface CryptoTx {
  hash: string;
  time: string;
  value: number;
  direction: 'in' | 'out';
}

interface CryptoResult {
  chain: 'eth' | 'btc';
  address: string;
  balance: number;
  balanceUsd: null;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  recentTxs: CryptoTx[];
  riskFlags: string[];
  error?: string;
}

interface SanctionMatch {
  name: string;
  type: string;
  program: string;
  remarks: string;
  entNum: string;
}

interface SanctionsResult {
  matches: SanctionMatch[];
  total: number;
  source: string;
  updatedAt: string;
  error?: string;
}

interface CorporateCompany {
  name: string;
  number: string;
  jurisdiction: string;
  incorporated: string | null;
  dissolved: string | null;
  type: string | null;
  address: string | null;
  url: string;
}

interface CorporateResult {
  companies: CorporateCompany[];
  total: number;
  source: string;
  error?: string;
}

type TabId = 'crypto' | 'sanctions' | 'corporate' | 'guide';

// ── Jurisdiction flag map ──────────────────────────────────────────────────────
const jurisdictionFlags: Record<string, string> = {
  us: '🇺🇸', gb: '🇬🇧', de: '🇩🇪', fr: '🇫🇷', jp: '🇯🇵', cn: '🇨🇳',
  kr: '🇰🇷', ca: '🇨🇦', au: '🇦🇺', sg: '🇸🇬', hk: '🇭🇰', nl: '🇳🇱',
  ch: '🇨🇭', se: '🇸🇪', no: '🇳🇴', dk: '🇩🇰', fi: '🇫🇮', ie: '🇮🇪',
  lu: '🇱🇺', ky: '🇰🇾', bm: '🇧🇲', vg: '🇻🇬', pa: '🇵🇦', li: '🇱🇮',
  mc: '🇲🇨', je: '🇯🇪', gg: '🇬🇬', im: '🇮🇲', mt: '🇲🇹', cy: '🇨🇾',
};

function getJurisdictionFlag(code: string): string {
  const lower = code?.toLowerCase() ?? '';
  // jurisdiction codes may be like "gb_england_wales" — take first 2 chars
  const iso2 = lower.slice(0, 2);
  return jurisdictionFlags[iso2] ?? '🌐';
}

// ── Helper: truncate hash ──────────────────────────────────────────────────────
function truncateHash(hash: string, chars = 8): string {
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

// ── Explorer URL ───────────────────────────────────────────────────────────────
function getExplorerTxUrl(chain: 'eth' | 'btc', hash: string): string {
  if (chain === 'eth') return `https://etherscan.io/tx/${hash}`;
  return `https://www.blockchain.com/explorer/transactions/btc/${hash}`;
}

function getExplorerAddressUrl(chain: 'eth' | 'btc', address: string): string {
  if (chain === 'eth') return `https://etherscan.io/address/${address}`;
  return `https://www.blockchain.com/explorer/addresses/btc/${address}`;
}

// ── Number formatting ──────────────────────────────────────────────────────────
function fmt(n: number, decimals = 6): string {
  if (n === 0) return '0';
  if (n < 0.000001) return n.toExponential(3);
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="cf-card border-red-200 bg-red-50 flex items-start gap-3 mt-4">
      <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <div className="cf-card flex items-center gap-3 mt-4">
      <Loader2 className="w-5 h-5 text-cf-primary animate-spin shrink-0" />
      <p className="text-sm text-cf-text-secondary">{message}</p>
    </div>
  );
}

// ── Tab: Crypto ────────────────────────────────────────────────────────────────
function CryptoTab() {
  const [address, setAddress] = useState('');
  const [chainParam, setChainParam] = useState<'auto' | 'eth' | 'btc'>('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CryptoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(
        `/api/osint/crypto?address=${encodeURIComponent(address.trim())}&chain=${chainParam}`
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? '알 수 없는 오류가 발생했습니다');
      } else {
        setResult(data as CryptoResult);
      }
    } catch {
      setError('네트워크 오류: 요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [address, chainParam]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  const ticker = result?.chain === 'eth' ? 'ETH' : 'BTC';

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="cf-card space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKey}
            placeholder="지갑 주소 입력 (ETH: 0x... / BTC: 1... 3... bc1...)"
            className="cf-input flex-1 px-3 py-2 rounded-lg border border-cf-border"
          />
          <button
            onClick={search}
            disabled={loading || !address.trim()}
            className="cf-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            분석
          </button>
        </div>

        {/* Chain selector */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-cf-text-secondary font-medium">체인 선택:</span>
          {(['auto', 'eth', 'btc'] as const).map((c) => (
            <label key={c} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="chain"
                value={c}
                checked={chainParam === c}
                onChange={() => setChainParam(c)}
                className="accent-cf-primary"
              />
              <span className="text-sm text-cf-text-primary">
                {c === 'auto' ? '자동 감지' : c.toUpperCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {loading && <LoadingCard message="블록체인 데이터 조회 중..." />}
      {error && <ErrorCard message={error} />}

      {result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '잔고', value: `${fmt(result.balance)} ${ticker}` },
              { label: '총 수신', value: `${fmt(result.totalReceived)} ${ticker}` },
              { label: '총 송신', value: `${fmt(result.totalSent)} ${ticker}` },
              { label: '거래 수', value: result.txCount.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="cf-card text-center">
                <p className="text-xs text-cf-text-secondary mb-1">{label}</p>
                <p className="font-mono text-sm font-semibold text-cf-text-primary break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Risk flags */}
          {result.riskFlags.length > 0 && (
            <div className="cf-card border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">위험 신호 감지</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.riskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.riskFlags.length === 0 && (
            <div className="cf-card flex items-center gap-2 text-green-700 bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">위험 신호 없음</span>
            </div>
          )}

          {/* Recent transactions */}
          {result.recentTxs.length > 0 && (
            <div className="cf-card">
              <h3 className="text-sm font-semibold text-cf-text-primary mb-3">최근 거래 내역</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-cf-text-secondary border-b border-cf-border">
                      <th className="text-left py-2 pr-4 font-medium">해시</th>
                      <th className="text-left py-2 pr-4 font-medium">시간</th>
                      <th className="text-right py-2 pr-4 font-medium">금액</th>
                      <th className="text-center py-2 font-medium">방향</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.recentTxs.map((tx) => (
                      <tr key={tx.hash} className="border-b border-cf-border/50 hover:bg-cf-border/20">
                        <td className="py-2 pr-4">
                          <a
                            href={getExplorerTxUrl(result.chain, tx.hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-cf-primary hover:underline"
                          >
                            {truncateHash(tx.hash)}
                          </a>
                        </td>
                        <td className="py-2 pr-4 text-cf-text-secondary">
                          {new Date(tx.time).toLocaleString('ko-KR', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">
                          {fmt(tx.value)} {ticker}
                        </td>
                        <td className="py-2 text-center">
                          {tx.direction === 'in' ? (
                            <span className="inline-flex items-center gap-0.5 text-green-600">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              수신
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-red-500">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              송신
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* External links */}
          <div className="flex flex-wrap gap-3">
            <a
              href={getExplorerAddressUrl(result.chain, result.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="cf-btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg border border-cf-border text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              {result.chain === 'eth' ? 'Etherscan에서 보기' : 'Blockchain.com에서 보기'}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Sanctions ─────────────────────────────────────────────────────────────
function SanctionsTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SanctionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/osint/sanctions?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '알 수 없는 오류');
      } else {
        setResult(data as SanctionsResult);
        if (data.error) setError(data.error);
      }
    } catch {
      setError('네트워크 오류: 요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div className="space-y-6">
      <div className="cf-card flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="인물/기업명 검색 (영문, 예: PUTIN, ROSNEFT)"
          className="cf-input flex-1 px-3 py-2 rounded-lg border border-cf-border"
        />
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="cf-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          조회
        </button>
      </div>

      {loading && <LoadingCard message="OFAC SDN 명단 검색 중 (최초 로딩 시 시간이 걸릴 수 있습니다)..." />}
      {error && <ErrorCard message={error} />}

      {result && !error && (
        <div className="space-y-4">
          {result.matches.length === 0 ? (
            <div className="cf-card flex items-center gap-3 text-green-700 bg-green-50 border-green-200">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">검색 결과 없음 — 제재 명단에 없습니다 ✓</p>
                <p className="text-xs mt-0.5 text-green-600">
                  &quot;{query}&quot; 은(는) OFAC SDN 명단에서 발견되지 않았습니다
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-cf-text-secondary">
                  {result.total}건 검색됨
                </p>
                <span className="text-xs text-cf-text-secondary">
                  기준: {new Date(result.updatedAt).toLocaleString('ko-KR')}
                </span>
              </div>

              <div className="cf-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-cf-text-secondary border-b border-cf-border text-xs">
                      <th className="text-left py-2 pr-4 font-medium">이름</th>
                      <th className="text-left py-2 pr-4 font-medium">유형</th>
                      <th className="text-left py-2 pr-4 font-medium">제재 프로그램</th>
                      <th className="text-left py-2 font-medium">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.map((match, idx) => (
                      <tr key={`${match.entNum}-${idx}`} className="border-b border-cf-border/50 hover:bg-red-50/30">
                        <td className="py-2.5 pr-4 font-medium text-cf-text-primary">{match.name}</td>
                        <td className="py-2.5 pr-4">
                          <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                            {match.type || '-'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-cf-text-secondary text-xs">{match.program || '-'}</td>
                        <td className="py-2.5 text-cf-text-secondary text-xs max-w-xs truncate">
                          {match.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 text-xs text-cf-text-secondary">
            <Shield className="w-3.5 h-3.5" />
            <span>OFAC SDN 기준 · 미국 재무부 해외자산통제국 (Office of Foreign Assets Control)</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Corporate ─────────────────────────────────────────────────────────────
function CorporateTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CorporateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/osint/corporate?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '알 수 없는 오류');
      } else {
        setResult(data as CorporateResult);
        if (data.error) setError(data.error);
      }
    } catch {
      setError('네트워크 오류: 요청에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search();
  };

  return (
    <div className="space-y-6">
      <div className="cf-card space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="기업명 검색 (예: Gazprom, Alibaba, Samsung)"
            className="cf-input flex-1 px-3 py-2 rounded-lg border border-cf-border"
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="cf-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            검색
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://offshoreleaks.icij.org/search?q=${encodeURIComponent(query)}&e=&c=&j=`}
            target="_blank"
            rel="noopener noreferrer"
            className="cf-btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cf-border text-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ICIJ Offshore Leaks에서 검색
          </a>
        </div>
      </div>

      {loading && <LoadingCard message="OpenCorporates 검색 중..." />}
      {error && <ErrorCard message={error} />}

      {result && (
        <div className="space-y-4">
          {result.companies.length === 0 ? (
            <div className="cf-card text-center py-8 text-cf-text-secondary">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다</p>
              <p className="text-xs mt-1">다른 키워드나 영문 사명으로 시도해보세요</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-cf-text-secondary">
                {result.total.toLocaleString()}건 검색됨 (상위 5건 표시)
              </p>
              <div className="grid gap-3">
                {result.companies.map((company, idx) => (
                  <div key={`${company.number}-${idx}`} className="cf-card space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-cf-text-primary text-sm">{company.name}</h4>
                        <p className="text-xs text-cf-text-secondary mt-0.5">
                          {getJurisdictionFlag(company.jurisdiction)}{' '}
                          <span className="uppercase">{company.jurisdiction}</span>
                          {company.number && <> · #{company.number}</>}
                        </p>
                      </div>
                      <a
                        href={company.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-cf-primary hover:text-cf-primary/80"
                        title="OpenCorporates에서 보기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {company.type && (
                        <div>
                          <span className="text-cf-text-secondary">유형: </span>
                          <span className="text-cf-text-primary">{company.type}</span>
                        </div>
                      )}
                      {company.incorporated && (
                        <div>
                          <span className="text-cf-text-secondary">설립: </span>
                          <span className="text-cf-text-primary">{company.incorporated}</span>
                        </div>
                      )}
                      {company.dissolved && (
                        <div>
                          <span className="text-cf-text-secondary">해산: </span>
                          <span className="text-red-600">{company.dissolved}</span>
                        </div>
                      )}
                    </div>

                    {company.address && (
                      <p className="text-xs text-cf-text-secondary truncate">
                        📍 {company.address}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-xs text-cf-text-secondary flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            출처: OpenCorporates · 전 세계 기업 등록 정보
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab: Guide ─────────────────────────────────────────────────────────────────
function GuideTab() {
  const methods = [
    {
      icon: <Building2 className="w-5 h-5 text-blue-500" />,
      title: '기업 구조 추적',
      description:
        '페이퍼 컴퍼니, 쉘 컴퍼니, 신탁 구조를 통해 숨겨진 자산 소유권을 역추적합니다. OpenCorporates와 ICIJ Offshore Leaks 데이터베이스를 활용하면 케이맨 제도, 버진아일랜드 등 조세피난처에 등록된 법인을 조회할 수 있습니다.',
      links: [
        { label: 'OpenCorporates', url: 'https://opencorporates.com' },
        { label: 'ICIJ Offshore Leaks', url: 'https://offshoreleaks.icij.org' },
      ],
    },
    {
      icon: <Bitcoin className="w-5 h-5 text-amber-500" />,
      title: '블록체인 분석',
      description:
        '암호화폐는 익명성을 표방하지만 블록체인의 모든 거래는 공개 장부에 영구적으로 기록됩니다. 지갑 클러스터링, 거래소 입출금 패턴, 스머핑(소액 분산 송금)을 통해 자금 출처와 목적지를 추적할 수 있습니다.',
      links: [
        { label: 'Etherscan', url: 'https://etherscan.io' },
        { label: 'Blockchain.com Explorer', url: 'https://www.blockchain.com/explorer' },
      ],
    },
    {
      icon: <Shield className="w-5 h-5 text-red-500" />,
      title: '제재 명단 조회',
      description:
        'OFAC SDN(특별지정국민) 명단은 미국 재무부가 금융 거래를 금지한 개인·기업·선박 목록입니다. 거래 상대방 실사(KYC/AML) 및 규정 준수에 필수적이며, 이름·프로그램·비고 등을 기반으로 검색 가능합니다.',
      links: [
        { label: 'OFAC SDN 공식', url: 'https://sanctionssearch.ofac.treas.gov' },
        { label: 'UN 제재 명단', url: 'https://scsanctions.un.org/consolidated' },
      ],
    },
    {
      icon: <Globe className="w-5 h-5 text-green-500" />,
      title: '실물자산 추적',
      description:
        '부동산, 요트, 전용기 등 실물자산은 공개 등기 기록이나 항적 데이터로 소유자를 확인할 수 있습니다. 부동산은 각국 등기소, 항공기는 FAA·ICAO, 선박은 IMO·AIS 데이터를 활용합니다.',
      links: [
        { label: 'Flightradar24 (항공)', url: 'https://www.flightradar24.com' },
        { label: 'MarineTraffic (선박)', url: 'https://www.marinetraffic.com' },
      ],
    },
    {
      icon: <BookOpen className="w-5 h-5 text-purple-500" />,
      title: '공개 기록 활용',
      description:
        '법원 판결문, SEC/금융감독원 공시, 기업 등기 자료, 언론 보도는 모두 OSINT의 핵심 소스입니다. EDGAR(SEC 공시), PACER(미국 연방 법원 기록), 각국 기업 등록소를 통해 법적·재무 관계를 파악할 수 있습니다.',
      links: [
        { label: 'SEC EDGAR', url: 'https://www.sec.gov/edgar' },
        { label: 'OpenSanctions', url: 'https://www.opensanctions.org' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="cf-card bg-slate-50 border-slate-200">
        <p className="text-sm text-cf-text-secondary leading-relaxed">
          OSINT(Open Source Intelligence)는 공개적으로 접근 가능한 정보를 수집·분석하는 정보 수집 방법론입니다.
          금융 범죄 수사, 기업 실사, 저널리즘, 규정 준수 등 합법적 목적에 활용됩니다.
        </p>
      </div>

      <div className="grid gap-4">
        {methods.map((method) => (
          <div key={method.title} className="cf-card space-y-3">
            <div className="flex items-center gap-3">
              {method.icon}
              <h3 className="font-semibold text-cf-text-primary">{method.title}</h3>
            </div>
            <p className="text-sm text-cf-text-secondary leading-relaxed">{method.description}</p>
            <div className="flex flex-wrap gap-2">
              {method.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cf-primary hover:text-cf-primary/80 border border-cf-primary/30 rounded px-2.5 py-1 hover:bg-cf-primary/5 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* All external links section */}
      <div className="cf-card">
        <h3 className="text-sm font-semibold text-cf-text-primary mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          주요 OSINT 리소스 모음
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: 'ICIJ Offshore Leaks', url: 'https://offshoreleaks.icij.org', desc: '조세피난처 기업 DB' },
            { label: 'OpenCorporates', url: 'https://opencorporates.com', desc: '전 세계 기업 등록' },
            { label: 'Etherscan', url: 'https://etherscan.io', desc: 'ETH 블록체인' },
            { label: 'OFAC SDN Search', url: 'https://sanctionssearch.ofac.treas.gov', desc: '미국 제재 명단' },
            { label: 'Flightradar24', url: 'https://www.flightradar24.com', desc: '실시간 항공 추적' },
            { label: 'MarineTraffic', url: 'https://www.marinetraffic.com', desc: '실시간 선박 추적' },
          ].map((res) => (
            <a
              key={res.url}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 p-3 rounded-lg border border-cf-border hover:border-cf-primary/40 hover:bg-cf-primary/5 transition-colors group"
            >
              <span className="text-xs font-medium text-cf-text-primary group-hover:text-cf-primary">
                {res.label}
              </span>
              <span className="text-xs text-cf-text-secondary">{res.desc}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OSINTPage() {
  const [activeTab, setActiveTab] = useState<TabId>('crypto');

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'crypto', label: '암호화폐 추적', icon: <Bitcoin className="w-4 h-4" /> },
    { id: 'sanctions', label: 'OFAC 제재 명단', icon: <Shield className="w-4 h-4" /> },
    { id: 'corporate', label: '기업 구조 추적', icon: <Building2 className="w-4 h-4" /> },
    { id: 'guide', label: '조사 가이드', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <main className="min-h-screen bg-cf-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-300 uppercase tracking-widest">
              OSINT Intelligence
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            OSINT 자금 추적
          </h1>
          <p className="text-slate-300 text-lg mb-6">
            블록체인·제재·기업 구조 역추적
          </p>

          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 rounded-full px-4 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-300 text-sm font-medium">
              교육·연구·합법적 조사 목적으로만 사용하세요
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-cf-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-cf-primary text-white shadow-sm'
                  : 'text-cf-text-secondary hover:text-cf-text-primary hover:bg-cf-border/40'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'crypto' && <CryptoTab />}
        {activeTab === 'sanctions' && <SanctionsTab />}
        {activeTab === 'corporate' && <CorporateTab />}
        {activeTab === 'guide' && <GuideTab />}
      </div>
    </main>
  );
}
