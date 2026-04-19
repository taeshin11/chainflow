import { logger, loggedRedisSet} from '@/lib/logger';
/**
 * /api/latest-updates
 *
 * 모든 데이터 소스에서 최신 업데이트를 통합하여 피드로 반환.
 * 소스:
 *   - Fear & Greed (Redis)
 *   - Capital Flows 상위 변동 자산 (Redis)
 *   - Macro Indicators 발표 (Redis — releaseDate 기준, beat/miss 우선)
 *   - FedWatch 금리 결정 확률 (Redis)
 *   - News Cascade 오늘 기사 (Redis)
 *   - Institutional Signals (정적 데이터)
 *   - News Gap 최근 기사 (정적 데이터)
 *
 * Redis cache: 15분
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { institutionalSignals, type InstitutionalSignal } from '@/data/institutional-signals';
import { newsGapData } from '@/data/news-gap';

/** Redis EDGAR 13F 데이터 우선, 없으면 정적 fallback */
async function getBaseSignals(redis: Redis | null): Promise<InstitutionalSignal[]> {
  if (!redis) return institutionalSignals;
  try {
    const data = await redis.get('flowvium:13f-signals:v1');
    if (Array.isArray(data) && data.length > 0) return data as InstitutionalSignal[];
  } catch { /* non-fatal */ }
  return institutionalSignals;
}

const CACHE_TTL = 15 * 60;

export interface UpdateItem {
  id: string;
  type: 'signal' | 'news' | 'flow' | 'market' | 'fear' | 'macro' | 'fed' | 'credit' | 'newsgap';
  headline: string;
  sub: string;
  time: string;
  source: string;
  badge: string;
  badgeColor: string;
  link?: string;
  direction?: 'up' | 'down' | 'neutral';
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** "MM/DD" 또는 "MM/DD HH:mm:ss" — 시각 정보 있을 때만 시간 포함 */
function formatTime(dateStr: string): { label: string; withinDays: (n: number) => boolean } {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { label: '-', withinDays: () => false };

  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  const yyyy = date.getFullYear();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  const hasTime = /T\d{2}:\d{2}/.test(dateStr) || (dateStr.includes(' ') && dateStr.includes(':'));
  let label: string;
  if (hasTime) {
    const hh = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const sec = date.getSeconds().toString().padStart(2, '0');
    label = `${yyyy}/${mm}/${dd} ${hh}:${min}:${sec}`;
  } else {
    label = `${yyyy}/${mm}/${dd}`;
  }
  return { label, withinDays: (n: number) => diffDays >= 0 && diffDays <= n };
}

// ── 1. Fear & Greed (US = SPY 티커, CNN + Yahoo 합산) ─────────────────────────
async function getFearGreedItem(redis: Redis): Promise<UpdateItem | null> {
  try {
    // US 공포탐욕은 SPY 티커 캐시 (useCNN=true)
    const cached = await redis.get('flowvium:fg:v3:SPY') as Record<string, unknown> | null;
    if (!cached || cached.score == null) return null;
    const score = cached.score as number;
    const level = cached.level as { label: string } | undefined;
    const levelLabel = level?.label ?? (score >= 75 ? '극단적 탐욕' : score >= 55 ? '탐욕' : score >= 45 ? '중립' : score >= 25 ? '공포' : '극단적 공포');
    const prev = cached.prevScore as number | undefined;
    const change = prev != null ? score - prev : 0;
    const changeStr = change > 0 ? ` (+${Math.round(change)})` : change < 0 ? ` (${Math.round(change)})` : '';
    const { label: timeLabel } = formatTime(new Date().toISOString());
    const direction: UpdateItem['direction'] = score >= 55 ? 'up' : score <= 45 ? 'down' : 'neutral';
    const badgeColor = score >= 60 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
    return {
      id: 'fear-greed',
      type: 'fear',
      headline: `🇺🇸 공포탐욕지수 ${score}${changeStr} — ${levelLabel}`,
      sub: 'RSI · 모멘텀 · 변동성 종합',
      source: 'CNN + Yahoo Finance',
      time: timeLabel,
      badge: '시장심리',
      badgeColor,
      link: '/intelligence',
      direction,
    };
  } catch { return null; }
}

// ── 2. Capital Flows 상위 변동 ────────────────────────────────────────────────
async function getCapitalFlowItems(redis: Redis): Promise<UpdateItem[]> {
  try {
    // v4 키 (TWELVE_DATA_KEY 유무에 따라 다름), v2 fallback
    let data: Record<string, unknown> | null = null;
    for (const key of [
      'flowvium:capital-flows:v4:yahoo',
      'flowvium:capital-flows:v4:twelve',
      'flowvium:capital-flows:v4:none',
      'flowvium:capital-flows:v2',
    ]) {
      const d = await redis.get(key) as Record<string, unknown> | null;
      if (d?.assets) { data = d; break; }
    }
    if (!data) return [];

    const { label: timeLabel, withinDays } = formatTime(data.updatedAt as string ?? '');
    if (!withinDays(3)) return [];

    const assets = data.assets as Array<{
      label: string; flag?: string; ret1w: number; momentum: string;
    }> | undefined;
    if (!assets?.length) return [];

    return [...assets]
      .sort((a, b) => Math.abs(b.ret1w ?? 0) - Math.abs(a.ret1w ?? 0))
      .slice(0, 3)
      .map((a, i) => {
        const isUp = (a.ret1w ?? 0) > 0;
        const pct = (isUp ? '+' : '') + (a.ret1w ?? 0).toFixed(2) + '%';
        return {
          id: `flow-${i}`,
          type: 'flow' as const,
          headline: `${a.flag ?? ''} ${a.label} ${pct} (1주)`,
          sub: `모멘텀: ${a.momentum ?? '-'}`,
          source: 'Yahoo Finance',
          time: timeLabel,
          badge: '자금흐름',
          badgeColor: isUp ? '#10b981' : '#ef4444',
          link: '/intelligence',
          direction: isUp ? 'up' as const : 'down' as const,
        };
      });
  } catch { return []; }
}

// ── 3. Macro Indicators ────────────────────────────────────────────────────────
async function getMacroItems(redis: Redis): Promise<UpdateItem[]> {
  try {
    const kstDate = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
    const data = await redis.get(`flowvium:macro-indicators:v3:${kstDate}`) as Record<string, unknown> | null;
    if (!data) return [];

    const indicators = data.indicators as Array<{
      id: string;
      nameKo: string;
      actual: number | null;
      previous: number | null;
      forecast: number | null;
      unit: string;
      releaseDate: string;
      surprise: string;
      rateImpactKo: string;
      category: string;
    }> | undefined;
    if (!indicators?.length) return [];

    // Sort by releaseDate desc, prioritize beat/miss
    const sorted = [...indicators]
      .filter(ind => ind.actual !== null && ind.releaseDate)
      .sort((a, b) => {
        const aScore = a.surprise === 'beat' || a.surprise === 'miss' ? 1 : 0;
        const bScore = b.surprise === 'beat' || b.surprise === 'miss' ? 1 : 0;
        if (bScore !== aScore) return bScore - aScore;
        return b.releaseDate.localeCompare(a.releaseDate);
      })
      .slice(0, 4);

    const items: UpdateItem[] = [];
    for (const ind of sorted) {
      const { label: timeLabel, withinDays } = formatTime(ind.releaseDate);
      if (!withinDays(30)) continue; // macro data can be a month old
      const changeStr = ind.previous != null && ind.actual != null
        ? ` (전월 ${ind.previous}${ind.unit})`
        : '';
      const surpriseEmoji = ind.surprise === 'beat' ? ' ↑예상상회' : ind.surprise === 'miss' ? ' ↓예상하회' : '';
      const direction: UpdateItem['direction'] =
        ind.surprise === 'beat' ? 'up' :
        ind.surprise === 'miss' ? 'down' : 'neutral';
      const badgeColor =
        ind.surprise === 'beat' ? '#10b981' :
        ind.surprise === 'miss' ? '#ef4444' : '#6366f1';
      items.push({
        id: `macro-${ind.id}`,
        type: 'macro',
        headline: `${ind.nameKo} ${ind.actual}${ind.unit}${surpriseEmoji}`,
        sub: `${ind.rateImpactKo}${changeStr}`,
        source: 'FRED · US Bureau',
        time: timeLabel,
        badge: '거시경제',
        badgeColor,
        link: '/intelligence',
        direction,
      });
    }
    return items;
  } catch { return []; }
}

// ── 4. FedWatch 금리 결정 ──────────────────────────────────────────────────────
async function getFedWatchItem(redis: Redis): Promise<UpdateItem | null> {
  try {
    const hour = new Date().toISOString().slice(0, 13);
    const data = await redis.get(`flowvium:fedwatch:v1:${hour}`) as Record<string, unknown> | null;
    if (!data) return null;

    const meetings = data.meetings as Array<{
      date: string; label: string;
      probHold: number; probCut25: number; probHike25: number;
    }> | undefined;
    if (!meetings?.length) return null;

    const next = meetings[0];
    const cutProb = Math.round(next.probCut25 ?? 0);
    const holdProb = Math.round(next.probHold ?? 0);
    const { label: timeLabel } = formatTime(data.updatedAt as string ?? new Date().toISOString());

    const direction: UpdateItem['direction'] = cutProb > 50 ? 'up' : holdProb > 50 ? 'neutral' : 'down';
    return {
      id: 'fedwatch',
      type: 'fed',
      headline: `FOMC ${next.label} — 동결 ${holdProb}% / 인하 ${cutProb}%`,
      sub: `현재 기준금리 ${data.currentRateMid}%`,
      source: 'CME FedWatch',
      time: timeLabel,
      badge: 'FedWatch',
      badgeColor: cutProb > 50 ? '#10b981' : '#6366f1',
      link: '/intelligence',
      direction,
    };
  } catch { return null; }
}

// ── 5. News Cascade 오늘 기사 ─────────────────────────────────────────────────
async function getNewsCascadeItems(redis: Redis): Promise<UpdateItem[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const ids = await redis.lrange(`flowvium:news-cascade:v1:list:${today}`, 0, 6);
    if (!ids?.length) return [];

    const items: UpdateItem[] = [];
    for (const id of ids) {
      try {
        const article = await redis.get(`flowvium:news-cascade:v1:article:${id}`) as Record<string, unknown> | null;
        if (!article) continue;
        const { label: timeLabel, withinDays } = formatTime(article.pubDate as string || today);
        if (!withinDays(3)) continue;
        const sentiment = article.sentiment as string;
        const cascades = (article.cascades as Array<{ asset: string; direction: string }> | undefined) ?? [];
        const cascadeStr = cascades.slice(0, 3).map(c => `${c.asset}${c.direction === 'positive' ? '↑' : c.direction === 'negative' ? '↓' : ''}`).join(' ');
        items.push({
          id: `news-${id}`,
          type: 'news',
          headline: (article.title as string).slice(0, 65),
          sub: cascadeStr ? `연쇄반응: ${cascadeStr}` : '',
          source: (article.source as string) || 'Reuters/CNBC',
          time: timeLabel,
          badge: sentiment === 'bullish' ? '호재' : sentiment === 'bearish' ? '악재' : '뉴스',
          badgeColor: sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#6366f1',
          link: '/cascade',
          direction: sentiment === 'bullish' ? 'up' : sentiment === 'bearish' ? 'down' : 'neutral',
        });
      } catch { continue; }
    }
    return items;
  } catch { return []; }
}

// ── 6. News Gap 최근 기사 (지분율·실적 포함) ─────────────────────────────────
function getNewsGapItems(): UpdateItem[] {
  const items: UpdateItem[] = [];
  for (const entry of newsGapData) {
    // Ownership changes (significant)
    const ownership = entry.ownershipData ?? [];
    for (const o of ownership.slice(0, 3)) {
      if (!o.prevPct || Math.abs(o.pctOfShares - o.prevPct) < 0.5) continue;
      const change = o.pctOfShares - o.prevPct;
      const isUp = change > 0;
      const changeStr = (isUp ? '+' : '') + change.toFixed(2) + '%p';
      const { label: timeLabel } = formatTime(`${o.quarter.replace('Q1 ', '').replace('Q2 ', '').replace('Q3 ', '').replace('Q4 ', '')}-01-01`);
      items.push({
        id: `ownership-${entry.ticker}-${o.institution}`,
        type: 'newsgap',
        headline: `${o.institution} — ${entry.companyName} 지분 ${changeStr}`,
        sub: `${o.pctOfShares}% 보유 ($${o.valueM}M) · ${o.quarter}`,
        source: 'SEC EDGAR 13F',
        time: o.quarter,
        badge: '지분변화',
        badgeColor: isUp ? '#10b981' : '#ef4444',
        link: '/news-gap',
        direction: isUp ? 'up' : 'down',
      });
    }

    // Recent articles with dates (NewsArticle has: title, date, source, url)
    for (const article of (entry.recentArticles ?? []).slice(0, 2)) {
      if (!article.date) continue;
      const { label: timeLabel, withinDays } = formatTime(article.date);
      if (!withinDays(3)) continue;
      items.push({
        id: `newsgap-${entry.ticker}-${article.url ?? article.title}`,
        type: 'newsgap',
        headline: `[${entry.ticker}] ${(article.title ?? '').slice(0, 55)}`,
        sub: article.source ?? '',
        source: article.source ?? 'Alpha Vantage',
        time: timeLabel,
        badge: '뉴스갭',
        badgeColor: '#8b5cf6',
        link: '/news-gap',
        direction: 'neutral',
      });
    }
  }
  return items.slice(0, 10);
}

// ── 7. Institutional Signals (EDGAR 13F Redis 우선, 없으면 정적) ─────────────
function getSignalItems(signals: InstitutionalSignal[]): UpdateItem[] {
  return signals
    .sort((a, b) => b.filingDate.localeCompare(a.filingDate))
    .slice(0, 20)
    .map((s) => {
      const { label } = formatTime(s.filingDate);
      const actionLabel = s.action === 'accumulating' ? '매집'
        : s.action === 'new_position' ? '신규 편입'
        : s.action === 'reducing' ? '비중 축소' : '전량 청산';
      const isUp = s.action === 'accumulating' || s.action === 'new_position';
      return {
        id: `signal-${s.id}`,
        type: 'signal' as const,
        headline: `${s.institution} — ${s.companyName} ${actionLabel}`,
        sub: `${s.estimatedValue} · ${s.sector}`,
        source: 'SEC EDGAR 13F',
        time: label,
        badge: '기관',
        badgeColor: isUp ? '#10b981' : '#ef4444',
        link: '/signals',
        direction: isUp ? 'up' as const : 'down' as const,
      };
    });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const redis = createRedis();
  const cacheKey = 'flowvium:latest-updates:v2';

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ items: cached, cached: true });
    } catch { /* non-fatal */ }
  }

  const [fearGreedItem, flowItems, macroItems, fedItem, newsItems] = await Promise.all([
    redis ? getFearGreedItem(redis) : Promise.resolve(null),
    redis ? getCapitalFlowItems(redis) : Promise.resolve([]),
    redis ? getMacroItems(redis) : Promise.resolve([]),
    redis ? getFedWatchItem(redis) : Promise.resolve(null),
    redis ? getNewsCascadeItems(redis) : Promise.resolve([]),
  ]);

  const newsGapItems = getNewsGapItems();
  const liveSignals = await getBaseSignals(redis);
  const signalItems = getSignalItems(liveSignals);

  // Interleave: live first, then static
  const items: UpdateItem[] = [
    ...(fearGreedItem ? [fearGreedItem] : []),
    ...(fedItem ? [fedItem] : []),
    ...newsItems.slice(0, 3),
    ...macroItems.slice(0, 3),
    ...flowItems,
    ...newsGapItems.slice(0, 4),
    ...signalItems.slice(0, 8),
    ...newsItems.slice(3),
    ...macroItems.slice(3),
    ...newsGapItems.slice(4),
    ...signalItems.slice(8),
  ];

  // Deduplicate
  const seen = new Set<string>();
  const deduped = items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  if (redis) {
    try {
      logger.info('latest-updates', 'save_start', { key: cacheKey, ttl: CACHE_TTL });
      const t0 = Date.now();
      await loggedRedisSet(redis, 'api.latest-updates', cacheKey, deduped, { ex: CACHE_TTL });
      logger.info('latest-updates', 'save_ok', { key: cacheKey, durationMs: Date.now() - t0 });
    } catch (err) {
      logger.error('latest-updates', 'save_failed', { key: cacheKey, error: err });
    }
  }

  return NextResponse.json({ items: deduped, cached: false });
}
