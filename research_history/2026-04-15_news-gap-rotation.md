# [2026-04-15] 뉴스갭 전략 개선 — Milestone 2

## 배경
Milestone 1에서 상위 10개 종목만 live 업데이트. 
유저 피드백: "기관보유량보다 뉴스갭이 더 중소형주 위주로 됐으면"

## 핵심 인사이트
- NVDA, MSFT 같은 대형주는 항상 뉴스가 나옴 → 뉴스갭 점수 의미 희박
- KLAC, AMAT, REGN 같은 중소형주는 언론 침묵 = 진짜 신호
- 기관보유량은 분기별 13F → 매일 업데이트할 필요 없음
- 따라서: Alpha Vantage 25콜을 전부 **뉴스갭**에 집중

## 새 전략

### 호출 배분
| 용도 | 콜 수 | 이전 |
|------|--------|------|
| 뉴스 갭 (NEWS_SENTIMENT) | 23 | 10 |
| 기관 보유량 (INSTITUTIONAL_OWNERSHIP) | 0 | 10 |
| 여유 | 2 | 5 |

### 종목 우선순위 (중소형 → 대형 순)
```
1순위 (침묵 신호 강함): MU, AMAT, LRCX, KLAC, ALB, RTX, NOC, LHX, REGN, MRNA
2순위:                  PFE, ORCL, NVO, TSM, ASML
3순위 (항상 커버됨):    NVDA, MSFT, GOOGL, META, AMZN, TSLA, LLY, LMT
```

### 업데이트 주기
- 매일 02:00 UTC cron → 23개 종목 전체 뉴스갭 갱신
- 로테이션 불필요 (23 < 25 한도)

## 신규 파일
- `src/lib/signals-cache.ts` — Upstash Redis 캐시 레이어
  - Key: `chainflow:news-gap:v1`
  - TTL: 26시간
  - 구조: `{ ticker: { score, articles, updatedAt } }`

## 수정 파일
- `src/lib/signals-service.ts` — 완전 교체
  - 기관보유량 fetch 제거
  - 뉴스갭만 fetch (23 tickers, 5개씩 배치, 12초 간격)
  - Redis 캐시 read/write 추가
  - `forceRefresh` 파라미터 지원 (cron에서 사용)
- `src/app/api/cron/update-signals/route.ts` — forceRefresh=true로 호출
- `src/app/[locale]/signals/page.tsx` — `updatedTickers` prop 추가
- `src/components/pages/SignalsPage.tsx` — 배지 3종: Live/Cached/Static

## 배포 시 추가 환경변수
```
UPSTASH_REDIS_REST_URL=  (MetaLens와 동일 인스턴스 사용 가능, 키 분리됨)
UPSTASH_REDIS_REST_TOKEN=
```

## 뉴스갭 공식
```
score = clamp(0, round(100 - sqrt(articles) * 5), 100)
```
- 0 articles  → 100 (완전 침묵 = 강한 신호)
- 25 articles → 75
- 100 articles → 50
- 400 articles → 0 (완전 노출 = 약한 신호)
