/**
 * Fear & Greed data — by country and by asset class.
 * Updated: daily via scripts/scrapers/fear-greed-calc.ts (TODO)
 * Currently: static baseline (2026-04-16)
 */

export interface FearGreedEntry {
  id: string;
  label: string;
  flag?: string;
  score: number; // 0–100
  trend: 'up' | 'down' | 'neutral'; // 7-day direction
  driver: string; // key reason
  prevScore?: number; // 7 days ago
}

export type FearGreedLevel = 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';

export function getLevel(score: number): FearGreedLevel {
  if (score <= 24) return 'extreme-fear';
  if (score <= 44) return 'fear';
  if (score <= 55) return 'neutral';
  if (score <= 74) return 'greed';
  return 'extreme-greed';
}

export const levelLabels: Record<FearGreedLevel, { en: string; ko: string; color: string; bg: string; border: string }> = {
  'extreme-fear': { en: 'Extreme Fear', ko: '극단적 공포', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  'fear':         { en: 'Fear',         ko: '공포',       color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
  'neutral':      { en: 'Neutral',      ko: '중립',       color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'greed':        { en: 'Greed',        ko: '탐욕',       color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-200' },
  'extreme-greed':{ en: 'Extreme Greed',ko: '극단적 탐욕',color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
};

// ── By Country ────────────────────────────────────────────────────────────────
export const fearGreedByCountry: FearGreedEntry[] = [
  {
    id: 'us',
    label: 'United States',
    flag: '🇺🇸',
    score: 32,
    prevScore: 41,
    trend: 'down',
    driver: 'Tariff shock + tech sector correction. VIX elevated at 28.',
  },
  {
    id: 'korea',
    label: '한국 (Korea)',
    flag: '🇰🇷',
    score: 21,
    prevScore: 26,
    trend: 'down',
    driver: 'KOSPI -14% YTD. Samsung HBM loss share + KRW/USD weakness.',
  },
  {
    id: 'japan',
    label: '日本 (Japan)',
    flag: '🇯🇵',
    score: 37,
    prevScore: 44,
    trend: 'down',
    driver: 'Nikkei volatility. BOJ rate path uncertainty + yen at 155.',
  },
  {
    id: 'china',
    label: '中国 (China)',
    flag: '🇨🇳',
    score: 54,
    prevScore: 50,
    trend: 'up',
    driver: 'Stimulus package expectations. AI subsidy narrative holding.',
  },
  {
    id: 'eu',
    label: 'Europe (EU)',
    flag: '🇪🇺',
    score: 29,
    prevScore: 35,
    trend: 'down',
    driver: 'US tariff retaliation risk. Auto & industrial sector under pressure.',
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    flag: '🇬🇧',
    score: 40,
    prevScore: 38,
    trend: 'neutral',
    driver: 'Stagflation concern. BOE caught between inflation and growth.',
  },
  {
    id: 'india',
    label: 'भारत (India)',
    flag: '🇮🇳',
    score: 63,
    prevScore: 59,
    trend: 'up',
    driver: 'Domestic demand resilient. FII inflows returning to Nifty.',
  },
  {
    id: 'brazil',
    label: 'Brasil',
    flag: '🇧🇷',
    score: 45,
    prevScore: 47,
    trend: 'down',
    driver: 'Commodity dependence. Real weakening but Selic rate holding.',
  },
  {
    id: 'taiwan',
    label: '台灣 (Taiwan)',
    flag: '🇹🇼',
    score: 44,
    prevScore: 52,
    trend: 'down',
    driver: 'TSMC capex cycle + geopolitical risk premium elevated.',
  },
  {
    id: 'australia',
    label: 'Australia',
    flag: '🇦🇺',
    score: 48,
    prevScore: 46,
    trend: 'neutral',
    driver: 'Iron ore price stabilization. RBA holding rates steady.',
  },
];

// ── By Asset Class ────────────────────────────────────────────────────────────
export const fearGreedByAsset: FearGreedEntry[] = [
  {
    id: 'us-equities',
    label: 'US Stocks (S&P 500)',
    flag: '📈',
    score: 31,
    prevScore: 42,
    trend: 'down',
    driver: 'Earnings guidance cuts + tariff margin compression fears.',
  },
  {
    id: 'crypto',
    label: 'Crypto (BTC/ETH)',
    flag: '₿',
    score: 47,
    prevScore: 55,
    trend: 'down',
    driver: 'BTC holding $85K support. Institutional demand vs macro headwinds.',
  },
  {
    id: 'gold',
    label: 'Gold (XAU)',
    flag: '🥇',
    score: 76,
    prevScore: 68,
    trend: 'up',
    driver: 'Safe haven bid strongest since 2020. Central bank accumulation.',
  },
  {
    id: 'bonds',
    label: 'US Treasuries',
    flag: '🏛️',
    score: 58,
    prevScore: 52,
    trend: 'up',
    driver: 'Flight to quality. 10Y yield falling on recession fears.',
  },
  {
    id: 'real-estate',
    label: 'Real Estate (REITs)',
    flag: '🏢',
    score: 25,
    prevScore: 30,
    trend: 'down',
    driver: 'Commercial RE stress. Higher-for-longer rate sensitivity.',
  },
  {
    id: 'oil',
    label: 'Oil (WTI/Brent)',
    flag: '🛢️',
    score: 38,
    prevScore: 45,
    trend: 'down',
    driver: 'Demand slowdown fears. OPEC+ output decision uncertain.',
  },
  {
    id: 'semiconductors',
    label: 'Semiconductors',
    flag: '🔬',
    score: 35,
    prevScore: 48,
    trend: 'down',
    driver: 'NVDA pullback. Export restrictions + HBM supply glut concern.',
  },
  {
    id: 'defense',
    label: 'Defense & Aerospace',
    flag: '🛡️',
    score: 72,
    prevScore: 65,
    trend: 'up',
    driver: 'NATO spending commitments. Geopolitical crisis cycle sustained.',
  },
  {
    id: 'ai-cloud',
    label: 'AI / Cloud',
    flag: '🤖',
    score: 42,
    prevScore: 58,
    trend: 'down',
    driver: 'Capex sustainability debate. DeepSeek efficiency shock lingering.',
  },
  {
    id: 'commodities',
    label: 'Commodities (DJP)',
    flag: '⛏️',
    score: 44,
    prevScore: 41,
    trend: 'neutral',
    driver: 'China demand mixed. Critical minerals strategic bid ongoing.',
  },
];

// ── Money Flow Signals ────────────────────────────────────────────────────────
export interface MoneyFlowSector {
  sector: string;
  sectorKo: string;
  direction: 'inflow' | 'outflow';
  magnitude: number; // 1–5
  topMovers: Array<{ ticker: string; action: string }>;
  reason: string;
}

export const moneyFlowSectors: MoneyFlowSector[] = [
  {
    sector: 'Defense',
    sectorKo: '방산',
    direction: 'inflow',
    magnitude: 5,
    topMovers: [{ ticker: 'LMT', action: '↑' }, { ticker: 'NOC', action: '↑' }, { ticker: 'RTX', action: '↑' }],
    reason: 'NATO budget acceleration + Middle East conflict premium',
  },
  {
    sector: 'Gold / Precious Metals',
    sectorKo: '금 / 귀금속',
    direction: 'inflow',
    magnitude: 5,
    topMovers: [{ ticker: 'GLD', action: '↑' }, { ticker: 'NEM', action: '↑' }, { ticker: 'GOLD', action: '↑' }],
    reason: 'Central bank accumulation + dollar debasement hedge',
  },
  {
    sector: 'Energy Infrastructure',
    sectorKo: '에너지 인프라',
    direction: 'inflow',
    magnitude: 4,
    topMovers: [{ ticker: 'KMI', action: '↑' }, { ticker: 'WMB', action: '↑' }, { ticker: 'ET', action: '↑' }],
    reason: 'AI data center power demand + LNG export build-out',
  },
  {
    sector: 'Critical Minerals',
    sectorKo: '핵심 광물',
    direction: 'inflow',
    magnitude: 4,
    topMovers: [{ ticker: 'ALB', action: '↑' }, { ticker: 'MP', action: '↑' }, { ticker: 'FCX', action: '↑' }],
    reason: 'Sovereign reshoring mandates — quiet institutional accumulation',
  },
  {
    sector: 'Financials (Big Banks)',
    sectorKo: '대형 금융',
    direction: 'inflow',
    magnitude: 3,
    topMovers: [{ ticker: 'JPM', action: '↑' }, { ticker: 'GS', action: '↑' }, { ticker: 'BLK', action: '↑' }],
    reason: 'Cantillon-positioned for next easing cycle. Dark pool accumulation.',
  },
  {
    sector: 'Consumer Discretionary',
    sectorKo: '경기소비재',
    direction: 'outflow',
    magnitude: 4,
    topMovers: [{ ticker: 'AMZN', action: '↓' }, { ticker: 'NKE', action: '↓' }, { ticker: 'TGT', action: '↓' }],
    reason: 'Tariff cost pass-through + consumer confidence deterioration',
  },
  {
    sector: 'Commercial Real Estate',
    sectorKo: '상업용 부동산',
    direction: 'outflow',
    magnitude: 5,
    topMovers: [{ ticker: 'VNO', action: '↓' }, { ticker: 'SLG', action: '↓' }, { ticker: 'BXP', action: '↓' }],
    reason: 'Office vacancy rates elevated. Rate sensitivity extreme.',
  },
  {
    sector: 'Biotech (Speculative)',
    sectorKo: '바이오텍 (투기)',
    direction: 'outflow',
    magnitude: 3,
    topMovers: [{ ticker: 'MRNA', action: '↓' }, { ticker: 'BNTX', action: '↓' }],
    reason: 'Risk-off rotation. Clinical trial pipeline uncertainty.',
  },
];
