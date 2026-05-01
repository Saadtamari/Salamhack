import type { MasrafData } from "./adapters";

type CompactRecord = Record<string, unknown>;

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildAgentSessionSnapshot(data: MasrafData): CompactRecord {
  const user = data.user;
  const currency = trimText(user.currency) || "USD";

  return {
    source: "frontend-session",
    currency,
    user: {
      name: trimText(user.name),
      business: trimText(user.business),
      country: trimText(user.country),
      balance: numberValue(user.balance),
      currency,
    },
    stats: {
      totalIncome: numberValue(data.stats.totalIncome),
      totalExpenses: numberValue(data.stats.totalExpenses),
      pending: numberValue(data.stats.pending),
      overdue: numberValue(data.stats.overdue),
      netProfit: numberValue(data.stats.totalIncome) - numberValue(data.stats.totalExpenses),
    },
    invoices: data.invoices.slice(0, 12).map((invoice) => ({
      id: invoice.id,
      backendId: "backendId" in invoice ? invoice.backendId : undefined,
      client: invoice.client,
      clientEn: invoice.clientEn,
      amount: numberValue(invoice.amount),
      status: invoice.status,
      due: invoice.due,
      daysOverdue: invoice.daysOverdue,
      currency: "currency" in invoice ? invoice.currency : currency,
    })),
    clients: data.clients.slice(0, 12).map((client) => ({
      id: client.id,
      backendId: "backendId" in client ? client.backendId : undefined,
      name: client.name,
      totalInvoiced: numberValue(client.totalInvoiced),
      totalPaid: numberValue(client.totalPaid),
      overdue: numberValue(client.overdue),
      avgDays: client.avgDays,
      risk: client.risk,
      riskScore: numberValue(client.riskScore),
      invoicesCount: client.invoicesCount,
    })),
    transactions: data.transactions.slice(0, 12).map((transaction) => ({
      id: transaction.id,
      backendId: "backendId" in transaction ? transaction.backendId : undefined,
      type: transaction.type,
      description: transaction.desc,
      amount: numberValue(transaction.amount),
      date: transaction.date,
      category: transaction.category,
      halal: transaction.halal,
      currency: "currency" in transaction ? transaction.currency : currency,
    })),
    expenseCategories: data.expenseCategories,
    zakat: {
      totalAssets: numberValue(data.zakat.totalAssets),
      nisab: numberValue(data.zakat.nisab),
      eligible: numberValue(data.zakat.eligible),
      rate: numberValue(data.zakat.rate),
      amount: numberValue(data.zakat.amount),
      aboveNisab: data.zakat.aboveNisab,
      daysUntilDue: data.zakat.daysUntilDue,
      lastPaid: data.zakat.lastPaid,
    },
    contracts: data.contracts.slice(0, 8).map((contract) => ({
      id: contract.id,
      backendId: "backendId" in contract ? contract.backendId : undefined,
      title: contract.title,
      client: contract.client,
      status: contract.status,
      flagsCount: contract.flagsCount,
      criticalFlags: contract.criticalFlags,
      amount: numberValue(contract.amount),
      date: contract.date,
    })),
  };
}
