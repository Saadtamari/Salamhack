// Mock data for Masraf — converted from masraf-data.js

export const MASRAF_DATA = {
  user: {
    name: "أحمد الشمري",
    business: "شمري للتصميم",
    balance: 12840.50,
    currency: "USD",
    country: "JO",
  },

  stats: {
    totalIncome: 18500,
    totalExpenses: 5660,
    pending: 4200,
    overdue: 1800,
  },

  invoices: [
    { id: "INV-2026-018", client: "شركة النجوم",    clientEn: "Al Nujoom Co",        amount: 2400, status: "overdue", due: "٥ أبريل ٢٠٢٦",    daysOverdue: 22 },
    { id: "INV-2026-019", client: "مؤسسة الأفق",   clientEn: "Al Ufuq Foundation",   amount: 1800, status: "sent",    due: "٣٠ أبريل ٢٠٢٦",   daysOverdue: 0  },
    { id: "INV-2026-020", client: "تقنية المستقبل", clientEn: "Future Tech",          amount: 3200, status: "paid",    due: "١٢ أبريل ٢٠٢٦",   daysOverdue: 0  },
    { id: "INV-2026-021", client: "مجموعة الخليج", clientEn: "Gulf Group",           amount: 950,  status: "draft",   due: "—",                 daysOverdue: 0  },
    { id: "INV-2026-022", client: "دار الإبداع",   clientEn: "Dar Al Ibda",          amount: 1450, status: "paid",    due: "٨ أبريل ٢٠٢٦",    daysOverdue: 0  },
    { id: "INV-2026-023", client: "شركة رياح",     clientEn: "Riyah Corp",           amount: 600,  status: "overdue", due: "١٠ أبريل ٢٠٢٦",   daysOverdue: 17 },
  ],

  clients: [
    { id: 1, name: "شركة النجوم",    initials: "نج", totalInvoiced: 14200, totalPaid: 9400,  overdue: 4800, avgDays: 48, risk: "high",   riskScore: 8.2, invoicesCount: 7 },
    { id: 2, name: "مؤسسة الأفق",   initials: "أف", totalInvoiced: 8600,  totalPaid: 8600,  overdue: 0,    avgDays: 12, risk: "low",    riskScore: 2.1, invoicesCount: 5 },
    { id: 3, name: "تقنية المستقبل", initials: "تق", totalInvoiced: 6400,  totalPaid: 6400,  overdue: 0,    avgDays: 18, risk: "low",    riskScore: 1.8, invoicesCount: 3 },
    { id: 4, name: "مجموعة الخليج", initials: "خل", totalInvoiced: 3200,  totalPaid: 2200,  overdue: 1000, avgDays: 35, risk: "medium", riskScore: 5.4, invoicesCount: 4 },
    { id: 5, name: "دار الإبداع",   initials: "إب", totalInvoiced: 5800,  totalPaid: 5800,  overdue: 0,    avgDays: 9,  risk: "low",    riskScore: 1.2, invoicesCount: 6 },
    { id: 6, name: "شركة رياح",     initials: "رح", totalInvoiced: 2400,  totalPaid: 1200,  overdue: 1200, avgDays: 55, risk: "high",   riskScore: 7.8, invoicesCount: 2 },
  ],

  transactions: [
    { id: 1, type: "income",  desc: "دفعة من تقنية المستقبل", amount: 3200,  date: "اليوم",    category: "invoices",       halal: true },
    { id: 2, type: "expense", desc: "Adobe Creative Cloud",   amount: -54,   date: "أمس",      category: "software_tools", halal: true },
    { id: 3, type: "expense", desc: "استضافة الخادم",          amount: -29,   date: "٢٥ أبريل", category: "software_tools", halal: true },
    { id: 4, type: "income",  desc: "دفعة من دار الإبداع",    amount: 1450,  date: "٢٤ أبريل", category: "invoices",       halal: true },
    { id: 5, type: "expense", desc: "مطعم الرياض",             amount: -42,   date: "٢٣ أبريل", category: "food_dining",    halal: true },
    { id: 6, type: "expense", desc: "أوبر",                    amount: -18,   date: "٢٢ أبريل", category: "transport",      halal: true },
    { id: 7, type: "expense", desc: "Figma Pro",               amount: -15,   date: "٢٠ أبريل", category: "software_tools", halal: true },
    { id: 8, type: "income",  desc: "دفعة جزئية من النجوم",   amount: 800,   date: "١٨ أبريل", category: "invoices",       halal: true },
  ],

  cashflow: [
    { month: "يناير", income: 9200,  expenses: 3100 },
    { month: "فبراير", income: 11400, expenses: 4200 },
    { month: "مارس",  income: 8700,  expenses: 3800 },
    { month: "أبريل", income: 14600, expenses: 5660 },
    { month: "مايو",  income: 12200, expenses: 4100 },
    { month: "يونيو", income: 13800, expenses: 4500 },
  ],

  expenseCategories: [
    { name: "برمجيات وأدوات", nameEn: "Software",  amount: 98, color: "#11100E", pct: 40 },
    { name: "طعام ومطاعم",   nameEn: "Food",       amount: 42, color: "#9C7614", pct: 17 },
    { name: "مواصلات",        nameEn: "Transport",  amount: 36, color: "#C8BCA9", pct: 15 },
    { name: "اتصالات",        nameEn: "Comms",      amount: 28, color: "#6D675E", pct: 11 },
    { name: "أخرى",           nameEn: "Other",      amount: 43, color: "#DDD6CA", pct: 17 },
  ],

  zakat: {
    totalAssets: 28400,
    nisab: 5200,
    eligible: 12840.50,
    rate: 0.025,
    amount: 321,
    aboveNisab: true,
    daysUntilDue: 38,
    lastPaid: "أبريل ٢٠٢٥",
  },

  contracts: [
    { id: 1, title: "عقد تصميم موقع شركة النجوم", client: "شركة النجوم",    status: "analyzed", flagsCount: 2, criticalFlags: 1, amount: 4800, date: "٢٠ أبريل ٢٠٢٦" },
    { id: 2, title: "اتفاقية خدمات تسويقية",       client: "مجموعة الخليج", status: "analyzed", flagsCount: 0, criticalFlags: 0, amount: 2200, date: "١٢ أبريل ٢٠٢٦" },
    { id: 3, title: "عقد تطوير تطبيق",             client: "تقنية المستقبل", status: "pending",  flagsCount: 0, criticalFlags: 0, amount: 9600, date: "٢٧ أبريل ٢٠٢٦" },
  ],

  contractFlags: [
    { severity: "critical", title: "بند تعسفي في إنهاء العقد",  desc: "يمنح العميل حق إنهاء العقد دون مدة إشعار مسبق مع احتفاظه بكامل الأعمال المنجزة", clause: "البند ١٢.٣", recommendation: "اطلب تعديل البند ليتضمن إشعاراً مسبقاً لا يقل عن ١٤ يوماً والحصول على نسبة من الأعمال المنجزة" },
    { severity: "warning",  title: "غموض في نطاق العمل",         desc: "وصف نطاق العمل فضفاض ويسمح للعميل بطلب تعديلات غير محدودة",                       clause: "البند ٣.١", recommendation: "حدد عدد مراجعات محدود وآلية لتسعير الأعمال الإضافية" },
  ],
};

export type Invoice = typeof MASRAF_DATA.invoices[0];
export type Client  = typeof MASRAF_DATA.clients[0];

// voice commands list
export const VOICE_COMMANDS = [
  "كم رصيدي؟",
  "أرسل فاتورة لشركة النجوم بمبلغ ٥٠٠ دولار",
  "ذكّر شركة النجوم بفاتورتها المتأخرة",
  "كم صرفت هذا الشهر؟",
  "احسب زكاتي",
  "خذني للفواتير",
  "مين أسوأ عميل عندي؟",
];
