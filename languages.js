import { dashboardLocale } from './dashboardLocales.js';
const rows = [
  [
    "en",
    "English",
    "User guide|Language|Add to group|Updates|Source code"
  ],
  [
    "bn",
    "বাংলা",
    "ব্যবহারের গাইড|ভাষা|গ্রুপে যোগ করুন|আপডেট|সোর্স কোড"
  ],
  [
    "zh",
    "中文",
    "使用指南|语言|添加到群组|更新|源代码"
  ],
  [
    "hi",
    "हिन्दी",
    "उपयोग गाइड|भाषा|ग्रुप में जोड़ें|अपडेट|सोर्स कोड"
  ],
  [
    "es",
    "Español",
    "Guía de uso|Idioma|Añadir al grupo|Novedades|Código fuente"
  ],
  [
    "ar",
    "العربية",
    "دليل الاستخدام|اللغة|إضافة إلى مجموعة|التحديثات|الكود المصدري"
  ],
  [
    "fr",
    "Français",
    "Guide utilisateur|Langue|Ajouter au groupe|Actualités|Code source"
  ],
  [
    "pt",
    "Português",
    "Guia de uso|Idioma|Adicionar ao grupo|Atualizações|Código-fonte"
  ],
  [
    "id",
    "Bahasa Indonesia",
    "Panduan pengguna|Bahasa|Tambahkan ke grup|Pembaruan|Kode sumber"
  ],
  [
    "ur",
    "اردو",
    "استعمال کی رہنمائی|زبان|گروپ میں شامل کریں|اپ ڈیٹس|سورس کوڈ"
  ],
  [
    "ru",
    "Русский",
    "Инструкция|Язык|Добавить в группу|Обновления|Исходный код"
  ],
  [
    "ko",
    "한국어",
    "사용 가이드|언어|그룹에 추가|업데이트|소스 코드"
  ],
  [
    "ja",
    "日本語",
    "使い方|言語|グループに追加|更新情報|ソースコード"
  ],
  [
    "de",
    "Deutsch",
    "Anleitung|Sprache|Zur Gruppe hinzufügen|Neuigkeiten|Quellcode"
  ],
  [
    "tr",
    "Türkçe",
    "Kullanım kılavuzu|Dil|Gruba ekle|Güncellemeler|Kaynak kodu"
  ],
  [
    "it",
    "Italiano",
    "Guida all’uso|Lingua|Aggiungi al gruppo|Aggiornamenti|Codice sorgente"
  ],
  [
    "fa",
    "فارسی",
    "راهنمای استفاده|زبان|افزودن به گروه|تازه‌ها|کد منبع"
  ],
  [
    "vi",
    "Tiếng Việt",
    "Hướng dẫn sử dụng|Ngôn ngữ|Thêm vào nhóm|Cập nhật|Mã nguồn"
  ],
  [
    "ta",
    "தமிழ்",
    "பயனர் வழிகாட்டி|மொழி|குழுவில் சேர்க்கவும்|புதுப்பிப்புகள்|மூலக் குறியீடு"
  ],
  [
    "te",
    "తెలుగు",
    "వినియోగ మార్గదర్శి|భాష|గ్రూప్‌కు జోడించండి|నవీకరణలు|సోర్స్ కోడ్"
  ]
];
export const LANGUAGES = Object.freeze(Object.fromEntries(rows.map(([code,name,labels]) => {
 const [help,language,add,updates,source] = labels.split('|');
 const dashboard = dashboardLocale(code);
 return [code, Object.freeze({code,name,help,language,add,updates,source,channel: dashboard.channel,channelGuide: dashboard.intro, guide: dashboard.intro,dashboard})];
})));
export function languageCode(value) {
 const code = String(value || '').toLowerCase().split(/[-_]/)[0];
 return Object.hasOwn(LANGUAGES,code) ? code : 'en';
}
export function languageKeyboard() {
 const buttons = Object.values(LANGUAGES).map(({code,name}) => ({text:name,callback_data:'ui:lang:'+code}));
 return {inline_keyboard:Array.from({length:Math.ceil(buttons.length/2)},(_,i)=>buttons.slice(i*2,i*2+2))};
}
