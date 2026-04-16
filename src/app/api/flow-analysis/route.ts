/**
 * /api/flow-analysis
 *
 * EXAONE(우선) → Gemini(fallback) 로 국가별 자금흐름의 원인을 분석
 * 각 국가의 수익률 데이터를 받아 "왜 이렇게 움직였는가"를 설명
 *
 * Cache: 4h Redis
 */
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { GoogleGenerativeAI } from '@google/generative-ai';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function cacheKey(tf: string): string {
  const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
  return `flowvium:flow-analysis:v2:${tf}:${hour}`;
}

// ── EXAONE 우선 AI 호출 ──────────────────────────────────────────────────────
async function callAI(prompt: string): Promise<string> {
  // 1순위: vLLM (EXAONE)
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
              content: `당신은 글로벌 자금흐름 전문 애널리스트입니다.
각 국가별 시장 수익률 데이터를 보고, 그 흐름의 근본적인 원인을 분석하세요.
원인 분석은 구체적이고 실질적이어야 합니다 (예: "관세 완화 기대", "반도체 수주 증가", "연준 인하 기대").
반드시 JSON 형식으로만 응답하세요.`,
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1400,
          temperature: 0.55,
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? '';
        if (text.length > 50) return text;
      }
    } catch { /* fallback to Gemini */ }
  }

  // 2순위: Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch { return ''; }
}

// ── 프롬프트 빌더 ─────────────────────────────────────────────────────────────
function buildPrompt(
  tf: string,
  countries: Array<{ country: string; ticker: string; ret: number }>,
  rotations: Array<{ from: string; to: string; diff: number }>,
  topAssets: Array<{ name: string; ticker: string; ret: number }>,
  gvd: { goldRet: number; dollarRet: number; signal: string },
) {
  const tfLabel = tf === '1w' ? '1주' : tf === '4w' ? '4주' : '13주';
  const cList = countries.map(c => `${c.country}(${c.ticker}): ${c.ret >= 0 ? '+' : ''}${c.ret.toFixed(1)}%`).join(', ');
  const rList = rotations.slice(0, 5).map(r => `${r.from}→${r.to}(+${r.diff.toFixed(1)}%p)`).join(', ');
  const aList = topAssets.slice(0, 8).map(a => `${a.ticker}: ${a.ret >= 0 ? '+' : ''}${a.ret.toFixed(1)}%`).join(', ');

  return `${tfLabel} 기간 글로벌 자금흐름 원인 분석

=== 국가별 ETF 수익률 ===
${cList}

=== 주요 국가간 로테이션 ===
${rList}

=== 주요 자산 수익률 ===
${aList}

=== 금/달러 ===
금: ${gvd.goldRet >= 0 ? '+' : ''}${gvd.goldRet.toFixed(1)}%, 달러: ${gvd.dollarRet >= 0 ? '+' : ''}${gvd.dollarRet.toFixed(1)}%, 신호: ${gvd.signal}

각 국가/자산의 흐름 원인을 분석하세요. 아래 JSON 형식으로만 응답하세요:
{
  "summary": "전체 자금흐름 핵심 요약 (2-3문장)",
  "mainTheme": "현재 시장을 지배하는 핵심 테마 1가지 (10단어 이내)",
  "countries": [
    {
      "country": "국가명",
      "ret": "+X.X%",
      "direction": "inflow 또는 outflow",
      "causes": ["원인1 (구체적)", "원인2"],
      "risk": "단기 리스크 1가지"
    }
  ],
  "rotations": [
    {
      "from": "출발국가",
      "to": "도착국가",
      "reason": "이 로테이션의 핵심 원인 (1문장)"
    }
  ],
  "keyWatchpoints": ["주목해야 할 포인트 1", "포인트 2", "포인트 3"]
}`;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tf = searchParams.get('tf') ?? '4w';

  const redis = createRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey(tf));
      if (cached) return NextResponse.json({ ...(cached as object), cached: true });
    } catch { /* non-fatal */ }
  }

  // Fetch capital flows data
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  let capitalData: Record<string, unknown> | null = null;
  try {
    const res = await fetch(`${baseUrl}/api/capital-flows`, { signal: AbortSignal.timeout(20000) });
    if (res.ok) capitalData = await res.json();
  } catch { /* proceed with empty */ }

  if (!capitalData) {
    return NextResponse.json({ error: 'capital-flows data unavailable' }, { status: 503 });
  }

  const retKey = tf === '1w' ? 'ret1w' : tf === '4w' ? 'ret4w' : 'ret13w';

  // Extract country returns
  const countryFlow = capitalData.countryFlow as Record<string, unknown> | undefined;
  const rawCountries = (countryFlow?.countries as Array<Record<string, unknown>>) ?? [];
  const countries = rawCountries.map(c => ({
    country: c.country as string,
    ticker: c.ticker as string,
    ret: (c[retKey] as number) ?? 0,
  })).sort((a, b) => b.ret - a.ret);

  // Extract rotations
  const rotKey = tf === '1w' ? 'rotations1w' : tf === '4w' ? 'rotations4w' : 'rotations13w';
  const rotations = ((countryFlow?.[rotKey] as Array<Record<string, unknown>>) ?? []).map(r => ({
    from: r.from as string,
    to: r.to as string,
    diff: (r.diff as number) ?? 0,
  }));

  // Extract top assets
  const assets = (capitalData.assets as Array<Record<string, unknown>>) ?? [];
  const topAssets = [...assets]
    .sort((a, b) => Math.abs((b[retKey] as number) ?? 0) - Math.abs((a[retKey] as number) ?? 0))
    .slice(0, 8)
    .map(a => ({ name: a.name as string, ticker: a.ticker as string, ret: (a[retKey] as number) ?? 0 }));

  // Gold vs dollar
  const gvd = capitalData.goldVsDollar as Record<string, unknown> | undefined;
  const goldRet = (tf === '1w' ? gvd?.goldRet1w : tf === '4w' ? gvd?.goldRet4w : gvd?.goldRet13w) as number ?? 0;
  const dollarRet = (tf === '1w' ? gvd?.dollarRet1w : tf === '4w' ? gvd?.dollarRet4w : gvd?.dollarRet13w) as number ?? 0;
  const signal = (tf === '1w' ? gvd?.signal1w : tf === '4w' ? gvd?.signal4w : gvd?.signal13w) as string ?? '';

  const prompt = buildPrompt(tf, countries, rotations, topAssets, { goldRet, dollarRet, signal });
  const raw = await callAI(prompt);

  let analysis: Record<string, unknown> | null = null;
  if (raw) {
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
      analysis = JSON.parse((jsonMatch[1] ?? raw).trim());
    } catch { /* ignore parse error */ }
  }

  const result = {
    analysis,
    tf,
    generatedAt: new Date().toISOString(),
    cached: false,
  };

  if (redis && analysis) {
    try { await redis.set(cacheKey(tf), result, { ex: 4 * 60 * 60 }); } catch { /* non-fatal */ }
  }

  return NextResponse.json(result);
}
