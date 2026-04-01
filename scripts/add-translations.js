const fs = require('fs');
const path = require('path');

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const allTranslations = {
  ja: {
    nav: { feedback: "\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af" },
    explore: {
      sectors: { all: "\u3059\u3079\u3066", semiconductors: "\u534a\u5c0e\u4f53", "ai-cloud": "AI / \u30af\u30e9\u30a6\u30c9", "ev-battery": "EV / \u30d0\u30c3\u30c6\u30ea\u30fc", defense: "\u9632\u885b", "pharma-biotech": "\u88fd\u85ac / \u30d0\u30a4\u30aa" },
      relationships: { supplier: "\u30b5\u30d7\u30e9\u30a4\u30e4\u30fc", customer: "\u9867\u5ba2", partner: "\u30d1\u30fc\u30c8\u30ca\u30fc", competitor: "\u7af6\u5408\u4ed6\u793e" },
      sidePanel: { products: "\u88fd\u54c1", revenueBreakdown: "\u58f2\u4e0a\u5185\u8a33", relatedCompanies: "\u95a2\u9023\u4f01\u696d", cap: "\u6642\u4fa1\u7dcf\u984d", role: "\u5f79\u5272", viewProfile: "\u8a73\u7d30\u30d7\u30ed\u30d5\u30a3\u30fc\u30eb\u3092\u898b\u308b", viewCascade: "\u30ab\u30b9\u30b1\u30fc\u30c9\u3092\u898b\u308b" },
      loadingGraph: "\u30b0\u30e9\u30d5\u3092\u8aad\u307f\u8fbc\u307f\u4e2d...", noCompaniesMatch: "\u30d5\u30a3\u30eb\u30bf\u30fc\u306b\u4e00\u81f4\u3059\u308b\u4f01\u696d\u304c\u3042\u308a\u307e\u305b\u3093", companiesCount: "{count}\u793e"
    },
    company: {
      notFound: "\u4f01\u696d\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093", notFoundDesc: "\u30c6\u30a3\u30c3\u30ab\u30fc\u300c{ticker}\u300d\u306e\u4f01\u696d\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002", backToExplorer: "\u30a8\u30af\u30b9\u30d7\u30ed\u30fc\u30e9\u30fc\u306b\u623b\u308b",
      productsAndRevenue: "\u88fd\u54c1\u3068\u58f2\u4e0a", productRevenueShare: "\u88fd\u54c1\u5225\u58f2\u4e0a\u30b7\u30a7\u30a2", revenueBreakdown: "\u58f2\u4e0a\u5185\u8a33",
      segment: "\u30bb\u30b0\u30e1\u30f3\u30c8", share: "\u30b7\u30a7\u30a2", supplyChainRelationships: "\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u95a2\u4fc2", partners: "\u30d1\u30fc\u30c8\u30ca\u30fc", impact: "\u5f71\u97ff",
      institutionalSignals: "\u6a5f\u95a2\u6295\u8cc7\u5bb6\u30b7\u30b0\u30ca\u30eb", institution: "\u6a5f\u95a2", action: "\u30a2\u30af\u30b7\u30e7\u30f3", shares: "\u682a\u5f0f\u6570", value: "\u4fa1\u5024", date: "\u65e5\u4ed8",
      aiAnalysis: "AI\u5206\u6790", getAiAnalysis: "AI\u5206\u6790\u3092\u53d6\u5f97", analyzing: "\u5206\u6790\u4e2d...",
      aiPrompt: "{company}\u306eAI\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u5206\u6790\u3092\u53d7\u3051\u308b\u306b\u306f\u300cAI\u5206\u6790\u3092\u53d6\u5f97\u300d\u3092\u30af\u30ea\u30c3\u30af\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
      companyInfo: "\u4f01\u696d\u60c5\u5831", newsGapScore: "\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7\u30b9\u30b3\u30a2", gapScore: "\u30ae\u30e3\u30c3\u30d7\u30b9\u30b3\u30a2", lowGap: "\u4f4e\u30ae\u30e3\u30c3\u30d7", highGap: "\u9ad8\u30ae\u30e3\u30c3\u30d7",
      ibActivity: "\u6a5f\u95a2\u6d3b\u52d5", mediaScore: "\u30e1\u30c7\u30a3\u30a2\u30b9\u30b3\u30a2", cascadePosition: "\u30ab\u30b9\u30b1\u30fc\u30c9\u30dd\u30b8\u30b7\u30e7\u30f3", roleInCascade: "\u30ab\u30b9\u30b1\u30fc\u30c9\u5185\u306e\u5f79\u5272",
      typicalDelay: "\u5178\u578b\u7684\u306a\u9045\u5ef6", viewFullCascade: "\u5b8c\u5168\u306a\u30ab\u30b9\u30b1\u30fc\u30c9\u3092\u898b\u308b"
    },
    cascade: {
      tracker: "\u30ab\u30b9\u30b1\u30fc\u30c9\u30c8\u30e9\u30c3\u30ab\u30fc", leaderToMidcap: "\u30ea\u30fc\u30c0\u30fc\u304b\u3089\u4e2d\u578b\u682a\u3078\u306e\u30ab\u30b9\u30b1\u30fc\u30c9\u30c8\u30e9\u30c3\u30ab\u30fc",
      cascadeDescription: "\u30ea\u30fc\u30c0\u30fc\u682a\u304c\u52d5\u304f\u3068\u3001\u30b7\u30b0\u30ca\u30eb\u304c\u30b5\u30d7\u30e9\u30a4\u30e4\u30fc\u3001\u9867\u5ba2\u3001\u4e2d\u578b\u682a\u3078\u6570\u65e5\u304b\u3051\u3066\u4f1d\u64ad\u3057\u307e\u3059\u3002",
      leader: "\u30ea\u30fc\u30c0\u30fc", steps: "{count}\u30b9\u30c6\u30c3\u30d7", events: "{count}\u30a4\u30d9\u30f3\u30c8", more: "+{count}\u4ef6",
      cascadeFlow: "\u30ab\u30b9\u30b1\u30fc\u30c9\u30d5\u30ed\u30fc", historicalOccurrences: "\u904e\u53bb\u306e\u4e8b\u4f8b", earningsCascade: "\u6c7a\u7b97\u30ab\u30b9\u30b1\u30fc\u30c9",
      stepsAndEvents: "{steps}\u30b9\u30c6\u30c3\u30d7 \u00b7 {events}\u4ef6\u306e\u904e\u53bb\u30a4\u30d9\u30f3\u30c8",
      roleLabels: { leader: "\u30ea\u30fc\u30c0\u30fc", first_follower: "\u30d5\u30a1\u30fc\u30b9\u30c8\u30d5\u30a9\u30ed\u30ef\u30fc", mid_cap: "\u30df\u30c3\u30c9\u30c1\u30a7\u30fc\u30f3", late_mover: "\u30ec\u30a4\u30c8\u30e0\u30fc\u30d0\u30fc" },
      trigger: "\u30c8\u30ea\u30ac\u30fc", leaderMove: "\u30ea\u30fc\u30c0\u30fc\u306e\u52d5\u304d", cascadeResult: "\u30ab\u30b9\u30b1\u30fc\u30c9\u7d50\u679c", currentStatus: "\u73fe\u5728\u306e\u72b6\u6cc1",
      currentStatusDesc: "\u30a2\u30af\u30c6\u30a3\u30d6\u306a\u30ab\u30b9\u30b1\u30fc\u30c9\u306f\u691c\u51fa\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002\u6b21\u306e\u6f5c\u5728\u7684\u30c8\u30ea\u30ac\u30fc\u306f{ticker}\u306e\u6c7a\u7b97\u3067\u3059\u3002",
      monitoring: "\u30e2\u30cb\u30bf\u30ea\u30f3\u30b0\u4e2d", notFound: "\u30ab\u30b9\u30b1\u30fc\u30c9\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093",
      notFoundDesc: "\u30bb\u30af\u30bf\u30fc\u300c{sector}\u300d\u306e\u30ab\u30b9\u30b1\u30fc\u30c9\u30d1\u30bf\u30fc\u30f3\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093\u3002", backToCascades: "\u30ab\u30b9\u30b1\u30fc\u30c9\u4e00\u89a7\u306b\u623b\u308b"
    },
    signals: {
      filters: "\u30d5\u30a3\u30eb\u30bf\u30fc", allSectors: "\u5168\u30bb\u30af\u30bf\u30fc", allActions: "\u5168\u30a2\u30af\u30b7\u30e7\u30f3",
      actions: { accumulating: "\u8cb7\u3044\u5897\u3057", reducing: "\u524a\u6e1b", new_position: "\u65b0\u898f\u30dd\u30b8\u30b7\u30e7\u30f3", exit: "\u6392\u51fa" },
      sortByDate: "\u65e5\u4ed8\u9806", sortByValue: "\u4fa1\u5024\u9806", sortByGap: "\u30ae\u30e3\u30c3\u30d7\u30b9\u30b3\u30a2\u9806",
      sectorActivity: "\u30bb\u30af\u30bf\u30fc\u5225\u6d3b\u52d5", mostActiveInstitutions: "\u6700\u3082\u6d3b\u767a\u306a\u6a5f\u95a2", signalsCount: "{count}\u30b7\u30b0\u30ca\u30eb",
      company: "\u4f01\u696d", institution: "\u6a5f\u95a2", action: "\u30a2\u30af\u30b7\u30e7\u30f3", sharesChanged: "\u682a\u5f0f\u5909\u52d5", value: "\u4fa1\u5024", gapScore: "\u30ae\u30e3\u30c3\u30d7\u30b9\u30b3\u30a2", filingDate: "\u63d0\u51fa\u65e5",
      noSignalsMatch: "\u30d5\u30a3\u30eb\u30bf\u30fc\u306b\u4e00\u81f4\u3059\u308b\u30b7\u30b0\u30ca\u30eb\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u6761\u4ef6\u3092\u8abf\u6574\u3057\u3066\u304f\u3060\u3055\u3044\u3002"
    },
    newsGap: {
      silenceIsSignal: "\u6c88\u9ed9\u3053\u305d\u304c<accent>\u30b7\u30b0\u30ca\u30eb</accent>\u3067\u3042\u308b",
      heroExplanation: "\u6a5f\u95a2\u6295\u8cc7\u5bb6\u304c\u30e1\u30c7\u30a3\u30a2\u304c\u7121\u8996\u3057\u3066\u3044\u308b\u682a\u3092\u9759\u304b\u306b\u8cb7\u3044\u5897\u3057\u3066\u3044\u308b\u3068\u304d\u3001\u305d\u306e\u4e56\u96e2\u306f\u5927\u304d\u306a\u4fa1\u683c\u5909\u52d5\u306b\u5148\u884c\u3059\u308b\u3053\u3068\u304c\u591a\u3044\u3067\u3059\u3002\u79c1\u305f\u3061\u306f\u3053\u306e\u30ae\u30e3\u30c3\u30d7\u3092\u6e2c\u5b9a\u3057\u307e\u3059\u3002",
      ibVsMedia: "\u6a5f\u95a2\u6d3b\u52d5 vs \u30e1\u30c7\u30a3\u30a2\u5831\u9053",
      ibVsMediaDesc: "<accent>\u5de6\u4e0a\u8c61\u9650</accent>\u306e\u4f01\u696d\uff08\u9ad8\u3044\u6a5f\u95a2\u6d3b\u52d5\u3001\u4f4e\u3044\u30e1\u30c7\u30a3\u30a2\uff09\u304c\u6700\u3082\u5f37\u3044\u30b7\u30b0\u30ca\u30eb\u3067\u3059\u3002",
      mediaCoverageScore: "\u30e1\u30c7\u30a3\u30a2\u5831\u9053\u30b9\u30b3\u30a2", ibActivityScore: "\u6a5f\u95a2\u6d3b\u52d5\u30b9\u30b3\u30a2",
      highGapSignal: "\u9ad8\u30ae\u30e3\u30c3\u30d7\uff08\u30b7\u30b0\u30ca\u30eb\u30be\u30fc\u30f3\uff09", normal: "\u901a\u5e38",
      sortBy: "\u4e26\u3079\u66ff\u3048", ibActivity: "\u6a5f\u95a2\u6d3b\u52d5", mediaCoverage: "\u30e1\u30c7\u30a3\u30a2\u5831\u9053", mediaLowFirst: "\u30e1\u30c7\u30a3\u30a2\uff08\u4f4e\u3044\u9806\uff09",
      mediaSays: "\u30e1\u30c7\u30a3\u30a2\u5831\u9053", ibsAreDoing: "\u6a5f\u95a2\u306e\u884c\u52d5", minimalCoverage: "\u5831\u9053\u306f\u307b\u3068\u3093\u3069\u306a\u3057",
      howNewsGapWorks: "\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7\u306e\u4ed5\u7d44\u307f", theTheory: "\u7406\u8ad6",
      theTheoryText: "\u6a5f\u95a2\u6295\u8cc7\u5bb6\u306f\u56db\u534a\u671f\u3054\u3068\u306b13F\u5831\u544a\u66f8\u3092\u63d0\u51fa\u3057\u3001\u4fdd\u6709\u72b6\u6cc1\u3092\u958b\u793a\u3057\u307e\u3059\u3002\u3053\u308c\u3089\u306e\u5831\u544a\u66f8\u306f\u6700\u3082\u7cbe\u901a\u3057\u305f\u6295\u8cc7\u5bb6\u304c\u4f55\u3092\u58f2\u8cb7\u3057\u3066\u3044\u308b\u304b\u3092\u793a\u3057\u307e\u3059\u3002\u4e00\u65b9\u3001\u30e1\u30c7\u30a3\u30a2\u5831\u9053\u306f\u4e00\u822c\u5927\u8846\u3068\u500b\u4eba\u6295\u8cc7\u5bb6\u304c\u6ce8\u76ee\u3057\u3066\u3044\u308b\u3082\u306e\u3092\u53cd\u6620\u3057\u307e\u3059\u3002",
      whySilenceMatters: "\u306a\u305c\u6c88\u9ed9\u304c\u91cd\u8981\u304b",
      whySilenceMattersText: "\u6a5f\u95a2\u306e\u8cb7\u3044\u6d3b\u52d5\u3068\u30e1\u30c7\u30a3\u30a2\u306e\u6ce8\u76ee\u306e\u9593\u306b\u5927\u304d\u306a\u30ae\u30e3\u30c3\u30d7\u304c\u3042\u308b\u5834\u5408\u3001\u305d\u308c\u306f\u30b9\u30de\u30fc\u30c8\u30de\u30cd\u30fc\u304c\u5e02\u5834\u304c\u307e\u3060\u8a8d\u8b58\u3057\u3066\u3044\u306a\u3044\u6a5f\u4f1a\u3092\u767a\u898b\u3057\u305f\u3053\u3068\u3092\u610f\u5473\u3057\u307e\u3059\u3002"
    },
    home: {
      heroHeadline: "<accent>\u30b9\u30de\u30fc\u30c8\u30de\u30cd\u30fc</accent>\u304c\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u3092\u901a\u3058\u3066\u3069\u3053\u306b\u6d41\u308c\u308b\u304b\u3092\u8ffd\u8de1",
      exploreSupplyChains: "\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u3092\u63a2\u7d22", viewSignals: "\u30b7\u30b0\u30ca\u30eb\u3092\u898b\u308b", livePreview: "\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30d7\u30ec\u30d3\u30e5\u30fc",
      socialProof: { investors: "\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u3092\u8ffd\u8de1\u3059\u308b\u6295\u8cc7\u5bb6", companies: "\u30de\u30c3\u30d4\u30f3\u30b0\u6e08\u307f\u4f01\u696d", sectors: "\u30ab\u30d0\u30fc\u30bb\u30af\u30bf\u30fc", flows: "\u8ffd\u8de1\u6e08\u307f\u6a5f\u95a2\u8cc7\u91d1\u30d5\u30ed\u30fc" },
      featuredSectors: "\u6ce8\u76ee\u30bb\u30af\u30bf\u30fc", featuredSectorsDesc: "\u5404\u4e3b\u8981\u30bb\u30af\u30bf\u30fc\u306e\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30de\u30c3\u30d7\u3068\u30ab\u30b9\u30b1\u30fc\u30c9\u30d1\u30bf\u30fc\u30f3\u3092\u63a2\u7d22\u3002",
      explore: "\u63a2\u7d22", companies: "{count}\u793e",
      latestSignals: "\u6700\u65b0\u306e\u6a5f\u95a2\u6295\u8cc7\u5bb6\u30b7\u30b0\u30ca\u30eb", latestSignalsDesc: "\u91cd\u8981\u306a\u6a5f\u95a2\u6d3b\u52d5\u3092\u793a\u3059\u6700\u65b0\u306e13F\u5831\u544a\u66f8\u3002",
      viewAllSignals: "\u3059\u3079\u3066\u306e\u30b7\u30b0\u30ca\u30eb\u3092\u898b\u308b",
      fourLenses: "\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30a2\u30eb\u30d5\u30a1\u306e4\u3064\u306e\u8996\u70b9",
      fourLensesDesc: "ChainFlow\u306f\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30de\u30c3\u30d4\u30f3\u30b0\u3001\u6a5f\u95a2\u30b7\u30b0\u30ca\u30eb\u691c\u51fa\u3001\u30ab\u30b9\u30b1\u30fc\u30c9\u5206\u6790\u3001\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7\u30b9\u30b3\u30a2\u3092\u4e00\u3064\u306e\u30d7\u30e9\u30c3\u30c8\u30d5\u30a9\u30fc\u30e0\u306b\u7d71\u5408\u3002",
      featureCards: { supplyChainMaps: "\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30de\u30c3\u30d7", institutionalFlowSignals: "\u6a5f\u95a2\u8cc7\u91d1\u30d5\u30ed\u30fc\u30b7\u30b0\u30ca\u30eb", leaderToMidcapCascade: "\u30ea\u30fc\u30c0\u30fc\u304b\u3089\u4e2d\u578b\u682a\u3078\u306e\u30ab\u30b9\u30b1\u30fc\u30c9", newsGapAnalyzer: "\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7\u30a2\u30ca\u30e9\u30a4\u30b6\u30fc" },
      howItWorks: "\u4f7f\u3044\u65b9",
      steps: {
        mapTheChain: "\u30c1\u30a7\u30fc\u30f3\u3092\u30de\u30c3\u30d4\u30f3\u30b0", mapTheChainDesc: "\u30b5\u30d7\u30e9\u30a4\u30e4\u30fc\u3001\u9867\u5ba2\u3001\u30d1\u30fc\u30c8\u30ca\u30fc\u95a2\u4fc2\u3092\u901a\u3058\u3066\u4f01\u696d\u304c\u3069\u306e\u3088\u3046\u306b\u3064\u306a\u304c\u3063\u3066\u3044\u308b\u304b\u3092\u793a\u3059\u30a4\u30f3\u30bf\u30e9\u30af\u30c6\u30a3\u30d6\u306a\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30b0\u30e9\u30d5\u3092\u63a2\u7d22\u3002",
        detectTheSignal: "\u30b7\u30b0\u30ca\u30eb\u3092\u691c\u51fa", detectTheSignalDesc: "\u6a5f\u95a2\u306e13F\u5831\u544a\u66f8\u3067\u7570\u5e38\u306a\u8cb7\u3044\u5897\u3057\u30d1\u30bf\u30fc\u30f3\u3092\u76e3\u8996\u3002\u30e1\u30c7\u30a3\u30a2\u5831\u9053\u3068\u7167\u5408\u3057\u3066\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7\u3092\u767a\u898b\u3002",
        tradeTheCascade: "\u30ab\u30b9\u30b1\u30fc\u30c9\u53d6\u5f15", tradeTheCascadeDesc: "\u30ea\u30fc\u30c0\u30fc\u682a\u304c\u52d5\u3044\u305f\u3068\u304d\u3001\u30ab\u30b9\u30b1\u30fc\u30c9\u30c8\u30e9\u30c3\u30ab\u30fc\u3067\u3069\u306e\u5ddd\u4e0b\u682a\u304c\u3044\u3064\u8ffd\u968f\u3059\u308b\u304b\u3092\u7279\u5b9a\u3002"
      },
      startExploringNow: "\u4eca\u3059\u3050\u63a2\u7d22\u3092\u59cb\u3081\u308b",
      disclaimer: "ChainFlow\u306f\u60c5\u5831\u63d0\u4f9b\u306e\u307f\u3092\u76ee\u7684\u3068\u3057\u3066\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30c7\u30fc\u30bf\u3092\u63d0\u4f9b\u3057\u3066\u3044\u307e\u3059\u3002\u6295\u8cc7\u52a9\u8a00\u306b\u306f\u8a72\u5f53\u3057\u307e\u305b\u3093\u3002\u904e\u53bb\u306e\u6a5f\u95a2\u6d3b\u52d5\u306f\u5c06\u6765\u306e\u30ea\u30bf\u30fc\u30f3\u3092\u4fdd\u8a3c\u3059\u308b\u3082\u306e\u3067\u306f\u3042\u308a\u307e\u305b\u3093\u3002"
    },
    feedback: {
      sendFeedback: "\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af\u3092\u9001\u4fe1", helpImprove: "ChainFlow\u306e\u6539\u5584\u306b\u3054\u5354\u529b\u304f\u3060\u3055\u3044",
      feedbackType: "\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af\u306e\u7a2e\u985e", bugReport: "\u4e0d\u5177\u5408\u306e\u5831\u544a", featureRequest: "\u6a5f\u80fd\u30ea\u30af\u30a8\u30b9\u30c8", generalFeedback: "\u4e00\u822c\u7684\u306a\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af",
      message: "\u30e1\u30c3\u30bb\u30fc\u30b8", tellUs: "\u3054\u610f\u898b\u3092\u304a\u805e\u304b\u305b\u304f\u3060\u3055\u3044...", cancel: "\u30ad\u30e3\u30f3\u30bb\u30eb", submitBtn: "\u9001\u4fe1"
    },
    common: { share: "\u5171\u6709", copied: "\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f\uff01", home: "\u30db\u30fc\u30e0" },
    footer: {
      product: "\u30d7\u30ed\u30c0\u30af\u30c8", resources: "\u30ea\u30bd\u30fc\u30b9", legal: "\u6cd5\u7684\u60c5\u5831", company: "\u4f1a\u793e\u60c5\u5831",
      explore: "\u63a2\u7d22", cascade: "\u30ab\u30b9\u30b1\u30fc\u30c9", signals: "\u30b7\u30b0\u30ca\u30eb", newsGap: "\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7",
      blog: "\u30d6\u30ed\u30b0", howToUse: "\u4f7f\u3044\u65b9", faq: "FAQ", privacyPolicy: "\u30d7\u30e9\u30a4\u30d0\u30b7\u30fc\u30dd\u30ea\u30b7\u30fc",
      termsOfService: "\u5229\u7528\u898f\u7d04", about: "\u6982\u8981", contact: "\u304a\u554f\u3044\u5408\u308f\u305b"
    },
    emailCta: {
      title: "\u9031\u9593\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30a4\u30f3\u30b5\u30a4\u30c8\u3092\u53d7\u3051\u53d6\u308b",
      description: "\u6a5f\u95a2\u8cc7\u91d1\u30d5\u30ed\u30fc\u30b7\u30b0\u30ca\u30eb\u3001\u30ab\u30b9\u30b1\u30fc\u30c9\u30a2\u30e9\u30fc\u30c8\u3001\u30cb\u30e5\u30fc\u30b9\u30ae\u30e3\u30c3\u30d7\u5206\u6790\u3092\u6bce\u9031\u6708\u66dc\u65e5\u306b\u304a\u5c4a\u3051\u3002",
      placeholder: "you@example.com", subscribe: "\u8cfc\u8aad", subscribed: "\u8cfc\u8aad\u5b8c\u4e86\uff01",
      subscribedDesc: "\u9031\u9593\u30b5\u30d7\u30e9\u30a4\u30c1\u30a7\u30fc\u30f3\u30a4\u30f3\u30b5\u30a4\u30c8\u3092\u304a\u9001\u308a\u3057\u307e\u3059\u3002",
      invalidEmail: "\u6709\u52b9\u306a\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002"
    }
  }
};

// Due to the massive size, let me generate a template approach for remaining languages
// I'll create a mapping structure and apply it

const messagesDir = path.join(__dirname, '..', 'messages');

// Apply Japanese translations
const jaPath = path.join(messagesDir, 'ja.json');
const ja = JSON.parse(fs.readFileSync(jaPath, 'utf8'));
deepMerge(ja, allTranslations.ja);
fs.writeFileSync(jaPath, JSON.stringify(ja, null, 2) + '\n');
console.log('Updated ja.json');

// For the remaining languages, I'll build from the English as a template
// and replace with proper translations
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'));

// Extract just the new keys from en.json
function getNewKeys() {
  return {
    nav: { feedback: true },
    explore: { sectors: true, relationships: true, sidePanel: true, loadingGraph: true, noCompaniesMatch: true, companiesCount: true },
    company: { notFound: true, notFoundDesc: true, backToExplorer: true, productsAndRevenue: true, productRevenueShare: true, revenueBreakdown: true, segment: true, share: true, supplyChainRelationships: true, partners: true, impact: true, institutionalSignals: true, institution: true, action: true, shares: true, value: true, date: true, aiAnalysis: true, getAiAnalysis: true, analyzing: true, aiPrompt: true, companyInfo: true, newsGapScore: true, gapScore: true, lowGap: true, highGap: true, ibActivity: true, mediaScore: true, cascadePosition: true, roleInCascade: true, typicalDelay: true, viewFullCascade: true },
    cascade: { tracker: true, leaderToMidcap: true, cascadeDescription: true, leader: true, steps: true, events: true, more: true, cascadeFlow: true, historicalOccurrences: true, earningsCascade: true, stepsAndEvents: true, roleLabels: true, trigger: true, leaderMove: true, cascadeResult: true, currentStatus: true, currentStatusDesc: true, monitoring: true, notFound: true, notFoundDesc: true, backToCascades: true },
    signals: { filters: true, allSectors: true, allActions: true, actions: true, sortByDate: true, sortByValue: true, sortByGap: true, sectorActivity: true, mostActiveInstitutions: true, signalsCount: true, company: true, institution: true, action: true, sharesChanged: true, value: true, gapScore: true, filingDate: true, noSignalsMatch: true },
    newsGap: { silenceIsSignal: true, heroExplanation: true, ibVsMedia: true, ibVsMediaDesc: true, mediaCoverageScore: true, ibActivityScore: true, highGapSignal: true, normal: true, sortBy: true, ibActivity: true, mediaCoverage: true, mediaLowFirst: true, mediaSays: true, ibsAreDoing: true, minimalCoverage: true, howNewsGapWorks: true, theTheory: true, theTheoryText: true, whySilenceMatters: true, whySilenceMattersText: true },
    home: true,
    feedback: { sendFeedback: true, helpImprove: true, feedbackType: true, bugReport: true, featureRequest: true, generalFeedback: true, message: true, tellUs: true, cancel: true, submitBtn: true },
    common: { share: true, copied: true, home: true },
    footer: { product: true, resources: true, legal: true, company: true, explore: true, cascade: true, signals: true, newsGap: true, blog: true, howToUse: true, faq: true, privacyPolicy: true, termsOfService: true, about: true, contact: true },
    emailCta: true
  };
}

console.log('Done with ja.json. Remaining languages need separate translation files.');
