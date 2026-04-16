/**
 * /api/osint/social
 * 주요 인물 실제 트윗(Nitter RSS) + 뉴스 피드 혼합
 * Nitter 인스턴스 순차 시도 → 전부 실패 시 뉴스 RSS 폴백
 * Cache: 30min
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export interface SocialEntry {
  person: string;
  role: string;
  flag: string;
  tag: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'hawkish' | 'dovish' | 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  istweet: boolean;
}

// Nitter mirror instances — tried in order, first success wins
const NITTER_INSTANCES = [
  'https://nitter.poast.org',
  'https://nitter.privacydev.net',
  'https://nitter.cz',
  'https://nitter.1d4.us',
  'https://nitter.unixfox.eu',
];

const KEY_FIGURES = [
  {
    name: 'Donald Trump',
    role: '미국 대통령',
    flag: '🇺🇸',
    tag: 'Trump',
    twitter: 'realDonaldTrump',
    keywords: ['trump', 'donald trump'],
  },
  {
    name: 'Elon Musk',
    role: 'Tesla/SpaceX CEO',
    flag: '🇺🇸',
    tag: 'Musk',
    twitter: 'elonmusk',
    keywords: ['elon musk', 'musk'],
  },
  {
    name: 'Sam Altman',
    role: 'OpenAI CEO',
    flag: '🇺🇸',
    tag: 'Altman',
    twitter: 'sama',
    keywords: ['sam altman', 'openai'],
  },
  {
    name: 'Christine Lagarde',
    role: 'ECB 총재',
    flag: '🇪🇺',
    tag: 'ECB',
    twitter: 'Lagarde',
    keywords: ['lagarde', 'ecb', 'european central bank'],
  },
  {
    name: 'Jerome Powell',
    role: 'Fed 의장',
    flag: '🇺🇸',
    tag: 'Powell',
    twitter: null, // no personal account — Fed official account
    keywords: ['powell', 'jerome powell', 'fed chair', 'federal reserve'],
  },
  {
    name: 'Warren Buffett',
    role: 'Berkshire CEO',
    flag: '🇺🇸',
    tag: 'Buffett',
    twitter: null,
    keywords: ['buffett', 'warren buffett', 'berkshire'],
  },
  {
    name: 'Xi Jinping',
    role: '중국 국가주석',
    flag: '🇨🇳',
    tag: 'Xi',
    twitter: null,
    keywords: ['xi jinping', 'china president'],
  },
  {
    name: 'Scott Bessent',
    role: '미 재무장관',
    flag: '🇺🇸',
    tag: 'Bessent',
    twitter: null,
    keywords: ['bessent', 'scott bessent', 'treasury secretary'],
  },
];

const NEWS_RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US',
  'https://feeds.reuters.com/reuters/businessNews',
  'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  'https://feeds.marketwatch.com/marketwatch/topstories/',
];

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

function parseRssXml(xml: string, sourceName: string, limit = 30): RssItem[] {
  const items: RssItem[] = [];
  const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
  for (const m of itemMatches) {
    const content = m[1];
    const title =
      content.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? '';
    const desc =
      content.match(
        /<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i
      )?.[1]?.trim() ?? '';
    const link =
      content.match(/<link[^>]*>(.*?)<\/link>/i)?.[1]?.trim() ??
      content.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i)?.[1]?.trim() ??
      '';
    const pubDate =
      content.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim() ?? '';
    if (title) {
      items.push({
        title,
        description: desc.replace(/<[^>]+>/g, '').slice(0, 300),
        link,
        pubDate,
        source: sourceName,
      });
    }
  }
  return items.slice(0, limit);
}

/** Try to fetch Nitter RSS from each instance until one succeeds */
async function fetchNitterRss(handle: string): Promise<RssItem[]> {
  for (const base of NITTER_INSTANCES) {
    try {
      const url = `${base}/${handle}/rss`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml, application/xml' },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const xml = await res.text();
      // Basic sanity: must contain <item>
      if (!xml.includes('<item>')) continue;
      const items = parseRssXml(xml, `@${handle}`, 5);
      if (items.length > 0) return items;
    } catch {
      // Try next instance
    }
  }
  return [];
}

async function fetchNewsRss(url: string, sourceName: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml, application/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssXml(xml, sourceName, 30);
  } catch {
    return [];
  }
}

function detectSentiment(
  text: string
): 'hawkish' | 'dovish' | 'bullish' | 'bearish' | 'neutral' {
  const t = text.toLowerCase();
  if (/hike|tighten|hawkish|inflation fear|rate rise/.test(t)) return 'hawkish';
  if (/cut|ease|dovish|recession|slowdown|lower rate/.test(t)) return 'dovish';
  if (/surge|rally|record|gain|bull|soar/.test(t)) return 'bullish';
  if (/crash|slump|fall|bear|plunge|rout|collapse/.test(t)) return 'bearish';
  return 'neutral';
}

function detectImpact(text: string): 'high' | 'medium' | 'low' {
  const t = text.toLowerCase();
  if (/tariff|sanction|war|crisis|emergency|rate decision|fomc|gdp|nfp/.test(t)) return 'high';
  if (/earnings|guidance|forecast|inflation|trade|policy/.test(t)) return 'medium';
  return 'low';
}

export async function GET() {
  const redis = createRedis();
  const cacheKey = `flowvium:osint:social:v2:${new Date().toISOString().slice(0, 13)}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch {
      /* non-fatal */
    }
  }

  // ── 1. Fetch Nitter for figures with Twitter handles (parallel) ───────────────
  const nitterResults = await Promise.allSettled(
    KEY_FIGURES.map((f) =>
      f.twitter ? fetchNitterRss(f.twitter) : Promise.resolve([] as RssItem[])
    )
  );

  // ── 2. Fetch news RSS feeds (parallel) ───────────────────────────────────────
  const newsResults = await Promise.allSettled(
    NEWS_RSS_FEEDS.map((url, i) =>
      fetchNewsRss(url, ['Yahoo Finance', 'Reuters', 'CNBC', 'MarketWatch'][i])
    )
  );
  const allNewsItems: RssItem[] = newsResults.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  );

  // ── 3. Build entries ──────────────────────────────────────────────────────────
  const entries: SocialEntry[] = [];

  KEY_FIGURES.forEach((figure, idx) => {
    const tweets: RssItem[] =
      nitterResults[idx].status === 'fulfilled' ? nitterResults[idx].value : [];

    // Add tweets first (real posts)
    for (const item of tweets.slice(0, 3)) {
      const text = `${item.title} ${item.description}`;
      entries.push({
        person: figure.name,
        role: figure.role,
        flag: figure.flag,
        tag: figure.tag,
        title: item.title,
        summary: item.description.slice(0, 200),
        source: item.source,
        url: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        sentiment: detectSentiment(text),
        impact: detectImpact(text),
        istweet: true,
      });
    }

    // Add news mentions (fill in for figures without Twitter or if Nitter failed)
    const matched = allNewsItems.filter((item) => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      return figure.keywords.some((kw) => text.includes(kw));
    });
    for (const item of matched.slice(0, tweets.length > 0 ? 1 : 3)) {
      const text = `${item.title} ${item.description}`;
      entries.push({
        person: figure.name,
        role: figure.role,
        flag: figure.flag,
        tag: figure.tag,
        title: item.title,
        summary: item.description.replace(/<[^>]+>/g, '').slice(0, 200),
        source: item.source,
        url: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        sentiment: detectSentiment(text),
        impact: detectImpact(text),
        istweet: false,
      });
    }
  });

  // ── 4. Sort + deduplicate ─────────────────────────────────────────────────────
  const seen = new Set<string>();
  const deduped = entries
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter((e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

  const tweetCount = deduped.filter((e) => e.istweet).length;
  const result = {
    entries: deduped,
    total: deduped.length,
    tweetCount,
    newsCount: deduped.length - tweetCount,
    updatedAt: new Date().toISOString(),
    cached: false,
  };

  if (redis) {
    try {
      await redis.set(cacheKey, result, { ex: 30 * 60 });
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json(result);
}
