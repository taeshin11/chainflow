# FlowVium Terminal — Bloomberg 기능 분석 및 구현 계획
작성일: 2026-04-16

## Bloomberg Terminal 핵심 기능 vs FlowVium 현황

| 기능 | Bloomberg | FlowVium 현황 | 구현 우선순위 |
|------|-----------|--------------|------------|
| 실시간 주가 | ✅ | ⚠️ Yahoo 15분 지연 | 높음 |
| 경제지표 캘린더 | ✅ | ❌ 없음 | 최고 |
| 지표 cascade 분석 | ✅ | ❌ 없음 | 최고 |
| 국가별 시장 자금흐름 | ✅ | ✅ 구현됨 (2026-04-16) | - |
| 자산군간 로테이션 | ✅ | ✅ 구현됨 | - |
| Fear & Greed 지수 | ✅ | ✅ 구현됨 | - |
| 뉴스 + cascade | ✅ | ⚠️ 뉴스갭 있음, cascade 없음 | 높음 |
| 금리 수익률 곡선 | ✅ | ❌ 없음 | 높음 |
| FX 모니터 | ✅ | ⚠️ 일부만 | 중간 |
| 기술적 차트 | ✅ | ❌ 없음 | 높음 |
| 섹터 히트맵 | ✅ | ⚠️ 부분 | 중간 |
| 기업 재무 분석 | ✅ | ✅ 444개 기업 프로필 | - |
| 공급망 추적 | ✅ | ✅ 고유 기능 | - |
| 스마트머니 흐름 | ✅ | ✅ 구현됨 | - |

## 우선 구현 목록 (FlowVium Terminal 탭)

### Phase 1 (즉시)
1. **매크로 지표 + Cascade** — CPI/NFP/FOMC 발표값 + 자산별 cascade 영향
   - API: /api/macro-indicators (구현됨 2026-04-16)
   - 추가 필요: Intelligence 탭에 UI 통합
   
2. **뉴스 Cascade** — 주요 뉴스 → AI cascade 분석
   - 기존 news-gap 탭 활용
   - EXAONE vLLM으로 cascade 분석 추가

### Phase 2 (다음 세션)
3. **금리 수익률 곡선** — 미 국채 2Y/5Y/10Y/30Y 실시간
   - 역전/정상화 신호
   - Fed 정책 전망 연동

4. **실시간 가격 대시보드** — 주요 자산 실시간 가격 타일
   - SPY, QQQ, TLT, GLD, BTC, WTI, DXY

5. **섹터 히트맵** — S&P 500 11개 섹터 일별/주별 수익률

### Phase 3
6. **기술적 차트** — TradingView 위젯 또는 자체 RSI/MACD
7. **Earnings Calendar** — 주요 기업 실적 발표 일정
8. **VIX/변동성 모니터** — 공포지수 + 옵션 흐름

## vLLM EXAONE 통합 계획
- 로컬 개발: http://localhost:8000/v1 (EXAONE 2.4B)
- 프로덕션 Vercel: Gemini 2.5 fallback
- /api/ai 라우트: VLLM_URL 환경변수로 전환

## 완료된 작업 (이번 세션)
- 모바일 탭 줄바꿈 수정 (whitespace-nowrap)
- 기업 수 동적 표시 (430 하드코딩 → allCompanies.length)
- 국가별 시장 자금흐름 추가 (12개국 + 국가간 로테이션)
- 모든 섹션 타임프레임 통일 (1주/4주/3개월)
- vLLM 0.19.0 설치 완료
- EXAONE 2.4B 설치 및 서버 시작
- /api/macro-indicators 구현 (CPI, PCE, NFP, FOMC, GDP, ISM, PPI, Retail Sales)
