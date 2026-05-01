import { AppError } from "../../shared/errors/app-error.js";
import { cerebrasChatCompletion } from "../../infrastructure/ai/cerebras.js";
import type { ReportRow } from "../../infrastructure/database/schema.js";
import type { ReportsRepository } from "./reports.repository.js";

const MONTHS_AR = [
  "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  list(query: { year?: number }) {
    return this.repository.list(query);
  }

  async getById(id: string): Promise<ReportRow> {
    const report = await this.repository.findById(id);

    if (!report) {
      throw new AppError("Report not found", 404);
    }

    return report;
  }

  async generate(month: number, year: number): Promise<ReportRow> {
    if (month < 1 || month > 12) {
      throw new AppError("month must be between 1 and 12", 400);
    }

    if (year < 2020 || year > 2100) {
      throw new AppError("year must be between 2020 and 2100", 400);
    }

    // Check if report already exists for this period
    const existing = await this.repository.findByPeriod(month, year);

    // Aggregate data from DB
    const aggregated = await this.repository.aggregateForPeriod(month, year);

    // Generate AI summary
    let aiSummary = "";
    let aiSummaryAr = "";
    try {
      const summaryResult = await this.generateAISummary(month, year, aggregated);
      aiSummary = summaryResult.en;
      aiSummaryAr = summaryResult.ar;
    } catch (error) {
      console.warn("[reports] AI summary generation failed:", error instanceof Error ? error.message : error);
      aiSummaryAr = `ملخص ${MONTHS_AR[month]} ${year}: الدخل ${aggregated.totalIncome.toFixed(2)} - المصروفات ${aggregated.totalExpenses.toFixed(2)} = صافي الربح ${aggregated.netProfit.toFixed(2)}`;
      aiSummary = `${MONTHS_AR[month]} ${year}: Income ${aggregated.totalIncome.toFixed(2)} - Expenses ${aggregated.totalExpenses.toFixed(2)} = Net ${aggregated.netProfit.toFixed(2)}`;
    }

    const reportData = {
      periodMonth: month,
      periodYear: year,
      totalIncome: aggregated.totalIncome.toFixed(2),
      totalExpenses: aggregated.totalExpenses.toFixed(2),
      netProfit: aggregated.netProfit.toFixed(2),
      invoicesSent: aggregated.invoicesSent,
      invoicesPaid: aggregated.invoicesPaid,
      invoicesOverdue: aggregated.invoicesOverdue,
      topClientId: aggregated.topClientId,
      topCategory: aggregated.topCategory as any,
      aiSummary,
      aiSummaryAr,
    };

    if (existing) {
      const updated = await this.repository.update(existing.id, reportData);
      return updated!;
    }

    return this.repository.create(reportData);
  }

  private async generateAISummary(
    month: number,
    year: number,
    data: {
      totalIncome: number;
      totalExpenses: number;
      netProfit: number;
      invoicesSent: number;
      invoicesPaid: number;
      invoicesOverdue: number;
    },
  ): Promise<{ ar: string; en: string }> {
    const result = await cerebrasChatCompletion(
      [
        {
          role: "system",
          content: `أنت محلل مالي. اكتب ملخصاً مالياً مختصراً (3-4 جمل) بالعربية والإنجليزية. الرد بصيغة JSON: { "ar": "...", "en": "..." }`,
        },
        {
          role: "user",
          content: `اكتب ملخصاً مالياً لشهر ${MONTHS_AR[month]} ${year}:
- الدخل: ${data.totalIncome.toFixed(2)}
- المصروفات: ${data.totalExpenses.toFixed(2)}
- صافي الربح: ${data.netProfit.toFixed(2)}
- الفواتير المرسلة: ${data.invoicesSent}
- الفواتير المدفوعة: ${data.invoicesPaid}
- الفواتير المتأخرة: ${data.invoicesOverdue}`,
        },
      ],
      { temperature: 0.5, maxTokens: 512 },
    );

    const content = result.choices[0]?.message?.content ?? "";

    try {
      const braceStart = content.indexOf("{");
      const braceEnd = content.lastIndexOf("}");
      if (braceStart !== -1 && braceEnd > braceStart) {
        return JSON.parse(content.slice(braceStart, braceEnd + 1));
      }
    } catch {
      // fallback
    }

    return { ar: content, en: content };
  }
}
