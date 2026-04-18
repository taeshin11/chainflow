import { Redis } from '@upstash/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { institutionalSignals, type InstitutionalSignal } from '@/data/institutional-signals';
import { newsGapData } from '@/data/news-gap';
import { allCompanies } from '@/data/companies';
import { companySupplyChainUpdates } from '@/data/company-supply-chain-updates';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Timeframe = '1w' | '4w' | '13w';

export interface BriefSection {
  title: string;
  content: string;
  bullets: string[];
}

export interface DailyBrief {
  market: BriefSection;
  capital: BriefSection;
  company: BriefSection;
  signals: BriefSection;
  outlook: string;
  riskLevel: 'low' | 'medium' | 'high';
  generatedAt: string;
  tf: Timeframe;
  source?: string;
  cached?: boolean;
}

// ── Redis ─────────────────────────────────────────────────────────────────────
export function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function kstDateStr(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function cacheKey(tf: Timeframe): string {
  return `flowvium:daily-brief:v4:${kstDateStr()}:${tf}`;
}

// ── Per-tab data aggregator ───────────────────────────────────────────────────
/**
 * Pulls live data from every tab's Redis cache so the AI report reflects the
 * full site state. Each field may be null if that tab hasn't been populated.
 */
export interface TabContext {
  heatmap: unknown | null;        // Market Heatmap (US default)
  short: unknown | null;          // Short Interest (squeeze candidates)
  capital: unknown | null;        // Capital Flows (assets + countries)
  fearGreed: unknown | null;      // Fear & Greed (SPY = US)
  fedWatch: unknown | null;       // CME FedWatch
  macro: unknown | null;          // Macro Indicators (CPI, yield curve, …)
  credit: unknown | null;         // NYSE margin / credit balance
  cascade: unknown[];             // News Cascade top articles today
  signals: InstitutionalSignal[]; // 13F (live if available, else static)
}

async function safeGet<T = unknown>(redis: Redis, key: string): Promise<T | null> {
  try { return (await redis.get<T>(key)) ?? null; } catch { return null; }
}

export async function gatherTabContext(redis: Redis | null): Promise<TabContext> {
  const ctx: TabContext = {
    heatmap: null, short: null, capital: null, fearGreed: null,
    fedWatch: null, macro: null, credit: null, cascade: [],
    signals: institutionalSignals,
  };
  if (!redis) return ctx;

  const hour = new Date().toISOString().slice(0, 13);
  const today = new Date().toISOString().slice(0, 10);
  const kst = kstDateStr();

  const [
    heatmap, shortData, capFlows, capFlowsYahoo, capFlowsNone,
    fg, fed, macroV4, macroV3, credit, cascadeIds, liveSignals,
  ] = await Promise.all([
    safeGet(redis, `flowvium:heatmap:v5:US:${hour}`),
    safeGet(redis, 'flowvium:short-interest:v1'),
    safeGet(redis, 'flowvium:capital-flows:v4:twelve'),
    safeGet(redis, 'flowvium:capital-flows:v4:yahoo'),
    safeGet(redis, 'flowvium:capital-flows:v4:none'),
    safeGet(redis, 'flowvium:fg:v3:SPY'),
    safeGet(redis, `flowvium:fedwatch:v1:${hour}`),
    safeGet(redis, `flowvium:macro-indicators:v4:${kst}`),
    safeGet(redis, `flowvium:macro-indicators:v3:${kst}`),
    safeGet<Record<string, unknown>>(redis, `flowvium:credit-balance:v2:${today}`),
    (async () => {
      try { return await redis.lrange(`flowvium:news-cascade:v1:list:${today}`, 0, 5); }
      catch { return [] as string[]; }
    })(),
    safeGet<InstitutionalSignal[]>(redis, 'flowvium:13f-signals:v1'),
  ]);

  ctx.heatmap = heatmap;
  ctx.short = shortData;
  ctx.capital = capFlows ?? capFlowsYahoo ?? capFlowsNone;
  ctx.fearGreed = fg;
  ctx.fedWatch = fed;
  ctx.macro = macroV4 ?? macroV3;
  ctx.credit = credit;
  if (Array.isArray(liveSignals) && liveSignals.length > 0) ctx.signals = liveSignals;

  if (cascadeIds && cascadeIds.length > 0) {
    const articles = await Promise.all(
      cascadeIds.slice(0, 5).map(id => safeGet(redis, `flowvium:news-cascade:v1:article:${id}`))
    );
    ctx.cascade = articles.filter(Boolean);
  }

  return ctx;
}

// ── AI call ───────────────────────────────────────────────────────────────────
// vLLM local model has max_model_len=1024 tokens total (prompt+output).
// For Gemini we can send the full rich prompt.
export async function callAI(prompt: string): Promise<{ text: string; source: string }> {
  const vllmUrl = process.env.VLLM_URL?.replace(/\s+/g, '').replace(/\\n/g, '');
  if (vllmUrl) {
    try {
      const res = await fetch(`${vllmUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct',
          messages: [
            { role: 'user', content: prompt.slice(0, 2800) }, // rough token cap
          ],
          max_tokens: 500,
          temperature: 0.65,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? '';
        if (text) return { text, source: 'EXAONE-3.5' };
      }
    } catch { /* fall through to Gemini */ }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { text: '', source: 'fallback' };
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return { text: result.response.text(), source: 'Gemini 2.5' };
}

// ── Compact summarisers for each tab ─────────────────────────────────────────
function summariseHeatmap(data: unknown): string {
  const d = data as Record<string, unknown> | null;
  if (!d?.sectors) return '';
  const sectors = (d.sectors as Array<Record<string, unknown>>) ?? [];
  const sorted = [...sectors]
    .filter(s => s.avgChangePct != null)
    .sort((a, b) => (b.avgChangePct as number) - (a.avgChangePct as number));
  const top = sorted.slice(0, 3).map(s => `${s.sector}${(s.avgChangePct as number) > 0 ? '+' : ''}${(s.avgChangePct as number).toFixed(1)}%`);
  const bot = sorted.slice(-2).map(s => `${s.sector}${(s.avgChangePct as number).toFixed(1)}%`);
  return `sectors↑${top.join(',')} ↓${bot.join(',')}`;
}

function summariseShort(data: unknown): string {
  const d = data as Array<Record<string, unknown>> | { entries?: Array<Record<string, unknown>> } | null;
  const arr = Array.isArray(d) ? d : d?.entries;
  if (!arr?.length) return '';
  const top = [...arr]
    .filter(s => (s.squeezeScore as number) > 0 || (s.shortFloatPct as number | null) != null)
    .sort((a, b) => ((b.squeezeScore as number) ?? 0) - ((a.squeezeScore as number) ?? 0))
    .slice(0, 4)
    .map(s => `${s.ticker}(${s.squeezeScore ?? 0}점,short${(s.shortFloatPct as number | null) ?? '-'}%)`);
  return `squeeze:${top.join(',')}`;
}

function summariseCapital(data: unknown, tf: Timeframe): string {
  const retKey = tf === '1w' ? 'ret1w' : tf === '4w' ? 'ret4w' : 'ret13w';
  const d = data as Record<string, unknown> | null;
  if (!d) return '';
  const assets = (d.assets as Array<Record<string, unknown>>) ?? [];
  const sortedA = [...assets].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
  const topA = sortedA.slice(0, 3).map(a => `${a.ticker}+${((a[retKey] as number) ?? 0).toFixed(1)}%`);
  const botA = sortedA.slice(-2).map(a => `${a.ticker}${((a[retKey] as number) ?? 0).toFixed(1)}%`);

  const cf = d.countryFlow as Record<string, unknown> | undefined;
  const countries = (cf?.countries as Array<Record<string, unknown>>) ?? [];
  const sortedC = [...countries].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
  const topC = sortedC.slice(0, 2).map(c => `${c.country}+${((c[retKey] as number) ?? 0).toFixed(1)}%`);
  const botC = sortedC.slice(-1).map(c => `${c.country}${((c[retKey] as number) ?? 0).toFixed(1)}%`);

  return `assets↑${topA.join(',')} ↓${botA.join(',')} | countries↑${topC.join(',')} ↓${botC.join(',')}`;
}

function summariseFearGreed(data: unknown): string {
  const d = data as Record<string, unknown> | null;
  if (!d || d.score == null) return '';
  const score = d.score as number;
  const prev = d.prevScore as number | undefined;
  const chg = prev != null ? score - prev : 0;
  return `F&G=${Math.round(score)}${chg > 0 ? ` (+${Math.round(chg)})` : chg < 0 ? ` (${Math.round(chg)})` : ''}`;
}

function summariseFed(data: unknown): string {
  const d = data as Record<string, unknown> | null;
  if (!d) return '';
  const meetings = d.meetings as Array<Record<string, unknown>> | undefined;
  const cur = d.currentRateMid;
  if (!meetings?.length) return `FedRate=${cur}%`;
  const next = meetings[0];
  return `FedRate=${cur}%,next ${next.label as string}:hold${Math.round((next.probHold as number) ?? 0)}%/cut${Math.round((next.probCut25 as number) ?? 0)}%`;
}

function summariseMacro(data: unknown): string {
  const d = data as Record<string, unknown> | null;
  if (!d) return '';
  const inds = (d.indicators as Array<Record<string, unknown>>) ?? [];
  const notable = inds
    .filter(i => i.actual != null && (i.surprise === 'beat' || i.surprise === 'miss'))
    .slice(0, 3)
    .map(i => `${i.nameKo ?? i.id}=${i.actual}${i.unit ?? ''}(${i.surprise})`);
  const yc = d.yieldCurve as Record<string, unknown> | undefined;
  const spread = yc?.spread10y2y as number | undefined;
  const parts: string[] = [];
  if (notable.length) parts.push(notable.join(','));
  if (spread != null) parts.push(`10y2y=${spread.toFixed(0)}bp${yc?.inverted ? '(inv)' : ''}`);
  return parts.join(' | ');
}

function summariseCredit(data: unknown): string {
  const d = data as Record<string, unknown> | null;
  if (!d) return '';
  const latest = d.latestMonth as Record<string, unknown> | undefined;
  if (!latest) return '';
  const m = latest.margin as number | undefined;
  const fc = latest.freeCredit as number | undefined;
  const mom = latest.marginMoM as number | undefined;
  return `margin=$${m?.toFixed(0)}B${mom != null ? `(MoM ${mom > 0 ? '+' : ''}${mom.toFixed(1)}%)` : ''},freeCredit=$${fc?.toFixed(0)}B`;
}

function summariseCascade(articles: unknown[]): string {
  const arr = articles as Array<Record<string, unknown>>;
  if (!arr?.length) return '';
  return arr.slice(0, 3).map(a => {
    const title = (a.title as string ?? '').slice(0, 40);
    const sent = a.sentiment as string;
    return `${sent === 'bullish' ? '↑' : sent === 'bearish' ? '↓' : '·'}${title}`;
  }).join(' | ');
}

function summariseSignals(signals: InstitutionalSignal[]): { buys: string; cuts: string } {
  const buys = signals
    .filter(s => s.action === 'accumulating' || s.action === 'new_position')
    .slice(0, 4)
    .map(s => `${s.institution.slice(0, 14)}→${s.ticker}(${s.estimatedValue})`)
    .join(', ');
  const cuts = signals
    .filter(s => s.action === 'reducing' || s.action === 'exit')
    .slice(0, 3)
    .map(s => `${s.institution.slice(0, 14)}↓${s.ticker}(${s.estimatedValue})`)
    .join(', ');
  return { buys, cuts };
}

function summariseNewsGap(): { stakes: string; gaps: string } {
  const stakes = newsGapData
    .flatMap(n => n.ownershipData.filter(o => o.action === 'new' || o.action === 'increased').map(o => ({ ticker: n.ticker, ...o })))
    .sort((a, b) => b.valueM - a.valueM)
    .slice(0, 3)
    .map(s => {
      const chg = s.prevPct !== undefined ? `${s.prevPct.toFixed(1)}→${s.pctOfShares.toFixed(1)}%` : `신규${s.pctOfShares.toFixed(1)}%`;
      return `${s.ticker}:${s.institution.slice(0, 12)}(${chg},$${s.valueM}M)`;
    })
    .join(', ');
  const gaps = [...newsGapData]
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, 3)
    .map(n => `${n.ticker}(갭${n.gapScore})`)
    .join(', ');
  return { stakes, gaps };
}

function summariseSupply(): string {
  return Object.entries(companySupplyChainUpdates)
    .flatMap(([tk, ups]) => ups.filter(u => u.impact === 'high').slice(0, 1).map(u => `${tk}:${u.type}`))
    .slice(0, 3)
    .join(', ');
}

// ── Build rich prompt covering every tab ─────────────────────────────────────
export function buildPrompt(tf: Timeframe, ctx?: TabContext): string {
  const tfLabel = tf === '1w' ? '1주' : tf === '4w' ? '4주' : '13주';
  const signals = ctx?.signals ?? institutionalSignals;
  const { buys, cuts } = summariseSignals(signals);
  const { stakes, gaps } = summariseNewsGap();
  const supply = summariseSupply();
  const heatmap = ctx ? summariseHeatmap(ctx.heatmap) : '';
  const short = ctx ? summariseShort(ctx.short) : '';
  const capital = ctx ? summariseCapital(ctx.capital, tf) : '';
  const fg = ctx ? summariseFearGreed(ctx.fearGreed) : '';
  const fed = ctx ? summariseFed(ctx.fedWatch) : '';
  const macro = ctx ? summariseMacro(ctx.macro) : '';
  const credit = ctx ? summariseCredit(ctx.credit) : '';
  const cascade = ctx ? summariseCascade(ctx.cascade) : '';

  return `Flowvium ${tfLabel} 리포트용 실시간 탭 데이터입니다. 각 탭을 종합해 한국어 JSON만 반환하세요.

[Heatmap] ${heatmap || 'n/a'}
[CapitalFlows] ${capital || 'n/a'}
[Fear&Greed] ${fg || 'n/a'}
[FedWatch] ${fed || 'n/a'}
[Macro] ${macro || 'n/a'}
[Credit] ${credit || 'n/a'}
[Cascade] ${cascade || 'n/a'}
[Signals-Buys] ${buys || 'n/a'}
[Signals-Cuts] ${cuts || 'n/a'}
[NewsGap-Stakes] ${stakes || 'n/a'}
[NewsGap-Top] ${gaps || 'n/a'}
[Supply] ${supply || 'n/a'}

출력 규칙: JSON만, 마크다운 금지, bullets는 각 25자 이내의 구체 수치 포함 문장.
섹션 매핑:
- market: Heatmap+CapitalFlows+Fear&Greed+FedWatch에서 시장 전반 요약
- capital: CapitalFlows countries+Macro+Credit에서 자금 이동·거시 신호
- company: Signals-Buys/Cuts+Screener(squeeze)+NewsGap-Top에서 주목 종목
- signals: NewsGap-Stakes+Cascade+Supply에서 강한 구조 신호
- outlook: 위 전체를 종합한 한 줄 전망(리스크 포함)
- riskLevel: low|medium|high (Fear&Greed·yieldCurve 기반)

{"market":{"title":"시장","bullets":["","",""]},"capital":{"title":"자금","bullets":["","",""]},"company":{"title":"종목","bullets":["","",""]},"signals":{"title":"신호","bullets":["","",""]},"outlook":"","riskLevel":"medium"}`;
}

// ── Parse AI response ─────────────────────────────────────────────────────────
export function parseAIResponse(raw: string, tf: Timeframe, source = 'AI'): DailyBrief | null {
  try {
    let text = raw.replace(/```(?:json)?/g, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    text = text.slice(start, end + 1);
    const parsed = JSON.parse(text);

    if (!parsed.market || !parsed.capital || !parsed.company || !parsed.signals) return null;

    const ensureSection = (s: unknown): BriefSection => {
      const sec = s as Record<string, unknown>;
      return {
        title: String(sec?.title ?? ''),
        content: String(sec?.content ?? sec?.title ?? ''),
        bullets: Array.isArray(sec?.bullets) ? sec.bullets.map(String) : [],
      };
    };

    return {
      market: ensureSection(parsed.market),
      capital: ensureSection(parsed.capital),
      company: ensureSection(parsed.company),
      signals: ensureSection(parsed.signals),
      outlook: parsed.outlook ?? '',
      riskLevel: (['low','medium','high'].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : parsed.riskLevel === '높음' || parsed.riskLevel === '상' ? 'high'
        : parsed.riskLevel === '낮음' || parsed.riskLevel === '하' ? 'low'
        : 'medium') as 'low' | 'medium' | 'high',
      generatedAt: new Date().toISOString(),
      tf,
      source,
    };
  } catch {
    return null;
  }
}

/** Data-driven brief — used when AI is unavailable. Now pulls every tab. */
export function fallbackBrief(tf: Timeframe, ctx?: TabContext): DailyBrief {
  const tfLabel = tf === '1w' ? '1주' : tf === '4w' ? '4주' : '13주';
  const retKey = tf === '1w' ? 'ret1w' : tf === '4w' ? 'ret4w' : 'ret13w';
  const capital = ctx?.capital as Record<string, unknown> | null | undefined;
  const macro = ctx?.macro as Record<string, unknown> | null | undefined;
  const signals = ctx?.signals ?? institutionalSignals;

  // ── Market: heatmap + assets + fg + fed ──────────────────────────────────
  const marketBullets: string[] = [];
  try {
    const hm = ctx?.heatmap as Record<string, unknown> | null | undefined;
    const sectors = (hm?.sectors as Array<Record<string, unknown>>) ?? [];
    if (sectors.length > 0) {
      const sorted = [...sectors]
        .filter(s => s.avgChangePct != null)
        .sort((a, b) => (b.avgChangePct as number) - (a.avgChangePct as number));
      const top = sorted.slice(0, 2).map(s => `${s.sector} +${(s.avgChangePct as number).toFixed(1)}%`);
      const bot = sorted.slice(-1).map(s => `${s.sector} ${(s.avgChangePct as number).toFixed(1)}%`);
      if (top.length) marketBullets.push(`섹터 상승: ${top.join(', ')}`);
      if (bot.length) marketBullets.push(`섹터 하락: ${bot.join(', ')}`);
    }
    const assets = (capital?.assets as Array<Record<string, unknown>>) ?? [];
    if (assets.length > 0) {
      const sorted = [...assets].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
      marketBullets.push(`자산 상위: ${sorted.slice(0, 3).map(a => `${a.ticker} +${((a[retKey] as number) ?? 0).toFixed(1)}%`).join(', ')}`);
    }
    const fg = ctx?.fearGreed as Record<string, unknown> | null | undefined;
    if (fg?.score != null) {
      const val = fg.score as number;
      const label = val >= 75 ? '극도 탐욕' : val >= 55 ? '탐욕' : val >= 45 ? '중립' : val >= 25 ? '공포' : '극도 공포';
      marketBullets.push(`공포탐욕: ${Math.round(val)} (${label})`);
    }
    const fed = ctx?.fedWatch as Record<string, unknown> | null | undefined;
    const meetings = fed?.meetings as Array<Record<string, unknown>> | undefined;
    if (meetings?.length) {
      const next = meetings[0];
      marketBullets.push(`FOMC ${next.label as string}: 인하 ${Math.round((next.probCut25 as number) ?? 0)}%`);
    }
  } catch { /* ignore */ }
  if (marketBullets.length === 0) marketBullets.push(`${tfLabel} 시장 데이터 집계 중`);

  // ── Capital: countries + yield + credit ──────────────────────────────────
  const capitalBullets: string[] = [];
  try {
    const cf = capital?.countryFlow as Record<string, unknown> | undefined;
    const countries = (cf?.countries as Array<Record<string, unknown>>) ?? [];
    if (countries.length > 0) {
      const sorted = [...countries].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
      capitalBullets.push(`유입: ${sorted.slice(0, 3).map(c => `${c.country}(+${((c[retKey] as number) ?? 0).toFixed(1)}%)`).join(', ')}`);
      capitalBullets.push(`유출: ${sorted.slice(-2).reverse().map(c => `${c.country}(${((c[retKey] as number) ?? 0).toFixed(1)}%)`).join(', ')}`);
    }
    const yc = macro?.yieldCurve as Record<string, unknown> | undefined;
    if (yc?.spread10y2y != null) {
      const spread = yc.spread10y2y as number;
      capitalBullets.push(`10Y-2Y 스프레드: ${spread.toFixed(0)}bp${yc.inverted ? ' ⚠️ 역전' : ''}`);
    }
    const credit = ctx?.credit as Record<string, unknown> | null | undefined;
    const latest = credit?.latestMonth as Record<string, unknown> | undefined;
    if (latest) {
      const m = latest.margin as number | undefined;
      const mom = latest.marginMoM as number | undefined;
      if (m != null) capitalBullets.push(`NYSE 마진: $${m.toFixed(0)}B${mom != null ? ` (MoM ${mom > 0 ? '+' : ''}${mom.toFixed(1)}%)` : ''}`);
    }
  } catch { /* ignore */ }
  if (capitalBullets.length === 0) capitalBullets.push(`${tfLabel} 자금 흐름 집계 중`);

  // ── Company: signals + squeeze + newsgap ─────────────────────────────────
  const companyBullets: string[] = [];
  try {
    const top = signals
      .filter(s => s.action === 'accumulating' || s.action === 'new_position')
      .slice(0, 3)
      .map(s => `${s.institution} → ${s.ticker} (${s.estimatedValue})`);
    if (top.length > 0) companyBullets.push(...top);

    const shortArr = Array.isArray(ctx?.short) ? ctx!.short as Array<Record<string, unknown>>
      : (ctx?.short as { entries?: Array<Record<string, unknown>> } | null)?.entries ?? [];
    const squeeze = shortArr
      .filter(s => (s.squeezeScore as number) >= 30)
      .slice(0, 2)
      .map(s => `${s.ticker} 스퀴즈 ${s.squeezeScore}점 (short ${(s.shortFloatPct as number) ?? '-'}%)`);
    if (squeeze.length) companyBullets.push(...squeeze);

    const topGap = [...newsGapData]
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 1)
      .map(n => `${n.ticker} 뉴스갭 ${n.gapScore}점 — 침묵 매집 신호`);
    if (topGap.length > 0) companyBullets.push(...topGap);
  } catch { /* ignore */ }
  if (companyBullets.length === 0) companyBullets.push(`13F 매집 ${signals.length}건 분석 중`);

  // ── Signals: stakes + cascade + supply ───────────────────────────────────
  const signalBullets: string[] = [];
  try {
    const stakeChanges = newsGapData
      .flatMap(n => n.ownershipData.filter(o => o.action === 'new' || o.action === 'increased').map(o => ({ ticker: n.ticker, ...o })))
      .sort((a, b) => b.valueM - a.valueM)
      .slice(0, 2)
      .map(s => {
        const pct = s.pctOfShares;
        const change = s.prevPct !== undefined ? `${s.prevPct.toFixed(1)}%→${pct.toFixed(1)}%` : `신규 ${pct.toFixed(1)}%`;
        return `${s.ticker}: ${s.institution} ${change} ($${s.valueM}M)`;
      });
    if (stakeChanges.length > 0) signalBullets.push(...stakeChanges);

    const arr = ctx?.cascade as Array<Record<string, unknown>> | undefined;
    if (arr?.length) {
      const top = arr[0];
      const sent = top.sentiment as string;
      signalBullets.push(`Cascade: ${sent === 'bullish' ? '호재' : sent === 'bearish' ? '악재' : '뉴스'} — ${(top.title as string).slice(0, 40)}`);
    }

    const supply = Object.entries(companySupplyChainUpdates)
      .flatMap(([tk, ups]) => ups.filter(u => u.impact === 'high').slice(0, 1).map(u => `${tk}: ${u.type}`))
      .slice(0, 1);
    if (supply.length) signalBullets.push(`Supply: ${supply.join(', ')}`);
  } catch { /* ignore */ }
  if (signalBullets.length === 0) signalBullets.push(`13F 지분 변동 분석 중`);

  // ── Risk ─────────────────────────────────────────────────────────────────
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  try {
    const fg = ctx?.fearGreed as Record<string, unknown> | null | undefined;
    const val = fg?.score as number | undefined;
    const yc = macro?.yieldCurve as Record<string, unknown> | undefined;
    const inverted = yc?.inverted as boolean | undefined;
    if (val != null) {
      if (val < 30 || inverted) riskLevel = 'high';
      else if (val > 70) riskLevel = 'low';
    }
  } catch { /* ignore */ }

  return {
    market: { title: '글로벌 시장', content: `${tfLabel} 시장 종합`, bullets: marketBullets },
    capital: { title: '자금 흐름 & 거시', content: `${tfLabel} 자금·거시`, bullets: capitalBullets },
    company: { title: '주목 종목', content: `${tfLabel} 매집·스퀴즈`, bullets: companyBullets },
    signals: { title: '구조 신호', content: `${tfLabel} 지분·Cascade·Supply`, bullets: signalBullets },
    outlook: `${tfLabel} 전 탭(Heatmap·CapitalFlows·Signals·NewsGap·Short·Macro·Cascade) 종합. 리스크 ${riskLevel === 'high' ? '높음(공포·역전)' : riskLevel === 'low' ? '낮음(탐욕 과열)' : '중립'}.`,
    riskLevel,
    generatedAt: new Date().toISOString(),
    tf,
    source: 'data',
  };
}
