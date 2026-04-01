// Localized company names for multilingual search
// Keys are company tickers, values are arrays of localized names/aliases
export const companyNamesI18n: Record<string, string[]> = {
  // Semiconductors
  NVDA: ['엔비디아', 'エヌビディア', '英伟达', '輝達', 'エヌヴィディア'],
  TSM: ['TSMC', '대만반도체', '台積電', '台积电', 'タイワンセミコンダクター', '타이완반도체'],
  MU: ['마이크론', 'マイクロン', '美光', '美光科技'],
  '005930.KS': ['삼성전자', '삼성', 'サムスン', 'サムスン電子', '三星电子', '三星電子', 'Samsung'],
  '000660.KS': ['SK하이닉스', 'SK海力士', 'SKハイニックス', 'エスケーハイニックス'],
  ASML: ['ASML', 'エーエスエムエル', 'ASML홀딩스', '阿斯麦'],
  AMAT: ['어플라이드머티어리얼즈', 'アプライドマテリアルズ', '应用材料', '應用材料'],
  LRCX: ['램리서치', 'ラムリサーチ', '拉姆研究', '科林研發'],
  KLAC: ['KLA', 'KLA코퍼레이션', 'ケーエルエー', '科磊'],

  // AI / Cloud
  MSFT: ['마이크로소프트', 'マイクロソフト', '微软', '微軟', 'Microsoft'],
  GOOGL: ['구글', '알파벳', 'グーグル', 'アルファベット', '谷歌', '字母表', 'Google', 'Alphabet'],
  AMZN: ['아마존', 'アマゾン', '亚马逊', '亞馬遜', 'Amazon'],
  META: ['메타', '페이스북', 'メタ', 'フェイスブック', '脸书', '臉書', 'Facebook'],
  ORCL: ['오라클', 'オラクル', '甲骨文', 'Oracle'],

  // EV / Battery
  TSLA: ['테슬라', 'テスラ', '特斯拉', 'Tesla'],
  CATL: ['CATL', '닝더스다이', '宁德时代', '寧德時代', 'CATLバッテリー'],
  '6752.T': ['파나소닉', 'パナソニック', '松下', 'Panasonic'],
  '051910.KS': ['LG에너지솔루션', 'LGエナジー', 'LG新能源', 'LG Energy'],
  BYDDF: ['비야디', 'BYD', 'ビーワイディー', '比亚迪', '比亞迪'],
  ALB: ['앨버말', 'アルベマール', '雅保', 'Albemarle'],

  // Defense
  LMT: ['록히드마틴', 'ロッキードマーティン', '洛克希德马丁', '洛克希德馬丁', 'Lockheed'],
  RTX: ['레이시온', 'RTX', 'レイセオン', '雷神', 'Raytheon'],
  NOC: ['노스롭그러먼', 'ノースロップグラマン', '诺斯罗普格鲁曼', '諾斯洛普格魯曼', 'Northrop'],
  'BA.L': ['BAE시스템즈', 'BAEシステムズ', 'BAE系统', 'BAE Systems'],
  LHX: ['L3해리스', 'L3ハリス', 'L3哈里斯', 'L3Harris'],

  // Pharma / Biotech
  PFE: ['화이자', 'ファイザー', '辉瑞', '輝瑞', 'Pfizer'],
  MRNA: ['모더나', 'モデルナ', '莫德纳', '莫德納', 'Moderna'],
  LLY: ['일라이릴리', 'イーライリリー', '礼来', '禮來', 'Eli Lilly'],
  NVO: ['노보노디스크', 'ノボノルディスク', '诺和诺德', '諾和諾德', 'Novo Nordisk'],
  REGN: ['리제네론', 'リジェネロン', '再生元', 'Regeneron'],
};

// Localized sector names for search
export const sectorNamesI18n: Record<string, string[]> = {
  semiconductors: ['반도체', '半导体', '半導體', 'セミコンダクター', '半導体', 'semiconductores', 'Halbleiter', 'semi-conducteurs', 'semicondutores', 'полупроводники', 'yarı iletkenler'],
  'ai-cloud': ['인공지능', '클라우드', 'AI', '人工智能', '雲計算', '云计算', 'クラウド', 'nube', 'Wolke', 'nuage', 'nuvem', 'облако', 'bulut'],
  'ev-battery': ['전기차', '배터리', 'EV', '电动汽车', '電動車', '電池', 'EVバッテリー', 'vehículo eléctrico', 'Elektrofahrzeug', 'véhicule électrique', 'elétrico', 'электромобиль'],
  defense: ['방위', '방산', '국방', '防务', '防衛', 'ディフェンス', 'defensa', 'Verteidigung', 'défense', 'defesa', 'оборона', 'savunma'],
  'pharma-biotech': ['제약', '바이오', '製薬', 'バイオテック', '制药', '生物技术', '製藥', '生物科技', 'farmacéutica', 'Pharma', 'pharmacie', 'farmacêutica', 'фармацевтика', 'ilaç'],
};
