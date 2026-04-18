#!/usr/bin/env python3
"""
Rewrite insider.optionsLockedTitle/Body across all 16 languages so the
"locked" tab reads as a funding-goal call rather than a dev instruction
to set an env var.
"""
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

# Title + body per language. Anchors to the Footer donation goal ($200/mo).
TEXTS = {
    'ko': ('💰 옵션 flow는 유료 데이터', 'Unusual Whales API 월 $48이 필요합니다. 푸터의 월 $200 후원 목표가 달성되면 이 탭이 열립니다 — 지금까지 내부자 매매·지분 알림·한국 수급은 전부 무료 소스로 동작 중입니다.'),
    'en': ('💰 Options flow is paid data', 'This requires the Unusual Whales API ($48/mo). It unlocks once the $200/mo donation goal in the footer is reached — until then, insider trades, 13D/G alerts, and Korea flow run entirely on free SEC/KRX data.'),
    'ja': ('💰 オプションフローは有料データ', 'Unusual Whales API (月$48) が必要です。フッターの月$200支援目標が達成されるとこのタブが有効化されます。それまで内部者取引・13D/G・韓国資金フローは全て無料データで動作します。'),
    'zh-CN': ('💰 期权流属于付费数据', '需要 Unusual Whales API(每月 $48)。页脚的每月 $200 捐赠目标达成后开放此标签。当前内部人交易、13D/G、韩国资金流全部基于免费数据。'),
    'zh-TW': ('💰 選擇權流屬於付費資料', '需要 Unusual Whales API(月費 $48)。頁尾的月費 $200 贊助目標達成後開放此分頁。目前內部人交易、13D/G、韓國資金流全部基於免費資料。'),
    'es': ('💰 El flujo de opciones es data paga', 'Requiere Unusual Whales API ($48/mes). Se desbloquea cuando el objetivo de donación de $200/mes del pie de página se alcance. Mientras tanto, los demás tabs funcionan con datos gratuitos.'),
    'fr': ('💰 Le flux d\'options est un service payant', "Nécessite l'API Unusual Whales (48 $/mois). Ce tab se débloque lorsque l'objectif de 200 $/mois du footer est atteint. En attendant, les autres tabs fonctionnent avec des sources gratuites."),
    'de': ('💰 Options-Flow ist kostenpflichtig', 'Benötigt Unusual Whales API ($48/Monat). Wird freigeschaltet, sobald das $200/Monat-Spendenziel im Footer erreicht ist. Bis dahin laufen die anderen Tabs auf kostenlosen Daten.'),
    'pt': ('💰 Fluxo de opções é dado pago', 'Requer Unusual Whales API ($48/mês). É desbloqueado quando a meta de $200/mês no rodapé for atingida. Até lá, os outros tabs funcionam com dados gratuitos.'),
    'ru': ('💰 Поток опционов — платные данные', 'Требуется Unusual Whales API ($48/мес). Разблокируется при достижении цели $200/мес в футере. До этого остальные вкладки работают на бесплатных данных.'),
    'ar': ('💰 تدفق الخيارات بيانات مدفوعة', 'يتطلب Unusual Whales API (48 دولار شهرياً). يتم فتحه عند الوصول إلى هدف التبرع 200 دولار شهرياً في التذييل. حتى ذلك الحين، تعمل التبويبات الأخرى على بيانات مجانية.'),
    'hi': ('💰 ऑप्शन फ्लो पेड डेटा है', 'Unusual Whales API ($48/माह) आवश्यक। फ़ुटर का $200/माह डोनेशन लक्ष्य पूरा होने पर खुलेगा। अभी अन्य टैब मुफ्त डेटा पर चल रहे हैं।'),
    'id': ('💰 Aliran opsi adalah data berbayar', 'Membutuhkan Unusual Whales API ($48/bulan). Tab ini terbuka ketika target donasi $200/bulan di footer tercapai. Sementara itu, tab lain bekerja dengan data gratis.'),
    'th': ('💰 Options flow เป็นข้อมูลแบบเสียเงิน', 'ต้องใช้ Unusual Whales API ($48/เดือน) แท็บนี้จะเปิดเมื่อเป้าหมายบริจาค $200/เดือนในส่วนท้ายสำเร็จ ระหว่างนี้แท็บอื่นใช้ข้อมูลฟรี'),
    'tr': ('💰 Opsiyon akışı ücretli veridir', 'Unusual Whales API ($48/ay) gerekir. Footer\'daki aylık $200 bağış hedefi tamamlandığında açılır. O zamana kadar diğer sekmeler ücretsiz verilerle çalışır.'),
    'vi': ('💰 Options flow là dữ liệu trả phí', 'Cần Unusual Whales API ($48/tháng). Tab này mở khi đạt mục tiêu quyên góp $200/tháng ở footer. Trong lúc đó, các tab khác hoạt động trên dữ liệu miễn phí.'),
}

for lang, (title, body) in TEXTS.items():
    path = os.path.join(MESSAGES_DIR, f'{lang}.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    ins = data.setdefault('insider', {})
    ins['optionsLockedTitle'] = title
    ins['optionsLockedBody'] = body
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  {lang}: updated')
print('Done.')
