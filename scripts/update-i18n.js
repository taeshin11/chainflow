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

const translations = {
  ko: {
    nav: { feedback: "\ud53c\ub4dc\ubc31" },
    explore: {
      sectors: { all: "\uc804\uccb4", semiconductors: "\ubc18\ub3c4\uccb4", "ai-cloud": "AI / \ud074\ub77c\uc6b0\ub4dc", "ev-battery": "EV / \ubc30\ud130\ub9ac", defense: "\ubc29\uc704", "pharma-biotech": "\uc81c\uc57d / \ubc14\uc774\uc624" },
      relationships: { supplier: "\uacf5\uae09\uc5c5\uccb4", customer: "\uace0\uac1d\uc0ac", partner: "\ud30c\ud2b8\ub108", competitor: "\uacbd\uc7c1\uc0ac" },
      sidePanel: { products: "\uc81c\ud488", revenueBreakdown: "\ub9e4\ucd9c \uad6c\uc131", relatedCompanies: "\uad00\ub828 \uae30\uc5c5", cap: "\uc2dc\uac00\ucd1d\uc561", role: "\uc5ed\ud560", viewProfile: "\uc804\uccb4 \ud504\ub85c\ud544 \ubcf4\uae30", viewCascade: "\uc5f0\uc1c4 \ubd84\uc11d \ubcf4\uae30" },
      loadingGraph: "\uadf8\ub798\ud504 \ub85c\ub529 \uc911...", noCompaniesMatch: "\ud544\ud130 \uc870\uac74\uc5d0 \ub9de\ub294 \uae30\uc5c5\uc774 \uc5c6\uc2b5\ub2c8\ub2e4", companiesCount: "{count}\uac1c \uae30\uc5c5"
    },
    company: {
      notFound: "\uae30\uc5c5\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4", notFoundDesc: "\ud2f0\ucee4 \"{ticker}\"\uc5d0 \ud574\ub2f9\ud558\ub294 \uae30\uc5c5\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.", backToExplorer: "\ud0d0\uc0c9\uae30\ub85c \ub3cc\uc544\uac00\uae30",
      productsAndRevenue: "\uc81c\ud488 \ubc0f \ub9e4\ucd9c", productRevenueShare: "\uc81c\ud488\ubcc4 \ub9e4\ucd9c \ube44\uc911", revenueBreakdown: "\ub9e4\ucd9c \uad6c\uc131",
      segment: "\ubd80\ubb38", share: "\ube44\uc911", supplyChainRelationships: "\uacf5\uae09\ub9dd \uad00\uacc4", partners: "\ud30c\ud2b8\ub108", impact: "\uc601\ud5a5",
      institutionalSignals: "\uae30\uad00 \uc2dc\uadf8\ub110", institution: "\uae30\uad00", action: "\ud589\ub3d9", shares: "\uc8fc\uc2dd \uc218", value: "\uac00\uce58", date: "\ub0a0\uc9dc",
      aiAnalysis: "AI \ubd84\uc11d", getAiAnalysis: "AI \ubd84\uc11d \ubc1b\uae30", analyzing: "\ubd84\uc11d \uc911...",
      aiPrompt: "{company}\uc758 AI \uacf5\uae09\ub9dd \ubd84\uc11d\uc744 \ubc1b\uc73c\ub824\uba74 \"AI \ubd84\uc11d \ubc1b\uae30\"\ub97c \ud074\ub9ad\ud558\uc138\uc694.",
      companyInfo: "\uae30\uc5c5 \uc815\ubcf4", newsGapScore: "\ub274\uc2a4 \uac2d \uc810\uc218", gapScore: "\uac2d \uc810\uc218", lowGap: "\ub0ae\uc740 \uac2d", highGap: "\ub192\uc740 \uac2d",
      ibActivity: "\uae30\uad00 \ud65c\ub3d9", mediaScore: "\ubbf8\ub514\uc5b4 \uc810\uc218", cascadePosition: "\uc5f0\uc1c4 \uc704\uce58", roleInCascade: "\uc5f0\uc1c4 \ub0b4 \uc5ed\ud560",
      typicalDelay: "\uc77c\ubc18\uc801 \uc9c0\uc5f0", viewFullCascade: "\uc804\uccb4 \uc5f0\uc1c4 \ubd84\uc11d \ubcf4\uae30"
    },
    cascade: {
      tracker: "\uc5f0\uc1c4 \ud2b8\ub798\ucee4", leaderToMidcap: "\ub9ac\ub354-\uc911\ud615\uc8fc \uc5f0\uc1c4 \ud2b8\ub798\ucee4",
      cascadeDescription: "\ub9ac\ub354 \uc885\ubaa9\uc774 \uc6c0\uc9c1\uc774\uba74 \uc2dc\uadf8\ub110\uc774 \uacf5\uae09\uc5c5\uccb4, \uace0\uac1d\uc0ac, \uc911\ud615\uc8fc\ub85c \uba70\uce60\uc5d0 \uac78\uccd0 \uc804\ud30c\ub429\ub2c8\ub2e4.",
      leader: "\ub9ac\ub354", steps: "{count}\ub2e8\uacc4", events: "{count}\uac74\uc758 \uc774\ubca4\ud2b8", more: "+{count}\uac1c \ub354",
      cascadeFlow: "\uc5f0\uc1c4 \ud750\ub984", historicalOccurrences: "\uacfc\uac70 \uc0ac\ub840", earningsCascade: "\uc2e4\uc801 \uc5f0\uc1c4",
      stepsAndEvents: "{steps}\ub2e8\uacc4 \u00b7 {events}\uac74\uc758 \uacfc\uac70 \uc774\ubca4\ud2b8",
      roleLabels: { leader: "\ub9ac\ub354", first_follower: "1\ucc28 \ucd94\uc885\uc790", mid_cap: "\uc911\uac04 \uccb4\uc778", late_mover: "\ud6c4\ubc1c \uc8fc\uc790" },
      trigger: "\ud2b8\ub9ac\uac70", leaderMove: "\ub9ac\ub354 \uc6c0\uc9c1\uc784", cascadeResult: "\uc5f0\uc1c4 \uacb0\uacfc", currentStatus: "\ud604\uc7ac \uc0c1\ud0dc",
      currentStatusDesc: "\ud65c\uc131 \uc5f0\uc1c4\uac00 \uac10\uc9c0\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4. \ub2e4\uc74c \uc7a0\uc7ac\uc801 \ud2b8\ub9ac\uac70\ub294 {ticker} \uc2e4\uc801 \ubc1c\ud45c\uc785\ub2c8\ub2e4.",
      monitoring: "\ubaa8\ub2c8\ud130\ub9c1 \uc911", notFound: "\uc5f0\uc1c4 \ubd84\uc11d\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4",
      notFoundDesc: "\uc139\ud130 \"{sector}\"\uc5d0 \ub300\ud55c \uc5f0\uc1c4 \ud328\ud134\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.", backToCascades: "\uc5f0\uc1c4 \ubd84\uc11d\uc73c\ub85c \ub3cc\uc544\uac00\uae30"
    },
    signals: {
      filters: "\ud544\ud130", allSectors: "\uc804\uccb4 \uc139\ud130", allActions: "\uc804\uccb4 \ud589\ub3d9",
      actions: { accumulating: "\ub9e4\uc9d1 \uc911", reducing: "\ucd95\uc18c \uc911", new_position: "\uc2e0\uaddc \ud3ec\uc9c0\uc158", exit: "\uccad\uc0b0" },
      sortByDate: "\ub0a0\uc9dc\uc21c", sortByValue: "\uac00\uce58\uc21c", sortByGap: "\uac2d \uc810\uc218\uc21c",
      sectorActivity: "\uc139\ud130\ubcc4 \ud65c\ub3d9", mostActiveInstitutions: "\uac00\uc7a5 \ud65c\ubc1c\ud55c \uae30\uad00", signalsCount: "{count}\uac1c \uc2dc\uadf8\ub110",
      company: "\uae30\uc5c5", institution: "\uae30\uad00", action: "\ud589\ub3d9", sharesChanged: "\uc8fc\uc2dd \ubcc0\ub3d9", value: "\uac00\uce58", gapScore: "\uac2d \uc810\uc218", filingDate: "\uc2e0\uace0\uc77c",
      noSignalsMatch: "\ud544\ud130 \uc870\uac74\uc5d0 \ub9de\ub294 \uc2dc\uadf8\ub110\uc774 \uc5c6\uc2b5\ub2c8\ub2e4. \uae30\uc900\uc744 \uc870\uc815\ud574 \ubcf4\uc138\uc694."
    },
    newsGap: {
      silenceIsSignal: "\uce68\ubb35\uc774 \ubc14\ub85c <accent>\uc2dc\uadf8\ub110</accent>\uc774\ub2e4",
      heroExplanation: "\uae30\uad00 \ud22c\uc790\uc790\uac00 \ubbf8\ub514\uc5b4\uac00 \ubb34\uc2dc\ud558\ub294 \uc885\ubaa9\uc744 \uc870\uc6a9\ud788 \ub9e4\uc9d1\ud560 \ub54c, \uc774 \uad34\ub9ac\ub294 \uc885\uc885 \ud070 \uac00\uaca9 \ubcc0\ub3d9\uc744 \uc120\ud589\ud569\ub2c8\ub2e4. \uc6b0\ub9ac\ub294 \uc774 \uac2d\uc744 \uce21\uc815\ud569\ub2c8\ub2e4.",
      ibVsMedia: "\uae30\uad00 \ud65c\ub3d9 vs \ubbf8\ub514\uc5b4 \ubcf4\ub3c4",
      ibVsMediaDesc: "<accent>\uc88c\uc0c1\ub2e8 \uc0ac\ubd84\uba74</accent>\uc5d0 \uc704\uce58\ud55c \uae30\uc5c5(\ub192\uc740 \uae30\uad00 \ud65c\ub3d9, \ub0ae\uc740 \ubbf8\ub514\uc5b4)\uc774 \uac00\uc7a5 \uac15\ud55c \uc2dc\uadf8\ub110\uc785\ub2c8\ub2e4.",
      mediaCoverageScore: "\ubbf8\ub514\uc5b4 \ubcf4\ub3c4 \uc810\uc218", ibActivityScore: "\uae30\uad00 \ud65c\ub3d9 \uc810\uc218",
      highGapSignal: "\ub192\uc740 \uac2d (\uc2dc\uadf8\ub110 \uad6c\uac04)", normal: "\uc77c\ubc18",
      sortBy: "\uc815\ub82c \uae30\uc900", ibActivity: "\uae30\uad00 \ud65c\ub3d9", mediaCoverage: "\ubbf8\ub514\uc5b4 \ubcf4\ub3c4", mediaLowFirst: "\ubbf8\ub514\uc5b4 (\ub0ae\uc740 \uc21c)",
      mediaSays: "\ubbf8\ub514\uc5b4 \ubcf4\ub3c4", ibsAreDoing: "\uae30\uad00 \ud589\ub3d9", minimalCoverage: "\ubcf4\ub3c4 \uac70\uc758 \uc5c6\uc74c",
      howNewsGapWorks: "\ub274\uc2a4 \uac2d \uc791\ub3d9 \uc6d0\ub9ac", theTheory: "\uc774\ub860",
      theTheoryText: "\uae30\uad00 \ud22c\uc790\uc790\ub294 \ubd84\uae30\ubcc4\ub85c 13F \ubcf4\uace0\uc11c\ub97c \uc81c\ucd9c\ud558\uc5ec \ubcf4\uc720 \ud604\ud669\uc744 \uacf5\uac1c\ud569\ub2c8\ub2e4. \uc774 \ubcf4\uace0\uc11c\ub294 \uac00\uc7a5 \uc815\uad50\ud55c \ud22c\uc790\uc790\ub4e4\uc774 \ubb34\uc5c7\uc744 \uc0ac\uace0 \ud30c\ub294\uc9c0 \ubcf4\uc5ec\uc90d\ub2c8\ub2e4. \ud55c\ud3b8 \ubbf8\ub514\uc5b4 \ubcf4\ub3c4\ub294 \uc77c\ubc18 \ub300\uc911\uacfc \uac1c\uc778 \ud22c\uc790\uc790\ub4e4\uc774 \uc8fc\ubaa9\ud558\ub294 \ub0b4\uc6a9\uc744 \ubc18\uc601\ud569\ub2c8\ub2e4.",
      whySilenceMatters: "\uce68\ubb35\uc774 \uc911\uc694\ud55c \uc774\uc720",
      whySilenceMattersText: "\uae30\uad00\uc758 \ub9e4\uc218 \ud65c\ub3d9\uacfc \ubbf8\ub514\uc5b4 \uad00\uc2ec \uc0ac\uc774\uc5d0 \ud070 \uaca9\ucc28\uac00 \uc788\uc744 \ub54c, \uc774\ub294 \uc885\uc885 \uc2a4\ub9c8\ud2b8 \uba38\ub2c8\uac00 \uc2dc\uc7a5\uc774 \uc544\uc9c1 \uc778\uc2dd\ud558\uc9c0 \ubabb\ud55c \uae30\ud68c\ub97c \ubc1c\uacac\ud588\uc74c\uc744 \uc758\ubbf8\ud569\ub2c8\ub2e4."
    },
    home: {
      heroHeadline: "<accent>\uc2a4\ub9c8\ud2b8 \uba38\ub2c8</accent>\uac00 \uacf5\uae09\ub9dd\uc744 \ud1b5\ud574 \uc5b4\ub514\ub85c \ud750\ub974\ub294\uc9c0 \ucd94\uc801\ud558\uc138\uc694",
      exploreSupplyChains: "\uacf5\uae09\ub9dd \ud0d0\uc0c9\ud558\uae30", viewSignals: "\uc2dc\uadf8\ub110 \ubcf4\uae30", livePreview: "\uc2e4\uc2dc\uac04 \uacf5\uae09\ub9dd \ubbf8\ub9ac\ubcf4\uae30",
      socialProof: { investors: "\uacf5\uae09\ub9dd\uc744 \ucd94\uc801\ud558\ub294 \ud22c\uc790\uc790", companies: "\ub9e4\ud551\ub41c \uae30\uc5c5", sectors: "\ucee4\ubc84 \uc139\ud130", flows: "\ucd94\uc801\ub41c \uae30\uad00 \uc790\uae08 \ud750\ub984" },
      featuredSectors: "\uc8fc\uc694 \uc139\ud130", featuredSectorsDesc: "\uac01 \uc8fc\uc694 \uc139\ud130\uc758 \uacf5\uae09\ub9dd \uc9c0\ub3c4\uc640 \uc5f0\uc1c4 \ud328\ud134\uc744 \uc0b4\ud3b4\ubcf4\uc138\uc694.",
      explore: "\ud0d0\uc0c9", companies: "{count}\uac1c \uae30\uc5c5",
      latestSignals: "\ucd5c\uc2e0 \uae30\uad00 \uc2dc\uadf8\ub110", latestSignalsDesc: "\uc8fc\uc694 \uae30\uad00 \ud65c\ub3d9\uc744 \ubcf4\uc5ec\uc8fc\ub294 \ucd5c\uadfc 13F \ubcf4\uace0\uc11c.",
      viewAllSignals: "\ubaa8\ub4e0 \uc2dc\uadf8\ub110 \ubcf4\uae30",
      fourLenses: "\uacf5\uae09\ub9dd \uc54c\ud30c\uc758 \ub124 \uac00\uc9c0 \uad00\uc810",
      fourLensesDesc: "ChainFlow\ub294 \uacf5\uae09\ub9dd \ub9e4\ud551, \uae30\uad00 \uc2dc\uadf8\ub110 \uac10\uc9c0, \uc5f0\uc1c4 \ubd84\uc11d, \ub274\uc2a4 \uac2d \uc810\uc218\ub97c \ud558\ub098\uc758 \ud50c\ub7ab\ud3fc\uc5d0 \ud1b5\ud569\ud569\ub2c8\ub2e4.",
      featureCards: { supplyChainMaps: "\uacf5\uae09\ub9dd \uc9c0\ub3c4", institutionalFlowSignals: "\uae30\uad00 \uc790\uae08 \ud750\ub984 \uc2dc\uadf8\ub110", leaderToMidcapCascade: "\ub9ac\ub354-\uc911\ud615\uc8fc \uc5f0\uc1c4", newsGapAnalyzer: "\ub274\uc2a4 \uac2d \ubd84\uc11d\uae30" },
      howItWorks: "\uc774\uc6a9 \ubc29\ubc95",
      steps: {
        mapTheChain: "\uccb4\uc778 \ub9e4\ud551", mapTheChainDesc: "\uacf5\uae09\uc5c5\uccb4, \uace0\uac1d\uc0ac, \ud30c\ud2b8\ub108 \uad00\uacc4\ub97c \ud1b5\ud574 \uae30\uc5c5\uc774 \uc5b4\ub5bb\uac8c \uc5f0\uacb0\ub418\uc5b4 \uc788\ub294\uc9c0 \ubcf4\uc5ec\uc8fc\ub294 \uc778\ud130\ub799\ud2f0\ube0c \uacf5\uae09\ub9dd \uadf8\ub798\ud504\ub97c \ud0d0\uc0c9\ud558\uc138\uc694.",
        detectTheSignal: "\uc2dc\uadf8\ub110 \uac10\uc9c0", detectTheSignalDesc: "\uae30\uad00\uc758 13F \ubcf4\uace0\uc11c\uc5d0\uc11c \uc774\ub840\uc801\uc778 \ub9e4\uc9d1 \ud328\ud134\uc744 \ubaa8\ub2c8\ud130\ub9c1\ud558\uc138\uc694. \ubbf8\ub514\uc5b4 \ubcf4\ub3c4\uc640 \uad50\ucc28 \ucc38\uc870\ud558\uc5ec \ub274\uc2a4 \uac2d\uc744 \ucc3e\uc73c\uc138\uc694.",
        tradeTheCascade: "\uc5f0\uc1c4 \ub9e4\ub9e4", tradeTheCascadeDesc: "\ub9ac\ub354 \uc885\ubaa9\uc774 \uc6c0\uc9c1\uc77c \ub54c, \uc5f0\uc1c4 \ud2b8\ub798\ucee4\ub97c \uc0ac\uc6a9\ud558\uc5ec \uc5b4\ub5a4 \ud558\ub958 \uc885\ubaa9\uc774 \uc5b8\uc81c \ub530\ub77c\uac08\uc9c0 \uc2dd\ubcc4\ud558\uc138\uc694."
      },
      startExploringNow: "\uc9c0\uae08 \ud0d0\uc0c9 \uc2dc\uc791\ud558\uae30",
      disclaimer: "ChainFlow\ub294 \uc815\ubcf4 \uc81c\uacf5 \ubaa9\uc801\uc73c\ub85c\ub9cc \uacf5\uae09\ub9dd \ub370\uc774\ud130\ub97c \uc81c\uacf5\ud569\ub2c8\ub2e4. \ud22c\uc790 \uc870\uc5b8\uc5d0 \ud574\ub2f9\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uacfc\uac70 \uae30\uad00 \ud65c\ub3d9\uc774 \ubbf8\ub798 \uc218\uc775\uc744 \ubcf4\uc7a5\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \ud22c\uc790 \uacb0\uc815 \uc804 \ubc18\ub4dc\uc2dc \uc790\uccb4\uc801\uc73c\ub85c \uc870\uc0ac\ud558\uc2dc\uae30 \ubc14\ub78d\ub2c8\ub2e4."
    },
    feedback: {
      sendFeedback: "\ud53c\ub4dc\ubc31 \ubcf4\ub0b4\uae30", helpImprove: "ChainFlow \uac1c\uc120\uc5d0 \ub3c4\uc6c0\uc744 \uc8fc\uc138\uc694",
      feedbackType: "\ud53c\ub4dc\ubc31 \uc720\ud615", bugReport: "\ubc84\uadf8 \uc2e0\uace0", featureRequest: "\uae30\ub2a5 \uc694\uccad", generalFeedback: "\uc77c\ubc18 \ud53c\ub4dc\ubc31",
      message: "\uba54\uc2dc\uc9c0", tellUs: "\uc758\uacac\uc744 \uc790\uc720\ub86d\uac8c \uc801\uc5b4\uc8fc\uc138\uc694...", cancel: "\ucde8\uc18c", submitBtn: "\uc81c\ucd9c"
    },
    common: { share: "\uacf5\uc720", copied: "\ubcf5\uc0ac\ub428!", home: "\ud648" },
    footer: {
      product: "\uc81c\ud488", resources: "\ub9ac\uc18c\uc2a4", legal: "\ubc95\uc801 \uace0\uc9c0", company: "\ud68c\uc0ac",
      explore: "\ud0d0\uc0c9", cascade: "\uc5f0\uc1c4 \ubd84\uc11d", signals: "\uc2dc\uadf8\ub110", newsGap: "\ub274\uc2a4 \uac2d",
      blog: "\ube14\ub85c\uadf8", howToUse: "\uc0ac\uc6a9\ubc95", faq: "FAQ", privacyPolicy: "\uac1c\uc778\uc815\ubcf4 \ucc98\ub9ac\ubc29\uce68",
      termsOfService: "\uc774\uc6a9\uc57d\uad00", about: "\uc18c\uac1c", contact: "\ubb38\uc758\ud558\uae30"
    },
    emailCta: {
      title: "\uc8fc\uac04 \uacf5\uae09\ub9dd \uc778\uc0ac\uc774\ud2b8 \ubc1b\uae30",
      description: "\uae30\uad00 \uc790\uae08 \ud750\ub984 \uc2dc\uadf8\ub110, \uc5f0\uc1c4 \uc54c\ub9bc, \ub274\uc2a4 \uac2d \ubd84\uc11d\uc744 \ub9e4\uc8fc \uc6d4\uc694\uc77c \uc774\uba54\uc77c\ub85c \ubc1b\uc73c\uc138\uc694.",
      placeholder: "you@example.com", subscribe: "\uad6c\ub3c5\ud558\uae30", subscribed: "\uad6c\ub3c5 \uc644\ub8cc!",
      subscribedDesc: "\uc8fc\uac04 \uacf5\uae09\ub9dd \uc778\uc0ac\uc774\ud2b8\ub97c \ubcf4\ub0b4\ub4dc\ub9ac\uaca0\uc2b5\ub2c8\ub2e4.",
      invalidEmail: "\uc720\ud6a8\ud55c \uc774\uba54\uc77c \uc8fc\uc18c\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694."
    }
  }
};

// Process ko
const messagesDir = path.join(__dirname, '..', 'messages');
const koPath = path.join(messagesDir, 'ko.json');
const ko = JSON.parse(fs.readFileSync(koPath, 'utf8'));
deepMerge(ko, translations.ko);
fs.writeFileSync(koPath, JSON.stringify(ko, null, 2) + '\n');
console.log('Updated ko.json');

// Now we need to generate translations for all other languages
// Read en.json for reference of all keys
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'));

// Get all keys that need to be added (new keys not in original files)
const newSections = ['explore.sectors', 'explore.relationships', 'explore.sidePanel', 'explore.loadingGraph', 'explore.noCompaniesMatch', 'explore.companiesCount'];

// For remaining languages, we need comprehensive translations
// Let me output which files need updating and what keys are missing
const langs = ['ja', 'zh-CN', 'zh-TW', 'es', 'de', 'fr', 'pt', 'hi', 'ar', 'vi', 'th', 'id', 'ru', 'tr'];

for (const lang of langs) {
  const langPath = path.join(messagesDir, lang + '.json');
  const data = JSON.parse(fs.readFileSync(langPath, 'utf8'));

  // Check what's missing
  let missing = 0;
  function checkKeys(enObj, langObj, prefix) {
    for (const key of Object.keys(enObj)) {
      const fullKey = prefix ? prefix + '.' + key : key;
      if (typeof enObj[key] === 'object' && !Array.isArray(enObj[key])) {
        if (!langObj[key]) { missing++; langObj[key] = {}; }
        checkKeys(enObj[key], langObj[key], fullKey);
      } else {
        if (langObj[key] === undefined) {
          missing++;
        }
      }
    }
  }
  checkKeys(en, data, '');
  console.log(lang + ': ' + missing + ' missing keys');
}
