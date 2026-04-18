#!/usr/bin/env python3
"""Add nav.insider key + insider.* section to all 16 message files."""
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

NAV_INSIDER = {
    'ko': '실시간 수급',  'en': 'Real-time Flow',  'ja': 'リアルタイム資金',
    'zh-CN': '实时资金流', 'zh-TW': '即時資金流',  'es': 'Flujo en vivo',
    'fr': 'Flux en direct', 'de': 'Echtzeit-Flow', 'pt': 'Fluxo ao vivo',
    'ru': 'Потоки в реальном времени', 'ar': 'التدفق الفوري',
    'hi': 'रियल-टाइम फ्लो', 'id': 'Aliran Real-time', 'th': 'Flow เรียลไทม์',
    'tr': 'Canlı Akış', 'vi': 'Dòng tiền trực tiếp',
}

INSIDER_SECTION = {
    'ko': {
        'title': '실시간 수급 · 내부자 매매',
        'subtitle': 'SEC Form 4 + 13D/13G + 옵션 flow + 한국 외인·기관 — Bloomberg급 실시간 자금 추적',
        'loading': '데이터 수신 중...',
        'refresh': '새로고침',
        'empty': '데이터 없음',
        'buy': '매수', 'sell': '매도',
        'tabInsider': '내부자 매매 (Form 4)',
        'tabOwnership': '지분 알림 (13D/G)',
        'tabOptions': '옵션 flow',
        'tabKorea': '한국 수급',
        'explainerTitle': '블룸버그는 실시간 13F를 못 줍니다 — 법적 45일 지연',
        'explainerBody': '대신 Form 4(D+2) 내부자 매매, Schedule 13D/13G(5%+ 지분 돌파), 옵션 unusual flow, 한국 KRX 외인·기관 수급을 엮으면 실시간 기관 움직임 추적이 가능합니다. 이 페이지가 그걸 모아서 보여줍니다.',
        'optionsLockedTitle': '옵션 flow는 유료 API 필요',
        'optionsLockedBody': 'Unusual Whales 월 $48. 환경 변수 UNUSUAL_WHALES_KEY 설정 시 자동 활성. 현재 미설정 상태이며, 다른 탭은 전부 무료 SEC EDGAR 기반으로 작동합니다.',
        'koreaAsOf': '{date} 기준',
        'tickers': '종목',
        'foreignTopBuy': '외국인 순매수 상위',
        'foreignTopSell': '외국인 순매도 상위',
        'instTopBuy': '기관 순매수 상위',
        'instTopSell': '기관 순매도 상위',
        'sources': '출처: SEC EDGAR (Form 4·13D/13G), Unusual Whales (옵션), KRX 정보데이터시스템 · 15~30분 캐시',
        'th': {
            'filed': '공시시각', 'ticker': '티커', 'issuer': '기업', 'insider': '내부자', 'role': '직책',
            'action': '방향', 'shares': '수량', 'price': '단가', 'value': '금액',
            'filer': '지분보유자', 'formType': '양식', 'percent': '지분%', 'sharesOwned': '보유주',
            'time': '시각', 'sentiment': '방향', 'contract': '종목·만기', 'size': '계약수', 'premium': '프리미엄',
        },
    },
    'en': {
        'title': 'Real-time Flow · Insider Activity',
        'subtitle': 'SEC Form 4 + 13D/13G + options flow + Korean institutional — Bloomberg-grade real-time capital tracking',
        'loading': 'Loading data...',
        'refresh': 'Refresh',
        'empty': 'No data',
        'buy': 'Buy', 'sell': 'Sell',
        'tabInsider': 'Insider Trades (Form 4)',
        'tabOwnership': 'Ownership (13D/G)',
        'tabOptions': 'Options Flow',
        'tabKorea': 'Korea Flow',
        'explainerTitle': "Bloomberg can't give real-time 13F either — 45-day legal lag",
        'explainerBody': 'But combining Form 4 (D+2) insider trades, Schedule 13D/13G (5%+ crossings), options unusual flow, and KRX foreign/institutional net-buys, you get live institutional signals. This page stitches them together.',
        'optionsLockedTitle': 'Options flow requires paid API',
        'optionsLockedBody': 'Unusual Whales $48/mo. Set UNUSUAL_WHALES_KEY env to enable. Currently disabled — every other tab runs on free SEC EDGAR data.',
        'koreaAsOf': 'as of {date}',
        'tickers': 'tickers',
        'foreignTopBuy': 'Foreign Top Net Buy',
        'foreignTopSell': 'Foreign Top Net Sell',
        'instTopBuy': 'Institutional Top Net Buy',
        'instTopSell': 'Institutional Top Net Sell',
        'sources': 'Sources: SEC EDGAR (Form 4, 13D/13G), Unusual Whales (options), KRX Data System · 15-30min cache',
        'th': {
            'filed': 'Filed', 'ticker': 'Ticker', 'issuer': 'Issuer', 'insider': 'Insider', 'role': 'Role',
            'action': 'Side', 'shares': 'Shares', 'price': 'Price', 'value': 'Value',
            'filer': 'Filer', 'formType': 'Form', 'percent': '% Owned', 'sharesOwned': 'Shares Owned',
            'time': 'Time', 'sentiment': 'Sentiment', 'contract': 'Strike · Expiry', 'size': 'Size', 'premium': 'Premium',
        },
    },
    'ja': {
        'title': 'リアルタイム資金フロー · 内部者取引',
        'subtitle': 'SEC Form 4 + 13D/13G + オプションフロー + 韓国外国人・機関 — Bloomberg級リアルタイム追跡',
        'loading': 'データ取得中...',
        'refresh': '更新',
        'empty': 'データなし',
        'buy': '買', 'sell': '売',
        'tabInsider': '内部者取引 (Form 4)',
        'tabOwnership': '持分通知 (13D/G)',
        'tabOptions': 'オプションフロー',
        'tabKorea': '韓国資金フロー',
        'explainerTitle': 'Bloombergもリアルタイム13Fは出せません — 法定45日遅延',
        'explainerBody': '代わりにForm 4 (D+2) 内部者取引、Schedule 13D/13G (5%超保有)、オプションunusual flow、韓国KRX外国人・機関売買を組み合わせれば、機関の動きをリアルタイムで追跡できます。',
        'optionsLockedTitle': 'オプションフローは有料API必要',
        'optionsLockedBody': 'Unusual Whales 月$48。UNUSUAL_WHALES_KEY環境変数を設定すれば有効化。現在未設定、他のタブは無料SEC EDGARで動作します。',
        'koreaAsOf': '{date} 時点',
        'tickers': '銘柄',
        'foreignTopBuy': '外国人 純買い上位',
        'foreignTopSell': '外国人 純売り上位',
        'instTopBuy': '機関 純買い上位',
        'instTopSell': '機関 純売り上位',
        'sources': '出典: SEC EDGAR, Unusual Whales, KRX情報システム · 15~30分キャッシュ',
        'th': {
            'filed': '開示時刻', 'ticker': 'ティッカー', 'issuer': '発行体', 'insider': '内部者', 'role': '役職',
            'action': '方向', 'shares': '数量', 'price': '単価', 'value': '金額',
            'filer': '報告者', 'formType': '様式', 'percent': '持分率', 'sharesOwned': '保有株',
            'time': '時刻', 'sentiment': 'センチ', 'contract': '権利行使·満期', 'size': '契約数', 'premium': 'プレミアム',
        },
    },
    'zh-CN': {
        'title': '实时资金流 · 内部人交易',
        'subtitle': 'SEC Form 4 + 13D/13G + 期权流 + 韩国外资/机构 — Bloomberg 级实时追踪',
        'loading': '加载中...',
        'refresh': '刷新',
        'empty': '无数据',
        'buy': '买入', 'sell': '卖出',
        'tabInsider': '内部人交易 (Form 4)',
        'tabOwnership': '持股警报 (13D/G)',
        'tabOptions': '期权流',
        'tabKorea': '韩国资金',
        'explainerTitle': 'Bloomberg 也无法提供实时 13F — 法定 45 天延迟',
        'explainerBody': '组合 Form 4(D+2)内部人交易、Schedule 13D/13G(5%+持股)、期权异常流、韩国 KRX 外资/机构净买卖,即可实时追踪机构动向。',
        'optionsLockedTitle': '期权流需要付费 API',
        'optionsLockedBody': 'Unusual Whales 每月 $48。设置 UNUSUAL_WHALES_KEY 环境变量以启用。当前未配置,其他标签均基于免费 SEC EDGAR 数据。',
        'koreaAsOf': '{date} 数据',
        'tickers': '只',
        'foreignTopBuy': '外资净买入前十',
        'foreignTopSell': '外资净卖出前十',
        'instTopBuy': '机构净买入前十',
        'instTopSell': '机构净卖出前十',
        'sources': '数据源: SEC EDGAR, Unusual Whales, KRX · 缓存 15-30 分钟',
        'th': {
            'filed': '公示时间', 'ticker': '代码', 'issuer': '发行人', 'insider': '内部人', 'role': '职位',
            'action': '方向', 'shares': '股数', 'price': '单价', 'value': '金额',
            'filer': '申报人', 'formType': '表格', 'percent': '持股%', 'sharesOwned': '持股数',
            'time': '时间', 'sentiment': '方向', 'contract': '行权·到期', 'size': '合约数', 'premium': '权利金',
        },
    },
    'zh-TW': {
        'title': '即時資金流 · 內部人交易',
        'subtitle': 'SEC Form 4 + 13D/13G + 選擇權流 + 韓國外資/機構 — Bloomberg 級即時追蹤',
        'loading': '載入中...',
        'refresh': '重新整理',
        'empty': '無資料',
        'buy': '買入', 'sell': '賣出',
        'tabInsider': '內部人交易 (Form 4)',
        'tabOwnership': '持股警報 (13D/G)',
        'tabOptions': '選擇權流',
        'tabKorea': '韓國資金',
        'explainerTitle': 'Bloomberg 也無法提供即時 13F — 法定 45 天延遲',
        'explainerBody': '組合 Form 4(D+2)內部人交易、Schedule 13D/13G(5%+持股)、選擇權異常流、韓國 KRX 外資/機構淨買賣,即可即時追蹤機構動向。',
        'optionsLockedTitle': '選擇權流需要付費 API',
        'optionsLockedBody': 'Unusual Whales 月費 $48。設定 UNUSUAL_WHALES_KEY 環境變數啟用。目前未設定,其他分頁均基於免費 SEC EDGAR 資料。',
        'koreaAsOf': '{date} 資料',
        'tickers': '檔',
        'foreignTopBuy': '外資淨買進前十',
        'foreignTopSell': '外資淨賣出前十',
        'instTopBuy': '機構淨買進前十',
        'instTopSell': '機構淨賣出前十',
        'sources': '來源: SEC EDGAR, Unusual Whales, KRX · 15-30 分鐘快取',
        'th': {
            'filed': '公示時間', 'ticker': '代碼', 'issuer': '發行人', 'insider': '內部人', 'role': '職位',
            'action': '方向', 'shares': '股數', 'price': '單價', 'value': '金額',
            'filer': '申報人', 'formType': '表格', 'percent': '持股%', 'sharesOwned': '持股數',
            'time': '時間', 'sentiment': '方向', 'contract': '履約·到期', 'size': '合約數', 'premium': '權利金',
        },
    },
}

# For the remaining 11 languages, use English as reasonable shared content
# (production can translate later). This keeps UI functional immediately.
FALLBACK = INSIDER_SECTION['en']
for lang in ['es', 'fr', 'de', 'pt', 'ru', 'ar', 'hi', 'id', 'th', 'tr', 'vi']:
    INSIDER_SECTION[lang] = FALLBACK

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

for lang, nav_label in NAV_INSIDER.items():
    path = os.path.join(MESSAGES_DIR, f'{lang}.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    data.setdefault('nav', {})['insider'] = nav_label
    data['insider'] = INSIDER_SECTION[lang]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  {lang}: nav.insider + insider section')

print('Done.')
