import { and, desc, eq, gte, lte, sql, sum, count } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import {
  reports,
  invoices,
  transactions,
  clients,
  type ReportRow,
  type NewReportRow,
} from "../../infrastructure/database/schema.js";

export interface ListReportsOptions {
  year?: number;
}

export interface AggregatedReportData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  invoicesSent: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  topClientId: string | null;
  topCategory: string | null;
}

export class ReportsRepository {
  async list(options: ListReportsOptions = {}): Promise<ReportRow[]> {
    const query = db.select().from(reports);

    if (options.year) {
      return query
        .where(eq(reports.periodYear, options.year))
        .orderBy(desc(reports.periodYear), desc(reports.periodMonth));
    }

    return query.orderBy(desc(reports.periodYear), desc(reports.periodMonth));
  }

  async findById(id: string): Promise<ReportRow | null> {
    const [row] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    return row ?? null;
  }

  async findByPeriod(month: number, year: number): Promise<ReportRow | null> {
    const [row] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.periodMonth, month), eq(reports.periodYear, year)))
      .limit(1);
    return row ?? null;
  }

  async aggregateForPeriod(month: number, year: number): Promise<AggregatedReportData> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    // Aggregate transactions
    const incomeResult = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "income"),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate),
        ),
      );

    const expenseResult = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "expense"),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate),
        ),
      );

    // Aggregate invoices
    const invoiceSentResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate),
        ),
      );

    const invoicePaidResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "paid"),
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate),
        ),
      );

    const invoiceOverdueResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "overdue"),
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate),
        ),
      );

    // Top client by invoice total
    const topClientResult = await db
      .select({
        clientId: invoices.clientId,
        total: sum(invoices.total),
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate),
        ),
      )
      .groupBy(invoices.clientId)
      .orderBy(desc(sum(invoices.total)))
      .limit(1);

    // Top expense category
    const topCategoryResult = await db
      .select({
        category: transactions.category,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.type, "expense"),
          gte(transactions.transactionDate, startDate),
          lte(transactions.transactionDate, endDate),
        ),
      )
      .groupBy(transactions.category)
      .orderBy(desc(sum(transactions.amount)))
      .limit(1);

    const totalIncome = Number(incomeResult[0]?.total ?? 0);
    const totalExpenses = Number(expenseResult[0]?.total ?? 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      invoicesSent: invoiceSentResult[0]?.count ?? 0,
      invoicesPaid: invoicePaidResult[0]?.count ?? 0,
      invoicesOverdue: invoiceOverdueResult[0]?.count ?? 0,
      topClientId: topClientResult[0]?.clientId ?? null,
      topCategory: (topCategoryResult[0]?.category as string) ?? null,
    };
  }

  async create(input: NewReportRow): Promise<ReportRow> {
    const [row] = await db.insert(reports).values(input).returning();
    return row;
  }

  async update(id: string, input: Partial<NewReportRow>): Promise<ReportRow | null> {
    const [row] = await db.update(reports).set(input).where(eq(reports.id, id)).returning();
    return row ?? null;
  }
}
