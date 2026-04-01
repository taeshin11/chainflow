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

  // Mid-cap & Small-cap — Semiconductors
  MRVL: ['마벨테크놀로지', 'マーベルテクノロジー', '迈威尔科技', 'Marvell'],
  ON: ['온세미컨덕터', 'オンセミコンダクター', '安森美半导体', 'ON Semi'],
  LSCC: ['래티스세미컨덕터', 'ラティスセミコンダクター', '莱迪思半导体', 'Lattice'],
  MPWR: ['모놀리식파워', 'モノリシックパワー', '芯源系统', 'MPS'],
  AMKR: ['앰코테크놀로지', 'アムコーテクノロジー', '安靠科技', 'Amkor'],
  WOLF: ['울프스피드', 'ウルフスピード', '沃尔夫速度', 'Wolfspeed'],

  // Mid-cap & Small-cap — AI / Cloud
  PLTR: ['팔란티어', 'パランティア', '帕兰提尔', 'Palantir'],
  SNOW: ['스노우플레이크', 'スノーフレーク', '雪花公司', 'Snowflake'],
  NET: ['클라우드플레어', 'クラウドフレア', '云闪', 'Cloudflare'],
  DDOG: ['데이터독', 'データドッグ', '数据狗', 'Datadog'],
  AI: ['C3.ai', 'シースリーエーアイ', 'C3에이아이', 'C3人工智能'],

  // Mid-cap & Small-cap — EV / Battery
  RIVN: ['리비안', 'リビアン', '里维安', 'Rivian'],
  QS: ['퀀텀스케이프', 'クアンタムスケープ', '量子景观', 'QuantumScape'],
  CHPT: ['차지포인트', 'チャージポイント', '充电桩', 'ChargePoint'],
  LCID: ['루시드', 'ルーシッド', '路斯迪', 'Lucid'],
  LTHM: ['리벤트', 'リベント', '利文特', 'Livent'],

  // Mid-cap & Small-cap — Defense
  KTOS: ['크라토스', 'クラトス', '克拉托斯', 'Kratos'],
  MRCY: ['머큐리시스템즈', 'マーキュリーシステムズ', '水星系统', 'Mercury'],
  CW: ['커티스라이트', 'カーチスライト', '柯蒂斯莱特', 'Curtiss-Wright'],
  BWXT: ['BWX테크놀로지스', 'BWXテクノロジーズ', 'BWX技术', 'BWX Technologies'],
  AXON: ['액손엔터프라이즈', 'アクソンエンタープライズ', '安讯士', 'Axon'],

  // Mid-cap & Small-cap — Pharma / Biotech
  BNTX: ['바이오엔텍', 'ビオンテック', '百欧恩泰', 'BioNTech'],
  VRTX: ['버텍스', 'バーテックスファーマ', '福泰制药', 'Vertex'],
  BMRN: ['바이오마린', 'バイオマリン', '百奥玛琳', 'BioMarin'],
  EXAS: ['이그잭트사이언스', 'エグザクトサイエンス', '精密科学', 'Exact Sciences'],
  NTLA: ['인텔리아', 'インテリアセラピューティクス', '因特利亚', 'Intellia'],

  // Additional Semiconductors (batch 2)
  AVGO: ['브로드컴', 'ブロードコム', '博通', 'Broadcom'],
  QCOM: ['퀄컴', 'クアルコム', '高通', 'Qualcomm'],
  TXN: ['텍사스인스트루먼트', 'テキサスインスツルメンツ', '德州仪器', 'Texas Instruments'],
  ADI: ['아날로그디바이시즈', 'アナログデバイセズ', '亚德诺', 'Analog Devices'],
  SWKS: ['스카이웍스', 'スカイワークス', '思佳讯', 'Skyworks'],
  SLAB: ['실리콘랩스', 'シリコンラボ', '芯科科技', 'Silicon Labs'],

  // Additional AI / Cloud (batch 2)
  NOW: ['서비스나우', 'サービスナウ', '服务现在', 'ServiceNow'],
  CRWD: ['크라우드스트라이크', 'クラウドストライク', '众击', 'CrowdStrike'],
  MDB: ['몽고DB', 'モンゴDB', '蒙戈数据库', 'MongoDB'],
  PATH: ['유아이패스', 'ユーアイパス', '优路径', 'UiPath'],
  CFLT: ['컨플루언트', 'コンフルエント', '汇流', 'Confluent'],
  ESTC: ['엘라스틱', 'エラスティック', '弹性', 'Elastic'],

  // Additional EV / Battery (batch 2)
  NIO: ['니오', 'ニーオ', '蔚来', 'NIO'],
  XPEV: ['샤오펑', 'シャオペン', '小鹏', 'XPeng'],
  SLDP: ['솔리드파워', 'ソリッドパワー', '固态电力', 'Solid Power'],
  PLL: ['피드몬트리튬', 'ピエモントリチウム', '皮德蒙特锂', 'Piedmont Lithium'],
  ENPH: ['엔페이즈', 'エンフェーズ', '恩菲斯', 'Enphase'],
  PLUG: ['플러그파워', 'プラグパワー', '普拉格能源', 'Plug Power'],

  // Additional Defense (batch 2)
  GD: ['제너럴다이내믹스', 'ジェネラルダイナミクス', '通用动力', 'General Dynamics'],
  TXT: ['텍스트론', 'テクストロン', '德事隆', 'Textron'],
  LDOS: ['레이도스', 'レイドス', '雷多斯', 'Leidos'],
  CACI: ['CACI', 'シーエーシーアイ', '凯思', 'CACI'],
  AJRD: ['에어로젯로켓다인', 'エアロジェットロケットダイン', '航空喷气洛克达因', 'Aerojet Rocketdyne'],
  AVAV: ['에어로바이론먼트', 'エアロバイロンメント', '航境', 'AeroVironment'],

  // Additional Pharma / Biotech (batch 2)
  ABBV: ['애브비', 'アッヴィ', '艾伯维', 'AbbVie'],
  AMGN: ['암젠', 'アムジェン', '安进', 'Amgen'],
  GILD: ['길리어드', 'ギリアド', '吉利德', 'Gilead'],
  ALNY: ['알나일람', 'アルナイラム', '阿尼拉姆', 'Alnylam'],
  CRSP: ['크리스퍼', 'クリスパー', '基因编辑', 'CRISPR Therapeutics'],
  IONS: ['아이오니스', 'アイオニス', '离子制药', 'Ionis'],
};

// Localized sector names for search
export const sectorNamesI18n: Record<string, string[]> = {
  semiconductors: ['반도체', '半导体', '半導體', 'セミコンダクター', '半導体', 'semiconductores', 'Halbleiter', 'semi-conducteurs', 'semicondutores', 'полупроводники', 'yarı iletkenler'],
  'ai-cloud': ['인공지능', '클라우드', 'AI', '人工智能', '雲計算', '云计算', 'クラウド', 'nube', 'Wolke', 'nuage', 'nuvem', 'облако', 'bulut'],
  'ev-battery': ['전기차', '배터리', 'EV', '电动汽车', '電動車', '電池', 'EVバッテリー', 'vehículo eléctrico', 'Elektrofahrzeug', 'véhicule électrique', 'elétrico', 'электромобиль'],
  defense: ['방위', '방산', '국방', '防务', '防衛', 'ディフェンス', 'defensa', 'Verteidigung', 'défense', 'defesa', 'оборона', 'savunma'],
  'pharma-biotech': ['제약', '바이오', '製薬', 'バイオテック', '制药', '生物技术', '製藥', '生物科技', 'farmacéutica', 'Pharma', 'pharmacie', 'farmacêutica', 'фармацевтика', 'ilaç'],
};
