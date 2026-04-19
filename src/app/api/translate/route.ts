import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// ── Redis cache (30-day TTL for translations) ─────────────────────────────────
const CACHE_TTL = 30 * 24 * 60 * 60;

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function cacheKey(locale: string, text: string): string {
  // Use first 100 chars as key discriminator
  return `flowvium:tr:v1:${locale}:${text.substring(0, 100).replace(/\s+/g, ' ')}`;
}

const localeNames: Record<string, string> = {
  ko: 'Korean', ja: 'Japanese', 'zh-CN': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese', es: 'Spanish', fr: 'French',
  de: 'German', pt: 'Portuguese', ru: 'Russian', ar: 'Arabic',
  hi: 'Hindi', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
  tr: 'Turkish',
};

export async function POST(request: NextRequest) {
  try {
    const { text, targetLocale } = await request.json() as { text: string; targetLocale: string };

    if (!text || !targetLocale || targetLocale === 'en') {
      return NextResponse.json({ translated: text });
    }

    // 1. Check Redis cache
    const redis = createRedis();
    const key = cacheKey(targetLocale, text);
    if (redis) {
      try {
        const cached = await redis.get<string>(key);
        if (cached) return NextResponse.json({ translated: cached, cached: true });
      } catch { /* non-fatal */ }
    }

    // 2. Translate via Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ translated: text });
    }

    const langName = localeNames[targetLocale] ?? targetLocale;
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(geminiKey);
    // Use Flash for speed/cost; translation doesn't need reasoning
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Translate the following text to ${langName}. Return ONLY the translated text, no explanations, no quotes.\n\n${text}` }],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    });

    const translated = result.response.text().trim();

    // 3. Store in Redis
    if (redis && translated) {
      try {
        logger.info('translate', 'save_start', { key });
        const t0 = Date.now();
        await redis.set(key, translated, { ex: CACHE_TTL });
        logger.info('translate', 'save_ok', { key, durationMs: Date.now() - t0 });
      } catch (e) {
        logger.error('translate', 'save_failed', { key, error: e });
      }
    }

    return NextResponse.json({ translated });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error';
    // Rate limit — return original text gracefully
    if (msg.includes('429') || msg.includes('quota')) {
      return NextResponse.json({ translated: '' });
    }
    console.error('translate error:', msg);
    return NextResponse.json({ translated: '' });
  }
}
