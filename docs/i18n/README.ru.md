<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Русский

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## Инструкция

[@sentinelvcbot](https://t.me/sentinelvcbot) · [Обновления](https://t.me/sentinelvc)

/start → /language → Русский

1. Добавьте бота в супергруппу как администратора с правом ограничивать участников.

2. Отправьте в группе /setup, /doctor и /status с интервалом в несколько секунд.

3. Просмотрите /incidents в режиме наблюдения; затем включите /mode enforce. /gate on включает проверку новых участников.

4. При ограничении отправьте боту лично /verify GROUP_ID с ID из задания.

Для управления голосовыми чатами нужен отдельный дополнительный адаптер. Сырые UDP-пакеты и даты создания аккаунтов недоступны.

## Добавить в группу

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

[Исходный код](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
