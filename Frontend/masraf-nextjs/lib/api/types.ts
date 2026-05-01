export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  message?: string;
  error?: string;
  details?: unknown;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
export type PaymentTerms = "immediate" | "net_7" | "net_15" | "net_30" | "net_60" | "murabaha" | "musharakah";
export type TransactionType = "income" | "expense";
export type ExpenseCategory =
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
export type RiskLevel = "low" | "medium" | "high";
export type AnalysisStatus = "pending" | "analyzing" | "completed" | "failed";
export type FlagSeverity = "info" | "warning" | "critical";

export type BackendClient = {
  id: string;
  name: string;
  nameAr?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  companyAr?: string | null;
  notes?: string | null;
  riskLevel: RiskLevel;
  riskScore: string | number;
  totalInvoiced: string | number;
  totalPaid: string | number;
  totalOverdue: string | number;
  avgPaymentDays: number;
  invoicesCount: number;
  latePaymentsCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type BackendInvoiceItem = {
  id?: string;
  invoiceId?: string;
  description: string;
  descriptionAr?: string | null;
  quantity?: string | number;
  unitPrice: string | number;
  total?: string | number;
  sortOrder?: number;
};

export type BackendInvoice = {
  id: string;
  clientId?: string | null;
  invoiceNumber: string;
  title: string;
  titleAr?: string | null;
  subtotal: string | number;
  vatAmount: string | number;
  total: string | number;
  currency: string;
  paymentTerms: PaymentTerms;
  issueDate: string;
  dueDate?: string | null;
  status: InvoiceStatus;
  paidAt?: string | null;
  viewedAt?: string | null;
  sentAt?: string | null;
  murabahaTerms?: string | null;
  profitRate?: string | number | null;
  pdfPath?: string | null;
  pdfUrl?: string | null;
  generatedByVoice?: boolean;
  chaserSent?: boolean;
  chaserSentAt?: string | null;
  chaserMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  items?: BackendInvoiceItem[];
  client?: BackendClient | null;
};

export type BackendTransaction = {
  id: string;
  type: TransactionType;
  amount: string | number;
  currency: string;
  category?: ExpenseCategory | null;
  description?: string | null;
  descriptionAr?: string | null;
  merchantName?: string | null;
  reference?: string | null;
  transactionDate: string;
  isHalal: boolean;
  needsPurification: boolean;
  createdAt?: string;
};

export type ContractFlag = {
  severity: FlagSeverity;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  clauseReference?: string;
  recommendation?: string;
  recommendationAr?: string;
};

export type ContractAnalysisResult = {
  summary?: string;
  summaryAr?: string;
  flags?: ContractFlag[];
  recommendations?: string[];
  riskLevel?: RiskLevel | "critical";
  [key: string]: unknown;
};

export type BackendContract = {
  id: string;
  clientId?: string | null;
  title: string;
  titleAr?: string | null;
  filePath: string;
  fileUrl?: string | null;
  fileSize?: number | null;
  originalFilename?: string | null;
  analysisStatus: AnalysisStatus;
  analysisResult?: ContractAnalysisResult | null;
  keyTerms?: Record<string, unknown> | null;
  paymentAmount?: string | number | null;
  paymentSchedule?: string | null;
  contractDuration?: string | null;
  terminationClause?: string | null;
  analyzedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  client?: BackendClient | null;
};

export type BackendZakatRecord = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalIncome: string | number;
  qualifyingAssets: string | number;
  nisabThreshold: string | number;
  aboveNisab: boolean;
  zakatRate: string | number;
  zakatAmount: string | number;
  paid: boolean;
  paidAt?: string | null;
  currency: string;
  calculationDetails?: Record<string, unknown> | null;
  createdAt?: string;
};

export type BackendPurificationRecord = {
  id: string;
  transactionId?: string | null;
  amount: string | number;
  reason?: string | null;
  reasonAr?: string | null;
  purified: boolean;
  purifiedAt?: string | null;
  charityDestination?: string | null;
  createdAt?: string;
};

export type BackendReport = {
  id: string;
  periodMonth: number;
  periodYear: number;
  totalIncome: string | number;
  totalExpenses: string | number;
  netProfit: string | number;
  invoicesSent: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  topClientId?: string | null;
  topCategory?: ExpenseCategory | null;
  aiSummary?: string | null;
  aiSummaryAr?: string | null;
  pdfPath?: string | null;
  createdAt?: string;
};

export type DashboardStats = {
  totalBalance?: string | number;
  balance?: string | number;
  totalIncome?: string | number;
  totalExpenses?: string | number;
  netProfit?: string | number;
  pendingInvoices?: string | number;
  invoices?: {
    total?: number;
    paid?: number;
    overdue?: number;
    draft?: number;
    totalAmount?: string | number;
    overdueAmount?: string | number;
  };
  clients?: {
    total?: number;
    highRisk?: number;
    mediumRisk?: number;
    lowRisk?: number;
  };
  zakat?: {
    totalDue?: string | number;
    totalPaid?: string | number;
    pending?: string | number;
  };
  purification?: {
    totalAmount?: string | number;
    purified?: string | number;
    pending?: string | number;
  };
  recentTransactions?: Pick<BackendTransaction, "id" | "type" | "amount" | "description" | "category" | "transactionDate">[];
  overdueInvoices?: Pick<BackendInvoice, "id" | "invoiceNumber" | "title" | "total" | "dueDate" | "clientId">[];
  [key: string]: unknown;
};

export type CreateClientPayload = {
  name?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  company?: string;
  companyAr?: string;
  notes?: string;
};

export type CreateInvoicePayload = {
  clientId?: string | null;
  invoiceNumber?: string;
  title: string;
  titleAr?: string;
  subtotal: number;
  vatAmount?: number;
  total?: number;
  currency?: string;
  paymentTerms?: PaymentTerms;
  issueDate?: string;
  dueDate?: string | null;
  status?: InvoiceStatus;
  murabahaTerms?: string;
  profitRate?: number | null;
  items?: BackendInvoiceItem[];
};

export type CreateTransactionPayload = {
  type: TransactionType;
  amount: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string;
  descriptionAr?: string;
  merchantName?: string;
  reference?: string;
  transactionDate: string;
  isHalal?: boolean;
  needsPurification?: boolean;
};

export type ZakatCalculatePayload = {
  periodStart: string;
  periodEnd: string;
  totalIncome?: number;
  qualifyingAssets?: number;
  nisabThreshold?: number;
  zakatRate?: number;
  currency?: string;
  paid?: boolean;
  paidAt?: string | null;
  calculationDetails?: Record<string, unknown>;
};

export type AiAction = {
  type?: string;
  screen?: string | null;
  payload?: Record<string, unknown>;
};

export type AiChatResult = {
  message: string;
  action?: AiAction | null;
  suggestions?: string[];
};

export type VoiceProcessResult = {
  transcript: string;
  response: AiChatResult;
  audio?: {
    contentType: string;
    base64?: string;
  } | null;
  logId?: string;
};

export type PdfResult = {
  path?: string;
  url?: string;
  pdfUrl?: string;
  signedUrl?: string;
  [key: string]: unknown;
};
