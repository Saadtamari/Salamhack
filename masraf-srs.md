# مصرف (Masraf) — Software Requirements Specification

**Version:** 1.0  
**Date:** April 27, 2026  
**Hackathon:** SalamHack 2026 — Track 2: Financial Tools for Freelancers & Small Businesses  
**Team Size:** 4 (2 Full-Stack, 2 AI Specialists)

---

## 1. Project Overview

### 1.1 Product Name
**مصرف (Masraf)** — Arabic for "bank/financial institution"

### 1.2 Tagline
المستشار المالي الذكي للمستقلين العرب — The AI Financial Co-Pilot for Arab Freelancers

### 1.3 Problem Statement
59M+ Arab freelancers and small business owners are invisible to traditional banking systems. They lack Arabic-first financial tools that understand Islamic finance principles, speak their language (literally), and help them manage invoices, cash flow, clients, and Zakat obligations in one place.

### 1.4 Solution
Masraf is a voice-first, AI-powered financial co-pilot that lets Arab freelancers manage their entire financial life through Arabic voice commands or traditional UI. It features AI invoice generation, cash flow prediction, client risk scoring, contract analysis, Zakat calculation, and expense tracking — all Sharia-compliant and Arabic-native.

### 1.5 Core Innovation
- **Jarvis-style voice interaction:** User speaks Arabic → app responds in Saudi Arabic voice AND controls the UI simultaneously
- **Sharia-native architecture:** Islamic finance terms built into every layer, not bolted on
- **Arabic-first UX:** RTL layout, Arabic typography, culturally-appropriate AI responses

---

## 2. Tech Stack

### 2.1 Frontend
| Component | Technology | Details |
|-----------|-----------|---------|
| Framework | Next.js 14 (App Router) | TypeScript, RSC support |
| Language | TypeScript (strict mode) | All files `.ts` / `.tsx` |
| Styling | Tailwind CSS v3.4+ | RTL utilities via `tailwindcss-rtl` |
| State Management | Zustand | Lightweight, shared between voice and UI |
| Audio Recording | MediaRecorder Web API | Browser-native audio capture |
| Audio Playback | Web Audio API | Streaming audio playback for TTS responses |
| Charts | Recharts | Arabic-compatible charting |
| PDF Viewer | react-pdf | For contract viewing |
| Icons | Lucide React | Clean, consistent iconography |
| Font (Arabic) | IBM Plex Sans Arabic / Noto Sans Arabic | Clean, modern, Apple-like feel + Thmanyah-inspired |
| Font (English) | SF Pro Display (system) / Geist Sans | Apple-native pairing |

### 2.2 Backend
| Component | Technology | Details |
|-----------|-----------|---------|
| Runtime | Node.js 20+ | TypeScript |
| API Framework | Next.js API Routes (App Router) | `/app/api/**/route.ts` |
| Database | Supabase (PostgreSQL) | Hosted, real-time, auth, storage |
| File Storage | Supabase Storage | PDF invoices, contracts, receipts |
| PDF Generation | jsPDF + jspdf-autotable | Bilingual Arabic/English invoices |
| Validation | Zod | Runtime type validation |

### 2.3 AI / ML Services
| Service | Provider | Model | Purpose |
|---------|----------|-------|---------|
| LLM (Brain) | Cerebras | `qwen-3-235b-a22b-instruct-2507` | Intent classification, response generation, invoice AI, contract analysis, financial advice |
| STT (Speech to Text) | Groq Cloud | `whisper-large-v3-turbo` | Arabic speech transcription |
| TTS (Text to Speech) | Groq Cloud | `canopylabs/orpheus-arabic-saudi` | Saudi Arabic voice responses |
| TTS Male Voice | Groq Cloud | `abdullah` | Default male persona |
| TTS Female Voice | Groq Cloud | `sha` | Alternative female persona |

### 2.4 API Configuration
```
# Cerebras
CEREBRAS_API_KEY=cbs_xxxxx
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
CEREBRAS_MODEL=qwen-3-235b-a22b-instruct-2507

# Groq Cloud
GROQ_API_KEY=gsk_xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

### 2.5 Cerebras API Details
- **Endpoint:** `https://api.cerebras.ai/v1/chat/completions`
- **Compatibility:** OpenAI-compatible API (use OpenAI SDK with custom base URL)
- **Speed:** ~1,400 tokens/sec (fastest frontier model available)
- **Pricing:** $0.60/M input tokens, $1.20/M output tokens
- **Context:** 131K tokens (paid), 64K (free tier)
- **Free Tier:** 1M tokens/day

---

## 3. Project Structure

```
masraf/
├── .env.local                          # Environment variables
├── next.config.ts                      # Next.js config (i18n, images)
├── tailwind.config.ts                  # Tailwind + RTL + custom theme
├── tsconfig.json                       # TypeScript config
├── package.json
│
├── public/
│   ├── fonts/
│   │   ├── IBMPlexSansArabic-Regular.woff2
│   │   ├── IBMPlexSansArabic-Medium.woff2
│   │   ├── IBMPlexSansArabic-SemiBold.woff2
│   │   └── IBMPlexSansArabic-Bold.woff2
│   ├── icons/
│   │   ├── masraf-logo.svg
│   │   └── mic-active.svg
│   └── mock-data/
│       ├── clients.json                # Mock client data
│       ├── transactions.json           # Mock Open Banking transactions
│       ├── invoices.json               # Sample invoices
│       └── contracts/
│           └── sample-contract.pdf     # Mock freelance contract
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (RTL, fonts, providers)
│   │   ├── page.tsx                    # Redirect to /lawha
│   │   ├── globals.css                 # Global styles + theme variables
│   │   │
│   │   ├── tawtheeq/                  # Page 1: Onboarding (توثيق)
│   │   │   └── page.tsx
│   │   ├── lawha/                     # Page 2: Dashboard (لوحة)
│   │   │   └── page.tsx
│   │   ├── fawateer/                  # Page 3: Invoicing (فواتير)
│   │   │   └── page.tsx
│   │   ├── umala/                     # Page 4: Clients (عملاء)
│   │   │   └── page.tsx
│   │   ├── masareef/                  # Page 5: Expenses (مصاريف)
│   │   │   └── page.tsx
│   │   ├── uqood/                     # Page 6: Contracts (عقود)
│   │   │   └── page.tsx
│   │   ├── zakah/                     # Page 7: Zakat (زكاة)
│   │   │   └── page.tsx
│   │   ├── taqareer/                  # Page 8: Reports (تقارير)
│   │   │   └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── voice/
│   │       │   ├── stt/route.ts       # Speech-to-Text endpoint
│   │       │   ├── tts/route.ts       # Text-to-Speech endpoint
│   │       │   └── process/route.ts   # Voice intent processing pipeline
│   │       ├── ai/
│   │       │   ├── chat/route.ts      # General AI chat endpoint
│   │       │   ├── invoice/route.ts   # AI invoice generation
│   │       │   ├── contract/route.ts  # AI contract analysis
│   │       │   ├── cashflow/route.ts  # Cash flow prediction
│   │       │   ├── chaser/route.ts    # Payment chaser message gen
│   │       │   └── zakat/route.ts     # Zakat calculation
│   │       ├── invoices/
│   │       │   ├── route.ts           # CRUD invoices
│   │       │   ├── [id]/route.ts      # Single invoice ops
│   │       │   └── pdf/route.ts       # PDF generation + upload
│   │       ├── clients/
│   │       │   ├── route.ts           # CRUD clients
│   │       │   └── [id]/route.ts      # Single client + risk score
│   │       ├── transactions/
│   │       │   └── route.ts           # Transaction feed (mock Open Banking)
│   │       ├── contracts/
│   │       │   ├── route.ts           # Upload + list contracts
│   │       │   └── [id]/route.ts      # Single contract + analysis
│   │       ├── expenses/
│   │       │   └── route.ts           # Expense categorization
│   │       └── reports/
│   │           └── route.ts           # Monthly summary generation
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx           # Main layout wrapper (nav + content)
│   │   │   ├── BottomNav.tsx          # Bottom navigation bar
│   │   │   ├── Sidebar.tsx            # Side menu (desktop)
│   │   │   └── PageHeader.tsx         # Page title + back button
│   │   ├── voice/
│   │   │   ├── MicButton.tsx          # Floating mic button (center nav)
│   │   │   ├── VoiceOverlay.tsx       # Listening/processing overlay
│   │   │   ├── VoiceWaveform.tsx      # Audio waveform visualization
│   │   │   └── VoiceProvider.tsx      # Voice context provider
│   │   ├── dashboard/
│   │   │   ├── BalanceCard.tsx        # Current balance display
│   │   │   ├── CashFlowChart.tsx      # Cash flow line chart
│   │   │   ├── PendingAlerts.tsx      # Overdue invoice alerts
│   │   │   └── RecentTransactions.tsx # Transaction feed
│   │   ├── invoices/
│   │   │   ├── InvoiceList.tsx        # Invoice table/cards
│   │   │   ├── InvoiceForm.tsx        # Create invoice form
│   │   │   ├── InvoicePreview.tsx     # Invoice PDF preview
│   │   │   └── InvoiceStatusBadge.tsx # Status pills
│   │   ├── clients/
│   │   │   ├── ClientList.tsx         # Client directory
│   │   │   ├── ClientCard.tsx         # Client detail card
│   │   │   └── RiskScoreBadge.tsx     # AI risk indicator
│   │   ├── expenses/
│   │   │   ├── TransactionFeed.tsx    # Categorized transactions
│   │   │   ├── CategoryChart.tsx      # Spending by category
│   │   │   └── ReceiptScanner.tsx     # Photo upload for receipts
│   │   ├── contracts/
│   │   │   ├── ContractUpload.tsx     # PDF upload component
│   │   │   ├── ContractAnalysis.tsx   # AI analysis results
│   │   │   └── RedFlagCard.tsx        # Flagged clause display
│   │   ├── zakah/
│   │   │   ├── ZakatCalculator.tsx    # Calculation display
│   │   │   ├── NisabTracker.tsx       # Threshold tracker
│   │   │   └── PurificationLedger.tsx # Tatheer records
│   │   └── ui/
│   │       ├── Card.tsx               # Reusable card component
│   │       ├── Badge.tsx              # Status badge
│   │       ├── Button.tsx             # Button variants
│   │       ├── Input.tsx              # Form input (RTL)
│   │       ├── Modal.tsx              # Modal dialog
│   │       ├── Skeleton.tsx           # Loading skeleton
│   │       ├── Toast.tsx              # Notification toast
│   │       └── EmptyState.tsx         # Empty state illustration
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   ├── server.ts              # Server Supabase client
│   │   │   └── storage.ts            # Storage bucket helpers
│   │   ├── ai/
│   │   │   ├── cerebras.ts           # Cerebras API client (OpenAI-compat)
│   │   │   ├── groq.ts               # Groq API client (STT + TTS)
│   │   │   ├── prompts.ts            # All system prompts
│   │   │   └── intent-classifier.ts  # Voice intent classification
│   │   ├── pdf/
│   │   │   ├── invoice-generator.ts  # jsPDF invoice template
│   │   │   └── arabic-font.ts        # Arabic font embedding for PDF
│   │   ├── utils/
│   │   │   ├── format.ts             # Number/currency/date formatting (Arabic)
│   │   │   ├── zakat.ts              # Zakat calculation logic
│   │   │   └── risk-score.ts         # Client risk scoring algorithm
│   │   └── constants/
│   │       ├── islamic-terms.ts      # Islamic finance vocabulary map
│   │       ├── categories.ts         # Expense categories (Arabic)
│   │       └── routes.ts             # Route definitions with Arabic names
│   │
│   ├── hooks/
│   │   ├── useVoice.ts               # Voice recording + playback hook
│   │   ├── useAI.ts                  # AI chat interaction hook
│   │   └── usePageNavigation.ts      # Voice-triggered navigation
│   │
│   ├── store/
│   │   ├── app-store.ts              # Global app state (Zustand)
│   │   ├── voice-store.ts            # Voice state (recording, playing)
│   │   └── user-store.ts             # User profile + preferences
│   │
│   └── types/
│       ├── database.ts               # Supabase generated types
│       ├── api.ts                    # API request/response types
│       ├── invoice.ts                # Invoice types
│       ├── client.ts                 # Client types
│       ├── voice.ts                  # Voice intent/command types
│       └── islamic.ts                # Islamic finance term types
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # Full database schema
│
└── scripts/
    ├── seed-mock-data.ts             # Seed database with mock data
    └── generate-types.ts             # Generate Supabase types
```

---

## 4. Database Schema (Supabase PostgreSQL)

### 4.1 Enum Types

```sql
-- Business types
CREATE TYPE business_type AS ENUM (
  'freelancer',           -- مستقل
  'small_business',       -- شركة صغيرة
  'agency'                -- وكالة
);

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'draft',                -- مسودة
  'sent',                 -- مُرسلة
  'viewed',               -- مُشاهدة
  'paid',                 -- مدفوعة
  'overdue',              -- متأخرة
  'cancelled'             -- ملغاة
);

-- Payment terms (Islamic)
CREATE TYPE payment_terms AS ENUM (
  'immediate',            -- فوري
  'net_7',                -- ٧ أيام
  'net_15',               -- ١٥ يوم
  'net_30',               -- ٣٠ يوم
  'net_60',               -- ٦٠ يوم
  'murabaha',             -- مرابحة
  'musharakah'            -- مشاركة
);

-- Expense category
CREATE TYPE expense_category AS ENUM (
  'food_dining',          -- طعام ومطاعم
  'transport',            -- مواصلات
  'software_tools',       -- برمجيات وأدوات
  'office_supplies',      -- لوازم مكتبية
  'communication',        -- اتصالات
  'marketing',            -- تسويق
  'education',            -- تعليم
  'health',               -- صحة
  'rent',                 -- إيجار
  'utilities',            -- خدمات
  'entertainment',        -- ترفيه
  'other'                 -- أخرى
);

-- Client risk level
CREATE TYPE risk_level AS ENUM (
  'low',                  -- منخفض (أخضر)
  'medium',               -- متوسط (أصفر)
  'high'                  -- مرتفع (أحمر)
);

-- Contract flag severity
CREATE TYPE flag_severity AS ENUM (
  'info',                 -- معلومة
  'warning',              -- تحذير
  'critical'              -- حرج
);

-- Voice used for TTS
CREATE TYPE voice_persona AS ENUM (
  'abdullah',             -- Male Saudi voice
  'sha'                   -- Female Saudi voice
);
```

### 4.2 Tables

```sql
-- ============================================
-- TABLE: users (المستخدمون)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  full_name_ar TEXT,                    -- الاسم بالعربي
  business_name TEXT,
  business_name_ar TEXT,
  business_type business_type DEFAULT 'freelancer',
  currency TEXT DEFAULT 'USD',          -- USD, SAR, JOD, AED
  country TEXT DEFAULT 'JO',
  vat_rate NUMERIC(5,2) DEFAULT 16.00,  -- VAT percentage
  preferred_voice voice_persona DEFAULT 'abdullah',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE: clients (العملاء)
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  company_ar TEXT,
  notes TEXT,
  risk_level risk_level DEFAULT 'low',
  risk_score NUMERIC(3,1) DEFAULT 5.0,  -- 0-10 scale
  total_invoiced NUMERIC(12,2) DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0,
  total_overdue NUMERIC(12,2) DEFAULT 0,
  avg_payment_days INTEGER DEFAULT 0,    -- Average days to pay
  invoices_count INTEGER DEFAULT 0,
  late_payments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_risk ON clients(user_id, risk_level);

-- ============================================
-- TABLE: invoices (الفواتير)
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,          -- INV-2026-001
  title TEXT NOT NULL,                   -- Project description
  title_ar TEXT,                         -- وصف المشروع بالعربي

  -- Financial
  subtotal NUMERIC(12,2) NOT NULL,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_terms payment_terms DEFAULT 'net_30',

  -- Dates
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Status
  status invoice_status DEFAULT 'draft',
  paid_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Islamic finance
  murabaha_terms TEXT,                   -- شروط المرابحة
  profit_rate NUMERIC(5,2),              -- نسبة الربح (NEVER "interest rate")

  -- PDF storage
  pdf_path TEXT,                         -- Supabase Storage path
  pdf_url TEXT,                          -- Public/signed URL

  -- AI metadata
  generated_by_voice BOOLEAN DEFAULT false,
  chaser_sent BOOLEAN DEFAULT false,
  chaser_sent_at TIMESTAMPTZ,
  chaser_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_client ON invoices(client_id);

-- ============================================
-- TABLE: invoice_items (بنود الفاتورة)
-- ============================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  description_ar TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_invoice_items ON invoice_items(invoice_id);

-- ============================================
-- TABLE: transactions (المعاملات المالية)
-- Mock Open Banking data
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category expense_category,
  description TEXT,
  description_ar TEXT,
  merchant_name TEXT,
  reference TEXT,                        -- Bank reference
  transaction_date DATE NOT NULL,
  is_halal BOOLEAN DEFAULT true,         -- حلال flag
  needs_purification BOOLEAN DEFAULT false, -- تطهير flag
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);

-- ============================================
-- TABLE: contracts (العقود)
-- ============================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  title_ar TEXT,

  -- File storage
  file_path TEXT NOT NULL,               -- Supabase Storage path
  file_url TEXT,                         -- Signed URL
  file_size INTEGER,                     -- bytes
  original_filename TEXT,

  -- AI analysis results
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed')),
  analysis_result JSONB,                 -- Full AI analysis JSON
  key_terms JSONB,                       -- Extracted terms {payment, duration, scope}
  payment_amount NUMERIC(12,2),
  payment_schedule TEXT,
  contract_duration TEXT,
  termination_clause TEXT,

  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contracts_user ON contracts(user_id);

-- ============================================
-- TABLE: contract_flags (تنبيهات العقود)
-- Red flags detected by AI
-- ============================================
CREATE TABLE contract_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  severity flag_severity NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,
  clause_reference TEXT,                 -- Which section/clause
  recommendation TEXT,
  recommendation_ar TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_contract_flags ON contract_flags(contract_id);

-- ============================================
-- TABLE: zakat_records (سجلات الزكاة)
-- ============================================
CREATE TABLE zakat_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_income NUMERIC(12,2) NOT NULL,
  qualifying_assets NUMERIC(12,2) NOT NULL,
  nisab_threshold NUMERIC(12,2) NOT NULL, -- ~$5,200 (85g gold)
  above_nisab BOOLEAN NOT NULL,
  zakat_rate NUMERIC(5,4) DEFAULT 0.025,  -- 2.5%
  zakat_amount NUMERIC(12,2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  currency TEXT DEFAULT 'USD',
  calculation_details JSONB,             -- Breakdown
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zakat_user ON zakat_records(user_id);

-- ============================================
-- TABLE: purification_records (سجلات التطهير)
-- Tatheer — for non-compliant income
-- ============================================
CREATE TABLE purification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  reason_ar TEXT,
  purified BOOLEAN DEFAULT false,
  purified_at TIMESTAMPTZ,
  charity_destination TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLE: voice_logs (سجلات الصوت)
-- For analytics and debugging
-- ============================================
CREATE TABLE voice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transcript TEXT,                       -- What user said
  intent TEXT,                           -- Classified intent
  action_taken TEXT,                     -- What Masraf did
  response_text TEXT,                    -- What Masraf said back
  source_page TEXT,                      -- Which page the user was on
  navigated_to TEXT,                     -- Where Masraf navigated
  voice_used voice_persona DEFAULT 'abdullah',
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_logs_user ON voice_logs(user_id);

-- ============================================
-- TABLE: reports (التقارير)
-- Monthly financial summaries
-- ============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL,         -- 1-12
  period_year INTEGER NOT NULL,
  total_income NUMERIC(12,2) DEFAULT 0,
  total_expenses NUMERIC(12,2) DEFAULT 0,
  net_profit NUMERIC(12,2) DEFAULT 0,
  invoices_sent INTEGER DEFAULT 0,
  invoices_paid INTEGER DEFAULT 0,
  invoices_overdue INTEGER DEFAULT 0,
  top_client_id UUID REFERENCES clients(id),
  top_category expense_category,
  ai_summary TEXT,                       -- AI-generated Arabic summary
  ai_summary_ar TEXT,
  pdf_path TEXT,                         -- Supabase Storage path
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_user ON reports(user_id, period_year, period_month);
```

### 4.3 Supabase Storage Buckets

```
Bucket: invoices
  ├── {user_id}/
  │   ├── INV-2026-001.pdf
  │   ├── INV-2026-002.pdf
  │   └── ...

Bucket: contracts
  ├── {user_id}/
  │   ├── originals/
  │   │   ├── contract-abc123.pdf     (uploaded original)
  │   │   └── ...
  │   └── analyzed/
  │       ├── contract-abc123-analysis.json
  │       └── ...

Bucket: receipts
  ├── {user_id}/
  │   ├── receipt-2026-04-27.jpg
  │   └── ...

Bucket: reports
  ├── {user_id}/
  │   ├── report-2026-04.pdf
  │   └── ...
```

### 4.4 Storage Policies (RLS)

```sql
-- Users can only access their own files
CREATE POLICY "Users access own invoices"
  ON storage.objects FOR ALL
  USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users access own contracts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users access own receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users access own reports"
  ON storage.objects FOR ALL
  USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 5. API Endpoints

### 5.1 Voice Pipeline

```
POST /api/voice/stt
  Body: FormData { audio: Blob (webm/wav) }
  Response: { transcript: string, language: string, confidence: number }
  Provider: Groq Whisper (whisper-large-v3-turbo)
  Notes: Pass language="ar" hint for better Arabic accuracy

POST /api/voice/tts
  Body: { text: string, voice: "abdullah" | "sha" }
  Response: Binary audio/wav stream
  Provider: Groq Orpheus Arabic Saudi (canopylabs/orpheus-arabic-saudi)
  Notes: Max 200 chars per request — chunk longer responses

POST /api/voice/process
  Body: { audio: Blob } (full pipeline)
  Response: {
    transcript: string,
    intent: string,
    action: { type: string, data: any },
    response_text: string,
    response_audio_url: string,
    ui_command: {
      navigate?: string,       // e.g. "/fawateer"
      highlight?: string,      // e.g. "balance-card"
      data?: any               // Data to display
    }
  }
  Notes: This is the main Jarvis endpoint — STT → LLM → Action → TTS in one call
```

### 5.2 AI Endpoints

```
POST /api/ai/chat
  Body: { message: string, context?: { page: string, history: Message[] } }
  Response: { reply: string, action?: Action }
  Provider: Cerebras Qwen3-235B

POST /api/ai/invoice
  Body: { client_name: string, amount: number, description: string, currency?: string }
  Response: { invoice: Invoice, pdf_url: string }
  Notes: AI generates Sharia-compliant terms, bilingual content

POST /api/ai/contract
  Body: FormData { file: File (PDF) }
  Response: { analysis: ContractAnalysis, flags: ContractFlag[], key_terms: KeyTerms }
  Notes: Extracts text from PDF, sends to Cerebras for analysis

POST /api/ai/cashflow
  Body: { user_id: string, days_ahead?: number }
  Response: { predictions: CashFlowPoint[], alerts: Alert[], runway_days: number }

POST /api/ai/chaser
  Body: { client_id: string, invoice_id: string, tone?: "soft" | "firm" }
  Response: { message_ar: string, message_en: string }
  Notes: Culturally-appropriate Arabic payment follow-up

POST /api/ai/zakat
  Body: { user_id: string, period_start: string, period_end: string }
  Response: { calculation: ZakatRecord, explanation_ar: string }
```

### 5.3 CRUD Endpoints

```
# Invoices
GET    /api/invoices?status=&client_id=&sort=     List invoices
POST   /api/invoices                                Create invoice
GET    /api/invoices/[id]                           Get single invoice
PATCH  /api/invoices/[id]                           Update invoice
DELETE /api/invoices/[id]                           Delete invoice (soft)
POST   /api/invoices/pdf                            Generate + store PDF
  Body: { invoice_id: string }
  Response: { pdf_url: string, pdf_path: string }

# Clients
GET    /api/clients?risk_level=&sort=               List clients
POST   /api/clients                                 Create client
GET    /api/clients/[id]                            Get client + risk analysis
PATCH  /api/clients/[id]                            Update client

# Transactions (Mock Open Banking)
GET    /api/transactions?category=&from=&to=        List transactions
POST   /api/transactions                            Add manual transaction

# Contracts
GET    /api/contracts                               List contracts
POST   /api/contracts                               Upload + analyze contract
GET    /api/contracts/[id]                          Get contract + analysis
DELETE /api/contracts/[id]                          Delete contract

# Expenses
GET    /api/expenses?category=&from=&to=            Categorized expense view
POST   /api/expenses/scan                           Receipt photo → expense

# Reports
GET    /api/reports?year=&month=                    Get/generate monthly report
```

---

## 6. Voice Intent Classification

### 6.1 Intent Types

```typescript
type VoiceIntent =
  // Balance & Overview
  | 'CHECK_BALANCE'           // كم رصيدي؟
  | 'DAILY_SUMMARY'           // شو جديد اليوم؟
  | 'MONTHLY_SUMMARY'         // ملخص الشهر

  // Invoice Actions
  | 'CREATE_INVOICE'          // أرسل فاتورة لأحمد بمبلغ ٥٠٠ دولار
  | 'CHECK_INVOICES'          // كم فاتورة معلقة؟
  | 'CHASE_PAYMENT'           // ذكّر أحمد بفاتورته

  // Client Queries
  | 'CHECK_CLIENT'            // كيف حالة أحمد؟
  | 'WORST_CLIENT'            // مين أسوأ عميل عندي؟
  | 'CLIENT_HISTORY'          // متى آخر مرة دفع لي محمد؟

  // Expense Queries
  | 'CHECK_EXPENSES'          // كم صرفت هذا الشهر؟
  | 'EXPENSE_BY_CATEGORY'     // كم صرفت على المطاعم؟
  | 'CAN_I_AFFORD'            // هل يمكنني شراء لابتوب بألف دولار؟

  // Cash Flow
  | 'CASHFLOW_PREDICT'        // متى راح يخلص الرصيد؟
  | 'CASHFLOW_ALERT'          // هل عندي مشكلة مالية قادمة؟

  // Zakat
  | 'CALCULATE_ZAKAT'         // كم زكاتي؟
  | 'PAY_ZAKAT'               // ادفع الزكاة

  // Contract
  | 'ANALYZE_CONTRACT'        // حلّل هذا العقد
  | 'CONTRACT_SUMMARY'        // لخّص العقد

  // Navigation
  | 'NAVIGATE_PAGE'           // خذني للفواتير
  | 'GENERAL_QUESTION'        // Fallback: general financial advice
```

### 6.2 Intent → Page + Action Mapping

```typescript
const INTENT_ROUTES: Record<VoiceIntent, { page: string; action: string }> = {
  CHECK_BALANCE:      { page: '/lawha',     action: 'highlight_balance' },
  DAILY_SUMMARY:      { page: '/lawha',     action: 'read_summary' },
  MONTHLY_SUMMARY:    { page: '/taqareer',  action: 'generate_report' },
  CREATE_INVOICE:     { page: '/fawateer',  action: 'create_invoice' },
  CHECK_INVOICES:     { page: '/fawateer',  action: 'list_pending' },
  CHASE_PAYMENT:      { page: '/fawateer',  action: 'send_chaser' },
  CHECK_CLIENT:       { page: '/umala',     action: 'show_client' },
  WORST_CLIENT:       { page: '/umala',     action: 'sort_by_risk' },
  CLIENT_HISTORY:     { page: '/umala',     action: 'show_history' },
  CHECK_EXPENSES:     { page: '/masareef',  action: 'show_total' },
  EXPENSE_BY_CATEGORY:{ page: '/masareef',  action: 'filter_category' },
  CAN_I_AFFORD:       { page: '/lawha',     action: 'affordability_check' },
  CASHFLOW_PREDICT:   { page: '/lawha',     action: 'show_prediction' },
  CALCULATE_ZAKAT:    { page: '/zakah',     action: 'calculate' },
  PAY_ZAKAT:          { page: '/zakah',     action: 'pay' },
  ANALYZE_CONTRACT:   { page: '/uqood',     action: 'upload_and_analyze' },
  CONTRACT_SUMMARY:   { page: '/uqood',     action: 'summarize' },
  NAVIGATE_PAGE:      { page: 'dynamic',    action: 'navigate' },
  GENERAL_QUESTION:   { page: 'current',    action: 'respond' },
};
```

---

## 7. UI/UX Design System

### 7.1 Design Philosophy
**Thmanyah × Apple × Islamic Luxury**

Inspired by Thmanyah's editorial Arabic design language (clean typography, bold whitespace, cultural confidence) merged with Apple's precision (crisp borders, system blur, spatial hierarchy) and elevated with Islamic luxury elements (geometric patterns, gold accents, calligraphic touches).

### 7.2 Color Palette

```css
:root {
  /* Primary — Deep Islamic Green (trust, halal, growth) */
  --color-primary-50:  #E8F5E9;
  --color-primary-100: #C8E6C9;
  --color-primary-200: #A5D6A7;
  --color-primary-400: #66BB6A;
  --color-primary-500: #1B5E20;     /* Main brand green */
  --color-primary-600: #165219;
  --color-primary-700: #0D3B0F;
  --color-primary-800: #082808;

  /* Secondary — Warm Gold (luxury, Islamic art, premium) */
  --color-gold-50:  #FFF8E1;
  --color-gold-100: #FFECB3;
  --color-gold-200: #FFD54F;
  --color-gold-400: #FFB300;
  --color-gold-500: #C6930A;        /* Main gold accent */
  --color-gold-600: #A07608;
  --color-gold-700: #7A5906;

  /* Accent — Voice Purple (AI, technology, innovation) */
  --color-voice-50:  #F3E5F5;
  --color-voice-100: #CE93D8;
  --color-voice-400: #AB47BC;
  --color-voice-500: #7B1FA2;       /* Voice/AI elements */
  --color-voice-600: #6A1B9A;

  /* Neutrals — Warm grays (Thmanyah-inspired warmth) */
  --color-bg:        #FAFAF8;       /* Page background — warm white */
  --color-surface:   #FFFFFF;       /* Cards */
  --color-surface-2: #F5F5F0;       /* Secondary surfaces */
  --color-border:    #E8E5DE;       /* Borders */
  --color-text:      #1A1A18;       /* Primary text */
  --color-text-2:    #6B6B65;       /* Secondary text */
  --color-text-3:    #9C9C95;       /* Tertiary text */

  /* Semantic */
  --color-success:   #1B5E20;
  --color-warning:   #E65100;
  --color-danger:    #B71C1C;
  --color-info:      #0D47A1;

  /* Dark mode */
  --color-bg-dark:      #0A0A09;
  --color-surface-dark: #1A1A18;
  --color-text-dark:    #F5F5F0;
}
```

### 7.3 Typography

```css
:root {
  --font-arabic: 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  --font-english: -apple-system, 'SF Pro Display', 'Geist Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', 'SF Mono', monospace;

  /* Type scale */
  --text-xs:  0.75rem;   /* 12px */
  --text-sm:  0.875rem;  /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg:  1.125rem;  /* 18px */
  --text-xl:  1.25rem;   /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px — hero numbers */
}
```

### 7.4 Layout Principles

- **Direction:** `dir="rtl"` on root `<html>` element
- **Navigation:** Bottom nav bar (mobile-first) — 5 slots:
  - لوحة (Dashboard) — Home icon
  - فواتير (Invoices) — Receipt icon
  - 🎤 **Mic Button** (center, elevated, glowing) — Voice icon
  - عملاء (Clients) — Users icon
  - المزيد (More) — Menu icon → opens sidebar with remaining pages
- **Cards:** `border-radius: 16px`, warm white background, 1px warm-gray border
- **Spacing:** 8px base grid (8, 16, 24, 32, 48, 64)
- **Motion:** 200ms ease-out for transitions, 300ms for page navigation
- **Islamic pattern:** Subtle geometric arabesque pattern as background texture on headers/hero sections at 3-5% opacity

### 7.5 Component Patterns

- **Balance Card:** Large Arabic numerals (Tabular, RTL), gold accent border-top
- **Mic Button:** 56px circle, centered in nav, purple gradient glow when active, pulse animation when listening
- **Invoice Cards:** Green status dot (paid), red (overdue), amber (pending)
- **Risk Badges:** Rounded pills — green/amber/red with Arabic labels
- **Voice Overlay:** Full-screen semi-transparent overlay with waveform animation, Arabic transcript appearing in real-time
- **Empty States:** Minimal illustration + Arabic text + CTA button
- **Toast Notifications:** Slide-in from top, bilingual text, auto-dismiss 4s

---

## 8. Islamic Finance Glossary (Used Throughout App)

| English | Arabic | Variable Name | Usage |
|---------|--------|--------------|-------|
| Bank/Finance | مصرف | `masraf` | App name |
| Profit | ربح | `ribh` | NEVER use "interest" |
| Profit Rate | نسبة الربح | `nisbat_alribh` | On invoices |
| Financing | تمويل | `tamweel` | NEVER use "loan" |
| Cost-plus Sale | مرابحة | `murabaha` | Invoice terms |
| Profit Sharing | مضاربة | `mudarabah` | Returns model |
| Partnership | مشاركة | `musharakah` | Joint ventures |
| Charity Obligation | زكاة | `zakah` | 2.5% of qualifying wealth |
| Minimum Threshold | نصاب | `nisab` | ~$5,200 (85g gold) |
| Purification | تطهير | `tatheer` | Non-compliant income cleanup |
| Permissible | حلال | `halal` | Allowed transactions |
| Prohibited | حرام | `haram` | Blocked transactions |
| Endowment | وقف | `waqf` | Charitable endowment |
| Obligation | فريضة | `fareedah` | Religious duty (Zakat) |

---

## 9. Sandbox Assumptions (Hackathon Rules)

These are immutable facts per SalamHack 2026 rules — DO NOT build these:

1. All users passed KYC/AML — skip identity verification
2. Sharia Advisory Board approved your architecture — just build it
3. All returns = Profit Sharing (Musharakah/Mudarabah) — never interest
4. All merchants pre-screened halal — no blocking logic
5. Fixed FX rate: 1 USD = 3.67 AED = 3.75 SAR
6. Cross-border settlements are instant
7. Open Banking API provides read/write access to every bank
8. Tax engine provides correct VAT calculations
9. Digital wallet is legally recognized
10. All transactions come pre-tagged with categories
11. Users can top up wallets from any debit card at 0% fee
12. Use hardcoded JSON for bank response simulation
13. Focus on the "Golden Path" — perfect flow only
14. DON'T build: Forgot Password, Upload Passport, Dispute Resolution, Fraud Flagging

---

## 10. Deployment

### 10.1 Platform
- **Frontend + API:** Vercel (or Replit for hackathon speed)
- **Database:** Supabase (hosted PostgreSQL)
- **File Storage:** Supabase Storage (S3-compatible)

### 10.2 Environment Variables Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cerebras (LLM)
CEREBRAS_API_KEY=
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1

# Groq (Voice)
GROQ_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://masraf.app
```

---

## 11. Hackathon Deliverables Checklist

| Day | Deliverable | Deadline |
|-----|-------------|----------|
| April 27 | Project idea form submitted | End of day |
| April 28 | 1-min prototype video (dashboard + voice demo) | End of day — DISQUALIFICATION if missed |
| April 29 | 2-min progress video (invoicing + clients working) | End of day |
| April 30 | 2-min progress video (Zakat + contract analyzer) | End of day |
| May 1 | GitHub repo (public, organized, README) | End of day |
| May 1 | 5-min final video using official template | End of day |

### GitHub README.md Must Include:
- Project name (مصرف — Masraf) + tagline
- Problem statement (Arabic freelancer pain)
- Solution overview + screenshots
- Tech stack table
- Setup instructions (`npm install`, env vars, Supabase setup)
- Team members
- Demo video link
- Track: "Financial Tools for Freelancers & Small Businesses"

---

*End of SRS — Version 1.0*
*مصرف (Masraf) — المستشار المالي الذكي للمستقلين العرب*
