import { cerebrasChatCompletion, type ChatMessage } from "../../infrastructure/ai/cerebras.js";
import { db } from "../../infrastructure/database/db.js";
import {
  clients,
  invoices,
  transactions,
  zakatRecords,
  purificationRecords,
  type TransactionRow,
} from "../../infrastructure/database/schema.js";
import { count, desc, eq, sum } from "drizzle-orm";
import { MASRAF_SYSTEM_PROMPT, CHASER_SYSTEM_PROMPT, CONTRACT_ANALYSIS_PROMPT } from "./system-prompt.js";

export interface AIChatInput {
  message: string;
  context?: {
    screen?: string;
    data?: Record<string, unknown>;
  };
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  executeAction?: boolean;
}

export interface AIChatResponse {
  message: string;
  messageEn?: string;
  action: {
    type: string;
    screen?: string;
    data?: Record<string, unknown>;
  } | null;
  actionResult?: {
    executed: boolean;
    type: string;
    data?: unknown;
    message?: string;
  };
  suggestions: string[];
}

export interface ChaserInput {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  daysOverdue: number;
  dueDate: string;
}

export interface ChaserResponse {
  message: string;
  messageEn: string;
  subject: string;
  subjectEn: string;
}

export interface ContractAnalysisInput {
  contractText: string;
  title?: string;
}

export class AIService {
  async chat(input: AIChatInput): Promise<AIChatResponse> {
    const messages: ChatMessage[] = [
      { role: "system", content: MASRAF_SYSTEM_PROMPT },
    ];

    const dataSnapshot = await this.getDataSnapshot();
    if (dataSnapshot) {
      messages.push({
        role: "system",
        content: `لقطة بيانات مباشرة من قاعدة بيانات مصرف. استخدمها فقط عند الحاجة ولا تخترع أرقاماً خارجها:\n${dataSnapshot}`,
      });
    }

    if (input.context) {
      messages.push({
        role: "system",
        content: `السياق الحالي: المستخدم في صفحة "${input.context.screen ?? "dashboard"}". البيانات المتاحة: ${JSON.stringify(input.context.data ?? {})}`,
      });
    }

    if (input.history) {
      for (const msg of input.history.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: input.message });

    let result;
    try {
      result = await cerebrasChatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1024,
      });
    } catch (error) {
      console.warn("[ai] Chat completion failed:", error instanceof Error ? error.message : error);
      return {
        message: "الخدمة الذكية مشغولة حالياً. أعد المحاولة بعد لحظات، أو اكتب لي طلباً مختصراً وسأساعدك بالخطوات الأساسية.",
        messageEn: "The AI service is busy right now. Please try again shortly.",
        action: null,
        suggestions: ["حاول مرة أخرى", "اعرض لوحة التحكم", "أنشئ فاتورة"],
      };
    }

    const content = result.choices[0]?.message?.content ?? "";

    const parsed = this.parseAIResponse(content);

    if (input.executeAction && parsed.action) {
      parsed.actionResult = await this.executeAction(parsed.action);
    }

    return parsed;
  }

  async generateChaser(input: ChaserInput): Promise<ChaserResponse> {
    const messages: ChatMessage[] = [
      { role: "system", content: CHASER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `اكتب رسالة متابعة مدفوعات للعميل "${input.clientName}" بخصوص الفاتورة رقم ${input.invoiceNumber} بمبلغ ${input.amount} ${input.currency}. الفاتورة متأخرة ${input.daysOverdue} يوم عن تاريخ الاستحقاق ${input.dueDate}.`,
      },
    ];

    let result;
    try {
      result = await cerebrasChatCompletion(messages, {
        temperature: 0.6,
        maxTokens: 512,
      });
    } catch (error) {
      console.warn("[ai] Chaser generation failed:", error instanceof Error ? error.message : error);
      return this.buildFallbackChaser(input);
    }

    const content = result.choices[0]?.message?.content ?? "";

    try {
      const parsed = JSON.parse(this.extractJson(content));
      return {
        message: parsed.message ?? content,
        messageEn: parsed.messageEn ?? "",
        subject: parsed.subject ?? `متابعة فاتورة ${input.invoiceNumber}`,
        subjectEn: parsed.subjectEn ?? `Follow-up: Invoice ${input.invoiceNumber}`,
      };
    } catch {
      return {
        message: content,
        messageEn: "",
        subject: `متابعة فاتورة ${input.invoiceNumber}`,
        subjectEn: `Follow-up: Invoice ${input.invoiceNumber}`,
      };
    }
  }

  async analyzeContract(input: ContractAnalysisInput) {
    const messages: ChatMessage[] = [
      { role: "system", content: CONTRACT_ANALYSIS_PROMPT },
      {
        role: "user",
        content: `حلل العقد التالي:\n\nعنوان: ${input.title ?? "غير محدد"}\n\nنص العقد:\n${input.contractText}`,
      },
    ];

    let result;
    try {
      result = await cerebrasChatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 2048,
      });
    } catch (error) {
      console.warn("[ai] Contract analysis failed:", error instanceof Error ? error.message : error);
      return this.buildFallbackContractAnalysis(input);
    }

    const content = result.choices[0]?.message?.content ?? "";

    try {
      return JSON.parse(this.extractJson(content));
    } catch {
      return {
        summary: content,
        summaryEn: "",
        riskLevel: "medium" as const,
        keyTerms: {},
        flags: [
          {
            severity: "info",
            title: "تم تحليل العقد",
            titleEn: "Contract analyzed",
            description: content,
            descriptionEn: "",
            clauseReference: "general",
            recommendation: "مراجعة يدوية مطلوبة",
            recommendationEn: "Manual review required",
          },
        ],
      };
    }
  }

  private parseAIResponse(content: string): AIChatResponse {
    try {
      const parsed = JSON.parse(this.extractJson(content));
      return {
        message: parsed.message ?? content,
        messageEn: parsed.messageEn ?? undefined,
        action: parsed.action ?? null,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    } catch {
      return {
        message: content,
        action: null,
        suggestions: [],
      };
    }
  }

  private extractJson(text: string): string {
    // Try to extract JSON from markdown code blocks or raw text
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find the first { ... } block
    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      return text.slice(braceStart, braceEnd + 1);
    }

    return text;
  }

  private async getDataSnapshot(): Promise<string | null> {
    try {
      const [
        clientCount,
        invoiceCount,
        overdueInvoiceCount,
        incomeTotal,
        expenseTotal,
        zakatPending,
        purificationPending,
        recentTransactions,
      ] = await Promise.all([
        db.select({ count: count() }).from(clients),
        db.select({ count: count() }).from(invoices),
        db.select({ count: count() }).from(invoices).where(eq(invoices.status, "overdue")),
        db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.type, "income")),
        db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.type, "expense")),
        db.select({ total: sum(zakatRecords.zakatAmount) }).from(zakatRecords).where(eq(zakatRecords.paid, false)),
        db.select({ total: sum(purificationRecords.amount) }).from(purificationRecords).where(eq(purificationRecords.purified, false)),
        db
          .select({
            type: transactions.type,
            amount: transactions.amount,
            currency: transactions.currency,
            category: transactions.category,
            description: transactions.description,
            transactionDate: transactions.transactionDate,
          })
          .from(transactions)
          .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
          .limit(5),
      ]);

      return JSON.stringify({
        clientsCount: clientCount[0]?.count ?? 0,
        invoicesCount: invoiceCount[0]?.count ?? 0,
        overdueInvoicesCount: overdueInvoiceCount[0]?.count ?? 0,
        totalIncome: Number(incomeTotal[0]?.total ?? 0),
        totalExpenses: Number(expenseTotal[0]?.total ?? 0),
        pendingZakat: Number(zakatPending[0]?.total ?? 0),
        pendingPurification: Number(purificationPending[0]?.total ?? 0),
        recentTransactions,
      });
    } catch (error) {
      console.warn("[ai] Failed to load data snapshot:", error instanceof Error ? error.message : error);
      return null;
    }
  }

  private async executeAction(action: NonNullable<AIChatResponse["action"]>): Promise<NonNullable<AIChatResponse["actionResult"]>> {
    try {
      switch (action.type) {
        case "create_client":
          return await this.executeCreateClient(action.data ?? {});
        case "add_expense":
          return await this.executeAddExpense(action.data ?? {});
        case "create_invoice":
          return await this.executeCreateInvoice(action.data ?? {});
        case "calculate_zakat":
          return this.executeCalculateZakat(action.data ?? {});
        case "navigate":
          return {
            executed: false,
            type: action.type,
            message: "Navigation is returned to the frontend to perform in the browser.",
          };
        default:
          return {
            executed: false,
            type: action.type,
            message: "Unsupported action type.",
          };
      }
    } catch (error) {
      return {
        executed: false,
        type: action.type,
        message: error instanceof Error ? error.message : "Action execution failed.",
      };
    }
  }

  private async executeCreateClient(data: Record<string, unknown>) {
    const name = asText(data.name ?? data.clientName);
    if (!name) {
      return { executed: false, type: "create_client", message: "Client name is required." };
    }

    const [row] = await db.insert(clients).values({
      name,
      email: asText(data.email),
      phone: asText(data.phone),
    }).returning();

    return { executed: true, type: "create_client", data: row };
  }

  private async executeAddExpense(data: Record<string, unknown>) {
    const amount = asNumber(data.amount);
    if (!amount || amount <= 0) {
      return { executed: false, type: "add_expense", message: "Positive amount is required." };
    }

    const category = asExpenseCategory(data.category);
    const [row] = await db.insert(transactions).values({
      type: "expense",
      amount: amount.toFixed(2),
      currency: asText(data.currency) ?? "USD",
      category,
      description: asText(data.description) ?? "AI-created expense",
      transactionDate: asDate(data.transactionDate) ?? new Date().toISOString().slice(0, 10),
      isHalal: typeof data.isHalal === "boolean" ? data.isHalal : true,
      needsPurification: typeof data.needsPurification === "boolean" ? data.needsPurification : false,
    }).returning();

    return { executed: true, type: "add_expense", data: row };
  }

  private async executeCreateInvoice(data: Record<string, unknown>) {
    const title = asText(data.title) ?? "AI-created invoice";
    const amount = asNumber(data.amount ?? data.total ?? data.subtotal);
    if (!amount || amount <= 0) {
      return { executed: false, type: "create_invoice", message: "Positive amount is required." };
    }

    const [row] = await db.insert(invoices).values({
      invoiceNumber: `AI-${Date.now()}`,
      title,
      subtotal: amount.toFixed(2),
      vatAmount: "0.00",
      total: amount.toFixed(2),
      currency: asText(data.currency) ?? "USD",
      status: "draft",
    }).returning();

    return { executed: true, type: "create_invoice", data: row };
  }

  private executeCalculateZakat(data: Record<string, unknown>) {
    const qualifyingAssets = asNumber(data.qualifyingAssets ?? data.totalIncome) ?? 0;
    const nisabThreshold = asNumber(data.nisabThreshold) ?? 5200;
    const zakatRate = asNumber(data.zakatRate) ?? 0.025;
    const aboveNisab = qualifyingAssets >= nisabThreshold;
    const zakatAmount = aboveNisab ? qualifyingAssets * zakatRate : 0;

    return {
      executed: true,
      type: "calculate_zakat",
      data: {
        qualifyingAssets,
        nisabThreshold,
        zakatRate,
        aboveNisab,
        zakatAmount,
      },
    };
  }

  private buildFallbackChaser(input: ChaserInput): ChaserResponse {
    return {
      subject: `متابعة الفاتورة ${input.invoiceNumber}`,
      subjectEn: `Follow-up: Invoice ${input.invoiceNumber}`,
      message: `مرحباً ${input.clientName}،\n\nأود تذكيركم بلطف بأن الفاتورة رقم ${input.invoiceNumber} بمبلغ ${input.amount} ${input.currency} مستحقة منذ ${input.dueDate} ومتأخرة حالياً ${input.daysOverdue} يوم.\n\nنقدّر تعاونكم في إتمام السداد في أقرب وقت ممكن، ويسعدني مساعدتكم إذا كنتم تحتاجون أي تفاصيل إضافية.\n\nمع الشكر والتقدير.`,
      messageEn: `Hello ${input.clientName},\n\nThis is a polite reminder that invoice ${input.invoiceNumber} for ${input.amount} ${input.currency}, due on ${input.dueDate}, is currently ${input.daysOverdue} days overdue.\n\nI would appreciate payment at your earliest convenience and will gladly help if you need any additional details.\n\nThank you.`,
    };
  }

  private buildFallbackContractAnalysis(input: ContractAnalysisInput) {
    const lowerText = input.contractText.toLowerCase();
    const flags = [];

    if (lowerText.includes("termination") || lowerText.includes("إنهاء")) {
      flags.push({
        severity: "warning",
        title: "بند إنهاء يحتاج مراجعة",
        titleEn: "Termination clause needs review",
        description: "يوجد في العقد بند متعلق بالإنهاء، ويجب التأكد من مدة الإشعار والغرامات.",
        descriptionEn: "The contract includes termination language; review notice periods and penalties.",
        clauseReference: "termination",
        recommendation: "راجع شروط الإنهاء مع مختص قبل التوقيع.",
        recommendationEn: "Review termination terms with a specialist before signing.",
      });
    }

    if (lowerText.includes("exclusive") || lowerText.includes("حصري")) {
      flags.push({
        severity: "warning",
        title: "التزام حصري",
        titleEn: "Exclusivity obligation",
        description: "قد يتضمن العقد التزاماً حصرياً يحد من العمل مع عملاء آخرين.",
        descriptionEn: "The contract may include an exclusivity obligation that limits work with other clients.",
        clauseReference: "exclusivity",
        recommendation: "حدد نطاق الحصرية ومدتها بوضوح.",
        recommendationEn: "Clarify the scope and duration of exclusivity.",
      });
    }

    return {
      summary: `مراجعة احتياطية للعقد${input.title ? `: ${input.title}` : ""}. لم تعمل خدمة الذكاء الاصطناعي الخارجية، لذلك تم استخدام فحص أساسي.`,
      summaryEn: `Fallback contract review${input.title ? `: ${input.title}` : ""}. The external AI service was unavailable, so a basic review was used.`,
      riskLevel: flags.length > 0 ? "medium" : "low",
      keyTerms: {},
      flags: flags.length > 0
        ? flags
        : [
            {
              severity: "info",
              title: "لا توجد إشارات واضحة",
              titleEn: "No obvious flags",
              description: "لم يتم رصد إشارات تحذيرية واضحة في الفحص الأساسي.",
              descriptionEn: "No obvious warning signs were detected in the basic review.",
              clauseReference: "general",
              recommendation: "استعن بمراجعة قانونية عند الحاجة.",
              recommendationEn: "Use legal review when needed.",
            },
          ],
    };
  }
}

function asText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asDate(value: unknown): string | undefined {
  const text = asText(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function asExpenseCategory(value: unknown): TransactionRow["category"] {
  const text = asText(value);
  const categories = new Set([
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

  return text && categories.has(text) ? text as TransactionRow["category"] : "other";
}
