import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const business_type = pgEnum("business_type", [
  "freelancer",
  "small_business",
  "agency",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "cancelled",
]);

export const paymentTermsEnum = pgEnum("payment_terms", [
  "immediate",
  "net_7",
  "net_15",
  "net_30",
  "net_60",
  "murabaha",
  "musharakah",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
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

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

export const flagSeverityEnum = pgEnum("flag_severity", [
  "info",
  "warning",
  "critical",
]);

export const voicePersonaEnum = pgEnum("voice_persona", ["abdullah", "sha"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

export const analysisStatusEnum = pgEnum("analysis_status", [
  "pending",
  "analyzing",
  "completed",
  "failed",
]);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    email: text("email"),
    phone: text("phone"),
    company: text("company"),
    companyAr: text("company_ar"),
    notes: text("notes"),
    riskLevel: riskLevelEnum("risk_level").default("low").notNull(),
    riskScore: numeric("risk_score", { precision: 3, scale: 1 })
      .default("5.0")
      .notNull(),
    totalInvoiced: numeric("total_invoiced", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    totalPaid: numeric("total_paid", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    totalOverdue: numeric("total_overdue", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    avgPaymentDays: integer("avg_payment_days").default(0).notNull(),
    invoicesCount: integer("invoices_count").default(0).notNull(),
    latePaymentsCount: integer("late_payments_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    riskIndex: index("idx_clients_risk").on(table.riskLevel),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    invoiceNumber: text("invoice_number").notNull(),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    vatAmount: numeric("vat_amount", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").default("USD").notNull(),
    paymentTerms: paymentTermsEnum("payment_terms").default("net_30").notNull(),
    issueDate: date("issue_date").defaultNow().notNull(),
    dueDate: date("due_date"),
    status: invoiceStatusEnum("status").default("draft").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    murabahaTerms: text("murabaha_terms"),
    profitRate: numeric("profit_rate", { precision: 5, scale: 2 }),
    pdfPath: text("pdf_path"),
    pdfUrl: text("pdf_url"),
    generatedByVoice: boolean("generated_by_voice").default(false).notNull(),
    chaserSent: boolean("chaser_sent").default(false).notNull(),
    chaserSentAt: timestamp("chaser_sent_at", { withTimezone: true }),
    chaserMessage: text("chaser_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIndex: index("idx_invoices_status").on(table.status),
    clientIndex: index("idx_invoices_client").on(table.clientId),
  }),
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    descriptionAr: text("description_ar"),
    quantity: numeric("quantity", { precision: 10, scale: 2 })
      .default("1")
      .notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => ({
    invoiceIndex: index("idx_invoice_items").on(table.invoiceId),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: transactionTypeEnum("type").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").default("USD").notNull(),
    category: expenseCategoryEnum("category"),
    description: text("description"),
    descriptionAr: text("description_ar"),
    merchantName: text("merchant_name"),
    reference: text("reference"),
    transactionDate: date("transaction_date").notNull(),
    isHalal: boolean("is_halal").default(true).notNull(),
    needsPurification: boolean("needs_purification").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dateIndex: index("idx_transactions_date").on(table.transactionDate),
    categoryIndex: index("idx_transactions_category").on(table.category),
  }),
);

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    filePath: text("file_path").notNull(),
    fileUrl: text("file_url"),
    fileSize: integer("file_size"),
    originalFilename: text("original_filename"),
    analysisStatus: analysisStatusEnum("analysis_status")
      .default("pending")
      .notNull(),
    analysisResult: jsonb("analysis_result"),
    keyTerms: jsonb("key_terms"),
    paymentAmount: numeric("payment_amount", { precision: 12, scale: 2 }),
    paymentSchedule: text("payment_schedule"),
    contractDuration: text("contract_duration"),
    terminationClause: text("termination_clause"),
    analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("idx_contracts_client").on(table.clientId),
  }),
);

export const contractFlags = pgTable(
  "contract_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    severity: flagSeverityEnum("severity").notNull(),
    title: text("title").notNull(),
    titleAr: text("title_ar"),
    description: text("description").notNull(),
    descriptionAr: text("description_ar"),
    clauseReference: text("clause_reference"),
    recommendation: text("recommendation"),
    recommendationAr: text("recommendation_ar"),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => ({
    contractIndex: index("idx_contract_flags").on(table.contractId),
  }),
);

export const zakatRecords = pgTable(
  "zakat_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    totalIncome: numeric("total_income", { precision: 12, scale: 2 }).notNull(),
    qualifyingAssets: numeric("qualifying_assets", {
      precision: 12,
      scale: 2,
    }).notNull(),
    nisabThreshold: numeric("nisab_threshold", {
      precision: 12,
      scale: 2,
    }).notNull(),
    aboveNisab: boolean("above_nisab").notNull(),
    zakatRate: numeric("zakat_rate", { precision: 5, scale: 4 })
      .default("0.025")
      .notNull(),
    zakatAmount: numeric("zakat_amount", { precision: 12, scale: 2 }).notNull(),
    paid: boolean("paid").default(false).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    currency: text("currency").default("USD").notNull(),
    calculationDetails: jsonb("calculation_details"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    periodIndex: index("idx_zakat_records_period").on(
      table.periodStart,
      table.periodEnd,
    ),
  }),
);

export const purificationRecords = pgTable("purification_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  reasonAr: text("reason_ar"),
  purified: boolean("purified").default(false).notNull(),
  purifiedAt: timestamp("purified_at", { withTimezone: true }),
  charityDestination: text("charity_destination"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const voiceLogs = pgTable(
  "voice_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transcript: text("transcript"),
    intent: text("intent"),
    actionTaken: text("action_taken"),
    responseText: text("response_text"),
    sourcePage: text("source_page"),
    navigatedTo: text("navigated_to"),
    voiceUsed: voicePersonaEnum("voice_used").default("abdullah").notNull(),
    processingTimeMs: integer("processing_time_ms"),
    success: boolean("success").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("idx_voice_logs_user").on(table.intent),
  }),
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    periodMonth: integer("period_month").notNull(),
    periodYear: integer("period_year").notNull(),
    totalIncome: numeric("total_income", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    totalExpenses: numeric("total_expenses", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    netProfit: numeric("net_profit", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    invoicesSent: integer("invoices_sent").default(0).notNull(),
    invoicesPaid: integer("invoices_paid").default(0).notNull(),
    invoicesOverdue: integer("invoices_overdue").default(0).notNull(),
    topClientId: uuid("top_client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    topCategory: expenseCategoryEnum("top_category"),
    aiSummary: text("ai_summary"),
    aiSummaryAr: text("ai_summary_ar"),
    pdfPath: text("pdf_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    periodIndex: index("idx_reports_period").on(
      table.periodYear,
      table.periodMonth,
    ),
  }),
);

export type ClientRow = typeof clients.$inferSelect;
export type NewClientRow = typeof clients.$inferInsert;
export type InvoiceRow = typeof invoices.$inferSelect;
export type NewInvoiceRow = typeof invoices.$inferInsert;
export type InvoiceItemRow = typeof invoiceItems.$inferSelect;
export type NewInvoiceItemRow = typeof invoiceItems.$inferInsert;
export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
export type ContractRow = typeof contracts.$inferSelect;
export type NewContractRow = typeof contracts.$inferInsert;
export type ContractFlagRow = typeof contractFlags.$inferSelect;
export type NewContractFlagRow = typeof contractFlags.$inferInsert;
export type ZakatRecordRow = typeof zakatRecords.$inferSelect;
export type NewZakatRecordRow = typeof zakatRecords.$inferInsert;
export type PurificationRecordRow = typeof purificationRecords.$inferSelect;
export type NewPurificationRecordRow = typeof purificationRecords.$inferInsert;
export type VoiceLogRow = typeof voiceLogs.$inferSelect;
export type NewVoiceLogRow = typeof voiceLogs.$inferInsert;
export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
