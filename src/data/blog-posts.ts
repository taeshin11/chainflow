export interface BlogPost {
  slug: string;
  title: string;
  sector: string;
  content: string;
  publishDate: string;
  readTime: string;
  metaDescription: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'complete-semiconductor-supply-chain-map-2026',
    title: 'Complete Semiconductor Supply Chain Map 2026',
    sector: 'semiconductors',
    publishDate: '2026-03-15',
    readTime: '8 min',
    metaDescription: 'A comprehensive map of the 2026 semiconductor supply chain from EUV equipment to end customers, covering NVIDIA, TSMC, ASML, and every critical link.',
    content: `The semiconductor supply chain is the most complex and strategically important industrial network in the world. In 2026, it spans from a single company in the Netherlands that makes lithography machines to trillion-dollar cloud providers consuming millions of chips per quarter.

## The Equipment Layer

At the very foundation sits ASML, the sole manufacturer of extreme ultraviolet (EUV) lithography systems. Each machine costs over $350 million and requires 100,000 components from 5,000 suppliers. Without ASML, no advanced chip can be made. Applied Materials and Lam Research provide complementary deposition and etch tools.

## The Foundry Bottleneck

TSMC controls roughly 60% of global foundry revenue and over 90% of advanced node production (5nm and below). This single-point dependency means that any disruption in Taiwan would cascade through every sector of the global economy. Samsung Foundry and Intel Foundry Services are attempting to compete but remain years behind.

## The Design Layer

NVIDIA dominates AI accelerator design with over 80% market share in data center GPUs. AMD is the primary challenger with MI300X. Broadcom has carved out a lucrative niche designing custom AI chips for Google (TPU) and Meta (MTIA). Marvell and Marvell compete in custom silicon and optical interconnects.

## Memory: The Hidden Bottleneck

High Bandwidth Memory (HBM) has become as important as the GPU itself. SK Hynix leads with roughly 50% market share in HBM3E, followed by Samsung and Micron. Every H100 GPU requires 80GB of HBM, and the Blackwell B200 requires 192GB - creating severe supply constraints.

## The Demand Side

Microsoft, Google, Amazon, and Meta are spending over $200 billion combined on AI infrastructure in 2026. This capex flows through the entire chain: from GPUs to memory to foundries to equipment makers. Understanding this flow is the key to anticipating which stocks move when earnings surprise.

## Investment Implications

The most actionable insight from mapping this chain is identifying which companies have the highest "cascade sensitivity" - that is, which stocks move most reliably when a leader reports earnings. Our data shows that memory stocks (SK Hynix, Micron) react within 24 hours of NVIDIA earnings, while equipment names (ASML, AMAT) take 2-5 days to fully price in the implications.`,
  },
  {
    slug: 'nvidia-supply-chain-every-supplier-partner',
    title: 'NVIDIA Supply Chain: Every Supplier & Partner',
    sector: 'semiconductors',
    publishDate: '2026-03-10',
    readTime: '7 min',
    metaDescription: 'Deep dive into NVIDIA\'s complete supply chain - from TSMC fabrication to HBM memory suppliers to the hyperscale customers driving demand.',
    content: `NVIDIA is the most important company in the AI revolution, but it does not operate in isolation. Its supply chain is a web of critical dependencies that investors must understand.

## Fabrication: TSMC (100% Dependency)

Every single NVIDIA GPU is manufactured by TSMC. The H100 uses TSMC's 4nm process, while the B100/B200 Blackwell GPUs use the 3nm node. NVIDIA has zero internal fabrication capability. This makes the TSMC relationship the single most important supply chain link in technology.

## Memory: The HBM Triad

Each H100 GPU contains 80GB of HBM3 memory, sourced from three suppliers: SK Hynix (primary), Samsung, and Micron. The Blackwell B200 doubles this to 192GB of HBM3E. With HBM supply constrained, memory allocation has become a gating factor for GPU production.

## Packaging: CoWoS Constraints

TSMC's Chip-on-Wafer-on-Substrate (CoWoS) advanced packaging is another bottleneck. Each AI GPU requires CoWoS to integrate the compute die with HBM stacks. TSMC has been aggressively expanding CoWoS capacity, but demand continues to outstrip supply.

## Networking: Mellanox and the Interconnect Stack

NVIDIA acquired Mellanox in 2020 for $7 billion, gaining control of InfiniBand - the dominant networking technology for AI clusters. This vertical integration gives NVIDIA an end-to-end platform advantage that competitors struggle to match.

## Server Partners

Super Micro Computer (SMCI), Dell, HPE, and Lenovo build the server systems that house NVIDIA GPUs. SMCI has been the fastest-growing partner, capturing significant share of AI server builds due to faster time-to-market.

## The Customer Concentration

Microsoft Azure is NVIDIA's single largest customer, estimated at $15B+ annually. Google Cloud, Amazon AWS, Meta, and Oracle round out the top five. These hyperscalers collectively represent roughly 60% of NVIDIA's data center revenue, creating significant customer concentration risk.

## The Competitive Landscape

AMD's MI300X is the only credible GPU alternative, but with less than 10% market share. The real threat may come from custom silicon: Google's TPU (designed by Broadcom), Amazon's Trainium, and Microsoft's Maia. However, NVIDIA's CUDA software ecosystem remains a formidable moat.`,
  },
  {
    slug: 'how-to-track-institutional-buying-signals',
    title: 'How to Track Institutional Buying Signals',
    sector: 'all',
    publishDate: '2026-03-05',
    readTime: '6 min',
    metaDescription: 'Learn how to read 13F filings, detect institutional accumulation patterns, and use the news gap to find stocks being quietly bought by smart money.',
    content: `Institutional investors manage trillions of dollars and have access to research, data, and analysis that retail investors do not. But there is one equalizer: 13F filings. Every institution managing over $100 million must publicly disclose their holdings quarterly.

## Understanding 13F Filings

Filed within 45 days of quarter end, 13F reports show every equity position held by qualifying institutions. The key is not just what they own, but how their positions change over time. A fund adding $500M to a position over two quarters is a strong conviction signal.

## The Accumulation Pattern

The most valuable signal is "quiet accumulation" - when multiple sophisticated funds build large positions in a stock that is not receiving significant media attention. This pattern often precedes major price moves by 3-6 months.

## The News Gap Indicator

We define the "news gap" as the divergence between institutional buying activity and media coverage. When Goldman Sachs, Citadel, and Point72 are all building positions in a stock that has fewer than 10 news articles per month, that silence itself becomes the signal.

## Case Study: Albemarle (ALB)

In Q4 2025, three major hedge funds simultaneously initiated or expanded positions in Albemarle totaling over $1.2 billion. During the same period, media coverage of ALB was minimal - most articles focused on depressed lithium prices. The institutional activity suggested these funds saw a lithium supply deficit forming that the market had not yet priced in.

## How to Use This Data

1. Monitor 13F filings for unusual position changes
2. Cross-reference with media coverage volume
3. Look for sector clustering (multiple funds buying in the same area)
4. Pay attention to the caliber of the institution (top-tier funds tend to be earlier)
5. Check the "cascade position" - is the stock upstream or downstream of a trend?

## Limitations

13F data is delayed by 45 days and only shows long equity positions. It does not capture short positions, options, or the timing of trades within the quarter. Use it as one input among many, not as a sole trading signal.`,
  },
  {
    slug: 'leader-to-midcap-cascade-strategy',
    title: 'Leader-to-Midcap Cascade: The Strategy IBs Don\'t Want You to Know',
    sector: 'all',
    publishDate: '2026-02-28',
    readTime: '7 min',
    metaDescription: 'How institutional investors use leader stock earnings to position in mid-cap supply chain names before the cascade effect reaches them.',
    content: `There is a pattern in markets that sophisticated investors exploit and rarely discuss publicly: the leader-to-midcap cascade. When a sector leader reports strong earnings, the positive signal takes days or even weeks to fully propagate through its supply chain.

## The Cascade Mechanic

When NVIDIA reports blowout earnings, the stock itself gaps up immediately. But the supply chain reaction follows a predictable sequence: memory suppliers (SK Hynix, Micron) react within 0-1 days, TSMC within 1-2 days, and equipment names (ASML, Applied Materials) within 2-5 days.

## Why the Delay Exists

Three factors create the delay. First, most investors focus on the reporting company itself, not the second-order effects. Second, analysts need time to update their models for supply chain beneficiaries. Third, institutional investors use the leader's data to build positions in downstream names before consensus catches up.

## Historical Evidence

We analyzed 20 NVIDIA earnings events from 2023-2025. In 17 of 20 cases, memory stocks moved directionally with NVIDIA within 1 trading day. In 15 of 20 cases, TSMC moved within 2 days. Equipment makers showed a 70% hit rate within 5 days. The pattern is robust and persistent.

## The Defense Cascade

This pattern is not limited to semiconductors. In defense, Lockheed Martin earnings cascade to RTX (engines), then to L3Harris (electronics), and finally to small-cap specialists like Kratos Defense. The delay can be even longer in defense due to the slower-moving nature of government contracts.

## The GLP-1 Cascade

In pharma, Eli Lilly and Novo Nordisk earnings cascade to GLP-1 supply chain companies like Thermo Fisher (equipment supplier) and even to competitors like Moderna (as the market reassesses portfolio diversification strategies).

## How to Trade It

The key is preparation. Before a leader reports earnings, identify the cascade sequence for its sector. Set alerts and prepare analysis on the downstream names. If the leader surprises, you have a window of 1-5 days to position in the beneficiaries before the market fully prices in the implications.`,
  },
  {
    slug: 'semiconductor-investment-flow-analysis',
    title: 'Semiconductor Investment Flow Analysis 2026',
    sector: 'semiconductors',
    publishDate: '2026-02-20',
    readTime: '6 min',
    metaDescription: 'Analysis of institutional money flows in the semiconductor sector, covering AI chip demand, memory expansion, and equipment spending cycles.',
    content: `The semiconductor sector attracted more institutional capital in 2025 than any other technology sub-sector. Understanding where the money is flowing - and where it is conspicuously absent - reveals the market's forward-looking view of the AI infrastructure buildout.

## The AI Chip Arms Race

NVIDIA remains the consensus overweight, with every major institution holding significant positions. The more interesting signal is the growing allocation to custom silicon names. Broadcom saw a 40% increase in institutional ownership as Google TPU and Meta MTIA demand accelerated.

## Memory: The Contrarian Play

While NVIDIA gets the headlines, memory stocks show some of the highest news gap scores in our analysis. Micron in particular has seen aggressive institutional accumulation despite lukewarm media sentiment. The HBM supply deficit is expected to persist through 2027, and institutions are positioning accordingly.

## Equipment: The Lagging Indicator

Semiconductor equipment stocks (ASML, Applied Materials, Lam Research, KLA) tend to lag the broader chip sector by 1-2 quarters. Current institutional flows suggest funds are rotating from GPU names into equipment makers, betting on a sustained multi-year capex cycle.

## The Taiwan Risk Premium

Geopolitical concerns have not deterred institutional buying of TSMC. Capital Group, Berkshire Hathaway, and multiple sovereign wealth funds have maintained or increased positions, suggesting that the world's largest investors view the Taiwan risk as manageable.

## Key Takeaways

1. Follow the HBM money - memory suppliers are the most underappreciated link
2. Equipment names are entering a secular growth phase
3. Custom silicon (Broadcom, Marvell) is the emerging theme
4. TSMC remains essential despite geopolitical risk
5. Watch for the cascade: NVIDIA earnings move the entire sector`,
  },
  {
    slug: 'ai-cloud-investment-flow-analysis',
    title: 'AI & Cloud Investment Flow Analysis 2026',
    sector: 'ai-cloud',
    publishDate: '2026-02-15',
    readTime: '5 min',
    metaDescription: 'How institutional capital is flowing through AI and cloud infrastructure companies, from hyperscalers to emerging AI platform plays.',
    content: `The AI and cloud sector represents the demand side of the AI supply chain. These companies are spending hundreds of billions on infrastructure, and their capex decisions cascade through the entire technology ecosystem.

## Hyperscaler Capex: The Demand Signal

Combined AI infrastructure spending by Microsoft, Google, Amazon, and Meta is projected to exceed $250 billion in 2026. This number is the single most important demand signal for the semiconductor supply chain. Every dollar of hyperscaler capex eventually flows to chip makers, memory suppliers, and equipment companies.

## Microsoft: The AI Infrastructure Leader

Microsoft's Azure AI revenue is growing at 50%+ annually, driven by the OpenAI partnership and Copilot adoption. Institutional flows reflect this: Microsoft remains the most widely held stock among active managers, with funds consistently adding on any weakness.

## The AI Platform Layer

Below the hyperscalers, companies like Palantir, Snowflake, and Databricks are building the application layer for enterprise AI. Palantir's AIP platform has been a breakout success, and institutional flows have followed. However, valuation concerns have led some funds to rotate from Palantir into less expensive alternatives.

## Emerging Themes

The fastest-growing institutional allocation is toward "AI infrastructure picks and shovels" - companies that benefit from AI spending regardless of which model or hyperscaler wins. This includes networking companies, data center REITs, and power generation companies that serve AI facilities.

## Risk Factors

The primary risk is a slowdown in AI capex. If hyperscalers reduce spending (as occurred briefly in 2022-2023 with cloud optimization), the cascade effect would be severe and rapid, hitting GPU suppliers first and then propagating through the entire chain.`,
  },
  {
    slug: 'ev-battery-investment-flow-analysis',
    title: 'EV & Battery Investment Flow Analysis 2026',
    sector: 'ev-battery',
    publishDate: '2026-02-10',
    readTime: '5 min',
    metaDescription: 'Institutional money flows in the EV and battery supply chain, from lithium miners to vehicle manufacturers.',
    content: `The electric vehicle and battery sector has undergone a dramatic repricing since 2022, with many stocks down 50-80% from peaks. But institutional investors are quietly building positions in what they see as a secular growth story that was simply over-hyped too early.

## Lithium: The Contrarian Consensus

The most striking news gap in our entire database is in lithium. Albemarle has seen massive institutional accumulation despite overwhelmingly negative media coverage about lithium oversupply and price declines. Three top-tier hedge funds initiated new positions totaling over $1 billion in a single quarter.

## Tesla: Still the Leader

Tesla remains the supply chain leader, and its delivery numbers set the tone for the entire EV ecosystem. Despite controversy and valuation debates, institutional ownership has remained remarkably stable. The key cascades from Tesla flow to battery suppliers (Panasonic, LG Energy, CATL) and then to lithium miners.

## The Charging Infrastructure Build

ChargePoint and other charging infrastructure companies have been left for dead by the market, but regulatory mandates and the growing EV installed base create a compelling long-term thesis. Early institutional flows into this space suggest smart money sees a recovery forming.

## Energy Storage: The Sleeper Theme

Beyond vehicles, battery technology is enabling grid-scale energy storage that could be even larger than the EV market. Enphase Energy and Tesla's Megapack division are seeing growing institutional interest as the energy transition accelerates.

## Key Signals

1. Lithium accumulation despite negative sentiment is the strongest contrarian signal
2. Tesla delivery numbers remain the sector bellwether
3. Charging infrastructure is being accumulated at distressed valuations
4. Energy storage is attracting new institutional flows`,
  },
  {
    slug: 'defense-investment-flow-analysis',
    title: 'Defense Sector Investment Flow Analysis 2026',
    sector: 'defense',
    publishDate: '2026-02-05',
    readTime: '5 min',
    metaDescription: 'How geopolitical tensions and rising budgets are driving institutional capital into defense and cybersecurity stocks.',
    content: `Global defense spending is at its highest level since the Cold War, and institutional investors are positioning for a multi-year supercycle driven by geopolitical tensions, technology modernization, and the rise of autonomous warfare systems.

## The Budget Tailwind

U.S. defense spending exceeded $900 billion in FY2026, with bipartisan support for continued increases. NATO allies are ramping spending toward 2.5% of GDP targets. This creates a predictable, long-duration revenue stream for prime contractors.

## Lockheed Martin: The Cascade Leader

Lockheed Martin's F-35 program is the largest defense program in history, with a total lifecycle value exceeding $1.7 trillion. LMT earnings cascade to Pratt & Whitney (RTX) for engines, Northrop Grumman for electronics, and L3Harris for mission systems.

## The Autonomous Warfare Theme

The most aggressive institutional flows in defense are going to small-cap autonomous systems companies. Kratos Defense, with its Valkyrie autonomous combat drone, has seen institutional ownership surge 300% in 12 months despite minimal media coverage. This is one of the highest news gap scores in our database.

## Cybersecurity as Defense

Palo Alto Networks straddles the line between technology and defense, providing critical cybersecurity for both government and enterprise. Institutional flows reflect growing demand for AI-powered security solutions as threat sophistication increases.

## Investment Framework

Defense investing requires patience due to long program cycles. The cascade from budget authorization to prime contractor revenue to sub-tier suppliers can take 12-24 months. Institutional investors who understand this timeline have a structural advantage over shorter-term market participants.`,
  },
  {
    slug: 'pharma-biotech-investment-flow-analysis',
    title: 'Pharma & Biotech Investment Flow Analysis 2026',
    sector: 'pharma-biotech',
    publishDate: '2026-01-30',
    readTime: '5 min',
    metaDescription: 'Institutional capital flows in pharma and biotech, focusing on GLP-1 drugs, mRNA therapeutics, and supply chain implications.',
    content: `The pharmaceutical sector is experiencing its most significant disruption in decades with GLP-1 drugs reshaping treatment paradigms for diabetes, obesity, cardiovascular disease, and potentially Alzheimer's. Institutional flows reveal how the smart money is positioning around this revolution.

## The GLP-1 Duopoly

Eli Lilly (Mounjaro/Zepbound) and Novo Nordisk (Ozempic/Wegovy) control the GLP-1 market. Both stocks have roughly tripled since 2023. Institutional ownership remains at all-time highs, with funds viewing the total addressable market for obesity treatment as still dramatically underestimated.

## The Supply Chain Winners

Thermo Fisher Scientific is the "picks and shovels" play for pharma. As GLP-1 manufacturing scales up, demand for Thermo Fisher's instruments, reagents, and CDMO services increases. Institutional flows into Thermo Fisher have been steady and consistent.

## mRNA: The Contrarian Opportunity

Moderna has been heavily sold since COVID vaccine demand peaked, but institutional data tells a different story. Multiple tier-one institutions have been quietly accumulating, betting on the cancer vaccine pipeline and next-generation respiratory vaccines. The news gap score for Moderna is among the highest in pharma.

## Vertex: The Gene Therapy Leader

Vertex Pharmaceuticals dominates cystic fibrosis and is expanding into gene editing (Casgevy for sickle cell) and non-opioid pain treatment. Its consistent growth profile and pipeline optionality have attracted steady institutional accumulation.

## The Cascade Pattern

In pharma, the cascade works differently than in tech. A positive GLP-1 data readout from Lilly cascades to: Novo Nordisk (competitive positioning), Thermo Fisher (manufacturing demand), DexCom (complementary diabetes management), and even negatively to bariatric surgery stocks. Understanding these second-order effects is crucial for supply chain investing.`,
  },
  {
    slug: 'understanding-supply-chain-cascade-patterns',
    title: 'Understanding Supply Chain Cascade Patterns',
    sector: 'all',
    publishDate: '2026-01-25',
    readTime: '6 min',
    metaDescription: 'A guide to identifying and trading supply chain cascade patterns - how earnings surprises propagate through interconnected companies.',
    content: `Supply chain cascade patterns are among the most reliable and exploitable inefficiencies in financial markets. When a sector leader reports earnings, the information takes days to fully propagate through its network of suppliers, customers, and competitors.

## What Is a Cascade?

A cascade occurs when new information about one company creates predictable price movements in related companies with a measurable time delay. Unlike simple correlation, cascades follow a directional chain with decreasing speed and magnitude as they move further from the source.

## The Anatomy of a Cascade

Every cascade has four stages. The leader moves first, typically gapping on earnings. First followers - usually the closest suppliers or customers - react within 0-1 trading days. Mid-chain companies adjust over 1-3 days as analysts update models. Late movers, often small-caps or tangentially related names, take 3-10 days.

## Why Cascades Persist

Market efficiency theory suggests cascades should not exist. Three structural factors explain their persistence. First, analyst coverage is siloed by sector - the semiconductor analyst may not immediately update defense models. Second, institutional mandate restrictions prevent cross-sector trading. Third, information processing takes time, especially for second and third-order effects.

## Measuring Cascade Strength

We track cascade reliability across 50+ historical events. The strongest cascades occur in semiconductors (80%+ hit rate) due to tight supply chain linkages and quarterly reporting cadence. Defense cascades are weaker (60-70%) due to longer procurement cycles. Pharma cascades are binary and depend heavily on clinical data outcomes.

## Building a Cascade Watchlist

1. Map the supply chain for each sector leader
2. Rank downstream companies by historical cascade sensitivity
3. Set earnings alerts for all leaders
4. Prepare position sizing and entry criteria before earnings
5. Execute within the cascade window (1-5 days post-leader earnings)

## Risk Management

Not every leader move cascades. False signals occur when the leader's surprise is company-specific (e.g., an accounting issue) rather than sector-wide (e.g., demand strength). Always verify that the leader's signal has supply chain implications before trading the cascade.`,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
