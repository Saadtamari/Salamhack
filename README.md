# مصرف (Masraf) — المستشار المالي الذكي للمستقلين العرب

> **SalamHack 2026** · Track 2: Financial Tools for Freelancers & Small Businesses

---

## المشكلة

أكثر من **٥٩ مليون مستقل عربي** بدون أدوات مالية تفهم لغتهم أو تحترم مبادئهم المالية الإسلامية. كل أداة موجودة إما إنجليزية، أو لا تعرف معنى الزكاة، أو لا تفقه الفرق بين الفائدة والمرابحة.

## الحل

**مصرف** هو أول مساعد مالي صوتي ذكي مبني من الصفر للمستقل العربي. المستخدم يتحدث بالعربي — مصرف يفهم، يتصرف، ويرد بصوت سعودي طبيعي. كل شيء من الفواتير إلى الزكاة، بالعربي وبمبادئ التمويل الإسلامي.

---

## الميزات الرئيسية

| الميزة | الوصف |
|--------|-------|
| 🎤 **مساعد صوتي Jarvis** | تحدث بالعربي — يتصرف التطبيق ويرد بصوت سعودي في أقل من ثانية |
| 🧾 **فواتير ذكية** | إنشاء فواتير مرابحة ثنائية اللغة بأمر صوتي واحد |
| 👥 **تسجيل مخاطر العملاء** | الذكاء الاصطناعي يحسب درجة خطورة كل عميل من سجل المدفوعات |
| 💸 **تنبؤ التدفق النقدي** | "ستنفد الأموال خلال ١٢ يوماً إن لم يدفع أحمد" |
| 📎 **محلل العقود** | ارفع PDF — الذكاء الاصطناعي يقرأ ويحدد البنود الخطرة بالعربي |
| 🧮 **حاسبة الزكاة** | حساب تلقائي من الدخل مع تتبع النصاب وسجل التطهير |
| 💬 **متابع المدفوعات** | رسائل تحصيل عربية مناسبة ثقافياً — لطيف أو حازم |
| 📊 **تقارير شهرية** | ملخص مالي بالذكاء الاصطناعي يُقرأ بصوت |

---

## المكدس التقني

### الواجهة الأمامية
| المكوّن | التقنية |
|---------|---------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + RTL utilities |
| State | Zustand |
| Charts | Recharts |
| Font | IBM Plex Sans Arabic |

### الواجهة الخلفية وقاعدة البيانات
| المكوّن | التقنية |
|---------|---------|
| API | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage (4 buckets) |
| PDF Generation | jsPDF + jspdf-autotable |
| Validation | Zod |

### خدمات الذكاء الاصطناعي
| الخدمة | المزوّد | النموذج |
|---------|---------|--------|
| نموذج اللغة (الدماغ) | Cerebras | `qwen-3-235b-a22b-instruct-2507` |
| تحويل الصوت إلى نص | Groq Cloud | `whisper-large-v3-turbo` |
| تحويل النص إلى صوت | Groq Cloud | `canopylabs/orpheus-arabic-saudi` |
| صوت ذكوري | Groq Orpheus | `abdullahai` |
| صوت أنثوي | Groq Orpheus | `sha` |

---

---

## قاعدة البيانات — Supabase

### الجداول (١٢ جدولاً)
- `users` — المستخدمون (اسم، عملة، نوع النشاط، الصوت المفضل)
- `clients` — العملاء (درجة الخطورة، متوسط الدفع، الفواتير)
- `invoices` — الفواتير (شروط المرابحة، حالة الدفع، مسار PDF)
- `invoice_items` — بنود الفاتورة
- `transactions` — المعاملات (من Open Banking المحاكى)
- `contracts` — العقود (ملف PDF، نتائج التحليل)
- `contract_flags` — تنبيهات العقود (حرج / تحذير)
- `zakat_records` — سجلات الزكاة
- `purification_records` — سجلات التطهير
- `voice_logs` — سجلات الأوامر الصوتية
- `reports` — التقارير الشهرية

### Storage Buckets (Supabase)
```
invoices/    ← PDFs الفواتير  {user_id}/INV-*.pdf
contracts/   ← العقود         {user_id}/originals/
receipts/    ← الإيصالات      {user_id}/receipt-*.jpg
reports/     ← التقارير       {user_id}/report-*.pdf
```

---

## API Endpoints

### Voice Pipeline (Jarvis)
```
POST /api/voice/stt      — Audio → Arabic text (Groq Whisper)
POST /api/voice/tts      — Text → Saudi Arabic audio (Groq Orpheus)
POST /api/voice/process  — Full pipeline: STT → LLM → Action → TTS + UI Command
```

### AI Modules (Cerebras Qwen3-235B)
```
POST /api/ai/chat         — General financial Q&A
POST /api/ai/invoice      — AI invoice generation (Sharia terms)
POST /api/ai/contract     — PDF contract analysis
POST /api/ai/cashflow     — Cash flow prediction
POST /api/ai/chaser       — Payment chaser message generation
POST /api/ai/zakat        — Zakat calculation
```

### CRUD
```
GET/POST       /api/invoices
GET/PATCH      /api/invoices/[id]
POST           /api/invoices/pdf
GET/POST       /api/clients
GET/PATCH      /api/clients/[id]
GET            /api/transactions
POST/GET       /api/contracts
GET            /api/reports
```

---

## الإعداد المحلي

### المتطلبات
- Node.js 20+
- حساب Supabase
- مفتاح Cerebras API
- مفتاح Groq API

### خطوات التثبيت

```bash
git clone https://github.com/your-team/masraf
cd masraf
npm install
cp .env.local.example .env.local
```

### متغيرات البيئة (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Cerebras (LLM — qwen-3-235b-a22b-instruct-2507)
CEREBRAS_API_KEY=cbs_xxxxx
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1

# Groq (STT: whisper-large-v3-turbo | TTS: orpheus-arabic-saudi)
GROQ_API_KEY=gsk_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### تشغيل قاعدة البيانات
```bash
npx supabase db push
npm run seed          # بيانات تجريبية
```

### تشغيل التطبيق
```bash
npm run dev           # http://localhost:3000
```

---

## النموذج الأولي (Prototype)

النموذج الأولي للهاكاثون مبني بـ React + Babel بدون build step لسرعة التطوير:

| الملف | الدور |
|-------|-------|
| `Masraf.html` | المحمول — إطار iOS داخل المتصفح |
| `Masraf_Desktop.html` | سطح المكتب — sidebar + main area |
| `masraf-data.js` | بيانات تجريبية شاملة |
| `masraf-screens.jsx` | ٧ شاشات موبايل |
| `masraf-desktop-screens.jsx` | ٧ شاشات ديسكتوب |
| `masraf-shared.jsx` | مكونات مشتركة (فواتير، تطهير، صوت) |
| `masraf-voice.jsx` | واجهة المساعد الصوتي |
| `ios-frame.jsx` | إطار iOS 26 Liquid Glass |

---

## الهوية البصرية

- **الخط:** IBM Plex Sans Arabic — نظيف، حديث، Apple-مستوحى
- **اللون الأساسي:** `#1B5E20` — أخضر إسلامي عميق
- **لون الذهب:** `#C6930A` — فاخر، للزكاة والعناصر المميزة
- **لون الصوت:** `#7B1FA2` — بنفسجي تقني للذكاء الاصطناعي
- **الخلفية:** `#FAFAF8` — أبيض دافئ مستوحى من ثمانية
- **النمط الإسلامي:** هندسة عربية خفيفة (٤-٧٪) على رؤوس الصفحات
- **الاتجاه:** RTL كامل (`dir="rtl"` على الجذر)

---

## المصطلحات المالية الإسلامية

| المصطلح | الاستخدام |
|---------|-----------|
| ربح (لا فائدة) | جميع العوائد = مشاركة في الأرباح |
| مرابحة | شروط دفع الفواتير |
| زكاة | ٢.٥٪ من المال فوق النصاب |
| نصاب | الحد الأدنى (~٥٢٠٠ دولار) |
| تطهير | تنقية الدخل غير الملتزم |
| حلال/حرام | تصنيف المعاملات |

---

## الفريق

| الاسم | الدور |
|-------|-------|
| [Full-Stack Dev 1] | UI/UX + Frontend Lead |
| [Full-Stack Dev 2] | Backend + Voice Pipeline |
| [AI Specialist 1] | Conversational AI + Intent Classifier |
| [AI Specialist 2] | Document AI + Invoice Generator |

---

## SalamHack 2026

- **المسار:** المسار الثاني — أدوات مالية للمستقلين والشركات الصغيرة
- **الموقع:** [salamhack.com](https://salamhack.com)
- **المنظم:** طارق العوزة

---

*بُني بمحبة للمستقل العربي — مصرف · Masraf*