import { newsGapData, type NewsGapEntry, type OwnershipRecord } from '@/data/news-gap';
import { getNewsGapCache } from '@/lib/signals-cache';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

const REDIS_KEY_OWNERSHIP = 'flowvium:13f-ownership:v1';

export interface NewsGapResult {
  entries: NewsGapEntry[];
  lastUpdated: string;
  source: 'live' | 'cached' | 'static';
  updatedTickers: number;
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Redis에서 EDGAR 파싱된 ownership 데이터 조회 */
async function getLiveOwnership(): Promise<Record<string, OwnershipRecord[]> | null> {
  try {
    const redis = createRedis();
    if (!redis) return null;
    const data = await redis.get(REDIS_KEY_OWNERSHIP);
    if (!data || typeof data !== 'object') return null;
    return data as Record<string, OwnershipRecord[]>;
  } catch (err) {
    logger.error('news-gap.service', 'get_ownership_failed', { error: err });
    return null;
  }
}

/**
 * Reads the shared news-gap Redis cache (written by the signals cron / signals-service).
 * Overlays:
 *   1. EDGAR 13F ownership 데이터 (실시간 파싱)
 *   2. Alpha Vantage mediaScore, gapScore, 실제 기사 헤드라인
 *
 * Zero additional Alpha Vantage calls — shares the same 25-ticker daily fetch budget.
 */
export async function getNewsGapData(): Promise<NewsGapResult> {
  const lastUpdated = new Date().toISOString();

  const [cached, liveOwnership] = await Promise.all([
    getNewsGapCache(),
    getLiveOwnership(),
  ]);

  const source = liveOwnership ? 'live' : cached ? 'cached' : 'static';

  if (!cached && !liveOwnership) {
    return {
      entries: [...newsGapData].sort((a, b) => b.gapScore - a.gapScore),
      lastUpdated,
      source: 'static',
      updatedTickers: 0,
    };
  }

  const entries = newsGapData.map((entry) => {
    const live = cached?.[entry.ticker];
    const mediaScore = live
      ? Math.min(100, Math.round(Math.sqrt(live.articles) * 5))
      : entry.mediaScore;

    // EDGAR 13F ownership이 있으면 정적 데이터를 교체
    const ownershipData = liveOwnership?.[entry.ticker] ?? entry.ownershipData;

    return {
      ...entry,
      gapScore: live?.score ?? entry.gapScore,
      mediaScore,
      recentArticles: live?.recentArticles?.length ? live.recentArticles : entry.recentArticles,
      ownershipData,
    };
  });

  // 정적 newsGapData에 없는 ticker가 EDGAR에 있으면 동적으로 추가
  if (liveOwnership) {
    for (const [ticker, ownership] of Object.entries(liveOwnership)) {
      if (!entries.find(e => e.ticker === ticker)) {
        const live = cached?.[ticker];
        entries.push({
          ticker,
          companyName: ticker,
          sector: 'other',
          ibActivityLevel: 'medium',
          ibActivityScore: 50,
          mediaScore: live ? Math.min(100, Math.round(Math.sqrt(live.articles) * 5)) : 30,
          gapScore: live?.score ?? 50,
          topInstitutions: ownership.map(o => o.institution).slice(0, 3),
          recentArticles: live?.recentArticles ?? [],
          ibActions: [],
          ownershipData: ownership,
        });
      }
    }
  }

  // Sort: strongest signal first
  entries.sort((a, b) => b.gapScore - a.gapScore);

  const updatedTickers = new Set([
    ...(Object.keys(cached ?? {})),
    ...(Object.keys(liveOwnership ?? {})),
  ].filter(t => entries.some(e => e.ticker === t))).size;

  return {
    entries,
    lastUpdated,
    source,
    updatedTickers,
  };
}
