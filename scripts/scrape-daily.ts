/**
 * scrape-daily.ts — Main orchestrator
 * Runs all data scrapers in sequence, writes output to src/data/generated/,
 * then commits and git-pushes so Vercel auto-deploys.
 *
 * Usage:
 *   npx tsx scripts/scrape-daily.ts
 *   # or via package.json:  npm run scrape
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import { scrapeSecSignals } from './scrapers/sec-13f';
import { scrapeMacroIndicators } from './scrapers/fred-macro';
import { scrapeNewscounts } from './scrapers/rss-news';
import { calculateNewsGapScores } from './scrapers/news-gap-calc';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = path.resolve(process.cwd());
const GENERATED_DIR = path.join(ROOT, 'src', 'data', 'generated');

const OUT_SEC = path.join(GENERATED_DIR, 'sec-signals.json');
const OUT_MACRO = path.join(GENERATED_DIR, 'macro-indicators.json');
const OUT_NEWS = path.join(GENERATED_DIR, 'news-counts.json');
const OUT_GAP = path.join(GENERATED_DIR, 'news-gap-scores.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  const sizeKb = (fs.statSync(filePath).size / 1024).toFixed(1);
  console.log(`  Wrote ${path.basename(filePath)} (${sizeKb} KB)`);
}

function runStep<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T | null> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`STEP: ${name}`);
  console.log('='.repeat(60));

  return fn().catch((err: unknown) => {
    console.error(`[orchestrator] FAILED: ${name}`);
    console.error(err);
    return null;
  });
}

function gitPush(): void {
  console.log('\n' + '='.repeat(60));
  console.log('STEP: Git commit & push');
  console.log('='.repeat(60));

  try {
    execSync('git add src/data/generated/', { cwd: ROOT, stdio: 'inherit' });

    const date = new Date().toISOString().slice(0, 10);
    const msg = `data: automated scrape ${date}`;
    execSync(`git commit -m "${msg}" --allow-empty`, { cwd: ROOT, stdio: 'inherit' });
    execSync('git push', { cwd: ROOT, stdio: 'inherit' });

    console.log('[orchestrator] Git push complete — Vercel deploy triggered.');
  } catch (err) {
    console.error('[orchestrator] Git push failed:', err);
    // Non-fatal — data files are still updated locally
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const startTime = Date.now();
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# FlowVium Daily Scrape — ${new Date().toISOString()}`);
  console.log(`${'#'.repeat(60)}\n`);

  // --- 1. SEC 13F -----------------------------------------------------------
  const secSignals = await runStep('SEC EDGAR 13F', async () => {
    const signals = await scrapeSecSignals();
    writeJson(OUT_SEC, signals);
    console.log(`  Total signals scraped: ${signals.length}`);
    return signals;
  });

  // --- 2. FRED Macro --------------------------------------------------------
  const macroIndicators = await runStep('FRED Macro Indicators', async () => {
    const data = await scrapeMacroIndicators();
    writeJson(OUT_MACRO, data);
    console.log(`  Series fetched: ${Object.keys(data).length}`);
    return data;
  });

  // --- 3. RSS News ----------------------------------------------------------
  const newsCounts = await runStep('RSS News Aggregation', async () => {
    const data = await scrapeNewscounts();
    writeJson(OUT_NEWS, data);
    console.log(`  Tickers with mentions: ${Object.keys(data).length}`);
    return data;
  });

  // --- 4. News Gap Scores ---------------------------------------------------
  await runStep('News Gap Score Calculation', async () => {
    // Load from disk if an earlier step returned null (graceful degradation)
    let signals = secSignals;
    let counts = newsCounts;

    if (!signals) {
      if (!fs.existsSync(OUT_SEC)) {
        console.warn('  No SEC signals available — skipping gap calc.');
        return null;
      }
      signals = JSON.parse(fs.readFileSync(OUT_SEC, 'utf8'));
    }

    if (!counts) {
      if (!fs.existsSync(OUT_NEWS)) {
        console.warn('  No news counts available — skipping gap calc.');
        return null;
      }
      counts = JSON.parse(fs.readFileSync(OUT_NEWS, 'utf8'));
    }

    const gapScores = calculateNewsGapScores(signals!, counts!);
    writeJson(OUT_GAP, gapScores);
    console.log(`  Gap scores calculated: ${Object.keys(gapScores).length}`);

    // Print top 10
    const top = Object.values(gapScores).slice(0, 10);
    if (top.length > 0) {
      console.log('\n  Top 10 gap scores (ticker: gap / inst / news):');
      for (const s of top) {
        console.log(
          `    ${s.ticker.padEnd(6)} gap=${String(s.gapScore).padStart(4)}  inst=${String(s.institutionalActivityScore).padStart(3)}  news=${s.newsMentions}`
        );
      }
    }

    return gapScores;
  });

  // Unused variable suppression
  void macroIndicators;

  // --- 5. Git push ----------------------------------------------------------
  gitPush();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# Scrape complete in ${elapsed}s`);
  console.log(`${'#'.repeat(60)}\n`);
}

main().catch((err) => {
  console.error('[orchestrator] Unhandled fatal error:', err);
  process.exit(1);
});
