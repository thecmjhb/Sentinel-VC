<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Tiếng Việt

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## Hướng dẫn sử dụng

[@sentinelvcbot](https://t.me/sentinelvcbot) · [Cập nhật](https://t.me/sentinelvc)

/start → /language → Tiếng Việt

1. Thêm bot vào siêu nhóm làm quản trị viên có quyền hạn chế thành viên.

2. Gửi /setup, /doctor và /status trong nhóm, cách nhau vài giây.

3. Xem /incidents ở chế độ quan sát; dùng /mode enforce khi sẵn sàng. /gate on bật xác minh thành viên mới.

4. Nếu bị hạn chế, gửi riêng /verify GROUP_ID bằng ID nhóm trong thử thách.

Điều khiển thoại cần bộ điều hợp tùy chọn riêng. Không có dữ liệu UDP thô hay ngày tạo tài khoản.

## Thêm vào nhóm

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

[Mã nguồn](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
