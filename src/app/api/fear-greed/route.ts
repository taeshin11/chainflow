import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const CACHE_TTL = 4 * 60 * 60; // 4 hours

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── CNN Fear & Greed (US only) ─────────────────────────────────────────────────
async function fetchCNNScore(): Promise<{ score: number; prevScore: number } | null> {
  try {
    const res = await fetch(
      'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
      {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://edition.cnn.com/' },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const score = Math.round(data?.fear_and_greed?.score ?? 0);
    // Previous score: one week ago from historical data
    const hist: Array<{ x: number; y: number }> =
      data?.fear_and_greed_historical?.data ?? [];
    const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekAgoEntry = hist.find((d) => Math.abs(d.x - weekAgoMs) < 2 * 24 * 60 * 60 * 1000);
    const prevScore = weekAgoEntry ? Math.round(weekAgoEntry.y) : score;
    return { score, prevScore };
  } catch {
    return null;
  }
}

// ── Yahoo Finance price data ───────────────────────────────────────────────────
async function fetchPrices(ticker: string): Promise<number[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=180d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
  const data = await res.json();
  const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
  return closes.filter((v: number) => v != null && !isNaN(v));
}

// ── CNN-style multi-factor score ──────────────────────────────────────────────
// Factor 1: RSI-14 (momentum proxy, 0-100)
function rsi14(prices: number[]): number {
  if (prices.length < 15) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  let ag = 0, al = 0;
  for (let i = 0; i < 14; i++) {
    if (changes[i] > 0) ag += changes[i];
    else al += Math.abs(changes[i]);
  }
  ag /= 14; al /= 14;
  for (let i = 14; i < changes.length; i++) {
    ag = (ag * 13 + Math.max(changes[i], 0)) / 14;
    al = (al * 13 + Math.max(-changes[i], 0)) / 14;
  }
  if (al === 0) return 100;
  return Math.round(100 - 100 / (1 + ag / al));
}

// Factor 2: Price vs 125-day SMA momentum (CNN uses this)
// >0 = above SMA = greed, <0 = below SMA = fear → normalize to 0-100
function smaMomentum(prices: number[]): number {
  if (prices.length < 125) return 50;
  const last = prices[prices.length - 1];
  const sma125 = prices.slice(-125).reduce((a, b) => a + b, 0) / 125;
  const pct = (last - sma125) / sma125; // e.g. +0.05 = 5% above SMA
  // Normalize: ±15% range → 0-100
  return Math.min(100, Math.max(0, Math.round(50 + (pct / 0.15) * 50)));
}

// Factor 3: Volatility ratio (current 20d vol vs 50d avg vol)
// Low vol = greed (high score), high vol = fear (low score)
function volatilityScore(prices: number[]): number {
  if (prices.length < 55) return 50;
  const returns = prices.slice(1).map((p, i) => Math.log(p / prices[i]));
  const recent20 = returns.slice(-20);
  const avg50 = returns.slice(-50);
  const vol20 = Math.sqrt(recent20.reduce((s, r) => s + r * r, 0) / 20);
  const vol50 = Math.sqrt(avg50.reduce((s, r) => s + r * r, 0) / 50);
  const ratio = vol50 > 0 ? vol20 / vol50 : 1;
  // ratio > 1 = elevated vol = fear; ratio < 1 = calm = greed
  // ratio 2.0 → 0, ratio 0.5 → 100, ratio 1.0 → 50
  return Math.min(100, Math.max(0, Math.round(50 * (2 - ratio))));
}

// Composite: weight factors like CNN (equal-ish weighting)
function compositeScore(prices: number[]): number {
  const r = rsi14(prices);           // 40%
  const m = smaMomentum(prices);     // 35%
  const v = volatilityScore(prices); // 25%
  return Math.round(r * 0.40 + m * 0.35 + v * 0.25);
}

function getLevel(score: number): string {
  if (score <= 25) return 'extreme-fear';
  if (score <= 40) return 'fear';
  if (score <= 60) return 'neutral';
  if (score <= 75) return 'greed';
  return 'extreme-greed';
}

// ── Configs ───────────────────────────────────────────────────────────────────
const COUNTRY_ETFS = [
  { id: 'us',        ticker: 'SPY',  flag: '🇺🇸', label: 'United States', useCNN: true },
  { id: 'korea',     ticker: 'EWY',  flag: '🇰🇷', label: '한국 (Korea)' },
  { id: 'japan',     ticker: 'EWJ',  flag: '🇯🇵', label: '日本 (Japan)' },
  { id: 'china',     ticker: 'FXI',  flag: '🇨🇳', label: '中国 (China)' },
  { id: 'europe',    ticker: 'VGK',  flag: '🇪🇺', label: 'Europe (EU)' },
  { id: 'uk',        ticker: 'EWU',  flag: '🇬🇧', label: 'United Kingdom' },
  { id: 'india',     ticker: 'INDA', flag: '🇮🇳', label: 'भारत (India)' },
  { id: 'brazil',    ticker: 'EWZ',  flag: '🇧🇷', label: 'Brasil' },
  { id: 'taiwan',    ticker: 'EWT',  flag: '🇹🇼', label: '台灣 (Taiwan)' },
  { id: 'australia', ticker: 'EWA',  flag: '🇦🇺', label: 'Australia' },
];

const ASSET_ETFS = [
  { id: 'gold',        ticker: 'GLD',  flag: '🥇', label: 'Gold' },
  { id: 'defense',     ticker: 'ITA',  flag: '🛡️', label: 'Defense' },
  { id: 'tech',        ticker: 'QQQ',  flag: '💻', label: 'Tech / AI' },
  { id: 'bonds',       ticker: 'TLT',  flag: '📊', label: 'Bonds (20Y)' },
  { id: 'reits',       ticker: 'VNQ',  flag: '🏢', label: 'REITs' },
  { id: 'energy',      ticker: 'XLE',  flag: '⚡', label: 'Energy' },
  { id: 'biotech',     ticker: 'IBB',  flag: '🧬', label: 'Biotech' },
  { id: 'commodities', ticker: 'DJP',  flag: '🌾', label: 'Commodities' },
  { id: 'financials',  ticker: 'XLF',  flag: '🏦', label: 'Financials' },
  { id: 'crypto',      ticker: 'BITO', flag: '₿',  label: 'Crypto (BTC)' },
];

const driverMap: Record<string, string> = {
  SPY:  'S&P500 momentum · VIX · put/call ratio',
  EWY:  'KOSPI · KRW/USD · Samsung HBM',
  EWJ:  'Nikkei · BOJ policy · yen carry',
  FXI:  'CSI300 · PBOC stimulus · AI subsidy',
  VGK:  'Euro Stoxx · ECB · tariff retaliation',
  EWU:  'FTSE100 · BOE · stagflation risk',
  INDA: 'Nifty50 · FII inflows · INR',
  EWZ:  'Bovespa · Selic rate · commodity',
  EWT:  'TWSE · TSMC · strait risk',
  EWA:  'ASX200 · RBA · China trade',
  GLD:  'Gold spot · central bank buying · DXY',
  ITA:  'Defense contracts · NATO budget · M&A',
  QQQ:  'Nasdaq-100 · Mag7 earnings · AI capex',
  TLT:  '20Y Treasury · Fed rate path · duration',
  VNQ:  'REIT cap rates · office vacancy · refi',
  XLE:  'WTI/Brent · rig count · OPEC+',
  IBB:  'Biotech pipeline · FDA calendar · M&A',
  DJP:  'Bloomberg Commodity Index · supply chains',
  XLF:  'Bank earnings · NIM · yield curve',
  BITO: 'BTC price · funding rates · dominance',
};

async function buildEntry(
  id: string, ticker: string, flag: string, label: string,
  redis: Redis | null, useCNN = false,
) {
  const cacheKey = `flowvium:fg:v3:${ticker}`;
  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return cached;
    } catch { /* non-fatal */ }
  }

  let score: number, prevScore: number;

  if (useCNN) {
    const cnn = await fetchCNNScore();
    if (cnn) {
      score = cnn.score;
      prevScore = cnn.prevScore;
    } else {
      const prices = await fetchPrices(ticker);
      score = compositeScore(prices);
      const prev = compositeScore(prices.slice(0, -7));
      prevScore = prev;
    }
  } else {
    const prices = await fetchPrices(ticker);
    score = compositeScore(prices);
    const prev = compositeScore(prices.slice(0, -7));
    prevScore = prev;
  }

  const delta = score - prevScore;
  const entry = {
    id, flag, label, score, prevScore,
    trend: delta > 2 ? 'up' : delta < -2 ? 'down' : 'neutral',
    driver: driverMap[ticker] ?? ticker,
    level: getLevel(score),
  };

  if (redis) {
    try { await redis.set(cacheKey, entry, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }
  return entry;
}

export async function GET() {
  const redis = createRedis();

  const [byCountry, byAsset] = await Promise.all([
    Promise.all(
      COUNTRY_ETFS.map(({ id, ticker, flag, label, useCNN }) =>
        buildEntry(id, ticker, flag, label, redis, useCNN ?? false).catch(() => null)
      )
    ),
    Promise.all(
      ASSET_ETFS.map(({ id, ticker, flag, label }) =>
        buildEntry(id, ticker, flag, label, redis, false).catch(() => null)
      )
    ),
  ]);

  return NextResponse.json({
    byCountry: byCountry.filter(Boolean),
    byAsset: byAsset.filter(Boolean),
    updatedAt: new Date().toISOString(),
  });
}
