<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — తెలుగు

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## వినియోగ మార్గదర్శి

[@sentinelvcbot](https://t.me/sentinelvcbot) · [నవీకరణలు](https://t.me/sentinelvc)

/start → /language → తెలుగు

1. సభ్యులను పరిమితం చేసే అనుమతితో bot‌ను supergroup అడ్మిన్‌గా జోడించండి.

2. గ్రూప్‌లో /setup, తరువాత కొన్ని సెకన్ల విరామంతో /doctor మరియు /status పంపండి.

3. పరిశీలన మోడ్‌లో /incidents చూడండి; సిద్ధమైనప్పుడు /mode enforce వాడండి. /gate on కొత్త సభ్యుల ధృవీకరణను ప్రారంభిస్తుంది.

4. పరిమితి ఉంటే, ధృవీకరణలోని గ్రూప్ IDతో ప్రైవేట్ చాట్‌లో /verify GROUP_ID పంపండి.

వాయిస్ నియంత్రణకు ప్రత్యేక ఐచ్ఛిక adapter అవసరం. Raw UDP, ఖాతా సృష్టించిన తేదీ అందుబాటులో ఉండవు.

## గ్రూప్‌కు జోడించండి

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

[సోర్స్ కోడ్](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
