<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Português

[English](../../README.md) · [中文](../../docs/i18n/README.zh-CN.md) · [हिन्दी](../../docs/i18n/README.hi.md) · [Español](../../docs/i18n/README.es.md) · [العربية](../../docs/i18n/README.ar.md)

[Français](../../docs/i18n/README.fr.md) · [বাংলা](../../README.bn.md) · [Português](../../docs/i18n/README.pt.md) · [Bahasa Indonesia](../../docs/i18n/README.id.md) · [اردو](../../docs/i18n/README.ur.md)

Sentinel-VC é um framework de moderação de código aberto para supergrupos do Telegram. Ele analisa entradas, saídas, mensagens e interações rápidas com botões para aplicar restrições temporárias e verificação aritmética. Um adaptador opcional com uma conta de usuário administradora permite observar eventos de participação em chamadas e solicitar ações autorizadas. Autor e mantenedor: **C. M. Jubayer Hossain Bappy**.

**Estado: versão experimental.** Os testes automatizados locais passaram; o comportamento real no Telegram e a implantação com Docker ainda precisam de validação. Comece em modo de observação e analise a atividade legítima antes de ativar restrições automáticas.

## Usar o bot do projeto

1. [Adicione @sentinelvcbot ao seu supergrupo](https://t.me/sentinelvcbot?startgroup=setup).
2. Torne-o administrador e conceda a permissão **Restrict Members (Restringir membros)**.
3. Com sua conta pessoal de administrador, envie `/setup`; após alguns segundos, use `/doctor` e `/status`.
4. Analise `/incidents` em modo de observação. Use `/mode enforce` quando estiver pronto para aplicar ações.
5. Ative `/gate on` se desejar verificar novos membros.

Para usar uma instância disponível do bot do projeto, você não precisa de VPS próprio. A disponibilidade depende da hospedagem. O [canal de atualizações](https://t.me/sentinelvc) é opcional e não é exigido para resolver desafios. Adicionar apenas o bot não ativa o controle direto de chamadas.

## Recursos

- Baldes de tokens com custos por evento e evidências de excesso que diminuem com o tempo.
- Configurações, desafios, intervalos de ação e registros separados por grupo.
- Restrições com expiração e recuperação de desafios pelo chat privado.
- Verificação atual de privilégios, proteção de administradores e preservação de restrições existentes.
- Adaptador opcional para eventos de chamadas, silenciamento e entrada silenciada após detecção.
- Assistente Docker, persistência SQLite, filas limitadas e verificações de saúde.

## Comandos

| Comando | Função |
|---|---|
| `/start`, `/help`, `/updates`, `/privacy` | Instruções, links e tratamento de dados |
| `/setup`, `/doctor`, `/status` | Registrar o grupo, verificar permissões e consultar configurações |
| `/incidents` | Exibir registros recentes do grupo atual |
| `/mode observe` / `/mode enforce` | Apenas registrar / ativar moderação automática |
| `/gate on` / `/gate off` | Ativar ou desativar o desafio para novos membros |
| `/vc on` / `/vc off` | Ativar ou desativar o adaptador de chamadas configurado |
| `/vclock on` / `/vclock off` | Alterar a política de entrada silenciada para futuras detecções |
| `/disable` | Desativar a proteção do grupo |
| `/verify` | Reabrir seu próprio desafio |

Comandos de configuração exigem um administrador atual, identificado por sua conta pessoal. Administradores anônimos não podem configurar o bot. Aguarde alguns segundos entre comandos administrativos.

## Resolver um desafio

Se a restrição impedir mensagens no grupo, abra o chat privado do bot e envie `/verify GROUP_ID`, substituindo `GROUP_ID` pelo identificador negativo exibido no desafio. Cada desafio está vinculado ao próprio usuário.

Três respostas erradas esgotam as tentativas. Uma restrição por flood não pode ser removida pela verificação durante o primeiro minuto. A restrição expira no prazo configurado; peça ajuda a um administrador se necessário. Aritmética simples pode ser resolvida por automação e não comprova identidade.

## Hospedar seu próprio bot

Obtenha seu token no [BotFather](https://t.me/BotFather) e instale [Docker Engine e Compose](https://docs.docker.com/engine/install/ubuntu/) em um VPS Ubuntu:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

Escolha a porta de verificação de saúde do VPS durante a configuração; o padrão inicial é **18765**. Pressione Enter para manter a porta exibida. Para alterá-la depois: `bash scripts/setup.sh --port 19234`. As demais configurações de `.env` são preservadas. Com npm, defina `HTTP_PORT` em `.env`.

O assistente oculta a entrada do token, cria `.env` e inicia o contêiner. Uma configuração existente é preservada. Mantenha token, `.env` e sessões de conta em segredo.

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

Sem Docker, instale Node.js 24 LTS, copie `.env.example` para `.env`, configure `BOT_TOKEN` e execute:

```bash
npm ci --ignore-scripts
npm start
```

Polling não exige domínio. Execute uma única instância por token e banco de dados. Consulte o [guia de hospedagem](../SELF_HOSTING.md) para serviço persistente, backups, atualizações e diagnóstico.

## Chamadas de voz e limites

O [adaptador opcional de chamadas](../VC_SETUP.md) exige uma conta de usuário administradora com consentimento, sessão privada, credenciais de API e lista explícita de grupos permitidos. A conta precisa da permissão para gerenciar chamadas; um administrador do grupo também ativa `/vc on`.

Um administrador restaura manualmente o silenciamento e a entrada silenciada. Resolver a verificação de chat não devolve a fala na chamada. O bot comum não observa nem filtra UDP bruto e não conhece a data real de criação de contas. A ausência de nome de usuário, isoladamente, não causa punição. A implementação não demonstrou prevenção de falhas de clientes ou de floods na camada de mídia. Veja a [arquitetura](../ARCHITECTURE.md).

## Comunidade e licença

[Atualizações](https://t.me/sentinelvc) · [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues) · [Privacidade](../../PRIVACY.md) · [Relatos de segurança](../../SECURITY.md)

Código sob a [licença MIT](../../LICENSE): preserve o aviso de direitos autorais e a licença. Consulte o [aviso dos recursos visuais](../../assets/NOTICE.md). O README está disponível em dez idiomas; os menus de comandos do bot estão disponíveis em inglês e bengali.
