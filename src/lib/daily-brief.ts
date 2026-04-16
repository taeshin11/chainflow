import { Redis } from '@upstash/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { institutionalSignals } from '@/data/institutional-signals';
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
  return `flowvium:daily-brief:v3:${kstDateStr()}:${tf}`;
}

// ── AI call ───────────────────────────────────────────────────────────────────
export async function callAI(prompt: string): Promise<string> {
  const vllmUrl = process.env.VLLM_URL?.trim();
  if (vllmUrl) {
    try {
      const res = await fetch(`${vllmUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct',
          messages: [
            {
              role: 'system',
              content: '당신은 FlowVium AI입니다. 글로벌 자금흐름, 공급망, 기관투자, 거시경제 전문 애널리스트입니다. JSON으로만 응답하세요.',
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 2200,
          temperature: 0.65,
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? '';
        if (text) return text;
      }
    } catch { /* fallback */ }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Build prompt from ALL FlowVium data ───────────────────────────────────────
export function buildPrompt(tf: Timeframe, capitalData: unknown, macroData: unknown): string {
  const tfLabel = tf === '1w' ? '최근 1주' : tf === '4w' ? '최근 4주' : '최근 13주';
  const retKey = tf === '1w' ? 'ret1w' : tf === '4w' ? 'ret4w' : 'ret13w';

  let topGainers = '', topLosers = '', gvdInfo = '', fearGreedInfo = '';
  try {
    const cd = capitalData as Record<string, unknown>;
    const assets = (cd?.assets as Array<Record<string, unknown>>) ?? [];
    const sorted = [...assets].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
    topGainers = sorted.slice(0, 5).map(a => `${a.ticker}(+${((a[retKey] as number) ?? 0).toFixed(1)}%)`).join(', ');
    topLosers = sorted.slice(-4).reverse().map(a => `${a.ticker}(${((a[retKey] as number) ?? 0).toFixed(1)}%)`).join(', ');
    const gvd = cd?.goldVsDollar as Record<string, unknown>;
    if (gvd) {
      const g = (tf === '1w' ? gvd.goldRet1w : tf === '4w' ? gvd.goldRet4w : gvd.goldRet13w) as number;
      const d = (tf === '1w' ? gvd.dollarRet1w : tf === '4w' ? gvd.dollarRet4w : gvd.dollarRet13w) as number;
      const sig = (tf === '1w' ? gvd.signal1w : tf === '4w' ? gvd.signal4w : gvd.signal13w) as string;
      gvdInfo = `금 ${g?.toFixed(1)}% / 달러 ${d?.toFixed(1)}% / 신호: ${sig}`;
    }
    const fg = cd?.fearGreed as Record<string, unknown>;
    if (fg) fearGreedInfo = `공포탐욕지수: ${fg.value} (${fg.label})`;
  } catch { /* ignore */ }

  let countryInfo = '';
  try {
    const cd = capitalData as Record<string, unknown>;
    const cf = cd?.countryFlow as Record<string, unknown> | undefined;
    const countries = (cf?.countries as Array<Record<string, unknown>>) ?? [];
    const sortedC = [...countries].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
    countryInfo = `유입: ${sortedC.slice(0, 3).map(c => `${c.country}(${((c[retKey] as number) ?? 0).toFixed(1)}%)`).join(', ')} | 유출: ${sortedC.slice(-2).reverse().map(c => `${c.country}(${((c[retKey] as number) ?? 0).toFixed(1)}%)`).join(', ')}`;
  } catch { /* ignore */ }

  let macroInfo = '', yieldInfo = '';
  try {
    const md = macroData as Record<string, unknown>;
    const indicators = (md?.indicators as Array<Record<string, unknown>>) ?? [];
    macroInfo = indicators.slice(0, 6).map(i => `${i.name}=${i.actual}(예상${i.forecast},${i.surprise})`).join(' | ');
    const yc = md?.yieldCurve as Record<string, unknown>;
    if (yc) yieldInfo = `10Y-2Y스프레드: ${(yc.spread10y2y as number)?.toFixed(0)}bp${(yc.inverted as boolean) ? ' [역전!]' : ''}`;
  } catch { /* ignore */ }

  // ── 기관 시그널 (매집/신규) ────────────────────────────────────────────────
  const recentSignals = institutionalSignals
    .filter(s => s.action === 'accumulating' || s.action === 'new_position')
    .slice(0, 10)
    .map(s => `${s.institution}→${s.ticker}(${s.action},${s.estimatedValue},파일링:${s.filingDate})`)
    .join(' | ');

  const reducingSignals = institutionalSignals
    .filter(s => s.action === 'reducing' || s.action === 'exit')
    .slice(0, 5)
    .map(s => `${s.institution}→${s.ticker}(${s.action},${s.estimatedValue})`)
    .join(' | ');

  // ── 지분율 변화 (ownershipData에서 신규/증가 포착) ─────────────────────────
  const stakeChanges = newsGapData
    .flatMap(n => n.ownershipData
      .filter(o => o.action === 'new' || o.action === 'increased')
      .map(o => ({
        ticker: n.ticker,
        institution: o.institution,
        pct: o.pctOfShares,
        prevPct: o.prevPct,
        action: o.action,
        valueM: o.valueM,
        quarter: o.quarter,
      }))
    )
    .sort((a, b) => b.valueM - a.valueM)
    .slice(0, 8)
    .map(s => {
      const change = s.prevPct !== undefined ? ` (${s.prevPct.toFixed(2)}%→${s.pct.toFixed(2)}%)` : ` (신규 ${s.pct.toFixed(2)}%)`;
      return `${s.ticker}:${s.institution}${change},$${s.valueM}M,${s.quarter}`;
    })
    .join(' | ');

  // ── 뉴스갭 상위 종목 ───────────────────────────────────────────────────────
  const topGapStocks = [...newsGapData]
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, 6)
    .map(n => {
      const co = allCompanies.find(c => c.ticker === n.ticker);
      const macro = co?.macroImpact?.summary ?? '';
      return `${n.ticker}(갭${n.gapScore},IB:${n.ibActivityScore})${macro ? ` — ${macro.slice(0, 60)}` : ''}`;
    })
    .join('\n  ');

  // ── 기업별 공급망 이슈 ─────────────────────────────────────────────────────
  const recentSupplyChain = Object.entries(companySupplyChainUpdates)
    .flatMap(([ticker, updates]) =>
      updates
        .filter(u => u.impact === 'high')
        .slice(0, 1)
        .map(u => `${ticker}: [${u.type}] ${u.title} (${u.date})`)
    )
    .slice(0, 6)
    .join('\n  ');

  // ── 주요 기업 섹터별 현황 요약 ────────────────────────────────────────────
  const sectorSummary = ['semiconductors', 'ai-cloud', 'defense', 'ev-battery', 'pharma-biotech']
    .map(sector => {
      const cos = allCompanies.filter(c => c.sector === sector).slice(0, 3);
      return `[${sector}] ${cos.map(c => `${c.ticker}(${c.revenue.total})`).join(', ')}`;
    })
    .join(' | ');

  return `FlowVium 전체 데이터 기반 ${tfLabel} 시장 브리핑을 작성하세요.

=== 자산 수익률 ===
상승: ${topGainers}
하락: ${topLosers}

=== 자금흐름 지표 ===
금/달러: ${gvdInfo}
${fearGreedInfo}
국가자금흐름: ${countryInfo}

=== 거시경제 ===
${macroInfo}
${yieldInfo}

=== 기관 매집/매도 (13F) ===
매집: ${recentSignals}
매도: ${reducingSignals}

=== 지분율 변화 (13F 최신) ===
${stakeChanges}

=== 뉴스갭 주목 종목 ===
${topGapStocks}

=== 공급망 이슈 (HIGH/CRITICAL) ===
${recentSupplyChain}

=== 섹터별 주요 기업 ===
${sectorSummary}

위 전체 데이터를 종합하여 아래 JSON 형식으로만 응답 (다른 텍스트 없이):
{
  "market": {
    "title": "글로벌 시장 동향",
    "content": "거시지표·자산수익률·공포탐욕 기반 시장 전반 2-3문장",
    "bullets": ["포인트1", "포인트2", "포인트3"]
  },
  "capital": {
    "title": "자금 흐름",
    "content": "국가 로테이션·금/달러·수익률곡선 기반 자금흐름 2-3문장",
    "bullets": ["포인트1", "포인트2", "포인트3"]
  },
  "company": {
    "title": "주목 종목 & 섹터",
    "content": "뉴스갭+공급망이슈+기업 매출 데이터 기반 주목 기업 2-3문장 (구체적 티커 언급)",
    "bullets": ["포인트1 (티커포함)", "포인트2", "포인트3"]
  },
  "signals": {
    "title": "기관 지분율 변화",
    "content": "13F 기관 매집·지분율 변화 핵심 2문장 (구체적 기관명·종목·지분율 언급)",
    "bullets": ["포인트1 (기관명·종목·지분율포함)", "포인트2", "포인트3"]
  },
  "outlook": "투자 전망 한 문장 요약 (리스크 요인 포함)",
  "riskLevel": "low 또는 medium 또는 high"
}`;
}

// ── Parse AI response ─────────────────────────────────────────────────────────
export function parseAIResponse(raw: string, tf: Timeframe): DailyBrief | null {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
    const parsed = JSON.parse((jsonMatch[1] ?? raw).trim());
    return {
      market: parsed.market,
      capital: parsed.capital,
      company: parsed.company,
      signals: parsed.signals,
      outlook: parsed.outlook ?? '',
      riskLevel: parsed.riskLevel ?? 'medium',
      generatedAt: new Date().toISOString(),
      tf,
    };
  } catch {
    return null;
  }
}

/** Data-driven brief — used when AI is unavailable, still shows real numbers */
export function fallbackBrief(tf: Timeframe, capitalData?: unknown, macroData?: unknown): DailyBrief {
  const tfLabel = tf === '1w' ? '1주' : tf === '4w' ? '4주' : '13주';
  const retKey = tf === '1w' ? 'ret1w' : tf === '4w' ? 'ret4w' : 'ret13w';

  // ── Market section from capital data ──────────────────────────────────────
  let marketTitle = '글로벌 시장 동향';
  let marketContent = `${tfLabel} 주요 자산 수익률 요약`;
  const marketBullets: string[] = [];

  try {
    const cd = capitalData as Record<string, unknown>;
    const assets = (cd?.assets as Array<Record<string, unknown>>) ?? [];
    if (assets.length > 0) {
      const sorted = [...assets].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
      const top3 = sorted.slice(0, 3).map(a => `${a.ticker} +${((a[retKey] as number) ?? 0).toFixed(1)}%`);
      const bot3 = sorted.slice(-3).reverse().map(a => `${a.ticker} ${((a[retKey] as number) ?? 0).toFixed(1)}%`);
      marketBullets.push(`상승 자산: ${top3.join(', ')}`);
      marketBullets.push(`하락 자산: ${bot3.join(', ')}`);
    }
    const fg = cd?.fearGreed as Record<string, unknown>;
    if (fg?.value) {
      const val = fg.value as number;
      const label = val >= 75 ? '극도 탐욕' : val >= 55 ? '탐욕' : val >= 45 ? '중립' : val >= 25 ? '공포' : '극도 공포';
      marketBullets.push(`공포탐욕지수: ${val} (${label})`);
    }
    const gvd = cd?.goldVsDollar as Record<string, unknown>;
    if (gvd) {
      const g = (tf === '1w' ? gvd.goldRet1w : tf === '4w' ? gvd.goldRet4w : gvd.goldRet13w) as number;
      const d = (tf === '1w' ? gvd.dollarRet1w : tf === '4w' ? gvd.dollarRet4w : gvd.dollarRet13w) as number;
      if (g != null && d != null) marketBullets.push(`금 ${g.toFixed(1)}% / 달러지수 ${d.toFixed(1)}%`);
    }
  } catch { /* ignore */ }

  if (marketBullets.length === 0) marketBullets.push(`${tfLabel} 시장 데이터를 불러오는 중입니다`);

  // ── Capital section ────────────────────────────────────────────────────────
  let capitalTitle = '자금 흐름';
  let capitalContent = `${tfLabel} 국가별 자금 이동 현황`;
  const capitalBullets: string[] = [];

  try {
    const cd = capitalData as Record<string, unknown>;
    const cf = cd?.countryFlow as Record<string, unknown>;
    const countries = (cf?.countries as Array<Record<string, unknown>>) ?? [];
    if (countries.length > 0) {
      const sorted = [...countries].sort((a, b) => ((b[retKey] as number) ?? 0) - ((a[retKey] as number) ?? 0));
      const inflow = sorted.slice(0, 3).map(c => `${c.country}(+${((c[retKey] as number) ?? 0).toFixed(1)}%)`);
      const outflow = sorted.slice(-2).reverse().map(c => `${c.country}(${((c[retKey] as number) ?? 0).toFixed(1)}%)`);
      capitalBullets.push(`자금 유입: ${inflow.join(', ')}`);
      capitalBullets.push(`자금 유출: ${outflow.join(', ')}`);
    }
    const md = macroData as Record<string, unknown>;
    const yc = md?.yieldCurve as Record<string, unknown>;
    if (yc?.spread10y2y != null) {
      const spread = yc.spread10y2y as number;
      capitalBullets.push(`미국채 10Y-2Y 스프레드: ${spread.toFixed(0)}bp${(yc.inverted as boolean) ? ' ⚠️ 역전 중' : ''}`);
    }
  } catch { /* ignore */ }

  if (capitalBullets.length === 0) capitalBullets.push(`${tfLabel} 자금 흐름 데이터를 집계 중입니다`);

  // ── Company section from institutional signals ─────────────────────────────
  const companyBullets: string[] = [];
  try {
    const top = institutionalSignals
      .filter(s => s.action === 'accumulating' || s.action === 'new_position')
      .slice(0, 3)
      .map(s => `${s.institution} → ${s.ticker} (${s.estimatedValue})`);
    if (top.length > 0) companyBullets.push(...top);

    const topGap = [...newsGapData]
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, 2)
      .map(n => `${n.ticker} 뉴스갭 ${n.gapScore}점 — 기관 침묵 매집 신호`);
    if (topGap.length > 0) companyBullets.push(...topGap);
  } catch { /* ignore */ }

  if (companyBullets.length === 0) companyBullets.push(`기관 매집 데이터 ${institutionalSignals.length}건 분석 중`);

  // ── Signals section ────────────────────────────────────────────────────────
  const signalBullets: string[] = [];
  try {
    const stakeChanges = newsGapData
      .flatMap(n => n.ownershipData.filter(o => o.action === 'new' || o.action === 'increased').map(o => ({ ticker: n.ticker, ...o })))
      .sort((a, b) => b.valueM - a.valueM)
      .slice(0, 3)
      .map(s => {
        const pct = s.pctOfShares;
        const change = s.prevPct !== undefined ? `${s.prevPct.toFixed(1)}%→${pct.toFixed(1)}%` : `신규 ${pct.toFixed(1)}%`;
        return `${s.ticker}: ${s.institution} ${change} ($${s.valueM}M, ${s.quarter})`;
      });
    if (stakeChanges.length > 0) signalBullets.push(...stakeChanges);
  } catch { /* ignore */ }

  if (signalBullets.length === 0) signalBullets.push(`13F 기관 보유 데이터 분석 중`);

  // ── Macro for risk level ───────────────────────────────────────────────────
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  try {
    const cd = capitalData as Record<string, unknown>;
    const fg = cd?.fearGreed as Record<string, unknown>;
    const val = fg?.value as number;
    if (val != null) riskLevel = val < 30 ? 'high' : val > 70 ? 'low' : 'medium';
  } catch { /* ignore */ }

  return {
    market: { title: marketTitle, content: marketContent, bullets: marketBullets },
    capital: { title: capitalTitle, content: capitalContent, bullets: capitalBullets },
    company: { title: '주목 종목 & 기관 매집', content: `${tfLabel} 기관 매집 상위 종목`, bullets: companyBullets },
    signals: { title: '기관 지분율 변화 (13F)', content: `${tfLabel} 주요 지분율 변동`, bullets: signalBullets },
    outlook: `${tfLabel} 기관 매집·자금흐름 데이터 기반 요약입니다. 공포탐욕지수 ${riskLevel === 'high' ? '공포 구간 — 리스크 관리 필요' : riskLevel === 'low' ? '탐욕 구간 — 과열 주의' : '중립 구간 — 방향성 탐색 중'}.`,
    riskLevel,
    generatedAt: new Date().toISOString(),
    tf,
  };
}
