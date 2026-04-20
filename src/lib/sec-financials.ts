/**
 * SEC EDGAR Financial Facts API — free, public, no auth required.
 * Fetches latest reported annual revenue (and other metrics) from official 10-K/10-Q filings.
 *
 *   Company Facts:  https://data.sec.gov/api/xbrl/companyfacts/CIK{10-digit}.json
 *   Ticker → CIK:   https://www.sec.gov/files/company_tickers.json
 */

import { logger } from './logger';

const SEC_HEADERS = {
  // SEC requires a descriptive User-Agent with contact info
  'User-Agent': 'Flowvium (taeshinkim11@gmail.com)',
  'Accept': 'application/json',
};

export interface LiveFinancials {
  ticker: string;
  cik: string;
  companyName: string;
  fiscalYear: number;
  fiscalPeriod: string;     // 'FY', 'Q1', etc.
  periodEnd: string;        // 2025-12-31
  revenueUSD: number;        // raw USD
  revenueFormatted: string;  // "$10.06B"
  source: string;
  fetchedAt: string;
}

type TickerMap = Record<string, { cik_str: number; ticker: string; title: string }>;

/** In-memory ticker→CIK map (populated on first call). */
let cachedTickerMap: Map<string, { cik: string; title: string }> | null = null;

async function loadTickerMap(): Promise<Map<string, { cik: string; title: string }>> {
  if (cachedTickerMap) return cachedTickerMap;
  const start = Date.now();
  try {
    const res = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: SEC_HEADERS,
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 86400 }, // 24h
    });
    if (!res.ok) {
      logger.warn('sec.financials', 'ticker_map_http_error', { status: res.status, durationMs: Date.now() - start });
      return new Map();
    }
    const json = (await res.json()) as TickerMap;
    const map = new Map<string, { cik: string; title: string }>();
    for (const entry of Object.values(json)) {
      map.set(entry.ticker.toUpperCase(), {
        cik: String(entry.cik_str).padStart(10, '0'),
        title: entry.title,
      });
    }
    cachedTickerMap = map;
    logger.info('sec.financials', 'ticker_map_loaded', { tickers: map.size, durationMs: Date.now() - start });
    return map;
  } catch (err) {
    logger.error('sec.financials', 'ticker_map_error', { error: err, durationMs: Date.now() - start });
    return new Map();
  }
}

function formatUsd(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toFixed(0)}`;
}

/** Fetch latest fiscal-year revenue + related metrics for a given ticker. */
export async function fetchLiveFinancials(ticker: string): Promise<LiveFinancials | null> {
  const start = Date.now();
  try {
    const tm = await loadTickerMap();
    const rec = tm.get(ticker.toUpperCase());
    if (!rec) {
      logger.warn('sec.financials', 'ticker_not_found', { ticker });
      return null;
    }

    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${rec.cik}.json`;
    const res = await fetch(url, {
      headers: SEC_HEADERS,
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 43200 }, // 12h
    });
    if (!res.ok) {
      logger.warn('sec.financials', 'facts_http_error', { ticker, status: res.status, durationMs: Date.now() - start });
      return null;
    }
    const json = await res.json();

    // Try common revenue GAAP concepts in order of preference
    const CONCEPTS = [
      'Revenues',
      'RevenueFromContractWithCustomerExcludingAssessedTax',
      'SalesRevenueNet',
      'RevenueFromContractWithCustomerIncludingAssessedTax',
    ];

    interface USDEntry { val: number; fy: number; fp: string; form: string; end: string; filed: string; }
    let bestEntry: USDEntry | null = null;

    for (const concept of CONCEPTS) {
      const entries: USDEntry[] = json.facts?.['us-gaap']?.[concept]?.units?.USD ?? [];
      if (!entries?.length) continue;
      // Filter 10-K full year (fp === 'FY'), take most recent
      const fy = entries.filter(e => e.form === '10-K' && e.fp === 'FY');
      if (!fy.length) continue;
      fy.sort((a, b) => b.fy - a.fy || b.end.localeCompare(a.end));
      bestEntry = fy[0];
      if (bestEntry) break;
    }

    if (!bestEntry) {
      logger.warn('sec.financials', 'no_revenue_entry', { ticker, durationMs: Date.now() - start });
      return null;
    }

    logger.info('sec.financials', 'fetched', { ticker, fy: bestEntry.fy, revenue: bestEntry.val, durationMs: Date.now() - start });
    return {
      ticker: ticker.toUpperCase(),
      cik: rec.cik,
      companyName: rec.title,
      fiscalYear: bestEntry.fy,
      fiscalPeriod: bestEntry.fp,
      periodEnd: bestEntry.end,
      revenueUSD: bestEntry.val,
      revenueFormatted: formatUsd(bestEntry.val),
      source: 'SEC EDGAR XBRL 10-K',
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error('sec.financials', 'fetch_failed', { ticker, error: err, durationMs: Date.now() - start });
    return null;
  }
}
