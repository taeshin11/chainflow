import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail webhook — we always return 200
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
