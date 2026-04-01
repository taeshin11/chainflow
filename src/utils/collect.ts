const WEBHOOK_URL = process.env.NEXT_PUBLIC_SHEETS_WEBHOOK;

export async function trackEvent(event: string, meta: Record<string, string> = {}) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        ...meta,
        locale: typeof navigator !== 'undefined' ? navigator.language : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        sessionId: getSessionId(),
        timestamp: new Date().toISOString()
      })
    });
  } catch { /* silent */ }
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('cf_sid');
  if (!id) {
    id = Math.random().toString(36).slice(2);
    sessionStorage.setItem('cf_sid', id);
  }
  return id;
}
