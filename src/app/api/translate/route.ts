import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { text, targetLocale } = await request.json();
    if (!text || !targetLocale || targetLocale === 'en') {
      return NextResponse.json({ translated: text });
    }

    // Check cache
    const cacheKey = `${targetLocale}:${text.substring(0, 50)}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({ translated: cache.get(cacheKey) });
    }

    const localeNames: Record<string, string> = {
      ko: 'Korean', ja: 'Japanese', 'zh-CN': 'Simplified Chinese',
      'zh-TW': 'Traditional Chinese', es: 'Spanish', fr: 'French',
      de: 'German', pt: 'Portuguese', ru: 'Russian', ar: 'Arabic',
      hi: 'Hindi', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian',
      tr: 'Turkish',
    };
    const langName = localeNames[targetLocale] || targetLocale;

    // Try Gemini first (already configured)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Translate the following text to ${langName}. Return ONLY the translated text, nothing else.\n\n${text}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
      });
      const translated = result.response.text().trim();
      cache.set(cacheKey, translated);
      return NextResponse.json({ translated });
    }

    return NextResponse.json({ translated: text });
  } catch {
    return NextResponse.json({ translated: '' }, { status: 500 });
  }
}
