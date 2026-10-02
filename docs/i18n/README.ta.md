<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — தமிழ்

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

## பயனர் வழிகாட்டி

[@sentinelvcbot](https://t.me/sentinelvcbot) · [புதுப்பிப்புகள்](https://t.me/sentinelvc)

/start → /language → தமிழ்

1. உறுப்பினர்களைக் கட்டுப்படுத்தும் அனுமதியுடன் bot-ஐ supergroup நிர்வாகியாகச் சேர்க்கவும்.

2. குழுவில் /setup, பின்னர் சில வினாடிகள் இடைவெளியில் /doctor மற்றும் /status அனுப்பவும்.

3. கண்காணிப்பு முறையில் /incidents பார்க்கவும்; தயாரானதும் /mode enforce பயன்படுத்தவும். /gate on புதிய உறுப்பினர்களைச் சரிபார்க்கும்.

4. கட்டுப்படுத்தப்பட்டால், சரிபார்ப்பில் உள்ள குழு ID-யுடன் தனிப்பட்ட உரையாடலில் /verify GROUP_ID அனுப்பவும்.

குரல் கட்டுப்பாட்டிற்கு தனி விருப்ப adapter தேவை. Raw UDP மற்றும் கணக்கு உருவாக்கிய தேதி கிடைக்காது.

## குழுவில் சேர்க்கவும்

[Telegram](https://t.me/sentinelvcbot?startgroup=setup)

## VPS / Docker

[Self-hosting guide (English)](../SELF_HOSTING.md) · [Voice setup (English)](../VC_SETUP.md)

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

HTTP_PORT: 18765 → `bash scripts/setup.sh --port 19234`

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

[மூலக் குறியீடு](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
