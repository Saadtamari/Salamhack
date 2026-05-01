# Masraf Next.js Frontend

Arabic-first Masraf frontend for the SalamHack product demo. The app can run against the polished mock dataset by default, or switch to the Express backend through the typed integration layer in `lib/api`.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend Integration

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_USE_BACKEND=true
NEXT_PUBLIC_STRICT_BACKEND=false
NEXT_PUBLIC_API_TIMEOUT_MS=15000
```

`NEXT_PUBLIC_USE_BACKEND=false` keeps the UI on the built-in demo data. When it is `true`, the frontend is ready to call:

- Dashboard: `GET /api/dashboard`
- Clients: `GET/POST/PATCH /api/clients`
- Invoices: `GET/POST/PATCH /api/invoices`, `POST /api/invoices/pdf`
- Expenses: `GET/POST /api/transactions`
- Contracts: `GET/POST/DELETE /api/contracts` with multipart `file`
- Zakat: `GET /api/zakat`, `POST /api/zakat/calculate`
- Purification: `GET/POST /api/purification`, `POST /api/purification/:id/purify`
- Reports: `GET /api/reports`, `POST /api/reports/generate`
- AI: `POST /api/ai/chat`, `POST /api/ai/generate-chaser`, `POST /api/ai/analyze-contract`
- Voice: `POST /api/voice/transcribe`, `POST /api/voice/process`, `POST /api/voice/synthesize`
- Storage: `POST /api/storage/upload`

The API surface is centralized in `lib/api/masraf-api.ts`; response/error handling is in `lib/api/client.ts`; backend-to-UI mapping is in `lib/api/adapters.ts`; live-data loading with mock fallback is in `lib/api/useMasrafBackend.ts`.

## Quality Checks

```bash
npm run lint
npm run build
```
