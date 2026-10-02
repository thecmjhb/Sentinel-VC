<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Deutsch

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## Anleitung

[@sentinelvcbot](https://t.me/sentinelvcbot) · [Neuigkeiten](https://t.me/sentinelvc)

/start → /language → Deutsch

1. Füge den Bot als Administrator mit dem Recht zum Einschränken von Mitgliedern zur Supergruppe hinzu.

2. Sende /setup, /doctor und /status in der Gruppe mit einigen Sekunden Abstand.

3. Prüfe /incidents im Beobachtungsmodus; aktiviere danach /mode enforce. /gate on prüft neue Mitglieder.

4. Sende bei einer Einschränkung privat /verify GROUP_ID mit der ID aus der Aufgabe.

Sprachsteuerung benötigt einen separaten optionalen Adapter. Rohe UDP-Pakete und Kontoerstellungsdaten sind nicht verfügbar.

## Zur Gruppe hinzufügen

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

[Quellcode](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
