import { apiBinary, apiRequest, toFormData } from "./client";
import type {
  AiChatResult,
  AgentAction,
  AgentContext,
  AgentHistoryMessage,
  AgentRunResult,
  BackendClient,
  BackendContract,
  BackendInvoice,
  BackendPurificationRecord,
  BackendReport,
  BackendTransaction,
  BackendZakatRecord,
  CreateClientPayload,
  CreateInvoicePayload,
  CreateTransactionPayload,
  DashboardStats,
  ExpenseCategory,
  InvoiceStatus,
  PdfResult,
  ReceiptScanResult,
  VoiceProcessResult,
  ZakatCalculatePayload,
} from "./types";

export const masrafApi = {
  health: () => apiRequest<{ status?: string; uptime?: number; timestamp?: string }>("/health"),

  dashboard: {
    get: () => apiRequest<DashboardStats>("/api/dashboard"),
  },

  clients: {
    list: () => apiRequest<BackendClient[]>("/api/clients"),
    get: (id: string) => apiRequest<BackendClient>(`/api/clients/${id}`),
    create: (body: CreateClientPayload) => apiRequest<BackendClient>("/api/clients", { method: "POST", body }),
    update: (id: string, body: Partial<CreateClientPayload>) => apiRequest<BackendClient>(`/api/clients/${id}`, { method: "PATCH", body }),
  },

  invoices: {
    list: (query?: { status?: InvoiceStatus; client_id?: string; sort?: "created_at" | "due_date" | "status" | "total" }) =>
      apiRequest<BackendInvoice[]>("/api/invoices", { query }),
    get: (id: string) => apiRequest<BackendInvoice>(`/api/invoices/${id}`),
    create: (body: CreateInvoicePayload) => apiRequest<BackendInvoice>("/api/invoices", { method: "POST", body }),
    update: (id: string, body: Partial<CreateInvoicePayload>) => apiRequest<BackendInvoice>(`/api/invoices/${id}`, { method: "PATCH", body }),
    cancel: (id: string) => apiRequest<BackendInvoice>(`/api/invoices/${id}`, { method: "DELETE" }),
    generatePdf: (invoiceId: string) => apiRequest<PdfResult>("/api/invoices/pdf", { method: "POST", body: { invoiceId } }),
  },

  transactions: {
    list: (query?: { category?: ExpenseCategory; from?: string; to?: string }) =>
      apiRequest<BackendTransaction[]>("/api/transactions", { query }),
    create: (body: CreateTransactionPayload) => apiRequest<BackendTransaction>("/api/transactions", { method: "POST", body }),
  },

  contracts: {
    list: (query?: { analysis_status?: "pending" | "analyzing" | "completed" | "failed"; client_id?: string }) =>
      apiRequest<BackendContract[]>("/api/contracts", { query }),
    get: (id: string) => apiRequest<BackendContract>(`/api/contracts/${id}`),
    upload: (input: { file: File; clientId?: string | null; title?: string; titleAr?: string }) =>
      apiRequest<BackendContract>("/api/contracts", {
        method: "POST",
        formData: toFormData({
          file: input.file,
          clientId: input.clientId,
          title: input.title,
          titleAr: input.titleAr,
        }),
      }),
    delete: (id: string) => apiRequest<BackendContract>(`/api/contracts/${id}`, { method: "DELETE" }),
  },

  zakat: {
    list: (query?: { from?: string; to?: string }) => apiRequest<BackendZakatRecord[]>("/api/zakat", { query }),
    get: (id: string) => apiRequest<BackendZakatRecord>(`/api/zakat/${id}`),
    calculate: (body: ZakatCalculatePayload) => apiRequest<BackendZakatRecord>("/api/zakat/calculate", { method: "POST", body }),
    update: (id: string, body: Partial<ZakatCalculatePayload>) => apiRequest<BackendZakatRecord>(`/api/zakat/${id}`, { method: "PATCH", body }),
    delete: (id: string) => apiRequest<BackendZakatRecord>(`/api/zakat/${id}`, { method: "DELETE" }),
  },

  purification: {
    list: (query?: { purified?: boolean }) => apiRequest<BackendPurificationRecord[]>("/api/purification", { query }),
    get: (id: string) => apiRequest<BackendPurificationRecord>(`/api/purification/${id}`),
    create: (body: { transactionId?: string | null; amount: number; reason?: string | null; reasonAr?: string | null; purified?: boolean; charityDestination?: string | null }) =>
      apiRequest<BackendPurificationRecord>("/api/purification", { method: "POST", body }),
    markPurified: (id: string, charityDestination?: string) =>
      apiRequest<BackendPurificationRecord>(`/api/purification/${id}/purify`, { method: "POST", body: { charityDestination } }),
    delete: (id: string) => apiRequest<BackendPurificationRecord>(`/api/purification/${id}`, { method: "DELETE" }),
  },

  reports: {
    list: (query?: { year?: number }) => apiRequest<BackendReport[]>("/api/reports", { query }),
    get: (id: string) => apiRequest<BackendReport>(`/api/reports/${id}`),
    generate: (month: number, year: number) => apiRequest<BackendReport>("/api/reports/generate", { method: "POST", body: { month, year } }),
  },

  ai: {
    chat: (body: { message: string; context?: AgentContext; history?: AgentHistoryMessage[] }) =>
      apiRequest<AiChatResult>("/api/ai/chat", { method: "POST", body }),
    generateChaser: (body: { clientName: string; invoiceNumber: string; amount: number; currency: string; daysOverdue: number; dueDate: string }) =>
      apiRequest<{ message: string }>("/api/ai/generate-chaser", { method: "POST", body }),
    analyzeContract: (body: { contractText: string; title?: string }) =>
      apiRequest<BackendContract["analysisResult"]>("/api/ai/analyze-contract", { method: "POST", body }),
    analyzeReceiptText: (body: { receiptText: string; currency?: string }) =>
      apiRequest<AiChatResult>("/api/ai/chat", {
        method: "POST",
        body: {
          message: `Extract this receipt into JSON with merchantName, amount, category, transactionDate, isHalal, needsPurification, and short Arabic notes: ${body.receiptText}`,
          context: { screen: "expenses", data: { currency: body.currency } },
        },
      }),
    scanReceipt: (file: File) =>
      apiRequest<ReceiptScanResult>("/api/ai/scan-receipt", {
        method: "POST",
        formData: toFormData({ image: file }),
      }),
  },

  agent: {
    command: (body: {
      message?: string;
      context?: AgentContext;
      history?: AgentHistoryMessage[];
      executeAction?: boolean;
      confirmation?: { approved: boolean; action: AgentAction; idempotencyKey?: string };
    }) => apiRequest<AgentRunResult>("/api/agent/command", { method: "POST", body }),
  },

  voice: {
    transcribe: (file: File, language = "ar") =>
      apiRequest<{ text?: string; transcript?: string }>("/api/voice/transcribe", {
        method: "POST",
        formData: toFormData({ audio: file, language }),
      }),
    process: (file: File, context?: AgentContext, executeAction = true, history?: AgentHistoryMessage[]) =>
      apiRequest<VoiceProcessResult>("/api/voice/process", {
        method: "POST",
        formData: toFormData({ audio: file, context, executeAction, history }),
      }),
    synthesize: (text: string, voice = "fatima") => apiBinary("/api/voice/synthesize", { method: "POST", body: { text, voice } }),
  },

  storage: {
    upload: (input: { file: File; directory?: string; bucket?: string; access?: "public" | "signed" }) =>
      apiRequest<{ path?: string; url?: string; signedUrl?: string }>("/api/storage/upload", {
        method: "POST",
        formData: toFormData({
          file: input.file,
          directory: input.directory,
          bucket: input.bucket,
          access: input.access,
        }),
      }),
    signedUrl: (body: { bucket: string; path: string; expiresInSeconds?: number }) =>
      apiRequest<{ signedUrl?: string; url?: string }>("/api/storage/signed-url", { method: "POST", body }),
    deleteObject: (body: { bucket: string; path: string }) =>
      apiRequest<{ deleted?: boolean }>("/api/storage/object", { method: "DELETE", body }),
  },
};
