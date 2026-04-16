/**
 * Financial news RSS aggregator
 * Fetches RSS feeds from major financial news sources, parses them without
 * external dependencies, and counts ticker mentions over the last 7 days.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TickerNewsEntry {
  count: number;
  latestHeadline: string;
  lastSeen: string; // ISO date
}

export type NewsCountsOutput = Record<string, TickerNewsEntry>;

interface RssItem {
  title: string;
  description: string;
  pubDate: string; // raw string from feed
  link: string;
}

// ---------------------------------------------------------------------------
// RSS feed URLs
// ---------------------------------------------------------------------------

const RSS_FEEDS = [
  {
    name: 'Reuters Business',
    url: 'https://feeds.reuters.com/reuters/businessNews',
  },
  {
    name: 'Wall Street Journal',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
  },
  {
    name: 'Bloomberg Markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
  },
  // FT requires a subscription for most feeds; using the public Companies feed
  {
    name: 'Financial Times Companies',
    url: 'https://www.ft.com/rss/home/uk',
  },
];

// ---------------------------------------------------------------------------
// Known tickers and their keyword aliases for matching
// (Covers the main FlowVium companies — extend as needed)
// ---------------------------------------------------------------------------

const TICKER_KEYWORDS: Record<string, string[]> = {
  NVDA: ['nvidia', 'nvda'],
  TSM: ['tsmc', 'taiwan semiconductor'],
  MU: ['micron'],
  INTC: ['intel'],
  AMD: ['amd', 'advanced micro devices'],
  ASML: ['asml'],
  QCOM: ['qualcomm'],
  AVGO: ['broadcom', 'avgo'],
  TXN: ['texas instruments', 'txn'],
  AMAT: ['applied materials', 'amat'],
  KLAC: ['kla corp', 'kla corporation'],
  LRCX: ['lam research', 'lrcx'],
  AAPL: ['apple', 'aapl'],
  MSFT: ['microsoft', 'msft'],
  GOOGL: ['google', 'alphabet', 'googl'],
  META: ['meta', 'facebook'],
  AMZN: ['amazon', 'amzn'],
  TSLA: ['tesla', 'tsla'],
  NFLX: ['netflix', 'nflx'],
  CRM: ['salesforce', 'crm'],
  ORCL: ['oracle', 'orcl'],
  IBM: ['ibm'],
  CSCO: ['cisco', 'csco'],
  NOW: ['servicenow', 'snow'],
  PANW: ['palo alto', 'panw'],
  CRWD: ['crowdstrike', 'crwd'],
  NET: ['cloudflare'],
  DDOG: ['datadog', 'ddog'],
  SNOW: ['snowflake'],
  PLTR: ['palantir', 'pltr'],
  JPM: ['jpmorgan', 'jp morgan', 'jpm'],
  GS: ['goldman sachs'],
  MS: ['morgan stanley'],
  BAC: ['bank of america', 'bofa', 'bac'],
  WFC: ['wells fargo', 'wfc'],
  C: ['citigroup', 'citi'],
  BLK: ['blackrock', 'blk'],
  V: ['visa'],
  MA: ['mastercard'],
  PYPL: ['paypal', 'pypl'],
  SQ: ['block inc', 'square', 'cash app'],
  COIN: ['coinbase', 'coin'],
  LMT: ['lockheed martin', 'lmt'],
  RTX: ['raytheon', 'rtx'],
  NOC: ['northrop grumman', 'noc'],
  GD: ['general dynamics', 'gd'],
  BA: ['boeing', 'ba'],
  UNH: ['unitedhealth', 'united health', 'unh'],
  JNJ: ['johnson & johnson', 'jnj'],
  PFE: ['pfizer', 'pfe'],
  MRK: ['merck', 'mrk'],
  ABBV: ['abbvie', 'abbv'],
  TMO: ['thermo fisher', 'tmo'],
  DHR: ['danaher', 'dhr'],
  LLY: ['eli lilly', 'lly'],
  BMY: ['bristol myers', 'bmy'],
  AMGN: ['amgen', 'amgn'],
  GILD: ['gilead', 'gild'],
  XOM: ['exxon', 'exxonmobil', 'xom'],
  CVX: ['chevron', 'cvx'],
  COP: ['conocophillips', 'cop'],
  SLB: ['schlumberger', 'slb'],
  EOG: ['eog resources', 'eog'],
  CAT: ['caterpillar', 'cat'],
  DE: ['deere', 'john deere'],
  HON: ['honeywell', 'hon'],
  MMM: ['3m', 'mmm'],
  GE: ['ge aerospace', 'general electric'],
  UPS: ['ups', 'united parcel'],
  FDX: ['fedex', 'fdx'],
  UNP: ['union pacific', 'unp'],
  CSX: ['csx'],
  NSC: ['norfolk southern', 'nsc'],
};

// ---------------------------------------------------------------------------
// XML parser helpers (no external dependencies)
// ---------------------------------------------------------------------------

function extractXmlText(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function parseRssXml(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      title: extractXmlText(block, 'title'),
      description: extractXmlText(block, 'description'),
      pubDate: extractXmlText(block, 'pubDate'),
      link: extractXmlText(block, 'link'),
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function parsePubDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function isWithinDays(date: Date, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

// ---------------------------------------------------------------------------
// Ticker matching
// ---------------------------------------------------------------------------

function findTickersInText(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();

  for (const [ticker, keywords] of Object.entries(TICKER_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matched.add(ticker);
        break;
      }
    }
  }

  return Array.from(matched);
}

// ---------------------------------------------------------------------------
// Fetch single RSS feed
// ---------------------------------------------------------------------------

async function fetchFeed(feed: { name: string; url: string }): Promise<RssItem[]> {
  const res = await fetch(feed.url, {
    headers: {
      'User-Agent': 'Flowvium/1.0 taeshinkim11@gmail.com',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const xml = await res.text();
  return parseRssXml(xml);
}

// ---------------------------------------------------------------------------
// Main scraper
// ---------------------------------------------------------------------------

export async function scrapeNewscounts(): Promise<NewsCountsOutput> {
  const counts: Record<
    string,
    { count: number; latestHeadline: string; lastSeenMs: number }
  > = {};

  const LOOKBACK_DAYS = 7;

  for (const feed of RSS_FEEDS) {
    console.log(`  [rss-news] Fetching ${feed.name}...`);

    try {
      const items = await fetchFeed(feed);
      console.log(`  [rss-news]   Got ${items.length} items from ${feed.name}`);

      for (const item of items) {
        const pubDate = parsePubDate(item.pubDate);
        if (!pubDate || !isWithinDays(pubDate, LOOKBACK_DAYS)) continue;

        const text = `${item.title} ${item.description}`;
        const tickers = findTickersInText(text);

        for (const ticker of tickers) {
          const existing = counts[ticker];
          if (!existing) {
            counts[ticker] = {
              count: 1,
              latestHeadline: item.title,
              lastSeenMs: pubDate.getTime(),
            };
          } else {
            existing.count += 1;
            if (pubDate.getTime() > existing.lastSeenMs) {
              existing.latestHeadline = item.title;
              existing.lastSeenMs = pubDate.getTime();
            }
          }
        }
      }
    } catch (err) {
      console.error(`  [rss-news]   Error fetching ${feed.name}:`, err);
    }
  }

  // Convert to output format
  const output: NewsCountsOutput = {};
  for (const [ticker, data] of Object.entries(counts)) {
    output[ticker] = {
      count: data.count,
      latestHeadline: data.latestHeadline,
      lastSeen: new Date(data.lastSeenMs).toISOString(),
    };
  }

  return output;
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT_PATH = path.resolve(
    process.cwd(),
    'src/data/generated/news-counts.json'
  );

  (async () => {
    console.log('[rss-news] Starting RSS news aggregation...');
    const data = await scrapeNewscounts();
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
    console.log(
      `[rss-news] Done. Tracked mentions for ${Object.keys(data).length} tickers → ${OUT_PATH}`
    );
  })().catch((err) => {
    console.error('[rss-news] Fatal error:', err);
    process.exit(1);
  });
}
