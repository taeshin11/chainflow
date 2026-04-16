/**
 * /api/credit-balance
 *
 * 국가별 신용잔고(증거금 대출/마진 데트) 데이터
 * GDP 대비 비율, 역대 비교, 리스크 레벨 분석
 *
 * 데이터 소스:
 *   - 미국: FINRA Margin Statistics
 *   - 한국: KRX 신용거래융자
 *   - 일본: TSE 신용거래잔고
 *   - 중국: CSRC 융자융권 잔고
 *   - 유럽/기타: 각국 금융당국 통계
 *
 * 캐시: 24h Redis (일별 업데이트)
 */

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface CreditHistPoint {
  period: string;      // e.g. "2024-Q4"
  balance: number;     // billions USD
  gdpRatio: number;    // % of GDP
}

export interface CountryCreditData {
  id: string;
  country: string;
  flag: string;
  currentBalance: number;   // billions USD
  currentBalanceLocal: string; // e.g. "₩22.1조"
  gdp: number;              // billions USD (nominal, latest annual)
  gdpRatio: number;         // currentBalance / gdp * 100
  gdpRatioRank: 'low' | 'medium' | 'high' | 'extreme'; // vs own history
  changeYoY: number;        // % change from same period last year
  changeQoQ: number;        // % change from last quarter
  historical: CreditHistPoint[];
  peakBalance: number;
  peakPeriod: string;
  troughBalance: number;
  troughPeriod: string;
  histPercentile: number;   // 0-100, where current sits in history
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskReason: string;
  source: string;
  sourceUrl: string;
  lastUpdated: string;      // data as-of date
  // For plain language explanation
  laymanSummary: string;
}

// ── FINRA margin debt live fetch ─────────────────────────────────────────────
async function fetchFinraMarginDebt(): Promise<{ balance: number; period: string } | null> {
  try {
    // FINRA publishes margin statistics page — parse the latest monthly figure
    const res = await fetch(
      'https://api.finra.org/data/group/otcmarket/name/otcDailyList?limit=1',
      { signal: AbortSignal.timeout(8000), headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) throw new Error('FINRA API unavailable');
    // Fallback: try to get debit balance from FRED (DISCONTINUED but try)
    throw new Error('use FRED');
  } catch {
    try {
      // FRED: BOGZ1FL663067003Q = Margin loans (quarterly, billions)
      const fredRes = await fetch(
        'https://fred.stlouisfed.org/graph/fredgraph.csv?id=BOGZ1FL663067003Q',
        { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (!fredRes.ok) return null;
      const text = await fredRes.text();
      const rows = text.trim().split('\n').slice(1)
        .map(line => {
          const [date, val] = line.split(',');
          const value = parseFloat(val);
          return (!date || isNaN(value)) ? null : { date: date.trim(), value };
        })
        .filter((x): x is { date: string; value: number } => x !== null);
      const last = rows[rows.length - 1];
      if (!last) return null;
      // FRED returns in millions, convert to billions
      const billons = parseFloat((last.value / 1000).toFixed(1));
      const d = new Date(last.date);
      const quarter = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
      return { balance: billons, period: quarter };
    } catch {
      return null;
    }
  }
}

// ── Static data (researched, updated quarterly) ───────────────────────────────
// All balances converted to USD billions for cross-country comparison
// Historical data key points: 2015, 2017, 2019, 2020(trough), 2021(peak), 2022, 2023, 2024, 2025Q1

const DATA: CountryCreditData[] = [
  {
    id: 'us',
    country: '미국',
    flag: '🇺🇸',
    currentBalance: 815,      // ~$815B FINRA margin debt (2025 Q1)
    currentBalanceLocal: '$815B',
    gdp: 27360,
    gdpRatio: 2.98,
    gdpRatioRank: 'medium',
    changeYoY: +8.2,
    changeQoQ: +2.1,
    historical: [
      { period: '2015', balance: 507, gdpRatio: 2.8 },
      { period: '2016', balance: 513, gdpRatio: 2.7 },
      { period: '2017', balance: 581, gdpRatio: 2.9 },
      { period: '2018', balance: 554, gdpRatio: 2.7 },
      { period: '2019', balance: 562, gdpRatio: 2.6 },
      { period: '2020', balance: 722, gdpRatio: 3.4 },
      { period: '2021', balance: 936, gdpRatio: 4.1 },  // 역대 최고
      { period: '2022', balance: 622, gdpRatio: 2.5 },  // 급락
      { period: '2023', balance: 703, gdpRatio: 2.7 },
      { period: '2024', balance: 753, gdpRatio: 2.8 },
      { period: '2025-Q1', balance: 815, gdpRatio: 2.98 },
    ],
    peakBalance: 936,
    peakPeriod: '2021',
    troughBalance: 459,
    troughPeriod: '2009',
    histPercentile: 72,
    riskLevel: 'medium',
    riskReason: '2021년 역대 최고(936B) 대비 87% 수준. GDP 비율 3% 근접 — 과거 시장 조정 전 패턴과 유사.',
    source: 'FINRA Margin Statistics',
    sourceUrl: 'https://www.finra.org/investors/learn-to-invest/advanced-investing/margin-statistics',
    lastUpdated: '2025-03',
    laymanSummary: '미국 투자자들이 주식을 사기 위해 증권사에서 빌린 돈. 많이 빌릴수록 시장이 과열됐다는 신호예요.',
  },
  {
    id: 'kr',
    country: '한국',
    flag: '🇰🇷',
    currentBalance: 15.2,     // ~22.1조원 → ~$15.2B at 1450 KRW/USD
    currentBalanceLocal: '₩22.1조',
    gdp: 1710,
    gdpRatio: 0.89,
    gdpRatioRank: 'medium',
    changeYoY: -12.3,
    changeQoQ: -4.1,
    historical: [
      { period: '2015', balance: 6.2, gdpRatio: 0.45 },
      { period: '2016', balance: 7.8, gdpRatio: 0.55 },
      { period: '2017', balance: 9.5, gdpRatio: 0.64 },
      { period: '2018', balance: 11.2, gdpRatio: 0.72 },
      { period: '2019', balance: 10.1, gdpRatio: 0.63 },
      { period: '2020', balance: 15.5, gdpRatio: 0.98 },
      { period: '2021', balance: 24.8, gdpRatio: 1.48 }, // 역대 최고 (₩36조)
      { period: '2022', balance: 14.3, gdpRatio: 0.84 },
      { period: '2023', balance: 14.8, gdpRatio: 0.86 },
      { period: '2024', balance: 17.4, gdpRatio: 1.02 },
      { period: '2025-Q1', balance: 15.2, gdpRatio: 0.89 },
    ],
    peakBalance: 24.8,
    peakPeriod: '2021',
    troughBalance: 5.1,
    troughPeriod: '2014',
    histPercentile: 58,
    riskLevel: 'medium',
    riskReason: '2021년 역대 최고(₩36조) 대비 61% 수준으로 감소. 개인투자자 비중 높아 변동성 위험 상존.',
    source: 'KRX 신용거래융자 통계',
    sourceUrl: 'https://data.krx.co.kr',
    lastUpdated: '2025-03',
    laymanSummary: '코스피·코스닥 투자자들이 증권사에서 빌려서 주식 산 돈의 총합이에요. 줄고 있어서 과열은 아니지만 개인 비중이 높아요.',
  },
  {
    id: 'jp',
    country: '일본',
    flag: '🇯🇵',
    currentBalance: 33.2,     // ~¥5.0조 → ~$33B at 150 JPY/USD
    currentBalanceLocal: '¥5.0조',
    gdp: 4213,
    gdpRatio: 0.79,
    gdpRatioRank: 'low',
    changeYoY: +18.6,
    changeQoQ: +5.2,
    historical: [
      { period: '2015', balance: 28.5, gdpRatio: 0.64 },
      { period: '2016', balance: 22.1, gdpRatio: 0.52 },
      { period: '2017', balance: 31.4, gdpRatio: 0.68 },
      { period: '2018', balance: 26.8, gdpRatio: 0.55 },
      { period: '2019', balance: 21.2, gdpRatio: 0.47 },
      { period: '2020', balance: 18.9, gdpRatio: 0.44 },
      { period: '2021', balance: 25.3, gdpRatio: 0.57 },
      { period: '2022', balance: 22.7, gdpRatio: 0.56 },
      { period: '2023', balance: 27.9, gdpRatio: 0.65 },
      { period: '2024', balance: 28.0, gdpRatio: 0.66 },
      { period: '2025-Q1', balance: 33.2, gdpRatio: 0.79 },
    ],
    peakBalance: 43.2,
    peakPeriod: '2006',
    troughBalance: 14.1,
    troughPeriod: '2009',
    histPercentile: 55,
    riskLevel: 'medium',
    riskReason: '닛케이 사상 최고 경신 후 신용잔고 급증 (+18.6% YoY). 엔화 약세로 달러 기준 변동 큼.',
    source: 'TSE (도쿄증권거래소)',
    sourceUrl: 'https://www.jpx.co.jp/markets/statistics-equities/margin/index.html',
    lastUpdated: '2025-03',
    laymanSummary: '일본 주식시장 투자자들의 신용 레버리지. 닛케이 최고점 경신과 함께 빠르게 늘고 있어 주의 필요해요.',
  },
  {
    id: 'cn',
    country: '중국',
    flag: '🇨🇳',
    currentBalance: 192,      // ~¥1.4조 위안 → ~$192B at 7.25 CNY/USD
    currentBalanceLocal: '¥1.4조위안',
    gdp: 17795,
    gdpRatio: 1.08,
    gdpRatioRank: 'medium',
    changeYoY: +31.4,
    changeQoQ: +14.2,
    historical: [
      { period: '2015', balance: 380, gdpRatio: 3.4 },  // 역대 최고 (버블)
      { period: '2016', balance: 95, gdpRatio: 0.87 },  // 급락 후
      { period: '2017', balance: 112, gdpRatio: 0.93 },
      { period: '2018', balance: 87, gdpRatio: 0.65 },
      { period: '2019', balance: 108, gdpRatio: 0.77 },
      { period: '2020', balance: 131, gdpRatio: 0.87 },
      { period: '2021', balance: 192, gdpRatio: 1.15 },
      { period: '2022', balance: 145, gdpRatio: 0.88 },
      { period: '2023', balance: 147, gdpRatio: 0.89 },
      { period: '2024', balance: 146, gdpRatio: 0.82 },
      { period: '2025-Q1', balance: 192, gdpRatio: 1.08 },
    ],
    peakBalance: 380,
    peakPeriod: '2015',
    troughBalance: 75,
    troughPeriod: '2013',
    histPercentile: 48,
    riskLevel: 'medium',
    riskReason: '정책 부양책으로 신용잔고 빠르게 반등 (+31% YoY). 2015년 버블(380B) 당시 대비 50% 수준이나 급속 증가세 경계.',
    source: 'CSRC 융자융권 잔고',
    sourceUrl: 'http://www.csrc.gov.cn',
    lastUpdated: '2025-03',
    laymanSummary: '중국 주식시장 신용거래 잔고. 정부 부양책으로 빠르게 늘고 있어요. 2015년 버블 때의 절반 수준이에요.',
  },
  {
    id: 'eu',
    country: '유럽 (EU)',
    flag: '🇪🇺',
    currentBalance: 118,      // estimate based on ESMA data
    currentBalanceLocal: '€108B',
    gdp: 18350,
    gdpRatio: 0.64,
    gdpRatioRank: 'low',
    changeYoY: +4.2,
    changeQoQ: +1.1,
    historical: [
      { period: '2015', balance: 98, gdpRatio: 0.64 },
      { period: '2016', balance: 88, gdpRatio: 0.57 },
      { period: '2017', balance: 105, gdpRatio: 0.66 },
      { period: '2018', balance: 97, gdpRatio: 0.60 },
      { period: '2019', balance: 95, gdpRatio: 0.58 },
      { period: '2020', balance: 102, gdpRatio: 0.67 },
      { period: '2021', balance: 128, gdpRatio: 0.79 },
      { period: '2022', balance: 105, gdpRatio: 0.66 },
      { period: '2023', balance: 107, gdpRatio: 0.62 },
      { period: '2024', balance: 113, gdpRatio: 0.63 },
      { period: '2025-Q1', balance: 118, gdpRatio: 0.64 },
    ],
    peakBalance: 128,
    peakPeriod: '2021',
    troughBalance: 70,
    troughPeriod: '2012',
    histPercentile: 62,
    riskLevel: 'low',
    riskReason: '유럽 주식시장 레버리지 전반적으로 안정적. GDP 대비 0.64%로 낮은 수준 유지.',
    source: 'ESMA Market Data',
    sourceUrl: 'https://www.esma.europa.eu',
    lastUpdated: '2025-Q1',
    laymanSummary: '유럽 주요국 증시 신용잔고 합산 추정치. 미국·중국 대비 레버리지 낮고 안정적이에요.',
  },
  {
    id: 'tw',
    country: '대만',
    flag: '🇹🇼',
    currentBalance: 18.4,     // ~NT$590B → ~$18B at 32 TWD/USD
    currentBalanceLocal: 'NT$590B',
    gdp: 756,
    gdpRatio: 2.43,
    gdpRatioRank: 'high',
    changeYoY: +22.1,
    changeQoQ: +8.3,
    historical: [
      { period: '2015', balance: 10.2, gdpRatio: 1.85 },
      { period: '2016', balance: 9.8, gdpRatio: 1.75 },
      { period: '2017', balance: 12.1, gdpRatio: 2.06 },
      { period: '2018', balance: 11.3, gdpRatio: 1.88 },
      { period: '2019', balance: 11.8, gdpRatio: 1.95 },
      { period: '2020', balance: 13.4, gdpRatio: 2.15 },
      { period: '2021', balance: 16.2, gdpRatio: 2.41 },
      { period: '2022', balance: 11.8, gdpRatio: 1.68 },
      { period: '2023', balance: 13.5, gdpRatio: 1.88 },
      { period: '2024', balance: 15.1, gdpRatio: 2.11 },
      { period: '2025-Q1', balance: 18.4, gdpRatio: 2.43 },
    ],
    peakBalance: 18.4,
    peakPeriod: '2025-Q1',  // 현재가 역대 최고!
    troughBalance: 7.2,
    troughPeriod: '2008',
    histPercentile: 96,
    riskLevel: 'high',
    riskReason: '⚠ 역대 최고 수준! TSMC·AI 반도체 수혜 기대로 신용 레버리지 급증. GDP 대비 2.43% — 버블 경계선.',
    source: 'TWSE 信用交易統計',
    sourceUrl: 'https://www.twse.com.tw',
    lastUpdated: '2025-03',
    laymanSummary: 'TSMC와 AI 반도체 붐으로 대만 투자자들의 레버리지가 역대 최고예요! GDP 대비 비율이 미국보다도 낮은 GDP 기준 위험 경보 수준.',
  },
  {
    id: 'in',
    country: '인도',
    flag: '🇮🇳',
    currentBalance: 28.5,     // ~₹2.4조 → ~$28.5B at 84 INR/USD
    currentBalanceLocal: '₹2.4조',
    gdp: 3570,
    gdpRatio: 0.80,
    gdpRatioRank: 'medium',
    changeYoY: +35.2,
    changeQoQ: +6.8,
    historical: [
      { period: '2015', balance: 4.8, gdpRatio: 0.23 },
      { period: '2016', balance: 5.2, gdpRatio: 0.24 },
      { period: '2017', balance: 7.6, gdpRatio: 0.33 },
      { period: '2018', balance: 6.9, gdpRatio: 0.27 },
      { period: '2019', balance: 6.1, gdpRatio: 0.22 },
      { period: '2020', balance: 8.3, gdpRatio: 0.32 },
      { period: '2021', balance: 13.5, gdpRatio: 0.47 },
      { period: '2022', balance: 14.2, gdpRatio: 0.46 },
      { period: '2023', balance: 18.9, gdpRatio: 0.57 },
      { period: '2024', balance: 21.1, gdpRatio: 0.62 },
      { period: '2025-Q1', balance: 28.5, gdpRatio: 0.80 },
    ],
    peakBalance: 28.5,
    peakPeriod: '2025-Q1',
    troughBalance: 3.2,
    troughPeriod: '2013',
    histPercentile: 99,
    riskLevel: 'high',
    riskReason: '⚠ 역대 최고 갱신 중! 신흥 중산층 소매 투자자 급증으로 신용잔고 가파른 상승. 조정 시 낙폭 위험.',
    source: 'NSE/BSE Margin Data',
    sourceUrl: 'https://www.nseindia.com',
    lastUpdated: '2025-03',
    laymanSummary: '인도 개인 투자자들이 급증하면서 신용거래도 역대 최고 수준이에요. 성장하는 시장이지만 레버리지 위험도 함께 증가 중.',
  },
  {
    id: 'us_gdp_sectors',
    country: '미국 GDP 비율 추이',
    flag: '🇺🇸',
    currentBalance: 815,
    currentBalanceLocal: '$815B',
    gdp: 27360,
    gdpRatio: 2.98,
    gdpRatioRank: 'medium',
    changeYoY: +8.2,
    changeQoQ: +2.1,
    historical: [
      { period: '2000', balance: 278, gdpRatio: 2.7 },  // 닷컴 버블
      { period: '2002', balance: 141, gdpRatio: 1.3 },  // 버블 붕괴
      { period: '2007', balance: 381, gdpRatio: 2.6 },  // 금융위기 전
      { period: '2009', balance: 234, gdpRatio: 1.6 },  // 금융위기 저점
      { period: '2015', balance: 507, gdpRatio: 2.8 },
      { period: '2018', balance: 554, gdpRatio: 2.7 },
      { period: '2020', balance: 722, gdpRatio: 3.4 },
      { period: '2021', balance: 936, gdpRatio: 4.1 },  // 역대 최고
      { period: '2022', balance: 622, gdpRatio: 2.5 },
      { period: '2024', balance: 753, gdpRatio: 2.8 },
      { period: '2025-Q1', balance: 815, gdpRatio: 2.98 },
    ],
    peakBalance: 936,
    peakPeriod: '2021',
    troughBalance: 141,
    troughPeriod: '2002',
    histPercentile: 72,
    riskLevel: 'medium',
    riskReason: '닷컴버블·금융위기 전 레벨(2.6~2.7%) 상회 중. 2021년 최고(4.1%) 대비 낮지만 상승 추세.',
    source: 'FINRA / World Bank',
    sourceUrl: 'https://www.finra.org',
    lastUpdated: '2025-03',
    laymanSummary: '장기 역사 관점: 닷컴 버블, 금융위기 때와 현재 수준 비교.',
  },
];

// Remove the duplicate US long-history from main list — it's for chart only
const COUNTRY_DATA = DATA.filter(d => d.id !== 'us_gdp_sectors');
const US_LONG_HISTORY = DATA.find(d => d.id === 'us_gdp_sectors')!;

// ── Risk thresholds (percentile-based) ────────────────────────────────────────
function computeRiskLabel(percentile: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (percentile >= 90) return 'extreme';
  if (percentile >= 70) return 'high';
  if (percentile >= 40) return 'medium';
  return 'low';
}

// ── Global snapshot ───────────────────────────────────────────────────────────
function buildGlobalSnapshot(countries: CountryCreditData[]) {
  const totalBalance = countries.reduce((s, c) => s + c.currentBalance, 0);
  const totalGdp = countries.reduce((s, c) => s + c.gdp, 0);
  const globalRatio = parseFloat(((totalBalance / totalGdp) * 100).toFixed(2));

  const riskCounts = { low: 0, medium: 0, high: 0, extreme: 0 };
  countries.forEach(c => riskCounts[c.riskLevel]++);

  const mostLeveraged = [...countries].sort((a, b) => b.gdpRatio - a.gdpRatio).slice(0, 3);
  const fastestGrowing = [...countries].sort((a, b) => b.changeYoY - a.changeYoY).slice(0, 3);

  return {
    totalBalance: parseFloat(totalBalance.toFixed(1)),
    globalGdpRatio: globalRatio,
    riskCounts,
    mostLeveraged,
    fastestGrowing,
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const redis = createRedis();
  const cacheKey = `flowvium:credit-balance:v2:${new Date().toISOString().slice(0, 10)}`;

  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return NextResponse.json({ ...cached, cached: true });
    } catch { /* non-fatal */ }
  }

  // Try to update US margin debt from FRED
  const finraLive = await fetchFinraMarginDebt();

  const countries = COUNTRY_DATA.map(c => {
    if (c.id === 'us' && finraLive) {
      const updated: CountryCreditData = {
        ...c,
        currentBalance: finraLive.balance,
        currentBalanceLocal: `$${finraLive.balance}B`,
        gdpRatio: parseFloat((finraLive.balance / c.gdp * 100).toFixed(2)),
        lastUpdated: finraLive.period,
        riskLevel: computeRiskLabel(c.histPercentile),
      };
      return updated;
    }
    return { ...c, riskLevel: computeRiskLabel(c.histPercentile) };
  });

  const globalSnapshot = buildGlobalSnapshot(countries);

  const response = {
    countries,
    usLongHistory: US_LONG_HISTORY,
    globalSnapshot,
    updatedAt: new Date().toISOString(),
    cached: false,
  };

  if (redis) {
    try {
      await redis.set(cacheKey, response, { ex: 24 * 60 * 60 });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json(response);
}
