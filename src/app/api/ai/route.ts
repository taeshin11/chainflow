import { GoogleGenerativeAI } from '@google/generative-ai';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

// ── Redis cache (7-day TTL) ───────────────────────────────────────────────────
const CACHE_TTL = 7 * 24 * 60 * 60; // seconds

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function cacheKey(ticker: string, type: string): string {
  return `flowvium:ai:v1:${type}:${ticker.toUpperCase()}`;
}

// ── POST — main analysis endpoint ─────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { prompt, type, ticker } = await request.json() as {
      prompt: string;
      type?: string;
      ticker?: string;
    };

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Redis cache check — avoids Gemini call if result already exists
    const redis = createRedis();
    if (redis && ticker && type) {
      try {
        const cached = await redis.get<string>(cacheKey(ticker, type));
        if (cached) {
          return NextResponse.json({ analysis: cached, cached: true });
        }
      } catch {
        // Redis failure is non-fatal
      }
    }

    // 2. Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        analysis: 'AI analysis is currently unavailable. The Gemini API key has not been configured.',
      });
    }

    const systemPrompt = `You are Flowvium AI, an expert supply chain investment analyst.
Provide concise, actionable analysis about supply chain relationships, institutional flows,
and investment implications. Be specific with data and patterns.
Analysis type: ${type || 'general'}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt + '\n\n' + prompt);
    const analysis = result.response.text();

    // 3. Store result in Redis (non-fatal if fails)
    if (redis && ticker && type) {
      try {
        await redis.set(cacheKey(ticker, type), analysis, { ex: CACHE_TTL });
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ analysis, cached: false });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json({
        analysis: 'AI analysis is temporarily rate-limited. Please try again in a few moments.',
      });
    }

    console.error('Gemini API error:', message);
    return NextResponse.json({
      analysis: 'AI analysis encountered an error. Please try again later.',
    });
  }
}

// ── DELETE — cache invalidation (admin) ──────────────────────────────────────

export async function DELETE(request: Request) {
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { ticker, type } = await request.json() as { ticker: string; type?: string };
  const redis = createRedis();
  if (!redis || !ticker) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const key = cacheKey(ticker, type ?? 'general');
  await redis.del(key);
  return NextResponse.json({ deleted: key });
}
