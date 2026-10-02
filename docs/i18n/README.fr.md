<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Français

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

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

Pour la version auto-hébergée, rejoindre [le canal d’actualités](https://t.me/sentinelvc) est facultatif. Pour le bot hébergé, suivez les indications de /start. Pour obtenir de l’aide, utilisez [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues). Code MIT : conservez [licence](../../LICENSE) et attribution.
