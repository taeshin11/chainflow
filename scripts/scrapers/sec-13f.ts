/**
 * SEC EDGAR 13F scraper
 * Fetches latest 13F filings from major hedge funds/institutions via the free SEC EDGAR API.
 * Rate limit: max 10 req/sec. Includes User-Agent as required by SEC.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScrapedSignal {
  ticker: string;
  institution: string;
  action: 'accumulating' | 'reducing' | 'new_position' | 'exit';
  shares: number;
  value: number; // USD millions
  changePercent: number;
  quarter: string; // "Q4 2024"
  filedAt: string; // ISO date
}

interface EdgarFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
}

interface EdgarFilingsResponse {
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
    };
  };
}

interface Holding {
  ticker: string;
  shares: number;
  value: number; // USD thousands (raw from SEC)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_AGENT = 'Flowvium/1.0 taeshinkim11@gmail.com';
const BASE_URL = 'https://data.sec.gov';
const DELAY_MS = 120; // ~8 req/sec, safely under 10 req/sec limit

const INSTITUTIONS: Record<string, string> = {
  'Berkshire Hathaway': '0001067983',
  'Bridgewater Associates': '0001350694',
  'Soros Fund Management': '0001029160',
  'Tiger Global Management': '0001456346',
  'Citadel Advisors': '0001423298',
  'BlackRock': '0001364742',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function secFetch(url: string): Promise<Response> {
  await sleep(DELAY_MS);
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
}

function quarterFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getUTCMonth(); // 0-indexed
  const year = d.getUTCFullYear();
  const q = Math.floor(month / 3) + 1;
  return `Q${q} ${year}`;
}

// ---------------------------------------------------------------------------
// Fetch latest 13F filing metadata for a CIK
// ---------------------------------------------------------------------------

async function getLatest13FAccession(
  cik: string
): Promise<{ accessionNumber: string; filingDate: string; reportDate: string } | null> {
  const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');
  const url = `${BASE_URL}/submissions/CIK${paddedCik}.json`;

  const res = await secFetch(url);
  if (!res.ok) {
    console.warn(`  [sec-13f] Failed to fetch submissions for CIK ${cik}: ${res.status}`);
    return null;
  }

  const data = (await res.json()) as EdgarFilingsResponse;
  const { accessionNumber, filingDate, reportDate, form } = data.filings.recent;

  for (let i = 0; i < form.length; i++) {
    if (form[i] === '13F-HR') {
      return {
        accessionNumber: accessionNumber[i],
        filingDate: filingDate[i],
        reportDate: reportDate[i],
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fetch and parse the XML holdings from a 13F filing
// ---------------------------------------------------------------------------

async function fetchHoldings(
  cik: string,
  accessionNumber: string
): Promise<Holding[]> {
  const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');
  const accNoFormatted = accessionNumber.replace(/-/g, '');

  // Fetch filing index to find the XML document name
  const indexUrl = `${BASE_URL}/Archives/edgar/data/${parseInt(paddedCik, 10)}/${accNoFormatted}/${accessionNumber}-index.json`;
  const indexRes = await secFetch(indexUrl);

  if (!indexRes.ok) {
    console.warn(`  [sec-13f] Could not load filing index: ${indexRes.status} ${indexUrl}`);
    return [];
  }

  interface IndexDoc { name: string; type: string; }
  interface IndexJson { directory: { item: IndexDoc[] | IndexDoc } }
  const indexJson = (await indexRes.json()) as IndexJson;

  // Normalise items to array
  const rawItems = indexJson?.directory?.item;
  const items: IndexDoc[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  // Find the information table XML (the actual holdings)
  const xmlDoc = items.find(
    (d) =>
      d.type === 'INFORMATION TABLE' ||
      d.name.endsWith('infotable.xml') ||
      (d.name.endsWith('.xml') && !d.name.toLowerCase().includes('primary'))
  );

  if (!xmlDoc) {
    console.warn(`  [sec-13f] No information table XML found in filing index.`);
    return [];
  }

  const xmlUrl = `${BASE_URL}/Archives/edgar/data/${parseInt(paddedCik, 10)}/${accNoFormatted}/${xmlDoc.name}`;
  const xmlRes = await secFetch(xmlUrl);

  if (!xmlRes.ok) {
    console.warn(`  [sec-13f] Failed to fetch XML: ${xmlRes.status}`);
    return [];
  }

  const xml = await xmlRes.text();
  return parseInfoTableXml(xml);
}

// ---------------------------------------------------------------------------
// Minimal XML parser for 13F information table
// ---------------------------------------------------------------------------

function extractTagValue(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function parseInfoTableXml(xml: string): Holding[] {
  const holdings: Holding[] = [];

  // Split by infoTable or ns1:infoTable entries
  const entryRe = /<(?:ns1:)?infoTable>([\s\S]*?)<\/(?:ns1:)?infoTable>/gi;
  let match: RegExpExecArray | null;

  while ((match = entryRe.exec(xml)) !== null) {
    const entry = match[1];

    const ticker = extractTagValue(entry, 'titleOfClass') ||
      extractTagValue(entry, 'ns1:titleOfClass');
    const sharesStr = extractTagValue(entry, 'sshPrnamt') ||
      extractTagValue(entry, 'ns1:sshPrnamt');
    const valueStr = extractTagValue(entry, 'value') ||
      extractTagValue(entry, 'ns1:value');
    const cusipStr = extractTagValue(entry, 'cusip') ||
      extractTagValue(entry, 'ns1:cusip');

    // titleOfClass often contains the security name, not the ticker.
    // We'll store what we have and do best-effort ticker mapping downstream.
    const shares = parseInt(sharesStr.replace(/,/g, ''), 10);
    const valueThousands = parseInt(valueStr.replace(/,/g, ''), 10);

    if (!isNaN(shares) && !isNaN(valueThousands) && (ticker || cusipStr)) {
      holdings.push({
        ticker: ticker || cusipStr, // best effort
        shares,
        value: Math.round(valueThousands / 1000), // convert to USD millions
      });
    }
  }

  return holdings;
}

// ---------------------------------------------------------------------------
// Compare quarters to compute action + changePercent
// ---------------------------------------------------------------------------

function deriveAction(
  current: Holding,
  previous: Holding | undefined
): { action: ScrapedSignal['action']; changePercent: number } {
  if (!previous) {
    return { action: 'new_position', changePercent: 100 };
  }
  if (current.shares === 0) {
    return { action: 'exit', changePercent: -100 };
  }
  const changePct = previous.shares === 0
    ? 100
    : ((current.shares - previous.shares) / previous.shares) * 100;

  if (changePct >= 5) {
    return { action: 'accumulating', changePercent: Math.round(changePct) };
  } else if (changePct <= -5) {
    return { action: 'reducing', changePercent: Math.round(changePct) };
  }
  // Flat — treat as accumulating for signal purposes
  return { action: 'accumulating', changePercent: Math.round(changePct) };
}

// ---------------------------------------------------------------------------
// Main scraper
// ---------------------------------------------------------------------------

export async function scrapeSecSignals(): Promise<ScrapedSignal[]> {
  const signals: ScrapedSignal[] = [];

  for (const [institutionName, cik] of Object.entries(INSTITUTIONS)) {
    console.log(`  [sec-13f] Processing ${institutionName} (CIK: ${cik})...`);

    try {
      // --- Fetch two most-recent 13F filings (current + previous quarter) ---
      const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');
      const subUrl = `${BASE_URL}/submissions/CIK${paddedCik}.json`;
      const subRes = await secFetch(subUrl);

      if (!subRes.ok) {
        console.warn(`  [sec-13f]   Skipping ${institutionName} — submissions fetch failed (${subRes.status})`);
        continue;
      }

      const subData = (await subRes.json()) as EdgarFilingsResponse;
      const { accessionNumber, filingDate, reportDate, form } = subData.filings.recent;

      // Collect up to 2 13F-HR filings
      const filings: EdgarFiling[] = [];
      for (let i = 0; i < form.length && filings.length < 2; i++) {
        if (form[i] === '13F-HR') {
          filings.push({
            accessionNumber: accessionNumber[i],
            filingDate: filingDate[i],
            reportDate: reportDate[i],
            form: form[i],
          });
        }
      }

      if (filings.length === 0) {
        console.warn(`  [sec-13f]   No 13F-HR filings found for ${institutionName}`);
        continue;
      }

      const [currentFiling, previousFiling] = filings;

      console.log(`  [sec-13f]   Fetching current holdings (${currentFiling.filingDate})...`);
      const currentHoldings = await fetchHoldings(cik, currentFiling.accessionNumber);

      let previousMap: Map<string, Holding> = new Map();
      if (previousFiling) {
        console.log(`  [sec-13f]   Fetching previous holdings (${previousFiling.filingDate})...`);
        const prevHoldings = await fetchHoldings(cik, previousFiling.accessionNumber);
        previousMap = new Map(prevHoldings.map((h) => [h.ticker.toUpperCase(), h]));
      }

      console.log(`  [sec-13f]   Found ${currentHoldings.length} positions.`);

      for (const holding of currentHoldings) {
        const tickerKey = holding.ticker.toUpperCase();
        const prev = previousMap.get(tickerKey);
        const { action, changePercent } = deriveAction(holding, prev);

        signals.push({
          ticker: tickerKey,
          institution: institutionName,
          action,
          shares: holding.shares,
          value: holding.value,
          changePercent,
          quarter: quarterFromDate(currentFiling.reportDate),
          filedAt: currentFiling.filingDate,
        });
      }
    } catch (err) {
      console.error(`  [sec-13f]   Error processing ${institutionName}:`, err);
    }
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT_PATH = path.resolve(
    process.cwd(),
    'src/data/generated/sec-signals.json'
  );

  (async () => {
    console.log('[sec-13f] Starting SEC 13F scrape...');
    const signals = await scrapeSecSignals();
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(signals, null, 2));
    console.log(`[sec-13f] Done. Wrote ${signals.length} signals to ${OUT_PATH}`);
  })().catch((err) => {
    console.error('[sec-13f] Fatal error:', err);
    process.exit(1);
  });
}
