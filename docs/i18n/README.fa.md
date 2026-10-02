<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — فارسی

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## راهنمای استفاده

[@sentinelvcbot](https://t.me/sentinelvcbot) · [تازه‌ها](https://t.me/sentinelvc)

/start → /language → فارسی

1. ربات را با دسترسی محدود کردن اعضا، مدیر سوپرگروه کنید.

2. در گروه /setup، سپس /doctor و /status را با چند ثانیه فاصله بفرستید.

3. در حالت مشاهده /incidents را بررسی کنید؛ سپس /mode enforce را فعال کنید. /gate on تأیید اعضای جدید را روشن می‌کند.

4. هنگام محدودیت، با شناسه گروه در پیام تأیید، /verify GROUP_ID را در خصوصی بفرستید.

کنترل صوتی به آداپتور اختیاری جداگانه نیاز دارد. UDP خام و تاریخ ایجاد حساب در دسترس نیست.

## افزودن به گروه

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

[کد منبع](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
