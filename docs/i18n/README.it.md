<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Italiano

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## Guida all’uso

[@sentinelvcbot](https://t.me/sentinelvcbot) · [Aggiornamenti](https://t.me/sentinelvc)

/start → /language → Italiano

1. Aggiungi il bot al supergruppo come amministratore con il permesso di limitare i membri.

2. Invia /setup, /doctor e /status nel gruppo, a qualche secondo di distanza.

3. Controlla /incidents in modalità osservazione; poi attiva /mode enforce. /gate on verifica i nuovi membri.

4. Se sei limitato, invia in privato /verify GROUP_ID con l’ID indicato nella verifica.

Il controllo vocale richiede un adattatore opzionale separato. UDP grezzo e date di creazione degli account non sono disponibili.

## Aggiungi al gruppo

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

[Codice sorgente](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
