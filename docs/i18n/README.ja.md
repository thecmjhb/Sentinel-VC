<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — 日本語

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

## 使い方

[@sentinelvcbot](https://t.me/sentinelvcbot) · [更新情報](https://t.me/sentinelvc)

/start → /language → 日本語

1. ボットをスーパーグループの管理者にし、メンバー制限の権限を与えてください。

2. グループで /setup、/doctor、/status を数秒ずつ間隔を空けて送信します。

3. 監視モードで /incidents を確認し、準備ができたら /mode enforce を使います。/gate on で新規メンバーの確認を有効にします。

4. 制限された場合は、確認メッセージのグループ ID を使い、個別チャットで /verify GROUP_ID を送ります。

音声制御には別途オプションのアダプターが必要です。生の UDP パケットやアカウント作成日は取得できません。

## グループに追加

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

[ソースコード](https://github.com/thecmjhb/Sentinel-VC) · [MIT](../../LICENSE) · [Privacy (English)](../../PRIVACY.md)

C. M. Jubayer Hossain Bappy
