import { cerebrasChatCompletion, type ChatMessage } from "../../infrastructure/ai/cerebras.js";
import { MASRAF_SYSTEM_PROMPT, CHASER_SYSTEM_PROMPT, CONTRACT_ANALYSIS_PROMPT } from "./system-prompt.js";

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
