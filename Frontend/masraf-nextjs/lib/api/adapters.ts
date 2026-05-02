import { MASRAF_DATA } from "@/lib/data";
import type {
  BackendClient,
  BackendContract,
  BackendInvoice,
  BackendTransaction,
  BackendZakatRecord,
  DashboardStats,
} from "./types";

export type MasrafData = typeof MASRAF_DATA;

type UiInvoice = MasrafData["invoices"][number] & {
  backendId?: string;
  currency?: string;
  pdfUrl?: string | null;
  terms?: string;
};

type UiClient = MasrafData["clients"][number] & {
  backendId?: string;
};

type UiTransaction = MasrafData["transactions"][number] & {
  backendId?: string;
  currency?: string;
  needsPurification?: boolean;
};

type UiContract = MasrafData["contracts"][number] & {
  backendId?: string;
  fileUrl?: string | null;
  analysisResult?: BackendContract["analysisResult"];
};

const AR_DATE = new Intl.DateTimeFormat("ar-JO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function numberValue(value: string | number | null | undefined, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : AR_DATE.format(parsed);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("") || "م";
}

function overdueDays(status: BackendInvoice["status"], dueDate?: string | null) {
  if (status !== "overdue" || !dueDate) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  return Math.max(0, Math.ceil((Date.now() - due.getTime()) / 86400000));
}

function contractFlagCounts(contract: BackendContract) {
  const flags = Array.isArray(contract.analysisResult?.flags) ? contract.analysisResult.flags : [];
  return {
    flagsCount: flags.length,
    criticalFlags: flags.filter((flag) => flag.severity === "critical").length,
  };
}

export function toUiClient(client: BackendClient): UiClient {
  const name = client.nameAr || client.name;

  return {
    id: Number(client.id) || Math.abs(hashId(client.id)),
    backendId: client.id,
    name,
    initials: initials(name),
    totalInvoiced: numberValue(client.totalInvoiced),
    totalPaid: numberValue(client.totalPaid),
    overdue: numberValue(client.totalOverdue),
    avgDays: client.avgPaymentDays,
    risk: client.riskLevel,
    riskScore: numberValue(client.riskScore),
    invoicesCount: client.invoicesCount,
  };
}

export function toUiInvoice(invoice: BackendInvoice, clients: BackendClient[] = []): UiInvoice {
  const client = invoice.client ?? clients.find((item) => item.id === invoice.clientId) ?? null;
  const clientName = client?.nameAr || client?.name || invoice.titleAr || invoice.title;

  return {
    id: invoice.invoiceNumber,
    backendId: invoice.id,
    client: clientName,
    clientEn: client?.name || invoice.title,
    amount: numberValue(invoice.total),
    status: invoice.status,
    due: formatDate(invoice.dueDate),
    daysOverdue: overdueDays(invoice.status, invoice.dueDate),
    currency: invoice.currency,
    pdfUrl: invoice.pdfUrl,
    terms: invoice.paymentTerms,
  };
}

export function toUiTransaction(transaction: BackendTransaction): UiTransaction {
  const amount = Math.abs(numberValue(transaction.amount));

  return {
    id: Number(transaction.id) || Math.abs(hashId(transaction.id)),
    backendId: transaction.id,
    type: transaction.type,
    desc: transaction.descriptionAr || transaction.description || transaction.merchantName || "Transaction",
    amount: transaction.type === "expense" ? -amount : amount,
    date: formatDate(transaction.transactionDate),
    category: transaction.category || "other",
    halal: transaction.isHalal,
    currency: transaction.currency,
    needsPurification: transaction.needsPurification,
  };
}

export function toUiContract(contract: BackendContract, clients: BackendClient[] = []): UiContract {
  const client = contract.client ?? clients.find((item) => item.id === contract.clientId) ?? null;
  const counts = contractFlagCounts(contract);

  return {
    id: Number(contract.id) || Math.abs(hashId(contract.id)),
    backendId: contract.id,
    title: contract.titleAr || contract.title,
    client: client?.nameAr || client?.name || "Client",
    status: contract.analysisStatus === "completed" ? "analyzed" : "pending",
    flagsCount: counts.flagsCount,
    criticalFlags: counts.criticalFlags,
    amount: numberValue(contract.paymentAmount),
    date: formatDate(contract.createdAt),
    fileUrl: contract.fileUrl,
    analysisResult: contract.analysisResult,
  };
}

export function toUiZakat(record?: BackendZakatRecord | null) {
  if (!record) return MASRAF_DATA.zakat;

  return {
    totalAssets: numberValue(record.qualifyingAssets),
    nisab: numberValue(record.nisabThreshold),
    eligible: numberValue(record.qualifyingAssets),
    rate: numberValue(record.zakatRate, 0.025),
    amount: numberValue(record.zakatAmount),
    aboveNisab: record.aboveNisab,
    daysUntilDue: 0,
    lastPaid: record.paidAt ? formatDate(record.paidAt) : MASRAF_DATA.zakat.lastPaid,
  };
}

export function toMasrafDataFromBackend(input: {
  dashboard?: DashboardStats | null;
  clients?: BackendClient[];
  invoices?: BackendInvoice[];
  transactions?: BackendTransaction[];
  contracts?: BackendContract[];
  zakatRecords?: BackendZakatRecord[];
}): MasrafData {
  const clients = input.clients ?? [];
  const invoices = input.invoices ?? [];
  const transactions = input.transactions ?? [];
  const contracts = input.contracts ?? [];
  const latestZakat = input.zakatRecords?.[0];
  const totalIncome = numberValue(input.dashboard?.totalIncome, sumTransactions(transactions, "income"));
  const totalExpenses = numberValue(input.dashboard?.totalExpenses, sumTransactions(transactions, "expense"));
  const pending = invoices
    .filter((invoice) => ["sent", "viewed", "overdue"].includes(invoice.status))
    .reduce((total, invoice) => total + numberValue(invoice.total), 0);
  const overdue = invoices
    .filter((invoice) => invoice.status === "overdue")
    .reduce((total, invoice) => total + numberValue(invoice.total), 0);

  return {
    ...MASRAF_DATA,
    user: {
      ...MASRAF_DATA.user,
      balance: numberValue(input.dashboard?.totalBalance ?? input.dashboard?.balance, totalIncome - totalExpenses),
      currency: latestZakat?.currency || invoices[0]?.currency || transactions[0]?.currency || MASRAF_DATA.user.currency,
    },
    stats: {
      totalIncome,
      totalExpenses,
      pending,
      overdue,
    },
    clients: clients.map(toUiClient),
    invoices: invoices.map((invoice) => toUiInvoice(invoice, clients)),
    transactions: transactions.map(toUiTransaction),
    contracts: contracts.map((contract) => toUiContract(contract, clients)),
    zakat: toUiZakat(latestZakat),
  };
}

function sumTransactions(transactions: BackendTransaction[], type: BackendTransaction["type"]) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + Math.abs(numberValue(transaction.amount)), 0);
}

function hashId(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return hash || 1;
}
