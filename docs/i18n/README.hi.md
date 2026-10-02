<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — हिन्दी

[English](../../README.md) · [中文](../../docs/i18n/README.zh-CN.md) · [हिन्दी](../../docs/i18n/README.hi.md) · [Español](../../docs/i18n/README.es.md) · [العربية](../../docs/i18n/README.ar.md)

[Français](../../docs/i18n/README.fr.md) · [বাংলা](../../README.bn.md) · [Português](../../docs/i18n/README.pt.md) · [Bahasa Indonesia](../../docs/i18n/README.id.md) · [اردو](../../docs/i18n/README.ur.md)

Sentinel-VC Telegram supergroup के लिए खुला स्रोत moderation bot है। यह उपलब्ध join/leave घटनाओं और तेज संदेश गतिविधि को देखता है। वैकल्पिक user-admin adapter से voice-call की उपलब्ध participant घटनाएँ और अनुमति-आधारित mute जोड़ा जा सकता है। लेखक: **C. M. Jubayer Hossain Bappy**।

## तैयार bot का उपयोग

मालिक द्वारा सेवा चालू करने के बाद [@sentinelvcbot](https://t.me/sentinelvcbot) अपने supergroup में जोड़ें। उसे admin बनाकर **Restrict Members** अनुमति दें। अपने व्यक्तिगत admin खाते से `/setup`, कुछ सेकंड बाद `/doctor`, फिर `/status` भेजें। पहले observe mode में व्यवहार देखें; तैयार होने पर `/mode enforce` चलाएँ। `/gate on` नए सदस्यों के लिए अस्थायी chat restriction और गणित का प्रश्न सक्षम करता है।

## अपने VPS पर

Ubuntu VPS में [Docker और Compose](https://docs.docker.com/engine/install/ubuntu/) स्थापित करें। GitHub पर repository प्रकाशित होने के बाद:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

सेटअप में VPS का health-check पोर्ट चुनें; नए इंस्टॉलेशन का डिफ़ॉल्ट **18765** है। दिखाया गया पोर्ट रखने के लिए Enter दबाएँ। बाद में `bash scripts/setup.sh --port 19234` चलाकर बदलें; बाकी `.env` सेटिंग सुरक्षित रहेंगी। npm के लिए `.env` में `HTTP_PORT` सेट करें।

Helper token छिपाकर पूछता है और मौजूदा `.env` को नहीं बदलता। Token chat, screenshot या GitHub पर साझा न करें। स्थिति जाँचें:

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

Docker के बिना Node.js 24 LTS में `.env.example` को `.env` में कॉपी करें, `BOT_TOKEN` भरें, फिर `npm ci --ignore-scripts` और `npm start` चलाएँ। Reboot के बाद सेवा चलाने के निर्देश [यहाँ](../SELF_HOSTING.md) हैं।

## उपयोगी कमांड और सीमाएँ

`/incidents` admin को इसी group के हाल के रिकॉर्ड दिखाता है। `/mode observe` नए moderation actions रोकता है। Restricted सदस्य bot के private chat में `/verify` के बाद challenge में दिया group ID लिख सकते हैं। तीन गलत उत्तरों के बाद expiry तक प्रतीक्षा करें। Flood restriction के पहले मिनट में सत्यापन से छूट नहीं मिलती।

सामान्य bot raw UDP, वास्तविक account creation date या live-call participant feed नहीं देखता। Voice note restriction और live-call mute अलग हैं। [Optional VC guide](../VC_SETUP.md) के लिए अलग सहमत user-admin account और allowlist चाहिए; call actions को admin स्वयं वापस बदलता है।

## समुदाय और लाइसेंस

[Updates channel](https://t.me/sentinelvc) में शामिल होना वैकल्पिक है। मदद के लिए [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues) देखें। Code MIT है; [license](../../LICENSE) और attribution बनाए रखें।
