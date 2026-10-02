<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — 한국어

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## 사용 가이드

[@sentinelvcbot](https://t.me/sentinelvcbot) · [업데이트](https://t.me/sentinelvc)

/start → /language → 한국어

1. 봇을 슈퍼그룹에 관리자로 추가하고 멤버 제한 권한을 부여하세요.

2. 그룹에서 /setup, /doctor, /status를 몇 초 간격으로 보내세요.

3. 관찰 모드에서 /incidents를 검토한 후 /mode enforce를 실행하세요. /gate on은 새 멤버 인증을 켭니다.

4. 제한된 경우 인증 안내의 그룹 ID로 비공개 채팅에서 /verify GROUP_ID를 보내세요.

음성 제어에는 별도의 선택적 어댑터가 필요합니다. 원시 UDP 패킷과 계정 생성일은 확인할 수 없습니다.

## 그룹에 추가

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

[소스 코드](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
