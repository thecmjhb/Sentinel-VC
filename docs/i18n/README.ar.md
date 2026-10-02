<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — العربية

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

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
