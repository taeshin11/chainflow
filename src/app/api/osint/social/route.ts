/**
 * /api/osint/social
 * 시장 영향력 인물들의 최근 발언/뉴스 피드
 * Sources: RSS 뉴스 피드 → 인물별 필터링
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
}

const KEY_FIGURES = [
  { name: 'Donald Trump', role: '미국 대통령', flag: '🇺🇸', tag: 'Trump', keywords: ['trump', 'donald trump'] },
  { name: 'Jerome Powell', role: 'Fed 의장', flag: '🇺🇸', tag: 'Powell', keywords: ['powell', 'jerome powell', 'fed chair'] },
  { name: 'Elon Musk', role: 'Tesla/SpaceX CEO', flag: '🇺🇸', tag: 'Musk', keywords: ['elon musk', 'musk'] },
  { name: 'Xi Jinping', role: '중국 국가주석', flag: '🇨🇳', tag: 'Xi', keywords: ['xi jinping', 'xi jinping'] },
  { name: 'Janet Yellen', role: '미 재무장관', flag: '🇺🇸', tag: 'Yellen', keywords: ['yellen', 'janet yellen'] },
  { name: 'Sam Altman', role: 'OpenAI CEO', flag: '🇺🇸', tag: 'Altman', keywords: ['sam altman', 'openai'] },
  { name: 'Warren Buffett', role: 'Berkshire CEO', flag: '🇺🇸', tag: 'Buffett', keywords: ['buffett', 'warren buffett', 'berkshire'] },
  { name: 'Christine Lagarde', role: 'ECB 총재', flag: '🇪🇺', tag: 'ECB', keywords: ['lagarde', 'ecb', 'european central bank'] },
];

const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US',
  'https://feeds.reuters.com/reuters/businessNews',
  'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  'https://feeds.marketwatch.com/marketwatch/topstories/',
];

interface RssItem { title: string; description: string; link: string; pubDate: string; source: string }

async function fetchRss(url: string, sourceName: string): Promise<RssItem[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, application/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: RssItem[] = [];
    const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
    for (const m of itemMatches) {
      const content = m[1];
      const title = content.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? '';
      const desc = content.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() ?? '';
      const link = content.match(/<link[^>]*>(.*?)<\/link>/i)?.[1]?.trim() ?? '';
      const pubDate = content.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)?.[1]?.trim() ?? '';
      if (title) items.push({ title, description: desc.slice(0, 200), link, pubDate, source: sourceName });
    }
    return items.slice(0, 30);
  } catch { return []; }
}

function detectSentiment(text: string): 'hawkish' | 'dovish' | 'bullish' | 'bearish' | 'neutral' {
  const t = text.toLowerCase();
  if (/hike|tighten|hawkish|inflation fear|rate rise/.test(t)) return 'hawkish';
  if (/cut|ease|dovish|recession|slowdown|lower rate/.test(t)) return 'dovish';
  if (/surge|rally|record|gain|bull|soar/.test(t)) return 'bullish';
  if (/crash|slump|fall|bear|plunge|rout|collapse/.test(t)) return 'bearish';
  return 'neutral';
}

function detectImpact(text: string): 'high' | 'medium' | 'low' {
  const t = text.toLowerCase();
  if (/tariff|sanction|war|crisis|emergency|emergency|rate decision|fomc|gdp|nfp/.test(t)) return 'high';
  if (/earnings|guidance|forecast|inflation|trade|policy/.test(t)) return 'medium';
  return 'low';
}

export async function GET() {
  const redis = createRedis();
  const cacheKey = `flowvium:osint:social:v1:${new Date().toISOString().slice(0, 13)}`;

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch { /* non-fatal */ }
  }

  // Fetch all RSS feeds in parallel
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map((url, i) => fetchRss(url, ['Yahoo Finance', 'Reuters', 'CNBC', 'MarketWatch'][i]))
  );

  const allItems: RssItem[] = feedResults.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Match items to key figures
  const entries: SocialEntry[] = [];
  for (const figure of KEY_FIGURES) {
    const matched = allItems.filter(item => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      return figure.keywords.some(kw => text.includes(kw));
    });
    for (const item of matched.slice(0, 3)) {
      const text = `${item.title} ${item.description}`;
      entries.push({
        person: figure.name,
        role: figure.role,
        flag: figure.flag,
        tag: figure.tag,
        title: item.title,
        summary: item.description.replace(/<[^>]+>/g, '').slice(0, 160),
        source: item.source,
        url: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        sentiment: detectSentiment(text),
        impact: detectImpact(text),
      });
    }
  }

  // Sort by publishedAt desc, deduplicate by URL
  const seen = new Set<string>();
  const deduped = entries
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter(e => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });

  const result = { entries: deduped, total: deduped.length, updatedAt: new Date().toISOString(), cached: false };

  if (redis) {
    try { await redis.set(cacheKey, result, { ex: 30 * 60 }); } catch { /* non-fatal */ }
  }

  return NextResponse.json(result);
}
