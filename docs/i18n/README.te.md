<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — తెలుగు

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

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
