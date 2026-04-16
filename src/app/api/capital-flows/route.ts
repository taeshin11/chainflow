/**
 * /api/capital-flows
 *
 * Fetches 4-week & 13-week returns for key assets from Yahoo Finance.
 * Identifies cross-asset rotation: where money is moving from → to.
 * Cached in Redis for 4 hours.
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
  // Equities
  { id: 'us-stocks',    ticker: 'SPY',   label: '미국 주식',    labelEn: 'US Stocks',     group: 'equity',    flag: '🇺🇸' },
  { id: 'em-stocks',    ticker: 'EEM',   label: 'EM 주식',      labelEn: 'Emerg. Markets', group: 'equity',   flag: '🌏' },
  { id: 'eu-stocks',    ticker: 'VGK',   label: '유럽 주식',    labelEn: 'Europe',         group: 'equity',   flag: '🇪🇺' },
  { id: 'asia-stocks',  ticker: 'AAXJ',  label: '아시아 주식',  labelEn: 'Asia ex-JP',    group: 'equity',    flag: '🌏' },
  { id: 'us-tech',      ticker: 'QQQ',   label: '미국 테크',    labelEn: 'US Tech',       group: 'equity',    flag: '💻' },
  // Bonds
  { id: 'us-bonds-lt',  ticker: 'TLT',   label: '미 장기채',    labelEn: 'US 20Y Bond',   group: 'bonds',     flag: '📊' },
  { id: 'us-bonds-st',  ticker: 'SHY',   label: '미 단기채',    labelEn: 'US 2Y Bond',    group: 'bonds',     flag: '📋' },
  { id: 'hy-bonds',     ticker: 'HYG',   label: '하이일드채',   labelEn: 'High Yield',    group: 'bonds',     flag: '📈' },
  // Alternatives
  { id: 'gold',         ticker: 'GLD',   label: '금',           labelEn: 'Gold',          group: 'alts',      flag: '🥇' },
  { id: 'silver',       ticker: 'SLV',   label: '은',           labelEn: 'Silver',        group: 'alts',      flag: '🪙' },
  { id: 'bitcoin',      ticker: 'BITO',  label: '비트코인',     labelEn: 'Bitcoin',       group: 'alts',      flag: '₿' },
  // Commodities
  { id: 'oil',          ticker: 'USO',   label: '원유',         labelEn: 'Oil (WTI)',     group: 'commodities', flag: '🛢️' },
  { id: 'energy',       ticker: 'XLE',   label: '에너지',       labelEn: 'Energy',        group: 'commodities', flag: '⚡' },
  { id: 'agri',         ticker: 'DBA',   label: '농산물',       labelEn: 'Agriculture',   group: 'commodities', flag: '🌾' },
  // Currency proxies
  { id: 'dollar',       ticker: 'UUP',   label: '달러',         labelEn: 'US Dollar',     group: 'currency',  flag: '💵' },
  { id: 'yen',          ticker: 'FXY',   label: '엔화',         labelEn: 'Japanese Yen',  group: 'currency',  flag: '💴' },
  { id: 'gold-vs-usd',  ticker: 'GLD',   label: '금/달러',      labelEn: 'Gold/USD',      group: 'currency',  flag: '⚖️' },
];

// Fetch 100-day prices
async function fetchPrices(ticker: string): Promise<number[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=120d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  return closes.filter((v) => v != null && !isNaN(v));
}

function pctReturn(prices: number[], days: number): number {
  if (prices.length < days + 1) return 0;
  const last = prices[prices.length - 1];
  const prev = prices[prices.length - 1 - days];
  return parseFloat(((last - prev) / prev * 100).toFixed(2));
}

// Flow analysis: compare groups to find rotation
function detectRotation(results: Array<{
  id: string; label: string; labelEn: string; flag: string; group: string;
  ret4w: number; ret13w: number;
}>) {
  // Sort by 4-week return to find biggest movers
  const sorted4w = [...results].sort((a, b) => b.ret4w - a.ret4w);
  const topInflows = sorted4w.slice(0, 5);
  const topOutflows = sorted4w.slice(-5).reverse();

  // Group performance
  const groupPerf: Record<string, number[]> = {};
  for (const r of results) {
    if (!groupPerf[r.group]) groupPerf[r.group] = [];
    groupPerf[r.group].push(r.ret4w);
  }
  const groupAvg = Object.entries(groupPerf).map(([group, vals]) => ({
    group,
    avg4w: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  })).sort((a, b) => b.avg4w - a.avg4w);

  // Rotation narrative: find biggest divergence pairs
  const rotations: Array<{ from: string; to: string; magnitude: number; label: string }> = [];

  // Find group pairs with highest spread
  for (let i = 0; i < groupAvg.length; i++) {
    for (let j = i + 1; j < groupAvg.length; j++) {
      const high = groupAvg[i];
      const low = groupAvg[j];
      const spread = high.avg4w - low.avg4w;
      if (Math.abs(spread) > 1.5) {
        const groupLabels: Record<string, string> = {
          equity: '주식', bonds: '채권', alts: '대안자산', commodities: '원자재', currency: '통화',
        };
        rotations.push({
          from: groupLabels[low.group] ?? low.group,
          to: groupLabels[high.group] ?? high.group,
          magnitude: parseFloat(spread.toFixed(1)),
          label: `${groupLabels[low.group] ?? low.group} → ${groupLabels[high.group] ?? high.group}`,
        });
      }
    }
  }
  rotations.sort((a, b) => b.magnitude - a.magnitude);

  return { topInflows, topOutflows, groupAvg, rotations: rotations.slice(0, 4) };
}

export async function GET() {
  const redis = createRedis();
  const cacheKey = 'flowvium:capital-flows:v2';

  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch { /* non-fatal */ }
  }

  // Deduplicate tickers
  const uniqueTickers = Array.from(new Set(ASSETS.map((a) => a.ticker)));
  const priceMap: Record<string, number[]> = {};

  await Promise.all(
    uniqueTickers.map(async (ticker) => {
      try {
        priceMap[ticker] = await fetchPrices(ticker);
      } catch {
        priceMap[ticker] = [];
      }
    })
  );

  const results = ASSETS
    .filter((a) => a.id !== 'gold-vs-usd') // derived
    .map((asset) => {
      const prices = priceMap[asset.ticker] ?? [];
      return {
        id: asset.id,
        label: asset.label,
        labelEn: asset.labelEn,
        flag: asset.flag,
        group: asset.group,
        ticker: asset.ticker,
        ret4w: pctReturn(prices, 20),    // ~4 trading weeks
        ret13w: pctReturn(prices, 65),   // ~13 trading weeks
        ret1w: pctReturn(prices, 5),
      };
    })
    .filter((r) => r.ret4w !== 0 || r.ret13w !== 0); // remove failed fetches

  const flow = detectRotation(results);

  // Gold vs Dollar ratio trend
  const gldPrices = priceMap['GLD'] ?? [];
  const uupPrices = priceMap['UUP'] ?? [];
  const goldRet = pctReturn(gldPrices, 20);
  const dollarRet = pctReturn(uupPrices, 20);
  const goldVsDollar = {
    goldRet4w: goldRet,
    dollarRet4w: dollarRet,
    signal: goldRet > dollarRet + 2 ? '금 선호 (달러 약세 헷지)' : dollarRet > goldRet + 2 ? '달러 강세 (안전자산 달러로)' : '혼조',
  };

  const response = {
    assets: results,
    flow,
    goldVsDollar,
    updatedAt: new Date().toISOString(),
  };

  if (redis) {
    try {
      await redis.set(cacheKey, response, { ex: CACHE_TTL });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(response);
}
