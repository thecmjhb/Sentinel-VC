<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — اردو

[English](../../README.md) · [中文](../../docs/i18n/README.zh-CN.md) · [हिन्दी](../../docs/i18n/README.hi.md) · [Español](../../docs/i18n/README.es.md) · [العربية](../../docs/i18n/README.ar.md)

[Français](../../docs/i18n/README.fr.md) · [বাংলা](../../README.bn.md) · [Português](../../docs/i18n/README.pt.md) · [Bahasa Indonesia](../../docs/i18n/README.id.md) · [اردو](../../docs/i18n/README.ur.md)

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

Helper token کو پوشیدہ رکھ کر پوچھتا ہے اور موجودہ `.env` کو تبدیل نہیں کرتا۔ Token کسی chat، تصویر یا GitHub میں نہ ڈالیں۔ جانچ کے لیے:

```bash
docker compose logs --tail=50 sentinel
curl --fail http://127.0.0.1:8080/readyz
```

Docker کے بغیر Node.js 24 LTS استعمال کریں: `.env.example` کی نقل `.env` بنائیں، `BOT_TOKEN` درج کریں، پھر `npm ci --ignore-scripts` اور `npm start` چلائیں۔ مستقل service اور backups کے لیے [deployment guide](../SELF_HOSTING.md) دیکھیں۔

## کمانڈ اور حدود

`/incidents` صرف موجودہ group کے admin کو حالیہ ریکارڈ دکھاتا ہے۔ `/mode observe` نئے moderation اقدامات روکتا ہے۔ Restricted رکن bot کی private chat میں `/verify` کے بعد challenge میں دیا ہوا group ID لکھ کر اپنا سوال دوبارہ کھول سکتا ہے۔ تین غلط جوابوں کے بعد مدت ختم ہونے کا انتظار کریں۔ Flood restriction کے پہلے منٹ میں تصدیق سے آزادی نہیں ملتی۔

عام bot raw UDP، اکاؤنٹ کی اصل تاریخِ تخلیق یا live-call participants نہیں دیکھ سکتا۔ Voice-note restriction، live-call mute نہیں ہے۔ [اختیاری VC setup](../VC_SETUP.md) کے لیے الگ رضامند user-admin، private session اور allowlist درکار ہیں۔ Call mute یا join-muted کو admin خود بحال کرتا ہے۔

## کمیونٹی اور لائسنس

[Updates channel](https://t.me/sentinelvc) میں شمولیت اختیاری ہے۔ مدد کے لیے [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues) دیکھیں۔ Code MIT ہے؛ [license](../../LICENSE) اور attribution برقرار رکھیں۔
