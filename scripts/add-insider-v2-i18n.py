#!/usr/bin/env python3
"""Add new insider page keys (nport/blocks/cluster/filter/new table headers)."""
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

KEYS = {
    'ko': {
        'tabNport': 'N-PORT 뮤추얼펀드',
        'tabBlocks': '블록 체결',
        'tickerFilterPlaceholder': '티커 필터 (예: NVDA)',
        'clusters': '집중 감지',
        'nportExplainer': 'Form N-PORT는 뮤추얼펀드가 월별로 공시하는 포지션입니다. 13F(분기)보다 3배 빠르고, 60일 이내 공시라 Fidelity·Vanguard·BlackRock이 지난달 얼마 사고 팔았는지 보입니다. 추적 종목별 집계.',
        'blocksLockedTitle': '💰 블록 체결 데이터는 유료',
        'blocksLockedBody': 'Polygon.io Starter 월 $29 (15분 지연) 또는 Advanced 월 $199 (실시간). 푸터 월 $200 후원 목표 도달 시 실시간 버전 오픈 예정. 무료 티어만으로도 나머지 6개 탭은 모두 실시간 동작 중입니다.',
        'th_totalValue': '총 보유금액',
        'th_fundCount': '펀드 수',
        'th_topFunds': '주요 펀드',
        'th_exchange': '거래소',
    },
    'en': {
        'tabNport': 'N-PORT Funds',
        'tabBlocks': 'Block Trades',
        'tickerFilterPlaceholder': 'Filter by ticker (e.g. NVDA)',
        'clusters': 'Clusters',
        'nportExplainer': 'Form N-PORT is the monthly holdings disclosure for mutual funds — 3× faster than 13F (quarterly) with a 60-day lag, so you see what Fidelity / Vanguard / BlackRock bought last month. Aggregated by tracked ticker.',
        'blocksLockedTitle': '💰 Block trade data is paid',
        'blocksLockedBody': 'Polygon.io Starter $29/mo (15-min delayed) or Advanced $199/mo (realtime). Unlocks once the $200/mo donation goal in the footer is reached. Even on the free tier the other 6 tabs are live.',
        'th_totalValue': 'Total Value',
        'th_fundCount': '# Funds',
        'th_topFunds': 'Top Funds',
        'th_exchange': 'Exchange',
    },
    'ja': {
        'tabNport': 'N-PORT 投信',
        'tabBlocks': 'ブロック約定',
        'tickerFilterPlaceholder': 'ティッカー絞込 (例: NVDA)',
        'clusters': '集中検出',
        'nportExplainer': 'Form N-PORTは投資信託の月次保有開示です。13F(四半期)の3倍速く、60日以内開示のためFidelity・Vanguard・BlackRockが先月何を売買したかが分かります。追跡銘柄別集計。',
        'blocksLockedTitle': '💰 ブロック約定データは有料',
        'blocksLockedBody': 'Polygon.io Starter 月$29 (15分遅延) または Advanced 月$199 (リアルタイム)。フッターの月$200支援目標達成で有効化。無料プランでも他の6タブはライブ動作中です。',
        'th_totalValue': '合計保有額',
        'th_fundCount': 'ファンド数',
        'th_topFunds': '主要ファンド',
        'th_exchange': '取引所',
    },
    'zh-CN': {
        'tabNport': 'N-PORT 基金',
        'tabBlocks': '大宗交易',
        'tickerFilterPlaceholder': '按代码筛选 (例: NVDA)',
        'clusters': '集中检测',
        'nportExplainer': 'Form N-PORT 是共同基金的月度持仓披露 — 比 13F(季度)快 3 倍,60 天内披露,可看到 Fidelity / Vanguard / BlackRock 上月买卖了什么。按追踪代码聚合。',
        'blocksLockedTitle': '💰 大宗交易数据属于付费',
        'blocksLockedBody': 'Polygon.io Starter 每月 $29 (15 分钟延迟) 或 Advanced 每月 $199 (实时)。页脚月 $200 捐赠目标达成后开放。免费级别下其他 6 个标签均已实时运行。',
        'th_totalValue': '总持仓额',
        'th_fundCount': '基金数',
        'th_topFunds': '主要基金',
        'th_exchange': '交易所',
    },
    'zh-TW': {
        'tabNport': 'N-PORT 基金',
        'tabBlocks': '大宗交易',
        'tickerFilterPlaceholder': '依代碼篩選 (例: NVDA)',
        'clusters': '集中偵測',
        'nportExplainer': 'Form N-PORT 是共同基金的月度持股揭露 — 比 13F(季)快 3 倍,60 天內揭露,可看到 Fidelity / Vanguard / BlackRock 上月買賣了什麼。依追蹤代碼彙總。',
        'blocksLockedTitle': '💰 大宗交易資料屬於付費',
        'blocksLockedBody': 'Polygon.io Starter 月費 $29 (15 分鐘延遲) 或 Advanced 月費 $199 (即時)。頁尾月 $200 贊助目標達成後開放。免費方案下其他 6 個分頁均即時運作。',
        'th_totalValue': '總持股額',
        'th_fundCount': '基金數',
        'th_topFunds': '主要基金',
        'th_exchange': '交易所',
    },
}

# English fallback for the 11 other languages
FALLBACK = KEYS['en']
for lang in ['es','fr','de','pt','ru','ar','hi','id','th','tr','vi']:
    KEYS[lang] = FALLBACK

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')
for lang, keys in KEYS.items():
    path = os.path.join(MESSAGES_DIR, f'{lang}.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    ins = data.setdefault('insider', {})
    ins['tabNport'] = keys['tabNport']
    ins['tabBlocks'] = keys['tabBlocks']
    ins['tickerFilterPlaceholder'] = keys['tickerFilterPlaceholder']
    ins['clusters'] = keys['clusters']
    ins['nportExplainer'] = keys['nportExplainer']
    ins['blocksLockedTitle'] = keys['blocksLockedTitle']
    ins['blocksLockedBody'] = keys['blocksLockedBody']
    th = ins.setdefault('th', {})
    th['totalValue'] = keys['th_totalValue']
    th['fundCount'] = keys['th_fundCount']
    th['topFunds'] = keys['th_topFunds']
    th['exchange'] = keys['th_exchange']
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  {lang}: updated')
print('Done.')
