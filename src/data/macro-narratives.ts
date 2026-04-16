/**
 * Macro Narrative themes — the structural forces behind smart money flows.
 * Static definitions + AI-generated analysis (from generated/narratives.json).
 */

export interface MacroNarrative {
  id: string;
  title: string;
  titleKo: string;
  category: 'power-structure' | 'monetary' | 'geopolitical' | 'information' | 'regulatory';
  summary: string;
  summaryKo: string;
  icon: string; // lucide icon name
  color: string; // tailwind color class
  relatedTickers: string[];
  relatedSectors: string[];
  blogSlug?: string;
  keyConceptsEn: string[];
}

export const macroNarratives: MacroNarrative[] = [
  {
    id: 'regulatory-capture',
    title: 'Regulatory Capture',
    titleKo: '규제 포획',
    category: 'regulatory',
    summary: 'How powerful entities design legislation to entrench their advantage — turning regulators into protectors of incumbents.',
    summaryKo: '강력한 기업들이 입법을 자신에게 유리하게 설계하여 규제 기관을 경쟁자로부터의 보호막으로 전환하는 구조.',
    icon: 'Scale',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    relatedTickers: ['LMT', 'NOC', 'GD', 'JPM', 'GS', 'PFE', 'UNH'],
    relatedSectors: ['defense', 'financials', 'healthcare'],
    blogSlug: 'regulatory-capture-how-power-shapes-markets',
    keyConceptsEn: ['Revolving door', 'Regulatory moat', 'Lobbying spend', 'Barrier to entry', 'Tax haven'],
  },
  {
    id: 'cantillon-effect',
    title: 'Cantillon Effect & QE',
    titleKo: '칸티용 효과 & 양적완화',
    category: 'monetary',
    summary: 'New money benefits those closest to the source first. QE inflates assets held by the wealthy before wages catch up — a structural wealth transfer.',
    summaryKo: '새로 풀린 돈은 금융 시스템에 가장 가까이 있는 자들에게 먼저 혜택이 돌아간다. 양적완화는 임금보다 자산 가격을 먼저 올려 부의 불균형을 심화시킨다.',
    icon: 'TrendingUp',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    relatedTickers: ['BLK', 'JPM', 'GS', 'MS', 'AMT', 'PLD', 'EQIX'],
    relatedSectors: ['financials', 'real-estate'],
    blogSlug: 'cantillon-effect-qe-wealth-inequality',
    keyConceptsEn: ['Quantitative easing', 'Asset inflation', 'Wealth concentration', 'First-mover advantage', 'Federal Reserve'],
  },
  {
    id: 'dark-pools-hft',
    title: 'Dark Pools & HFT',
    titleKo: '다크풀 & 초고속 거래',
    category: 'information',
    summary: 'Institutional investors trade in shadow markets invisible to retail. HFT extracts value in microseconds. The game is rigged by design — and 13F filings are one of the few windows into their moves.',
    summaryKo: '기관 투자자들은 개인 투자자에게 보이지 않는 시장에서 거래한다. HFT는 마이크로초 단위로 가치를 추출한다. 13F 공시가 그 움직임을 들여다볼 수 있는 몇 안 되는 창구다.',
    icon: 'Eye',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    relatedTickers: ['GS', 'MS', 'ICE', 'COIN', 'SCHW'],
    relatedSectors: ['financials'],
    blogSlug: 'dark-pools-hft-wall-street-information-asymmetry',
    keyConceptsEn: ['Dark pool', 'High-frequency trading', 'Information asymmetry', '13F filing', 'Order flow'],
  },
  {
    id: 'revolving-door',
    title: 'The Revolving Door',
    titleKo: '회전문 인사',
    category: 'power-structure',
    summary: 'Former regulators become industry lobbyists. Former executives become policy makers. This structural relationship creates regulatory environments that systematically favor incumbents.',
    summaryKo: '전직 규제 기관 관료들이 산업 로비스트가 되고, 전직 임원들이 정책 입안자가 된다. 이 구조적 관계는 기존 기업들에게 체계적으로 유리한 규제 환경을 만든다.',
    icon: 'RefreshCw',
    color: 'text-red-600 bg-red-50 border-red-200',
    relatedTickers: ['GS', 'JPM', 'LMT', 'BAC', 'MS'],
    relatedSectors: ['financials', 'defense'],
    blogSlug: 'revolving-door-wall-street-government',
    keyConceptsEn: ['Regulatory capture', 'SEC revolving door', 'Too big to fail', 'Goldman alumni', 'Policy arbitrage'],
  },
  {
    id: 'military-industrial-complex',
    title: 'Military-Industrial Complex',
    titleKo: '군산복합체',
    category: 'geopolitical',
    summary: 'Eisenhower warned of it in 1961. Defense contractors, weapons manufacturers, and geopolitical crisis cycles create structural demand floors regardless of who governs.',
    summaryKo: '아이젠하워가 1961년에 경고했다. 방위산업체, 무기 제조사, 지정학적 위기 사이클은 누가 집권하든 구조적 수요 바닥을 만들어낸다.',
    icon: 'Shield',
    color: 'text-gray-700 bg-gray-50 border-gray-200',
    relatedTickers: ['LMT', 'NOC', 'GD', 'RTX', 'TDG', 'HII', 'LDOS'],
    relatedSectors: ['defense'],
    blogSlug: 'military-industrial-complex-supply-chain-wealth',
    keyConceptsEn: ['Defense budget', 'Sole-source contracts', 'Geopolitical crisis cycle', 'Aftermarket lock-in', 'Cost-plus contracts'],
  },
  {
    id: 'information-asymmetry',
    title: 'Macro Information Asymmetry',
    titleKo: '초거대 정보 비대칭',
    category: 'information',
    summary: 'Beyond insider trading — knowing the direction of policy, resource flows, and macro turning points before the market prices them in. Flowvium\'s news gap score quantifies this edge.',
    summaryKo: '단순한 내부자 거래를 넘어서 — 정책 방향, 자원 흐름, 매크로 변곡점을 시장이 반영하기 전에 먼저 아는 것. Flowvium의 News Gap Score는 이 정보 격차를 수치화한다.',
    icon: 'Radar',
    color: 'text-green-600 bg-green-50 border-green-200',
    relatedTickers: ['NVDA', 'TSM', 'MSFT', 'BLK', 'GS'],
    relatedSectors: ['semiconductors', 'ai-cloud', 'financials'],
    keyConceptsEn: ['News gap', '13F signal', 'Institutional front-running', 'Policy arbitrage', 'Supply chain intelligence'],
  },
  {
    id: 'sovereign-wealth-flows',
    title: 'Sovereign Wealth & State Capitalism',
    titleKo: '국부펀드 & 국가 자본주의',
    category: 'geopolitical',
    summary: 'Norway\'s $1.7T GPFG, Saudi Arabia\'s PIF, and China\'s CIC don\'t just invest — they shape industrial policy across continents. Understanding their flows reveals where governments think the next decade is heading.',
    summaryKo: '노르웨이의 $1.7조 GPFG, 사우디의 PIF, 중국의 CIC는 단순 투자가 아니라 대륙을 넘나드는 산업 정책을 형성한다. 이들의 자금 흐름을 이해하면 각국 정부가 다음 10년을 어떻게 보는지 알 수 있다.',
    icon: 'Globe',
    color: 'text-teal-600 bg-teal-50 border-teal-200',
    relatedTickers: ['NVDA', 'TSLA', 'MSFT', 'AAPL', 'ALB'],
    relatedSectors: ['semiconductors', 'ev-battery', 'ai-cloud'],
    keyConceptsEn: ['Sovereign wealth fund', 'State capitalism', 'Industrial policy', 'Strategic reserves', 'Geopolitical beta'],
  },
  {
    id: 'crisis-wealth-transfer',
    title: 'Crisis as Wealth Transfer Mechanism',
    titleKo: '위기를 통한 부의 이전',
    category: 'monetary',
    summary: 'Financial crises, pandemics, and wars are not just disasters — they are the moments when capital concentrates most rapidly. Those with access to cheap credit during the lows acquire assets that compound for decades.',
    summaryKo: '금융 위기, 팬데믹, 전쟁은 단순한 재앙이 아니다 — 자본이 가장 빠르게 집중되는 순간이다. 저점에서 저렴한 신용에 접근할 수 있는 자들이 수십 년간 복리로 불어나는 자산을 취한다.',
    icon: 'Zap',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    relatedTickers: ['BLK', 'JPM', 'GS', 'BRK.B', 'KKR'],
    relatedSectors: ['financials'],
    keyConceptsEn: ['Distressed assets', 'Helicopter money', 'Asset seizure at the lows', 'Private equity', 'Bailout economics'],
  },
];

export function getNarrativeById(id: string): MacroNarrative | undefined {
  return macroNarratives.find(n => n.id === id);
}

export function getNarrativesByTicker(ticker: string): MacroNarrative[] {
  return macroNarratives.filter(n => n.relatedTickers.includes(ticker.toUpperCase()));
}

export function getNarrativesBySector(sector: string): MacroNarrative[] {
  return macroNarratives.filter(n => n.relatedSectors.includes(sector));
}
