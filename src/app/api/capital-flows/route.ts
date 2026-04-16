/**
 * /api/capital-flows
 *
 * Data source priority:
 *   1. Twelve Data (if TWELVE_DATA_KEY set) — real-time, higher rate limit
 *   2. Yahoo Finance fallback — 15-min delayed
 *
 * Features:
 *   - 1w/4w/13w returns per asset
 *   - Cross-asset rotation detection with start date + momentum (accel/hold/fade)
 *   - Redis 4h cache
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const CACHE_TTL = 4 * 60 * 60;

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const ASSETS = [
  { id: 'us-stocks',   ticker: 'SPY',   label: '미국 주식',    group: 'equity',      flag: '🇺🇸' },
  { id: 'em-stocks',   ticker: 'EEM',   label: 'EM 주식',      group: 'equity',      flag: '🌏' },
  { id: 'eu-stocks',   ticker: 'VGK',   label: '유럽 주식',    group: 'equity',      flag: '🇪🇺' },
  { id: 'us-tech',     ticker: 'QQQ',   label: '미국 테크',    group: 'equity',      flag: '💻' },
  { id: 'us-bonds-lt', ticker: 'TLT',   label: '미 장기채',    group: 'bonds',       flag: '📊' },
  { id: 'us-bonds-st', ticker: 'SHY',   label: '미 단기채',    group: 'bonds',       flag: '📋' },
  { id: 'hy-bonds',    ticker: 'HYG',   label: '하이일드채',   group: 'bonds',       flag: '📈' },
  { id: 'gold',        ticker: 'GLD',   label: '금',           group: 'alts',        flag: '🥇' },
  { id: 'silver',      ticker: 'SLV',   label: '은',           group: 'alts',        flag: '🪙' },
  { id: 'bitcoin',     ticker: 'BITO',  label: '비트코인',     group: 'alts',        flag: '₿' },
  { id: 'oil',         ticker: 'USO',   label: '원유',         group: 'commodities', flag: '🛢️' },
  { id: 'energy',      ticker: 'XLE',   label: '에너지',       group: 'commodities', flag: '⚡' },
  { id: 'agri',        ticker: 'DBA',   label: '농산물',       group: 'commodities', flag: '🌾' },
  { id: 'dollar',      ticker: 'UUP',   label: '달러',         group: 'currency',    flag: '💵' },
  { id: 'yen',         ticker: 'FXY',   label: '엔화',         group: 'currency',    flag: '💴' },
];

// ── Data fetchers ─────────────────────────────────────────────────────────────

// ── Source 1: Twelve Data (real-time, 800 calls/day free) ─────────────────────
async function fetchPricesTwelve(ticker: string, apiKey: string): Promise<number[]> {
  const url = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=1day&outputsize=120&apikey=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Twelve HTTP ${res.status}`);
  const data = await res.json();
  if (data.status === 'error') throw new Error(data.message);
  const values: Array<{ close: string }> = data?.values ?? [];
  const prices = values.reverse().map((v) => parseFloat(v.close)).filter((v) => !isNaN(v));
  if (prices.length < 20) throw new Error('Twelve: insufficient data');
  return prices;
}

// ── Source 2: Yahoo Finance (15-min delay, no key, primary fallback) ──────────
async function fetchPricesYahoo(ticker: string): Promise<number[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=120d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const data = await res.json();
  const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  const prices = closes.filter((v) => v != null && !isNaN(v));
  if (prices.length < 20) throw new Error('Yahoo: insufficient data');
  return prices;
}

// ── Source 3: Stooq (no key, no rate limit, secondary fallback) ───────────────
async function fetchPricesStooq(ticker: string): Promise<number[]> {
  // Stooq uses symbol format like "SPY.US" for US ETFs
  const sym = ticker.includes('.') ? ticker : `${ticker}.US`;
  const url = `https://stooq.com/q/d/l/?s=${sym.toLowerCase()}&i=d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Stooq HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split('\n').slice(1); // skip header
  const prices = lines
    .slice(-120) // last 120 trading days
    .map((line) => {
      const cols = line.split(',');
      return parseFloat(cols[4] ?? ''); // Close is column 5
    })
    .filter((v) => !isNaN(v));
  if (prices.length < 20) throw new Error('Stooq: insufficient data');
  return prices;
}

// ── Cascade: Twelve → Yahoo → Stooq ──────────────────────────────────────────
async function fetchPrices(ticker: string, twelveKey: string | null): Promise<{ prices: number[]; source: string }> {
  if (twelveKey) {
    try { return { prices: await fetchPricesTwelve(ticker, twelveKey), source: 'twelve' }; }
    catch { /* try next */ }
  }
  try { return { prices: await fetchPricesYahoo(ticker), source: 'yahoo' }; }
  catch { /* try next */ }
  try { return { prices: await fetchPricesStooq(ticker), source: 'stooq' }; }
  catch { return { prices: [], source: 'failed' }; }
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function pctReturn(prices: number[], days: number): number {
  if (prices.length < days + 1) return 0;
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 1 - days];
  return parseFloat(((last - prev) / prev * 100).toFixed(2));
}

/** Scan back to find roughly when the group spread first became significant (≥1%/wk) */
function estimateRotationStart(
  priceMap: Record<string, number[]>,
  toGroup: string,
  fromGroup: string,
  assets: typeof ASSETS,
): { weeksAgo: number; startDate: string; momentum: 'accelerating' | 'holding' | 'fading' } {
  const toTickers = assets.filter((a) => a.group === toGroup).map((a) => a.ticker);
  const fromTickers = assets.filter((a) => a.group === fromGroup).map((a) => a.ticker);

  const avgGroupReturn = (tickers: string[], daysBack: number, window: number): number => {
    const rets = tickers
      .map((t) => {
        const p = priceMap[t] ?? [];
        const end = p.length - daysBack;
        if (end < window + 1) return null;
        const slice = p.slice(0, end);
        return pctReturn(slice, window);
      })
      .filter((v): v is number => v !== null);
    return rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  };

  // Scan back in 1-week steps (max 12 weeks) to find start of divergence
  let weeksAgo = 1;
  for (let w = 12; w >= 1; w--) {
    const toRet = avgGroupReturn(toTickers, w * 5, 5);
    const fromRet = avgGroupReturn(fromTickers, w * 5, 5);
    if (toRet - fromRet < 0.5) {
      weeksAgo = w + 1;
      break;
    }
    weeksAgo = 1; // still going
  }

  // Momentum: compare 1w spread vs 4w average weekly spread
  const spread1w = avgGroupReturn(toTickers, 0, 5) - avgGroupReturn(fromTickers, 0, 5);
  const spread4wPerWeek = (avgGroupReturn(toTickers, 0, 20) - avgGroupReturn(fromTickers, 0, 20)) / 4;
  const momentum: 'accelerating' | 'holding' | 'fading' =
    spread1w > spread4wPerWeek * 1.3 ? 'accelerating' :
    spread1w < spread4wPerWeek * 0.4 ? 'fading' : 'holding';

  const start = new Date();
  start.setDate(start.getDate() - weeksAgo * 7);
  const startDate = `${start.getFullYear()}년 ${start.getMonth() + 1}월`;

  return { weeksAgo, startDate, momentum };
}

const GROUP_LABELS: Record<string, string> = {
  equity: '주식', bonds: '채권', alts: '대안자산', commodities: '원자재', currency: '통화',
};

type RotationEntry = {
  from: string; to: string; magnitude: number;
  weeksAgo: number; startDate: string; momentum: 'accelerating' | 'holding' | 'fading';
};

type AssetResult = { id: string; label: string; flag: string; group: string; ticker: string; ret1w: number; ret4w: number; ret13w: number };

function buildRotations(
  results: AssetResult[],
  priceMap: Record<string, number[]>,
  retKey: 'ret1w' | 'ret4w' | 'ret13w',
  minSpread: number,
): RotationEntry[] {
  const groupPerf: Record<string, number[]> = {};
  for (const r of results) {
    if (!groupPerf[r.group]) groupPerf[r.group] = [];
    groupPerf[r.group].push(r[retKey]);
  }
  const groupAvg = Object.entries(groupPerf).map(([group, vals]) => ({
    group,
    avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  })).sort((a, b) => b.avg - a.avg);

  const rotations: RotationEntry[] = [];
  for (let i = 0; i < groupAvg.length; i++) {
    for (let j = i + 1; j < groupAvg.length; j++) {
      const spread = groupAvg[i].avg - groupAvg[j].avg;
      if (spread > minSpread) {
        const timing = estimateRotationStart(priceMap, groupAvg[i].group, groupAvg[j].group, ASSETS);
        rotations.push({
          from: GROUP_LABELS[groupAvg[j].group] ?? groupAvg[j].group,
          to: GROUP_LABELS[groupAvg[i].group] ?? groupAvg[i].group,
          magnitude: parseFloat(spread.toFixed(1)),
          ...timing,
        });
      }
    }
  }
  return rotations.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
}

function detectRotation(results: AssetResult[], priceMap: Record<string, number[]>) {
  const sorted4w = [...results].sort((a, b) => b.ret4w - a.ret4w);
  const topInflows = sorted4w.slice(0, 5);
  const topOutflows = sorted4w.slice(-5).reverse();

  const groupPerf: Record<string, number[]> = {};
  for (const r of results) {
    if (!groupPerf[r.group]) groupPerf[r.group] = [];
    groupPerf[r.group].push(r.ret4w);
  }
  const groupAvg = Object.entries(groupPerf).map(([group, vals]) => ({
    group,
    avg4w: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  })).sort((a, b) => b.avg4w - a.avg4w);

  return {
    topInflows,
    topOutflows,
    groupAvg,
    rotations1w:  buildRotations(results, priceMap, 'ret1w',  0.5),
    rotations4w:  buildRotations(results, priceMap, 'ret4w',  1.5),
    rotations13w: buildRotations(results, priceMap, 'ret13w', 3.0),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const redis = createRedis();
  const twelveKey = process.env.TWELVE_DATA_KEY?.trim() || null;
  const dataSource = twelveKey ? 'Twelve Data (실시간)' : 'Yahoo Finance (15분 지연)';
  const cacheKey = `flowvium:capital-flows:v3:${twelveKey ? 'twelve' : 'yahoo'}`;

  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch { /* non-fatal */ }
  }

  const uniqueTickers = Array.from(new Set(ASSETS.map((a) => a.ticker)));
  const priceMap: Record<string, number[]> = {};
  const sourceCount: Record<string, number> = {};

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      const { prices, source } = await fetchPrices(ticker, twelveKey);
      priceMap[ticker] = prices;
      sourceCount[source] = (sourceCount[source] ?? 0) + 1;
    })
  );

  // Describe which sources actually provided data
  const sourceSummary = Object.entries(sourceCount)
    .filter(([s]) => s !== 'failed')
    .map(([s, n]) => ({ twelve: 'Twelve Data(실시간)', yahoo: 'Yahoo Finance(15분)', stooq: 'Stooq(종가)' }[s] ?? s) + ` ${n}개`)
    .join(' + ');

  const results = ASSETS.map((asset) => {
    const prices = priceMap[asset.ticker] ?? [];
    return {
      id: asset.id,
      label: asset.label,
      flag: asset.flag,
      group: asset.group,
      ticker: asset.ticker,
      ret1w:  pctReturn(prices, 5),
      ret4w:  pctReturn(prices, 20),
      ret13w: pctReturn(prices, 65),
    };
  }).filter((r) => r.ret4w !== 0 || r.ret13w !== 0);

  const flow = detectRotation(results, priceMap);

  const gldPrices = priceMap['GLD'] ?? [];
  const uupPrices = priceMap['UUP'] ?? [];
  const goldRet = pctReturn(gldPrices, 20);
  const dollarRet = pctReturn(uupPrices, 20);
  const goldVsDollar = {
    goldRet4w: goldRet,
    dollarRet4w: dollarRet,
    signal: goldRet > dollarRet + 2
      ? '금 선호 (달러 약세 헷지)'
      : dollarRet > goldRet + 2
      ? '달러 강세 (안전자산 달러로)'
      : '혼조',
  };

  const response = { assets: results, flow, goldVsDollar, dataSource: sourceSummary || dataSource, updatedAt: new Date().toISOString() };

  if (redis) {
    try { await redis.set(cacheKey, response, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }

  return NextResponse.json(response);
}
