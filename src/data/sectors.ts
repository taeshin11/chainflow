export interface Sector {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  companyCount: number;
  leaderTicker: string;
}

export const sectors: Sector[] = [
  {
    id: "semiconductors",
    name: "Semiconductors",
    description:
      "The foundational hardware layer powering AI, mobile, automotive, and cloud computing. Spans chip designers (NVIDIA), foundries (TSMC), memory makers (SK Hynix, Samsung, Micron), and equipment suppliers (ASML, Applied Materials, Lam Research, KLA).",
    icon: "Cpu",
    color: "#6366f1",
    companyCount: 15,
    leaderTicker: "NVDA",
  },
  {
    id: "ai-cloud",
    name: "AI / Cloud",
    description:
      "Hyperscale cloud providers and AI-platform companies that consume the majority of advanced semiconductors. Microsoft Azure, AWS, Google Cloud, Meta, and Oracle drive multi-hundred-billion-dollar capex cycles that cascade through the entire chip supply chain.",
    icon: "Cloud",
    color: "#3b82f6",
    companyCount: 10,
    leaderTicker: "MSFT",
  },
  {
    id: "ev-battery",
    name: "EV / Battery",
    description:
      "The electric-vehicle and energy-storage ecosystem from upstream lithium mining (Albemarle) through battery cell manufacturing (CATL, LG Energy, Panasonic) to vehicle OEMs (Tesla, BYD). Supply-chain cascades flow from lithium prices to cell costs to vehicle margins.",
    icon: "Battery",
    color: "#22c55e",
    companyCount: 11,
    leaderTicker: "TSLA",
  },
  {
    id: "defense",
    name: "Defense",
    description:
      "Western defense-industrial base anchored by U.S. prime contractors (Lockheed Martin, RTX, Northrop Grumman) and key international partners (BAE Systems). Driven by government budgets, geopolitical tensions, and multi-decade program cycles like the F-35 and B-21.",
    icon: "Shield",
    color: "#ef4444",
    companyCount: 10,
    leaderTicker: "LMT",
  },
  {
    id: "pharma-biotech",
    name: "Pharma / Biotech",
    description:
      "Large-cap pharmaceutical and biotechnology companies spanning GLP-1 obesity drugs (Novo Nordisk, Eli Lilly), mRNA therapeutics (Moderna, Pfizer), and antibody platforms (Regeneron). Patent cliffs, FDA approvals, and clinical trial data drive sector-wide cascades.",
    icon: "FlaskConical",
    color: "#a855f7",
    companyCount: 10,
    leaderTicker: "LLY",
  },
  {
    id: "consumer-defensive",
    name: "Consumer Defensive",
    description:
      "Essential consumer goods and services that perform well regardless of economic conditions. Spans household products (Procter & Gamble), beverages (Coca-Cola, PepsiCo), warehouse retail (Costco, Walmart), and packaged food (General Mills).",
    icon: "ShoppingCart",
    color: "#8B5CF6",
    companyCount: 10,
    leaderTicker: "PG",
  },
  {
    id: "financials",
    name: "Financials",
    description:
      "Banks, insurance, asset management, and financial services companies. Includes diversified banking (JPMorgan), investment banking (Goldman Sachs, Morgan Stanley), payments (Visa), and exchanges (ICE, Tradeweb).",
    icon: "Landmark",
    color: "#F59E0B",
    companyCount: 10,
    leaderTicker: "JPM",
  },
  {
    id: "energy",
    name: "Energy",
    description:
      "Oil, gas, renewable energy companies and energy infrastructure. Spans integrated majors (ExxonMobil, Chevron), exploration & production (ConocoPhillips, EOG), oilfield services (Schlumberger), renewables (NextEra, First Solar), and LNG export (Cheniere).",
    icon: "Flame",
    color: "#DC2626",
    companyCount: 10,
    leaderTicker: "XOM",
  },
];

export function getSectorById(id: string): Sector | undefined {
  return sectors.find((s) => s.id === id);
}
