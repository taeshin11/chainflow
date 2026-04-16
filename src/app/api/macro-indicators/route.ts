/**
 * /api/macro-indicators
 *
 * Returns key macro-economic indicators that affect interest rates
 * + cascade impact analysis per indicator
 *
 * Data sources:
 *   1. FRED (Federal Reserve Economic Data) — free, no key needed for many series
 *   2. Static fallback with recent well-known values
 *
 * Cache: 4h Redis
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

// ── Indicator definitions with cascade logic ──────────────────────────────────
export interface CascadeStep {
  asset: string;
  direction: 'up' | 'down' | 'mixed';
  reason: string;
  magnitude: 'strong' | 'moderate' | 'weak';
}

export interface MacroIndicator {
  id: string;
  name: string;
  nameKo: string;
  category: 'inflation' | 'employment' | 'growth' | 'monetary' | 'trade';
  actual: number | null;
  forecast: number | null;
  previous: number | null;
  unit: string;
  releaseDate: string;
  nextRelease?: string;
  surprise: 'beat' | 'miss' | 'inline' | 'pending';
  rateImpact: 'hawkish' | 'dovish' | 'neutral';
  rateImpactKo: string;
  cascade: CascadeStep[];
  summary: string;
}

// ── FRED API (free, no key) ────────────────────────────────────────────────────
async function fetchFRED(series: string): Promise<{ value: number; date: string } | null> {
  try {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}&vintage_date=${new Date().toISOString().slice(0, 10)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split('\n').slice(1).filter(l => !l.includes('.'));
    const last = lines[lines.length - 1]?.split(',');
    if (!last || last.length < 2) return null;
    const value = parseFloat(last[1]);
    if (isNaN(value)) return null;
    return { value, date: last[0] };
  } catch { return null; }
}

// ── Yield Curve: fetch US Treasury rates ──────────────────────────────────────
// FRED series: DGS1MO, DGS3MO, DGS6MO, DGS1, DGS2, DGS5, DGS10, DGS30
const YIELD_SERIES = [
  { label: '1M',  series: 'DGS1MO' },
  { label: '3M',  series: 'DGS3MO' },
  { label: '6M',  series: 'DGS6MO' },
  { label: '1Y',  series: 'DGS1'   },
  { label: '2Y',  series: 'DGS2'   },
  { label: '5Y',  series: 'DGS5'   },
  { label: '10Y', series: 'DGS10'  },
  { label: '30Y', series: 'DGS30'  },
];

export interface YieldPoint { label: string; value: number | null; }

async function fetchYieldCurve(): Promise<{ points: YieldPoint[]; inverted: boolean; spread10y2y: number | null }> {
  const results = await Promise.all(
    YIELD_SERIES.map(async ({ label, series }) => {
      const data = await fetchFRED(series);
      return { label, value: data?.value ?? null };
    })
  );
  const y2 = results.find(r => r.label === '2Y')?.value ?? null;
  const y10 = results.find(r => r.label === '10Y')?.value ?? null;
  const spread10y2y = y2 !== null && y10 !== null ? parseFloat((y10 - y2).toFixed(2)) : null;
  const inverted = spread10y2y !== null && spread10y2y < 0;
  return { points: results, inverted, spread10y2y };
}

// ── Cascade logic by indicator ────────────────────────────────────────────────
function buildCascade(id: string, surprise: 'beat' | 'miss' | 'inline' | 'pending'): CascadeStep[] {
  if (surprise === 'pending' || surprise === 'inline') return [];

  const cascades: Record<string, { beat: CascadeStep[]; miss: CascadeStep[] }> = {
    cpi: {
      beat: [ // higher than expected = hawkish
        { asset: '미 국채 금리', direction: 'up', reason: 'Fed 긴축 기대↑ → 채권 매도', magnitude: 'strong' },
        { asset: '달러 (DXY)', direction: 'up', reason: '금리 상승 → 달러 강세', magnitude: 'strong' },
        { asset: '미국 주식 (S&P500)', direction: 'down', reason: '할인율 상승 → 밸류에이션 압박', magnitude: 'moderate' },
        { asset: '금 (GLD)', direction: 'down', reason: '실질금리 상승 → 금 비용 증가', magnitude: 'moderate' },
        { asset: 'EM 주식/통화', direction: 'down', reason: '달러 강세 → 자본 이탈', magnitude: 'strong' },
        { asset: '부동산/REIT', direction: 'down', reason: '모기지 금리 상승', magnitude: 'moderate' },
      ],
      miss: [
        { asset: '미 국채 금리', direction: 'down', reason: 'Fed 완화 기대↑ → 채권 매수', magnitude: 'strong' },
        { asset: '달러 (DXY)', direction: 'down', reason: '금리 하락 기대 → 달러 약세', magnitude: 'moderate' },
        { asset: '미국 주식 (S&P500)', direction: 'up', reason: '할인율 하락 → 밸류에이션 개선', magnitude: 'strong' },
        { asset: '금 (GLD)', direction: 'up', reason: '실질금리 하락 → 금 매력↑', magnitude: 'strong' },
        { asset: 'EM 주식/통화', direction: 'up', reason: '달러 약세 → 자본 유입', magnitude: 'moderate' },
      ],
    },
    pce: {
      beat: [
        { asset: '미 국채 금리', direction: 'up', reason: 'Fed 선호 지표 상회 → 긴축 강화', magnitude: 'strong' },
        { asset: '미국 주식 (S&P500)', direction: 'down', reason: '금리 인하 시기 후퇴', magnitude: 'strong' },
        { asset: '달러 (DXY)', direction: 'up', reason: '매파적 Fed 입장 강화', magnitude: 'moderate' },
        { asset: '하이일드채 (HYG)', direction: 'down', reason: '크레딧 스프레드 확대', magnitude: 'weak' },
      ],
      miss: [
        { asset: '미 국채 금리', direction: 'down', reason: 'Fed 목표 근접 → 인하 기대↑', magnitude: 'strong' },
        { asset: '미국 주식 (S&P500)', direction: 'up', reason: '금리 인하 시기 앞당김', magnitude: 'strong' },
        { asset: '금 (GLD)', direction: 'up', reason: '실질금리 하락', magnitude: 'moderate' },
        { asset: 'EM 주식', direction: 'up', reason: '달러 약세 전망', magnitude: 'moderate' },
      ],
    },
    nfp: {
      beat: [
        { asset: '미 국채 금리', direction: 'up', reason: '고용 강세 → Fed 긴축 여력', magnitude: 'strong' },
        { asset: '달러 (DXY)', direction: 'up', reason: '경제 강세 → 달러 수요', magnitude: 'moderate' },
        { asset: '미국 주식 (S&P500)', direction: 'mixed', reason: '성장 호조 vs 금리 상승 충돌', magnitude: 'weak' },
        { asset: '원유 (USO)', direction: 'up', reason: '경기 강세 → 수요 확대 기대', magnitude: 'weak' },
      ],
      miss: [
        { asset: '미 국채 금리', direction: 'down', reason: '경기 우려 → 안전자산 매수', magnitude: 'strong' },
        { asset: '미국 주식 (S&P500)', direction: 'down', reason: '경기 침체 우려', magnitude: 'moderate' },
        { asset: '금 (GLD)', direction: 'up', reason: '경기 불확실성 → 안전자산', magnitude: 'moderate' },
        { asset: '달러 (DXY)', direction: 'mixed', reason: '경기 약화 vs 안전자산 수요 충돌', magnitude: 'weak' },
      ],
    },
    fomc: {
      beat: [ // beat = more hawkish than expected
        { asset: '미 국채 금리', direction: 'up', reason: '예상보다 매파 → 즉각 금리 반영', magnitude: 'strong' },
        { asset: '달러 (DXY)', direction: 'up', reason: '금리 차이 확대', magnitude: 'strong' },
        { asset: '미국 주식 (S&P500)', direction: 'down', reason: '유동성 축소 우려', magnitude: 'strong' },
        { asset: '비트코인 (BITO)', direction: 'down', reason: '위험자산 회피', magnitude: 'strong' },
        { asset: '금 (GLD)', direction: 'down', reason: '실질금리 급등', magnitude: 'moderate' },
        { asset: 'EM 주식', direction: 'down', reason: '달러 강세 + 자본 이탈', magnitude: 'strong' },
      ],
      miss: [
        { asset: '미 국채 금리', direction: 'down', reason: '완화적 발언 → 채권 랠리', magnitude: 'strong' },
        { asset: '미국 주식 (S&P500)', direction: 'up', reason: '유동성 기대 + 멀티플 확장', magnitude: 'strong' },
        { asset: '비트코인 (BITO)', direction: 'up', reason: '위험선호 + 유동성 기대', magnitude: 'strong' },
        { asset: '금 (GLD)', direction: 'up', reason: '실질금리 하락', magnitude: 'strong' },
        { asset: 'EM 주식', direction: 'up', reason: '달러 약세 + 자본 유입', magnitude: 'moderate' },
      ],
    },
    gdp: {
      beat: [
        { asset: '미 국채 금리', direction: 'up', reason: '성장 호조 → 인플레 우려 + 긴축', magnitude: 'moderate' },
        { asset: '미국 주식 (S&P500)', direction: 'up', reason: '기업 실적 기대 강화', magnitude: 'moderate' },
        { asset: '달러 (DXY)', direction: 'up', reason: '경제 강세 → 자본 유입', magnitude: 'moderate' },
        { asset: '원자재', direction: 'up', reason: '글로벌 수요 증가 기대', magnitude: 'weak' },
      ],
      miss: [
        { asset: '미 국채 금리', direction: 'down', reason: '침체 우려 → 인하 기대', magnitude: 'moderate' },
        { asset: '미국 주식 (S&P500)', direction: 'down', reason: '기업 실적 하향 우려', magnitude: 'moderate' },
        { asset: '금 (GLD)', direction: 'up', reason: '경기 불안 → 안전자산', magnitude: 'moderate' },
      ],
    },
    ism: {
      beat: [
        { asset: '미국 주식 (S&P500)', direction: 'up', reason: '제조업/서비스업 확장 → 경기 강세', magnitude: 'moderate' },
        { asset: '미 국채 금리', direction: 'up', reason: '경기 과열 → 긴축 우려', magnitude: 'weak' },
        { asset: '원자재', direction: 'up', reason: '산업 수요 확대', magnitude: 'moderate' },
      ],
      miss: [
        { asset: '미국 주식 (S&P500)', direction: 'down', reason: '경기 둔화 신호', magnitude: 'moderate' },
        { asset: '금 (GLD)', direction: 'up', reason: '경기 우려 → 안전자산', magnitude: 'weak' },
        { asset: '미 국채 금리', direction: 'down', reason: '경기 약화 → 완화 기대', magnitude: 'moderate' },
      ],
    },
  };

  const def = cascades[id];
  if (!def) return [];
  return surprise === 'beat' ? def.beat : def.miss;
}

// ── Static recent data (fallback + context) ───────────────────────────────────
const STATIC_INDICATORS: Omit<MacroIndicator, 'cascade'>[] = [
  {
    id: 'cpi',
    name: 'CPI (Consumer Price Index)',
    nameKo: '소비자 물가지수',
    category: 'inflation',
    actual: 2.4,
    forecast: 2.5,
    previous: 2.8,
    unit: '%YoY',
    releaseDate: '2026-04-10',
    nextRelease: '2026-05-13',
    surprise: 'miss',   // came in below forecast = dovish
    rateImpact: 'dovish',
    rateImpactKo: '비둘기파 (인하 기대↑)',
    summary: '3월 CPI 2.4%로 예상(2.5%)보다 낮게 발표. 에너지·중고차 하락 주도. Fed 6월 인하 기대 강화.',
  },
  {
    id: 'pce',
    name: 'PCE Price Index (Core)',
    nameKo: '근원 개인소비지출 물가',
    category: 'inflation',
    actual: 2.6,
    forecast: 2.6,
    previous: 2.7,
    unit: '%YoY',
    releaseDate: '2026-03-28',
    nextRelease: '2026-04-30',
    surprise: 'inline',
    rateImpact: 'neutral',
    rateImpactKo: '중립',
    summary: 'Fed 선호 인플레 지표 예상치 부합. 2.6%로 목표 2%에 아직 거리 있음.',
  },
  {
    id: 'nfp',
    name: 'Non-Farm Payrolls',
    nameKo: '비농업 고용지수',
    category: 'employment',
    actual: 228000,
    forecast: 140000,
    previous: 117000,
    unit: '천명',
    releaseDate: '2026-04-04',
    nextRelease: '2026-05-02',
    surprise: 'beat',
    rateImpact: 'hawkish',
    rateImpactKo: '매파적 (긴축 여력 유지)',
    summary: '3월 NFP 228K로 예상(140K) 대폭 상회. 실업률 4.2%. 노동시장 강세로 6월 인하 전망 약화.',
  },
  {
    id: 'fomc',
    name: 'FOMC Rate Decision',
    nameKo: 'FOMC 금리 결정',
    category: 'monetary',
    actual: 4.5,
    forecast: 4.5,
    previous: 4.5,
    unit: '%',
    releaseDate: '2026-03-19',
    nextRelease: '2026-05-07',
    surprise: 'inline',
    rateImpact: 'neutral',
    rateImpactKo: '동결 (불확실성 유지)',
    summary: '3월 FOMC 동결 결정. 점도표 연내 2회 인하 유지. Powell "데이터 의존" 강조.',
  },
  {
    id: 'gdp',
    name: 'GDP Growth Rate (Q4)',
    nameKo: 'GDP 성장률',
    category: 'growth',
    actual: 2.4,
    forecast: 2.3,
    previous: 3.1,
    unit: '%QoQ SAAR',
    releaseDate: '2026-03-27',
    nextRelease: '2026-04-30',
    surprise: 'beat',
    rateImpact: 'hawkish',
    rateImpactKo: '경기 강세 → 긴축 여력',
    summary: 'Q4 GDP 확정치 2.4%, 속보치 상회. 소비 지출·민간투자 견조. 연착륙 기대 유지.',
  },
  {
    id: 'ism',
    name: 'ISM Manufacturing PMI',
    nameKo: 'ISM 제조업 PMI',
    category: 'growth',
    actual: 49.0,
    forecast: 49.5,
    previous: 50.3,
    unit: '지수',
    releaseDate: '2026-04-01',
    nextRelease: '2026-05-01',
    surprise: 'miss',
    rateImpact: 'dovish',
    rateImpactKo: '경기 둔화 → 인하 기대',
    summary: '4월 ISM 제조 49.0으로 50 기준선 하회. 신규 주문·고용 서브지수 위축. 관세 불확실성 영향.',
  },
  {
    id: 'retail',
    name: 'Retail Sales',
    nameKo: '소매 판매',
    category: 'growth',
    actual: -1.1,
    forecast: -1.3,
    previous: 0.7,
    unit: '%MoM',
    releaseDate: '2026-04-16',
    nextRelease: '2026-05-15',
    surprise: 'beat',
    rateImpact: 'neutral',
    rateImpactKo: '예상보다 양호',
    summary: '3월 소매판매 -1.1%로 예상(-1.3%) 소폭 상회. 자동차 선구매 기저효과 영향. 소비 둔화 흐름.',
  },
  {
    id: 'ppi',
    name: 'PPI (Producer Price Index)',
    nameKo: '생산자 물가지수',
    category: 'inflation',
    actual: 2.7,
    forecast: 3.3,
    previous: 3.2,
    unit: '%YoY',
    releaseDate: '2026-04-11',
    nextRelease: '2026-05-14',
    surprise: 'miss',
    rateImpact: 'dovish',
    rateImpactKo: '비둘기파 (물가 압력 완화)',
    summary: '3월 PPI 2.7%로 예상(3.3%) 크게 하회. 에너지·서비스 원가 하락. CPI 선행 지표로서 긍정적.',
  },
];

export async function GET() {
  const redis = createRedis();
  const cacheKey = 'flowvium:macro-indicators:v2';

  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch { /* non-fatal */ }
  }

  // Build indicators with cascade
  const indicators: MacroIndicator[] = STATIC_INDICATORS.map((ind) => ({
    ...ind,
    cascade: buildCascade(ind.id, ind.surprise),
  }));

  // Try to enrich CPI and unemployment from FRED (best-effort)
  try {
    const [fredCPI, fredUnemp] = await Promise.allSettled([
      fetchFRED('CPIAUCSL'),
      fetchFRED('UNRATE'),
    ]);
    if (fredUnemp.status === 'fulfilled' && fredUnemp.value) {
      indicators.push({
        id: 'unrate',
        name: 'Unemployment Rate',
        nameKo: '실업률',
        category: 'employment',
        actual: fredUnemp.value.value,
        forecast: 4.1,
        previous: 4.1,
        unit: '%',
        releaseDate: fredUnemp.value.date,
        surprise: fredUnemp.value.value < 4.1 ? 'miss' : fredUnemp.value.value > 4.2 ? 'beat' : 'inline',
        rateImpact: fredUnemp.value.value < 4.0 ? 'hawkish' : fredUnemp.value.value > 4.3 ? 'dovish' : 'neutral',
        rateImpactKo: fredUnemp.value.value < 4.0 ? '매파적' : fredUnemp.value.value > 4.3 ? '비둘기파' : '중립',
        cascade: buildCascade('nfp', fredUnemp.value.value < 4.0 ? 'beat' : 'miss'),
        summary: `실업률 ${fredUnemp.value.value}% (${fredUnemp.value.date})`,
      });
    }
  } catch { /* non-fatal */ }

  // Yield curve
  const yieldCurve = await fetchYieldCurve();

  const response = { indicators, yieldCurve, updatedAt: new Date().toISOString() };

  if (redis) {
    try { await redis.set(cacheKey, response, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
  }

  return NextResponse.json(response);
}
