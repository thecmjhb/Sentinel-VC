<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Español

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

Sentinel-VC es un framework de moderación de código abierto para supergrupos de Telegram. Observa los eventos disponibles de entrada/salida y la actividad rápida de mensajes. Un adaptador opcional con una cuenta de usuario administradora añade eventos de participación en llamadas y acciones autorizadas de silencio. Autor: **C. M. Jubayer Hossain Bappy**.

## Usar el bot del proyecto

Cuando el propietario haya desplegado el servicio, añade [@sentinelvcbot](https://t.me/sentinelvcbot) a tu supergrupo. Hazlo administrador con **Restrict Members**. Desde tu cuenta personal administradora, envía `/setup`, espera unos segundos y utiliza `/doctor` y `/status`. Empieza en modo observe; activa `/mode enforce` cuando hayas revisado el comportamiento. `/gate on` añade una restricción temporal de chat y un reto aritmético para nuevos miembros.

## Alojar tu propio bot

Instala [Docker y Compose en Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Después de que se publique el repositorio:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

Elige el puerto de comprobación de estado del VPS durante la instalación; el valor inicial es **18765**. Pulsa Enter para conservar el puerto mostrado. Para cambiarlo después: `bash scripts/setup.sh --port 19234`. Se conservan los demás ajustes de `.env`. Con npm, configura `HTTP_PORT` en `.env`.

El asistente pide el token sin mostrarlo y conserva un `.env` existente. No publiques tokens en chats, capturas o GitHub. Comprueba el arranque:

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

Sin Docker, usa Node.js 24 LTS: copia `.env.example` a `.env`, configura `BOT_TOKEN` y ejecuta `npm ci --ignore-scripts` y `npm start`. Consulta [operación y copias de seguridad](../SELF_HOSTING.md) para un servicio persistente.

## Comandos y alcance

`/incidents` muestra solo a los administradores los registros recientes del grupo actual. `/mode observe` evita nuevas acciones de moderación. Un miembro restringido puede escribir `/verify` seguido del ID del grupo, indicado en el reto, en el chat privado del bot. Tres respuestas incorrectas agotan el reto; una restricción por inundación no se levanta durante su primer minuto.

El bot normal no observa UDP bruto, la fecha real de creación de cuentas ni una lista completa de participantes de llamadas. Restringir notas de voz no silencia una llamada. El [adaptador VC](../VC_SETUP.md) necesita una cuenta administradora que consienta, una sesión privada y una lista permitida. Un administrador restaura manualmente las acciones de llamada.

## Comunidad y licencia

En la versión autoalojada, unirse al [canal de novedades](https://t.me/sentinelvc) es opcional. Para el bot alojado, sigue las instrucciones de /start. Para obtener ayuda, usa [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues). Código MIT: conserva [licencia](../../LICENSE) y atribución.
