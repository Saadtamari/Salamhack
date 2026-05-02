"use client";
import React, { useRef, useState } from "react";
import { logout as authLogout } from "@/lib/auth";
import {
  Alert02Icon,
  AiVoiceIcon,
  Camera01Icon,
  Car03Icon,
  ChartBarLineIcon,
  ComputerIcon,
  Invoice03Icon,
  Money03Icon,
  Restaurant02Icon,
  UserMultipleIcon,
  ZakatIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { MASRAF_DATA } from "@/lib/data";
import { apiConfig, masrafApi } from "@/lib/api";
import { profileInitials } from "@/lib/app-preferences";
import { useMasrafApp } from "@/lib/masraf-context";
import { fmt, IslamicPattern, Avatar, StatusBadge, RiskBadge, MiniChart, DonutChart, RunwayIndicator, HalalBadge } from "./ui";
import { MasrafIcon } from "./icons";
import { InvoicePreviewModal, ChaserModal, ReceiptScanner, PurificationLedger } from "./Modals";
import type { Invoice } from "@/lib/data";

const D = MASRAF_DATA;
type Page = "dashboard" | "invoices" | "clients" | "expenses" | "zakat" | "contracts" | "reports" | "notifications" | "settings";

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function DashboardScreen({ onNavigate, showBalance = true, toast }: {
  onNavigate: (page: string) => void;
  showBalance?: boolean;
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  void toast;
  const { data: D, profile } = useMasrafApp();
  const overdue = D.invoices.filter((i) => i.status === "overdue");
  const quickActions: { icon: IconSvgElement; label: string; page: Page }[] = [
    { icon: Invoice03Icon, label: "فاتورة جديدة", page: "invoices" },
    { icon: UserMultipleIcon, label: "عميل جديد", page: "clients" },
    { icon: ZakatIcon, label: "احسب الزكاة", page: "zakat" },
    { icon: ChartBarLineIcon, label: "التقارير", page: "reports" },
  ];
  const txIcon = (category: string, type: string) => {
    if (type === "income") return Money03Icon;
    if (category === "software_tools") return ComputerIcon;
    if (category === "food_dining") return Restaurant02Icon;
    return Car03Icon;
  };
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1B5E20", padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={profileInitials(profile)} size={36} color="#FFFDF8" />
              <div>
                <div style={{ fontSize: 12, color: "#D8D0C2", lineHeight: 1 }}>مرحباً،</div>
                <div style={{ fontSize: 14, color: "#FFFDF8", fontWeight: 600 }}>{profile.name}</div>
              </div>
            </div>
            <button style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, width: 36, height: 36, color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</button>
          </div>
          {/* Balance Card */}
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 12, color: "#D8D0C2", marginBottom: 4 }}>الرصيد الحالي</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#FFFDF8", letterSpacing: "-1px", marginBottom: 2 }}>
              {showBalance ? fmt(D.user.balance) : "••••••"}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: "#D8D0C2" }}>الدخل هذا الشهر</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{fmt(D.stats.totalIncome)}</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: "#FFCC80" }}>مصاريف الشهر</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{fmt(D.stats.totalExpenses)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Quick Actions */}
        <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          {quickActions.map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.page)} style={{ flex: 1, background: "#FFFDF8", border: "1px solid #DDD6CA", borderRadius: 14, padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <MasrafIcon icon={a.icon} size={20} color="#11100E" />
              <span style={{ fontSize: 11, color: "#11100E", fontWeight: 800, fontFamily: "var(--font-ar)" }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <div onClick={() => onNavigate("invoices")} style={{ background: "#FFFDF8", border: "1px solid #DDD6CA", borderRadius: 16, padding: "12px 16px", marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#B3261E", display: "flex", alignItems: "center", gap: 6 }}>
                <MasrafIcon icon={Alert02Icon} size={15} color="#B3261E" strokeWidth={2} />
                {overdue.length} فواتير متأخرة
              </div>
              <div style={{ fontSize: 12, color: "#C62828", marginTop: 2 }}>إجمالي {fmt(D.stats.overdue)} — اضغط لمتابعة التحصيل</div>
            </div>
            <span style={{ color: "#B3261E", fontSize: 18 }}>‹</span>
          </div>
        )}

        <div style={{ marginBottom: 16 }}><RunwayIndicator days={47} /></div>

        {/* Cash Flow */}
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #DDD6CA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>التدفق النقدي</div>
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#6D675E" }}>
              <span><span style={{ color: "#11100E" }}>━</span> الدخل</span>
              <span><span style={{ color: "#9C7614" }}>╌</span> المصاريف</span>
            </div>
          </div>
          <MiniChart data={D.cashflow} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {D.cashflow.map((d, i) => (
              <div key={i} style={{ fontSize: 9, color: i >= 4 ? "#9C7614" : "#92897C", textAlign: "center" }}>{d.month.slice(0, 3)}{i >= 4 ? " *" : ""}</div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", border: "1px solid #DDD6CA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>آخر المعاملات</div>
            <button onClick={() => onNavigate("expenses")} style={{ fontSize: 12, color: "#11100E", background: "none", border: "none", cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>عرض الكل</button>
          </div>
          {D.transactions.slice(0, 4).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1EDE5" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "#F1EDE5", border: "1px solid #DDD6CA", color: "#11100E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MasrafIcon icon={txIcon(t.category, t.type)} size={18} color="currentColor" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#11100E" }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: "#92897C" }}>{t.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.type === "income" ? "#1B5E20" : "#11100E" }}>
                {t.type === "income" ? "+" : ""}{fmt(Math.abs(t.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export function InvoicesScreen({ onNavigate, toast }: {
  onNavigate: (page: string) => void;
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  void onNavigate;
  const { data: D, connected, usingMock, refetch } = useMasrafApp();
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [previewInv, setPreviewInv] = useState<Invoice | null>(null);
  const [chaserInv,  setChaserInv]  = useState<Invoice | null>(null);

  const tabs = [
    { key: "all",     label: "الكل",     count: D.invoices.length },
    { key: "overdue", label: "متأخرة",   count: D.invoices.filter((i) => i.status === "overdue").length },
    { key: "sent",    label: "مُرسلة",   count: D.invoices.filter((i) => i.status === "sent").length },
    { key: "paid",    label: "مدفوعة",   count: D.invoices.filter((i) => i.status === "paid").length },
  ];
  const filtered = filter === "all" ? D.invoices : D.invoices.filter((i) => i.status === filter);

  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 0", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>الفواتير</div>
          <div style={{ fontSize: 13, color: "#D8D0C2", marginBottom: 16 }}>
            <span style={{ color: "#F0C542", fontWeight: 700 }}>{fmt(D.stats.pending)}</span> مبالغ معلقة
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)} style={{ background: filter === t.key ? "#FFFDF8" : "rgba(255,255,255,0.15)", border: "none", borderRadius: "12px 12px 0 0", padding: "8px 14px", cursor: "pointer", color: filter === t.key ? "#11100E" : "#FFFDF8", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", fontFamily: "IBM Plex Sans Arabic" }}>
                {t.label} {t.count > 0 && <span style={{ background: filter === t.key ? "#11100E" : "rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, marginRight: 2 }}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {filtered.map((inv) => (
          <div key={inv.id} style={{ background: "#FFFDF8", borderRadius: 16, padding: "14px 16px", marginBottom: 10, border: "1px solid #DDD6CA" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#11100E" }}>{inv.client}</div>
                <div style={{ fontSize: 11, color: "#92897C", marginTop: 2 }}>{inv.id}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E" }}>{fmt(inv.amount)}</div>
                <div style={{ marginTop: 4 }}><StatusBadge status={inv.status} /></div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#92897C" }}>
                {inv.status === "overdue" ? <span style={{ color: "#B3261E", fontWeight: 600 }}>متأخرة {inv.daysOverdue} يوماً</span> : `استحقاق: ${inv.due}`}
              </div>
              {inv.status === "overdue" && (
                <button onClick={() => setChaserInv(inv)} style={{ fontSize: 11, color: "#11100E", background: "#F1EDE5", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>ذكّر العميل</button>
              )}
              {(inv.status === "sent" || inv.status === "paid") && (
                <button onClick={() => setPreviewInv(inv)} style={{ fontSize: 11, color: "#11100E", background: "#FFFDF8", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>معاينة PDF</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowCreate(true)} style={{ position: "fixed", bottom: 90, left: 20, width: 52, height: 52, borderRadius: "50%", background: "#1B5E20", border: "none", color: "white", fontSize: 26, cursor: "pointer", boxShadow: "0 4px 20px rgba(27,94,32,0.4)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>

      {showCreate  && <CreateInvoiceModal onClose={() => setShowCreate(false)} onToast={toast} connected={connected} usingMock={usingMock} refetch={refetch} clients={D.clients} />}
      {previewInv  && <InvoicePreviewModal invoice={previewInv} onClose={() => setPreviewInv(null)} onToast={toast} />}
      {chaserInv   && <ChaserModal invoice={chaserInv} onClose={() => setChaserInv(null)} onToast={toast} />}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onToast, connected, usingMock, refetch, clients }: {
  onClose: () => void;
  onToast?: (msg: string, type?: string, title?: string) => void;
  connected: boolean;
  usingMock: boolean;
  refetch: () => Promise<void>;
  clients: typeof D.clients;
}) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const { currency } = useMasrafApp();
  async function createInvoice() {
    const total = Number(amount);
    if (!client || !desc || !(total > 0)) return;
    if (apiConfig.useBackend && connected) {
      setCreating(true);
      try {
        const subtotal = Math.round((total / 1.16) * 100) / 100;
        await masrafApi.invoices.create({
          title: desc,
          titleAr: desc,
          subtotal,
          vatAmount: Math.round((total - subtotal) * 100) / 100,
          total,
          currency,
          paymentTerms: "net_30",
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          status: "draft",
          items: [{ description: desc, descriptionAr: desc, quantity: 1, unitPrice: subtotal, total: subtotal }],
        });
        await refetch();
        onToast?.("تم إنشاء الفاتورة في الخلفية", "success", "فاتورة جديدة");
        onClose();
        return;
      } catch {
        onToast?.("تعذر إنشاء الفاتورة في الخلفية", "error", "فاتورة جديدة");
      } finally {
        setCreating(false);
      }
      return;
    }
    if (usingMock || !apiConfig.useBackend) {
      onToast?.("تم إنشاء فاتورة تجريبية محلياً", "success", "وضع العرض");
      onClose();
    }
  }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid #DDD6CA", borderRadius: 12, fontSize: 14, fontFamily: "IBM Plex Sans Arabic, sans-serif", background: "#FAFAF8", color: "#11100E", outline: "none", boxSizing: "border-box", textAlign: "right", direction: "rtl" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#FFFDF8", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxHeight: "85vh", overflow: "auto", fontFamily: "IBM Plex Sans Arabic, sans-serif", position: "relative" }}>
        <div style={{ width: 40, height: 4, background: "#DDD6CA", borderRadius: 2, margin: "0 auto 20px" }}></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#11100E", marginBottom: 4 }}>فاتورة جديدة</div>
        <div style={{ fontSize: 12, color: "#92897C", marginBottom: 20 }}>الخطوة {step} من ٢</div>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>العميل</label>
              <select value={client} onChange={(e) => setClient(e.target.value)} style={inputStyle}>
                <option value="">اختر العميل...</option>
                {clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>وصف الخدمة</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="مثال: تصميم هوية بصرية كاملة..." style={{ ...inputStyle, height: 80, resize: "none" }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!client || !desc} style={{ background: !client || !desc ? "#DDD6CA" : "#11100E", color: !client || !desc ? "#92897C" : "#FFFDF8", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>التالي ←</button>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>المبلغ ({currency})</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="٠" style={{ ...inputStyle, fontSize: 24, fontWeight: 700, textAlign: "center" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: "#F1EDE5", color: "#11100E", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>← رجوع</button>
              <button onClick={() => void createInvoice()} disabled={creating || !amount} style={{ flex: 2, background: creating || !amount ? "#DDD6CA" : "#1B5E20", color: creating || !amount ? "#92897C" : "#FFFDF8", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: creating || !amount ? "not-allowed" : "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{creating ? "جاري..." : "✓ إنشاء الفاتورة"}</button>
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#92897C" }}>✕</button>
      </div>
    </div>
  );
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export function ClientsScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
  void onNavigate;
  const { data: D } = useMasrafApp();
  const [selected, setSelected] = useState<typeof D.clients[0] | null>(null);
  const [sort, setSort] = useState("name");
  const sorted = [...D.clients].sort((a, b) => {
    if (sort === "risk")   return b.riskScore - a.riskScore;
    if (sort === "amount") return b.totalInvoiced - a.totalInvoiced;
    return a.name.localeCompare(b.name);
  });
  if (selected) return <ClientDetail client={selected} onBack={() => setSelected(null)} />;
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>العملاء</div>
          <div style={{ fontSize: 13, color: "#D8D0C2" }}>{D.clients.length} عملاء نشطين</div>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[{ k: "name", l: "الاسم" }, { k: "risk", l: "الخطورة" }, { k: "amount", l: "الأعلى إنفاقاً" }].map((s) => (
            <button key={s.k} onClick={() => setSort(s.k)} style={{ background: sort === s.k ? "#11100E" : "#FFFDF8", color: sort === s.k ? "#FFFDF8" : "#11100E", border: "1px solid #DDD6CA", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{s.l}</button>
          ))}
        </div>
        {sorted.map((client) => (
          <div key={client.id} onClick={() => setSelected(client)} style={{ background: "#FFFDF8", borderRadius: 16, padding: "14px 16px", marginBottom: 10, border: "1px solid #DDD6CA", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar initials={client.initials} size={44} color={client.risk === "high" ? "#B3261E" : client.risk === "medium" ? "#9C7614" : "#11100E"} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>{client.name}</div>
                <RiskBadge risk={client.risk} score={client.riskScore} />
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6D675E" }}>
                <span>إجمالي: <strong>{fmt(client.totalInvoiced)}</strong></span>
                <span>متأخر: <strong style={{ color: client.overdue > 0 ? "#B3261E" : "#11100E" }}>{fmt(client.overdue)}</strong></span>
              </div>
            </div>
            <span style={{ color: "#92897C", fontSize: 18 }}>‹</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientDetail({ client, onBack }: { client: typeof D.clients[0]; onBack: () => void }) {
  const payRatio = Math.round((client.totalPaid / client.totalInvoiced) * 100);
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 30px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "6px 14px", color: "white", fontSize: 13, cursor: "pointer", marginBottom: 16, fontFamily: "IBM Plex Sans Arabic" }}>→ رجوع</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar initials={client.initials} size={56} color="#FFFDF8" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8" }}>{client.name}</div>
              <RiskBadge risk={client.risk} score={client.riskScore} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { label: "إجمالي الفواتير", value: fmt(client.totalInvoiced), color: "#11100E" },
            { label: "المدفوع",         value: fmt(client.totalPaid),      color: "#11100E" },
            { label: "المتأخر",         value: fmt(client.overdue),        color: client.overdue > 0 ? "#B3261E" : "#11100E" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "#FFFDF8", borderRadius: 14, padding: "12px 10px", border: "1px solid #DDD6CA", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#92897C", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFDF8", borderRadius: 16, padding: "16px", border: "1px solid #DDD6CA" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#11100E", marginBottom: 12 }}>معدل الدفع</div>
          <div style={{ background: "#F1EDE5", borderRadius: 10, height: 8, overflow: "hidden" }}>
            <div style={{ background: payRatio > 80 ? "#11100E" : payRatio > 50 ? "#9C7614" : "#B3261E", height: "100%", width: `${payRatio}%`, borderRadius: 10 }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#92897C" }}>متوسط أيام الدفع: <strong>{client.avgDays} يوم</strong></span>
            <span style={{ fontSize: 11, fontWeight: 700, color: payRatio > 80 ? "#11100E" : "#B3261E" }}>{payRatio}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export function ExpensesScreen({ toast }: { toast?: (msg: string, type?: string) => void }) {
  const { data: D, refetch } = useMasrafApp();
  const [showScanner, setShowScanner] = useState(false);
  const txIcon = (category: string, type: string) => {
    if (type === "income") return Money03Icon;
    if (category === "software_tools") return ComputerIcon;
    if (category === "food_dining") return Restaurant02Icon;
    return Car03Icon;
  };
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>المصاريف</div>
          <div style={{ fontSize: 13, color: "#D8D0C2" }}>أبريل ٢٠٢٦ — <span style={{ color: "#F0C542", fontWeight: 700 }}>{fmt(247)}</span> هذا الشهر</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #DDD6CA", display: "flex", alignItems: "center", gap: 20 }}>
          <DonutChart categories={D.expenseCategories} />
          <div style={{ flex: 1 }}>
            {D.expenseCategories.map((cat) => (
              <div key={cat.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#11100E" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, display: "inline-block" }}></span>
                  {cat.name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#11100E" }}>${cat.amount}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", border: "1px solid #DDD6CA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>المعاملات</div>
            <button onClick={() => setShowScanner(true)} style={{ fontSize: 11, color: "#11100E", background: "#F1EDE5", border: "1px solid #DDD6CA", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 800, fontFamily: "var(--font-ar)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <MasrafIcon icon={Camera01Icon} size={14} color="currentColor" />
              مسح إيصال
            </button>
          </div>
          {D.transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1EDE5" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "#F1EDE5", border: "1px solid #DDD6CA", color: "#11100E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MasrafIcon icon={txIcon(t.category, t.type)} size={18} color="currentColor" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#11100E" }}>{t.desc}</div>
                <div style={{ fontSize: 10, color: "#92897C", display: "flex", gap: 6, alignItems: "center" }}>
                  <span>{t.date}</span><HalalBadge halal={t.halal} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.type === "income" ? "#1B5E20" : "#11100E" }}>
                {t.type === "income" ? "+" : ""}{fmt(Math.abs(t.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showScanner && <ReceiptScanner onClose={() => setShowScanner(false)} onToast={toast} onSaved={refetch} />}
    </div>
  );
}

// ─── Zakat ────────────────────────────────────────────────────────────────────
export function ZakatScreen({ toast }: { toast?: (msg: string, type?: string) => void }) {
  const { data: D } = useMasrafApp();
  const z = D.zakat;
  const pct = Math.min(100, Math.round((z.eligible / z.nisab) * 100));
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#C6930A,#7A5906)", padding: "20px 20px 30px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.08} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>الزكاة</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>فريضة — ٢.٥٪ من المال الحول عليه الحول</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "20px", marginBottom: 16, border: "2px solid #9C761422", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#92897C", marginBottom: 6 }}>زكاتك المستحقة</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#9C7614", letterSpacing: "-2px" }}>{fmt(z.amount)}</div>
          <div style={{ background: "#FFF9E8", borderRadius: 12, padding: "8px 16px", display: "inline-block", marginTop: 12, fontSize: 12, color: "#9C7614" }}>⏳ موعد الدفع بعد {z.daysUntilDue} يوماً</div>
        </div>
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #DDD6CA" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#11100E", marginBottom: 12 }}>تفصيل الحساب</div>
          {[
            { label: "إجمالي الأصول",   value: fmt(z.totalAssets)         },
            { label: "الوعاء الزكوي",   value: fmt(z.eligible), bold: true },
            { label: "نسبة الزكاة",     value: "٢.٥٪"                     },
            { label: "الزكاة المستحقة", value: fmt(z.amount), bold: true, gold: true },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F1EDE5" }}>
              <span style={{ fontSize: 13, color: "#6D675E" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 500, color: row.gold ? "#9C7614" : "#11100E" }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFDF8", borderRadius: 16, padding: "14px 16px", border: "1px solid #DDD6CA", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6D675E", marginBottom: 8 }}>
            <span>النصاب</span>
            <strong style={{ color: "#1B5E20" }}>{pct}%</strong>
          </div>
          <div style={{ background: "#F1EDE5", borderRadius: 10, height: 10, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#1B5E20", borderRadius: 10 }} />
          </div>
        </div>
        <button onClick={() => toast?.("تم تسجيل دفع الزكاة. جزاك الله خيراً.", "success")} style={{ width: "100%", background: "linear-gradient(135deg,#C6930A,#7A5906)", color: "#FFFDF8", border: "none", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>
          أدّ زكاتك الآن ✓
        </button>
        <PurificationLedger />
      </div>
    </div>
  );
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export function ContractsScreen() {
  const { data: D, connected, refetch } = useMasrafApp();
  const [selected, setSelected] = useState<typeof D.contracts[0] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localContracts, setLocalContracts] = useState<typeof D.contracts>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const contracts = [...localContracts, ...D.contracts];
  async function uploadContract(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      if (apiConfig.useBackend && connected) {
        await masrafApi.contracts.upload({ file, title: file.name.replace(/\.[^.]+$/, ""), titleAr: file.name.replace(/\.[^.]+$/, "") });
        await refetch();
      } else {
        setLocalContracts((current) => [{
          id: Date.now(),
          title: file.name.replace(/\.[^.]+$/, ""),
          client: "عميل",
          status: "pending",
          flagsCount: 0,
          criticalFlags: 0,
          amount: 0,
          date: new Date().toLocaleDateString("ar-SA"),
        }, ...current]);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  if (selected) return <ContractDetail contract={selected} onBack={() => setSelected(null)} />;
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>العقود</div>
          <div style={{ fontSize: 13, color: "#D8D0C2" }}>تحليل بالذكاء الاصطناعي</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={(event) => void uploadContract(event.currentTarget.files?.[0])} />
        <div onClick={() => !uploading && fileRef.current?.click()} style={{ background: "#F3E5F5", border: "2px dashed #7B1FA2", borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16, cursor: uploading ? "wait" : "pointer" }}>
          <div style={{ fontSize: 28 }}>📎</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#7B1FA2", marginTop: 8 }}>{uploading ? "جاري رفع العقد..." : "ارفع عقداً للتحليل"}</div>
          <div style={{ fontSize: 12, color: "#92897C", marginTop: 4 }}>PDF — يُحلّل الذكاء الاصطناعي البنود الخطرة فوراً</div>
        </div>
        {contracts.map((c) => (
          <div key={c.id} onClick={() => setSelected(c)} style={{ background: "#FFFDF8", borderRadius: 16, padding: "14px 16px", marginBottom: 10, border: "1px solid #DDD6CA", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#11100E", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "#92897C" }}>{c.client} · {c.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>{fmt(c.amount)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {c.status === "pending" ? (
                <span style={{ fontSize: 11, color: "#6D675E", background: "#F1EDE5", borderRadius: 8, padding: "4px 10px" }}>⏳ قيد التحليل...</span>
              ) : c.criticalFlags > 0 ? (
                <span style={{ fontSize: 11, color: "#B3261E", background: "#FFFDF8", borderRadius: 8, padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <MasrafIcon icon={Alert02Icon} size={13} color="#B3261E" strokeWidth={2} />
                  {c.criticalFlags} بنود حرجة
                </span>
              ) : (
                <span style={{ fontSize: 11, color: "#11100E", background: "#FFFDF8", borderRadius: 8, padding: "4px 10px" }}>✓ لا مشاكل</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractDetail({ contract, onBack }: { contract: typeof D.contracts[0]; onBack: () => void }) {
  const analysisResult = (contract as typeof contract & { analysisResult?: { flags?: { severity?: string; titleAr?: string; title?: string; descriptionAr?: string; description?: string; recommendationAr?: string; recommendation?: string; clauseReference?: string }[]; summaryAr?: string; summary?: string } }).analysisResult;
  const flags = Array.isArray(analysisResult?.flags) && analysisResult.flags.length > 0
    ? analysisResult.flags.map((flag) => ({
      severity: flag.severity || "info",
      title: flag.titleAr || flag.title || "ملاحظة",
      desc: flag.descriptionAr || flag.description || "لا يوجد وصف إضافي.",
      recommendation: flag.recommendationAr || flag.recommendation || "راجع هذا البند قبل التوقيع.",
      clause: flag.clauseReference || "—",
    }))
    : D.contractFlags;
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "6px 14px", color: "white", fontSize: 13, cursor: "pointer", marginBottom: 12, fontFamily: "IBM Plex Sans Arabic" }}>→ رجوع</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>{contract.title}</div>
          <div style={{ fontSize: 12, color: "#D8D0C2" }}>{contract.client}</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        {analysisResult?.summaryAr || analysisResult?.summary ? (
          <div style={{ background: "#F0F7F0", border: "1px solid #C8E6C9", borderRadius: 14, padding: 12, color: "#1B5E20", fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
            {analysisResult.summaryAr || analysisResult.summary}
          </div>
        ) : null}
        {flags.map((flag, i) => (
          <div key={i} style={{ background: "#FFFDF8", borderRadius: 16, padding: "16px", marginBottom: 12, border: "1px solid #DDD6CA" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 10, background: flag.severity === "critical" ? "#FFEBEE" : "#FFF3E0", color: flag.severity === "critical" ? "#B71C1C" : "#E65100" }}>
                {flag.severity === "critical" ? "حرج" : "تحذير"}
              </span>
              <span style={{ fontSize: 11, color: "#92897C" }}>البند: {flag.clause}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#11100E", marginBottom: 6 }}>{flag.title}</div>
            <div style={{ fontSize: 12, color: "#6D675E", marginBottom: 10 }}>{flag.desc}</div>
            <div style={{ background: "#F0F7F0", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#1B5E20" }}>
              💡 <strong>التوصية:</strong> {flag.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const { data: D, connected } = useMasrafApp();
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFDF8", marginBottom: 4 }}>التقارير</div>
          <div style={{ fontSize: 13, color: "#D8D0C2" }}>{connected ? "بيانات مباشرة من الخلفية" : "عرض تجريبي بدون خلفية"}</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #DDD6CA" }}>
          <div style={{ background: "#F1EDE5", borderRadius: 14, padding: "14px", fontSize: 13, color: "#11100E", lineHeight: 1.7 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 4 }}><MasrafIcon icon={AiVoiceIcon} size={15} color="#11100E" /></span>
            أداؤك المالي هذا الشهر <strong style={{ color: "#11100E" }}>ممتاز</strong>. دخلك ارتفع <strong>٦٧٪</strong> مقارنة بمارس. مصاريفك في حدود معقولة (<strong>٣١٪</strong> من الدخل).
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { label: "إجمالي الدخل",    value: fmt(D.stats.totalIncome),    delta: "+67%", pos: true  },
            { label: "إجمالي المصاريف", value: fmt(D.stats.totalExpenses),  delta: "+8%",  pos: false },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "#FFFDF8", borderRadius: 16, padding: "14px", border: "1px solid #DDD6CA" }}>
              <div style={{ fontSize: 11, color: "#92897C" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#11100E", margin: "4px 0" }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.pos ? "#11100E" : "#B3261E" }}>{s.delta} مقارنة بالشهر السابق</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", border: "1px solid #DDD6CA" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E", marginBottom: 12 }}>التدفق النقدي — ٦ أشهر</div>
          <MiniChart data={D.cashflow} />
        </div>
      </div>
    </div>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────
export function NotificationsScreen({ toast, onNavigate }: { toast?: (msg: string, type?: string, title?: string) => void; onNavigate?: (page: string) => void }) {
  void toast;
  const { data: D } = useMasrafApp();
  const overdue = D.invoices.filter((i) => i.status === "overdue");
  const notifications = [
    ...overdue.map((invoice) => ({
      id: invoice.id,
      title: `فاتورة متأخرة: ${invoice.client}`,
      body: `متأخرة ${invoice.daysOverdue} يوماً · ${fmt(invoice.amount)}`,
      critical: true,
      action: "ذكّر العميل",
      screen: "invoices",
    })),
    { id: "zakat", title: "موعد الزكاة قريب", body: `متبقي ${D.zakat.daysUntilDue} يوماً على موعد الدفع`, critical: false, action: "فتح الزكاة", screen: "zakat" },
    { id: "contract", title: "عقد يحتاج مراجعة", body: "يوجد بند يحتاج توصية قبل التوقيع", critical: true, action: "مراجعة", screen: "contracts" },
  ];

  return (
    <div style={{ minHeight: "100%", background: "#FAFAF8", paddingBottom: 24 }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 26px", color: "#FFFDF8" }}>
        <div style={{ paddingTop: 28, fontSize: 24, fontWeight: 900 }}>الإشعارات</div>
        <div style={{ fontSize: 13, color: "#A5D6A7", marginTop: 4 }}>التنبيهات الحرجة والمهام المهمة</div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {notifications.map((item) => (
          <div key={item.id} style={{ background: item.critical ? "#FFEBEE" : "#FFF9E8", border: `1px solid ${item.critical ? "#FFCDD2" : "#FFE0A3"}`, borderRadius: 16, padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: item.critical ? "#B71C1C" : "#9C7614", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MasrafIcon icon={Alert02Icon} size={18} color="currentColor" strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: item.critical ? "#B71C1C" : "#8A6400", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#5C5346", lineHeight: 1.6 }}>{item.body}</div>
                <button onClick={() => onNavigate?.(item.screen)} style={{ marginTop: 10, background: "#1B5E20", color: "#FFFDF8", border: "none", borderRadius: 9, padding: "7px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>{item.action}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
export function SettingsScreen({ toast }: { toast?: (msg: string, type?: string, title?: string) => void }) {
  const { profile, notifications, updateNotification, currency, voicePersona } = useMasrafApp();
  return (
    <div style={{ minHeight: "100%", background: "#FAFAF8", paddingBottom: 24 }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 26px", color: "#FFFDF8" }}>
        <div style={{ paddingTop: 28, fontSize: 24, fontWeight: 900 }}>الإعدادات</div>
        <div style={{ fontSize: 13, color: "#A5D6A7", marginTop: 4 }}>الحساب، التنبيهات، والثيم</div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ background: "#FFFDF8", border: "1px solid #DDD6CA", borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar initials={profileInitials(profile)} size={48} color="#1B5E20" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#11100E" }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: "#6D675E" }}>{profile.business}</div>
            </div>
          </div>
          {[
            `العملة الافتراضية: ${currency}`,
            "لغة التقارير: العربية",
            `صوت المساعد: ${voicePersona === "fatima" ? "فاطمة" : "عبدالله"}`,
            "الثيم الأخضر القديم: مفعّل",
          ].map((item) => (
            <div key={item} style={{ padding: "10px 0", borderTop: "1px solid #F1EDE5", fontSize: 13, fontWeight: 700, color: "#1B5E20" }}>{item}</div>
          ))}
        </div>
        <div style={{ background: "#FFFDF8", border: "1px solid #DDD6CA", borderRadius: 18, padding: 16 }}>
          {([
            ["overdueInvoices", "تنبيهات الفواتير"],
            ["zakatReminder", "تذكير الزكاة"],
            ["contractAnalysis", "تحليل العقود"],
            ["monthlyReports", "إشعارات التقارير"],
          ] as const).map(([key, item]) => (
            <label key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid #F1EDE5" }}>
              <span style={{ fontSize: 13, color: "#11100E", fontWeight: 800 }}>{item}</span>
              <input type="checkbox" checked={notifications[key]} onChange={(event) => updateNotification(key, event.target.checked)} style={{ accentColor: "#1B5E20", width: 18, height: 18 }} />
            </label>
          ))}
          <button onClick={() => toast?.("تم حفظ الإعدادات", "success", "الإعدادات")} style={{ width: "100%", marginTop: 14, background: "#1B5E20", color: "#FFFDF8", border: "none", borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "var(--font-ar)" }}>حفظ</button>
        </div>
        <button
          onClick={() => { authLogout(); toast?.("تم تسجيل الخروج", "info"); window.dispatchEvent(new Event("masraf:logout")); }}
          style={{ width: "100%", marginTop: 14, background: "transparent", color: "#B71C1C", border: "1px solid #B71C1C", borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "var(--font-ar)" }}
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
