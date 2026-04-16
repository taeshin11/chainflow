import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Types ─────────────────────────────────────────────────────────────────────
type Timeframe = '1w' | '4w' | '13w';

interface BriefSection {
  title: string;
  content: string;
  bullets: string[];
}

interface DailyBrief {
  market: BriefSection;
  capital: BriefSection;
  company: BriefSection;
  outlook: string;
  generatedAt: string;
  tf: Timeframe;
}

// ── Redis ─────────────────────────────────────────────────────────────────────
function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function cacheKey(tf: Timeframe): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `flowvium:daily-brief:v2:${today}:${tf}`;
}

// ── AI call ───────────────────────────────────────────────────────────────────
async function callAI(prompt: string): Promise<string> {
  // 1. Try vLLM (EXAONE) first
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
              content: `당신은 FlowVium AI입니다. 글로벌 자금흐름, 공급망, 기관투자, 거시경제를 분석하는 전문 애널리스트입니다.
분석 결과는 반드시 JSON 형식으로만 응답하세요. 절대 JSON 외의 텍스트를 포함하지 마세요.`,
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 1200,
          temperature: 0.65,
        }),
        signal: AbortSignal.timeout(40000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? '';
      }
    } catch { /* fallback */ }
  }

  // 2. Gemini fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// ── Build AI prompt ───────────────────────────────────────────────────────────
function buildPrompt(tf: Timeframe, capitalData: unknown, macroData: unknown): string {
  const tfLabel = tf === '1w' ? '최근 1주' : tf === '4w' ? '최근 4주' : '최근 13주';
  const retKey = tf === '1w' ? 'ret1w' : tf === '4w' ? 'ret4w' : 'ret13w';

  // Extract top movers from capital data
  let topMovers = '';
  let gvdInfo = '';
  try {
    const cd = capitalData as Record<string, unknown>;
    const assets = (cd?.assets as Array<Record<string, unknown>>) ?? [];
    const sorted = [...assets].sort((a, b) => {
      return Math.abs((b[retKey] as number) ?? 0) - Math.abs((a[retKey] as number) ?? 0);
    }).slice(0, 8);
    topMovers = sorted.map(a => `${a.name}(${a.ticker}): ${((a[retKey] as number) ?? 0).toFixed(1)}%`).join(', ');

    const gvd = cd?.goldVsDollar as Record<string, unknown>;
    if (gvd) {
      const g = tf === '1w' ? gvd.goldRet1w : tf === '4w' ? gvd.goldRet4w : gvd.goldRet13w;
      const d = tf === '1w' ? gvd.dollarRet1w : tf === '4w' ? gvd.dollarRet4w : gvd.dollarRet13w;
      gvdInfo = `금 ${(g as number)?.toFixed(1)}% / 달러(UUP) ${(d as number)?.toFixed(1)}%`;
    }
  } catch { /* ignore */ }

  // Extract macro indicators
  let macroInfo = '';
  try {
    const md = macroData as Record<string, unknown>;
    const indicators = (md?.indicators as Array<Record<string, unknown>>) ?? [];
    macroInfo = indicators.slice(0, 5).map(i =>
      `${i.name}: ${i.actual} (예상 ${i.forecast}, ${i.surprise})`
    ).join(' | ');

    const yc = md?.yieldCurve as Record<string, unknown>;
    if (yc) {
      macroInfo += ` | 10Y-2Y스프레드: ${(yc.spread10y2y as number)?.toFixed(0)}bp${(yc.inverted as boolean) ? ' (역전)' : ''}`;
    }
  } catch { /* ignore */ }

  return `${tfLabel} 글로벌 시장 분석 브리핑을 JSON으로 작성하세요.

데이터:
- 자산 수익률 (${tfLabel}): ${topMovers}
- 금/달러 (${tfLabel}): ${gvdInfo}
- 매크로 지표: ${macroInfo}

아래 JSON 형식으로만 응답하세요:
{
  "market": {
    "title": "시장 동향",
    "content": "2-3문장 시장 전반 분석",
    "bullets": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"]
  },
  "capital": {
    "title": "자금 흐름",
    "content": "2-3문장 자금흐름 분석",
    "bullets": ["자금흐름 포인트 1", "자금흐름 포인트 2", "자금흐름 포인트 3"]
  },
  "company": {
    "title": "주목 기업",
    "content": "2-3문장 주목할 기업/섹터 분석",
    "bullets": ["기업 포인트 1", "기업 포인트 2", "기업 포인트 3"]
  },
  "outlook": "한 문장 투자 전망 요약"
}`;
}

// ── Parse AI response ─────────────────────────────────────────────────────────
function parseAIResponse(raw: string, tf: Timeframe): DailyBrief | null {
  try {
    // Extract JSON from possible markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, raw];
    const jsonStr = (jsonMatch[1] ?? raw).trim();
    const parsed = JSON.parse(jsonStr);
    return {
      market: parsed.market,
      capital: parsed.capital,
      company: parsed.company,
      outlook: parsed.outlook ?? '',
      generatedAt: new Date().toISOString(),
      tf,
    };
  } catch {
    return null;
  }
}

// ── Fallback brief (when AI unavailable) ─────────────────────────────────────
function fallbackBrief(tf: Timeframe): DailyBrief {
  const tfLabel = tf === '1w' ? '1주' : tf === '4w' ? '4주' : '13주';
  return {
    market: {
      title: '시장 동향',
      content: `${tfLabel} 기준 글로벌 시장 데이터를 분석 중입니다.`,
      bullets: ['실시간 데이터 로드 중', '잠시 후 다시 확인해주세요'],
    },
    capital: {
      title: '자금 흐름',
      content: '자금흐름 데이터를 집계하고 있습니다.',
      bullets: ['자금흐름 분석 준비 중'],
    },
    company: {
      title: '주목 기업',
      content: '기업별 포지션 변화를 분석 중입니다.',
      bullets: ['기업 데이터 분석 준비 중'],
    },
    outlook: 'AI 분석 시스템이 준비 중입니다.',
    generatedAt: new Date().toISOString(),
    tf,
  };
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tf = (searchParams.get('tf') as Timeframe) ?? '4w';

  // 1. Check Redis cache
  const redis = createRedis();
  if (redis) {
    try {
      const cached = await redis.get<DailyBrief>(cacheKey(tf));
      if (cached) {
        return NextResponse.json({ ...cached, cached: true });
      }
    } catch { /* non-fatal */ }
  }

  // 2. Fetch market data in parallel
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  let capitalData: unknown = null;
  let macroData: unknown = null;

  try {
    const [capitalRes, macroRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/capital-flows`, { signal: AbortSignal.timeout(15000) }),
      fetch(`${baseUrl}/api/macro-indicators`, { signal: AbortSignal.timeout(10000) }),
    ]);
    if (capitalRes.status === 'fulfilled' && capitalRes.value.ok) {
      capitalData = await capitalRes.value.json();
    }
    if (macroRes.status === 'fulfilled' && macroRes.value.ok) {
      macroData = await macroRes.value.json();
    }
  } catch { /* proceed with null data */ }

  // 3. Generate AI analysis
  const prompt = buildPrompt(tf, capitalData, macroData);
  let brief: DailyBrief | null = null;

  try {
    const raw = await callAI(prompt);
    if (raw) brief = parseAIResponse(raw, tf);
  } catch { /* fallback */ }

  if (!brief) brief = fallbackBrief(tf);

  // 4. Cache result for 24h
  if (redis) {
    try {
      await redis.set(cacheKey(tf), brief, { ex: 24 * 60 * 60 });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ ...brief, cached: false });
}

// ── DELETE — cache invalidation ───────────────────────────────────────────────
export async function DELETE(request: Request) {
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const redis = createRedis();
  if (!redis) return NextResponse.json({ error: 'No Redis' }, { status: 503 });

  const today = new Date().toISOString().slice(0, 10);
  const keys = (['1w', '4w', '13w'] as Timeframe[]).map(
    (tf) => `flowvium:daily-brief:v2:${today}:${tf}`
  );
  await Promise.allSettled(keys.map((k) => redis.del(k)));
  return NextResponse.json({ deleted: keys });
}
