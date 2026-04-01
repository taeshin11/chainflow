import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          analysis:
            'AI analysis is currently unavailable. The Gemini API key has not been configured. Please set GEMINI_API_KEY in your environment variables.',
        },
        { status: 200 }
      );
    }

    const { prompt, type } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `You are ChainFlow AI, an expert supply chain investment analyst.
Provide concise, actionable analysis about supply chain relationships, institutional flows,
and investment implications. Be specific with data and patterns.
Analysis type: ${type || 'general'}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt + '\n\n' + prompt);
    const response = await result.response;

    return NextResponse.json({ analysis: response.text() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json(
        {
          analysis:
            'AI analysis is temporarily rate-limited. Please try again in a few moments.',
        },
        { status: 200 }
      );
    }

    console.error('Gemini API error:', message);
    return NextResponse.json(
      {
        analysis:
          'AI analysis encountered an error. Please try again later.',
      },
      { status: 200 }
    );
  }
}
