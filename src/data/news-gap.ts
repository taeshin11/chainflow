export interface NewsGapEntry {
  ticker: string;
  companyName: string;
  sector: string;
  ibActivityLevel: 'high' | 'medium' | 'low';
  ibActivityScore: number;
  mediaScore: number;
  gapScore: number;
  topInstitutions: string[];
  recentHeadlines: string[];
  ibActions: string[];
}

export const newsGapData: NewsGapEntry[] = [
  {
    ticker: 'ALB',
    companyName: 'Albemarle',
    sector: 'ev-battery',
    ibActivityLevel: 'high',
    ibActivityScore: 92,
    mediaScore: 8,
    gapScore: 95,
    topInstitutions: ['Point72 Asset Management', 'Millennium Management', 'Citadel Advisors'],
    recentHeadlines: ['Lithium prices remain depressed amid oversupply concerns'],
    ibActions: [
      'Point72 initiated $480M position in Q4 2025',
      'Millennium accumulated $320M over two quarters',
      'Citadel doubled position size quietly',
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
    recentHeadlines: ['Marvell reports inline Q3 results', 'Custom silicon market continues to grow'],
    ibActions: [
      'Tiger Global built $1.2B position over 3 quarters',
      'Coatue added $600M in Q4',
      'D1 Capital initiated new $400M position',
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
    recentHeadlines: ['Pentagon budget includes drone funding increase'],
    ibActions: [
      'Dragoneer built $200M position quietly',
      'Baillie Gifford accumulated over 6 months',
      'ARK added across multiple ETFs',
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
    recentHeadlines: [
      'TSMC reports record revenue on AI demand',
      'Taiwan tensions ease as diplomatic talks resume',
      'TSMC Arizona fab on track for 2025 production',
    ],
    ibActions: [
      'Capital Group added $1.6B in Q4 2025',
      'Berkshire maintained $5B+ position',
      'GIC increased stake by 15%',
    ],
  },
  {
    ticker: 'SMCI',
    companyName: 'Super Micro Computer',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 78,
    mediaScore: 65,
    gapScore: 22,
    topInstitutions: ['Vanguard', 'BlackRock', 'State Street'],
    recentHeadlines: [
      'SMCI resolves accounting concerns, maintains listing',
      'AI server demand continues to surge',
    ],
    ibActions: [
      'Vanguard index rebalance added shares',
      'BlackRock increased allocation',
      'Multiple hedge funds took new positions post-restatement',
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
    recentHeadlines: ['COVID vaccine demand continues to decline', 'Moderna stock hits 52-week low'],
    ibActions: [
      'Baillie Gifford doubled position near lows',
      'Fidelity accumulated $900M over two quarters',
      'Wellington initiated large position citing cancer vaccine pipeline',
    ],
  },
  {
    ticker: 'PLTR',
    companyName: 'Palantir Technologies',
    sector: 'ai-cloud',
    ibActivityLevel: 'medium',
    ibActivityScore: 65,
    mediaScore: 70,
    gapScore: 15,
    topInstitutions: ['ARK Invest', 'Vanguard', 'Norges Bank'],
    recentHeadlines: ['Palantir wins major Army contract', 'AIP platform drives commercial acceleration'],
    ibActions: [
      'ARK maintained large position',
      'Vanguard index inclusion added shares',
      'Some hedge funds trimmed after 300% run',
    ],
  },
  {
    ticker: 'NVDA',
    companyName: 'NVIDIA',
    sector: 'semiconductors',
    ibActivityLevel: 'high',
    ibActivityScore: 95,
    mediaScore: 98,
    gapScore: 5,
    topInstitutions: ['Vanguard', 'BlackRock', 'Goldman Sachs AM'],
    recentHeadlines: [
      'NVIDIA reports blowout earnings, beats on every metric',
      'Jensen Huang keynote reveals next-gen Rubin architecture',
      'NVIDIA becomes world\'s most valuable company',
    ],
    ibActions: [
      'Goldman Sachs added $3.8B in Q4',
      'Universal accumulation across all major funds',
      'Hedge fund positioning at all-time highs',
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
    recentHeadlines: ['Mounjaro demand continues to outstrip supply', 'Eli Lilly raises full-year guidance again'],
    ibActions: [
      'Capital Research accumulated through multiple funds',
      'T. Rowe Price increased conviction position',
      'Wellington added on pullbacks',
    ],
  },
  {
    ticker: 'ENPH',
    companyName: 'Enphase Energy',
    sector: 'ev-battery',
    ibActivityLevel: 'medium',
    ibActivityScore: 70,
    mediaScore: 25,
    gapScore: 65,
    topInstitutions: ['Viking Global', 'Lone Pine Capital', 'Dragoneer'],
    recentHeadlines: ['Solar installations slow amid high interest rates'],
    ibActions: [
      'Viking Global initiated $300M position',
      'Lone Pine accumulated over 2 quarters',
      'Multiple funds building positions near 52-week lows',
    ],
  },
];
