import { cerebrasChatCompletion, type ChatMessage } from "../../infrastructure/ai/cerebras.js";
import { groqVisionAnalyze } from "../../infrastructure/ai/groq.js";
import { MASRAF_SYSTEM_PROMPT, CHASER_SYSTEM_PROMPT, CONTRACT_ANALYSIS_PROMPT } from "./system-prompt.js";

const RECEIPT_VISION_PROMPT = `You are an OCR receipt parser. Read the receipt image and return ONLY a JSON object with these fields:
{
  "merchantName": string (the store/restaurant name as printed),
  "merchantNameAr": string (Arabic translation/transliteration if Latin),
  "amount": number (the final total to pay, no currency symbols),
  "currency": string ("SAR" | "AED" | "USD" | "JOD" | "EGP" | "KWD" or as printed; default "SAR"),
  "category": one of ["food_dining","transport","software_tools","office_supplies","communication","marketing","education","health","rent","utilities","entertainment","other"],
  "transactionDate": string (ISO date YYYY-MM-DD; today if not visible),
  "isHalal": boolean (true unless the receipt clearly shows alcohol, pork, gambling, or interest charges),
  "needsPurification": boolean (true if any line item is haram or unclear),
  "descriptionAr": string (one short Arabic line summarizing the purchase),
  "notes": string (optional Arabic note for ambiguities; empty string if clear)
}
Output ONLY the JSON object. No markdown, no explanation.`;

const CONTRACT_VISION_PROMPT = `You are a Sharia-compliance contract reviewer. Read this contract image and return ONLY a JSON object with this shape:
{
  "summary": string (one paragraph English summary),
  "summaryAr": string (one paragraph Arabic summary),
  "riskLevel": "low" | "medium" | "high",
  "keyTerms": {
    "paymentAmount": number | null,
    "paymentSchedule": string | null,
    "contractDuration": string | null,
    "terminationClause": string | null
  },
  "flags": Array<{
    "severity": "info" | "warning" | "critical",
    "title": string,
    "titleAr": string,
    "description": string,
    "descriptionAr": string,
    "clauseReference": string,
    "recommendation": string,
    "recommendationAr": string
  }>
}
Flag riba (interest), gharar (excessive uncertainty), haram subject matter, and one-sided termination clauses. Output ONLY JSON.`;

export interface AIChatInput {
  message: string;
  context?: {
    screen?: string;
    data?: Record<string, unknown>;
  };
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AIChatResponse {
  message: string;
  messageEn?: string;
  action: {
    type: string;
    screen?: string;
    data?: Record<string, unknown>;
  } | null;
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

export interface ReceiptScanResult {
  merchantName: string;
  merchantNameAr?: string;
  amount: number;
  currency: string;
  category:
    | "food_dining"
    | "transport"
    | "software_tools"
    | "office_supplies"
    | "communication"
    | "marketing"
    | "education"
    | "health"
    | "rent"
    | "utilities"
    | "entertainment"
    | "other";
  transactionDate: string;
  isHalal: boolean;
  needsPurification: boolean;
  descriptionAr: string;
  notes?: string;
}

const RECEIPT_CATEGORY_VALUES: ReadonlyArray<ReceiptScanResult["category"]> = [
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
];

export class AIService {
  async chat(input: AIChatInput): Promise<AIChatResponse> {
    const messages: ChatMessage[] = [
      { role: "system", content: MASRAF_SYSTEM_PROMPT },
    ];

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

    const result = await cerebrasChatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1024,
    });

    const content = result.choices[0]?.message?.content ?? "";

    return this.parseAIResponse(content);
  }

  async generateChaser(input: ChaserInput): Promise<ChaserResponse> {
    const messages: ChatMessage[] = [
      { role: "system", content: CHASER_SYSTEM_PROMPT },
      {
        role: "user",
        content: `اكتب رسالة متابعة مدفوعات للعميل "${input.clientName}" بخصوص الفاتورة رقم ${input.invoiceNumber} بمبلغ ${input.amount} ${input.currency}. الفاتورة متأخرة ${input.daysOverdue} يوم عن تاريخ الاستحقاق ${input.dueDate}.`,
      },
    ];

    const result = await cerebrasChatCompletion(messages, {
      temperature: 0.6,
      maxTokens: 512,
    });

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

    const result = await cerebrasChatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

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

  async scanReceipt(imageBuffer: Buffer, mimeType: string): Promise<ReceiptScanResult> {
    const content = await groqVisionAnalyze(imageBuffer, mimeType, RECEIPT_VISION_PROMPT, {
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 800,
    });

    const today = new Date().toISOString().slice(0, 10);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(this.extractJson(content)) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    const rawCategory = typeof parsed.category === "string" ? parsed.category : "other";
    const category = (RECEIPT_CATEGORY_VALUES as readonly string[]).includes(rawCategory)
      ? (rawCategory as ReceiptScanResult["category"])
      : "other";

    const amountValue = Number(parsed.amount);
    const merchantName = typeof parsed.merchantName === "string" && parsed.merchantName.trim().length > 0
      ? parsed.merchantName.trim()
      : "Unknown merchant";

    return {
      merchantName,
      merchantNameAr: typeof parsed.merchantNameAr === "string" ? parsed.merchantNameAr : undefined,
      amount: Number.isFinite(amountValue) && amountValue > 0 ? Number(amountValue.toFixed(2)) : 0,
      currency: typeof parsed.currency === "string" && parsed.currency.trim().length > 0 ? parsed.currency.trim().toUpperCase() : "SAR",
      category,
      transactionDate: typeof parsed.transactionDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.transactionDate)
        ? parsed.transactionDate
        : today,
      isHalal: typeof parsed.isHalal === "boolean" ? parsed.isHalal : true,
      needsPurification: typeof parsed.needsPurification === "boolean" ? parsed.needsPurification : false,
      descriptionAr: typeof parsed.descriptionAr === "string" && parsed.descriptionAr.trim().length > 0
        ? parsed.descriptionAr.trim()
        : merchantName,
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
    };
  }

  async analyzeContractImage(imageBuffer: Buffer, mimeType: string, title?: string) {
    const prompt = title ? `${CONTRACT_VISION_PROMPT}\n\nTitle hint: ${title}` : CONTRACT_VISION_PROMPT;
    const content = await groqVisionAnalyze(imageBuffer, mimeType, prompt, {
      jsonMode: true,
      temperature: 0.2,
      maxTokens: 2048,
    });

    try {
      return JSON.parse(this.extractJson(content));
    } catch {
      return null;
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
}
