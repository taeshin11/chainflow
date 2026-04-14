export interface SectorContext {
  id: string;
  name: string;
  /** 현재 시장 국면 한줄 요약 */
  phase: string;
  /** 핵심 지표/데이터 포인트 */
  keyData: { label: string; value: string; trend: 'up' | 'down' | 'neutral' }[];
  /** 섹터 핵심 테마 */
  themes: string[];
  /** Google News 검색 URL */
  googleNewsUrl: string;
  /** 관련 ETF */
  etfs: string[];
  /** 다음 주요 이벤트 */
  nextCatalysts: string[];
}

export const sectorContextMap: Record<string, SectorContext> = {
  'semiconductors': {
    id: 'semiconductors',
    name: '반도체',
    phase: 'WFE(반도체 장비) 업사이클 + AI HBM 슈퍼사이클 진입',
    keyData: [
      { label: 'TSMC 가동률', value: '92%+', trend: 'up' },
      { label: 'HBM 수요 성장', value: '+180% YoY', trend: 'up' },
      { label: 'WFE 시장 규모', value: '$105B (2026E)', trend: 'up' },
      { label: '리드타임 (장비)', value: '18~24개월', trend: 'neutral' },
    ],
    themes: [
      'AI 가속기(H100/B200) 수요 공급 불균형 지속',
      'Gate-All-Around 공정 전환 → 장비 교체 사이클',
      'HBM3e/HBM4 양산 경쟁 — SK하이닉스·마이크론·삼성',
      'TSMC 애리조나/일본 fab 확장으로 장비 수요 증가',
      'CoWoS 패키징 병목 → AMAT·LRCX·KLAC 수혜',
    ],
    googleNewsUrl: 'https://news.google.com/search?q=semiconductor+equipment+HBM+AI+chip',
    etfs: ['SOXX', 'SMH', 'XSD'],
    nextCatalysts: [
      'TSMC Q2 실적 (2026.04.17)',
      'NVIDIA GB300 양산 착수 발표',
      'AMAT/LRCX/KLAC 실적 시즌 (2026.05)',
    ],
  },

  'ai-cloud': {
    id: 'ai-cloud',
    name: 'AI / 클라우드',
    phase: '하이퍼스케일러 AI 인프라 투자 급증 — 수혜 종목 선별 중요',
    keyData: [
      { label: 'AI 인프라 투자 (2026E)', value: '$320B', trend: 'up' },
      { label: 'AWS 성장률', value: '+37% YoY', trend: 'up' },
      { label: 'AI 소프트웨어 침투율', value: '18%', trend: 'up' },
      { label: 'GPU 리드타임', value: '6~9개월', trend: 'down' },
    ],
    themes: [
      'Capex 폭증 — MSFT/GOOGL/META/AMZN 합산 $200B+ (2026)',
      'Inference 수요 → 맞춤형 AI칩(MRVL·ORCL 수혜)',
      'SaaS → AI-as-a-Service 전환 가속',
      'Sovereign AI — 각국 자국 클라우드 구축 수요',
      'Power & Cooling — AI 데이터센터 전력 수요 3배 증가',
    ],
    googleNewsUrl: 'https://news.google.com/search?q=AI+cloud+hyperscaler+capex+investment',
    etfs: ['AIQ', 'BOTZ', 'CLOU', 'QQQ'],
    nextCatalysts: [
      'Meta/GOOGL/MSFT/AMZN Q1 실적 (2026.04~05)',
      'OpenAI GPT-5 출시 영향',
      'NVIDIA GB300 기반 H200 교체 사이클',
    ],
  },

  'ev-battery': {
    id: 'ev-battery',
    name: 'EV / 배터리',
    phase: '리튬 가격 바닥권 — 기관 역발상 매집, 중장기 반등 베팅',
    keyData: [
      { label: '리튬 탄산 현물가', value: '$11.5/kg', trend: 'down' },
      { label: '글로벌 EV 보급률', value: '18% → 25% (2026E)', trend: 'up' },
      { label: '배터리 팩 가격', value: '$112/kWh', trend: 'down' },
      { label: '중국 EV 수출 성장', value: '+42% YoY', trend: 'up' },
    ],
    themes: [
      '리튬 가격 52주 저점 — 과잉공급에도 기관은 ALB 집중 매집',
      'BYD 가격 전쟁 → 서방 완성차 원가 압박 심화',
      'ESS(에너지 저장장치) 수요 급증으로 리튬 중기 회복 전망',
      'IRA 세액 공제로 미국 내 배터리 공장 건설 가속',
      'LFP vs NMC 기술 경쟁 — 에너지밀도 vs 원가',
    ],
    googleNewsUrl: 'https://news.google.com/search?q=lithium+EV+battery+market+2026',
    etfs: ['LIT', 'BATT', 'DRIV'],
    nextCatalysts: [
      'ALB Q1 실적 및 리튬 생산 가이던스 (2026.05)',
      'Tesla 배터리 데이 2026',
      'IRA 보조금 검토 결과 발표',
    ],
  },

  'defense': {
    id: 'defense',
    name: '방산',
    phase: 'NATO 지출 의무화 + 우크라이나 재건 → 다년간 수주 잔고 사상 최대',
    keyData: [
      { label: '미 국방예산 (FY2026)', value: '$921B', trend: 'up' },
      { label: 'NATO 방위비 GDP 목표', value: '2% → 2.5%', trend: 'up' },
      { label: 'KTOS 수주 잔고', value: '$1.1B (+34%)', trend: 'up' },
      { label: '드론 시장 규모 (2030E)', value: '$58B', trend: 'up' },
    ],
    themes: [
      'NATO 32개국 방위비 GDP 2.5% 의무화 → 10년 수요 가시성 확보',
      'Loyal Wingman 드론 경쟁 — KTOS Valkyrie 핵심 수혜',
      '우크라이나 재건 + 방공망 현대화 수요',
      '우주/사이버 방어 예산 별도 확대',
      '방산 주문 리드타임 2~3년 → 수주잔고 = 미래 매출 가시성',
    ],
    googleNewsUrl: 'https://news.google.com/search?q=defense+spending+NATO+drone+military+budget',
    etfs: ['ITA', 'XAR', 'DFEN'],
    nextCatalysts: [
      'NOC/LMT/LHX/RTX Q1 실적 (2026.04)',
      'KTOS 국방부 드론 계약 발표',
      'NATO 정상회의 방위비 최종 합의 (2026.06)',
    ],
  },

  'pharma-biotech': {
    id: 'pharma-biotech',
    name: '제약 / 바이오',
    phase: 'GLP-1 메가트렌드 + AI 신약개발 + 저평가 바이오 기관 매집',
    keyData: [
      { label: 'GLP-1 시장 규모 (2030E)', value: '$150B', trend: 'up' },
      { label: 'mRNA 암백신 임상 성공률', value: '+49% 재발 위험 감소', trend: 'up' },
      { label: 'AI 신약개발 단계', value: '임상 2상 진입', trend: 'up' },
      { label: 'PFE/MRNA 52주 변화', value: '-30% ~ -45%', trend: 'down' },
    ],
    themes: [
      'Mounjaro/Wegovy — 비만·당뇨 넘어 심혈관·신장·NASH 적응증 확대',
      'Moderna mRNA-4157 암백신 — 흑색종 49% 재발 감소 (NEJM)',
      'REGN dupilumab 다적응증 확대 → 10조+ 매출 가시성',
      'PFE/MRNA 52주 저점 → 역발상 기관 매집 (Baillie Gifford, Fidelity)',
      'FDA 가속 심사 트랙으로 신약 허가 기간 단축',
    ],
    googleNewsUrl: 'https://news.google.com/search?q=GLP-1+obesity+drug+pharma+biotech+2026',
    etfs: ['XBI', 'IBB', 'PJP'],
    nextCatalysts: [
      'LLY Orforglipron(경구용 GLP-1) 3상 결과 (2026.Q2)',
      'MRNA 암백신 FDA BLA 제출 예정',
      'REGN EYLEA HD 유럽 허가 결과',
    ],
  },
};
