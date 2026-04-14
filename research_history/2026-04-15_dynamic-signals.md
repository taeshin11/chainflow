# [2026-04-15] Dynamic Signal Updates — Milestone 1

## 변경 요약
신호(Signals) 페이지의 하드코딩 정적 데이터를 실시간 데이터 파이프라인으로 전환.

## 문제
- `src/data/institutional-signals.ts` 파일에 38개 신호가 하드코딩
- 코드 수정 → 빌드 → 재배포 없이는 데이터 업데이트 불가
- 마지막 데이터: 2026-02-14 (Q4 2025)

## 해결책

### 데이터 소스
| 소스 | 용도 | 무료 한도 |
|------|------|-----------|
| Alpha Vantage `INSTITUTIONAL_OWNERSHIP` | 기관 보유량 변화 (상위 10개 종목) | 25 req/day |
| Alpha Vantage `NEWS_SENTIMENT` | 뉴스 기사 수 → 갭 스코어 계산 | 25 req/day |
| 정적 fallback (`institutional-signals.ts`) | 국제 종목, AV 한도 초과 시 | — |

### 업데이트 주기
- **Vercel Cron**: 매일 02:00 UTC → `/api/cron/update-signals` 호출
- **ISR 캐시**: 12시간 (`revalidate = 43200`)
- **13F 실제 주기**: 분기별 (Q4→Feb, Q1→May, Q2→Aug, Q3→Nov)

### 신규 파일
- `src/lib/alpha-vantage.ts` — AV API 클라이언트
- `src/lib/signals-service.ts` — 데이터 집계 로직 (서버 직접 호출)
- `src/app/api/signals/route.ts` — REST API 엔드포인트 (외부용)
- `src/app/api/cron/update-signals/route.ts` — Cron handler
- `vercel.json` — 일일 cron 설정

### 수정 파일
- `src/app/[locale]/signals/page.tsx` — 서버 컴포넌트로 전환, `getSignals()` 직접 호출
- `src/components/pages/SignalsPage.tsx` — 정적 import 제거, props 기반으로 변경
- `.env.example` — `ALPHA_VANTAGE_KEY`, `CRON_SECRET` 추가

### UI 변경
- 헤더에 **Live** (초록 배지, ⚡) 또는 **Cached** (회색 배지) 표시
- 마지막 업데이트 시각 표시

## 뉴스 갭 스코어 공식
```
newsGapScore = clamp(0, 100 - sqrt(articleCount) * 5, 100)
```
- 0 articles → 100 (완전 침묵 = 강한 신호)
- 25 articles → 75
- 100 articles → 50
- 400 articles → 0 (언론 집중 = 약한 신호)

## Live 종목 (10개)
NVDA, MSFT, TSLA, LLY, LMT, MU, META, GOOGL, AMZN, ORCL

국제 종목 (*.KS, *.SZ, *.HK, *.L)은 정적 fallback 유지.

## 배포 시 설정 필요
1. Vercel 환경변수에 `ALPHA_VANTAGE_KEY` 등록
2. `CRON_SECRET` 설정 (보안)
3. Vercel Pro 이상에서 cron 작동 (Hobby 플랜 cron 불가)
