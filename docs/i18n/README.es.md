<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Español

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

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
