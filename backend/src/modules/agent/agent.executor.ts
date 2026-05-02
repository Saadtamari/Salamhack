import { z } from "zod";
import { ClientsRepository } from "../clients/clients.repository.js";
import { ClientsService } from "../clients/clients.service.js";
import { InvoicesRepository } from "../invoices/invoices.repository.js";
import { InvoicesService } from "../invoices/invoices.service.js";
import { TransactionsRepository } from "../transactions/transactions.repository.js";
import { TransactionsService } from "../transactions/transactions.service.js";
import { AIService } from "../ai/ai.service.js";
import type { AgentAction, AgentActionResult, AgentPage, AgentToolName } from "./agent.schemas.js";

const mutationTools = new Set<AgentToolName>([
  "transactions.create",
  "clients.create",
  "invoices.create_draft",
  "invoices.send",
  "invoices.send_reminder",
  "reports.generate",
]);

const expenseCategorySchema = z.enum([
  "food_dining",
  "transport",
  "software_tools",
  "office_supplies",
  "communication",
  "marketing",
  "education",
  "health",
  "rent",
  "utilities",
  "entertainment",
  "other",
]);

const paymentTermsSchema = z.enum([
  "immediate",
  "net_7",
  "net_15",
  "net_30",
  "net_60",
  "murabaha",
  "musharakah",
]);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalTextSchema = z.preprocess(
  (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined,
  z.string().optional(),
);
const currencySchema = z.preprocess(
  (value) => typeof value === "string" && value.trim().length > 0 ? value.trim().toUpperCase() : "USD",
  z.string().min(1).max(8),
);
const booleanishSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const navigateArgsSchema = z.object({
  screen: z.enum(["dashboard", "invoices", "clients", "expenses", "zakat", "contracts", "reports"]),
});

const transactionCreateArgsSchema = z.object({
  type: z.enum(["income", "expense"]).default("expense"),
  amount: z.coerce.number().positive(),
  currency: currencySchema.default("USD"),
  category: expenseCategorySchema.default("other"),
  description: optionalTextSchema.default("Voice-created transaction"),
  descriptionAr: optionalTextSchema,
  merchantName: optionalTextSchema,
  reference: optionalTextSchema,
  transactionDate: dateSchema.default(() => today()),
  isHalal: booleanishSchema.default(true),
  needsPurification: booleanishSchema.default(false),
});

const transactionListArgsSchema = z.object({
  category: expenseCategorySchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

const clientCreateArgsSchema = z.object({
  name: z.string().trim().min(1),
  nameAr: optionalTextSchema,
  email: optionalTextSchema,
  phone: optionalTextSchema,
  company: optionalTextSchema,
  companyAr: optionalTextSchema,
  notes: optionalTextSchema,
});

const clientFindArgsSchema = z.object({
  query: z.string().trim().min(1).optional(),
});

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  descriptionAr: optionalTextSchema,
  quantity: z.coerce.number().positive().default(1),
  unitPrice: z.coerce.number().nonnegative(),
  total: z.coerce.number().nonnegative().optional(),
});

const invoiceCreateDraftArgsSchema = z.object({
  clientId: optionalTextSchema,
  clientName: optionalTextSchema,
  title: optionalTextSchema,
  amount: z.coerce.number().positive(),
  currency: currencySchema.default("USD"),
  paymentTerms: paymentTermsSchema.default("net_30"),
  dueDate: dateSchema.optional(),
  items: z.array(invoiceItemSchema).default([]),
});

const invoiceSendArgsSchema = z.object({
  invoiceId: optionalTextSchema,
  invoiceNumber: optionalTextSchema,
}).refine((value) => value.invoiceId || value.invoiceNumber, {
  message: "invoiceId or invoiceNumber is required",
});

const invoiceReminderArgsSchema = z.object({
  invoiceId: optionalTextSchema,
  invoiceNumber: optionalTextSchema,
  clientName: optionalTextSchema,
  amount: z.coerce.number().positive().optional(),
  currency: currencySchema.default("USD"),
  dueDate: optionalTextSchema,
  daysOverdue: z.coerce.number().int().min(0).optional(),
  tone: z.enum(["soft", "firm"]).default("soft"),
  message: optionalTextSchema,
}).refine((value) => value.invoiceId || value.invoiceNumber || value.clientName, {
  message: "invoiceId, invoiceNumber, or clientName is required",
});

const zakatCalculateArgsSchema = z.object({
  qualifyingAssets: z.coerce.number().nonnegative().optional(),
  totalIncome: z.coerce.number().nonnegative().optional(),
  nisabThreshold: z.coerce.number().positive().default(8400),
  zakatRate: z.coerce.number().positive().default(0.025),
  currency: currencySchema.default("USD"),
}).refine((value) => value.qualifyingAssets !== undefined || value.totalIncome !== undefined, {
  message: "qualifyingAssets or totalIncome is required",
});

const reportGenerateArgsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

const invoiceDownloadArgsSchema = z.object({
  invoiceId: optionalTextSchema,
  invoiceNumber: optionalTextSchema,
});

type ValidationResult =
  | { ok: true; action: AgentAction }
  | { ok: false; missingFields: string[]; message: string };

export class AgentExecutor {
  private readonly clientsService = new ClientsService(new ClientsRepository());
  private readonly invoicesService = new InvoicesService(new InvoicesRepository());
  private readonly transactionsService = new TransactionsService(new TransactionsRepository());
  private readonly aiService = new AIService();

  requiresConfirmation(tool: AgentToolName): boolean {
    return mutationTools.has(tool);
  }

  validate(action: AgentAction): ValidationResult {
    const result = this.parseAction(action);

    if (result.success) {
      return {
        ok: true,
        action: {
          tool: action.tool,
          args: result.data,
        },
      };
    }

    return {
      ok: false,
      missingFields: zodMissingFields(result.error),
      message: result.error.issues[0]?.message ?? "بيانات الإجراء غير مكتملة.",
    };
  }

  async execute(action: AgentAction): Promise<AgentActionResult> {
    const validation = this.validate(action);

    if (!validation.ok) {
      return {
        executed: false,
        tool: action.tool,
        message: validation.message,
      };
    }

    switch (validation.action.tool) {
      case "ui.navigate":
        return this.executeNavigate(validation.action.args);
      case "transactions.create":
        return this.executeCreateTransaction(validation.action.args);
      case "transactions.list":
        return this.executeListTransactions(validation.action.args);
      case "clients.create":
        return this.executeCreateClient(validation.action.args);
      case "clients.find":
        return this.executeFindClients(validation.action.args);
      case "invoices.create_draft":
        return this.executeCreateInvoiceDraft(validation.action.args);
      case "invoices.send":
        return this.executeSendInvoice(validation.action.args);
      case "invoices.send_reminder":
        return this.executeSendReminder(validation.action.args);
      case "zakat.calculate":
        return this.executeCalculateZakat(validation.action.args);
      case "reports.generate":
        return this.executeGenerateReport(validation.action.args);
      case "invoices.download":
        return this.executeDownloadInvoice(validation.action.args);
      default:
        return {
          executed: false,
          tool: validation.action.tool,
          message: "هذا الإجراء غير مدعوم حالياً.",
        };
    }
  }

  private parseAction(action: AgentAction) {
    const args = normalizeAliases(action.args);

    switch (action.tool) {
      case "ui.navigate":
        return navigateArgsSchema.safeParse(args);
      case "transactions.create":
        return transactionCreateArgsSchema.safeParse(args);
      case "transactions.list":
        return transactionListArgsSchema.safeParse(args);
      case "clients.create":
        return clientCreateArgsSchema.safeParse(args);
      case "clients.find":
        return clientFindArgsSchema.safeParse(args);
      case "invoices.create_draft":
        return invoiceCreateDraftArgsSchema.safeParse(args);
      case "invoices.send":
        return invoiceSendArgsSchema.safeParse(args);
      case "invoices.send_reminder":
        return invoiceReminderArgsSchema.safeParse(args);
      case "zakat.calculate":
        return zakatCalculateArgsSchema.safeParse(args);
      case "reports.generate":
        return reportGenerateArgsSchema.safeParse(args);
      case "invoices.download":
        return invoiceDownloadArgsSchema.safeParse(args);
    }
  }

  private executeNavigate(args: Record<string, unknown>): AgentActionResult {
    const screen = String(args.screen) as AgentPage;
    return {
      executed: true,
      tool: "ui.navigate",
      data: { screen },
      targetScreen: screen,
      message: `تم فتح صفحة ${screen}.`,
    };
  }

  private async executeCreateTransaction(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = transactionCreateArgsSchema.parse(args);
    const row = await this.transactionsService.create(parsed);

    return {
      executed: true,
      tool: "transactions.create",
      data: row,
      targetScreen: "expenses",
      message: "تم تسجيل المعاملة.",
    };
  }

  private async executeListTransactions(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = transactionListArgsSchema.parse(args);
    const rows = await this.transactionsService.list(parsed);

    return {
      executed: true,
      tool: "transactions.list",
      data: {
        count: rows.length,
        total: rows.reduce((sum, row) => sum + Number(row.amount), 0),
        transactions: rows.slice(0, 10),
      },
      targetScreen: "expenses",
    };
  }

  private async executeCreateClient(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = clientCreateArgsSchema.parse(args);
    const row = await this.clientsService.create(parsed);

    return {
      executed: true,
      tool: "clients.create",
      data: row,
      targetScreen: "clients",
      message: "تم إنشاء العميل.",
    };
  }

  private async executeFindClients(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = clientFindArgsSchema.parse(args);
    const query = parsed.query?.toLowerCase();
    const rows = await this.clientsService.list({});
    const filtered = query
      ? rows.filter((client) => [
          client.name,
          client.nameAr,
          client.company,
          client.companyAr,
          client.email,
        ].some((value) => value?.toLowerCase().includes(query)))
      : rows.slice(0, 10);

    return {
      executed: true,
      tool: "clients.find",
      data: filtered.slice(0, 10),
      targetScreen: "clients",
    };
  }

  private async executeCreateInvoiceDraft(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = invoiceCreateDraftArgsSchema.parse(args);
    const clientId = parsed.clientId ?? await this.resolveClientId(parsed.clientName);
    const title = parsed.title ?? (parsed.clientName ? `فاتورة إلى ${parsed.clientName}` : "فاتورة أنشئت بالصوت");
    const items = parsed.items.length > 0
      ? parsed.items
      : [
          {
            description: title,
            quantity: 1,
            unitPrice: parsed.amount,
            total: parsed.amount,
          },
        ];

    const row = await this.invoicesService.create({
      clientId,
      title,
      subtotal: parsed.amount,
      total: parsed.amount,
      currency: parsed.currency,
      paymentTerms: parsed.paymentTerms,
      dueDate: parsed.dueDate,
      status: "draft",
      generatedByVoice: true,
      items,
    });

    return {
      executed: true,
      tool: "invoices.create_draft",
      data: row,
      targetScreen: "invoices",
      message: "تم إنشاء مسودة الفاتورة.",
    };
  }

  private executeSendInvoice(args: Record<string, unknown>): AgentActionResult {
    const parsed = invoiceSendArgsSchema.parse(args);
    return {
      executed: false,
      tool: "invoices.send",
      data: parsed,
      targetScreen: "invoices",
      message: "إرسال الفواتير غير مربوط بالكامل بعد. افتح مسودة الفاتورة أولاً.",
    };
  }

  private async executeSendReminder(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = invoiceReminderArgsSchema.parse(args);
    const invoice = await this.resolveInvoice(parsed.invoiceId ?? parsed.invoiceNumber, parsed.clientName);
    const invoiceNumber = invoice?.invoiceNumber ?? parsed.invoiceNumber ?? parsed.invoiceId ?? "invoice";
    const amount = invoice ? Number(invoice.total) : parsed.amount ?? 0;
    const currency = invoice?.currency ?? parsed.currency;
    const clientName = parsed.clientName ?? invoice?.title ?? "the client";
    const dueDate = String(invoice?.dueDate ?? parsed.dueDate ?? "the due date");
    const daysOverdue = parsed.daysOverdue ?? calculateDaysOverdue(invoice?.dueDate) ?? 0;

    if (!invoice && !parsed.amount) {
      return {
        executed: false,
        tool: "invoices.send_reminder",
        targetScreen: "invoices",
        message: "فهمت طلب التذكير، لكن أحتاج رقم الفاتورة أو مبلغها لإعداده.",
      };
    }

    const chaser = parsed.message
      ? {
          message: parsed.message,
          messageEn: parsed.message,
          subject: `Payment reminder: ${invoiceNumber}`,
          subjectEn: `Payment reminder: ${invoiceNumber}`,
        }
      : await this.aiService.generateChaser({
          clientName,
          invoiceNumber,
          amount,
          currency,
          daysOverdue,
          dueDate,
        });

    let markedInvoice: unknown = null;
    if (invoice?.id) {
      markedInvoice = await this.invoicesService.markChaserSent(invoice.id, chaser.message);
    }

    return {
      executed: true,
      tool: "invoices.send_reminder",
      data: {
        invoiceId: invoice?.id ?? parsed.invoiceId,
        invoiceNumber,
        clientName,
        amount,
        currency,
        dueDate,
        daysOverdue,
        subject: chaser.subject,
        message: chaser.message,
        delivery: markedInvoice ? "recorded_in_backend" : "session_only",
        invoice: markedInvoice,
      },
      targetScreen: "invoices",
      message: markedInvoice
        ? `تم تسجيل تذكير الدفع للفاتورة ${invoiceNumber}.`
        : `تذكير الدفع جاهز للفاتورة ${invoiceNumber}.`,
    };
  }

  private executeCalculateZakat(args: Record<string, unknown>): AgentActionResult {
    const parsed = zakatCalculateArgsSchema.parse(args);
    const qualifyingAssets = parsed.qualifyingAssets ?? parsed.totalIncome ?? 0;
    const aboveNisab = qualifyingAssets >= parsed.nisabThreshold;
    const zakatAmount = aboveNisab ? qualifyingAssets * parsed.zakatRate : 0;

    return {
      executed: true,
      tool: "zakat.calculate",
      data: {
        qualifyingAssets,
        nisabThreshold: parsed.nisabThreshold,
        zakatRate: parsed.zakatRate,
        aboveNisab,
        zakatAmount,
        currency: parsed.currency,
      },
      targetScreen: "zakat",
    };
  }

  private executeGenerateReport(args: Record<string, unknown>): AgentActionResult {
    const parsed = reportGenerateArgsSchema.parse(args);
    return {
      executed: false,
      tool: "reports.generate",
      data: parsed,
      targetScreen: "reports",
      message: "إنشاء التقرير يحتاج خطوة تأكيد مخصصة قبل حفظه.",
    };
  }

  private async executeDownloadInvoice(args: Record<string, unknown>): Promise<AgentActionResult> {
    const parsed = invoiceDownloadArgsSchema.parse(args);
    const invoice = await this.resolveInvoice(parsed.invoiceId ?? parsed.invoiceNumber, undefined);
    const target = invoice
      ?? (await withTimeout(this.invoicesService.list({}), 2000).catch(() => []))
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())[0]
      ?? null;

    if (!target) {
      return {
        executed: false,
        tool: "invoices.download",
        targetScreen: "invoices",
        message: "لم أجد أي فاتورة لتحميلها.",
      };
    }

    return {
      executed: true,
      tool: "invoices.download",
      data: {
        invoiceId: target.id,
        invoiceNumber: target.invoiceNumber,
        title: target.titleAr ?? target.title,
        titleEn: target.title,
        totalAmount: Number(target.total),
        subtotal: Number(target.subtotal ?? 0),
        vatAmount: Number(target.vatAmount ?? 0),
        currency: target.currency,
        dueDate: target.dueDate ?? null,
        status: target.status,
        paymentTerms: target.paymentTerms,
        pdfUrl: target.pdfUrl ?? null,
      },
      targetScreen: "invoices",
      message: `فاتورة ${target.invoiceNumber} جاهزة للتحميل.`,
    };
  }

  private async resolveClientId(clientName: string | undefined): Promise<string | null> {
    if (!clientName) {
      return null;
    }

    const normalized = clientName.toLowerCase();
    const clients = await this.clientsService.list({});
    const match = clients.find((client) => (
      client.name.toLowerCase() === normalized
      || client.nameAr?.toLowerCase() === normalized
      || client.company?.toLowerCase() === normalized
      || client.companyAr?.toLowerCase() === normalized
    ));

    return match?.id ?? null;
  }

  private async resolveInvoice(invoiceRef: string | undefined, clientName: string | undefined) {
    const invoices = await withTimeout(this.invoicesService.list({}), 1500).catch(() => []);

    if (invoiceRef) {
      const normalizedRef = invoiceRef.toLowerCase();
      const directMatch = invoices.find((invoice) => (
        invoice.id.toLowerCase() === normalizedRef
        || invoice.invoiceNumber.toLowerCase() === normalizedRef
      ));

      if (directMatch) {
        return directMatch;
      }
    }

    if (clientName) {
      const normalizedClient = clientName.toLowerCase();
      return invoices.find((invoice) => (
        invoice.title.toLowerCase().includes(normalizedClient)
        || invoice.titleAr?.toLowerCase().includes(normalizedClient)
      )) ?? null;
    }

    return null;
  }
}

function normalizeAliases(args: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...args };

  normalized.amount ??= args.total ?? args.subtotal ?? args.value;
  normalized.clientName ??= args.client ?? args.customerName ?? args.customer ?? args.recipient ?? args.to;
  normalized.merchantName ??= args.merchant ?? args.vendor;
  normalized.description ??= args.note ?? args.memo ?? args.title;
  normalized.transactionDate ??= args.date;
  normalized.invoiceId ??= args.id;
  normalized.invoiceNumber ??= args.invoice ?? args.number;
  normalized.query ??= args.name ?? args.clientName ?? args.client;

  return normalized;
}

function zodMissingFields(error: z.ZodError): string[] {
  const fields = error.issues.map((issue) => issue.path.join(".")).filter(Boolean);
  return fields.length > 0 ? [...new Set(fields)] : ["details"];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateDaysOverdue(value: unknown): number | undefined {
  if (!value) {
    return undefined;
  }

  const dueDate = new Date(String(value));
  if (Number.isNaN(dueDate.getTime())) {
    return undefined;
  }

  return Math.max(0, Math.ceil((Date.now() - dueDate.getTime()) / 86400000));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  });
}
