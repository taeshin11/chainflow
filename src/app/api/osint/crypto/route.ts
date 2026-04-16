import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const CACHE_TTL = 30 * 60; // 30 minutes

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// ── Address format detection ───────────────────────────────────────────────────
function detectChain(address: string): 'eth' | 'btc' | null {
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return 'eth';
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return 'btc';
  if (/^bc1[a-z0-9]{6,87}$/.test(address)) return 'btc';
  return null;
}

// ── BTC fetch via blockchain.info ──────────────────────────────────────────────
interface BtcTx {
  hash: string;
  time: number;
  result: number;
}

interface BtcRawAddr {
  final_balance: number;
  total_received: number;
  total_sent: number;
  n_tx: number;
  txs: BtcTx[];
}

async function fetchBtc(address: string) {
  const res = await fetch(
    `https://blockchain.info/rawaddr/${address}?limit=10`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`blockchain.info HTTP ${res.status}`);
  const data: BtcRawAddr = await res.json();

  const satToBtc = (sat: number) => sat / 1e8;
  const balance = satToBtc(data.final_balance);
  const totalReceived = satToBtc(data.total_received);
  const totalSent = satToBtc(data.total_sent);
  const txCount = data.n_tx;

  const recentTxs = (data.txs ?? []).slice(0, 5).map((tx) => ({
    hash: tx.hash,
    time: new Date(tx.time * 1000).toISOString(),
    value: Math.abs(satToBtc(tx.result)),
    direction: tx.result >= 0 ? 'in' : 'out',
  }));

  const riskFlags: string[] = [];
  if (txCount > 1000) riskFlags.push('고빈도 거래');
  if (balance > 1000) riskFlags.push('대규모 잔고');

  // Smurfing heuristic: more than 5 recent txs with value < 0.01 BTC each
  const smallTxs = recentTxs.filter((tx) => tx.value < 0.01);
  if (smallTxs.length >= 4) riskFlags.push('스머핑 의심');

  return {
    chain: 'btc',
    address,
    balance,
    balanceUsd: null,
    totalReceived,
    totalSent,
    txCount,
    recentTxs,
    riskFlags,
  };
}

// ── ETH fetch via Etherscan ────────────────────────────────────────────────────
interface EtherscanTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
}

async function fetchEth(address: string) {
  const apiKey = process.env.ETHERSCAN_API_KEY?.trim() ?? '';
  const keyParam = apiKey ? `&apikey=${apiKey}` : '';
  const base = 'https://api.etherscan.io/api';

  const [balRes, txRes] = await Promise.all([
    fetch(
      `${base}?module=account&action=balance&address=${address}&tag=latest${keyParam}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) }
    ),
    fetch(
      `${base}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc${keyParam}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) }
    ),
  ]);

  if (!balRes.ok) throw new Error(`Etherscan balance HTTP ${balRes.status}`);
  if (!txRes.ok) throw new Error(`Etherscan txlist HTTP ${txRes.status}`);

  const balData = await balRes.json();
  const txData = await txRes.json();

  if (balData.status !== '1' && balData.message !== 'OK') {
    throw new Error(`Etherscan balance error: ${balData.message}`);
  }

  const weiToEth = (wei: string) => parseFloat(wei) / 1e18;
  const balance = weiToEth(balData.result ?? '0');

  const txList: EtherscanTx[] = txData.status === '1' ? (txData.result ?? []) : [];

  // Compute total received and sent from tx list (approximation)
  let totalReceived = 0;
  let totalSent = 0;
  for (const tx of txList) {
    const val = weiToEth(tx.value);
    const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
    if (isIncoming) totalReceived += val;
    else totalSent += val;
  }

  const txCount = txList.length;

  const recentTxs = txList.slice(0, 5).map((tx) => {
    const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
    return {
      hash: tx.hash,
      time: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      value: weiToEth(tx.value),
      direction: isIncoming ? 'in' : 'out',
    };
  });

  const riskFlags: string[] = [];
  if (txCount > 1000) riskFlags.push('고빈도 거래');
  if (balance > 10000) riskFlags.push('대규모 잔고');

  const smallTxs = recentTxs.filter((tx) => tx.value < 0.01);
  if (smallTxs.length >= 4) riskFlags.push('스머핑 의심');

  return {
    chain: 'eth',
    address,
    balance,
    balanceUsd: null,
    totalReceived,
    totalSent,
    txCount,
    recentTxs,
    riskFlags,
  };
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address')?.trim() ?? '';
  const chainParam = searchParams.get('chain') ?? 'auto';

  if (!address) {
    return NextResponse.json({ error: '주소를 입력하세요' }, { status: 400 });
  }

  let chain: 'eth' | 'btc';

  if (chainParam === 'eth') {
    chain = 'eth';
  } else if (chainParam === 'btc') {
    chain = 'btc';
  } else {
    // auto-detect
    const detected = detectChain(address);
    if (!detected) {
      return NextResponse.json(
        { error: '주소 형식을 인식할 수 없습니다 (ETH: 0x..., BTC: 1.../3.../bc1...)' },
        { status: 400 }
      );
    }
    chain = detected;
  }

  // Validate address format
  if (chain === 'eth' && !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: '유효하지 않은 ETH 주소입니다' }, { status: 400 });
  }
  if (
    chain === 'btc' &&
    !/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) &&
    !/^bc1[a-z0-9]{6,87}$/.test(address)
  ) {
    return NextResponse.json({ error: '유효하지 않은 BTC 주소입니다' }, { status: 400 });
  }

  const cacheKey = `flowvium:osint:crypto:v1:${chain}:${address}`;
  const redis = createRedis();

  if (redis) {
    try {
      const cached = await redis.get<object>(cacheKey);
      if (cached) return NextResponse.json(cached);
    } catch { /* non-fatal */ }
  }

  try {
    const result = chain === 'btc' ? await fetchBtc(address) : await fetchEth(address);

    if (redis) {
      try { await redis.set(cacheKey, result, { ex: CACHE_TTL }); } catch { /* non-fatal */ }
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: `데이터를 불러오지 못했습니다: ${message}` }, { status: 500 });
  }
}
