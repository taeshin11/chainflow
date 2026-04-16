import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const CACHE_TTL = 24 * 60 * 60; // 24 hours
const OFAC_CSV_URL = 'https://www.treasury.gov/ofac/downloads/sdn.csv';

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── CSV parsing ───────────────────────────────────────────────────────────────
// OFAC SDN format: "ent_num","SDN_Name","SDN_Type","Program","Title","Callsign","Vess_type","Tonnage","GRT","Vess_flag","Vess_owner","Remarks"
// Fields may be quoted. We split conservatively on `","` and strip outer quotes.

interface SdnEntry {
  entNum: string;
  name: string;
  type: string;
  program: string;
  remarks: string;
}

function parseSdnCsv(csv: string): SdnEntry[] {
  const lines = csv.split('\n');
  const entries: SdnEntry[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Remove leading/trailing outer quote if present then split by ","
    const stripped = line.startsWith('"') && line.endsWith('"')
      ? line.slice(1, -1)
      : line;

    const cols = stripped.split('","');

    // Need at least 4 columns: ent_num, SDN_Name, SDN_Type, Program
    if (cols.length < 4) continue;

    const entNum = cols[0].replace(/^"|"$/g, '').trim();
    const name = cols[1].replace(/^"|"$/g, '').trim();
    const type = cols[2].replace(/^"|"$/g, '').trim();
    const program = cols[3].replace(/^"|"$/g, '').trim();
    const remarks = cols[11] ? cols[11].replace(/^"|"$/g, '').trim() : '';

    // Skip header or empty name rows
    if (!name || name === 'SDN_Name' || name === '-0-') continue;

    entries.push({ entNum, name, type, program, remarks });
  }

  return entries;
}

// ── Fetch and cache OFAC SDN CSV ───────────────────────────────────────────────
async function getSdnData(redis: Redis | null): Promise<SdnEntry[] | null> {
  const cacheKey = 'flowvium:osint:sanctions:v1:sdn-csv';

  if (redis) {
    try {
      const cached = await redis.get<SdnEntry[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    } catch { /* non-fatal */ }
  }

  try {
    const res = await fetch(OFAC_CSV_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;

    const csv = await res.text();
    const entries = parseSdnCsv(csv);

    if (redis && entries.length > 0) {
      try { await redis.set(cacheKey, entries, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
    }

    return entries;
  } catch {
    return null;
  }
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ error: '검색어를 입력하세요' }, { status: 400 });
  }

  const redis = createRedis();
  const entries = await getSdnData(redis);

  if (!entries) {
    return NextResponse.json({
      matches: [],
      total: 0,
      source: 'OFAC SDN',
      updatedAt: new Date().toISOString(),
      error: 'OFAC 데이터를 불러올 수 없습니다',
    });
  }

  const queryLower = q.toLowerCase();
  const matches = entries
    .filter((e) => e.name.toLowerCase().includes(queryLower))
    .slice(0, 10)
    .map((e) => ({
      name: e.name,
      type: e.type,
      program: e.program,
      remarks: e.remarks,
      entNum: e.entNum,
    }));

  return NextResponse.json({
    matches,
    total: matches.length,
    source: 'OFAC SDN',
    updatedAt: new Date().toISOString(),
  });
}
