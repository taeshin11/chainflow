/**
 * /api/fedwatch
 *
 * FOMC 회의별 금리 인하/동결/인상 확률 (CME FedWatch 스타일)
 * 정적 데이터 제공 — 필요 시 업데이트
 * Cache: 4h Redis
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function cacheKey(): string {
  const hour = new Date().toISOString().slice(0, 13);
  return `flowvium:fedwatch:v1:${hour}`;
}

export interface FomcMeeting {
  date: string;         // "2026-05-07"
  label: string;        // "May 7"
  current: number;      // current target rate mid (e.g. 4.375)
  targetLow: number;    // e.g. 4.25
  targetHigh: number;   // e.g. 4.50
  probHike: number;     // 0~100 %
  probHold: number;
  probCut25: number;    // 1 cut (25bp)
  probCut50: number;    // 2 cuts (50bp)
  probCut75: number;    // 3+ cuts
  impliedRate: number;  // market implied rate mid
  cumulativeCuts: number; // expected cumulative cuts in bp from now
}

export interface FedWatchData {
  currentTargetLow: number;
  currentTargetHigh: number;
  currentRateMid: number;
  meetings: FomcMeeting[];
  yearEndImpliedRate: number;
  totalImpliedCuts: number;  // bps
  updatedAt: string;
  source: string;
}

// ── Static data (updated 2026-04-16) ─────────────────────────────────────────
// Based on market consensus / Fed Funds futures pricing
const STATIC_DATA: FedWatchData = {
  currentTargetLow: 4.25,
  currentTargetHigh: 4.50,
  currentRateMid: 4.375,
  meetings: [
    {
      date: '2026-05-07',
      label: 'May 7',
      current: 4.375,
      targetLow: 4.25,
      targetHigh: 4.50,
      probHike: 0.5,
      probHold: 82.3,
      probCut25: 16.8,
      probCut50: 0.4,
      probCut75: 0,
      impliedRate: 4.33,
      cumulativeCuts: 0,
    },
    {
      date: '2026-06-18',
      label: 'Jun 18',
      current: 4.375,
      targetLow: 4.00,
      targetHigh: 4.25,
      probHike: 0.2,
      probHold: 44.1,
      probCut25: 48.3,
      probCut50: 7.2,
      probCut75: 0.2,
      impliedRate: 4.19,
      cumulativeCuts: 25,
    },
    {
      date: '2026-07-30',
      label: 'Jul 30',
      current: 4.375,
      targetLow: 3.75,
      targetHigh: 4.00,
      probHike: 0,
      probHold: 28.6,
      probCut25: 42.1,
      probCut50: 26.8,
      probCut75: 2.5,
      impliedRate: 4.02,
      cumulativeCuts: 50,
    },
    {
      date: '2026-09-17',
      label: 'Sep 17',
      current: 4.375,
      targetLow: 3.50,
      targetHigh: 3.75,
      probHike: 0,
      probHold: 18.2,
      probCut25: 36.5,
      probCut50: 33.1,
      probCut75: 12.2,
      impliedRate: 3.84,
      cumulativeCuts: 75,
    },
    {
      date: '2026-10-29',
      label: 'Oct 29',
      current: 4.375,
      targetLow: 3.25,
      targetHigh: 3.50,
      probHike: 0,
      probHold: 14.3,
      probCut25: 32.0,
      probCut50: 35.7,
      probCut75: 18.0,
      impliedRate: 3.68,
      cumulativeCuts: 100,
    },
    {
      date: '2026-12-10',
      label: 'Dec 10',
      current: 4.375,
      targetLow: 3.00,
      targetHigh: 3.25,
      probHike: 0,
      probHold: 12.1,
      probCut25: 28.4,
      probCut50: 36.5,
      probCut75: 23.0,
      impliedRate: 3.52,
      cumulativeCuts: 125,
    },
  ],
  yearEndImpliedRate: 3.52,
  totalImpliedCuts: 125,
  updatedAt: '2026-04-16',
  source: 'CME FedWatch 기반 시장 컨센서스',
};

// ── CME live fetch (unofficial endpoint) ─────────────────────────────────────
async function fetchCMEImpliedRates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      'https://www.cmegroup.com/CmeWS/mvc/ProductCalendar/V2/FF/FUTURE?type=AC&venue=G&pageSize=24&pageNum=0',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html',
          'Origin': 'https://www.cmegroup.com',
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items: Array<Record<string, string>> = data?.items ?? data?.rows ?? [];
    if (!items.length) return null;

    // Map month label → implied rate (100 - settlePx)
    const rates: Record<string, number> = {};
    for (const item of items) {
      const price = parseFloat(item.settlePx ?? item.lastPx ?? item.last ?? '0');
      const month = (item.month ?? item.expirationDate ?? '').toString().toUpperCase();
      if (price > 90 && month) {
        rates[month] = parseFloat((100 - price).toFixed(4));
      }
    }
    return Object.keys(rates).length ? rates : null;
  } catch {
    return null;
  }
}

// Map CME month code to a meeting, compute probability from implied rate
function computeMeetingProbs(
  meeting: FomcMeeting,
  impliedRates: Record<string, number>,
  currentMid: number,
): Partial<FomcMeeting> {
  // Month codes: MAY26, JUN26, etc.
  const d = new Date(meeting.date);
  const monthCodes = [
    `${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]}${String(d.getFullYear()).slice(2)}`,
    `${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]}${d.getFullYear()}`,
  ];
  const implied = monthCodes.reduce((acc: number | null, code) => {
    const r = impliedRates[code];
    return r !== undefined ? r : acc;
  }, null);

  if (implied === null) return {};

  const diff = currentMid - implied; // positive = market expects cuts
  // Each 25bp cut reduces rate by 0.25
  const rawCuts = diff / 0.25;
  const probCut25 = Math.min(100, Math.max(0, Math.round(rawCuts * 100)));
  const probHold = Math.max(0, 100 - probCut25);

  return {
    impliedRate: parseFloat(implied.toFixed(3)),
    probHold: parseFloat(probHold.toFixed(1)),
    probCut25: parseFloat(probCut25.toFixed(1)),
    probCut50: 0,
    probCut75: 0,
    probHike: 0,
    cumulativeCuts: Math.round(Math.max(0, diff) * 4) * 25,
  };
}

export async function GET() {
  const redis = createRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey());
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch { /* non-fatal */ }
  }

  // Try live CME data
  const cmeRates = await fetchCMEImpliedRates();
  let meetings = STATIC_DATA.meetings;
  let source = STATIC_DATA.source;
  let liveData = false;

  if (cmeRates && Object.keys(cmeRates).length >= 3) {
    liveData = true;
    source = 'CME Fed Funds Futures 실시간';
    meetings = STATIC_DATA.meetings.map(m => {
      const live = computeMeetingProbs(m, cmeRates, STATIC_DATA.currentRateMid);
      return { ...m, ...live };
    });
    // Recompute year-end implied
    const lastMeeting = meetings[meetings.length - 1];
  }

  const result: FedWatchData & { cached: boolean; liveData: boolean } = {
    ...STATIC_DATA,
    meetings,
    source,
    yearEndImpliedRate: meetings[meetings.length - 1]?.impliedRate ?? STATIC_DATA.yearEndImpliedRate,
    totalImpliedCuts: meetings[meetings.length - 1]?.cumulativeCuts ?? STATIC_DATA.totalImpliedCuts,
    updatedAt: liveData ? new Date().toISOString().slice(0, 10) : STATIC_DATA.updatedAt,
    cached: false,
    liveData,
  };

  if (redis) {
    try { await redis.set(cacheKey(), result, { ex: 4 * 60 * 60 }); } catch { /* non-fatal */ }
  }

  return NextResponse.json(result);
}
