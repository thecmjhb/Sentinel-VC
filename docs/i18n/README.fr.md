<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Français

[English](../../README.md) · [中文](../../docs/i18n/README.zh-CN.md) · [हिन्दी](../../docs/i18n/README.hi.md) · [Español](../../docs/i18n/README.es.md) · [العربية](../../docs/i18n/README.ar.md)

[Français](../../docs/i18n/README.fr.md) · [বাংলা](../../README.bn.md) · [Português](../../docs/i18n/README.pt.md) · [Bahasa Indonesia](../../docs/i18n/README.id.md) · [اردو](../../docs/i18n/README.ur.md)

Sentinel-VC est un framework de modération open source pour les supergroupes Telegram. Il observe les événements disponibles d'arrivée/départ et l'activité rapide des messages. Un adaptateur facultatif utilisant un compte utilisateur administrateur ajoute des événements de participation aux appels et des actions de mise en sourdine autorisées. Auteur : **C. M. Jubayer Hossain Bappy**.

## Utiliser le bot du projet

Après le déploiement du service par son propriétaire, ajoutez [@sentinelvcbot](https://t.me/sentinelvcbot) à votre supergroupe. Donnez-lui le statut d'administrateur et **Restrict Members**. Depuis votre compte personnel administrateur, envoyez `/setup`, attendez quelques secondes, puis utilisez `/doctor` et `/status`. Commencez en mode observe ; passez à `/mode enforce` après avoir examiné l'activité. `/gate on` active une restriction temporaire du chat et un défi arithmétique pour les nouveaux membres.

## Héberger votre bot

Installez [Docker et Compose sur Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Une fois le dépôt publié :

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

Choisissez le port de contrôle de santé du VPS pendant la configuration ; la valeur initiale est **18765**. Appuyez sur Entrée pour conserver le port affiché. Pour le modifier ensuite : `bash scripts/setup.sh --port 19234`. Les autres paramètres de `.env` sont conservés. Avec npm, définissez `HTTP_PORT` dans `.env`.

L'assistant demande le jeton sans l'afficher et préserve un fichier `.env` existant. Ne publiez jamais le jeton dans un chat, une capture ou GitHub. Vérifiez le démarrage :

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

Sans Docker, utilisez Node.js 24 LTS : copiez `.env.example` vers `.env`, renseignez `BOT_TOKEN`, puis lancez `npm ci --ignore-scripts` et `npm start`. Consultez [le guide d'exploitation](../SELF_HOSTING.md) pour le service persistant et les sauvegardes.

## Commandes et limites

`/incidents` affiche aux seuls administrateurs les événements récents du groupe courant. `/mode observe` désactive les nouvelles actions de modération. Un membre restreint peut envoyer `/verify` suivi de l'identifiant du groupe indiqué dans le défi, en privé au bot. Trois mauvaises réponses épuisent le défi ; une restriction liée au flood ne peut pas être levée pendant sa première minute.

Le bot classique ne voit ni UDP brut, ni la véritable date de création des comptes, ni un flux complet des participants aux appels. Restreindre les messages vocaux ne coupe pas un appel. [L'adaptateur VC](../VC_SETUP.md) demande un compte administrateur consentant, une session privée et une liste autorisée. Les actions sur l'appel se rétablissent manuellement.

## Communauté et licence

Rejoindre [le canal d’actualités](https://t.me/sentinelvc) est facultatif. Pour obtenir de l’aide, utilisez [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues). Code MIT : conservez [licence](../../LICENSE) et attribution.
