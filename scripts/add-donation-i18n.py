#!/usr/bin/env python3
"""Inject donation i18n keys into all messages/*.json footer sections."""
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

TRANSLATIONS = {
    'ko': {
        'donationTitle': 'Flowvium은 광고 없이 무료로 제공됩니다',
        'donationDesc': 'Bloomberg Terminal이 월 $2,000인데 여기선 공짜예요. 서버 비용에 보탬이 된다면 커피 한 잔 가격의 후원이 큰 힘이 됩니다.',
        'donationGoalTitle': '🎯 월 $200 모이면 실시간 수급 분석이 열립니다',
        'donationGoalDesc': 'Polygon 실시간 주가 + Unusual Whales 기관 옵션 flow + 다크풀 프린트 통합 예정. 현재는 Yahoo 무료 티어(15분 지연)로 운영 중 · 도와주십쇼 🙏',
        'donationBankLabel': '🇰🇷 카카오뱅크',
        'donationAccountHolder': '예금주: 김태신',
    },
    'en': {
        'donationTitle': 'Flowvium is ad-free and completely free',
        'donationDesc': "Bloomberg Terminal costs $2,000/mo — here it's free. A coffee-priced donation helps cover server costs.",
        'donationGoalTitle': '🎯 Hit $200/mo and real-time flow analysis unlocks',
        'donationGoalDesc': "Planned: Polygon real-time quotes + Unusual Whales institutional options flow + dark-pool prints. Currently on Yahoo free tier (15-min delay) · Please help 🙏",
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Account holder: Kim Taeshin',
    },
    'ja': {
        'donationTitle': 'Flowviumは広告なしで無料で提供されます',
        'donationDesc': 'Bloomberg Terminalは月$2,000ですが、ここでは無料です。サーバー費用の支援として、コーヒー一杯分の寄付が大きな力になります。',
        'donationGoalTitle': '🎯 月$200集まればリアルタイム資金フロー分析が解放されます',
        'donationGoalDesc': '予定: Polygonリアルタイム株価 + Unusual Whales機関投資家オプションフロー + ダークプールプリント統合。現在はYahoo無料ティア(15分遅延)運用中 · ご支援お願いします 🙏',
        'donationBankLabel': '🇰🇷 カカオバンク',
        'donationAccountHolder': '口座名義: キム・テシン',
    },
    'zh-CN': {
        'donationTitle': 'Flowvium 无广告免费提供',
        'donationDesc': 'Bloomberg Terminal 每月 $2,000,这里免费。一杯咖啡价格的赞助对服务器维护是巨大的帮助。',
        'donationGoalTitle': '🎯 每月达到 $200 将开启实时资金流分析',
        'donationGoalDesc': '计划集成: Polygon 实时报价 + Unusual Whales 机构期权流 + 暗池成交。目前使用 Yahoo 免费版(15分钟延迟) · 请支持 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': '开户人: 金太信',
    },
    'zh-TW': {
        'donationTitle': 'Flowvium 無廣告免費提供',
        'donationDesc': 'Bloomberg Terminal 每月 $2,000,這裡免費。一杯咖啡價格的贊助對伺服器維護是巨大的幫助。',
        'donationGoalTitle': '🎯 每月達到 $200 將開啟即時資金流分析',
        'donationGoalDesc': '計劃整合: Polygon 即時報價 + Unusual Whales 機構選擇權流 + 暗池成交。目前使用 Yahoo 免費版(15分鐘延遲) · 請支持 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': '開戶人: 金太信',
    },
    'es': {
        'donationTitle': 'Flowvium es gratuito y sin anuncios',
        'donationDesc': 'Bloomberg Terminal cuesta $2,000/mes — aquí es gratis. Una donación al precio de un café ayuda con los costos del servidor.',
        'donationGoalTitle': '🎯 Con $200/mes desbloqueamos el análisis de flujos en tiempo real',
        'donationGoalDesc': 'Planeado: precios en vivo de Polygon + flujo institucional de opciones de Unusual Whales + impresiones de dark pool. Actualmente en Yahoo gratis (15 min de retraso) · Ayuda por favor 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Titular: Kim Taeshin',
    },
    'fr': {
        'donationTitle': 'Flowvium est gratuit et sans publicité',
        'donationDesc': "Bloomberg Terminal coûte 2 000 $/mois — ici c'est gratuit. Un don au prix d'un café aide à couvrir les coûts du serveur.",
        'donationGoalTitle': "🎯 À 200 $/mois, l'analyse de flux en temps réel se débloque",
        'donationGoalDesc': "Prévu: cotations en temps réel Polygon + flux d'options institutionnelles Unusual Whales + impressions dark pool. Actuellement sur Yahoo gratuit (15 min de retard) · Merci de nous aider 🙏",
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Titulaire du compte: Kim Taeshin',
    },
    'de': {
        'donationTitle': 'Flowvium ist werbefrei und kostenlos',
        'donationDesc': 'Bloomberg Terminal kostet $2.000/Monat — hier ist es kostenlos. Eine Spende zum Preis eines Kaffees hilft bei den Serverkosten.',
        'donationGoalTitle': '🎯 Bei $200/Monat schalten wir die Echtzeit-Flussanalyse frei',
        'donationGoalDesc': 'Geplant: Polygon Echtzeit-Kurse + Unusual Whales institutioneller Optionsfluss + Dark-Pool-Prints. Aktuell auf Yahoo kostenlos (15 min Verzögerung) · Bitte helft mit 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Kontoinhaber: Kim Taeshin',
    },
    'pt': {
        'donationTitle': 'O Flowvium é gratuito e sem anúncios',
        'donationDesc': 'O Bloomberg Terminal custa $2.000/mês — aqui é grátis. Uma doação no valor de um café ajuda nos custos do servidor.',
        'donationGoalTitle': '🎯 Com $200/mês desbloqueamos a análise de fluxo em tempo real',
        'donationGoalDesc': 'Planejado: cotações em tempo real do Polygon + fluxo de opções institucional da Unusual Whales + prints de dark pool. Atualmente no Yahoo grátis (15 min atraso) · Ajuda por favor 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Titular: Kim Taeshin',
    },
    'ru': {
        'donationTitle': 'Flowvium бесплатен и без рекламы',
        'donationDesc': 'Bloomberg Terminal стоит $2000/мес — здесь бесплатно. Пожертвование стоимостью с чашку кофе очень поможет с серверными расходами.',
        'donationGoalTitle': '🎯 При $200/мес открываем анализ потоков в реальном времени',
        'donationGoalDesc': 'Планируется: котировки Polygon в реальном времени + институциональные опционы Unusual Whales + принты dark pool. Сейчас Yahoo бесплатно (15 мин задержка) · Помогите 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Владелец счёта: Ким Тхэщин',
    },
    'ar': {
        'donationTitle': 'Flowvium مجاني وبدون إعلانات',
        'donationDesc': 'يكلف Bloomberg Terminal 2,000 دولار شهرياً — هنا مجاني. تبرع بسعر فنجان قهوة يساعد في تغطية تكاليف الخادم.',
        'donationGoalTitle': '🎯 عند الوصول إلى 200 دولار شهرياً نفتح تحليل التدفقات الفوري',
        'donationGoalDesc': 'مخطط: أسعار Polygon الفورية + تدفق خيارات Unusual Whales المؤسسية + طبعات dark pool. حالياً على Yahoo المجاني (15 دقيقة تأخير) · ساعدونا 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'صاحب الحساب: كيم تايشين',
    },
    'hi': {
        'donationTitle': 'Flowvium विज्ञापन-मुक्त और मुफ़्त है',
        'donationDesc': 'Bloomberg Terminal $2,000/माह है — यहाँ मुफ़्त है। एक कॉफ़ी की कीमत का दान सर्वर खर्चों में मदद करता है।',
        'donationGoalTitle': '🎯 $200/माह मिलने पर रियल-टाइम फ्लो विश्लेषण खुलेगा',
        'donationGoalDesc': 'नियोजित: Polygon रियल-टाइम कोट्स + Unusual Whales संस्थागत ऑप्शन फ्लो + डार्क पूल प्रिंट्स। अभी Yahoo फ्री (15 मिनट विलंब) · कृपया मदद करें 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'खाताधारक: किम ताइशिन',
    },
    'id': {
        'donationTitle': 'Flowvium gratis tanpa iklan',
        'donationDesc': 'Bloomberg Terminal $2.000/bulan — di sini gratis. Donasi seharga kopi membantu biaya server.',
        'donationGoalTitle': '🎯 Mencapai $200/bulan membuka analisis aliran real-time',
        'donationGoalDesc': 'Direncanakan: harga real-time Polygon + flow opsi institusional Unusual Whales + print dark pool. Saat ini Yahoo gratis (15 menit tertunda) · Mohon bantuan 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Pemilik rekening: Kim Taeshin',
    },
    'th': {
        'donationTitle': 'Flowvium ไม่มีโฆษณาและให้บริการฟรี',
        'donationDesc': 'Bloomberg Terminal ราคา $2,000/เดือน — ที่นี่ฟรี เงินบริจาคเท่ากาแฟหนึ่งแก้วช่วยค่าเซิร์ฟเวอร์ได้มาก',
        'donationGoalTitle': '🎯 ถึง $200/เดือน เปิดการวิเคราะห์ flow แบบเรียลไทม์',
        'donationGoalDesc': 'แผน: ราคา Polygon เรียลไทม์ + options flow สถาบันจาก Unusual Whales + dark pool prints ตอนนี้ใช้ Yahoo ฟรี (ล่าช้า 15 นาที) · ช่วยหน่อยครับ 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'เจ้าของบัญชี: Kim Taeshin',
    },
    'tr': {
        'donationTitle': 'Flowvium reklamsız ve tamamen ücretsiz',
        'donationDesc': 'Bloomberg Terminal aylık $2.000 — burada ücretsiz. Bir kahve fiyatına bağış sunucu maliyetlerine büyük yardım.',
        'donationGoalTitle': '🎯 Aylık $200 ile gerçek zamanlı akış analizi açılır',
        'donationGoalDesc': 'Planlanan: Polygon canlı fiyatlar + Unusual Whales kurumsal opsiyon akışı + dark-pool printleri. Şu an Yahoo ücretsiz (15 dk gecikmeli) · Yardımınız lütfen 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Hesap sahibi: Kim Taeshin',
    },
    'vi': {
        'donationTitle': 'Flowvium miễn phí và không có quảng cáo',
        'donationDesc': 'Bloomberg Terminal $2,000/tháng — ở đây miễn phí. Một ly cà phê giúp trang trải chi phí máy chủ.',
        'donationGoalTitle': '🎯 Đạt $200/tháng sẽ mở phân tích dòng tiền thời gian thực',
        'donationGoalDesc': 'Dự kiến: giá Polygon thời gian thực + flow quyền chọn tổ chức Unusual Whales + dark-pool prints. Hiện đang dùng Yahoo miễn phí (trễ 15 phút) · Xin hỗ trợ 🙏',
        'donationBankLabel': '🇰🇷 Kakao Bank',
        'donationAccountHolder': 'Chủ tài khoản: Kim Taeshin',
    },
}

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

for lang, keys in TRANSLATIONS.items():
    path = os.path.join(MESSAGES_DIR, f'{lang}.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    footer = data.setdefault('footer', {})
    for k, v in keys.items():
        footer[k] = v
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  {lang}: added {len(keys)} keys')

print('Done.')
