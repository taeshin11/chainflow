export type UpdateType = 'disruption' | 'expansion' | 'partnership' | 'risk' | 'opportunity';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface SupplyChainUpdate {
  date: string;
  type: UpdateType;
  title: string;
  detail: string;
  impact: ImpactLevel;
}

const typeLabels: Record<UpdateType, string> = {
  disruption: '⚠ 공급 차질',
  expansion: '↑ 생산 확대',
  partnership: '🤝 파트너십',
  risk: '⚡ 리스크',
  opportunity: '★ 기회',
};

export { typeLabels };

export const companySupplyChainUpdates: Record<string, SupplyChainUpdate[]> = {
  NVDA: [
    {
      date: '2026-04',
      type: 'disruption',
      title: 'GB300 CoWoS 패키징 병목 지속',
      detail: 'TSMC CoWoS-L 캐파 확충에도 GB300 수요가 공급을 3~4배 초과. Blackwell 출하 대기 기간 14~18주로 연장.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '멕시코 조립라인 추가 — 미국 수출 관세 회피',
      detail: 'Foxconn·Flextronics와 협력, 멕시코 과달라하라에 AI 서버 최종조립 라인 확충. USMCA 적용으로 관세 25% 회피.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '中 수출통제 강화 — H20 추가 제한 우려',
      detail: '미 상무부, H20 칩 대중 수출 추가 제한 검토 중. NVDA 중국 매출 비중 약 13%로 하향 리스크.',
      impact: 'medium',
    },
  ],

  TSMC: [
    {
      date: '2026-04',
      type: 'expansion',
      title: '애리조나 N2 팹 2026H2 가동 목표',
      detail: '피닉스 N2 공정 팹 착공 완료, 2026 하반기 시험 생산. Apple·NVDA·AMD 조기 물량 확보 협상 중.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'disruption',
      title: '구마모토(일본) N16 팹 인력 부족',
      detail: '일본 팹 현지 엔지니어 확보 난항으로 초기 가동률 55% 수준. 완전 가동 시점 6개월 지연 가능성.',
      impact: 'medium',
    },
    {
      date: '2026-02',
      type: 'opportunity',
      title: 'CoWoS 월 생산능력 3만 장→5만 장 목표',
      detail: 'AI GPU 패키징 병목 해소 위해 CoWoS 캐파 확대 투자. 2026H2 완료 시 NVDA·AMD 공급 대기 기간 단축 기대.',
      impact: 'high',
    },
  ],

  AMAT: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'GAA 공정 전환 — 장비 수주 급증',
      detail: 'Intel 18A·TSMC N2 GAA 전환 본격화로 Epi·이온주입 장비 주문 폭증. 수주잔고 분기 대비 +22% 증가.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '인도 푸네 R&D센터 확장',
      detail: '반도체 장비 소프트웨어·AI 진단 모듈 개발 인력 1,200명 추가 채용. 미국 이외 엔지니어링 허브 강화.',
      impact: 'low',
    },
  ],

  LRCX: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'HBM 식각 장비 점유율 확대',
      detail: 'SK하이닉스 HBM4 라인 증설에 Lam 식각 장비 독점 공급. HBM 관련 매출 2026FY 30% 이상 성장 전망.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '中 선진 장비 수출통제 영향 확인',
      detail: '중국향 매출 비중 26%로 하락 (전년 32%). 미국 수출통제 강화로 중국 매출 구조적 감소 불가피.',
      impact: 'medium',
    },
  ],

  KLAC: [
    {
      date: '2026-04',
      type: 'expansion',
      title: '2nm 계측 장비 단독 수주 확대',
      detail: 'N2/N2P 공정 결함 검사 솔루션 수주 집중. 경쟁사 대비 기술 격차로 고객 대체 어려워 ASP 프리미엄 유지.',
      impact: 'high',
    },
  ],

  MU: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'HBM3e 8단 양산 — NVDA GB200 독점 공급',
      detail: 'Micron HBM3e 8Hi NVDA에 단독 공급 개시. 삼성·SK하이닉스 대비 저전력·고성능으로 설계 인증 완료.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '아이다호 팹 투자 $15B — CHIPS법 보조금 수령',
      detail: '미국 상무부 CHIPS법 보조금 $6.1B 확정. 아이다호 보이시 DRAM 팹 건설 착공, 2028년 양산 목표.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '中 사이버보안 심사 후속 우려',
      detail: '중국 정부 Micron 제품 구매 제한 일부 유지 중. 중국 DRAM 대체품 부재로 실질 영향 제한적.',
      impact: 'low',
    },
  ],

  ASML: [
    {
      date: '2026-04',
      type: 'disruption',
      title: 'High-NA EUV 납기 연장 — 수요 초과',
      detail: 'High-NA EUV(TWINSCAN EXE:5000) 고객 수요가 2026 생산 캐파 초과. TSMC·인텔 2027년 배정분 재협상.',
      impact: 'medium',
    },
    {
      date: '2026-03',
      type: 'risk',
      title: '네덜란드 對中 EUV 수출허가 재검토',
      detail: '네덜란드 정부 기존 DUV 장비(NXT:2050i 등) 추가 수출허가 제한 가능성 논의. 중국 매출 영향 우려.',
      impact: 'medium',
    },
  ],

  NVDA_alt: [],

  ALB: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: '리튬 현물가 바닥 신호 — 기관 매집 포착',
      detail: '탄산리튬 $11/kg 근방에서 BlackRock·Vanguard 비중 확대 13F 신규 포착. 2026H2 반등 기대.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'disruption',
      title: '칠레 아타카마 염호 생산량 축소',
      detail: '환경 규제 강화로 칠레 정부 추출 허가 조건 강화. 2026년 생산 목표치 10% 하향 조정.',
      impact: 'medium',
    },
  ],

  KTOS: [
    {
      date: '2026-04',
      type: 'expansion',
      title: '국방부 Valkyrie UCAV 추가 계약 $380M',
      detail: '미 공군 Loyal Wingman 프로그램 Valkyrie 40기 추가 발주. 계약 규모 YTD $680M으로 수주잔고 사상 최대.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'partnership',
      title: 'L3Harris와 전자전 시스템 공동개발',
      detail: '소형 드론 탑재 전자전(EW) 모듈 공동 개발 계약. KTOS 드론 플랫폼 + L3Harris EW 기술 결합.',
      impact: 'medium',
    },
  ],

  MRVL: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'AWS Trainium3 커스텀칩 공동설계 공시',
      detail: 'Amazon AWS Trainium3 AI 칩 설계·공급 파트너로 MRVL 선정 공식화. 2026H2 양산, 연간 $1.5B+ 매출 기여 전망.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '5nm 맞춤형 ASIC 설계센터 싱가포르 개설',
      detail: '하이퍼스케일러 AI 칩 설계 수요 대응 위해 싱가포르 R&D 허브 확장. 엔지니어 600명 추가 채용.',
      impact: 'low',
    },
  ],

  RTX: [
    {
      date: '2026-04',
      type: 'disruption',
      title: 'GTF 엔진 파우더 메탈 교체 — 비용 $3B 초과',
      detail: 'Pratt & Whitney GTF 엔진 파우더메탈 결함 교체 작업 지속. 총 비용 $3B+ 예상, 항공사 보상 협상 진행 중.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: 'Patriot PAC-3 미사일 생산 2배 증설',
      detail: 'NATO 방공 수요 급증으로 PAC-3 MSE 연간 생산 500기→1,000기 목표. Lockheed와 공급망 공동 확충.',
      impact: 'high',
    },
  ],

  NOC: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'B-21 Raider 초도 배치 계획 확정',
      detail: '미 공군 B-21 스텔스폭격기 초도 작전 배치 일정 확정. NOC 연간 생산 6대→10대로 가속화, 수주 $20B+ 확보.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '우주 분야 공급망 티타늄 조달 지연',
      detail: '러시아産 티타늄 대체 공급망 구축 중이나 단가 35% 상승. 위성·미사일 프로그램 원가 압박 요인.',
      impact: 'medium',
    },
  ],

  LHX: [
    {
      date: '2026-03',
      type: 'partnership',
      title: 'L3Harris·Aerojet — 차세대 전술 미사일 공동개발',
      detail: '미 육군 PrSM Increment 2 프로그램 계약 수주. 사거리 연장형 정밀 타격 미사일 2028년 전력화 목표.',
      impact: 'high',
    },
  ],

  REGN: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'Dupixent 적응증 10개 돌파 — 최대 블록버스터 예약',
      detail: 'COPD 추가 FDA 승인으로 Dupixent 총 적응증 10개. 2030년 $20B 매출 전망으로 글로벌 최대 단일 의약품 등극 예상.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '아일랜드 리머릭 바이오 제조시설 확충',
      detail: 'Dupixent 수요 급증 대비 아일랜드 공장 bioreactor 20만리터 추가. 2027년 완공, 생산 병목 해소.',
      impact: 'medium',
    },
  ],

  MRNA: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'mRNA-4157 암백신 FDA 우선심사 신청',
      detail: 'Merck와 공동 개발 mRNA-4157/V940 흑색종 보조요법 BLA 제출 예정. 우선심사 적용 시 2026H2 승인 가능.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'risk',
      title: 'RSV 백신 경쟁 심화 — 매출 전망 하향',
      detail: 'Pfizer·GSK RSV 백신 시장 공유로 MRNA RSV 점유율 17%에 그침. 2026 RSV 매출 가이던스 하향 조정.',
      impact: 'medium',
    },
  ],

  PFE: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: '비만약 Danuglipron 2상 결과 긍정적',
      detail: '경구용 GLP-1 Danuglipron 2상 체중감소 효과 확인. LLY Orforglipron 대비 1일 2회 투여 단점 있으나 개선 중.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'disruption',
      title: '코로나 의약품 수요 급감 — 구조조정 진행',
      detail: 'Paxlovid·Comirnaty 매출 급감으로 $4B 비용 절감 프로그램 실행. 연구직 포함 2,000명 감원 진행.',
      impact: 'medium',
    },
  ],

  ORCL: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'OCI 데이터센터 100개국 확장 계획 발표',
      detail: 'Oracle Cloud Infrastructure 전 세계 100개 리전 확장 목표. NVDA H100 클러스터 10만개 규모 확보 계약.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'partnership',
      title: 'OpenAI·Microsoft와 경쟁 — Stargate 클라우드 공급',
      detail: '미국 Stargate AI 인프라 프로젝트 OCI 공급 파트너 확정. $50B 규모 계약 중 ORCL 분담분 $10B+.',
      impact: 'high',
    },
  ],

  NVO: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'Wegovy 생산 캐파 2배 증설 완료',
      detail: '덴마크·미국·프랑스 3개 공장 증설 완료로 Wegovy 공급 부족 해소. 2026Q2부터 대기 처방 소화 본격화.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'opportunity',
      title: 'Amycretin(GLP-1+GIP) 3상 진입 — 차세대 파이프라인',
      detail: '주1회 경구 복합제 Amycretin 3상 진입. 체중감소 효과 Wegovy 대비 +5%p 기대, 2028년 허가 목표.',
      impact: 'high',
    },
  ],

  LLY: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'Orforglipron 3상 긍정 예비 결과',
      detail: '경구 GLP-1 Orforglipron 3상 체중감소 -15.6% 확인. 주사 Wegovy와 동등 수준. 2027 허가 목표로 NDA 준비.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '인디애나 제조시설 $9B 투자 확정',
      detail: 'GLP-1 원료의약품(API) 수급 안정을 위해 미국 내 자체 생산 투자. CDMO 의존도 50%→30% 목표.',
      impact: 'high',
    },
  ],

  TSM: [
    {
      date: '2026-04',
      type: 'expansion',
      title: '애리조나 N3 공정 2026H1 시험생산',
      detail: 'Phoenix Fab 21 N3 공정 시험 웨이퍼 투입 시작. Apple A20 칩 우선 배정, 연간 6만 장 캐파 목표.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '대만 지진 리스크 — 글로벌 반도체 단일 공급 취약성',
      detail: '4월 규모 6.2 지진 발생, 팹 피해 없었으나 공급망 집중 리스크 재부각. 고객사 재고 확보 요구 강화.',
      impact: 'medium',
    },
  ],

  NVDA2: [],

  MSFT: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'AI Copilot M365 기업 시트 5,000만 돌파',
      detail: 'Microsoft 365 Copilot 기업 고객 시트 5천만 돌파. 월 $30 부가 구독 ARR $18B 수준으로 성장.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: 'Azure AI 인프라 $80B 투자 집행 중',
      detail: '2026년 Azure 데이터센터·NVDA GPU 구매에 $80B 투자 계획 집행. Wisconsin·영국·인도 신규 리전 착공.',
      impact: 'high',
    },
  ],

  GOOGL: [
    {
      date: '2026-04',
      type: 'risk',
      title: 'DOJ 검색엔진 독점 구제안 심의 중',
      detail: '연방법원 구글 검색 독점 판결 후 구제 명령 심의. 크롬 분리매각 요구 가능성 — 주가 변동성 요인.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: 'TPU v6(Trillium) 자체 AI칩 생산 확대',
      detail: '구글 자체 AI 학습용 TPU v6 TSMC N3 공정으로 생산 확대. NVDA GPU 의존도 감소 전략 가속.',
      impact: 'medium',
    },
  ],

  META: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'MTIA v2 맞춤 AI칩 — 추론 인프라 전환',
      detail: '메타 자체 AI 추론칩 MTIA v2 대규모 배포 시작. 전체 AI 추론 워크로드 60% 자체칩으로 처리 목표.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'opportunity',
      title: 'Llama 4 오픈소스 공개 — 생태계 확장',
      detail: 'Llama 4 멀티모달 모델 오픈소스 공개. 엔터프라이즈 채택 급증으로 Meta AI 플랫폼 점유율 확대.',
      impact: 'medium',
    },
  ],

  AMZN: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'Trainium3 칩 2026H2 AWS 전면 배포',
      detail: 'Amazon 자체 AI 학습칩 Trainium3 클러스터 AWS 상용화. NVDA H100 대비 40% 비용 절감 효과 내부 검증.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'disruption',
      title: '물류 자동화 로봇 공급 병목',
      detail: '창고 자동화 로봇(Sparrow·Cardinal) 수요 급증으로 공급망 병목. 신규 풀필먼트 센터 가동 3~6개월 지연.',
      impact: 'low',
    },
  ],

  TSLA: [
    {
      date: '2026-04',
      type: 'risk',
      title: '미국·유럽 브랜드 이미지 훼손 — 판매 부진',
      detail: '머스크 정치 논란으로 유럽 분기 판매 -13% YoY. 독일·노르웨이·스웨덴 등 전통 강세 시장 점유율 하락.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: 'Cybercab 로보택시 텍사스 상업 운행 개시',
      detail: '텍사스 오스틴 Cybercab 무인 로보택시 서비스 정식 허가 취득. 초기 100대 배치, 2026H2 500대 확대.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'disruption',
      title: '중국 BYD 가격 전쟁 — 모델 Y 마진 압박',
      detail: 'BYD Seal·Han 공격적 가격 인하로 중국 시장 점유율 방어 위해 추가 인하 불가피. 중국 GPM 7%p 하락.',
      impact: 'high',
    },
  ],

  FSLR: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'IRA 국내 제조 보너스 유지 — 대규모 수주 확대',
      detail: 'IRA Section 45X 세액공제 지속으로 FSLR 모듈 당 $0.17 제조 크레딧 확보. 국내산 우선 조달 조건 프로젝트 수주 급증, 수주잔고 $21B 돌파.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '오하이오 Series 7 팹 생산능력 1GW 추가 증설',
      detail: '오하이오 페리스버그 팹 증설 완료로 연간 생산능력 12GW로 확대. 인도 팹(2GW) 2026년 말 가동 예정.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '카드뮴 텔루라이드 원자재 공급 리스크 부상',
      detail: '텔루르 세계 공급의 75%가 중국산. 미·중 무역 마찰 심화로 CdTe 원료 수입 제한 가능성 우려 제기.',
      impact: 'medium',
    },
  ],

  ALB_batch6: [
    {
      date: '2026-04',
      type: 'disruption',
      title: '리튬 가격 $10/kg 하회 — 수익성 악화',
      detail: '탄산리튬 현물가 지속 하락으로 2026Q1 에너지 스토리지 부문 EBITDA 마진 -3%p 감소. 킹스마운틴 광산 착공 일정 재검토.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '미국 킹스마운틴 스포듀민 광산 개발 재개',
      detail: '노스캐롤라이나 킹스마운틴 하드록 리튬 광산 개발 재개 결정. 2028년 생산 목표로 $1.3B 투자 계획 승인.',
      impact: 'medium',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '중국산 배터리 업체 수직 계열화 — 리튬 외부 구매 축소',
      detail: 'CATL·BYD 자체 리튬 광산 보유 확대로 외부 구매 감소. 한국·일본 배터리 업체 의존도 높아지는 구조적 변화.',
      impact: 'medium',
    },
  ],

  FCX: [
    {
      date: '2026-04',
      type: 'opportunity',
      title: 'AI 데이터센터·전력망 구리 수요 급증 — 가격 반등',
      detail: '미국 전력망 현대화 및 AI 데이터센터 구리 배선 수요로 구리 LME 가격 $10,500/톤 돌파. FCX Grasberg 추가 채굴 허가 신청.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: '인도네시아 Grasberg 광산 지하 채굴 램프업',
      detail: 'Grasberg 지하 DMLZ·GBC 광구 풀 생산 돌입. 2026년 구리 생산 목표 39만 톤으로 +8% YoY 상향.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: '인도네시아 광산 수출 면허 갱신 협상 진행 중',
      detail: '인도네시아 정부 FCX 현지 정련 의무 비율 상향 요구. 수출 면허 조건 강화 협상 장기화 시 단기 출하 차질 우려.',
      impact: 'medium',
    },
  ],

  SMCI: [
    {
      date: '2026-04',
      type: 'disruption',
      title: '회계 재작성·감사 지연 — 투자자 신뢰 회복 과제',
      detail: '외부 감사인 Ernst & Young 사임 후 BDO로 교체. 2025 회계연도 재무제표 재작성 완료 및 나스닥 상장 유지 확인. 감독 리스크 프리미엄 지속.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'expansion',
      title: 'NVIDIA Blackwell GB200 NVL72 랙 독점 공급 확대',
      detail: 'SMCI 직접 액체냉각(DLC) 랙 시스템에 NVIDIA GB200 NVL72 탑재 버전 양산 개시. 마이크로소프트·CoreWeave 초도 물량 $3.2B 수주.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: 'Dell·HPE 경쟁 심화 — AI 서버 마진 압박',
      detail: 'Dell PowerEdge AI 및 HPE ProLiant 가격 인하 공세로 SMCI 평균 판매단가 2026Q1 -4% 하락. 고마진 DLC 특화 제품 비중 확대 전략으로 대응.',
      impact: 'medium',
    },
  ],

  ISRG: [
    {
      date: '2026-04',
      type: 'expansion',
      title: 'da Vinci 5 시스템 설치 가속 — 글로벌 9,500대 돌파',
      detail: '2026Q1 신규 da Vinci 5 설치 대수 412대로 분기 최고치. 총 설치 기반 9,500대 돌파로 소모품 매출 기반 확대.',
      impact: 'high',
    },
    {
      date: '2026-03',
      type: 'opportunity',
      title: 'CMS 로봇 수술 별도 수가 신설 — 미국 수요 촉진',
      detail: '미국 CMS가 로봇 보조 수술(da Vinci 포함)에 별도 기술료 가산 수가 도입. 병원 투자 회수 기간 단축으로 신규 시스템 구매 가속 예상.',
      impact: 'high',
    },
    {
      date: '2026-02',
      type: 'risk',
      title: 'Medtronic Hugo·J&J Ottava 경쟁 확대 우려',
      detail: 'Medtronic Hugo CE 마크 취득 후 유럽 공략 본격화. J&J Ottava 미국 FDA 심사 진입. 연성 조직 수술 시장 점유율 방어 비용 증가 전망.',
      impact: 'medium',
    },
  ],
};
