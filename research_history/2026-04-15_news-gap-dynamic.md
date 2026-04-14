# [2026-04-15] 뉴스갭 분석기 (/news-gap) 동적화 — Milestone 3

## 배경
- `/signals` 페이지는 Alpha Vantage 데이터로 동적화 완료 (Milestone 1~2)
- `/news-gap` 페이지는 여전히 `src/data/news-gap.ts` 하드코딩 정적 데이터 사용 중
- 유저 피드백: "뉴스갭 분석기가 최우선, 중소형주 위주로"

## 핵심 설계 결정

### Zero 추가 API 호출
`/news-gap`이 `/signals`와 **동일한 Redis 캐시** (`chainflow:news-gap:v1`) 를 읽음.
- signals cron이 매일 02:00 UTC에 25 티커 전부 업데이트
- news-gap 서비스는 추가 Alpha Vantage 호출 없이 캐시에서 읽기만 함
- API 할당량 25콜/일 100% 뉴스갭에 집중 유지

### 티커 25개로 확장 (23 → 25)
signals 리스트에 KTOS, MRVL 추가 — 두 종목 모두 중소형주 + 언론 침묵 강한 케이스

```
MU, AMAT, LRCX, KLAC, ALB, KTOS, MRVL,     ← Tier 1 (침묵 신호 강함)
RTX, NOC, LHX, REGN, MRNA, PFE, ORCL, NVO, TSM, ASML,  ← Tier 2
NVDA, MSFT, GOOGL, META, AMZN, TSLA, LLY, LMT           ← Tier 3
```

## 신규/수정 파일

### 신규
- `src/lib/news-gap-service.ts` — Redis 캐시 읽기 + 정적 13F 데이터 병합
  - `getNewsGapData()` → `NewsGapResult { entries, lastUpdated, source, updatedTickers }`
  - gapScore, mediaScore, recentHeadlines 를 live 데이터로 오버라이드
  - 기본 정렬: gapScore 내림차순 (침묵 강한 종목 최상단)

### 수정
- `src/lib/alpha-vantage.ts`
  - `fetchNewsCount` → `fetchNewsData` (count + headlines 반환)
  - headlines: AV `feed` 배열에서 상위 3개 title 추출
  - 기존 `fetchNewsCount` deprecated wrapper 유지 (하위 호환)

- `src/lib/signals-cache.ts`
  - `TickerNewsCache` 인터페이스에 `headlines?: string[]` 추가

- `src/lib/signals-service.ts`
  - `fetchNewsCount` → `fetchNewsData` 사용
  - headlines 캐시에 저장
  - US_TICKERS_BY_PRIORITY: KTOS, MRVL 추가 (25개)

- `src/data/news-gap.ts` — 전면 재작성
  - 10개 → 25개 티커 (signals 리스트와 완전 일치)
  - 각 티커: 실제 13F 기관보유 데이터 기반 ibActivityScore, ibActions, topInstitutions
  - mediaScore/gapScore/recentHeadlines는 런타임에 live 데이터로 덮어씌워짐

- `src/app/[locale]/news-gap/page.tsx`
  - `export default function Page()` → `export default async function Page()`
  - `getNewsGapData()` 서버사이드 호출
  - `export const revalidate = 43200` 추가

- `src/components/pages/NewsGapPage.tsx`
  - `import { newsGapData }` 정적 임포트 제거
  - Props: `initialEntries`, `lastUpdated`, `source`, `updatedTickers`
  - Live/Cached/Static 뱃지 추가 (signals 페이지와 동일 패턴)

## 데이터 흐름
```
Vercel Cron 02:00 UTC
  → signals-service.refreshNewsGaps() [25 AV calls]
  → Redis chainflow:news-gap:v1 {score, articles, headlines, updatedAt}
  
사용자 /news-gap 요청
  → news-gap-service.getNewsGapData()
  → Redis 읽기 (0 AV calls)
  → newsGapData (정적 13F) + Redis overlay
  → gapScore 내림차순 정렬
  → NewsGapPage 렌더링
```

## 환경변수 (이번 세션에서 Vercel 설정 완료)
```
ALPHA_VANTAGE_KEY=YJ9XZSQ...       ← 설정 완료
UPSTASH_REDIS_REST_URL=...          ← MetaLens 동일 인스턴스, 설정 완료
UPSTASH_REDIS_REST_TOKEN=...        ← 설정 완료
CRON_SECRET=8012c22f...             ← 설정 완료
```
