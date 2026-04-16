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

export async function GET() {
  const redis = createRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey());
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch { /* non-fatal */ }
  }

  const result = { ...STATIC_DATA, cached: false };

  if (redis) {
    try { await redis.set(cacheKey(), result, { ex: 4 * 60 * 60 }); } catch { /* non-fatal */ }
  }

  return NextResponse.json(result);
}
