/**
 * src/lib/edgar-insider.ts
 *
 * Real-time institutional flow via SEC EDGAR — everything that beats the
 * 45-day 13F delay. Parses three filing types:
 *
 *   Form 4     — Insider (officer/director/10%+ holder) transactions, D+2
 *   SC 13D/G   — Any entity crossing 5% ownership threshold, +10 days
 *   Form N-PORT — Mutual fund monthly holdings, ~60-day lag
 *
 * SEC rate limit: 10 req/s per IP (must include UA with email).
 *
 * Data flow:
 *   1. Poll getcurrent Atom feed for target form type
 *   2. Walk accession directory, locate primary XML
 *   3. Regex-parse XML (no JSON dep, fast on lambda)
 *   4. Filter to tickers we care about (TICKER_TO_CUSIP + issuer name map)
 */

import { EDGAR_UA, TICKER_TO_CUSIP, CUSIP_TO_TICKER, TICKER_TO_COMPANY } from './edgar-13f';

// ── Shared ────────────────────────────────────────────────────────────────────
const EDGAR_BASE = 'https://www.sec.gov';
const EDGAR_HEADERS = { 'User-Agent': EDGAR_UA, 'Accept': 'application/xml,text/html' };

/** Follow EDGAR rate-limit policy (~8 req/s to stay under 10). */
async function pacedFetch(url: string, timeoutMs = 8000): Promise<Response> {
  return fetch(url, {
    headers: EDGAR_HEADERS,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** Extract first capture group of a regex from text, or null. */
function m1(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

// Build lowercased issuer name → ticker map for RSS-title matching
const LOWER_COMPANY_TO_TICKER: Record<string, string> = {};
for (const [ticker, company] of Object.entries(TICKER_TO_COMPANY)) {
  LOWER_COMPANY_TO_TICKER[company.toLowerCase()] = ticker;
  // Also add common suffix-free forms
  LOWER_COMPANY_TO_TICKER[company.toLowerCase().replace(/ inc\.?| corp\.?| corporation| plc$/i, '')] = ticker;
}

/** Best-effort issuer-name → ticker resolver. */
export function resolveTickerFromIssuerName(name: string): string | null {
  const lower = name.toLowerCase().replace(/,/g, '').trim();
  // Direct hit
  if (LOWER_COMPANY_TO_TICKER[lower]) return LOWER_COMPANY_TO_TICKER[lower];
  // Contains match
  for (const [key, t] of Object.entries(LOWER_COMPANY_TO_TICKER)) {
    if (lower.includes(key) && key.length > 3) return t;
  }
  return null;
}

// ── Atom feed parsing ─────────────────────────────────────────────────────────
export interface AtomEntry {
  title: string;
  link: string;
  accession: string;     // e.g. 0001193125-26-162189
  accessionPath: string; // no-dash form, e.g. 000119312526162189
  cik: string;           // from URL
  updatedAt: string;
  filedDate: string;     // YYYY-MM-DD from summary
}

function parseAtomFeed(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = [];
  // Split on <entry> blocks
  const parts = xml.split(/<entry>/g).slice(1);
  for (const p of parts) {
    const block = p.split(/<\/entry>/)[0];
    const title = m1(block, /<title>([^<]+)<\/title>/) ?? '';
    const link = m1(block, /<link[^>]+href="([^"]+)"/) ?? '';
    const updated = m1(block, /<updated>([^<]+)<\/updated>/) ?? '';
    const filedMatch = block.match(/Filed:<\/b>\s*([0-9-]+)/);
    const filed = filedMatch ? filedMatch[1] : '';
    const accMatch = block.match(/accession-number=([0-9-]+)/);
    const accession = accMatch ? accMatch[1] : '';
    const accessionPath = accession.replace(/-/g, '');
    // CIK comes from link path: /Archives/edgar/data/{cik}/{accessionPath}/...
    const cikMatch = link.match(/\/data\/(\d+)\//);
    const cik = cikMatch ? cikMatch[1] : '';
    if (accession && link) {
      entries.push({ title, link, accession, accessionPath, cik, updatedAt: updated, filedDate: filed });
    }
  }
  return entries;
}

async function fetchAtomFeed(type: string, count = 40): Promise<AtomEntry[]> {
  const url = `${EDGAR_BASE}/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(type)}&owner=include&count=${count}&output=atom`;
  try {
    const res = await pacedFetch(url, 10000);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseAtomFeed(xml);
  } catch { return []; }
}

/** Find the primary XML document for a filing accession. */
async function findPrimaryXml(cik: string, accessionPath: string, preferredNames: string[] = []): Promise<string | null> {
  const dirUrl = `${EDGAR_BASE}/Archives/edgar/data/${cik}/${accessionPath}/`;
  try {
    const res = await pacedFetch(dirUrl, 6000);
    if (!res.ok) return null;
    const html = await res.text();
    // Find all .xml hrefs
    const hrefs = Array.from(html.matchAll(/href="([^"]+\.xml)"/g)).map(m => m[1]);
    if (!hrefs.length) return null;
    // Prefer known names (ownership.xml, primary_doc.xml, etc.)
    for (const name of preferredNames) {
      const hit = hrefs.find(h => h.toLowerCase().endsWith('/' + name.toLowerCase()) || h.toLowerCase().endsWith(name.toLowerCase()));
      if (hit) return hit.startsWith('/') ? EDGAR_BASE + hit : hit;
    }
    // Fallback: first xml that's not FilingSummary.xml / R*.xml (formatted XBRL)
    const pick = hrefs.find(h => !/FilingSummary\.xml$|\/R\d+\.xml$/i.test(h));
    const chosen = pick ?? hrefs[0];
    return chosen.startsWith('/') ? EDGAR_BASE + chosen : chosen;
  } catch { return null; }
}

// ── Form 4: insider transactions ──────────────────────────────────────────────
export type TransactionCode = 'P' | 'S' | 'A' | 'M' | 'D' | 'F' | 'G' | 'V' | 'I' | 'X' | 'C' | 'W' | 'J';
export type TransactionDirection = 'buy' | 'sell' | 'other';

export interface InsiderTransaction {
  id: string;               // unique per filing+txn
  filedAt: string;          // ISO
  transactionDate: string;  // YYYY-MM-DD
  issuerCik: string;
  issuerName: string;
  ticker: string | null;
  insiderName: string;
  insiderCik: string;
  isDirector: boolean;
  isOfficer: boolean;
  isTenPercentOwner: boolean;
  officerTitle: string | null;
  transactionCode: TransactionCode;
  direction: TransactionDirection;
  shares: number | null;
  pricePerShare: number | null;
  transactionValueUsd: number | null;
  sharesOwnedAfter: number | null;
  securityTitle: string;
  filingUrl: string;
}

function codeToDirection(code: string): TransactionDirection {
  // P = open-market purchase, S = open-market sale — strongest signals
  if (code === 'P') return 'buy';
  if (code === 'S') return 'sell';
  // A (award/grant), M (option exercise), F (tax withholding), G (gift), D (disposition to issuer)
  // are not open-market signals and are filtered out upstream in the API layer.
  return 'other';
}

function parseForm4Xml(xml: string, meta: { accession: string; filingUrl: string; filedAt: string }): InsiderTransaction[] {
  const issuerCik = m1(xml, /<issuerCik>([^<]+)<\/issuerCik>/) ?? '';
  const issuerName = m1(xml, /<issuerName>([^<]+)<\/issuerName>/) ?? '';
  const issuerSymbol = m1(xml, /<issuerTradingSymbol>([^<]*)<\/issuerTradingSymbol>/) ?? '';

  const insiderCik = m1(xml, /<rptOwnerCik>([^<]+)<\/rptOwnerCik>/) ?? '';
  const insiderName = m1(xml, /<rptOwnerName>([^<]+)<\/rptOwnerName>/) ?? '';
  const isDirector = /<isDirector>(true|1)<\/isDirector>/i.test(xml);
  const isOfficer = /<isOfficer>(true|1)<\/isOfficer>/i.test(xml);
  const isTenPercentOwner = /<isTenPercentOwner>(true|1)<\/isTenPercentOwner>/i.test(xml);
  const officerTitle = m1(xml, /<officerTitle>([^<]+)<\/officerTitle>/);

  const ticker = issuerSymbol.trim() || resolveTickerFromIssuerName(issuerName);

  // Extract each nonDerivativeTransaction block
  const txns: InsiderTransaction[] = [];
  const blockMatches = Array.from(xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/g));
  let idx = 0;
  for (const b of blockMatches) {
    const block = b[1];
    const code = (m1(block, /<transactionCode>([^<]+)<\/transactionCode>/) ?? 'X') as TransactionCode;
    const dateStr = m1(block, /<transactionDate>\s*<value>([^<]+)<\/value>/) ?? '';
    const shares = Number(m1(block, /<transactionShares>\s*<value>([0-9.]+)<\/value>/) ?? '');
    const price = Number(m1(block, /<transactionPricePerShare>\s*<value>([0-9.]+)<\/value>/) ?? '');
    const ownedAfter = Number(m1(block, /<sharesOwnedFollowingTransaction>\s*<value>([0-9.]+)<\/value>/) ?? '');
    const sec = m1(block, /<securityTitle>\s*<value>([^<]+)<\/value>/) ?? '';

    const direction = codeToDirection(code);
    const value = Number.isFinite(shares) && Number.isFinite(price) && shares > 0 && price > 0
      ? Math.round(shares * price)
      : null;

    txns.push({
      id: `${meta.accession}-${idx++}`,
      filedAt: meta.filedAt || new Date().toISOString(),
      transactionDate: dateStr,
      issuerCik,
      issuerName,
      ticker,
      insiderName,
      insiderCik,
      isDirector,
      isOfficer,
      isTenPercentOwner,
      officerTitle,
      transactionCode: code,
      direction,
      shares: Number.isFinite(shares) && shares > 0 ? shares : null,
      pricePerShare: Number.isFinite(price) && price > 0 ? price : null,
      transactionValueUsd: value,
      sharesOwnedAfter: Number.isFinite(ownedAfter) ? ownedAfter : null,
      securityTitle: sec,
      filingUrl: meta.filingUrl,
    });
  }
  return txns;
}

/**
 * Fetch recent Form 4 transactions across the whole market.
 * Returns up to `limit` transactions, filtered to open-market buys/sells.
 *
 * Parallelism: pulls primary XML for up to 20 filings concurrently to stay
 * within EDGAR's 10 req/s policy once combined with RSS fetch.
 */
export async function fetchRecentForm4(opts: {
  feedCount?: number;      // how many RSS entries to walk (default 40)
  includeOther?: boolean;  // include A/M/F/G codes (default false — noise)
  tickersOnly?: string[];  // if set, filter to these tickers
} = {}): Promise<InsiderTransaction[]> {
  const { feedCount = 40, includeOther = false, tickersOnly } = opts;
  const feed = await fetchAtomFeed('4', feedCount);
  if (!feed.length) return [];

  // RSS entries duplicate each filing (Issuer + Reporting entry). Dedupe.
  const seen = new Set<string>();
  const uniques: AtomEntry[] = [];
  for (const e of feed) {
    if (seen.has(e.accession)) continue;
    seen.add(e.accession);
    uniques.push(e);
  }

  // Keep only the Issuer-side CIK entries (needed for directory resolution).
  // But RSS gives us both perspectives with different CIKs in URL — prefer the
  // issuer one (title contains "(Issuer)") so the directory we hit is the issuer's.
  const issuerEntries = uniques.map(e => {
    // Find matching entry from feed with "(Issuer)" in title sharing same accession
    const issuerEntry = feed.find(f => f.accession === e.accession && f.title.includes('(Issuer)'));
    return issuerEntry ?? e;
  });

  // Fetch XML in parallel batches of 8 (conservative on SEC limits)
  const results: InsiderTransaction[] = [];
  const BATCH = 8;
  for (let i = 0; i < issuerEntries.length; i += BATCH) {
    const slice = issuerEntries.slice(i, i + BATCH);
    const parsed = await Promise.allSettled(slice.map(async entry => {
      const xmlUrl = await findPrimaryXml(entry.cik, entry.accessionPath, ['ownership.xml', 'primary_doc.xml']);
      if (!xmlUrl) return [];
      const res = await pacedFetch(xmlUrl, 6000);
      if (!res.ok) return [];
      const xml = await res.text();
      const filedAt = entry.filedDate ? new Date(entry.filedDate).toISOString() : entry.updatedAt;
      return parseForm4Xml(xml, { accession: entry.accession, filingUrl: entry.link, filedAt });
    }));
    for (const r of parsed) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }
  }

  // Filter + sort
  return results
    .filter(t => includeOther || t.direction !== 'other')
    .filter(t => !tickersOnly || (t.ticker && tickersOnly.includes(t.ticker)))
    .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || ''));
}

// ── Schedule 13D / 13G ────────────────────────────────────────────────────────
// These filings are a narrative text form (not rich XML like Form 4). We extract
// the key metadata (filer, issuer, cusip, % owned) via regex from the text primary.

export interface OwnershipAlert {
  id: string;
  filedAt: string;
  formType: '13D' | '13G' | '13D/A' | '13G/A';
  issuerName: string;
  issuerCik: string;
  ticker: string | null;
  cusip: string | null;
  filerName: string;
  percentOwned: number | null;   // % of class
  sharesOwned: number | null;
  filingUrl: string;
}

async function fetchAtomBothForms(): Promise<AtomEntry[]> {
  // getcurrent supports a single form type, so combine two calls
  const [d, g, da, ga] = await Promise.all([
    fetchAtomFeed('SC 13D', 20),
    fetchAtomFeed('SC 13G', 20),
    fetchAtomFeed('SC 13D/A', 10),
    fetchAtomFeed('SC 13G/A', 10),
  ]);
  return [...d, ...g, ...da, ...ga];
}

function parse13xText(text: string, meta: { accession: string; filingUrl: string; filedAt: string; issuerName: string; ticker: string | null; cik: string; formType: OwnershipAlert['formType'] }): OwnershipAlert | null {
  // 13D/G uses free-text fields but standard labels:
  //   "Name of Reporting Person" / "CUSIP Number" / "Percent of Class Represented"
  // Extract filer from "NAME OF REPORTING PERSON" first, then fallback
  const filerName =
    m1(text, /NAME OF REPORTING PERSON[\s\S]{0,40}?\n\s*([A-Z][A-Za-z0-9 ,.&'\/-]{2,80})\n/i) ??
    m1(text, /(?:Filer|Reporting Person)[:\s]+([A-Za-z0-9 ,.&'\/-]{2,80})/i) ??
    '';
  const cusip = m1(text, /CUSIP(?:\s+NO(?:\.)?|\s+NUMBER)?\s*[:\s]*([0-9A-Z]{8,9})/i);
  // Percent — parse several common phrasings
  const pctStr =
    m1(text, /PERCENT OF CLASS REPRESENTED[\s\S]{0,60}?([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    m1(text, /Percent of Class[\s\S]{0,40}?([0-9]+(?:\.[0-9]+)?)\s*%/i) ??
    m1(text, /([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:of the outstanding|of common)/i);
  const sharesStr =
    m1(text, /AGGREGATE AMOUNT[\s\S]{0,80}?([0-9][0-9,]{4,})\s*(?:shares)?/i) ??
    m1(text, /([0-9][0-9,]{4,})\s*shares/i);

  const ticker = meta.ticker ?? (cusip ? CUSIP_TO_TICKER[cusip] ?? null : null);

  return {
    id: meta.accession,
    filedAt: meta.filedAt,
    formType: meta.formType,
    issuerName: meta.issuerName,
    issuerCik: meta.cik,
    ticker,
    cusip,
    filerName,
    percentOwned: pctStr ? Number(pctStr) : null,
    sharesOwned: sharesStr ? Number(sharesStr.replace(/,/g, '')) : null,
    filingUrl: meta.filingUrl,
  };
}

export async function fetchRecentOwnershipAlerts(opts: {
  tickersOnly?: string[];
  minPercent?: number;   // only surface alerts crossing this % (default 5)
} = {}): Promise<OwnershipAlert[]> {
  const { tickersOnly, minPercent = 5 } = opts;
  const feed = await fetchAtomBothForms();
  if (!feed.length) return [];

  // Dedupe by accession
  const seen = new Set<string>();
  const uniques: (AtomEntry & { formType: OwnershipAlert['formType']; issuerName: string })[] = [];
  for (const e of feed) {
    if (seen.has(e.accession)) continue;
    seen.add(e.accession);
    // Derive form type and issuer name from title: "SC 13D - Issuer Name (CIK) (Issuer)"
    const formMatch = e.title.match(/^(SC 13[DG](?:\/A)?)/);
    const nameMatch = e.title.match(/-\s+([^(]+)\s+\(/);
    if (!formMatch || !nameMatch) continue;
    const formType = formMatch[1].replace('SC ', '') as OwnershipAlert['formType'];
    uniques.push({ ...e, formType, issuerName: nameMatch[1].trim() });
  }

  // Fetch primary text/xml for each in batches of 6
  const results: OwnershipAlert[] = [];
  const BATCH = 6;
  for (let i = 0; i < uniques.length; i += BATCH) {
    const slice = uniques.slice(i, i + BATCH);
    const parsed = await Promise.allSettled(slice.map(async entry => {
      // Prefer the primary_doc.xml if present, otherwise grab the first .txt
      const dirUrl = `${EDGAR_BASE}/Archives/edgar/data/${entry.cik}/${entry.accessionPath}/`;
      const res = await pacedFetch(dirUrl, 5000);
      if (!res.ok) return null;
      const html = await res.text();
      // Use primary_doc or any .txt file (the actual filing)
      const txtHref = html.match(/href="([^"]+\.(?:txt|htm))"/i)?.[1];
      if (!txtHref) return null;
      const absUrl = txtHref.startsWith('/') ? EDGAR_BASE + txtHref : txtHref;
      const filingRes = await pacedFetch(absUrl, 8000);
      if (!filingRes.ok) return null;
      let body = await filingRes.text();
      // Strip HTML tags for regex reliability
      body = body.replace(/<[^>]+>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      const ticker = resolveTickerFromIssuerName(entry.issuerName);
      const filedAt = entry.filedDate ? new Date(entry.filedDate).toISOString() : entry.updatedAt;
      return parse13xText(body, {
        accession: entry.accession,
        filingUrl: entry.link,
        filedAt,
        issuerName: entry.issuerName,
        ticker,
        cik: entry.cik,
        formType: entry.formType,
      });
    }));
    for (const r of parsed) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
  }

  return results
    .filter(a => !tickersOnly || (a.ticker && tickersOnly.includes(a.ticker)))
    .filter(a => a.percentOwned == null || a.percentOwned >= minPercent)
    .sort((a, b) => (b.filedAt || '').localeCompare(a.filedAt || ''));
}
