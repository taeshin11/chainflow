import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const CACHE_TTL = 60 * 60; // 1 hour

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── OpenCorporates types ───────────────────────────────────────────────────────
interface OcCompany {
  name: string;
  company_number: string;
  jurisdiction_code: string;
  incorporation_date: string | null;
  dissolution_date: string | null;
  company_type: string | null;
  registered_address_in_full: string | null;
  opencorporates_url: string;
}

interface OcApiResponse {
  results?: {
    companies?: Array<{ company: OcCompany }>;
    total_count?: number;
  };
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ error: '검색어를 입력하세요' }, { status: 400 });
  }

  const encodedQuery = encodeURIComponent(q);
  const cacheKey = `flowvium:osint:corporate:v1:${encodedQuery}`;
  const redis = createRedis();

  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch { /* non-fatal */ }
  }

  try {
    const res = await fetch(
      `https://api.opencorporates.com/v0.4/companies/search?q=${encodedQuery}&per_page=5&format=json`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      throw new Error(`OpenCorporates HTTP ${res.status}`);
    }

    const data: OcApiResponse = await res.json();
    const rawCompanies = data?.results?.companies ?? [];
    const total = data?.results?.total_count ?? rawCompanies.length;

    const companies = rawCompanies.map(({ company: c }) => ({
      name: c.name,
      number: c.company_number,
      jurisdiction: c.jurisdiction_code,
      incorporated: c.incorporation_date,
      dissolved: c.dissolution_date,
      type: c.company_type,
      address: c.registered_address_in_full,
      url: c.opencorporates_url,
    }));

    const result = {
      companies,
      total,
      source: 'OpenCorporates',
    };

    if (redis) {
      try { await redis.set(cacheKey, result, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({
      companies: [],
      total: 0,
      source: 'OpenCorporates',
      error: `기업 데이터를 불러오지 못했습니다: ${message}`,
    });
  }
}
