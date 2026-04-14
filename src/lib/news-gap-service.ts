import { newsGapData, type NewsGapEntry } from '@/data/news-gap';
import { getNewsGapCache } from '@/lib/signals-cache';

export interface NewsGapResult {
  entries: NewsGapEntry[];
  lastUpdated: string;
  source: 'live' | 'cached' | 'static';
  updatedTickers: number;
}

/**
 * Reads the shared news-gap Redis cache (written by the signals cron / signals-service).
 * Overlays live mediaScore, gapScore, and real headlines onto the static 13F base data.
 *
 * Zero additional Alpha Vantage calls — shares the same 25-ticker daily fetch budget.
 */
export async function getNewsGapData(): Promise<NewsGapResult> {
  const lastUpdated = new Date().toISOString();

  const cached = await getNewsGapCache();

  if (!cached) {
    return {
      entries: [...newsGapData].sort((a, b) => b.gapScore - a.gapScore),
      lastUpdated,
      source: 'static',
      updatedTickers: 0,
    };
  }

  const entries = newsGapData.map((entry) => {
    const live = cached[entry.ticker];
    if (!live) return entry;

    // mediaScore is the inverse of gapScore (sqrt(articles)*5, clamped 0-100)
    const mediaScore = Math.min(100, Math.round(Math.sqrt(live.articles) * 5));

    return {
      ...entry,
      gapScore: live.score,
      mediaScore,
      recentHeadlines: live.headlines?.length ? live.headlines : entry.recentHeadlines,
    };
  });

  // Sort: strongest signal first (highest gap = most silence relative to IB activity)
  entries.sort((a, b) => b.gapScore - a.gapScore);

  const updatedTickers = Object.keys(cached).filter((t) =>
    newsGapData.some((e) => e.ticker === t)
  ).length;

  return {
    entries,
    lastUpdated,
    source: 'cached',
    updatedTickers,
  };
}
