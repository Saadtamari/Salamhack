import { eq, sum, count, desc, gte, and } from "drizzle-orm";
import { db } from "../../infrastructure/database/db.js";
import {
  clients,
  invoices,
  transactions,
  zakatRecords,
  purificationRecords,
} from "../../infrastructure/database/schema.js";

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  invoices: {
    total: number;
    paid: number;
    overdue: number;
    draft: number;
    totalAmount: number;
    overdueAmount: number;
  };
  clients: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  zakat: {
    totalDue: number;
    totalPaid: number;
    pending: number;
  };
  purification: {
    totalAmount: number;
    purified: number;
    pending: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: string;
    description: string | null;
    category: string | null;
    transactionDate: string;
  }>;
  overdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    title: string;
    total: string;
    dueDate: string | null;
    clientId: string | null;
  }>;
}

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const [
      incomeResult,
      expenseResult,
      invoiceStats,
      overdueInvoiceStats,
      paidInvoiceStats,
      draftInvoiceStats,
      invoiceTotalAmount,
      overdueAmount,
      clientStats,
      highRiskClients,
      mediumRiskClients,
      zakatDue,
      zakatPaid,
      purificationTotal,
      purificationDone,
      recentTxns,
      overdueInvs,
    ] = await Promise.all([
      // Income
      db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.type, "income")),
      // Expenses
      db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.type, "expense")),
      // Invoice count
      db.select({ count: count() }).from(invoices),
      // Overdue invoices count
      db.select({ count: count() }).from(invoices).where(eq(invoices.status, "overdue")),
      // Paid invoices count
      db.select({ count: count() }).from(invoices).where(eq(invoices.status, "paid")),
      // Draft invoices count
      db.select({ count: count() }).from(invoices).where(eq(invoices.status, "draft")),
      // Total invoice amount
      db.select({ total: sum(invoices.total) }).from(invoices),
      // Overdue amount
      db.select({ total: sum(invoices.total) }).from(invoices).where(eq(invoices.status, "overdue")),
      // Client count
      db.select({ count: count() }).from(clients),
      // High risk clients
      db.select({ count: count() }).from(clients).where(eq(clients.riskLevel, "high")),
      // Medium risk clients
      db.select({ count: count() }).from(clients).where(eq(clients.riskLevel, "medium")),
      // Zakat due
      db.select({ total: sum(zakatRecords.zakatAmount) }).from(zakatRecords).where(eq(zakatRecords.paid, false)),
      // Zakat paid
      db.select({ total: sum(zakatRecords.zakatAmount) }).from(zakatRecords).where(eq(zakatRecords.paid, true)),
      // Purification total
      db.select({ total: sum(purificationRecords.amount) }).from(purificationRecords),
      // Purification done
      db.select({ total: sum(purificationRecords.amount) }).from(purificationRecords).where(eq(purificationRecords.purified, true)),
      // Recent transactions (last 10)
      db.select().from(transactions).orderBy(desc(transactions.transactionDate), desc(transactions.createdAt)).limit(10),
      // Overdue invoices
      db.select().from(invoices).where(eq(invoices.status, "overdue")).orderBy(desc(invoices.dueDate)).limit(10),
    ]);

    const totalIncome = Number(incomeResult[0]?.total ?? 0);
    const totalExpenses = Number(expenseResult[0]?.total ?? 0);
    const zakatDueAmount = Number(zakatDue[0]?.total ?? 0);
    const zakatPaidAmount = Number(zakatPaid[0]?.total ?? 0);
    const purificationTotalAmount = Number(purificationTotal[0]?.total ?? 0);
    const purificationDoneAmount = Number(purificationDone[0]?.total ?? 0);

    return {
      totalBalance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      invoices: {
        total: invoiceStats[0]?.count ?? 0,
        paid: paidInvoiceStats[0]?.count ?? 0,
        overdue: overdueInvoiceStats[0]?.count ?? 0,
        draft: draftInvoiceStats[0]?.count ?? 0,
        totalAmount: Number(invoiceTotalAmount[0]?.total ?? 0),
        overdueAmount: Number(overdueAmount[0]?.total ?? 0),
      },
      clients: {
        total: clientStats[0]?.count ?? 0,
        highRisk: highRiskClients[0]?.count ?? 0,
        mediumRisk: mediumRiskClients[0]?.count ?? 0,
        lowRisk: (clientStats[0]?.count ?? 0) - (highRiskClients[0]?.count ?? 0) - (mediumRiskClients[0]?.count ?? 0),
      },
      zakat: {
        totalDue: zakatDueAmount,
        totalPaid: zakatPaidAmount,
        pending: zakatDueAmount,
      },
      purification: {
        totalAmount: purificationTotalAmount,
        purified: purificationDoneAmount,
        pending: purificationTotalAmount - purificationDoneAmount,
      },
      recentTransactions: recentTxns.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        transactionDate: t.transactionDate,
      })),
      overdueInvoices: overdueInvs.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        title: i.title,
        total: i.total,
        dueDate: i.dueDate,
        clientId: i.clientId,
      })),
    };
  }
}
