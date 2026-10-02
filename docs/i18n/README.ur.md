<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — اردو

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

Sentinel-VC ایک کھلے ماخذ کا Telegram supergroup moderation bot ہے۔ یہ دستیاب join/leave واقعات اور تیز پیغام رسانی کی نگرانی کرتا ہے۔ اختیاری user-admin adapter اجازت کے مطابق voice-call participant واقعات اور mute فراہم کرتا ہے۔ مصنف: **C. M. Jubayer Hossain Bappy**۔

## تیار bot استعمال کریں

مالک کی طرف سے سروس شروع ہونے کے بعد [@sentinelvcbot](https://t.me/sentinelvcbot) اپنے supergroup میں شامل کریں۔ اسے admin بنا کر **Restrict Members** کی اجازت دیں۔ اپنے ذاتی admin اکاؤنٹ سے `/setup`، چند سیکنڈ بعد `/doctor`، پھر `/status` بھیجیں۔ پہلے observe mode میں جائزہ لیں، پھر ضرورت کے مطابق `/mode enforce` چلائیں۔ `/gate on` نئے اراکین کے لیے عارضی chat restriction اور حساب کا سوال فعال کرتا ہے۔

## اپنے VPS پر چلائیں

Ubuntu پر [Docker اور Compose](https://docs.docker.com/engine/install/ubuntu/) نصب کریں۔ GitHub repository شائع ہونے کے بعد:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

سیٹ اپ کے دوران VPS کا health-check پورٹ منتخب کریں؛ نئی تنصیب کا ڈیفالٹ **18765** ہے۔ دکھایا گیا پورٹ رکھنے کے لیے Enter دبائیں۔ بعد میں بدلنے کے لیے `bash scripts/setup.sh --port 19234` چلائیں؛ باقی `.env` سیٹنگز محفوظ رہیں گی۔ npm کے لیے `.env` میں `HTTP_PORT` مقرر کریں۔

Helper token کو پوشیدہ رکھ کر پوچھتا ہے اور موجودہ `.env` کو تبدیل نہیں کرتا۔ Token کسی chat، تصویر یا GitHub میں نہ ڈالیں۔ جانچ کے لیے:

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

Docker کے بغیر Node.js 24 LTS استعمال کریں: `.env.example` کی نقل `.env` بنائیں، `BOT_TOKEN` درج کریں، پھر `npm ci --ignore-scripts` اور `npm start` چلائیں۔ مستقل service اور backups کے لیے [deployment guide](../SELF_HOSTING.md) دیکھیں۔

## کمانڈ اور حدود

`/incidents` صرف موجودہ group کے admin کو حالیہ ریکارڈ دکھاتا ہے۔ `/mode observe` نئے moderation اقدامات روکتا ہے۔ Restricted رکن bot کی private chat میں `/verify` کے بعد challenge میں دیا ہوا group ID لکھ کر اپنا سوال دوبارہ کھول سکتا ہے۔ تین غلط جوابوں کے بعد مدت ختم ہونے کا انتظار کریں۔ Flood restriction کے پہلے منٹ میں تصدیق سے آزادی نہیں ملتی۔

عام bot raw UDP، اکاؤنٹ کی اصل تاریخِ تخلیق یا live-call participants نہیں دیکھ سکتا۔ Voice-note restriction، live-call mute نہیں ہے۔ [اختیاری VC setup](../VC_SETUP.md) کے لیے الگ رضامند user-admin، private session اور allowlist درکار ہیں۔ Call mute یا join-muted کو admin خود بحال کرتا ہے۔

## کمیونٹی اور لائسنس

Self-hosted نسخے میں [Updates channel](https://t.me/sentinelvc) میں شمولیت اختیاری ہے۔ Hosted bot کے لیے /start کی ہدایات پر عمل کریں۔ مدد کے لیے [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues) دیکھیں۔ Code MIT ہے؛ [license](../../LICENSE) اور attribution برقرار رکھیں۔
