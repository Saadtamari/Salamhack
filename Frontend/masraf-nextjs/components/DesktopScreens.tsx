"use client";
import React, { useState } from "react";
import { MASRAF_DATA } from "@/lib/data";
import { fmt, IslamicPattern, Avatar, StatusBadge, RiskBadge, MiniChart, DonutChart, RunwayIndicator, HalalBadge, EmptyState } from "./ui";
import { InvoicePreviewModal, ChaserModal, ReceiptScanner, PurificationLedger } from "./Modals";
import type { Invoice } from "@/lib/data";

const DD = MASRAF_DATA;

// ─── Desktop Dashboard ────────────────────────────────────────────────────────
export function DesktopDashboard({ onNavigate, toast }: {
  onNavigate: (page: string) => void;
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const overdue = DD.invoices.filter((i) => i.status === "overdue");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "الرصيد الحالي",  value: fmt(DD.user.balance),        icon: "💰", delta: "+12%",               pos: true,  color: "#1B5E20" },
          { label: "دخل الشهر",      value: fmt(DD.stats.totalIncome),   icon: "📈", delta: "+67%",               pos: true,  color: "#1B5E20" },
          { label: "مصاريف الشهر",   value: fmt(DD.stats.totalExpenses), icon: "📉", delta: "+8%",                pos: false, color: "#C6930A" },
          { label: "فواتير معلقة",   value: fmt(DD.stats.pending),       icon: "⏳", delta: `${overdue.length} متأخرة`, pos: false, color: "#B71C1C" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#FFFFFF", borderRadius: 20, padding: "20px 24px", border: "1px solid #E8E5DE", borderTop: `4px solid ${s.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#6B6B65", fontWeight: 500 }}>{s.label}</div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#1A1A18", letterSpacing: "-0.5px" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.pos ? "#1B5E20" : "#B71C1C", fontWeight: 600, marginTop: 6 }}>{s.delta} مقارنة بالشهر الماضي</div>
          </div>
        ))}
      </div>

      <RunwayIndicator days={47} />

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Cash flow */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18" }}>التدفق النقدي</div>
              <div style={{ fontSize: 12, color: "#9C9C95", marginTop: 2 }}>* مايو–يونيو توقعات</div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6B6B65" }}>
              <span><span style={{ color: "#1B5E20" }}>━</span> الدخل</span>
              <span><span style={{ color: "#C6930A" }}>╌</span> المصاريف</span>
            </div>
          </div>
          <MiniChart data={DD.cashflow} width={500} height={100} />
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {DD.cashflow.map((d, i) => <div key={i} style={{ fontSize: 10, color: i >= 4 ? "#C6930A" : "#9C9C95" }}>{d.month}{i >= 4 ? " *" : ""}</div>)}
          </div>
        </div>

        {/* Overdue alerts */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18", marginBottom: 16 }}>تنبيهات عاجلة</div>
          {overdue.length === 0
            ? <EmptyState icon="✓" title="لا توجد تنبيهات" subtitle="كل فواتيرك بحالة جيدة" />
            : overdue.map((inv) => (
              <div key={inv.id} style={{ background: "#FFEBEE", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#B71C1C" }}>{inv.client}</div>
                    <div style={{ fontSize: 11, color: "#C62828", marginTop: 2 }}>متأخرة {inv.daysOverdue} يوماً</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#B71C1C" }}>{fmt(inv.amount)}</div>
                    <button onClick={() => toast?.("تم إرسال رسالة المتابعة", "success")} style={{ fontSize: 11, color: "#7B1FA2", background: "#F3E5F5", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", marginTop: 4, fontFamily: "IBM Plex Sans Arabic" }}>ذكّر</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18" }}>آخر المعاملات</div>
          <button onClick={() => onNavigate("expenses")} style={{ fontSize: 13, color: "#1B5E20", background: "none", border: "none", cursor: "pointer", fontFamily: "IBM Plex Sans Arabic", fontWeight: 600 }}>عرض الكل ←</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 24px" }}>
          {DD.transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F5F5F0" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: t.type === "income" ? "#E8F5E9" : "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                {t.type === "income" ? "💰" : t.category === "software_tools" ? "💻" : t.category === "food_dining" ? "🍽️" : "🚗"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: "#9C9C95", display: "flex", gap: 8, marginTop: 2 }}>
                  <span>{t.date}</span>
                  <HalalBadge halal={t.halal} />
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.type === "income" ? "#1B5E20" : "#1A1A18", flexShrink: 0 }}>
                {t.type === "income" ? "+" : ""}{fmt(Math.abs(t.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Invoices ─────────────────────────────────────────────────────────
export function DesktopInvoices({ toast }: {
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const [filter, setFilter]       = useState("all");
  const [previewInv, setPreviewInv] = useState<Invoice | null>(null);
  const [chaserInv,  setChaserInv]  = useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = filter === "all" ? DD.invoices : DD.invoices.filter((i) => i.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1A1A18" }}>الفواتير</div>
          <div style={{ fontSize: 13, color: "#9C9C95", marginTop: 2 }}>{DD.invoices.length} فاتورة · {fmt(DD.stats.pending)} معلقة</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: "#1B5E20", color: "white", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
          + فاتورة جديدة
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ k: "all", l: "الكل" }, { k: "overdue", l: "متأخرة" }, { k: "sent", l: "مُرسلة" }, { k: "paid", l: "مدفوعة" }, { k: "draft", l: "مسودة" }].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)} style={{ background: filter === t.k ? "#1B5E20" : "#FFFFFF", color: filter === t.k ? "white" : "#1A1A18", border: "1px solid #E8E5DE", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{t.l}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E5DE", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E5DE" }}>
              {["رقم الفاتورة", "العميل", "المبلغ", "الاستحقاق", "الحالة", "الإجراءات"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#6B6B65", textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id}
                onClick={() => setPreviewInv(inv)}
                style={{ borderBottom: "1px solid #F4EDE0", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FBF7F0")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#8A7F6F", fontWeight: 600 }}>{inv.id}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2A2520" }}>{inv.client}</div>
                  <div style={{ fontSize: 11, color: "#B8AC97" }}>{inv.clientEn}</div>
                </td>
                <td style={{ padding: "16px 20px", fontSize: 15, fontWeight: 800, color: "#2A2520" }}>{fmt(inv.amount)}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: inv.status === "overdue" ? "#B71C1C" : "#5C5346", fontWeight: inv.status === "overdue" ? 700 : 400 }}>
                  {inv.status === "overdue" ? `متأخرة ${inv.daysOverdue}ي` : inv.due}
                </td>
                <td style={{ padding: "16px 20px" }}><StatusBadge status={inv.status} /></td>
                <td style={{ padding: "16px 20px", textAlign: "left" }}>
                  {inv.status === "overdue"
                    ? <button onClick={(e) => { e.stopPropagation(); setChaserInv(inv); }} style={{ fontSize: 12, color: "#0F3D29", background: "transparent", border: "1px solid #C6A35A", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>إرسال تذكير</button>
                    : <span style={{ color: "#B8AC97", fontSize: 18 }}>‹</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewInv && <InvoicePreviewModal invoice={previewInv} onClose={() => setPreviewInv(null)} onToast={toast} />}
      {chaserInv  && <ChaserModal invoice={chaserInv} onClose={() => setChaserInv(null)} onToast={toast} />}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "28px", width: 480, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A18", marginBottom: 20 }}>فاتورة جديدة</div>
            {["العميل", "وصف الخدمة", "المبلغ (USD)", "شروط الدفع"].map((f) => (
              <div key={f} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#6B6B65", display: "block", marginBottom: 6 }}>{f}</label>
                {f === "العميل" ? (
                  <select style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5DE", borderRadius: 12, fontSize: 14, fontFamily: "IBM Plex Sans Arabic", direction: "rtl", background: "#FAFAF8" }}>
                    {DD.clients.map((c) => <option key={c.id}>{c.name}</option>)}
                  </select>
                ) : f === "شروط الدفع" ? (
                  <select style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5DE", borderRadius: 12, fontSize: 14, fontFamily: "IBM Plex Sans Arabic", direction: "rtl", background: "#FAFAF8" }}>
                    <option>٣٠ يوم</option><option>١٥ يوم</option><option>مرابحة</option>
                  </select>
                ) : (
                  <input placeholder={f === "المبلغ (USD)" ? "0" : ""} style={{ width: "100%", padding: "11px 14px", border: "1px solid #E8E5DE", borderRadius: 12, fontSize: 14, fontFamily: "IBM Plex Sans Arabic", direction: "rtl", background: "#FAFAF8", boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => { setShowCreate(false); toast?.("تم إنشاء الفاتورة بنجاح", "success", "فاتورة جديدة"); }} style={{ flex: 2, background: "#1B5E20", color: "white", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>✓ إنشاء الفاتورة</button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: "#F5F5F0", color: "#1A1A18", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Desktop Clients ──────────────────────────────────────────────────────────
export function DesktopClients({ toast }: {
  toast?: (msg: string, type?: string) => void;
}) {
  const [selected, setSelected] = useState<typeof DD.clients[0] | null>(null);

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#1A1A18", marginBottom: 24 }}>العملاء</div>
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "repeat(3,1fr)", gap: 16, transition: "all 0.3s" }}>
        {DD.clients.map((c) => (
          <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
            style={{ background: "#FFFFFF", borderRadius: 20, padding: "20px", border: `2px solid ${selected?.id === c.id ? "#1B5E20" : "#E8E5DE"}`, cursor: "pointer", transition: "border 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar initials={c.initials} size={48} color={c.risk === "high" ? "#B71C1C" : c.risk === "medium" ? "#C6930A" : "#1B5E20"} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A18" }}>{c.name}</div>
                <RiskBadge risk={c.risk} score={c.riskScore} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { l: "إجمالي الفواتير", v: fmt(c.totalInvoiced), red: false },
                { l: "المتأخر",          v: fmt(c.overdue),       red: c.overdue > 0 },
              ].map((s) => (
                <div key={s.l} style={{ background: "#FAFAF8", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#9C9C95" }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: s.red ? "#B71C1C" : "#1A1A18" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE", gridRow: "1 / span 3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <Avatar initials={selected.initials} size={56} color={selected.risk === "high" ? "#B71C1C" : selected.risk === "medium" ? "#C6930A" : "#1B5E20"} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A18" }}>{selected.name}</div>
                <RiskBadge risk={selected.risk} score={selected.riskScore} />
              </div>
            </div>
            <div style={{ background: selected.risk === "high" ? "#FFEBEE" : selected.risk === "medium" ? "#FFF8E1" : "#E8F5E9", borderRadius: 14, padding: "14px", marginBottom: 20, fontSize: 13, color: selected.risk === "high" ? "#B71C1C" : selected.risk === "medium" ? "#E65100" : "#1B5E20", lineHeight: 1.7 }}>
              {selected.risk === "high"   && "⚠️ خطورة عالية. تأخيرات متكررة. يُنصح بدفعة مقدمة 50٪."}
              {selected.risk === "medium" && "⚡ مخاطر متوسطة. بعض التأخيرات. تابع الفواتير القادمة."}
              {selected.risk === "low"    && "✓ عميل موثوق. التزام ممتاز بمواعيد السداد."}
            </div>
            {([
              ["إجمالي الفواتير",  fmt(selected.totalInvoiced)],
              ["المدفوع",          fmt(selected.totalPaid)],
              ["المتأخر",          fmt(selected.overdue)],
              ["متوسط أيام الدفع", `${selected.avgDays} يوم`],
              ["عدد الفواتير",     `${selected.invoicesCount} فواتير`],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F5F5F0", fontSize: 13 }}>
                <span style={{ color: "#6B6B65" }}>{l}</span>
                <span style={{ fontWeight: 700, color: "#1A1A18" }}>{v}</span>
              </div>
            ))}
            {selected.overdue > 0 && (
              <button onClick={() => toast?.(`تم إرسال تذكير لـ ${selected.name}`, "success")} style={{ width: "100%", marginTop: 20, background: "linear-gradient(135deg,#7B1FA2,#AB47BC)", color: "white", border: "none", borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
                ✉️ إرسال تذكير دفع
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Desktop Expenses ─────────────────────────────────────────────────────────
export function DesktopExpenses({ toast }: {
  toast?: (msg: string, type?: string) => void;
}) {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#1A1A18" }}>المصاريف</div>
          <div style={{ fontSize: 13, color: "#9C9C95", marginTop: 2 }}>أبريل ٢٠٢٦ — $247 إجمالي</div>
        </div>
        <button onClick={() => setShowScanner(true)} style={{ background: "#7B1FA2", color: "white", border: "none", borderRadius: 14, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>📸 مسح إيصال</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        {/* Donut + legend */}
        <div>
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A18", marginBottom: 16 }}>التوزيع حسب الفئة</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><DonutChart categories={DD.expenseCategories} /></div>
            {DD.expenseCategories.map((cat) => (
              <div key={cat.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1A1A18" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, display: "inline-block" }}></span>
                  {cat.name}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18" }}>${cat.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions list */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A18", marginBottom: 16 }}>جميع المعاملات</div>
          {DD.transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #F5F5F0" }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: t.type === "income" ? "#E8F5E9" : "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {t.type === "income" ? "💰" : t.category === "software_tools" ? "💻" : t.category === "food_dining" ? "🍽️" : "🚗"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A18" }}>{t.desc}</div>
                <div style={{ fontSize: 12, color: "#9C9C95", display: "flex", gap: 8, marginTop: 3 }}>
                  <span>{t.date}</span>
                  <HalalBadge halal={t.halal} />
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.type === "income" ? "#1B5E20" : "#1A1A18" }}>
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

// ─── Desktop Zakat ────────────────────────────────────────────────────────────
export function DesktopZakat({ toast }: {
  toast?: (msg: string, type?: string) => void;
}) {
  const z  = DD.zakat;
  const pct = Math.min(100, Math.round((z.eligible / z.nisab) * 100));

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#1A1A18", marginBottom: 24 }}>الزكاة</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          {/* Hero card */}
          <div style={{ background: "linear-gradient(135deg,#C6930A,#7A5906)", borderRadius: 20, padding: "28px", color: "white", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>زكاتك المستحقة</div>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-2px" }}>{fmt(z.amount)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>عن الفترة أبريل ٢٠٢٥ – أبريل ٢٠٢٦ · موعد الدفع بعد {z.daysUntilDue} يوماً</div>
          </div>

          {/* Breakdown */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A18", marginBottom: 14 }}>تفصيل الحساب</div>
            {([
              ["إجمالي الأصول",   fmt(z.totalAssets),                   false, false],
              ["خصم: المصاريف",   `- ${fmt(DD.stats.totalExpenses)}`,    false, false],
              ["الوعاء الزكوي",   fmt(z.eligible),                      true,  false],
              ["نسبة الزكاة",     "٢.٥٪",                               false, false],
              ["الزكاة المستحقة", fmt(z.amount),                        true,  true ],
            ] as [string, string, boolean, boolean][]).map(([l, v, bold, gold]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F5F5F0", fontSize: 13 }}>
                <span style={{ color: "#6B6B65" }}>{l}</span>
                <span style={{ fontWeight: bold ? 800 : 500, color: gold ? "#C6930A" : "#1A1A18" }}>{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => toast?.("تم تسجيل دفع الزكاة. جزاك الله خيراً.", "success")} style={{ width: "100%", background: "linear-gradient(135deg,#C6930A,#7A5906)", color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
            أدّ زكاتك الآن ✓
          </button>
        </div>

        <div>
          {/* Nisab tracker */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A18", marginBottom: 12 }}>النصاب</div>
            <div style={{ background: "#F5F5F0", borderRadius: 10, height: 12, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ background: "linear-gradient(90deg,#C6930A,#FFB300)", height: "100%", width: `${pct}%`, borderRadius: 10 }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6B6B65" }}>رصيدك: <strong style={{ color: "#C6930A" }}>{fmt(z.eligible)}</strong></span>
              <span style={{ color: "#1B5E20", fontWeight: 700 }}>✓ بلغ النصاب ({fmt(z.nisab)})</span>
            </div>
          </div>
          <PurificationLedger />
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Contracts ────────────────────────────────────────────────────────
export function DesktopContracts({ toast }: {
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const [selected, setSelected] = useState<typeof DD.contracts[0] | null>(null);

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#1A1A18", marginBottom: 24 }}>العقود</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        <div>
          {/* Upload area */}
          <div
            style={{ background: "#F3E5F5", border: "2px dashed #7B1FA2", borderRadius: 16, padding: "24px", textAlign: "center", marginBottom: 20, cursor: "pointer" }}
            onClick={() => toast?.("يرجى رفع ملف PDF", "info", "رفع عقد")}
          >
            <div style={{ fontSize: 36 }}>📎</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#7B1FA2", marginTop: 8 }}>ارفع عقداً للتحليل</div>
            <div style={{ fontSize: 12, color: "#9C9C95", marginTop: 4 }}>يُحلّل الذكاء الاصطناعي البنود الخطرة فوراً</div>
          </div>

          {DD.contracts.map((c) => (
            <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              style={{ background: "#FFFFFF", borderRadius: 16, padding: "18px 20px", marginBottom: 12, border: `2px solid ${selected?.id === c.id ? "#7B1FA2" : "#E8E5DE"}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A18" }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "#9C9C95", marginTop: 2 }}>{c.client} · {c.date}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1A18" }}>{fmt(c.amount)}</div>
                  {c.criticalFlags > 0
                    ? <span style={{ fontSize: 11, color: "#B71C1C", background: "#FFEBEE", padding: "3px 8px", borderRadius: 8, fontWeight: 700 }}>🚨 {c.criticalFlags} حرج</span>
                    : c.status === "pending"
                      ? <span style={{ fontSize: 11, color: "#C6930A", background: "#FFF8E1", padding: "3px 8px", borderRadius: 8 }}>⏳ جاري</span>
                      : <span style={{ fontSize: 11, color: "#1B5E20", background: "#E8F5E9", padding: "3px 8px", borderRadius: 8 }}>✓ آمن</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis panel */}
        <div>
          {selected ? (
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18", marginBottom: 20 }}>نتائج التحليل</div>
              {DD.contractFlags.map((f, i) => (
                <div key={i} style={{ background: "#FFFFFF", borderRadius: 14, padding: "16px", marginBottom: 12, border: "1px solid #E8E5DE", borderRight: `4px solid ${f.severity === "critical" ? "#B71C1C" : "#E65100"}` }}>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: f.severity === "critical" ? "#FFEBEE" : "#FFF3E0", color: f.severity === "critical" ? "#B71C1C" : "#E65100", fontWeight: 700 }}>
                    {f.severity === "critical" ? "🚨 حرج" : "⚠️ تحذير"}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A18", margin: "8px 0 6px" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#6B6B65", marginBottom: 10 }}>{f.desc}</div>
                  <div style={{ background: "#F0F7F0", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#1B5E20" }}>💡 {f.recommendation}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <EmptyState icon="📎" title="اختر عقداً" subtitle="اضغط على أي عقد لعرض نتائج التحليل" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Reports ──────────────────────────────────────────────────────────
export function DesktopReports({ toast }: {
  toast?: (msg: string, type?: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#1A1A18" }}>التقارير</div>
        <button onClick={() => toast?.("جاري تنزيل تقرير أبريل PDF...", "success")} style={{ background: "#1B5E20", color: "white", border: "none", borderRadius: 14, padding: "12px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>⬇ تنزيل PDF</button>
      </div>

      {/* AI summary banner */}
      <div style={{ background: "linear-gradient(135deg,#1B5E20,#0D3B0F)", borderRadius: 20, padding: "24px", marginBottom: 24, color: "white", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.06} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>ملخص أبريل ٢٠٢٦ — الذكاء الاصطناعي</div>
          <div style={{ fontSize: 15, lineHeight: 1.8, maxWidth: 700 }}>
            🤖 أداؤك المالي هذا الشهر <strong>ممتاز</strong>. دخلك ارتفع <strong>٦٧٪</strong> مقارنة بمارس وهو أعلى مستوى في ٦ أشهر. لديك <strong>عميلان</strong> يحتاجان متابعة تحصيل عاجلة. مصاريفك في حدود معقولة (<strong>٣١٪</strong> من الدخل).
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "إجمالي الدخل",    v: fmt(DD.stats.totalIncome),                           d: "+67%", pos: true  },
          { l: "إجمالي المصاريف", v: fmt(DD.stats.totalExpenses),                         d: "+8%",  pos: false },
          { l: "صافي الربح",      v: fmt(DD.stats.totalIncome - DD.stats.totalExpenses),  d: "+82%", pos: true  },
          { l: "فواتير مدفوعة",   v: "٢",                                                 d: "من ٦", pos: true  },
        ].map((s) => (
          <div key={s.l} style={{ background: "#FFFFFF", borderRadius: 16, padding: "18px 20px", border: "1px solid #E8E5DE" }}>
            <div style={{ fontSize: 12, color: "#9C9C95", marginBottom: 6 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1A1A18" }}>{s.v}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.pos ? "#1B5E20" : "#B71C1C", marginTop: 4 }}>{s.d}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "24px", border: "1px solid #E8E5DE" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A18", marginBottom: 16 }}>التدفق النقدي — ٦ أشهر</div>
        <MiniChart data={DD.cashflow} width={700} height={120} />
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10 }}>
          {DD.cashflow.map((d, i) => <div key={i} style={{ fontSize: 11, color: i >= 4 ? "#C6930A" : "#9C9C95" }}>{d.month}{i >= 4 ? " *" : ""}</div>)}
        </div>
      </div>
    </div>
  );
}
