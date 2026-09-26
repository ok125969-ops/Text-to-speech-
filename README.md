# वाणी 100K - Hindi Text to Speech Studio (Web & Android APK)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF.svg)](https://capacitorjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google%20Gen%20AI-Gemini%20TTS-FF6F00.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)

विशाल हिंदी पाठ (1 से लेकर **100,000+ शब्द एक साथ**) को स्वाभाविक, उच्च गुणवत्ता वाली **प्रौढ़ पुरुष (Adult Male)** और **वयस्क महिला (Adult Female)** आवाजों में परिवर्तित करने वाला आधुनिक वेब एवं एंड्रॉइड ऐप।

---

## 🌟 मुख्य विशेषताएँ (Key Features)

### 1. 100,000 शब्दों की विशाल एकल बैच क्षमता (100K Words Processing)
- **स्मार्ट चंकिंग व पाइपलाइन**: 100,000 शब्दों के विशाल पाठ (उपन्यास, ग्रंथ, कथा, शोध पत्र) को सुसंगत अध्यायों (200-400 शब्द प्रति भाग) में विभाजित करता है।
- **निरंतर ऑटो-प्ले (Seamless Autoplay)**: एक अध्याय समाप्त होते ही अगला अध्याय बिना किसी विराम के स्वतः शुरू हो जाता है।
- **लुकअहेड प्री-बफ़रिंग**: जब वर्तमान भाग बज रहा होता है, अगला भाग बैकग्राउंड में पहले से लोड हो जाता है।
- **मास्टर WAV निर्यात (Single Master Audio)**: पूरे 100,000 शब्दों के सभी ऑडियो भागों को एक साथ जोड़कर एकल `.wav` फ़ाइल के रूप में डाउनलोड करने की सुविधा।

### 2. स्वाभाविक प्रौढ़ आवाजें (High-Quality Adult Voices)
- 🧔 **फेनरिर (Fenrir - गंभीर प्रौढ़ पुरुष / Deep Adult Baritone)**:
  - शुद्ध देवनागरी ध्वनिविज्ञान, गंभीर ठहराव और भारी, गरिमामय पुरुष स्वर।
  - उपन्यासों, इतिहास, धार्मिक प्रवचन और गंभीर व्याख्यानों के लिए सर्वश्रेष्ठ।
- 👩 **कोरे (Kore - परिपक्व वयस्क महिला / Warm Adult Female)**:
  - कोमल, स्वाभाविक और भावनात्मक महिला स्वर।
  - साहित्य, कथा-वाचन, काव्य और पारिवारिक कहानियों के लिए आदर्श।
- 👥 **युगल वाचन (Dual Adult Male + Female Duet)**:
  - प्रौढ़ पुरुष और परिपक्व महिला दोनों आवाज़ों का संयुक्त वाचन (संवाद एवं अध्यायों हेतु)।
- 🎙️ **कैरोन (Charon - विद्वान पुरुष)**, 📰 **ज़ेफ़िर (Zephyr - समाचार एंकर)**, ⚡ **पक (Puck - युवा पुरुष)**, 🌸 **आयिडी (Aoede - काव्यात्मक महिला)**।

### 3. दोहरा इंजन (Dual Engine Architecture)
- **Studio AI (Gemini Flash Neural TTS)**: अल्ट्रा-रियलिस्टिक स्टूडियो क्वालिटी आवाज़।
- **Instant Web Speech API**: ऑफ़लाइन व त्वरित स्थानीय प्लेबैक विकल्प (बिना किसी कोटा या इंटरनेट सीमा के)।

### 4. सजीव वाचन मंच (Synchronized Karaoke Reader)
- बोलते समय सक्रिय वाक्य और पैराग्राफ़ का ऑटो-स्क्रॉल व हाइलाइटिंग।
- फ़ॉन्ट आकार समायोजन (Zoom In / Out)।
- किसी भी पैराग्राफ़ पर क्लिक करके तुरंत वहीं से सुनने की सुविधा।

---

## 📱 एंड्रॉइड APK निर्माण व डाउनलोड (Android APK & CI/CD)

इस प्रोजेक्ट में **Capacitor Android** और **GitHub Actions** का पूर्ण ऑटोमेशन कॉन्फ़िगर किया गया है।

### GitHub Actions से स्वचालित APK डाउनलोड करें
1. इस रिपॉजिटरी को अपने GitHub अकाउंट पर पुश करें (`git push origin main`)।
2. GitHub पर **Actions** टैब में जाएँ।
3. **Build Android APK (वाणी 100K Hindi TTS)** वर्कफ़्लो स्वतः निष्पादित होगा।
4. पूर्ण होने पर **Artifacts** सेक्शन से **`Vani-100K-Hindi-TTS-APK`** ज़िप डाउनलोड करें, जिसमें रेडी-टू-इंस्टॉल **`.apk`** फ़ाइल उपलब्ध होगी।

### स्थानीय मशीन पर APK बिल्ड करने की विधि (Local APK Build)
आवश्यकताएँ: **Node.js 18+** और **Java JDK 17+** / **Android SDK**.

```bash
# 1. वेब प्रोजेक्ट बिल्ड और Capacitor सिंक करें
npm run cap:sync

# 2. Debug APK तैयार करें
npm run build:apk

# APK फ़ाइल यहाँ मिलेगी:
# android/app/build/outputs/apk/debug/app-debug.apk
```

Android Studio में खोलने के लिए:
```bash
npm run cap:open
```

---

## 📁 फ़ोल्डर संरचना (Folder Structure)

```text
├── .github/
│   └── workflows/
│       └── build-apk.yml       # GitHub Actions स्वचालित APK निर्माण वर्कफ़्लो
├── android/                    # पूर्ण नेटिव Android Capacitor प्रोजेक्ट (Gradle)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/vani100k/hinditts/MainActivity.java
│   └── build.gradle
├── src/
│   ├── components/             # React UI घटक
│   │   ├── Header.tsx          # लोगो, स्टेटस एवं इंजन टॉगल
│   │   ├── VoiceSelector.tsx   # पुरुष, महिला एवं प्रौढ़ आवाज़ चयनकर्ता
│   │   ├── TextInputPanel.tsx  # 100K शब्द इनपुट, प्रोग्रेस बार व फ़ाइल अपलोडर
│   │   ├── ReadingView.tsx     # सिन्क्रोनाइज़्ड कराओके रीडर
│   │   ├── ChunkNavigator.tsx  # अध्याय व भाग सूची
│   │   ├── StickyAudioPlayer.tsx # ग्लोबल डॉक्ड ऑडियो प्लेयर
│   │   └── BatchExportModal.tsx # 100K एकल बैच मास्टर WAV निर्यात
│   ├── data/
│   │   ├── sampleTexts.ts      # प्रेमचंद 'ईदगाह', गीता सार व 100K शब्द जनरेटर
│   │   └── voices.ts           # हिंदी आवाजों की विस्तृत प्रोफ़ाइल
│   ├── services/
│   │   └── ttsService.ts       # Gemini TTS एवं Web Speech API सेवा
│   ├── types/
│   │   └── tts.ts              # TypeScript प्रकार व इंटरफेस
│   ├── utils/
│   │   ├── textChunker.ts      # 100,000 शब्दों का ऑटो-चंकिंग व सांख्यिकी इंजन
│   │   └── wavHelper.ts        # WAV कंकैटिनेशन (Stitching) व डाउनलोडर
│   ├── App.tsx                 # मुख्य एप्लिकेशन कंपोनेंट
│   ├── index.css               # Tailwind CSS व कस्टम शैलियाँ
│   └── main.tsx                # React DOM एंट्री पॉइंट
├── capacitor.config.json       # Capacitor मोबाइल कॉन्फ़िगरेशन
├── index.html                  # HTML एंट्री पॉइंट (देवनागरी फ़ॉन्ट सपोर्ट के साथ)
├── metadata.json               # Google AI Studio मेटाडेटा
├── package.json                # निर्भरताएँ एवं स्क्रिप्ट्स
├── server.ts                   # Express बैकएंड (Gemini TTS API प्रॉक्सी)
├── tsconfig.json               # TypeScript कॉन्फ़िगरेशन
└── vite.config.ts              # Vite बंडलर कॉन्फ़िगरेशन
```

---

## 🚀 स्थानीय विकास (Local Development)

### 1. क्लोन एवं निर्भरताएँ इंस्टॉल करें
```bash
git clone <your-repo-url>
cd vani-100k-hindi-tts
npm install
```

### 2. पर्यावरण चर सेट करें (.env)
`.env.example` को कॉपी करके `.env` बनाएँ:
```bash
cp .env.example .env
```
`.env` में अपनी Google Gemini API कुंजी जोड़ें:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3000
```

### 3. विकास सर्वर चलाएँ
```bash
npm run dev
```
ब्राउज़र में `http://localhost:3000` खोलें।

---

## 📜 उपलब्ध स्क्रिप्ट्स (Available Scripts)

| स्क्रिप्ट | विवरण |
| :--- | :--- |
| `npm run dev` | फुल-स्टैक डेवलपमेंट सर्वर (Express + Vite) चलाता है। |
| `npm run build` | उत्पादन हेतु वेब एसेट बंडल तैयार करता है। |
| `npm run start` | प्रोडक्शन मोड में सर्वर चलाता है। |
| `npm run lint` | TypeScript कंपाइलर से सिंटेक्स और टाइप त्रुटियों की जांच करता है। |
| `npm run cap:sync` | वेब बिल्ड को Android नेटिव प्रोजेक्ट में सिंक करता है। |
| `npm run cap:open` | प्रोजेक्ट को Android Studio में खोलता है। |
| `npm run build:apk` | स्थानीय रूप से Debug Android APK का निर्माण करता है। |

---

## 📄 लाइसेंस (License)

यह प्रोजेक्ट [Apache License 2.0](LICENSE) के अंतर्गत उपलब्ध है।
