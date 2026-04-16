/**
 * News Gap Score calculator
 * Cross-references SEC 13F institutional signals with news mention counts
 * to surface "smart money stealth" positions: high institutional activity
 * with low media coverage.
 *
 * Formula: gapScore = (institutionalActivityScore / (newsMentions + 1)) * 100
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ScrapedSignal } from './sec-13f';
import type { NewsCountsOutput } from './rss-news';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsGapScore {
  ticker: string;
  gapScore: number;
  institutionalActivityScore: number;
  newsMentions: number;
  latestHeadline: string | null;
  lastNewsSeen: string | null;
  // Summary of institutional actions driving the score
  institutions: Array<{
    name: string;
    action: ScrapedSignal['action'];
    value: number;       // USD millions
    changePercent: number;
    quarter: string;
  }>;
  calculatedAt: string; // ISO timestamp
}

export type NewsGapScoresOutput = Record<string, NewsGapScore>;

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const ACTION_WEIGHTS: Record<ScrapedSignal['action'], number> = {
  new_position: 10,   // Highest signal — brand new stake
  accumulating: 6,    // Significant increase
  reducing: 2,        // De-risking, less interesting
  exit: 1,            // Full exit — note-worthy but not a buy signal
};

/**
 * Compute a 0-100 institutional activity score for a ticker based on its
 * 13F signals. Larger positions and more impactful actions score higher.
 */
function computeInstitutionalActivityScore(signals: ScrapedSignal[]): number {
  if (signals.length === 0) return 0;

  let raw = 0;
  for (const s of signals) {
    const weight = ACTION_WEIGHTS[s.action] ?? 1;
    // Value contribution (log-scale to prevent mega-caps from overwhelming)
    const valueContrib = s.value > 0 ? Math.log10(s.value + 1) : 0;
    // Magnitude of change (capped at 100%)
    const changeMag = Math.min(Math.abs(s.changePercent), 100) / 100;
    raw += weight * (1 + valueContrib + changeMag);
  }

  // Normalise to 0-100 using a soft cap (logistic-ish approach)
  const normalised = Math.min(100, Math.round((raw / (raw + 50)) * 100));
  return normalised;
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

export function calculateNewsGapScores(
  secSignals: ScrapedSignal[],
  newsCounts: NewsCountsOutput
): NewsGapScoresOutput {
  // Group SEC signals by ticker
  const byTicker: Record<string, ScrapedSignal[]> = {};
  for (const signal of secSignals) {
    const t = signal.ticker.toUpperCase();
    if (!byTicker[t]) byTicker[t] = [];
    byTicker[t].push(signal);
  }

  const output: NewsGapScoresOutput = {};
  const now = new Date().toISOString();

  for (const [ticker, signals] of Object.entries(byTicker)) {
    const institutionalActivityScore = computeInstitutionalActivityScore(signals);
    const newsEntry = newsCounts[ticker];
    const newsMentions = newsEntry?.count ?? 0;

    const gapScore = Math.round(
      (institutionalActivityScore / (newsMentions + 1)) * 100
    );

    output[ticker] = {
      ticker,
      gapScore,
      institutionalActivityScore,
      newsMentions,
      latestHeadline: newsEntry?.latestHeadline ?? null,
      lastNewsSeen: newsEntry?.lastSeen ?? null,
      institutions: signals.map((s) => ({
        name: s.institution,
        action: s.action,
        value: s.value,
        changePercent: s.changePercent,
        quarter: s.quarter,
      })),
      calculatedAt: now,
    };
  }

  // Sort by gapScore descending for easy consumption
  const sorted: NewsGapScoresOutput = {};
  for (const key of Object.keys(output).sort(
    (a, b) => output[b].gapScore - output[a].gapScore
  )) {
    sorted[key] = output[key];
  }

  return sorted;
}

// ---------------------------------------------------------------------------
// Standalone entry point
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const ROOT = process.cwd();
  const SEC_PATH = path.resolve(ROOT, 'src/data/generated/sec-signals.json');
  const NEWS_PATH = path.resolve(ROOT, 'src/data/generated/news-counts.json');
  const OUT_PATH = path.resolve(ROOT, 'src/data/generated/news-gap-scores.json');

  (async () => {
    console.log('[news-gap-calc] Loading input files...');

    if (!fs.existsSync(SEC_PATH)) {
      console.error(`[news-gap-calc] Missing ${SEC_PATH} — run sec-13f scraper first.`);
      process.exit(1);
    }
    if (!fs.existsSync(NEWS_PATH)) {
      console.error(`[news-gap-calc] Missing ${NEWS_PATH} — run rss-news scraper first.`);
      process.exit(1);
    }

    const secSignals = JSON.parse(fs.readFileSync(SEC_PATH, 'utf8')) as ScrapedSignal[];
    const newsCounts = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf8')) as NewsCountsOutput;

    console.log(
      `[news-gap-calc] Loaded ${secSignals.length} SEC signals and ${Object.keys(newsCounts).length} news entries.`
    );

    const scores = calculateNewsGapScores(secSignals, newsCounts);
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(scores, null, 2));

    const top5 = Object.values(scores).slice(0, 5);
    console.log('[news-gap-calc] Top 5 gap scores:');
    for (const s of top5) {
      console.log(`  ${s.ticker}: gap=${s.gapScore} (inst=${s.institutionalActivityScore}, news=${s.newsMentions})`);
    }

    console.log(`[news-gap-calc] Done. Wrote ${Object.keys(scores).length} scores to ${OUT_PATH}`);
  })().catch((err) => {
    console.error('[news-gap-calc] Fatal error:', err);
    process.exit(1);
  });
}
