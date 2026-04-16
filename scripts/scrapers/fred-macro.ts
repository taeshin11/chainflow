/**
 * FRED API macro data scraper
 * Fetches key macro indicator series from the St. Louis Fed (FRED).
 * No API key required for public series.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MacroObservation {
  date: string;  // YYYY-MM-DD
  value: number | null;
}

export interface MacroIndicator {
  seriesId: string;
  name: string;
  description: string;
  unit: string;
  latestValue: number | null;
  latestDate: string;
  previousValue: number | null;
  changeAbsolute: number | null;
  changePercent: number | null;
  history: MacroObservation[]; // last 90 observations
  fetchedAt: string; // ISO timestamp
}

export type MacroIndicatorsOutput = Record<string, MacroIndicator>;

// ---------------------------------------------------------------------------
// Series definitions
// ---------------------------------------------------------------------------

interface SeriesDef {
  id: string;
  name: string;
  description: string;
  unit: string;
}

const SERIES: SeriesDef[] = [
  {
    id: 'DFF',
    name: 'Fed Funds Rate',
    description: 'Effective Federal Funds Rate — the benchmark short-term interest rate set by the Federal Reserve.',
    unit: '%',
  },
  {
    id: 'M2SL',
    name: 'M2 Money Supply',
    description: 'M2 Money Stock — broad measure of U.S. money supply including cash, checking deposits, savings, and money market funds.',
    unit: 'Billions USD',
  },
  {
    id: 'T10Y2Y',
    name: '10Y-2Y Treasury Spread',
    description: '10-Year minus 2-Year Treasury yield spread — a widely watched recession indicator (negative = inverted yield curve).',
    unit: '%',
  },
  {
    id: 'DEXUSEU',
    name: 'USD/EUR Exchange Rate',
    description: 'U.S. Dollars to One Euro — spot exchange rate.',
    unit: 'USD per EUR',
  },
  {
    id: 'BAMLH0A0HYM2',
    name: 'High Yield Spread',
    description: 'ICE BofA U.S. High Yield Index Option-Adjusted Spread — measures credit risk appetite in the market.',
    unit: '%',
  },
  {
    id: 'WALCL',
    name: 'Fed Balance Sheet',
    description: 'Assets: Total Assets: Total Assets (Less Eliminations from Consolidation) — Fed balance sheet size.',
    unit: 'Millions USD',
  },
];

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
// FRED allows requests without an API key for public series (returns XML by default;
// use file_type=json to get JSON).
const FRED_PARAMS_BASE = 'file_type=json&sort_order=desc&limit=90';

async function fetchSeries(seriesId: string): Promise<MacroObservation[]> {
  const url = `${FRED_BASE}?series_id=${seriesId}&${FRED_PARAMS_BASE}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`FRED fetch failed for ${seriesId}: HTTP ${res.status}`);
  }

  interface FredObs { date: string; value: string; }
  interface FredResponse { observations: FredObs[] }
  const data = (await res.json()) as FredResponse;

  return (data.observations ?? [])
    .map((obs) => ({
      date: obs.date,
      value: obs.value === '.' ? null : parseFloat(obs.value),
    }))
    .reverse(); // return chronological order (oldest → newest)
}

// ---------------------------------------------------------------------------
// Main scraper
// ---------------------------------------------------------------------------

export async function scrapeMacroIndicators(): Promise<MacroIndicatorsOutput> {
  const output: MacroIndicatorsOutput = {};

  for (const series of SERIES) {
    console.log(`  [fred-macro] Fetching ${series.id} (${series.name})...`);

    try {
      const history = await fetchSeries(series.id);

      // Find the latest non-null value
      let latestIdx = history.length - 1;
      while (latestIdx >= 0 && history[latestIdx].value === null) {
        latestIdx--;
      }

      const latestObs = latestIdx >= 0 ? history[latestIdx] : null;
      const latestValue = latestObs?.value ?? null;
      const latestDate = latestObs?.date ?? '';

      // Find the previous non-null value (one before latest)
      let prevIdx = latestIdx - 1;
      while (prevIdx >= 0 && history[prevIdx].value === null) {
        prevIdx--;
      }
      const prevObs = prevIdx >= 0 ? history[prevIdx] : null;
      const previousValue = prevObs?.value ?? null;

      const changeAbsolute =
        latestValue !== null && previousValue !== null
          ? Math.round((latestValue - previousValue) * 10000) / 10000
          : null;

      const changePercent =
        latestValue !== null && previousValue !== null && previousValue !== 0
          ? Math.round(((latestValue - previousValue) / Math.abs(previousValue)) * 10000) / 100
          : null;

      output[series.id] = {
        seriesId: series.id,
        name: series.name,
        description: series.description,
        unit: series.unit,
        latestValue,
        latestDate,
        previousValue,
        changeAbsolute,
        changePercent,
        history,
        fetchedAt: new Date().toISOString(),
      };

      console.log(
        `  [fred-macro]   ${series.id}: ${latestValue} ${series.unit} as of ${latestDate}`
      );
    } catch (err) {
      console.error(`  [fred-macro]   Error fetching ${series.id}:`, err);
      // Write a placeholder so consumers know the key exists but data is missing
      output[series.id] = {
        seriesId: series.id,
        name: series.name,
        description: series.description,
        unit: series.unit,
        latestValue: null,
        latestDate: '',
        previousValue: null,
        changeAbsolute: null,
        changePercent: null,
        history: [],
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  return output;
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT_PATH = path.resolve(
    process.cwd(),
    'src/data/generated/macro-indicators.json'
  );

  (async () => {
    console.log('[fred-macro] Starting FRED macro data scrape...');
    const data = await scrapeMacroIndicators();
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2));
    console.log(`[fred-macro] Done. Wrote ${Object.keys(data).length} series to ${OUT_PATH}`);
  })().catch((err) => {
    console.error('[fred-macro] Fatal error:', err);
    process.exit(1);
  });
}
