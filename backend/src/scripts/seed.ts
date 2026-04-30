import { db } from "../infrastructure/database/db.js";
import {
  clients,
  contractFlags,
  contracts,
  type NewClientRow,
  type NewContractFlagRow,
  type NewContractRow,
  type NewInvoiceItemRow,
  type NewInvoiceRow,
  type NewReportRow,
  type NewTransactionRow,
  type NewVoiceLogRow,
  type NewZakatRecordRow,
  invoiceItems,
  invoices,
  purificationRecords,
  reports,
  transactions,
  voiceLogs,
  zakatRecords,
} from "../infrastructure/database/schema.js";
import { masrafSeedData } from "./masraf-seed-data.js";

function seedId(index: number): string {
  return `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

const clientIds = masrafSeedData.clients.map((_, index) => seedId(index + 1));
const invoiceIds = masrafSeedData.invoices.map((_, index) => seedId(101 + index));
const transactionIds = masrafSeedData.transactions.map((_, index) => seedId(201 + index));
const contractIds = masrafSeedData.contracts.map((_, index) => seedId(301 + index));
const contractFlagIds = masrafSeedData.contractFlags.map((_, index) => seedId(401 + index));
const voiceLogIds = masrafSeedData.voiceCommands.map((_, index) => seedId(501 + index));
const reportId = seedId(601);
const zakatRecordId = seedId(701);

async function resetTables() {
  await db.transaction(async (tx) => {
    await tx.delete(purificationRecords);
    await tx.delete(voiceLogs);
    await tx.delete(contractFlags);
    await tx.delete(invoiceItems);
    await tx.delete(contracts);
    await tx.delete(invoices);
    await tx.delete(transactions);
    await tx.delete(reports);
    await tx.delete(zakatRecords);
    await tx.delete(clients);
  });
}

async function main() {
  await resetTables();

  const clientRows: NewClientRow[] = masrafSeedData.clients.map((client, index) => ({
    id: clientIds[index],
    name: client.name,
    nameAr: client.name,
    company: client.name,
    companyAr: client.name,
    riskLevel: client.risk,
    riskScore: String(client.riskScore),
    totalInvoiced: String(client.totalInvoiced),
    totalPaid: String(client.totalPaid),
    totalOverdue: String(client.overdue),
    avgPaymentDays: client.avgDays,
    invoicesCount: client.invoicesCount,
    latePaymentsCount: client.overdue > 0 ? 1 : 0,
  }));

  await db.insert(clients).values(clientRows);

  const clientIdByName = new Map(
    masrafSeedData.clients.map((client, index) => [client.name, clientIds[index]]),
  );

  const invoiceRows: NewInvoiceRow[] = masrafSeedData.invoices.map((invoice, index) => ({
    id: invoiceIds[index],
    clientId: clientIdByName.get(invoice.clientName) ?? null,
    invoiceNumber: invoice.invoiceNumber,
    title: invoice.title,
    titleAr: invoice.title,
    subtotal: String(invoice.amount),
    vatAmount: "0",
    total: String(invoice.amount),
    currency: masrafSeedData.user.currency,
    paymentTerms: "net_30" as const,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    paidAt: invoice.status === "paid" ? new Date(`${invoice.dueDate}T00:00:00.000Z`) : null,
    viewedAt: invoice.status === "sent" || invoice.status === "overdue" ? new Date(`${invoice.issueDate}T00:00:00.000Z`) : null,
    sentAt: invoice.status !== "draft" ? new Date(`${invoice.issueDate}T00:00:00.000Z`) : null,
    generatedByVoice: false,
    chaserSent: invoice.status === "overdue",
    chaserSentAt: invoice.status === "overdue" ? new Date(`${invoice.dueDate}T00:00:00.000Z`) : null,
    chaserMessage: invoice.status === "overdue" ? "يرجى سداد الفاتورة المتأخرة" : null,
  }));

  await db.insert(invoices).values(invoiceRows);

  const invoiceItemRows: NewInvoiceItemRow[] = invoiceRows.map((invoice, index) => ({
    id: seedId(801 + index),
    invoiceId: invoiceIds[index],
    description: masrafSeedData.invoices[index].title,
    descriptionAr: masrafSeedData.invoices[index].title,
    quantity: "1",
    unitPrice: invoice.total,
    total: invoice.total,
    sortOrder: 0,
  }));

  await db.insert(invoiceItems).values(invoiceItemRows);

  const transactionRows: NewTransactionRow[] = masrafSeedData.transactions.map((transaction, index) => ({
    id: transactionIds[index],
    type: transaction.type,
    amount: String(Math.abs(transaction.amount)),
    currency: masrafSeedData.user.currency,
    category: transaction.category,
    description: transaction.description,
    descriptionAr: transaction.descriptionAr,
    merchantName: transaction.merchantName,
    reference: `TX-${String(index + 1).padStart(3, "0")}`,
    transactionDate: transaction.date,
    isHalal: true,
    needsPurification: false,
  }));

  await db.insert(transactions).values(transactionRows);

  const contractRows: NewContractRow[] = masrafSeedData.contracts.map((contract, index) => ({
    id: contractIds[index],
    clientId: clientIdByName.get(contract.clientName) ?? null,
    title: contract.title,
    titleAr: contract.title,
    filePath: `contracts/${String(index + 1).padStart(2, "0")}.pdf`,
    fileUrl: null,
    fileSize: 524288,
    originalFilename: `${contract.title}.pdf`,
    analysisStatus: contract.status === "analyzed" ? ("completed" as const) : ("pending" as const),
    analysisResult: {
      summary: contract.title,
      status: contract.status,
      flagsCount: contract.flagsCount,
      criticalFlags: contract.criticalFlags,
    },
    keyTerms: ["payment", "scope", "termination"],
    paymentAmount: String(contract.amount),
    paymentSchedule: "50% upfront, 50% on delivery",
    contractDuration: "12 months",
    terminationClause: "Requires written notice before termination",
    analyzedAt: contract.status === "analyzed" ? new Date(`${contract.date}T00:00:00.000Z`) : null,
  }));

  await db.insert(contracts).values(contractRows);

  const contractFlagRows: NewContractFlagRow[] = masrafSeedData.contractFlags.map((flag, index) => ({
    id: contractFlagIds[index],
    contractId: contractIds[0],
    severity: flag.severity,
    title: flag.title,
    titleAr: flag.title,
    description: flag.desc,
    descriptionAr: flag.desc,
    clauseReference: flag.clause,
    recommendation: flag.recommendation,
    recommendationAr: flag.recommendation,
    sortOrder: index,
  }));

  await db.insert(contractFlags).values(contractFlagRows);

  const zakatRecordRow: NewZakatRecordRow = {
    id: zakatRecordId,
    periodStart: "2026-04-01",
    periodEnd: "2026-04-29",
    totalIncome: String(masrafSeedData.stats.totalIncome),
    qualifyingAssets: String(masrafSeedData.zakat.eligible),
    nisabThreshold: String(masrafSeedData.zakat.nisab),
    aboveNisab: masrafSeedData.zakat.aboveNisab,
    zakatRate: String(masrafSeedData.zakat.rate),
    zakatAmount: String(masrafSeedData.zakat.amount),
    paid: false,
    currency: masrafSeedData.user.currency,
    calculationDetails: {
      totalAssets: masrafSeedData.zakat.totalAssets,
      eligible: masrafSeedData.zakat.eligible,
      rate: masrafSeedData.zakat.rate,
    },
  };

  await db.insert(zakatRecords).values(zakatRecordRow);

  const reportRow: NewReportRow = {
    id: reportId,
    periodMonth: 4,
    periodYear: 2026,
    totalIncome: String(masrafSeedData.stats.totalIncome),
    totalExpenses: String(masrafSeedData.stats.totalExpenses),
    netProfit: String(masrafSeedData.user.balance),
    invoicesSent: masrafSeedData.invoices.length,
    invoicesPaid: masrafSeedData.invoices.filter((invoice) => invoice.status === "paid").length,
    invoicesOverdue: masrafSeedData.invoices.filter((invoice) => invoice.status === "overdue").length,
    topClientId: clientIds[0],
    topCategory: "software_tools",
    aiSummary: "April performance is healthy with strong income and controlled operating costs.",
    aiSummaryAr: "أداء أبريل جيد مع تدفقات دخل قوية وتكاليف تشغيل منضبطة.",
    pdfPath: "reports/report-2026-04.pdf",
  };

  await db.insert(reports).values(reportRow);

  const voiceLogRows: NewVoiceLogRow[] = masrafSeedData.voiceCommands.map((command, index) => ({
    id: voiceLogIds[index],
    transcript: command,
    intent: index === 0
      ? "check_balance"
      : index === 1
        ? "create_invoice"
        : index === 2
          ? "send_reminder"
          : index === 3
            ? "monthly_spend"
            : index === 4
              ? "calculate_zakat"
              : index === 5
                ? "navigate_invoices"
                : "worst_client",
    actionTaken: index === 5 ? "navigate" : "handled",
    responseText: "تم تنفيذ الطلب بنجاح.",
    sourcePage: index === 5 ? "dashboard" : "voice",
    navigatedTo: index === 5 ? "invoices" : null,
    voiceUsed: "abdullah" as const,
    processingTimeMs: 850 + index * 40,
    success: true,
  }));

  await db.insert(voiceLogs).values(voiceLogRows);

  console.log("Masraf seed completed successfully.");
}

main().catch((error) => {
  console.error("Masraf seed failed:", error);
  process.exitCode = 1;
});
