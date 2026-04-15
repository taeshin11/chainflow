# PRD.md — Flowvium: Supply Chain Institutional Flow Tracker

> **Brand:** SPINAI  
> **App Name:** Flowvium  
> **Tagline:** "Track where smart money flows through the supply chain — before the headlines catch up."  
> **Version:** MVP 1.0  
> **Contact:** taeshinkim11@gmail.com (user feedback), spinaiceo@gmail.com (business)  
> **Last Updated:** 2026-04-01  

---

## 1. Product Overview

### 1.1 What Is Flowvium?

Flowvium is a free, responsive web application that visualizes **how institutional (IB) buying flows through supply chain relationships** — from sector leaders to mid-cap intermediaries. It helps retail investors:

1. **Map supply chains by sector** — Click any company (e.g., NVIDIA) and instantly see every supplier, partner, and downstream company it interacts with, organized by sector.
2. **Track institutional accumulation signals** — Identify when investment banks are quietly accumulating positions in leader stocks, BEFORE mainstream media covers it.
3. **Spot the leader-to-midcap cascade** — When a sector leader (e.g., NVIDIA) rises on institutional buying, related mid-cap/intermediary stocks (e.g., Micron, Samsung) follow. Flowvium visualizes this flow pattern.
4. **Analyze the news gap** — Show the disconnect between what IBs are buying and what mainstream headlines/general newspapers are reporting. The key insight: when IBs accumulate, Bloomberg, economic weeklies, and general dailies show ZERO coverage — the signal is in the silence.
5. **Revenue & product breakdown** — Detailed company profiles with products, revenue streams, and cross-company relationships.

### 1.2 Core Insight (From Domain Expert)

> "When IB buying leads, pick the leader stock first, then mid-cap/secondary sector stocks follow. NVIDIA rises first → then Micron and Samsung follow. The analyst reports and the actual institutional investors do the OPPOSITE. And the most important thing: when IBs are accumulating, general public headlines, Bloomberg, economic weeklies, regular dailies — NONE of them cover it. That silence IS the signal."

### 1.3 Target Users

- Retail investors worldwide who want institutional-level supply chain intelligence
- Traders looking for leader-to-midcap cascade opportunities
- Anyone interested in sector-based company relationship mapping
- NOT limited to any single country — global coverage

---

## 2. Competitive Landscape & Pricing Strategy

### 2.1 Competitors

| Competitor | Monthly Price | Annual Price | Key Feature |
|---|---|---|---|
| FlowAlgo | $149/mo | $99/mo (annual) | Real-time options flow, dark pool |
| WhaleStream | $69/mo | $690/yr | Options flow + dark pool |
| Unusual Whales | $50/mo | — | Congressional trades + flow |
| CheddarFlow | $99/mo | $891/yr | Dark pool + options flow |
| BlackBox | $99.97/mo | $959/yr | Algo + dark pool |
| Tradytics | $69/mo | — | AI trade ideas |
| Market Chameleon | $39/mo | — | Options analytics |

### 2.2 Flowvium Differentiator

None of the above combine **supply chain mapping + institutional flow tracking + leader-to-midcap cascade analysis + news gap detection** in one tool. Flowvium occupies a unique niche.

### 2.3 Pricing Strategy

| Tier | Price | Features |
|---|---|---|
| **Free (MVP)** | $0 | Supply chain maps, basic institutional signals, news gap indicator, limited to 5 lookups/day, AI insights via Gemini API (free tier) |
| **Pro (Future)** | $35/mo ($25/mo annual) | Unlimited lookups, real-time alerts, advanced cascade analysis, historical flow data, export to CSV, priority AI analysis |
| **Institutional (Future)** | $75/mo ($50/mo annual) | API access, custom sector maps, team dashboards, webhook alerts |

> Pro pricing is **~50% of the cheapest competitor** (Unusual Whales at $50/mo) and **~25% of FlowAlgo** ($149/mo). This aggressive pricing captures market share from retail investors priced out of premium tools.

---

## 3. Harness Architecture (Anthropic Agent Design)

### 3.1 Agent Roles

| Agent | Role | Responsibility |
|---|---|---|
| **Planner** | Product Spec | Expands this PRD into implementation-ready specs. Focuses on WHAT, not HOW. |
| **Initializer** | Session Bootstrap | Creates `feature_list.json`, `claude-progress.txt`, `init.sh` on first run. |
| **Builder** | Implementation | Reads progress files → picks next feature → implements → commits → updates progress. |
| **Reviewer** | QA & Polish | Separate agent reviews code quality, UI/UX, responsiveness, and SEO compliance. |

### 3.2 Handoff Files

#### `feature_list.json`
```json
{
  "features": [
    {
      "id": "F001",
      "name": "Project Scaffolding & Deployment",
      "description": "Next.js 14 app with Tailwind CSS, Vercel deployment, GitHub repo via gh CLI",
      "status": "pending",
      "priority": 1,
      "milestone": true
    },
    {
      "id": "F002",
      "name": "Supply Chain Interactive Map",
      "description": "Interactive graph visualization showing company relationships by sector. Click any company to see suppliers, partners, downstream companies. Use D3.js or react-force-graph for visualization.",
      "status": "pending",
      "priority": 2,
      "milestone": true
    },
    {
      "id": "F003",
      "name": "Company Profile Cards",
      "description": "Detailed company cards showing: products, revenue breakdown, sector classification, related companies, supply chain position (leader vs mid-cap intermediary).",
      "status": "pending",
      "priority": 3,
      "milestone": true
    },
    {
      "id": "F004",
      "name": "Institutional Flow Signal Tracker",
      "description": "Track and display institutional buying patterns using free public data sources (SEC 13F filings, EDGAR API, free financial APIs). Show accumulation timeline, volume anomalies, and IB activity signals.",
      "status": "pending",
      "priority": 4,
      "milestone": true
    },
    {
      "id": "F005",
      "name": "Leader-to-Midcap Cascade Visualizer",
      "description": "Visual flow showing: when leader stock rises → which related mid-cap/intermediary stocks follow. Historical cascade patterns with timeline. Example: NVIDIA → Micron → Samsung cascade in semiconductors.",
      "status": "pending",
      "priority": 5,
      "milestone": true
    },
    {
      "id": "F006",
      "name": "News Gap Analyzer",
      "description": "Compare institutional buying activity against mainstream news coverage. Highlight stocks where IBs are accumulating but headlines show zero coverage. Use free news APIs (NewsAPI, GNews, RSS feeds). The silence IS the signal.",
      "status": "pending",
      "priority": 6,
      "milestone": true
    },
    {
      "id": "F007",
      "name": "AI Insight Engine (Gemini API)",
      "description": "Free-tier AI analysis: natural language summaries of supply chain relationships, flow pattern explanations, investment thesis generation. Use Google Gemini API free tier (Gemini 2.5 Flash — up to 1,000 requests/day free, 10 RPM). Requires GEMINI_API_KEY from Google AI Studio (free, no billing needed).",
      "status": "pending",
      "priority": 7,
      "milestone": true
    },
    {
      "id": "F008",
      "name": "Silent Data Collection (Google Sheets Webhook)",
      "description": "On every major user interaction (search, company click, cascade view), silently POST usage data to Google Sheets via Apps Script webhook. User must NOT know data is being collected. No consent banners for this — it is analytics only.",
      "status": "pending",
      "priority": 8,
      "milestone": false
    },
    {
      "id": "F009",
      "name": "Feedback Widget (Non-Intrusive)",
      "description": "Small floating feedback button (bottom-right or in footer) that lets users email improvement suggestions to taeshinkim11@gmail.com. Must not interfere with UX. Use mailto: link or lightweight form modal.",
      "status": "pending",
      "priority": 9,
      "milestone": false
    },
    {
      "id": "F010",
      "name": "Auto-Locale Detection & i18n",
      "description": "Detect user browser language on page load. Auto-translate entire UI without any user action. Support: English, Korean, Japanese, Chinese (Simplified), Chinese (Traditional), Spanish, German, French, Portuguese, Hindi, Arabic, Vietnamese, Thai, Indonesian, Russian, Turkish. Use next-intl or similar. NO language selector needed — just auto-detect and serve.",
      "status": "pending",
      "priority": 10,
      "milestone": true
    },
    {
      "id": "F011",
      "name": "SEO & Traffic Maximization",
      "description": "Full SEO suite: dynamic meta tags, Open Graph, Twitter Cards, JSON-LD structured data, sitemap.xml, robots.txt, canonical URLs, breadcrumbs, internal linking, blog/content section for organic traffic, keyword-optimized pages for every sector and major company.",
      "status": "pending",
      "priority": 11,
      "milestone": true
    },
    {
      "id": "F012",
      "name": "SPINAI Branding (Subtle)",
      "description": "Small 'Built by SPINAI' badge in footer. Not intrusive. Links to SPINAI homepage if available. Professional, not promotional.",
      "status": "pending",
      "priority": 12,
      "milestone": false
    },
    {
      "id": "F013",
      "name": "Responsive Design & Modern UI",
      "description": "Mobile-first responsive design. Soft color palette (light blues, muted grays, gentle gradients). Modern UI — not old-fashioned. Clean typography, smooth animations, glassmorphism accents.",
      "status": "pending",
      "priority": 13,
      "milestone": false
    },
    {
      "id": "F014",
      "name": "Pro Tier Paywall Scaffolding",
      "description": "Prepare UI for future Pro features: locked sections with 'Upgrade to Pro' overlays, usage counter (5 free lookups/day), Stripe checkout placeholder. Do NOT implement payment processing yet — just the gates and UI.",
      "status": "pending",
      "priority": 14,
      "milestone": false
    }
  ]
}
```

#### `claude-progress.txt`
```
# Flowvium Progress Log
# Updated after each feature completion

## Current Status
- Phase: MVP Development
- Last completed feature: (none)
- Next feature: F001 - Project Scaffolding & Deployment
- Blockers: None

## Completed Features
(none yet)

## Session Log
(will be updated per session)
```

#### `init.sh`
```bash
#!/bin/bash
# Flowvium Initialization Script
# Run once at project start

# Install dependencies
npm install

# Start dev server
npm run dev

# The app should be accessible at http://localhost:3000
```

### 3.3 Session Routine (Builder Agent)

Every session follows this exact cycle:

1. **Read** `claude-progress.txt` — understand current state
2. **Read** `feature_list.json` — find next pending feature
3. **Run tests** — ensure nothing is broken
4. **Implement** one feature completely
5. **Test** the implementation locally
6. **Commit** with descriptive message
7. **Update** `claude-progress.txt`
8. **If milestone** → `git push` to GitHub
9. **Repeat** from step 2, or end session

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR for SEO, free Vercel hosting |
| Styling | Tailwind CSS | Utility-first, responsive, modern |
| Visualization | D3.js + react-force-graph | Interactive supply chain graphs |
| Charts | Recharts or Chart.js | Financial data visualization |
| AI (Free) | Google Gemini API (2.5 Flash) | Free tier: 1,000 req/day, 10 RPM |
| Data Collection | Google Sheets + Apps Script | Free, silent webhook POST |
| Hosting | Vercel (Free Tier) | Zero cost, auto-deploy from GitHub |
| i18n | next-intl | Auto-locale detection, SSR-compatible |
| State | Zustand or React Context | Lightweight client state |
| Icons | Lucide React | Clean, modern icon set |

### 4.2 Data Sources (All Free)

| Data | Source | API |
|---|---|---|
| Company relationships | SEC EDGAR | Free API (sec.gov) |
| 13F institutional holdings | SEC EDGAR 13F filings | Free (quarterly) |
| Stock prices | Yahoo Finance (unofficial) / Alpha Vantage (free tier) / Financial Modeling Prep | Free tier |
| News articles | GNews API / NewsAPI (free tier) / Google News RSS | Free |
| Company financials | Financial Modeling Prep (free tier) / SEC EDGAR XBRL | Free |
| Supply chain data | Public sources + curated datasets | Hand-curated JSON for MVP |
| AI analysis | Google Gemini API (free tier) | Free (1,000 req/day) |

### 4.3 Supply Chain Data Structure (MVP)

For MVP, curate supply chain data for major sectors as static JSON. Expand to dynamic data in future versions.

```typescript
interface Company {
  id: string;
  name: string;
  ticker: string;
  sector: string;
  subSector: string;
  marketCap: "mega" | "large" | "mid" | "small";
  role: "leader" | "intermediary" | "supplier" | "customer";
  products: Product[];
  revenue: RevenueBreakdown;
  relationships: Relationship[];
}

interface Relationship {
  targetId: string;
  type: "supplier" | "customer" | "partner" | "competitor";
  products: string[];
  revenueImpact: string; // e.g., "15% of revenue"
}

interface CascadePattern {
  sector: string;
  leaderTicker: string;
  sequence: CascadeStep[];
  historicalOccurrences: HistoricalCascade[];
}

interface CascadeStep {
  ticker: string;
  typicalDelay: string; // e.g., "2-4 weeks after leader"
  role: "leader" | "first_follower" | "mid_cap" | "late_mover";
}
```

### 4.4 MVP Sectors (Curated Data)

Start with these high-interest sectors:

1. **Semiconductors** — NVIDIA → TSMC → Micron → Samsung → SK Hynix → ASML → Applied Materials → Lam Research → KLA
2. **AI / Cloud** — Microsoft → Google → Amazon AWS → Meta → Oracle Cloud
3. **EV / Battery** — Tesla → CATL → Panasonic → LG Energy → BYD → Albemarle (lithium)
4. **Defense** — Lockheed Martin → Raytheon → Northrop Grumman → BAE Systems → L3Harris
5. **Pharma / Biotech** — Pfizer → Moderna → Eli Lilly → Novo Nordisk → Regeneron

---

## 5. UI/UX Specifications

### 5.1 Design Language

- **Color Palette (Soft):**
  - Primary: `#4F8FBF` (soft steel blue)
  - Secondary: `#6CB4A8` (muted teal)
  - Background: `#F5F7FA` (off-white)
  - Surface: `#FFFFFF` (white cards)
  - Text Primary: `#1A2332` (dark navy)
  - Text Secondary: `#6B7B8D` (muted gray)
  - Accent/Alert: `#E8A945` (warm gold for signals)
  - Success: `#5CB88A` (soft green)
  - Danger: `#D97171` (soft red)

- **Typography:**
  - Headings: Inter or Plus Jakarta Sans (modern, clean)
  - Body: Inter (highly readable)
  - Monospace (data): JetBrains Mono

- **Style:**
  - Rounded corners (8-12px)
  - Subtle shadows (no harsh drop shadows)
  - Glassmorphism on overlays (backdrop-blur)
  - Smooth transitions (200-300ms ease)
  - NO harsh borders — use subtle dividers or shadows
  - Modern, clean, NOT old-fashioned

### 5.2 Page Structure

```
/                          → Landing page (hero, features, CTA)
/explore                   → Main supply chain explorer (interactive graph)
/explore/[sector]          → Sector-specific supply chain map
/company/[ticker]          → Company detail page (profile, relationships, flow)
/cascade                   → Leader-to-midcap cascade tracker
/cascade/[sector]          → Sector-specific cascade view
/signals                   → Institutional flow signals dashboard
/news-gap                  → News gap analyzer
/blog                      → SEO content hub (programmatic pages)
/blog/[sector]-supply-chain → Auto-generated sector analysis pages
/about                     → About page (SPINAI branding)
/api/collect               → Internal webhook relay to Google Sheets
```

### 5.3 Core Interaction Flow

1. **User lands on homepage** → Sees animated supply chain graph hero, clear value proposition
2. **Clicks "Explore Supply Chains"** → Full interactive graph, filter by sector
3. **Clicks a company node** → Side panel slides in with company details, relationships, institutional signals
4. **Clicks "View Cascade"** → Visualization of leader → mid-cap flow timeline
5. **Checks "News Gap"** → Dashboard showing IB accumulation vs. media silence
6. **AI button** → Gets Gemini-powered natural language analysis

### 5.4 Feedback Widget

- **Position:** Fixed bottom-right floating button (subtle, small)
- **Icon:** Chat bubble or lightbulb icon
- **Behavior:** On click, opens small modal with:
  - Subject (dropdown: Bug Report, Feature Request, General Feedback)
  - Message textarea
  - Submit button → sends email to taeshinkim11@gmail.com via `mailto:` link or lightweight email API
- **Non-intrusive:** Does NOT auto-open, no popups, no banners

### 5.5 SPINAI Branding

- Footer only: "Built with care by SPINAI" in small text
- Subtle, professional — not a banner or watermark
- Optional: Small SPINAI logo if available

---

## 6. Silent Data Collection

### 6.1 Google Sheets Webhook Setup

**Google Apps Script (deploy as web app):**

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      new Date(),
      data.event,        // "search", "company_click", "cascade_view", "signal_view"
      data.ticker || "",
      data.sector || "",
      data.page || "",
      data.locale || "",
      data.userAgent || "",
      data.referrer || "",
      data.sessionId || ""
    ]);
    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error" })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 6.2 Client-Side Collection

```typescript
// utils/collect.ts — silent analytics
const WEBHOOK_URL = process.env.NEXT_PUBLIC_SHEETS_WEBHOOK;

export async function trackEvent(event: string, meta: Record<string, string> = {}) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        ...meta,
        locale: navigator.language,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessionId: getSessionId(),
        timestamp: new Date().toISOString()
      })
    });
  } catch {
    // Silent fail — never block UX
  }
}
```

### 6.3 Events to Track

| Event | Trigger | Data |
|---|---|---|
| `page_view` | Every page load | page path, locale, referrer |
| `search` | User searches company/sector | query, results count |
| `company_click` | User clicks company node | ticker, sector |
| `cascade_view` | User views cascade flow | sector, leader ticker |
| `signal_view` | User views institutional signals | ticker |
| `ai_query` | User requests AI analysis | query type |
| `feedback_open` | User opens feedback modal | — |

---

## 7. SEO & Traffic Maximization

### 7.1 On-Page SEO

- **Dynamic meta tags** per page (title, description, keywords)
- **Open Graph** tags for social sharing (og:title, og:description, og:image)
- **Twitter Cards** (summary_large_image)
- **JSON-LD** structured data (Organization, WebApplication, FAQPage)
- **Canonical URLs** on every page
- **Alt text** on all images and visualizations
- **Semantic HTML** (proper heading hierarchy, nav, main, article, section)

### 7.2 Technical SEO

- **sitemap.xml** — auto-generated, includes all company pages and sector pages
- **robots.txt** — allow all crawlers
- **Next.js SSR/SSG** — pages pre-rendered for search engines
- **Fast loading** — Lighthouse score target: 90+ on all metrics
- **Core Web Vitals** — LCP < 2.5s, FID < 100ms, CLS < 0.1

### 7.3 Content Strategy (Programmatic SEO)

Auto-generate SEO-optimized pages for maximum organic traffic:

- `/blog/semiconductor-supply-chain-analysis` — "Complete Semiconductor Supply Chain Map 2026"
- `/blog/nvidia-supply-chain-partners` — "NVIDIA Supply Chain: Every Supplier & Partner"
- `/blog/institutional-buying-signals-explained` — "How to Track Institutional Buying Signals"
- `/blog/leader-to-midcap-cascade-investing` — "Leader-to-Midcap Cascade: The Strategy IBs Don't Want You to Know"
- `/blog/[sector]-investment-flow` — Auto-generated for each sector
- `/company/[ticker]` — Each company page is SEO-optimized with full meta

**Target Keywords:**
- "supply chain investment tracker"
- "institutional buying signals free"
- "NVIDIA supply chain companies"
- "semiconductor supply chain map"
- "leader stock to mid cap flow"
- "institutional flow tracker free"
- "smart money supply chain"
- "IB accumulation tracker"

### 7.4 Off-Page Traffic

- **Social meta tags** for viral sharing on Twitter/X, Reddit, LinkedIn
- **Embeddable widgets** — supply chain graphs that bloggers can embed
- **Share buttons** on every insight page
- **RSS feed** for blog content

---

## 8. Internationalization (i18n)

### 8.1 Auto-Detection

- Detect `navigator.language` or `Accept-Language` header on FIRST page load
- Serve content in detected language IMMEDIATELY — no language picker needed
- Support 16 languages minimum:
  - `en` English (default fallback)
  - `ko` Korean
  - `ja` Japanese
  - `zh-CN` Chinese (Simplified)
  - `zh-TW` Chinese (Traditional)
  - `es` Spanish
  - `de` German
  - `fr` French
  - `pt` Portuguese
  - `hi` Hindi
  - `ar` Arabic (RTL support)
  - `vi` Vietnamese
  - `th` Thai
  - `id` Indonesian
  - `ru` Russian
  - `tr` Turkish

### 8.2 Implementation

- Use `next-intl` with middleware for locale detection
- Static UI strings in JSON translation files
- Dynamic content (company names, tickers) stays in English
- AI-generated descriptions can be requested in detected locale via Gemini API
- URL structure: `/{locale}/explore`, `/{locale}/company/NVDA`, etc.

---

## 9. Infrastructure & Deployment

### 9.1 Zero-Cost Stack

| Service | Purpose | Cost |
|---|---|---|
| Vercel (Free) | Hosting, CDN, SSL, CI/CD | $0 |
| GitHub (Free) | Source control | $0 |
| Google Sheets + Apps Script | Data collection | $0 |
| Google Gemini API (free tier) | AI analysis | $0 (1,000 req/day) |
| SEC EDGAR API | Institutional filings | $0 |
| GNews / NewsAPI (Free) | News data | $0 |
| Alpha Vantage (Free) | Stock prices | $0 |

### 9.2 GitHub Setup

```bash
# Create repo using gh CLI (REQUIRED)
gh repo create flowvium --public --description "Supply Chain Institutional Flow Tracker by SPINAI"
git init
git add .
git commit -m "feat: initial project scaffolding"
git branch -M main
gh repo view --web  # verify creation
git remote add origin $(gh repo view --json url -q .url)
git push -u origin main
```

### 9.3 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel (creates public URL — no GitHub username exposure)
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SHEETS_WEBHOOK production
vercel env add NEXT_PUBLIC_ALPHA_VANTAGE_KEY production
vercel env add GEMINI_API_KEY production
```

### 9.4 Gemini API Setup

```bash
# Get free API key from Google AI Studio (no billing required)
# 1. Go to https://aistudio.google.com/apikey
# 2. Create API key (free, instant)
# 3. Add to .env.local and Vercel env

# Model: gemini-2.5-flash (best free tier — 1,000 req/day, 10 RPM, 250K TPM)
# Fallback: gemini-2.5-flash-lite (even cheaper if paid needed later)

# Example API call:
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Analyze the semiconductor supply chain relationship between NVIDIA and TSMC"}]}]}'

# Rate limits (free tier):
# - 10 requests per minute (RPM)
# - 250,000 tokens per minute (TPM)  
# - 1,000 requests per day (RPD)
# - Sufficient for MVP with ~1,000 AI queries/day
```

> **IMPORTANT:** The live URL will be on Vercel's domain (e.g., `flowvium.vercel.app`) — this does NOT expose any GitHub username. Users access the app via the Vercel URL only.

### 9.5 Git Push Strategy (Milestone-Based)

```bash
# Push ONLY on milestone features (marked in feature_list.json)
# Each push triggers Vercel auto-deploy

# Example milestone commit:
git add .
git commit -m "feat(F002): interactive supply chain map with D3.js"
git push origin main

# Non-milestone commits stay local until next milestone:
git add .
git commit -m "chore(F008): silent data collection webhook"
# (no push — will be included in next milestone push)
```

---

## 10. CLI Automation Requirements

### 10.1 Rules

- **If it CAN be done via CLI, it MUST be done via CLI.** No manual steps.
- Use `gh` CLI for all GitHub operations
- Use `vercel` CLI for all deployment operations
- Use `gcloud` CLI for any Google Cloud auth (gcloud is pre-installed)
- Use `npx` for one-off tooling
- Use `curl` for API testing
- Automate dependency installation, builds, deploys

### 10.2 Common Automation Patterns

```bash
# Create GitHub repo
gh repo create flowvium --public

# Deploy to Vercel
vercel --prod --yes

# Test webhook
curl -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d '{"event":"test"}'

# Generate sitemap
npx next-sitemap

# Check Lighthouse scores
npx lighthouse https://flowvium.vercel.app --output json

# Google Cloud auth (if needed for Sheets API)
gcloud auth application-default login
```

---

## 11. Future Considerations (Post-MVP)

### 11.1 Pro Tier Features (v2.0)

- Real-time institutional flow alerts (WebSocket)
- Historical cascade pattern database
- Custom supply chain map builder
- Portfolio integration (track YOUR holdings through supply chains)
- Advanced AI analysis (upgrade to Gemini 2.5 Pro paid tier for higher limits)
- Export data (CSV, PDF reports)
- Email/push notification alerts
- Stripe payment integration

### 11.2 Data Expansion (v2.0+)

- Real-time 13F filing parser (auto-update on new filings)
- Dark pool data integration (if affordable source found)
- Global exchanges support (not just US stocks)
- Crypto supply chain mapping (token ecosystems)
- Commodity supply chains (oil, lithium, rare earths)

### 11.3 Monetization Roadmap

1. **Free tier** → Build user base and SEO authority
2. **Pro tier** ($35/mo) → Unlock advanced features
3. **Institutional tier** ($75/mo) → API access, team features
4. **Affiliate/Referral** → Partner with brokerages
5. **Sponsored insights** → Sector-specific sponsored analysis (clearly labeled)

---

## 12. Quality Checklist (Reviewer Agent)

Before each milestone push, verify:

- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Soft color palette applied consistently
- [ ] No UI elements block user experience
- [ ] Silent data collection working (test POST to webhook)
- [ ] Feedback widget accessible but non-intrusive
- [ ] SPINAI branding in footer only
- [ ] Auto-locale detection working (test with different browser languages)
- [ ] SEO meta tags present on every page
- [ ] Lighthouse score 90+ (performance, accessibility, best practices, SEO)
- [ ] All links working (no 404s)
- [ ] Supply chain graph interactive and responsive
- [ ] Company profiles loading correctly
- [ ] No API keys exposed in client-side code
- [ ] Error states handled gracefully
- [ ] Loading states present (skeletons or spinners)
- [ ] Git history clean with descriptive commits

---

## 13. Disclaimer

Flowvium provides informational data and visualizations for educational purposes only. It does NOT constitute investment advice. Users should conduct their own due diligence before making any investment decisions. Past institutional buying patterns do not guarantee future performance.

---

## 14. PRD Update Log

| Date | Version | Changes |
|---|---|---|
| 2026-04-01 | 1.0 | Initial MVP PRD created |

> This PRD is a living document. Update it as features are completed, requirements change, or new insights emerge. Always keep `feature_list.json` and `claude-progress.txt` in sync with this document.
