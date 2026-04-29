"use client";
import React, { useState } from "react";
import { MASRAF_DATA } from "@/lib/data";
import { fmt, IslamicPattern, Avatar, StatusBadge, RiskBadge, MiniChart, DonutChart, RunwayIndicator, HalalBadge } from "./ui";
import { InvoicePreviewModal, ChaserModal, ReceiptScanner, PurificationLedger } from "./Modals";
import type { Invoice, Client } from "@/lib/data";

const D = MASRAF_DATA;

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function DashboardScreen({ onNavigate, showBalance = true, toast }: {
  onNavigate: (page: string) => void;
  showBalance?: boolean;
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const overdue = D.invoices.filter((i) => i.status === "overdue");
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1B5E20", padding: "20px 20px 32px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials="أش" size={36} color="#FFFFFF" />
              <div>
                <div style={{ fontSize: 12, color: "#A5D6A7", lineHeight: 1 }}>مرحباً،</div>
                <div style={{ fontSize: 14, color: "#FFFFFF", fontWeight: 600 }}>{D.user.name}</div>
              </div>
            </div>
            <button style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, width: 36, height: 36, color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🔔</button>
          </div>
          {/* Balance Card */}
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <div style={{ fontSize: 12, color: "#A5D6A7", marginBottom: 4 }}>الرصيد الحالي</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-1px", marginBottom: 2 }}>
              {showBalance ? fmt(D.user.balance) : "••••••"}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: "#A5D6A7" }}>الدخل هذا الشهر</div>
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
          {[
            { icon: "📄", label: "فاتورة جديدة", page: "invoices" },
            { icon: "👤", label: "عميل جديد",    page: "clients" },
            { icon: "🧮", label: "احسب الزكاة",  page: "zakat" },
            { icon: "📊", label: "التقارير",      page: "reports" },
          ].map((a) => (
            <button key={a.label} onClick={() => onNavigate(a.page)} style={{ flex: 1, background: "#FFFFFF", border: "1px solid #E8E5DE", borderRadius: 14, padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontSize: 10, color: "#1A1A18", fontWeight: 500, fontFamily: "IBM Plex Sans Arabic" }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <div onClick={() => onNavigate("invoices")} style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 16, padding: "12px 16px", marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#B71C1C" }}>⚠️ {overdue.length} فواتير متأخرة</div>
              <div style={{ fontSize: 12, color: "#C62828", marginTop: 2 }}>إجمالي {fmt(D.stats.overdue)} — اضغط لمتابعة التحصيل</div>
            </div>
            <span style={{ color: "#B71C1C", fontSize: 18 }}>‹</span>
          </div>
        )}

        <div style={{ marginBottom: 16 }}><RunwayIndicator days={47} /></div>

        {/* Cash Flow */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #E8E5DE" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>التدفق النقدي</div>
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#6B6B65" }}>
              <span><span style={{ color: "#1B5E20" }}>━</span> الدخل</span>
              <span><span style={{ color: "#C6930A" }}>╌</span> المصاريف</span>
            </div>
          </div>
          <MiniChart data={D.cashflow} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {D.cashflow.map((d, i) => (
              <div key={i} style={{ fontSize: 9, color: i >= 4 ? "#C6930A" : "#9C9C95", textAlign: "center" }}>{d.month.slice(0, 3)}{i >= 4 ? " *" : ""}</div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", border: "1px solid #E8E5DE" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>آخر المعاملات</div>
            <button onClick={() => onNavigate("expenses")} style={{ fontSize: 12, color: "#1B5E20", background: "none", border: "none", cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>عرض الكل</button>
          </div>
          {D.transactions.slice(0, 4).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F5F5F0" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: t.type === "income" ? "#E8F5E9" : "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {t.type === "income" ? "💰" : t.category === "software_tools" ? "💻" : t.category === "food_dining" ? "🍽️" : "🚗"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: "#9C9C95" }}>{t.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? "#1B5E20" : "#1A1A18" }}>
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
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>الفواتير</div>
          <div style={{ fontSize: 13, color: "#A5D6A7", marginBottom: 16 }}>
            <span style={{ color: "#FFB300", fontWeight: 700 }}>{fmt(D.stats.pending)}</span> مبالغ معلقة
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setFilter(t.key)} style={{ background: filter === t.key ? "#FFFFFF" : "rgba(255,255,255,0.15)", border: "none", borderRadius: "12px 12px 0 0", padding: "8px 14px", cursor: "pointer", color: filter === t.key ? "#1B5E20" : "#FFFFFF", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", fontFamily: "IBM Plex Sans Arabic" }}>
                {t.label} {t.count > 0 && <span style={{ background: filter === t.key ? "#1B5E20" : "rgba(255,255,255,0.3)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, marginRight: 2 }}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {filtered.map((inv) => (
          <div key={inv.id} style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 16px", marginBottom: 10, border: "1px solid #E8E5DE", borderRight: inv.status === "overdue" ? "4px solid #B71C1C" : inv.status === "paid" ? "4px solid #1B5E20" : "1px solid #E8E5DE" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>{inv.client}</div>
                <div style={{ fontSize: 11, color: "#9C9C95", marginTop: 2 }}>{inv.id}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18" }}>{fmt(inv.amount)}</div>
                <div style={{ marginTop: 4 }}><StatusBadge status={inv.status} /></div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#9C9C95" }}>
                {inv.status === "overdue" ? <span style={{ color: "#B71C1C", fontWeight: 600 }}>متأخرة {inv.daysOverdue} يوماً</span> : `استحقاق: ${inv.due}`}
              </div>
              {inv.status === "overdue" && (
                <button onClick={() => setChaserInv(inv)} style={{ fontSize: 11, color: "#7B1FA2", background: "#F3E5F5", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>ذكّر العميل</button>
              )}
              {(inv.status === "sent" || inv.status === "paid") && (
                <button onClick={() => setPreviewInv(inv)} style={{ fontSize: 11, color: "#1B5E20", background: "#E8F5E9", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>معاينة PDF</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowCreate(true)} style={{ position: "fixed", bottom: 90, left: 20, width: 52, height: 52, borderRadius: "50%", background: "#1B5E20", border: "none", color: "white", fontSize: 26, cursor: "pointer", boxShadow: "0 4px 20px rgba(27,94,32,0.4)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>

      {showCreate  && <CreateInvoiceModal onClose={() => setShowCreate(false)} />}
      {previewInv  && <InvoicePreviewModal invoice={previewInv} onClose={() => setPreviewInv(null)} onToast={toast} />}
      {chaserInv   && <ChaserModal invoice={chaserInv} onClose={() => setChaserInv(null)} onToast={toast} />}
    </div>
  );
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", border: "1px solid #E8E5DE", borderRadius: 12, fontSize: 14, fontFamily: "IBM Plex Sans Arabic, sans-serif", background: "#FAFAF8", color: "#1A1A18", outline: "none", boxSizing: "border-box", textAlign: "right", direction: "rtl" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxHeight: "85vh", overflow: "auto", fontFamily: "IBM Plex Sans Arabic, sans-serif", position: "relative" }}>
        <div style={{ width: 40, height: 4, background: "#E8E5DE", borderRadius: 2, margin: "0 auto 20px" }}></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A18", marginBottom: 4 }}>فاتورة جديدة</div>
        <div style={{ fontSize: 12, color: "#9C9C95", marginBottom: 20 }}>الخطوة {step} من ٢</div>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>العميل</label>
              <select value={client} onChange={(e) => setClient(e.target.value)} style={inputStyle}>
                <option value="">اختر العميل...</option>
                {D.clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>وصف الخدمة</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="مثال: تصميم هوية بصرية كاملة..." style={{ ...inputStyle, height: 80, resize: "none" }} />
            </div>
            <button onClick={() => setStep(2)} disabled={!client || !desc} style={{ background: !client || !desc ? "#E8E5DE" : "#1B5E20", color: !client || !desc ? "#9C9C95" : "#FFFFFF", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>التالي ←</button>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>المبلغ (USD)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="٠" style={{ ...inputStyle, fontSize: 24, fontWeight: 700, textAlign: "center" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, background: "#F5F5F0", color: "#1A1A18", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>← رجوع</button>
              <button onClick={onClose} style={{ flex: 2, background: "#1B5E20", color: "#FFFFFF", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>✓ إنشاء الفاتورة</button>
            </div>
          </div>
        )}
        <button onClick={onClose} style={{ position: "absolute", top: 20, left: 20, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9C9C95" }}>✕</button>
      </div>
    </div>
  );
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export function ClientsScreen({ onNavigate }: { onNavigate: (page: string) => void }) {
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
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>العملاء</div>
          <div style={{ fontSize: 13, color: "#A5D6A7" }}>{D.clients.length} عملاء نشطين</div>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[{ k: "name", l: "الاسم" }, { k: "risk", l: "الخطورة" }, { k: "amount", l: "الأعلى إنفاقاً" }].map((s) => (
            <button key={s.k} onClick={() => setSort(s.k)} style={{ background: sort === s.k ? "#1B5E20" : "#FFFFFF", color: sort === s.k ? "#FFFFFF" : "#1A1A18", border: "1px solid #E8E5DE", borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{s.l}</button>
          ))}
        </div>
        {sorted.map((client) => (
          <div key={client.id} onClick={() => setSelected(client)} style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 16px", marginBottom: 10, border: "1px solid #E8E5DE", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar initials={client.initials} size={44} color={client.risk === "high" ? "#B71C1C" : client.risk === "medium" ? "#C6930A" : "#1B5E20"} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>{client.name}</div>
                <RiskBadge risk={client.risk} score={client.riskScore} />
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6B6B65" }}>
                <span>إجمالي: <strong>{fmt(client.totalInvoiced)}</strong></span>
                <span>متأخر: <strong style={{ color: client.overdue > 0 ? "#B71C1C" : "#1B5E20" }}>{fmt(client.overdue)}</strong></span>
              </div>
            </div>
            <span style={{ color: "#9C9C95", fontSize: 18 }}>‹</span>
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
            <Avatar initials={client.initials} size={56} color="#FFFFFF" />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF" }}>{client.name}</div>
              <RiskBadge risk={client.risk} score={client.riskScore} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { label: "إجمالي الفواتير", value: fmt(client.totalInvoiced), color: "#1A1A18" },
            { label: "المدفوع",         value: fmt(client.totalPaid),      color: "#1B5E20" },
            { label: "المتأخر",         value: fmt(client.overdue),        color: client.overdue > 0 ? "#B71C1C" : "#1B5E20" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "#FFFFFF", borderRadius: 14, padding: "12px 10px", border: "1px solid #E8E5DE", textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#9C9C95", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px", border: "1px solid #E8E5DE" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 12 }}>معدل الدفع</div>
          <div style={{ background: "#F5F5F0", borderRadius: 10, height: 8, overflow: "hidden" }}>
            <div style={{ background: payRatio > 80 ? "#1B5E20" : payRatio > 50 ? "#C6930A" : "#B71C1C", height: "100%", width: `${payRatio}%`, borderRadius: 10 }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#9C9C95" }}>متوسط أيام الدفع: <strong>{client.avgDays} يوم</strong></span>
            <span style={{ fontSize: 11, fontWeight: 700, color: payRatio > 80 ? "#1B5E20" : "#B71C1C" }}>{payRatio}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export function ExpensesScreen({ toast }: { toast?: (msg: string, type?: string) => void }) {
  const [showScanner, setShowScanner] = useState(false);
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>المصاريف</div>
          <div style={{ fontSize: 13, color: "#A5D6A7" }}>أبريل ٢٠٢٦ — <span style={{ color: "#FFB300", fontWeight: 700 }}>{fmt(247)}</span> هذا الشهر</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #E8E5DE", display: "flex", alignItems: "center", gap: 20 }}>
          <DonutChart categories={D.expenseCategories} />
          <div style={{ flex: 1 }}>
            {D.expenseCategories.map((cat) => (
              <div key={cat.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#1A1A18" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, display: "inline-block" }}></span>
                  {cat.name}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A18" }}>${cat.amount}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", border: "1px solid #E8E5DE" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>المعاملات</div>
            <button onClick={() => setShowScanner(true)} style={{ fontSize: 11, color: "#7B1FA2", background: "#F3E5F5", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>📸 مسح إيصال</button>
          </div>
          {D.transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F5F5F0" }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: t.type === "income" ? "#E8F5E9" : "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {t.type === "income" ? "💰" : t.category === "software_tools" ? "💻" : t.category === "food_dining" ? "🍽️" : "🚗"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A18" }}>{t.desc}</div>
                <div style={{ fontSize: 10, color: "#9C9C95", display: "flex", gap: 6, alignItems: "center" }}>
                  <span>{t.date}</span><HalalBadge halal={t.halal} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.type === "income" ? "#1B5E20" : "#1A1A18" }}>
                {t.type === "income" ? "+" : ""}{fmt(Math.abs(t.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {showScanner && <ReceiptScanner onClose={() => setShowScanner(false)} onToast={toast} />}
    </div>
  );
}

// ─── Zakat ────────────────────────────────────────────────────────────────────
export function ZakatScreen({ toast }: { toast?: (msg: string, type?: string) => void }) {
  const z = D.zakat;
  const pct = Math.min(100, Math.round((z.eligible / z.nisab) * 100));
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #C6930A 0%, #7A5906 100%)", padding: "20px 20px 30px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.08} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>الزكاة</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>فريضة — ٢.٥٪ من المال الحول عليه الحول</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "20px", marginBottom: 16, border: "2px solid #C6930A22", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#9C9C95", marginBottom: 6 }}>زكاتك المستحقة</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#C6930A", letterSpacing: "-2px" }}>{fmt(z.amount)}</div>
          <div style={{ background: "#FFF8E1", borderRadius: 12, padding: "8px 16px", display: "inline-block", marginTop: 12, fontSize: 12, color: "#C6930A" }}>⏳ موعد الدفع بعد {z.daysUntilDue} يوماً</div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #E8E5DE" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 12 }}>تفصيل الحساب</div>
          {[
            { label: "إجمالي الأصول",   value: fmt(z.totalAssets)         },
            { label: "الوعاء الزكوي",   value: fmt(z.eligible), bold: true },
            { label: "نسبة الزكاة",     value: "٢.٥٪"                     },
            { label: "الزكاة المستحقة", value: fmt(z.amount), bold: true, gold: true },
          ].map((row) => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F5F5F0" }}>
              <span style={{ fontSize: 13, color: "#6B6B65" }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: row.bold ? 800 : 500, color: row.gold ? "#C6930A" : "#1A1A18" }}>{row.value}</span>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", background: "linear-gradient(135deg, #C6930A, #7A5906)", color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
          أدّ زكاتك الآن ✓
        </button>
        <PurificationLedger />
      </div>
    </div>
  );
}

// ─── Contracts ────────────────────────────────────────────────────────────────
export function ContractsScreen() {
  const [selected, setSelected] = useState<typeof D.contracts[0] | null>(null);
  if (selected) return <ContractDetail contract={selected} onBack={() => setSelected(null)} />;
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>العقود</div>
          <div style={{ fontSize: 13, color: "#A5D6A7" }}>تحليل بالذكاء الاصطناعي</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#F3E5F5", border: "2px dashed #7B1FA2", borderRadius: 16, padding: "20px", textAlign: "center", marginBottom: 16, cursor: "pointer" }}>
          <div style={{ fontSize: 28 }}>📎</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#7B1FA2", marginTop: 8 }}>ارفع عقداً للتحليل</div>
          <div style={{ fontSize: 12, color: "#9C9C95", marginTop: 4 }}>PDF — يُحلّل الذكاء الاصطناعي البنود الخطرة فوراً</div>
        </div>
        {D.contracts.map((c) => (
          <div key={c.id} onClick={() => setSelected(c)} style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 16px", marginBottom: 10, border: "1px solid #E8E5DE", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 11, color: "#9C9C95" }}>{c.client} · {c.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>{fmt(c.amount)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {c.status === "pending" ? (
                <span style={{ fontSize: 11, color: "#6B6B65", background: "#F5F5F0", borderRadius: 8, padding: "4px 10px" }}>⏳ قيد التحليل...</span>
              ) : c.criticalFlags > 0 ? (
                <span style={{ fontSize: 11, color: "#B71C1C", background: "#FFEBEE", borderRadius: 8, padding: "4px 10px" }}>🚨 {c.criticalFlags} بنود حرجة</span>
              ) : (
                <span style={{ fontSize: 11, color: "#1B5E20", background: "#E8F5E9", borderRadius: 8, padding: "4px 10px" }}>✓ لا مشاكل</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContractDetail({ contract, onBack }: { contract: typeof D.contracts[0]; onBack: () => void }) {
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "6px 14px", color: "white", fontSize: 13, cursor: "pointer", marginBottom: 12, fontFamily: "IBM Plex Sans Arabic" }}>→ رجوع</button>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>{contract.title}</div>
          <div style={{ fontSize: 12, color: "#A5D6A7" }}>{contract.client}</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        {D.contractFlags.map((flag, i) => (
          <div key={i} style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px", marginBottom: 12, border: "1px solid #E8E5DE", borderRight: `4px solid ${flag.severity === "critical" ? "#B71C1C" : "#E65100"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: flag.severity === "critical" ? "#FFEBEE" : "#FFF3E0", color: flag.severity === "critical" ? "#B71C1C" : "#E65100" }}>
                {flag.severity === "critical" ? "🚨 حرج" : "⚠️ تحذير"}
              </span>
              <span style={{ fontSize: 11, color: "#9C9C95" }}>البند: {flag.clause}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", marginBottom: 6 }}>{flag.title}</div>
            <div style={{ fontSize: 12, color: "#6B6B65", marginBottom: 10 }}>{flag.desc}</div>
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
  return (
    <div style={{ background: "#FAFAF8", minHeight: "100%", paddingBottom: 90, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#1B5E20", padding: "20px 20px 20px", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.07} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>التقارير</div>
          <div style={{ fontSize: 13, color: "#A5D6A7" }}>ملخص مالي — أبريل ٢٠٢٦</div>
        </div>
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", marginBottom: 16, border: "1px solid #E8E5DE" }}>
          <div style={{ background: "#F5F5F0", borderRadius: 14, padding: "14px", fontSize: 13, color: "#1A1A18", lineHeight: 1.7 }}>
            🤖 أداؤك المالي هذا الشهر <strong style={{ color: "#1B5E20" }}>ممتاز</strong>. دخلك ارتفع <strong>٦٧٪</strong> مقارنة بمارس. مصاريفك في حدود معقولة (<strong>٣١٪</strong> من الدخل).
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { label: "إجمالي الدخل",    value: fmt(D.stats.totalIncome),    delta: "+67%", pos: true  },
            { label: "إجمالي المصاريف", value: fmt(D.stats.totalExpenses),  delta: "+8%",  pos: false },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "#FFFFFF", borderRadius: 16, padding: "14px", border: "1px solid #E8E5DE" }}>
              <div style={{ fontSize: 11, color: "#9C9C95" }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A18", margin: "4px 0" }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.pos ? "#1B5E20" : "#B71C1C" }}>{s.delta} مقارنة بالشهر السابق</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "16px", border: "1px solid #E8E5DE" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18", marginBottom: 12 }}>التدفق النقدي — ٦ أشهر</div>
          <MiniChart data={D.cashflow} />
        </div>
      </div>
    </div>
  );
}
