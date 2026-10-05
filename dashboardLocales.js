// Button labels and the main private-chat workflow are localized. Detailed diagnostics use English.
const rows = {
  en: ['My communities|Select community|Refresh|Group|Channel|Back|Set up|Observe|Enforce|Verification|Voice controls|Join muted|Incidents|Disable', 'Add this bot as a group/channel administrator (supergroups need Restrict Members). Open /communities here, select your community and press Set up. Manage it using the buttons here. Private communities work with the selector or numeric ID. Members recover their own chat challenge using /verify.'],
  bn: ['আমার কমিউনিটি|কমিউনিটি বাছুন|রিফ্রেশ|গ্রুপ|চ্যানেল|ফিরুন|সেটআপ করুন|পর্যবেক্ষণ|ব্যবস্থা নিন|যাচাই|ভয়েস নিয়ন্ত্রণ|মিউট হয়ে যোগদান|ঘটনাগুলো|বন্ধ করুন', 'Bot-কে group/channel admin করুন; supergroup-এ Restrict Members দিন। এখানে /communities খুলে নিজের community বেছে সেটআপ করুন। সব control এই private chat-এর button দিয়ে করুন। Private community-ও selector বা numeric ID দিয়ে যুক্ত হবে। সদস্য নিজের chat challenge পাবে /verify দিয়ে।'],
  zh: ['我的社区|选择社区|刷新|群组|频道|返回|设置|观察|执行|验证|语音控制|静音加入|事件|停用', '将机器人设为群组或频道管理员；超级群组需要限制成员权限。在私聊中打开 /communities，选择社区并设置，用按钮管理。私有社区也可通过选择器或数字 ID 添加。成员通过 /verify 恢复自己的聊天验证。'],
  hi: ['मेरे समुदाय|समुदाय चुनें|ताज़ा करें|ग्रुप|चैनल|वापस|सेटअप|निरीक्षण|कार्रवाई|सत्यापन|वॉइस नियंत्रण|म्यूट होकर जुड़ें|घटनाएँ|बंद करें', 'बॉट को ग्रुप या चैनल admin बनाएँ; supergroup में Restrict Members दें। निजी चैट में /communities खोलें, समुदाय चुनकर सेटअप करें और बटन से नियंत्रण करें। निजी समुदाय selector या numeric ID से जोड़ें। सदस्य अपना chat challenge /verify से खोलें।'],
  es: ['Mis comunidades|Elegir comunidad|Actualizar|Grupo|Canal|Volver|Configurar|Observar|Aplicar|Verificación|Control de voz|Entrar silenciado|Incidentes|Desactivar', 'Haz administrador al bot en el grupo o canal; los supergrupos necesitan permiso para restringir miembros. Abre /communities en privado, elige la comunidad y configúrala con los botones. Los espacios privados admiten selector o ID numérico. Los miembros recuperan su verificación de chat con /verify.'],
  ar: ['مجتمعاتي|اختيار مجتمع|تحديث|مجموعة|قناة|رجوع|إعداد|مراقبة|تفعيل الإجراءات|التحقق|التحكم الصوتي|الانضمام مكتومًا|الحوادث|تعطيل', 'اجعل البوت مشرفًا للمجموعة أو القناة، مع صلاحية تقييد الأعضاء للمجموعات الفائقة. افتح /communities في الخاص واختر المجتمع وأعدّه بالأزرار. المجتمعات الخاصة تدعم أداة الاختيار أو المعرّف الرقمي. يسترجع العضو تحدي الدردشة الخاص به عبر /verify.'],
  fr: ['Mes communautés|Choisir une communauté|Actualiser|Groupe|Canal|Retour|Configurer|Observer|Appliquer|Vérification|Contrôle vocal|Rejoindre en sourdine|Incidents|Désactiver', 'Ajoutez le bot comme administrateur du groupe ou canal, avec le droit de restreindre les membres du supergroupe. Ouvrez /communities en privé, choisissez une communauté et configurez-la avec les boutons. Les communautés privées acceptent le sélecteur ou un ID numérique. Les membres retrouvent leur vérification de discussion avec /verify.'],
  pt: ['Minhas comunidades|Escolher comunidade|Atualizar|Grupo|Canal|Voltar|Configurar|Observar|Aplicar|Verificação|Controle de voz|Entrar silenciado|Incidentes|Desativar', 'Adicione o bot como administrador do grupo ou canal; supergrupos precisam da permissão de restringir membros. Abra /communities no privado, escolha a comunidade e configure pelos botões. Comunidades privadas aceitam seletor ou ID numérico. Membros recuperam a própria verificação de chat com /verify.'],
  id: ['Komunitas saya|Pilih komunitas|Segarkan|Grup|Kanal|Kembali|Siapkan|Pantau|Terapkan|Verifikasi|Kontrol suara|Masuk dibisukan|Insiden|Nonaktifkan', 'Jadikan bot admin grup atau kanal; supergrup memerlukan izin membatasi anggota. Buka /communities di chat pribadi, pilih komunitas lalu atur dengan tombol. Komunitas privat dapat dipilih lewat pemilih atau ID numerik. Anggota membuka verifikasi chat sendiri lewat /verify.'],
  ur: ['میری کمیونٹیز|کمیونٹی چنیں|تازہ کریں|گروپ|چینل|واپس|سیٹ اپ|نگرانی|عمل کریں|تصدیق|صوتی کنٹرول|خاموش شامل ہوں|واقعات|بند کریں', 'بوٹ کو گروپ یا چینل کا admin بنائیں؛ supergroup میں Restrict Members دیں۔ نجی چیٹ میں /communities کھولیں، کمیونٹی منتخب کریں اور بٹن سے سیٹ اپ کریں۔ نجی کمیونٹی selector یا عددی ID سے بھی شامل ہوتی ہے۔ رکن اپنی chat verification کے لیے /verify استعمال کرے۔'],
  ru: ['Мои сообщества|Выбрать сообщество|Обновить|Группа|Канал|Назад|Настроить|Наблюдать|Применять|Проверка|Голосовое управление|Вход без микрофона|Инциденты|Отключить', 'Добавьте бота администратором группы или канала; в супергруппе разрешите ограничение участников. В личном чате откройте /communities, выберите сообщество и настройте его кнопками. Частные сообщества доступны через выбор чата или числовой ID. Участники открывают свою проверку чата через /verify.'],
  ko: ['내 커뮤니티|커뮤니티 선택|새로고침|그룹|채널|뒤로|설정|관찰|조치|인증|음성 제어|음소거로 참가|사건|비활성화', '봇을 그룹 또는 채널 관리자로 추가하세요. 슈퍼그룹에는 멤버 제한 권한이 필요합니다. 개인 채팅에서 /communities를 열고 커뮤니티를 선택한 뒤 버튼으로 설정하세요. 비공개 커뮤니티도 선택 도구나 숫자 ID로 추가할 수 있습니다. 멤버는 /verify로 자신의 채팅 인증을 엽니다.'],
  ja: ['自分のコミュニティ|コミュニティを選択|更新|グループ|チャンネル|戻る|設定|監視|対処|確認|音声制御|ミュートで参加|インシデント|無効化', 'ボットをグループやチャンネルの管理者にし、スーパーグループではメンバー制限を許可してください。個別チャットで /communities を開き、コミュニティを選びボタンで設定します。非公開コミュニティも選択機能や数値 ID で追加できます。メンバーは /verify で自分のチャット確認を開きます。'],
  de: ['Meine Communitys|Community auswählen|Aktualisieren|Gruppe|Kanal|Zurück|Einrichten|Beobachten|Eingreifen|Verifizierung|Sprachsteuerung|Stumm beitreten|Vorfälle|Deaktivieren', 'Füge den Bot als Gruppen- oder Kanaladministrator hinzu; Supergruppen benötigen das Recht zum Einschränken von Mitgliedern. Öffne privat /communities, wähle die Community und richte sie mit den Schaltflächen ein. Private Communitys unterstützen die Auswahl oder eine numerische ID. Mitglieder öffnen ihre Chat-Verifizierung mit /verify.'],
  tr: ['Topluluklarım|Topluluk seç|Yenile|Grup|Kanal|Geri|Kurulum|İzle|Uygula|Doğrulama|Ses kontrolü|Sessiz katıl|Olaylar|Devre dışı bırak', 'Botu grup veya kanal yöneticisi yapın; süpergrupta üye kısıtlama izni verin. Özel sohbette /communities açın, topluluğu seçip düğmelerle kurun. Özel topluluklar seçici veya sayısal kimlikle eklenebilir. Üyeler kendi sohbet doğrulamalarını /verify ile açar.'],
  it: ['Le mie comunità|Scegli comunità|Aggiorna|Gruppo|Canale|Indietro|Configura|Osserva|Intervieni|Verifica|Controllo vocale|Entra silenziato|Incidenti|Disattiva', 'Aggiungi il bot come amministratore del gruppo o canale; nei supergruppi serve il permesso di limitare i membri. Apri /communities in privato, scegli la comunità e configurala con i pulsanti. Le comunità private supportano il selettore o un ID numerico. I membri aprono la propria verifica chat con /verify.'],
  fa: ['انجمن‌های من|انتخاب انجمن|تازه‌سازی|گروه|کانال|بازگشت|راه‌اندازی|مشاهده|اعمال|تأیید|کنترل صوتی|ورود بی‌صدا|رویدادها|غیرفعال', 'ربات را مدیر گروه یا کانال کنید؛ در سوپرگروه دسترسی محدود کردن اعضا بدهید. در خصوصی /communities را باز کنید، انجمن را انتخاب و با دکمه‌ها تنظیم کنید. انجمن خصوصی با انتخابگر یا شناسه عددی اضافه می‌شود. اعضا تأیید چت خود را با /verify باز می‌کنند.'],
  vi: ['Cộng đồng của tôi|Chọn cộng đồng|Làm mới|Nhóm|Kênh|Quay lại|Thiết lập|Quan sát|Thực thi|Xác minh|Điều khiển thoại|Tham gia tắt mic|Sự cố|Tắt', 'Thêm bot làm quản trị viên nhóm hoặc kênh; siêu nhóm cần quyền hạn chế thành viên. Mở /communities trong chat riêng, chọn cộng đồng và thiết lập bằng nút. Cộng đồng riêng hỗ trợ bộ chọn hoặc ID số. Thành viên mở xác minh chat của mình bằng /verify.'],
  ta: ['என் சமூகங்கள்|சமூகத்தைத் தேர்வுசெய்|புதுப்பி|குழு|சேனல்|பின்செல்|அமைப்பு|கண்காணி|நடவடிக்கை|சரிபார்ப்பு|குரல் கட்டுப்பாடு|ஒலியின்றி சேரவும்|நிகழ்வுகள்|முடக்கு', 'Bot-ஐ குழு அல்லது சேனல் நிர்வாகியாக்கவும்; supergroup-இல் உறுப்பினர் கட்டுப்பாட்டு அனுமதி தரவும். தனிப்பட்ட உரையாடலில் /communities திறந்து சமூகத்தைத் தேர்ந்து பொத்தான்களால் அமைக்கவும். தனியார் சமூகங்களைத் தேர்வி அல்லது எண் ID மூலம் சேர்க்கலாம். உறுப்பினர் தனது chat சரிபார்ப்பை /verify மூலம் திறக்கலாம்.'],
  te: ['నా కమ్యూనిటీలు|కమ్యూనిటీ ఎంచుకోండి|రిఫ్రెష్|గ్రూప్|ఛానల్|వెనుకకు|సెటప్|పరిశీలన|చర్య|ధృవీకరణ|వాయిస్ నియంత్రణ|మ్యూట్‌గా చేరండి|సంఘటనలు|ఆపివేయి', 'బాట్‌ను గ్రూప్ లేదా ఛానల్ adminగా చేర్చండి; supergroupలో సభ్యులను పరిమితం చేసే అనుమతి ఇవ్వండి. ప్రైవేట్ చాట్‌లో /communities తెరిచి కమ్యూనిటీని ఎంచుకుని బటన్లతో సెటప్ చేయండి. ప్రైవేట్ కమ్యూనిటీలకు selector లేదా సంఖ్యా ID వాడవచ్చు. సభ్యులు తమ chat ధృవీకరణను /verifyతో తెరవవచ్చు.']
};
const keys = 'title add refresh group channel back setup observe enforce gate voice lock incidents disable'.split(' ');
const diagnostics = {
  empty: 'No verified communities on this page. Select one below.',
  idHint: 'Private/public: use the selector, or /community NEGATIVE_ID (for example /community -1001234567890). Public usernames also work.',
  choose: 'Choose a community where you and this bot are administrators. Private communities need no username. Basic groups must first become supergroups.',
  disabled: 'Protection disabled. Existing Telegram restrictions expire at their original deadline; review live-call mutes manually.',
  restrict: 'Grant this bot Restrict Members permission first.', capacity: 'Community capacity reached; contact the operator.',
  setupFirst: 'Press Set up first.', noGate: 'Subscriber CAPTCHA is unavailable for broadcast channels.',
  adapter: 'Voice needs the optional MTProto adapter and operator allowlist.', noIncidents: 'No recent incidents.',
  notSetup: 'Not configured', status: 'Protection',
  recovery: 'Chat verification: /verify privately. Live-call mutes require administrator review. Bots cannot initiate private chats.',
  confirm: 'Disable protection for this community? Active chat restrictions retain their original expiry.',
  error: 'Could not complete this request. Check the ID and current administrator permissions for you and this bot, then retry after a few seconds.'
};
const voiceLabels = {
  en:'Raid shield|Guard each call|Rotate speaking links|Connect voice account|Protect call now|Open admission',
  bn:'কলে join-burst প্রতিরক্ষা|প্রতি কলে আগাম মিউট|Speaking link বদলান|Voice account যুক্ত করুন|এখনই call সুরক্ষা|Speaking admission খুলুন',
  zh:'加入突发防护|每通通话预防|重置发言链接|连接语音账号|立即保护通话|开放发言准入',
  hi:'जॉइन बर्स्ट सुरक्षा|हर कॉल सुरक्षा|स्पीकिंग लिंक बदलें|वॉइस खाता जोड़ें|अभी कॉल सुरक्षित करें|बोलने का प्रवेश खोलें',
  es:'Protección de entradas|Proteger cada llamada|Renovar enlaces de voz|Conectar cuenta de voz|Proteger llamada ahora|Abrir admisión',
  ar:'حماية اندفاع الانضمام|حماية كل مكالمة|تجديد روابط الكلام|ربط حساب صوتي|حماية المكالمة الآن|فتح قبول المتحدثين',
  fr:'Protection des arrivées|Protéger chaque appel|Renouveler liens de parole|Connecter le compte vocal|Protéger l’appel maintenant|Ouvrir l’admission',
  pt:'Proteção de entradas|Proteger cada chamada|Renovar links de fala|Conectar conta de voz|Proteger chamada agora|Abrir admissão',
  id:'Perisai lonjakan masuk|Lindungi setiap panggilan|Perbarui tautan bicara|Hubungkan akun suara|Lindungi panggilan sekarang|Buka penerimaan',
  ur:'جوائن برسٹ تحفظ|ہر کال کا تحفظ|بولنے کے لنکس بدلیں|صوتی اکاؤنٹ جوڑیں|ابھی کال محفوظ کریں|بولنے کا داخلہ کھولیں',
  ru:'Защита от наплыва|Защищать каждый звонок|Сбросить ссылки речи|Подключить голосовой аккаунт|Защитить звонок сейчас|Открыть допуск',
  ko:'입장 급증 방어|모든 통화 보호|발언 링크 갱신|음성 계정 연결|지금 통화 보호|발언 입장 허용',
  ja:'参加急増の防御|各通話を保護|発言リンクを更新|音声アカウント接続|今すぐ通話を保護|発言参加を許可',
  de:'Schutz vor Beitrittswelle|Jeden Anruf schützen|Sprechlinks erneuern|Sprachkonto verbinden|Anruf jetzt schützen|Zulassung öffnen',
  tr:'Katılım dalgası koruması|Her aramayı koru|Konuşma bağlantılarını yenile|Ses hesabı bağla|Aramayı şimdi koru|Kabulü aç',
  it:'Protezione dagli ingressi|Proteggi ogni chiamata|Rinnova link di parola|Collega account vocale|Proteggi chiamata ora|Apri ammissione',
  fa:'حفاظت موج ورود|حفاظت هر تماس|تغییر پیوندهای صحبت|اتصال حساب صوتی|حفاظت فوری تماس|باز کردن پذیرش',
  vi:'Chống lượt vào dồn dập|Bảo vệ mọi cuộc gọi|Đổi liên kết phát biểu|Kết nối tài khoản thoại|Bảo vệ cuộc gọi ngay|Mở quyền tham gia nói',
  ta:'திடீர் சேர்க்கை பாதுகாப்பு|ஒவ்வொரு அழைப்பும் பாதுகாப்பு|பேச்சு இணைப்பை மாற்று|குரல் கணக்கை இணை|அழைப்பை இப்போது காப்பு|பேச்சு அனுமதியைத் திற',
  te:'జాయిన్ బర్స్ట్ రక్షణ|ప్రతి కాల్ రక్షణ|స్పీకింగ్ లింకులు మార్చండి|వాయిస్ ఖాతా కనెక్ట్|ఇప్పుడే కాల్ రక్షించండి|స్పీకింగ్ ప్రవేశం తెరవండి'
};
export function dashboardLocale(code) {
  const [labels, intro] = rows[code] || rows.en;
  const out = { ...diagnostics, ...Object.fromEntries(keys.map((key, i) => [key, labels.split('|')[i]])), intro };
  out.languageCode = code;
  const emergency = {
    en:'End call (everyone)|Scan login QR',bn:'সবার জন্য call শেষ করুন|Login QR scan করুন',
    zh:'结束所有人的通话|扫描登录二维码',hi:'सभी के लिए कॉल समाप्त करें|लॉगिन QR स्कैन करें',
    es:'Finalizar llamada para todos|Escanear QR de acceso',ar:'إنهاء المكالمة للجميع|مسح رمز تسجيل الدخول',
    fr:'Terminer l’appel pour tous|Scanner le QR de connexion',pt:'Encerrar chamada para todos|Ler QR de login',
    id:'Akhiri panggilan untuk semua|Pindai QR masuk',ur:'سب کے لیے کال ختم کریں|لاگ ان QR اسکین کریں',
    ru:'Завершить звонок для всех|Сканировать QR входа',ko:'모두의 통화 종료|로그인 QR 스캔',
    ja:'全員の通話を終了|ログインQRをスキャン',de:'Anruf für alle beenden|Anmelde-QR scannen',
    tr:'Aramayı herkes için bitir|Giriş QR kodunu tara',it:'Termina chiamata per tutti|Scansiona QR di accesso',
    fa:'پایان تماس برای همه|اسکن QR ورود',vi:'Kết thúc cuộc gọi cho mọi người|Quét QR đăng nhập',
    ta:'அனைவருக்கும் அழைப்பை முடி|உள்நுழைவு QR ஸ்கேன்',te:'అందరికీ కాల్ ముగించండి|లాగిన్ QR స్కాన్'
  };
  [out.end,out.scan]=(emergency[code] || emergency.en).split('|');
  out.qrGuide='Press Scan login QR to connect YOUR account directly here. Scan with Telegram Settings → Devices → Link Desktop Device, showing the QR on another screen. If Telegram requires 2FA, reply with your password only to the active private password question. No website or user VPS access is needed. OTP/login codes are not requested. Password replies are processed transiently and deletion is attempted; Telegram copies may remain. This VPS operator can access your password/session. Your account ID and current admin/Manage Call rights are checked automatically. Cancel: /cancelvoice. Disconnect: /disconnectvoice. Keep 2FA enabled; call/network protection remains unproven.';
  out.endConfirm='End the active call for EVERYONE? All speakers and listeners will be disconnected. This is a disruptive manual containment action, not a confirmed crash fix. Start a new call manually if needed. The confirmation expires in 60 seconds and applies only to this call.';
  out.ended='Telegram acknowledged ending that call for everyone. No automatic replacement call was created; this does not establish packet-attack recovery.';
  const extra = (voiceLabels[code] || voiceLabels.en).split('|');
  Object.assign(out, Object.fromEntries(['shield','guard','rotate','connect','protect','admit'].map((key,i)=>[key,extra[i]])));
  out.protect=({en:'Mute new arrivals',bn:'নতুনদের muted entry করুন',zh:'新加入者静音',hi:'नए प्रतिभागियों को म्यूट रखें',es:'Silenciar nuevas entradas',ar:'كتم المنضمين الجدد',fr:'Couper le micro des arrivants',pt:'Silenciar novas entradas',id:'Bisukan peserta baru',ur:'نئے آنے والوں کو خاموش کریں',ru:'Вход новых участников без микрофона',ko:'새 참가자 음소거',ja:'新規参加者をミュート',de:'Neue Teilnehmer stumm schalten',tr:'Yeni katılımcıları sessize al',it:'Silenzia nuovi ingressi',fa:'بی‌صدا کردن تازه‌واردان',vi:'Tắt mic người mới vào',ta:'புதியவர்களை மௌனமாகச் சேர்',te:'కొత్తవారి మైక్ మ్యూట్ చేయండి'})[code] || 'Mute new arrivals';
  out.voiceGuide = 'Connect a consenting USER admin account on the operator VPS: bash scripts/voice-setup.sh. API credentials: https://my.telegram.org/apps. Never send OTP, 2FA password or session to this bot. Grant that account Manage Video Chats/Live Streams and allowlist this community ID. Restart the service, then enable Voice controls and Raid shield here. Guard each call applies join-muted in Enforce mode; it is not a join ban. Setup: https://github.com/thecmjhb/Sentinel-VC/blob/main/docs/VC_SETUP.md';
  out.protectConfirm = 'Apply muted speaking admission? New participants will join muted; current speakers are not muted. If already enabled, this adds no new protection. If Rotate speaking links is ON, old speaking-invite links will be invalidated. This does not close the call or prove UDP filtering.';
  out.admitConfirm = 'Allow newcomers to speak by default? Turn off Guard each call first. This does not unmute already restricted speakers or restore invalidated links. Raid shield can protect admission again on a new burst.';
  if (code === 'bn') Object.assign(out, {
    qrGuide:'Login QR scan করুন থেকে নিজের account যুক্ত করুন। QR অন্য screen-এ দেখিয়ে Telegram → Settings → Devices → Link Desktop Device দিয়ে scan করুন। 2FA থাকলে bot-এর নির্দিষ্ট private password প্রশ্নে Reply দিন। Website বা user-এর VPS access লাগে না। OTP/login code চাওয়া হয় না। Password transientভাবে ব্যবহার হয়; message মুছতে চেষ্টা করা হয়, তবে Telegram কপি থেকে যেতে পারে। VPS operator password/session access পেতে পারে। Bot account ID ও বর্তমান admin/Manage Call permission মিলিয়ে যাচাই করবে। বাতিল: /cancelvoice। বিচ্ছিন্ন: /disconnectvoice। 2FA বন্ধ করবেন না; account যুক্ত হলেই network attack বন্ধ হয় না।',
    endConfirm:'সবার জন্য চলমান call শেষ করবেন? সব speaker ও listener disconnect হবে। এটি জরুরি manual ব্যবস্থা; crash ঠিক হওয়ার প্রমাণ নয়। প্রয়োজন হলে পরে নিজে নতুন call খুলবেন। Confirmation ৬০ সেকেন্ড চলে এবং শুধু এই call-এর জন্য।',
    ended:'Telegram সবার জন্য ওই call শেষ করার acknowledgement দিয়েছে। নতুন call নিজে খুলতে হবে; packet attack থেকে recovery প্রমাণ হয়নি।',
    empty: 'এই পাতায় যাচাইকৃত community নেই। নিচ থেকে বাছুন।',
    idHint: 'Public/private দুটোই: selector ব্যবহার করুন, অথবা /community -1001234567890 এর মতো numeric ID দিন। Public username-ও চলে।',
    choose: 'যেখানে আপনি ও bot দুজনেই admin, সেই group/channel বাছুন। Private হলে username লাগে না। সাধারণ group হলে আগে supergroup করুন।',
    disabled: 'Protection বন্ধ হয়েছে। আগের chat restriction সময়মতো শেষ হবে; live-call mute admin-কে খুলতে হবে।',
    restrict: 'আগে bot-কে Restrict Members permission দিন।', capacity: 'Community সীমা পূর্ণ; operator-কে জানান।',
    setupFirst: 'আগে সেটআপ করুন।', noGate: 'Broadcast channel-এর subscriber CAPTCHA নেই।',
    adapter: 'Voice-এর জন্য optional MTProto adapter ও operator allowlist লাগবে।', noIncidents: 'সাম্প্রতিক ঘটনা নেই।',
    notSetup: 'সেটআপ হয়নি', status: 'Protection', recovery: 'Chat verification: private-এ /verify। Live-call mute admin review করে খুলবে। Bot প্রথমে নিজে থেকে inbox খুলতে পারে না।',
    confirm: 'এই community-র protection বন্ধ করবেন? আগের chat restriction নিজের সময়সীমায় শেষ হবে।',
    error: 'কাজটি হয়নি। ID এবং আপনার ও bot-এর বর্তমান admin permission পরীক্ষা করে কয়েক সেকেন্ড পরে চেষ্টা করুন।'
  });
  if (code === 'bn') Object.assign(out, {
    voiceGuide: 'নিজের VPS terminal-এ consenting USER admin account যুক্ত করো: bash scripts/voice-setup.sh। API ID/hash: https://my.telegram.org/apps। OTP, 2FA password বা session এই bot-এ পাঠাবে না। ওই user account-কে Manage Video Chats/Live Streams দাও এবং এই community ID allowlist করো। Service restart-এর পরে ভয়েস নিয়ন্ত্রণ ও join-burst প্রতিরক্ষা চালু করো। Enforce mode-এ প্রতি কলে আগাম মিউট নতুনদের muted অবস্থায় যোগ দেবে; join করা বন্ধ করবে না। Guide: https://github.com/thecmjhb/Sentinel-VC/blob/main/docs/VC_SETUP.md',
    protectConfirm: 'নতুনদের muted speaking admission করবে? বর্তমান speakers মিউট হবে না। আগে থেকেই muted entry চালু থাকলে এতে নতুন সুরক্ষা যোগ হবে না। Speaking link বদলান ON থাকলে পুরোনো speaking-invite links বাতিল হবে। এটি call বন্ধ বা UDP filtering নয়।',
    admitConfirm: 'নতুনদের default speaking admission খুলবে? আগে প্রতি কলে আগাম মিউট OFF করো। আগে মিউট হওয়া speakers বা বাতিল links ফিরবে না। নতুন burst হলে shield আবার admission সুরক্ষা করতে পারে।'
  });
  return Object.freeze(out);
}
