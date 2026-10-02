<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — العربية

[English](../../README.md) · [বাংলা](../../README.bn.md) · [中文](README.zh-CN.md) · [हिन्दी](README.hi.md) · [Español](README.es.md)

[العربية](README.ar.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Bahasa Indonesia](README.id.md) · [اردو](README.ur.md)

[Русский](README.ru.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [Deutsch](README.de.md) · [Türkçe](README.tr.md)

[Italiano](README.it.md) · [فارسی](README.fa.md) · [Tiếng Việt](README.vi.md) · [தமிழ்](README.ta.md) · [తెలుగు](README.te.md)

Sentinel-VC إطار مفتوح المصدر لإدارة مجموعات Telegram الفائقة. يراقب أحداث الانضمام والمغادرة المتاحة والنشاط السريع للرسائل. يضيف محول اختياري يعمل بحساب مستخدم مشرف أحداث المشاركين في المكالمات الصوتية وإجراءات الكتم المصرح بها. المؤلف: **C. M. Jubayer Hossain Bappy**.

## استخدام البوت

بعد تشغيل الخدمة بواسطة المالك، أضف [@sentinelvcbot](https://t.me/sentinelvcbot) إلى مجموعتك الفائقة. اجعله مشرفًا وامنحه صلاحية **Restrict Members**. من حسابك الشخصي المشرف، أرسل `/setup` ثم انتظر بضع ثوانٍ وأرسل `/doctor` و`/status`. راقب نشاط المجموعة أولًا في وضع observe، ثم استخدم `/mode enforce` عندما تكون مستعدًا. يفعّل `/gate on` تقييد الدردشة المؤقت وسؤالًا حسابيًا للأعضاء الجدد.

## الاستضافة على VPS

ثبّت [Docker وCompose على Ubuntu](https://docs.docker.com/engine/install/ubuntu/). بعد نشر المستودع على GitHub:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

يمكنك اختيار منفذ فحص الحالة على VPS أثناء الإعداد؛ القيمة الافتراضية للتثبيت الجديد هي **18765**. اضغط Enter للاحتفاظ بالمنفذ المعروض. لتغييره لاحقًا شغّل `bash scripts/setup.sh --port 19234`؛ تبقى إعدادات `.env` الأخرى محفوظة. عند استخدام npm اضبط `HTTP_PORT` في `.env`.

يطلب المساعد الرمز دون إظهاره ويحافظ على ملف `.env` الموجود. لا تنشر الرمز في المحادثات أو الصور أو GitHub. افحص التشغيل:

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

بدون Docker، استخدم Node.js 24 LTS وانسخ `.env.example` إلى `.env` وأدخل `BOT_TOKEN` ثم شغّل `npm ci --ignore-scripts` و`npm start`. راجع [دليل التشغيل](../SELF_HOSTING.md) للخدمة المستمرة والنسخ الاحتياطي.

## الأوامر والحدود

يعرض `/incidents` للمشرف الأحداث الأخيرة الخاصة بهذه المجموعة فقط. يوقف `/mode observe` إجراءات الإدارة الجديدة. يستطيع العضو المقيد فتح محادثة خاصة مع البوت وإرسال `/verify` متبوعًا بمعرّف المجموعة الظاهر في التحدي. ثلاثة أجوبة خاطئة تستنفد المحاولات؛ ولا يرفع التحقق تقييد الإغراق خلال الدقيقة الأولى.

البوت العادي لا يرى حزم UDP الخام أو تاريخ إنشاء الحساب الحقيقي أو المشاركين مباشرة في المكالمات. تقييد الرسائل الصوتية يختلف عن كتم المكالمة. يتطلب [محول VC الاختياري](../VC_SETUP.md) حساب مستخدم مشرف موافقًا وجلسة خاصة وقائمة مجموعات مسموحة. يستعيد المشرف إعدادات المكالمة يدويًا.

## المجتمع والترخيص

في النسخة المستضافة ذاتيًا، الانضمام إلى [قناة التحديثات](https://t.me/sentinelvc) اختياري. للبوت المستضاف اتبع تعليمات /start. للمساعدة، استخدم [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues). الشفرة برخصة MIT؛ احتفظ بـ[الرخصة](../../LICENSE) ونسبة العمل إلى صاحبه.
