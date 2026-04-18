/**
 * Yahoo Finance helpers — server-side only.
 * Handles batch quotes and per-ticker statistics (short interest).
 *
 * quoteSummary now requires a crumb+cookie (since ~2024). Flow:
 *   1) GET https://fc.yahoo.com            → receive A3 cookie via set-cookie
 *   2) GET /v1/test/getcrumb (w/ A3)       → returns a short opaque crumb string
 *   3) GET /v10/finance/quoteSummary?crumb=… (w/ A3 cookie)
 *
 * Crumb/cookie pair is cached in-process for the lifetime of the lambda.
 */

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
};

// ── Crumb/cookie cache (in-memory per lambda instance) ───────────────────────
interface YFCreds { cookie: string; crumb: string; fetchedAt: number; }
let yfCreds: YFCreds | null = null;
const CRUMB_TTL_MS = 55 * 60 * 1000; // 55 min — Yahoo A3 rotates ~hourly

/** Parse Set-Cookie header array for A3 (name=value; …) and rebuild minimal Cookie header. */
function parseCookiesFromResponse(res: Response): string {
  // Node fetch collapses duplicate headers with comma separation; Next runtime supports getSetCookie on some platforms.
  const raw = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.()
    ?? res.headers.get('set-cookie')?.split(/,(?=\s*[A-Za-z0-9_-]+=)/) // split only when next token looks like a cookie
    ?? [];
  const parts: string[] = [];
  for (const line of raw) {
    const nv = line.split(';')[0]?.trim();
    if (nv) parts.push(nv);
  }
  return parts.join('; ');
}

async function fetchYFCreds(): Promise<YFCreds | null> {
  // Step 1: visit fc.yahoo.com to seed A3 cookie
  let cookie = '';
  try {
    const seed = await fetch('https://fc.yahoo.com', {
      headers: YF_HEADERS,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    cookie = parseCookiesFromResponse(seed);
  } catch { return null; }
  if (!cookie) return null;

  // Step 2: fetch crumb with the cookie
  try {
    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...YF_HEADERS, Cookie: cookie },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!crumbRes.ok) return null;
    const crumb = (await crumbRes.text()).trim();
    // getcrumb returns a short opaque string; empty/HTML means we were blocked
    if (!crumb || crumb.length > 64 || crumb.includes('<')) return null;
    return { cookie, crumb, fetchedAt: Date.now() };
  } catch { return null; }
}

async function getYFCreds(force = false): Promise<YFCreds | null> {
  if (!force && yfCreds && Date.now() - yfCreds.fetchedAt < CRUMB_TTL_MS) return yfCreds;
  const fresh = await fetchYFCreds();
  if (fresh) yfCreds = fresh;
  return yfCreds;
}

export interface YFQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  averageVolume?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
}

export interface YFShortData {
  ticker: string;
  shortFloatPct: number | null;   // % of float shorted (0–100)
  shortRatio: number | null;       // days to cover
  sharesShort: number | null;
  sharesShortPriorMonth: number | null;
  shortChangeMonthly: number | null; // % change in short interest vs prior month
}

/** Fetch quote via v8/chart (v7 is now authorized-only). Runs per-ticker in parallel. */
async function fetchOneQuote(ticker: string): Promise<YFQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: YF_HEADERS, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result?.meta) return null;
    const m = result.meta;
    const price = m.regularMarketPrice ?? m.chartPreviousClose;
    const prevClose = m.chartPreviousClose ?? m.previousClose ?? price;
    const change = price != null && prevClose != null ? price - prevClose : undefined;
    const changePct = price != null && prevClose && prevClose > 0
      ? ((price - prevClose) / prevClose) * 100
      : undefined;
    return {
      symbol: m.symbol ?? ticker,
      shortName: m.shortName ?? m.symbol ?? ticker,
      longName: m.longName,
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePct,
      fiftyTwoWeekLow: m.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh,
    };
  } catch { return null; }
}

/** Fetch quotes for multiple tickers (parallel, batched to respect rate limits). */
export async function fetchYFQuotes(tickers: string[]): Promise<YFQuote[]> {
  if (!tickers.length) return [];
  const results: YFQuote[] = [];
  const BATCH = 10;
  for (let i = 0; i < tickers.length; i += BATCH) {
    const batch = tickers.slice(i, i + BATCH);
    const batchResults = await Promise.allSettled(batch.map(t => fetchOneQuote(t)));
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }
  return results;
}

/** Fetch short interest data for a single ticker via quoteSummary (crumb-authenticated). */
export async function fetchYFShortData(ticker: string): Promise<YFShortData> {
  const base: YFShortData = { ticker, shortFloatPct: null, shortRatio: null, sharesShort: null, sharesShortPriorMonth: null, shortChangeMonthly: null };

  // Try up to twice: fresh creds → on 401, invalidate and retry once.
  for (let attempt = 0; attempt < 2; attempt++) {
    const creds = await getYFCreds(attempt > 0);
    if (!creds) return base;
    try {
      const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics&crumb=${encodeURIComponent(creds.crumb)}`;
      const res = await fetch(url, {
        headers: { ...YF_HEADERS, Cookie: creds.cookie },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });
      if (res.status === 401 || res.status === 403) {
        // Invalid crumb — drop cache and retry with fresh creds
        yfCreds = null;
        continue;
      }
      if (!res.ok) return base;
      const json = await res.json();
      const stats = json.quoteSummary?.result?.[0]?.defaultKeyStatistics;
      if (!stats) return base;

      const shortPct = stats.sharesShortPercentOfFloat?.raw ?? null;
      const prior = stats.sharesShortPriorMonth?.raw ?? null;
      const current = stats.sharesShort?.raw ?? null;
      const changeMonthly = (current != null && prior != null && prior > 0)
        ? ((current - prior) / prior) * 100
        : null;

      return {
        ticker,
        shortFloatPct: shortPct != null ? +(shortPct * 100).toFixed(2) : null,
        shortRatio: stats.shortRatio?.raw ?? null,
        sharesShort: current,
        sharesShortPriorMonth: prior,
        shortChangeMonthly: changeMonthly != null ? +changeMonthly.toFixed(1) : null,
      };
    } catch {
      return base;
    }
  }
  return base;
}

/** Fetch short interest for many tickers (batched to avoid rate limiting). */
export async function fetchBatchShortData(
  tickers: string[],
  delayMs = 200
): Promise<YFShortData[]> {
  const results: YFShortData[] = [];
  const BATCH = 5;

  for (let i = 0; i < tickers.length; i += BATCH) {
    const batch = tickers.slice(i, i + BATCH);
    const batchResults = await Promise.allSettled(batch.map(t => fetchYFShortData(t)));
    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(r.value);
    }
    if (i + BATCH < tickers.length) {
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  return results;
}
