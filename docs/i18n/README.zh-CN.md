<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — 简体中文

[English](../../README.md) · [中文](../../docs/i18n/README.zh-CN.md) · [हिन्दी](../../docs/i18n/README.hi.md) · [Español](../../docs/i18n/README.es.md) · [العربية](../../docs/i18n/README.ar.md)

[Français](../../docs/i18n/README.fr.md) · [বাংলা](../../README.bn.md) · [Português](../../docs/i18n/README.pt.md) · [Bahasa Indonesia](../../docs/i18n/README.id.md) · [اردو](../../docs/i18n/README.ur.md)

Sentinel-VC 是面向 Telegram 超级群组的开源管理框架。它根据可见的入群、退群、消息和按钮操作识别过快的活动，并提供临时限制与算术验证。可选的用户管理员适配器支持接收到的实时通话参与状态事件和授权静音操作。作者与维护者：**C. M. Jubayer Hossain Bappy**。

**状态：实验版本。** 本地自动化测试已通过，真实 Telegram 行为与 Docker 部署仍需验证。请先使用观察模式，检查本群正常活动后再开启自动限制。

## 使用项目机器人

1. 将 [@sentinelvcbot 添加到超级群组](https://t.me/sentinelvcbot?startgroup=setup)。
2. 将机器人设为管理员，授予 **Restrict Members（限制成员）** 权限。
3. 使用你本人的管理员账号发送 `/setup`，等待几秒后发送 `/doctor` 和 `/status`。
4. 先观察 `/incidents` 中的记录，准备好后使用 `/mode enforce` 开启自动管理。
5. 如需新成员验证，发送 `/gate on`。

使用已上线的项目机器人无需自己购买 VPS；可用性取决于托管服务。可以加入[更新频道](https://t.me/sentinelvc)，但加入频道不是完成验证的条件。仅添加机器人不会开启直接通话控制。

## 主要功能

- 按事件成本计费的令牌桶与逐渐衰减的超额活动证据。
- 群组独立的设置、验证、冷却时间和审计记录。
- 自动到期的聊天限制，以及通过私聊恢复验证的功能。
- 操作前检查管理员权限，保护管理员和已有的第三方限制。
- 可选的通话状态监控、参与者静音及检测后默认静音入会策略。
- Docker 安装助手、SQLite 持久化、有限队列和健康检查。

## 常用命令

| 命令 | 用途 |
|---|---|
| `/start`、`/help`、`/updates`、`/privacy` | 使用说明、项目链接和数据处理说明 |
| `/setup`、`/doctor`、`/status` | 注册群组、检查权限和查看设置 |
| `/incidents` | 当前群组最近保留的事件记录 |
| `/mode observe` / `/mode enforce` | 仅记录 / 启用自动管理 |
| `/gate on` / `/gate off` | 开关新成员聊天验证 |
| `/vc on` / `/vc off` | 开关已配置的通话适配器 |
| `/vclock on` / `/vclock off` | 开关未来检测触发的默认静音入会策略 |
| `/disable` | 停用当前群组保护 |
| `/verify` | 重新打开自己的验证题目 |

配置命令仅限当前群组的普通身份管理员使用，匿名管理员不能完成设置。两条管理命令之间请间隔几秒。

## 完成验证

被限制后无法在群组发言时，打开机器人的私聊，发送 `/verify GROUP_ID`，将 `GROUP_ID` 替换为题目中显示的负数群组 ID。按钮只能验证你自己的账号。

三次错误回答会耗尽尝试次数。因刷屏产生的限制在第一分钟内不能通过验证提前解除。限制会按设定时间到期；需要帮助时请联系群管理员。算术题可以被自动化程序解答，不是可靠的身份认证。

## 自行托管

准备你自己的 [BotFather](https://t.me/BotFather) token，以及安装了 [Docker Engine 和 Compose](https://docs.docker.com/engine/install/ubuntu/) 的 Ubuntu VPS：

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

安装时可选择 VPS 健康检查端口，新安装默认 **18765**；按 Enter 保留显示的端口。以后可运行 `bash scripts/setup.sh --port 19234` 修改，其他 `.env` 设置会保留。直接使用 npm 时，在 `.env` 中设置 `HTTP_PORT`。

助手会隐藏 token 输入，创建 `.env` 并启动容器；已有 `.env` 不会被修改。请勿公开 token、`.env` 或账号会话文件。

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

不使用 Docker 时，安装 Node.js 24 LTS，将 `.env.example` 复制为 `.env`，填写 `BOT_TOKEN`，然后运行：

```bash
npm ci --ignore-scripts
npm start
```

轮询模式不需要域名。同一个 token 和数据库只运行一个实例。后台服务、备份、更新和故障排查见[自行托管指南](../SELF_HOSTING.md)。

## 通话控制与能力边界

[可选通话适配器](../VC_SETUP.md)需要一个明确同意的用户管理员账号、私密会话、API 凭据和群组白名单。该账号需要管理视频聊天的权限，群管理员还需要执行 `/vc on`。通话静音或默认静音入会设置需要管理员手动恢复；完成聊天验证不会取消通话静音。

普通机器人不能观察或过滤原始 UDP 数据包，也无法获知可信的账号注册时间。没有用户名本身不会成为处罚理由。本实现没有证明能够阻止 Telegram 客户端崩溃或媒体层洪泛攻击。详情见[系统架构](../ARCHITECTURE.md)。

## 社区与许可证

[项目更新](https://t.me/sentinelvc) · [问题反馈](https://github.com/thecmjhb/Sentinel-VC/issues) · [隐私说明](../../PRIVACY.md) · [安全报告](../../SECURITY.md)

代码采用 [MIT 许可证](../../LICENSE)，复用时保留版权与许可证。品牌素材另见[素材说明](../../assets/NOTICE.md)。README 提供十种语言；机器人的命令菜单目前提供英语和孟加拉语。
