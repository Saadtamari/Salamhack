# Masraf API Requirements by Page

**Date:** April 29, 2026  
**Status:** Design Analysis — Maps UI pages to SRS API endpoints

---

## Overview

This document summarizes what APIs each page/screen in the Masraf design requires based on the prototype. Each section lists the data needed and maps it to the SRS endpoint definitions.

---

## 1. Dashboard Page (لوحة)

**Purpose:** Overview of financial health, quick actions, balance, cash flow, recent activity.

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| Current balance | `number` | (Not in SRS — needs: user profile/account balance endpoint) |
| Total income this month | `number` | Aggregated from `GET /api/invoices?status=paid` |
| Total expenses this month | `number` | `GET /api/transactions?type=expense&from=&to=` |
| Pending invoices amount | `number` | `GET /api/invoices?status=sent` |
| Overdue invoices + count | `array`, `number` | `GET /api/invoices?status=overdue` |
| Cash flow chart (6 months) | `array` | (Not in SRS — needs: cash flow prediction endpoint) ✅ `POST /api/ai/cashflow` |
| Recent transactions (last 4) | `array` | `GET /api/transactions?limit=4&sort=date` |
| Runway indicator (days until negative balance) | `number` | (Not in SRS — needs: cash flow forecast) ✅ `POST /api/ai/cashflow` returns `runway_days` |

### Missing/Custom Endpoints
- **Account Balance Endpoint** — Need a simple balance fetch (could be derived from transactions)
- **Monthly Aggregation Endpoint** — Might want aggregated stats endpoint instead of manual filtering

---

## 2. Invoices Page (فواتير)

**Purpose:** View, filter, create, and send invoices. Track status (draft, sent, viewed, paid, overdue, cancelled).

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| List all invoices | `array` | `GET /api/invoices?status=&client_id=&sort=` |
| Filter by status | `array` | `GET /api/invoices?status=draft/sent/paid/overdue` |
| Filter by client | `array` | `GET /api/invoices?client_id={id}` |
| Create invoice | `object` | `POST /api/invoices` with manual data |
| Create AI-generated invoice | `object` | `POST /api/ai/invoice` (client_name, amount, description) |
| Get invoice PDF | `url/blob` | `GET /api/invoices/pdf` or included in `GET /api/invoices/{id}` |
| Send invoice to client | `action` | `PATCH /api/invoices/{id}` (update status to "sent") |
| Generate payment chaser message | `text` | `POST /api/ai/chaser` (client_id, invoice_id, tone) |
| List clients (for invoice creation dropdown) | `array` | `GET /api/clients` |

### Missing/Custom Endpoints
- **Send Invoice (via Email)** — Need endpoint to send invoice to client email (not in SRS, could be: `POST /api/invoices/{id}/send`)

---

## 3. Clients Page (عملاء)

**Purpose:** View client directory with risk scoring, payment history, total invoiced/paid/overdue amounts.

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| List all clients | `array` | `GET /api/clients?risk_level=&sort=` |
| Client details | `object` | `GET /api/clients/{id}` |
| Client risk score | `number` (0-10) | `GET /api/clients/{id}` (included in response) |
| Client risk level | `enum` (low/medium/high) | `GET /api/clients/{id}` (included in response) |
| Total invoiced amount | `number` | `GET /api/clients/{id}` (included in response) |
| Total paid amount | `number` | `GET /api/clients/{id}` (included in response) |
| Total overdue amount | `number` | `GET /api/clients/{id}` (included in response) |
| Average days to payment | `number` | `GET /api/clients/{id}` (included in response) |
| Invoice count | `number` | `GET /api/clients/{id}` (included in response) |
| Late payment count | `number` | `GET /api/clients/{id}` (included in response) |
| Create new client | `object` | `POST /api/clients` (name, email, phone, company, notes) |
| Update client | `object` | `PATCH /api/clients/{id}` |

### Missing/Custom Endpoints
- None — SRS endpoints should cover all requirements

---

## 4. Expenses Page (مصاريف)

**Purpose:** View transactions by category, total expenses breakdown, spending trends.

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| List all transactions | `array` | `GET /api/transactions?category=&from=&to=` |
| Filter by category | `array` | `GET /api/transactions?category=food_dining/software_tools/transport/...` |
| Filter by date range | `array` | `GET /api/transactions?from=2026-04-01&to=2026-04-30` |
| Expenses by category (pie chart) | `array` | Aggregated from `GET /api/transactions` grouped by category |
| Total expenses this month | `number` | Aggregated from `GET /api/transactions?type=expense` |
| Add manual transaction | `object` | `POST /api/transactions` (type, amount, category, description, date) |
| Scan receipt (image to expense) | `action` | (Not in SRS — needs: receipt scanning/OCR endpoint) |
| Mark transaction as halal/needs purification | `boolean` | Included in `PATCH /api/transactions/{id}` or `POST /api/expenses` endpoints |

### Missing/Custom Endpoints
- **Receipt Scanner Endpoint** — `POST /api/expenses/scan` (upload image, returns expense suggestion)
- **Expense Categorization Endpoint** — `POST /api/expenses` (auto-categorize transaction)

---

## 5. Zakat Page (زكاة)

**Purpose:** Calculate Zakat obligation, track nisab threshold, manage purification records.

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| Total assets/qualifying assets | `number` | (Not in SRS — needs: aggregated from account + invoices pending) |
| Nisab threshold | `number` | Fixed (~$5,200 or gold price lookup) |
| Zakat rate | `number` | 2.5% (fixed) |
| Zakat amount due | `number` | `POST /api/ai/zakat` |
| Zakat calculation details | `object` | `POST /api/ai/zakat` (returns breakdown) |
| Days until Zakat due | `number` | Calculated from lunar calendar (not in SRS) |
| Mark Zakat as paid | `action` | `PATCH /api/zakat/{id}` (update `paid` flag) |
| List purification records | `array` | (Implicit in `/api/transactions` with `needsPurification=true`) |
| Create purification record | `object` | `POST /api/purification` (transaction_id, amount, reason) |

### Missing/Custom Endpoints
- **Lunar Calendar Lookup** — For accurate Zakat due date (custom integration needed)
- **Account Balance Calculation** — For total assets in Zakat formula

---

## 6. Contracts Page (عقود)

**Purpose:** Upload contracts, AI analysis of terms, red flag detection, extract key terms.

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| List contracts | `array` | `GET /api/contracts` |
| Get contract details + analysis | `object` | `GET /api/contracts/{id}` |
| Upload contract PDF | `action` | `POST /api/contracts` (FormData with file) |
| Contract analysis status | `enum` (pending/analyzing/completed/failed) | `GET /api/contracts/{id}` (included in response) |
| Contract analysis result (full JSON) | `object` | `GET /api/contracts/{id}` → `analysisResult` |
| Extracted key terms | `object` | `GET /api/contracts/{id}` → `keyTerms` (payment, duration, scope) |
| Red flags (critical/warning/info) | `array` | (Separate table in SRS: `contract_flags`) — need endpoint: `GET /api/contracts/{id}/flags` |
| Flag severity + recommendation | `string`, `string` | `GET /api/contracts/{id}/flags` |
| Delete contract | `action` | `DELETE /api/contracts/{id}` |

### Missing/Custom Endpoints
- **Contract Analysis Endpoint** — Listed in SRS: `POST /api/ai/contract` (upload PDF, returns analysis + flags)
- **Contract Flags Endpoint** — Need: `GET /api/contracts/{id}/flags` to fetch associated flags

---

## 7. Reports Page (تقارير)

**Purpose:** Monthly financial summary, income/expense breakdown, top clients, trends.

### Data Requirements

| Data | Type | SRS Endpoint |
|------|------|-------------|
| Monthly report (current month) | `object` | `GET /api/reports?year=2026&month=4` |
| Total income | `number` | Aggregated from invoices |
| Total expenses | `number` | Aggregated from transactions |
| Net profit | `number` | Income - Expenses |
| Invoices sent | `number` | Count of invoices with status="sent" |
| Invoices paid | `number` | Count of invoices with status="paid" |
| Invoices overdue | `number` | Count of invoices with status="overdue" |
| Top client (by revenue) | `object` | Need to find from invoices |
| Top expense category | `enum` | Aggregated from transactions |
| AI summary (Arabic) | `string` | `GET /api/reports` → `aiSummaryAr` |
| Generate/download report as PDF | `url/blob` | `GET /api/reports?year=&month=&format=pdf` (not in SRS) |

### Missing/Custom Endpoints
- **Report PDF Generation** — Need endpoint to generate and download PDF: `POST /api/reports/generate` or `GET /api/reports/{id}/pdf`
- **Monthly Report Endpoint** — Listed in SRS: `GET /api/reports?year=&month=` — but may need to trigger generation first

---

## 8. Voice Interface (🎤)

**Purpose:** Voice commands for balance checks, invoice creation, payment chasers, navigation, Zakat calculation.

### Data Requirements

| Command | Required Endpoint |
|---------|-------------------|
| "كم رصيدي؟" (Check balance) | Account balance endpoint (custom) + `GET /api/invoices`, `GET /api/transactions` |
| "أرسل فاتورة لشركة النجوم بمبلغ ٥٠٠ دولار" | `POST /api/ai/invoice` + `GET /api/clients` |
| "ذكّر شركة النجوم بفاتورتها المتأخرة" | `POST /api/ai/chaser` + `GET /api/invoices?client_id=&status=overdue` |
| "كم صرفت هذا الشهر؟" | `GET /api/transactions?type=expense` |
| "احسب زكاتي" | `POST /api/ai/zakat` |
| "خذني للفواتير" | Navigation (client-side) |
| "مين أسوأ عميل عندي؟" | `GET /api/clients` (rank by risk_level/risk_score) |

### Missing/Custom Endpoints
- **Voice STT Endpoint** — `POST /api/voice/stt` (Groq Whisper integration)
- **Voice TTS Endpoint** — `POST /api/voice/tts` (Groq Orpheus Arabic Saudi)
- **Voice Processing Pipeline** — `POST /api/voice/process` (full STT → LLM → TTS → action)

---

## Summary: Missing/Custom Endpoints

Endpoints needed but **not yet in SRS**:

| Endpoint | Purpose | Suggested Path |
|----------|---------|-----------------|
| Account Balance | Get current balance | `GET /api/account/balance` |
| User Profile | Get user data (name, business, currency) | `GET /api/account/profile` |
| Invoice Send (Email) | Send invoice PDF to client | `POST /api/invoices/{id}/send` |
| Monthly Stats | Aggregated monthly report data | `GET /api/stats/monthly?month=&year=` |
| Receipt Scanner | Upload image → expense suggestion | `POST /api/expenses/scan` |
| Expense Categorization | Auto-categorize transaction | `POST /api/expenses/categorize` |
| Contract Flags | Get red flags for a contract | `GET /api/contracts/{id}/flags` |
| Report PDF | Generate downloadable PDF report | `POST /api/reports/generate` or `GET /api/reports/{id}/pdf` |
| Voice STT | Speech → Text conversion | `POST /api/voice/stt` |
| Voice TTS | Text → Speech conversion | `POST /api/voice/tts` |
| Voice Processing | Full voice pipeline | `POST /api/voice/process` |

---

## Notes

- **Authentication**: Currently the SRS and design assume **no authentication** (hackathon mode). All endpoints are accessible.
- **Single-tenant**: Backend schema is userless; data is global/shared for prototype.
- **Aggregation**: Monthly stats (income, expenses, counts) may need aggregation endpoints or frontend filtering.
- **AI Endpoints**: SRS defines `/api/ai/*` endpoints using Cerebras + Groq; design relies heavily on these for intent classification and content generation.
- **Voice**: Full Jarvis-style voice interaction requires STT + LLM + TTS pipeline; currently defined in SRS but not yet shown in backend code.

---

**Last Updated:** April 29, 2026

