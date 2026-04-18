/**
 * /api/korea-flow
 *
 * KRX 외국인·기관·개인 순매수 — 한국 증시는 미국과 달리 수급을 **장중 실시간**
 * 공시합니다 (15분 지연 무료). KRX 공식 데이터 API 사용.
 *
 * Source: KRX 정보데이터시스템 (data.krx.co.kr)
 *   - OTP 발급: /comm/fileDn/GenerateOTP/generate.cmd
 *   - 수급 CSV 다운: /comm/fileDn/download_csv/download.cmd
 *
 * 간단 버전으로 시작: KOSPI 전체 투자자별 순매수 상위 종목만.
 * Redis 15분 캐시.
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const CACHE_KEY = 'flowvium:korea-flow:v1';
const CACHE_TTL = 15 * 60;

export interface KoreaFlowEntry {
  ticker: string;          // 종목코드 (e.g., 005930)
  name: string;
  market: 'KOSPI' | 'KOSDAQ';
  foreignerNetBuy: number | null;    // 외국인 순매수 (KRW)
  institutionNetBuy: number | null;  // 기관 순매수 (KRW)
  individualNetBuy: number | null;   // 개인 순매수 (KRW)
  closePrice: number | null;
  changePct: number | null;
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const KRX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Referer': 'https://data.krx.co.kr/',
  'Accept': 'application/json, text/plain, */*',
};

/** Fetch today's (or latest trading day's) KRX investor-type trading data. */
async function fetchKrxFlow(market: 'KOSPI' | 'KOSDAQ'): Promise<KoreaFlowEntry[]> {
  const trdDd = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, '');

  // KRX uses a two-step flow: POST form data to getJsonData.cmd
  const body = new URLSearchParams({
    bld: 'dbms/MDC/STAT/standard/MDCSTAT02301',
    mktId: market === 'KOSPI' ? 'STK' : 'KSQ',
    invstTpCd: '9000',  // all investor types
    trdDd,
    share: '1',
    money: '1',
    csvxls_isNo: 'false',
  });

  try {
    const res = await fetch('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', {
      method: 'POST',
      headers: { ...KRX_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json?.output ?? []) as Array<Record<string, string>>;
    return rows.map(r => ({
      ticker: r.ISU_SRT_CD,
      name: r.ISU_ABBRV,
      market,
      foreignerNetBuy: Number((r.FORN_NETBY_TRDVAL ?? '0').replace(/,/g, '')) || null,
      institutionNetBuy: Number((r.ORGN_NETBY_TRDVAL ?? '0').replace(/,/g, '')) || null,
      individualNetBuy: Number((r.IND_NETBY_TRDVAL ?? '0').replace(/,/g, '')) || null,
      closePrice: Number((r.TDD_CLSPRC ?? '0').replace(/,/g, '')) || null,
      changePct: Number((r.FLUC_RT ?? '0').replace(/,/g, '')) || null,
    })).filter(e => e.ticker && e.name);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const redis = createRedis();
  const force = new URL(req.url).searchParams.get('refresh') === '1';

  if (redis && !force) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch { /* non-fatal */ }
  }

  const [kospi, kosdaq] = await Promise.all([
    fetchKrxFlow('KOSPI'),
    fetchKrxFlow('KOSDAQ'),
  ]);

  const all = [...kospi, ...kosdaq];

  // Top-N by absolute foreigner net buy
  const topForeignBuy = [...all]
    .filter(e => (e.foreignerNetBuy ?? 0) > 0)
    .sort((a, b) => (b.foreignerNetBuy ?? 0) - (a.foreignerNetBuy ?? 0))
    .slice(0, 15);
  const topForeignSell = [...all]
    .filter(e => (e.foreignerNetBuy ?? 0) < 0)
    .sort((a, b) => (a.foreignerNetBuy ?? 0) - (b.foreignerNetBuy ?? 0))
    .slice(0, 15);
  const topInstBuy = [...all]
    .filter(e => (e.institutionNetBuy ?? 0) > 0)
    .sort((a, b) => (b.institutionNetBuy ?? 0) - (a.institutionNetBuy ?? 0))
    .slice(0, 15);
  const topInstSell = [...all]
    .filter(e => (e.institutionNetBuy ?? 0) < 0)
    .sort((a, b) => (a.institutionNetBuy ?? 0) - (b.institutionNetBuy ?? 0))
    .slice(0, 15);

  const payload = {
    updatedAt: new Date().toISOString(),
    tradingDay: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
    topForeignBuy,
    topForeignSell,
    topInstBuy,
    topInstSell,
    totalTickers: all.length,
  };

  if (redis) {
    try { await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ...payload, cached: false });
}
