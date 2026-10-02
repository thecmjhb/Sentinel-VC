<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Türkçe

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## Kullanım kılavuzu

[@sentinelvcbot](https://t.me/sentinelvcbot) · [Güncellemeler](https://t.me/sentinelvc)

/start → /language → Türkçe

1. Botu süpergruba üye kısıtlama yetkisi olan yönetici olarak ekleyin.

2. Grupta birkaç saniye arayla /setup, /doctor ve /status gönderin.

3. Gözlem modunda /incidents kayıtlarını inceleyin; hazır olduğunuzda /mode enforce kullanın. /gate on yeni üyeleri doğrular.

4. Kısıtlanırsanız görevdeki grup kimliğiyle özel sohbette /verify GROUP_ID gönderin.

Ses kontrolü ayrı bir isteğe bağlı adaptör gerektirir. Ham UDP ve hesap oluşturma tarihleri kullanılamaz.

## Gruba ekle

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

[Kaynak kodu](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
