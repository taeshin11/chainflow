import { type NewsArticle } from '@/lib/alpha-vantage';

export interface NewsGapEntry {
  ticker: string;
  companyName: string;
  sector: string;
  ibActivityLevel: 'high' | 'medium' | 'low';
  ibActivityScore: number;
  /** Overridden at runtime by live Alpha Vantage data */
  mediaScore: number;
  /** Overridden at runtime by live Alpha Vantage data */
  gapScore: number;
  topInstitutions: string[];
  /** Overridden at runtime by live Alpha Vantage data (includes date + source) */
  recentArticles: NewsArticle[];
  ibActions: string[];
}

/**
 * Static institutional activity data sourced from 13F filings (updated quarterly).
 * mediaScore / gapScore / recentArticles are overridden by live Alpha Vantage data at request time.
 * Tickers match US_TICKERS_BY_PRIORITY in signals-service.ts (25 total).
 */
export const newsGapData: NewsGapEntry[] = [
  // ── Tier 1: Mid/small caps ──────────────────────────────────────────────────
  {
    ticker: 'MU',
    companyName: 'Micron Technology',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 83,
    mediaScore: 35,
    gapScore: 70,
    topInstitutions: ['BlackRock', 'Vanguard', 'Fidelity Management'],
    recentArticles: [
      { title: 'Micron beats Q1 estimates on HBM demand', date: 'Apr 2, 2026', source: 'Bloomberg', url: '' },
    ],
    ibActions: [
      'BlackRock added $2.1B position in Q4 2025',
      'Fidelity accumulated through index rebalance',
      'Multiple semiconductor-focused funds built positions citing HBM cycle',
      'Citadel disclosed new $340M stake in latest 13F',
    ],
  },
  {
    ticker: 'AMAT',
    companyName: 'Applied Materials',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 75,
    mediaScore: 32,
    gapScore: 72,
    topInstitutions: ['T. Rowe Price', 'Capital Research', 'Vanguard'],
    recentArticles: [
      { title: 'Applied Materials beats estimates on gate-all-around demand', date: 'Mar 20, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'T. Rowe Price increased semiconductor equipment exposure in Q4',
      'Capital Research built $800M position across multiple funds',
      'Multiple funds rotated into equipment names ahead of WFE upcycle',
      'Wellington Management initiated $450M new position',
    ],
  },
  {
    ticker: 'LRCX',
    companyName: 'Lam Research',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 74,
    mediaScore: 28,
    gapScore: 74,
    topInstitutions: ['Fidelity', 'Wellington Management', 'BlackRock'],
    recentArticles: [
      { title: 'Lam Research raises guidance on advanced packaging demand', date: 'Mar 15, 2026', source: 'Barron\'s', url: '' },
    ],
    ibActions: [
      'Fidelity added across growth and value funds in Q4 2025',
      'Wellington built $620M position citing WFE upcycle thesis',
      'BlackRock index addition added shares systematically',
      'Artisan Partners disclosed new position in latest 13F',
    ],
  },
  {
    ticker: 'KLAC',
    companyName: 'KLA Corporation',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 78,
    mediaScore: 25,
    gapScore: 75,
    topInstitutions: ['Artisan Partners', 'T. Rowe Price', 'Capital Group'],
    recentArticles: [
      { title: 'KLA process control revenue accelerates on advanced node ramp', date: 'Mar 10, 2026', source: 'Seeking Alpha', url: '' },
    ],
    ibActions: [
      'Artisan Partners doubled position in Q3 2025 — $880M total',
      'T. Rowe Price added $600M citing process control monopoly',
      'Capital Group initiated new $520M position',
      'Millennium Management added $280M in latest quarter',
    ],
  },
  {
    ticker: 'ALB',
    companyName: 'Albemarle',
    sector: 'ev-battery',
    ibActivityLevel: 'high',
    ibActivityScore: 92,
    mediaScore: 8,
    gapScore: 95,
    topInstitutions: ['Point72 Asset Management', 'Millennium Management', 'Citadel Advisors'],
    recentArticles: [
      { title: 'Lithium prices remain depressed amid oversupply concerns', date: 'Apr 1, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Point72 initiated $480M position in Q4 2025 — quietly accumulated',
      'Millennium accumulated $320M over two consecutive quarters',
      'Citadel doubled position size while media ignored the stock',
      'Dragoneer built $150M stake with no press coverage',
      'Renaissance Technologies increased allocation by 40%',
    ],
  },
  {
    ticker: 'KTOS',
    companyName: 'Kratos Defense',
    sector: 'defense',
    ibActivityLevel: 'high',
    ibActivityScore: 85,
    mediaScore: 5,
    gapScore: 92,
    topInstitutions: ['Dragoneer Investment', 'Baillie Gifford', 'ARK Invest'],
    recentArticles: [
      { title: 'Pentagon budget includes drone funding increase', date: 'Mar 25, 2026', source: 'Defense News', url: '' },
    ],
    ibActions: [
      'Dragoneer built $200M position quietly over 3 quarters',
      'Baillie Gifford accumulated over 6 months — $340M total',
      'ARK Invest added across multiple ETFs citing drone warfare thesis',
      'Coatue Management disclosed $120M stake in 13F filing',
    ],
  },
  {
    ticker: 'MRVL',
    companyName: 'Marvell Technology',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 88,
    mediaScore: 15,
    gapScore: 88,
    topInstitutions: ['Tiger Global', 'Coatue Management', 'D1 Capital'],
    recentArticles: [
      { title: 'Marvell custom silicon pipeline expands to four hyperscalers', date: 'Apr 8, 2026', source: 'The Information', url: '' },
    ],
    ibActions: [
      'Tiger Global built $1.2B position over 3 quarters — largest new bet',
      'Coatue added $600M in Q4 citing custom ASIC opportunity',
      'D1 Capital initiated new $400M position — first semi holding',
      'Viking Global added $310M stake in latest 13F',
    ],
  },
  {
    ticker: 'RTX',
    companyName: 'RTX Corporation',
    sector: 'defense',
    ibActivityLevel: 'medium',
    ibActivityScore: 71,
    mediaScore: 42,
    gapScore: 65,
    topInstitutions: ['Vanguard', 'State Street', 'Fidelity'],
    recentArticles: [
      { title: 'RTX wins $3B missile defense contract', date: 'Mar 28, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Vanguard index rebalance systematically increased allocation',
      'State Street defense ETF added shares on quarterly rebalance',
      'Fidelity defense thematic fund built $780M position',
      'Capital Research added $1.1B across multiple funds',
    ],
  },
  {
    ticker: 'NOC',
    companyName: 'Northrop Grumman',
    sector: 'defense',
    ibActivityLevel: 'high',
    ibActivityScore: 76,
    mediaScore: 38,
    gapScore: 68,
    topInstitutions: ['BlackRock', 'Capital Research', 'Dodge & Cox'],
    recentArticles: [
      { title: 'Northrop B-21 Raider production ramps ahead of schedule', date: 'Apr 5, 2026', source: 'Aviation Week', url: '' },
    ],
    ibActions: [
      'BlackRock defense ETF increased weighting to overweight',
      'Capital Research added $900M across 3 different funds',
      'Dodge & Cox built substantial $670M new position',
      'T. Rowe Price increased defense allocation to 5-year high',
    ],
  },
  {
    ticker: 'LHX',
    companyName: 'L3Harris Technologies',
    sector: 'defense',
    ibActivityLevel: 'medium',
    ibActivityScore: 72,
    mediaScore: 30,
    gapScore: 72,
    topInstitutions: ['Vanguard', 'Fidelity', 'State Street'],
    recentArticles: [
      { title: 'L3Harris wins electronic warfare systems contract', date: 'Mar 18, 2026', source: 'Defense News', url: '' },
    ],
    ibActions: [
      'Vanguard index allocation systematically increased',
      'Fidelity defense fund doubled position to $520M',
      'State Street added $340M on pullback',
      'Wellington Management disclosed new $290M stake',
    ],
  },
  {
    ticker: 'REGN',
    companyName: 'Regeneron Pharmaceuticals',
    sector: 'pharma-biotech',
    ibActivityLevel: 'high',
    ibActivityScore: 82,
    mediaScore: 20,
    gapScore: 80,
    topInstitutions: ['Baillie Gifford', 'Wellington Management', 'Capital Group'],
    recentArticles: [
      { title: 'Regeneron dupilumab approved for new indication', date: 'Apr 10, 2026', source: 'BioPharma Dive', url: '' },
    ],
    ibActions: [
      'Baillie Gifford maintained $1.8B conviction position unchanged',
      'Wellington added $1.1B in Q4 citing dupilumab multi-indication growth',
      'Capital Group accumulated $890M through pullbacks',
      'T. Rowe Price increased allocation to all-time high $650M',
    ],
  },
  {
    ticker: 'MRNA',
    companyName: 'Moderna',
    sector: 'pharma-biotech',
    ibActivityLevel: 'high',
    ibActivityScore: 80,
    mediaScore: 30,
    gapScore: 72,
    topInstitutions: ['Baillie Gifford', 'Fidelity', 'Wellington Management'],
    recentArticles: [
      { title: 'Moderna cancer vaccine shows 49% risk reduction in melanoma trial', date: 'Mar 30, 2026', source: 'NEJM', url: '' },
    ],
    ibActions: [
      'Baillie Gifford doubled position near multi-year lows — $1.4B total',
      'Fidelity accumulated $900M over two consecutive quarters',
      'Wellington initiated $780M position citing cancer vaccine pipeline',
      'ARK Invest maintained largest ETF position despite drawdown',
    ],
  },
  // ── Tier 2 ──────────────────────────────────────────────────────────────────
  {
    ticker: 'PFE',
    companyName: 'Pfizer',
    sector: 'pharma-biotech',
    ibActivityLevel: 'medium',
    ibActivityScore: 68,
    mediaScore: 55,
    gapScore: 45,
    topInstitutions: ['Vanguard', 'BlackRock', 'State Street'],
    recentArticles: [
      { title: 'Pfizer oncology pipeline advances to Phase 3', date: 'Apr 3, 2026', source: 'Reuters', url: '' },
      { title: 'Pfizer raises full-year guidance on cost cuts', date: 'Mar 22, 2026', source: 'Bloomberg', url: '' },
    ],
    ibActions: [
      'Major index funds maintained large positions at multi-year lows',
      'Capital Research increased stake — contrarian value thesis',
      'Dodge & Cox added $1.2B citing pipeline de-risking',
      'Causeway Capital initiated new $450M position',
    ],
  },
  {
    ticker: 'ORCL',
    companyName: 'Oracle',
    sector: 'ai-cloud',
    ibActivityLevel: 'medium',
    ibActivityScore: 70,
    mediaScore: 48,
    gapScore: 52,
    topInstitutions: ['Capital Research', 'T. Rowe Price', 'Primecap Management'],
    recentArticles: [
      { title: 'Oracle cloud revenue surges 24% on AI workload demand', date: 'Apr 7, 2026', source: 'CNBC', url: '' },
    ],
    ibActions: [
      'Capital Research added $1.4B on cloud acceleration thesis',
      'T. Rowe Price initiated tech value position — $680M',
      'Primecap built $520M position citing AI infrastructure tailwinds',
      'Sequoia added to position amid multi-cloud adoption surge',
    ],
  },
  {
    ticker: 'NVO',
    companyName: 'Novo Nordisk',
    sector: 'pharma-biotech',
    ibActivityLevel: 'high',
    ibActivityScore: 84,
    mediaScore: 62,
    gapScore: 38,
    topInstitutions: ['Capital Group', 'Wellington Management', 'Baillie Gifford'],
    recentArticles: [
      { title: 'Novo Nordisk semaglutide cardiovascular data redefines obesity treatment', date: 'Apr 9, 2026', source: 'The Lancet', url: '' },
      { title: 'NVO raises Wegovy capacity forecast by 40%', date: 'Mar 14, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Capital Group maintained largest ex-Denmark position — $4.2B',
      'Wellington added $1.6B on GLP-1 total addressable market expansion',
      'Baillie Gifford cited 10-year obesity treatment opportunity',
      'Fidelity Contrafund built $1.1B position in latest quarter',
    ],
  },
  {
    ticker: 'TSM',
    companyName: 'TSMC',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 82,
    mediaScore: 42,
    gapScore: 45,
    topInstitutions: ['Capital Group', 'Berkshire Hathaway', 'GIC Singapore'],
    recentArticles: [
      { title: 'TSMC reports record revenue on AI demand', date: 'Apr 11, 2026', source: 'Reuters', url: '' },
      { title: 'TSMC Arizona fab on track for 2nm production', date: 'Mar 27, 2026', source: 'Bloomberg', url: '' },
    ],
    ibActions: [
      'Capital Group added $1.6B in Q4 2025 — largest semi position',
      'Berkshire Hathaway maintained $5B+ long-term strategic position',
      'GIC Singapore increased stake by 15% in latest 13F',
      'Fisher Investments added $890M on AI semiconductor cycle thesis',
    ],
  },
  {
    ticker: 'ASML',
    companyName: 'ASML Holding',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 79,
    mediaScore: 25,
    gapScore: 75,
    topInstitutions: ['Capital Research', 'Baillie Gifford', 'Norges Bank'],
    recentArticles: [
      { title: 'ASML High-NA EUV orders accelerate from memory customers', date: 'Mar 12, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Capital Research built $2.2B position citing EUV monopoly moat',
      'Baillie Gifford added to 8-year long-term holding',
      'Norges Bank increased allocation to 1.8% of sovereign fund',
      'Wellington Management initiated $750M position in latest 13F',
    ],
  },
  // ── Tier 3: Large caps ──────────────────────────────────────────────────────
  {
    ticker: 'NVDA',
    companyName: 'NVIDIA',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 95,
    mediaScore: 98,
    gapScore: 5,
    topInstitutions: ['Vanguard', 'BlackRock', 'Goldman Sachs AM'],
    recentArticles: [
      { title: 'NVIDIA reports blowout earnings, beats on every metric', date: 'Apr 12, 2026', source: 'Bloomberg', url: '' },
      { title: 'Jensen Huang keynote reveals next-gen Rubin architecture', date: 'Apr 8, 2026', source: 'The Verge', url: '' },
    ],
    ibActions: [
      'Goldman Sachs added $3.8B in Q4 — across all portfolios',
      'Universal accumulation across every major institutional fund',
      'Hedge fund positioning at all-time highs per 13F aggregate',
      'Vanguard maintains $180B+ position as largest holder',
    ],
  },
  {
    ticker: 'MSFT',
    companyName: 'Microsoft',
    sector: 'ai-cloud',
    ibActivityLevel: 'high',
    ibActivityScore: 88,
    mediaScore: 90,
    gapScore: 10,
    topInstitutions: ['Vanguard', 'BlackRock', 'Capital Research'],
    recentArticles: [
      { title: 'Microsoft Copilot drives Azure growth acceleration', date: 'Apr 10, 2026', source: 'CNBC', url: '' },
      { title: 'Microsoft raises dividend by 10%, buyback $60B', date: 'Apr 3, 2026', source: 'WSJ', url: '' },
    ],
    ibActions: [
      'Vanguard maintains largest position — $180B+ across all funds',
      'BlackRock systematically increased via all index rebalances',
      'Capital Research added $4B citing Copilot AI monetization',
      'T. Rowe Price increased to top-3 holding',
    ],
  },
  {
    ticker: 'GOOGL',
    companyName: 'Alphabet',
    sector: 'ai-cloud',
    ibActivityLevel: 'high',
    ibActivityScore: 87,
    mediaScore: 88,
    gapScore: 12,
    topInstitutions: ['Vanguard', 'BlackRock', 'T. Rowe Price'],
    recentArticles: [
      { title: 'Google Gemini integration boosts search monetization', date: 'Apr 9, 2026', source: 'Reuters', url: '' },
      { title: 'Alphabet announces $70B buyback program', date: 'Mar 30, 2026', source: 'Bloomberg', url: '' },
    ],
    ibActions: [
      'Vanguard maintains $140B+ position across index funds',
      'BlackRock increased weight in all growth portfolios',
      'T. Rowe Price added $2.1B on AI search narrative',
      'Fidelity Growth Company doubled Alphabet allocation',
    ],
  },
  {
    ticker: 'META',
    companyName: 'Meta Platforms',
    sector: 'ai-cloud',
    ibActivityLevel: 'high',
    ibActivityScore: 90,
    mediaScore: 85,
    gapScore: 15,
    topInstitutions: ['Vanguard', 'Fidelity', 'Capital Group'],
    recentArticles: [
      { title: 'Meta Llama 4 outperforms GPT-4 on key benchmarks', date: 'Apr 11, 2026', source: 'TechCrunch', url: '' },
      { title: 'Meta advertising revenue beats by 8%, raises guidance', date: 'Apr 5, 2026', source: 'Bloomberg', url: '' },
    ],
    ibActions: [
      'Vanguard index holdings at all-time highs via rebalancing',
      'Fidelity Contrafund added $2.4B on advertising recovery',
      'Capital Group increased to top-5 holding — $6.1B total',
      'D1 Capital built new $890M position on AI revenue thesis',
    ],
  },
  {
    ticker: 'AMZN',
    companyName: 'Amazon',
    sector: 'ai-cloud',
    ibActivityLevel: 'high',
    ibActivityScore: 91,
    mediaScore: 82,
    gapScore: 18,
    topInstitutions: ['Vanguard', 'BlackRock', 'Fidelity'],
    recentArticles: [
      { title: 'AWS revenue grows 37% as enterprise AI migration accelerates', date: 'Apr 13, 2026', source: 'CNBC', url: '' },
      { title: 'Amazon raises Prime membership pricing in 12 markets', date: 'Apr 2, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Vanguard maintains $220B+ position as #1 external holder',
      'BlackRock growth funds increased allocation to 5-year high',
      'Universal institutional accumulation on AWS AI growth thesis',
      'Capital Group added $3.2B in latest quarter',
    ],
  },
  {
    ticker: 'TSLA',
    companyName: 'Tesla',
    sector: 'ev-battery',
    ibActivityLevel: 'medium',
    ibActivityScore: 76,
    mediaScore: 80,
    gapScore: 20,
    topInstitutions: ['Vanguard', 'BlackRock', 'ARK Invest'],
    recentArticles: [
      { title: 'Tesla FSD v13 approval pending in EU', date: 'Apr 7, 2026', source: 'Electrek', url: '' },
      { title: 'Tesla Cybertruck ramp accelerates in Q1', date: 'Mar 25, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'ARK Invest maintains largest conviction position — $2.1B',
      'Vanguard index adds on S&P 500 weighting rebalance',
      'BlackRock ETF added shares on quarterly rebalance',
      'Some value funds reduced on valuation concerns — net neutral',
    ],
  },
  {
    ticker: 'LLY',
    companyName: 'Eli Lilly',
    sector: 'pharma-biotech',
    ibActivityLevel: 'high',
    ibActivityScore: 88,
    mediaScore: 75,
    gapScore: 20,
    topInstitutions: ['Capital Research', 'T. Rowe Price', 'Wellington'],
    recentArticles: [
      { title: 'Mounjaro demand continues to outstrip supply globally', date: 'Apr 11, 2026', source: 'Bloomberg', url: '' },
      { title: 'Eli Lilly raises full-year guidance for third time', date: 'Apr 4, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Capital Research accumulated $4.8B through multiple fund vehicles',
      'T. Rowe Price increased conviction position to $3.2B',
      'Wellington Management added $2.1B on pullbacks',
      'Fidelity Contrafund quadrupled position over 18 months',
    ],
  },
  {
    ticker: 'LMT',
    companyName: 'Lockheed Martin',
    sector: 'defense',
    ibActivityLevel: 'medium',
    ibActivityScore: 73,
    mediaScore: 45,
    gapScore: 60,
    topInstitutions: ['Vanguard', 'State Street', 'Capital Research'],
    recentArticles: [
      { title: 'Lockheed F-35 production milestone reached — 1000th jet', date: 'Apr 6, 2026', source: 'Defense News', url: '' },
      { title: 'Lockheed wins $12B hypersonic weapons contract', date: 'Mar 20, 2026', source: 'Reuters', url: '' },
    ],
    ibActions: [
      'Vanguard defense ETF increased allocation to overweight',
      'Capital Research added $1.3B on defense budget growth thesis',
      'State Street maintains core index position — $3.8B',
      'Dodge & Cox initiated new value position at multi-year discount',
    ],
  },
];
