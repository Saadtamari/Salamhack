import { AppError } from "../../shared/errors/app-error.js";
import { cerebrasChatCompletion } from "../../infrastructure/ai/cerebras.js";
import { buildStoragePath, getStoragePublicUrl, uploadToStorage } from "../../infrastructure/storage/supabase-storage.js";
import { generateReportPdfBuffer } from "../../lib/pdf/report-generator.js";
import { expenseCategoryEnum, type ReportRow } from "../../infrastructure/database/schema.js";
import type { ReportsRepository } from "./reports.repository.js";

type ExpenseCategory = (typeof expenseCategoryEnum.enumValues)[number];

function toExpenseCategory(value: string | null | undefined): ExpenseCategory | null {
  if (!value) return null;
  return (expenseCategoryEnum.enumValues as readonly string[]).includes(value)
    ? (value as ExpenseCategory)
    : null;
}

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
      topCategory: toExpenseCategory(aggregated.topCategory),
      aiSummary,
      aiSummaryAr,
    };

    if (existing) {
      const updated = await this.repository.update(existing.id, reportData);
      if (!updated) {
        throw new AppError("Failed to update report", 500);
      }

      return updated;
    }

    return this.repository.create(reportData);
  }

  async generatePdf(id: string) {
    const report = await this.getById(id);
    const pdfBuffer = await generateReportPdfBuffer({ report });
    const path = buildStoragePath(
      `reports/${id}`,
      `report-${report.periodYear}-${String(report.periodMonth).padStart(2, "0")}.pdf`,
    );

    try {
      const uploaded = await uploadToStorage({
        path,
        body: pdfBuffer,
        contentType: "application/pdf",
        upsert: true,
      });

      return {
        pdfPath: uploaded.path,
        pdfUrl: getStoragePublicUrl(uploaded.bucket, uploaded.path),
        stored: true,
      };
    } catch (error) {
      return {
        pdfPath: null,
        pdfUrl: null,
        stored: false,
        pdfDataUrl: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
        storageError: error instanceof Error ? error.message : "Failed to upload report PDF",
      };
    }
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
