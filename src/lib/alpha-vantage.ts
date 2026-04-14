const AV_BASE = 'https://www.alphavantage.co/query';

export interface AVHolder {
  holder: string;
  shares: number;
  value: number;
  reportedDate: string;
  changeShares: number;
}

function isRateLimited(data: Record<string, unknown>): boolean {
  return !!(data['Note'] || data['Information'] || data['Error Message']);
}

/**
 * Fetch top institutional holders for a ticker.
 * Returns null on rate-limit or error (caller should fall back to static data).
 */
export async function fetchInstitutionalOwnership(
  ticker: string,
  apiKey: string
): Promise<AVHolder[] | null> {
  try {
    const url = `${AV_BASE}?function=INSTITUTIONAL_OWNERSHIP&symbol=${encodeURIComponent(ticker)}&limit=5&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 43200 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (isRateLimited(data)) return null;

    // Handle various possible response shapes
    const quarterly: unknown[] =
      data?.quarterlyReports ??
      data?.institutionOwnership?.quarterlyReports ??
      [];
    if (!quarterly.length) return null;

    const latest = quarterly[0] as Record<string, unknown>;
    const holders: unknown[] =
      (latest?.institutionHoldings as unknown[]) ??
      (latest?.holders as unknown[]) ??
      [];

    return holders.map((h) => {
      const holder = h as Record<string, unknown>;
      return {
        holder: String(holder.holder ?? holder.institutionName ?? ''),
        shares: parseInt(String(holder.shares ?? holder.sharesHeld ?? '0'), 10) || 0,
        value: parseInt(String(holder.value ?? holder.sharesValue ?? '0'), 10) || 0,
        reportedDate: String(holder.reportedDate ?? latest.fiscalDateEnding ?? ''),
        changeShares: parseInt(String(holder.changeShares ?? holder.sharesChange ?? '0'), 10) || 0,
      };
    });
  } catch {
    return null;
  }
}

/**
 * Fetch news article count for a ticker in the last 30 days.
 * Returns null on rate-limit or error.
 */
export async function fetchNewsCount(
  ticker: string,
  apiKey: string
): Promise<number | null> {
  try {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const timeFrom =
      from.toISOString().replace(/[-:]/g, '').slice(0, 13) + '00';

    const url = `${AV_BASE}?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(ticker)}&time_from=${timeFrom}&limit=200&apikey=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (isRateLimited(data)) return null;

    const items = parseInt(String(data.items ?? ''), 10);
    if (!isNaN(items)) return items;
    return Array.isArray(data.feed) ? data.feed.length : null;
  } catch {
    return null;
  }
}

/**
 * Convert raw article count → news gap score (0–100).
 * Higher article count = more media coverage = lower gap score (less "hidden signal").
 *
 * Formula: score = 100 - sqrt(articles) * 5, clamped [0, 100]
 * Examples: 0 articles → 100 | 25 → 75 | 100 → 50 | 400 → 0
 */
export function computeNewsGapScore(articleCount: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(articleCount) * 5)));
}
