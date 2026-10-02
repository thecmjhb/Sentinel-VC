<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — தமிழ்

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

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
