"use client";
import React, { useRef, useState } from "react";
import { logout as authLogout } from "@/lib/auth";
import {
  Alert02Icon,
  AiVoiceIcon,
  Camera01Icon,
  Car03Icon,
  ChartBarDecreasingIcon,
  ChartBarIncreasingIcon,
  CheckmarkCircle02Icon,
  Clock05Icon,
  ComputerIcon,
  Download01Icon,
  InformationCircleIcon,
  Money03Icon,
  Restaurant02Icon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { MASRAF_DATA } from "@/lib/data";
import { apiConfig, masrafApi } from "@/lib/api";
import { fmt, IslamicPattern, Avatar, StatusBadge, RiskBadge, MiniChart, DonutChart, RunwayIndicator, HalalBadge, EmptyState } from "./ui";
import { MasrafIcon } from "./icons";
import { InvoicePreviewModal, ChaserModal, ReceiptScanner, PurificationLedger } from "./Modals";
import type { Invoice } from "@/lib/data";

const DD = MASRAF_DATA;

// ─── Desktop Dashboard ────────────────────────────────────────────────────────
export function DesktopDashboard({ onNavigate, toast }: {
  onNavigate: (page: string) => void;
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const overdue = DD.invoices.filter((i) => i.status === "overdue");
  const txIcon = (category: string, type: string) => {
    if (type === "income") return Money03Icon;
    if (category === "software_tools") return ComputerIcon;
    if (category === "food_dining") return Restaurant02Icon;
    return Car03Icon;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[
          { label: "الرصيد الحالي",  value: fmt(DD.user.balance),        icon: Wallet02Icon, delta: "+12%",               pos: true,  color: "#147A41" },
          { label: "دخل الشهر",      value: fmt(DD.stats.totalIncome),   icon: ChartBarIncreasingIcon, delta: "+67%",               pos: true,  color: "#147A41" },
          { label: "مصاريف الشهر",   value: fmt(DD.stats.totalExpenses), icon: ChartBarDecreasingIcon, delta: "+8%",                pos: false, color: "#8A6400" },
          { label: "فواتير معلقة",   value: fmt(DD.stats.pending),       icon: Alert02Icon, delta: `${overdue.length} متأخرة`, pos: false, color: "#B3261E" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#FFFDF8", borderRadius: 12, padding: "20px 22px", border: "1px solid #DDD6CA" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: "#6D675E", fontWeight: 700 }}>{s.label}</div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#E8F5E9", border: "1px solid #C8E6C9", color: "#1B5E20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MasrafIcon icon={s.icon as IconSvgElement} size={20} color="currentColor" />
              </div>
            </div>
            <div style={{ fontSize: 29, fontWeight: 950, color: "#11100E", letterSpacing: 0 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: s.color, fontWeight: 800, marginTop: 7 }}>{s.delta} مقارنة بالشهر الماضي</div>
          </div>
        ))}
      </div>

      <RunwayIndicator days={47} />

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Cash flow */}
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E" }}>التدفق النقدي</div>
              <div style={{ fontSize: 12, color: "#92897C", marginTop: 2 }}>* مايو–يونيو توقعات</div>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6D675E" }}>
              <span><span style={{ color: "#1B5E20" }}>━</span> الدخل</span>
              <span><span style={{ color: "#9C7614" }}>╌</span> المصاريف</span>
            </div>
          </div>
          <MiniChart data={DD.cashflow} width={500} height={100} />
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8 }}>
            {DD.cashflow.map((d, i) => <div key={i} style={{ fontSize: 10, color: i >= 4 ? "#9C7614" : "#92897C" }}>{d.month}{i >= 4 ? " *" : ""}</div>)}
          </div>
        </div>

        {/* Overdue alerts */}
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 16 }}>تنبيهات عاجلة</div>
          {overdue.length === 0
            ? <EmptyState icon={<MasrafIcon icon={CheckmarkCircle02Icon} size={30} color="#11100E" />} title="لا توجد تنبيهات" subtitle="كل فواتيرك بحالة جيدة" />
            : overdue.map((inv) => (
              <div key={inv.id} style={{ background: "#FFEBEE", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1px solid #FFCDD2" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#B3261E" }}>{inv.client}</div>
                    <div style={{ fontSize: 11, color: "#C62828", marginTop: 2 }}>متأخرة {inv.daysOverdue} يوماً</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#B3261E" }}>{fmt(inv.amount)}</div>
                    <button onClick={() => toast?.("تم إرسال رسالة المتابعة", "success")} style={{ fontSize: 11, color: "#FFFDF8", background: "#1B5E20", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", marginTop: 4, fontFamily: "IBM Plex Sans Arabic" }}>ذكّر</button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E" }}>آخر المعاملات</div>
          <button onClick={() => onNavigate("expenses")} style={{ fontSize: 13, color: "#11100E", background: "none", border: "none", cursor: "pointer", fontFamily: "IBM Plex Sans Arabic", fontWeight: 600 }}>عرض الكل ←</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 24px" }}>
          {DD.transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F1EDE5" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "#F1EDE5", border: "1px solid #DDD6CA", color: "#11100E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MasrafIcon icon={txIcon(t.category, t.type)} size={18} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#11100E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: "#92897C", display: "flex", gap: 8, marginTop: 2 }}>
                  <span>{t.date}</span>
                  <HalalBadge halal={t.halal} />
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.type === "income" ? "#1B5E20" : "#11100E", flexShrink: 0 }}>
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
type InvoiceExtended = Invoice & { description?: string; backendId?: string };

export function DesktopInvoices({ toast }: {
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const [filter, setFilter]         = useState("all");
  const [previewInv, setPreviewInv] = useState<InvoiceExtended | null>(null);
  const [chaserInv,  setChaserInv]  = useState<Invoice | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [localInvoices, setLocalInvoices] = useState<InvoiceExtended[]>([]);
  const [form, setForm] = useState({ client: DD.clients[0]?.name ?? "", description: "", amount: "", terms: "٣٠ يوم" });

  const allInvoices: InvoiceExtended[] = [...localInvoices, ...DD.invoices];
  const filtered = filter === "all" ? allInvoices : allInvoices.filter((i) => i.status === filter);

  async function handleCreate() {
    const amount = Number(form.amount);
    if (!form.client || !(amount > 0)) {
      toast?.("يرجى إدخال اسم العميل والمبلغ", "error", "بيانات ناقصة");
      return;
    }
    setCreating(true);
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + (form.terms === "١٥ يوم" ? 15 : 30));
    const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const dueDateStr = `${dueDate.getDate()} ${AR_MONTHS[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
    const id = `INV-${today.getFullYear()}-${String(today.getTime()).slice(-4)}`;

    const newInv: InvoiceExtended = {
      id,
      client: form.client,
      clientEn: form.client,
      amount,
      status: "draft",
      due: dueDateStr,
      daysOverdue: 0,
      description: form.description || "خدمات مهنية",
    };

    if (apiConfig.useBackend) {
      try {
        const subtotal = Math.round((amount / 1.16) * 100) / 100;
        const vatAmount = Math.round((amount - subtotal) * 100) / 100;
        const result = await masrafApi.invoices.create({
          title: form.description || "Invoice",
          titleAr: form.description || "فاتورة",
          subtotal,
          vatAmount,
          total: amount,
          currency: DD.user.currency,
          paymentTerms: form.terms === "مرابحة" ? "murabaha" : form.terms === "١٥ يوم" ? "net_15" : "net_30",
          dueDate: dueDate.toISOString().split("T")[0],
          status: "draft",
          items: [{ description: form.description || "Professional services", descriptionAr: form.description || "خدمات مهنية", quantity: 1, unitPrice: subtotal, total: subtotal }],
        });
        newInv.backendId = result.id;
        newInv.id = result.invoiceNumber || id;
      } catch {
        // backend failed — keep local invoice
      }
    }

    setLocalInvoices((prev) => [newInv, ...prev]);
    setForm({ client: DD.clients[0]?.name ?? "", description: "", amount: "", terms: "٣٠ يوم" });
    setShowCreate(false);
    setCreating(false);
    toast?.("تم إنشاء الفاتورة بنجاح", "success", "فاتورة جديدة");
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1px solid #DDD6CA", borderRadius: 12, fontSize: 14, fontFamily: "IBM Plex Sans Arabic", direction: "rtl", background: "#FAFAF8", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E" }}>الفواتير</div>
          <div style={{ fontSize: 13, color: "#92897C", marginTop: 2 }}>{allInvoices.length} فاتورة · {fmt(DD.stats.pending)} معلقة</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ background: "#1B5E20", color: "white", border: "none", borderRadius: 14, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
          + فاتورة جديدة
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[{ k: "all", l: "الكل" }, { k: "overdue", l: "متأخرة" }, { k: "sent", l: "مُرسلة" }, { k: "paid", l: "مدفوعة" }, { k: "draft", l: "مسودة" }].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)} style={{ background: filter === t.k ? "#1B5E20" : "#FFFDF8", color: filter === t.k ? "white" : "#11100E", border: "1px solid #DDD6CA", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{t.l}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#FFFDF8", borderRadius: 20, border: "1px solid #DDD6CA", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #DDD6CA" }}>
              {["رقم الفاتورة", "العميل", "المبلغ", "الاستحقاق", "الحالة", "الإجراءات"].map((h) => (
                <th key={h} style={{ padding: "14px 20px", fontSize: 12, fontWeight: 700, color: "#6D675E", textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id}
                onClick={() => setPreviewInv(inv)}
                style={{ borderBottom: "1px solid #F4EDE0", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "16px 20px", fontSize: 13, color: "#8A7F6F", fontWeight: 600 }}>{inv.id}</td>
                <td style={{ padding: "16px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2A2520" }}>{inv.client}</div>
                  <div style={{ fontSize: 11, color: "#B8AC97" }}>{inv.clientEn}</div>
                </td>
                <td style={{ padding: "16px 20px", fontSize: 15, fontWeight: 800, color: "#2A2520" }}>{fmt(inv.amount)}</td>
                <td style={{ padding: "16px 20px", fontSize: 13, color: inv.status === "overdue" ? "#B3261E" : "#5C5346", fontWeight: inv.status === "overdue" ? 700 : 400 }}>
                  {inv.status === "overdue" ? `متأخرة ${inv.daysOverdue}ي` : inv.due}
                </td>
                <td style={{ padding: "16px 20px" }}><StatusBadge status={inv.status} /></td>
                <td style={{ padding: "16px 20px", textAlign: "left" }}>
                  {inv.status === "overdue"
                    ? <button onClick={(e) => { e.stopPropagation(); setChaserInv(inv); }} style={{ fontSize: 12, color: "#11100E", background: "transparent", border: "1px solid #C6A35A", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600, fontFamily: "IBM Plex Sans Arabic" }}>إرسال تذكير</button>
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
          <div style={{ background: "#FFFDF8", borderRadius: 24, padding: "28px", width: 480, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#11100E", marginBottom: 20 }}>فاتورة جديدة</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>العميل</label>
              <select value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} style={inputStyle}>
                {DD.clients.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>وصف الخدمة</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="مثال: تصميم هوية بصرية" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>المبلغ ({DD.user.currency})</label>
              <input type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#6D675E", display: "block", marginBottom: 6 }}>شروط الدفع</label>
              <select value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} style={inputStyle}>
                <option value="٣٠ يوم">٣٠ يوم</option>
                <option value="١٥ يوم">١٥ يوم</option>
                <option value="مرابحة">مرابحة</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => void handleCreate()} disabled={creating} style={{ flex: 2, background: creating ? "#DDD6CA" : "#11100E", color: creating ? "#92897C" : "white", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
                {creating ? "جاري الإنشاء..." : "✓ إنشاء الفاتورة"}
              </button>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, background: "#F1EDE5", color: "#11100E", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>إلغاء</button>
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
      <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E", marginBottom: 24 }}>العملاء</div>
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "repeat(3,1fr)", gap: 16, transition: "all 0.3s" }}>
        {DD.clients.map((c) => (
          <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
            style={{ background: "#FFFDF8", borderRadius: 20, padding: "20px", border: `2px solid ${selected?.id === c.id ? "#11100E" : "#DDD6CA"}`, cursor: "pointer", transition: "border 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar initials={c.initials} size={48} color={c.risk === "high" ? "#B3261E" : c.risk === "medium" ? "#9C7614" : "#11100E"} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#11100E" }}>{c.name}</div>
                <RiskBadge risk={c.risk} score={c.riskScore} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { l: "إجمالي الفواتير", v: fmt(c.totalInvoiced), red: false },
                { l: "المتأخر",          v: fmt(c.overdue),       red: c.overdue > 0 },
              ].map((s) => (
                <div key={s.l} style={{ background: "#FAFAF8", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#92897C" }}>{s.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: s.red ? "#B3261E" : "#11100E" }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Detail panel */}
        {selected && (
          <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA", gridRow: "1 / span 3" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <Avatar initials={selected.initials} size={56} color={selected.risk === "high" ? "#B3261E" : selected.risk === "medium" ? "#9C7614" : "#11100E"} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#11100E" }}>{selected.name}</div>
                <RiskBadge risk={selected.risk} score={selected.riskScore} />
              </div>
            </div>
            <div style={{ background: selected.risk === "high" ? "#FFFDF8" : selected.risk === "medium" ? "#FFF9E8" : "#FFFDF8", borderRadius: 14, padding: "14px", marginBottom: 20, fontSize: 13, color: selected.risk === "high" ? "#B3261E" : selected.risk === "medium" ? "#8A6400" : "#11100E", lineHeight: 1.7 }}>
              {selected.risk === "high"   && "خطورة عالية. تأخيرات متكررة. يُنصح بدفعة مقدمة 50٪."}
              {selected.risk === "medium" && "⚡ مخاطر متوسطة. بعض التأخيرات. تابع الفواتير القادمة."}
              {selected.risk === "low"    && "عميل موثوق. التزام ممتاز بمواعيد السداد."}
            </div>
            {([
              ["إجمالي الفواتير",  fmt(selected.totalInvoiced)],
              ["المدفوع",          fmt(selected.totalPaid)],
              ["المتأخر",          fmt(selected.overdue)],
              ["متوسط أيام الدفع", `${selected.avgDays} يوم`],
              ["عدد الفواتير",     `${selected.invoicesCount} فواتير`],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F1EDE5", fontSize: 13 }}>
                <span style={{ color: "#6D675E" }}>{l}</span>
                <span style={{ fontWeight: 700, color: "#11100E" }}>{v}</span>
              </div>
            ))}
            {selected.overdue > 0 && (
              <button onClick={() => toast?.(`تم إرسال تذكير لـ ${selected.name}`, "success")} style={{ width: "100%", marginTop: 20, background: "#11100E", color: "white", border: "none", borderRadius: 14, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
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
  const txIcon = (category: string, type: string) => {
    if (type === "income") return Money03Icon;
    if (category === "software_tools") return ComputerIcon;
    if (category === "food_dining") return Restaurant02Icon;
    return Car03Icon;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E" }}>المصاريف</div>
          <div style={{ fontSize: 13, color: "#92897C", marginTop: 2 }}>أبريل ٢٠٢٦ — $247 إجمالي</div>
        </div>
        <button onClick={() => setShowScanner(true)} style={{ background: "#11100E", color: "#FFFDF8", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <MasrafIcon icon={Camera01Icon} size={17} color="currentColor" />
          مسح إيصال
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        {/* Donut + legend */}
        <div>
          <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#11100E", marginBottom: 16 }}>التوزيع حسب الفئة</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><DonutChart categories={DD.expenseCategories} /></div>
            {DD.expenseCategories.map((cat) => (
              <div key={cat.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#11100E" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: cat.color, display: "inline-block" }}></span>
                  {cat.name}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#11100E" }}>${cat.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions list */}
        <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#11100E", marginBottom: 16 }}>جميع المعاملات</div>
          {DD.transactions.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid #F1EDE5" }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: "#F1EDE5", border: "1px solid #DDD6CA", color: "#11100E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MasrafIcon icon={txIcon(t.category, t.type)} size={19} color="currentColor" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#11100E" }}>{t.desc}</div>
                <div style={{ fontSize: 12, color: "#92897C", display: "flex", gap: 8, marginTop: 3 }}>
                  <span>{t.date}</span>
                  <HalalBadge halal={t.halal} />
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: t.type === "income" ? "#1B5E20" : "#11100E" }}>
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
      <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E", marginBottom: 24 }}>الزكاة</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          {/* Hero card */}
          <div style={{ background: "linear-gradient(135deg, #C6930A, #7A5906)", borderRadius: 20, padding: "28px", color: "white", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>زكاتك المستحقة</div>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-2px" }}>{fmt(z.amount)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>عن الفترة أبريل ٢٠٢٥ – أبريل ٢٠٢٦ · موعد الدفع بعد {z.daysUntilDue} يوماً</div>
          </div>

          {/* Breakdown */}
          <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#11100E", marginBottom: 14 }}>تفصيل الحساب</div>
            {([
              ["إجمالي الأصول",   fmt(z.totalAssets),                   false, false],
              ["خصم: المصاريف",   `- ${fmt(DD.stats.totalExpenses)}`,    false, false],
              ["الوعاء الزكوي",   fmt(z.eligible),                      true,  false],
              ["نسبة الزكاة",     "٢.٥٪",                               false, false],
              ["الزكاة المستحقة", fmt(z.amount),                        true,  true ],
            ] as [string, string, boolean, boolean][]).map(([l, v, bold, gold]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #F1EDE5", fontSize: 13 }}>
                <span style={{ color: "#6D675E" }}>{l}</span>
                <span style={{ fontWeight: bold ? 800 : 500, color: gold ? "#9C7614" : "#11100E" }}>{v}</span>
              </div>
            ))}
          </div>

          <button onClick={() => toast?.("تم تسجيل دفع الزكاة. جزاك الله خيراً.", "success")} style={{ width: "100%", background: "linear-gradient(135deg,#C6930A,#7A5906)", color: "white", border: "none", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
            أدّ زكاتك الآن ✓
          </button>
        </div>

        <div>
          {/* Nisab tracker */}
          <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA", marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#11100E", marginBottom: 12 }}>النصاب</div>
            <div style={{ background: "#F1EDE5", borderRadius: 10, height: 12, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ background: "#F0C542", height: "100%", width: `${pct}%`, borderRadius: 10 }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#6D675E" }}>رصيدك: <strong style={{ color: "#9C7614" }}>{fmt(z.eligible)}</strong></span>
              <span style={{ color: "#11100E", fontWeight: 700 }}>✓ بلغ النصاب ({fmt(z.nisab)})</span>
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
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedContracts, setUploadedContracts] = useState<typeof DD.contracts>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allContracts = [...uploadedContracts, ...DD.contracts];

  async function handleContractFile(file: File) {
    setAnalyzing(true);
    toast?.(`جاري تحليل "${file.name}" بالذكاء الاصطناعي...`, "info", "رفع عقد");
    await new Promise((resolve) => setTimeout(resolve, 1600));
    const newContract = {
      id: `CNT-${Date.now()}`,
      title: file.name.replace(/\.pdf$/i, "").replace(/_/g, " "),
      client: "عميل",
      date: new Date().toLocaleDateString("ar-SA"),
      amount: 0,
      criticalFlags: 1,
      status: "analyzed",
    } as typeof DD.contracts[0];
    setUploadedContracts((prev) => [newContract, ...prev]);
    setSelected(newContract);
    setAnalyzing(false);
    toast?.("تم تحليل العقد — يوجد بند يحتاج مراجعة", "success", "تحليل العقد");
  }

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E", marginBottom: 24 }}>العقود</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        <div>
          {/* Upload area */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleContractFile(file);
              e.target.value = "";
            }}
          />
          <div
            style={{ background: analyzing ? "#EDE7F6" : "#F3E5F5", border: `2px dashed ${analyzing ? "#4527A0" : "#7B1FA2"}`, borderRadius: 16, padding: "24px", textAlign: "center", marginBottom: 20, cursor: analyzing ? "wait" : "pointer", transition: "all 0.2s" }}
            onClick={() => !analyzing && fileInputRef.current?.click()}
          >
            <div style={{ fontSize: 36 }}>{analyzing ? "⏳" : "📎"}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#7B1FA2", marginTop: 8 }}>
              {analyzing ? "جاري تحليل العقد..." : "ارفع عقداً للتحليل"}
            </div>
            <div style={{ fontSize: 12, color: "#92897C", marginTop: 4 }}>
              {analyzing ? "يُحلّل الذكاء الاصطناعي البنود الخطرة..." : "اضغط لاختيار ملف PDF · يُحلّل الذكاء الاصطناعي البنود الخطرة فوراً"}
            </div>
          </div>

          {allContracts.map((c) => (
            <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              style={{ background: "#FFFDF8", borderRadius: 16, padding: "18px 20px", marginBottom: 12, border: `2px solid ${selected?.id === c.id ? "#7B1FA2" : "#DDD6CA"}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: "#92897C", marginTop: 2 }}>{c.client} · {c.date}</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#11100E" }}>{fmt(c.amount)}</div>
                  {c.criticalFlags > 0
                    ? <span style={{ fontSize: 11, color: "#B71C1C", background: "#FFEBEE", padding: "3px 8px", borderRadius: 8, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 5 }}><MasrafIcon icon={Alert02Icon} size={13} color="#B71C1C" strokeWidth={2} />{c.criticalFlags} حرج</span>
                    : c.status === "pending"
                      ? <span style={{ fontSize: 11, color: "#9C7614", background: "#FFF9E8", padding: "3px 8px", borderRadius: 8 }}>⏳ جاري</span>
                      : <span style={{ fontSize: 11, color: "#1B5E20", background: "#E8F5E9", padding: "3px 8px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 5 }}><MasrafIcon icon={CheckmarkCircle02Icon} size={13} color="#1B5E20" />آمن</span>
                  }
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analysis panel */}
        <div>
          {selected ? (
            <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 20 }}>نتائج التحليل</div>
              {DD.contractFlags.map((f, i) => (
                <div key={i} style={{ background: "#FFFDF8", borderRadius: 14, padding: "16px", marginBottom: 12, border: "1px solid #DDD6CA" }}>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 10, background: f.severity === "critical" ? "#FFEBEE" : "#FFF3E0", color: f.severity === "critical" ? "#B71C1C" : "#E65100", fontWeight: 800 }}>
                    {f.severity === "critical" ? "حرج" : "تحذير"}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#11100E", margin: "8px 0 6px" }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "#6D675E", marginBottom: 10 }}>{f.desc}</div>
                  <div style={{ background: "#F0F7F0", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#1B5E20", display: "flex", alignItems: "center", gap: 8 }}>
                    <MasrafIcon icon={InformationCircleIcon} size={15} color="#1B5E20" />
                    {f.recommendation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <EmptyState icon="📎" title="اختر عقداً" subtitle="اضغط على أي عقد لعرض نتائج التحليل" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Reports ──────────────────────────────────────────────────────────
function downloadReportPdf(toast?: (msg: string, type?: string) => void) {
  const win = window.open("", "_blank", "width=820,height=1000");
  if (!win) {
    toast?.("يرجى السماح بالنوافذ المنبثقة لتنزيل التقرير", "error");
    return;
  }
  const fmtN = (n: number) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);
  const net = DD.stats.totalIncome - DD.stats.totalExpenses;
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>تقرير أبريل ٢٠٢٦ — مصرف</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Arial',system-ui,sans-serif;direction:rtl;background:#FAFAF8;color:#2A2520;padding:32px 24px}
.wrap{max-width:720px;margin:0 auto}
.print-btn{display:block;width:100%;padding:12px;background:#1B5E20;color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:20px;font-family:inherit}
.header{background:linear-gradient(135deg,#1B5E20,#0D3B0F);border-radius:18px;padding:28px 32px;color:white;margin-bottom:24px}
.header h1{font-size:28px;font-weight:900;margin-bottom:4px}
.header p{font-size:14px;opacity:0.75}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.kpi{background:white;border:1px solid #E8DFCF;border-radius:14px;padding:18px 20px}
.kpi-label{font-size:11px;color:#92897C;margin-bottom:6px}
.kpi-value{font-size:22px;font-weight:900;color:#11100E}
.kpi-delta{font-size:12px;font-weight:700;margin-top:4px}
.section{background:white;border:1px solid #E8DFCF;border-radius:18px;padding:24px;margin-bottom:18px}
.section h2{font-size:15px;font-weight:800;color:#11100E;margin-bottom:16px}
.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F4EDE0;font-size:14px}
.row:last-child{border-bottom:none}
.grand{border-top:2px solid #1B5E20;margin-top:8px;padding-top:12px;display:flex;justify-content:space-between;font-size:16px;font-weight:800}
.ai-box{background:#F0F7F0;border:1px solid #C8E6C9;border-radius:14px;padding:16px;font-size:13px;color:#1B5E20;line-height:1.8}
.footer{text-align:center;margin-top:24px;font-size:11px;color:#B8AC97;letter-spacing:1.5px;text-transform:uppercase}
@media print{.print-btn{display:none}body{padding:0}@page{margin:16px}}
</style>
</head>
<body>
<div class="wrap">
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF ↓</button>
<div class="header">
  <h1>تقرير أبريل ٢٠٢٦</h1>
  <p>مصرف — التقرير المالي الشهري · أحمد الشمري</p>
</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-label">إجمالي الدخل</div><div class="kpi-value">${fmtN(DD.stats.totalIncome)}</div><div class="kpi-delta" style="color:#1B5E20">+67%</div></div>
  <div class="kpi"><div class="kpi-label">إجمالي المصاريف</div><div class="kpi-value">${fmtN(DD.stats.totalExpenses)}</div><div class="kpi-delta" style="color:#B3261E">+8%</div></div>
  <div class="kpi"><div class="kpi-label">صافي الربح</div><div class="kpi-value">${fmtN(net)}</div><div class="kpi-delta" style="color:#1B5E20">+82%</div></div>
  <div class="kpi"><div class="kpi-label">فواتير مدفوعة</div><div class="kpi-value">٢</div><div class="kpi-delta" style="color:#9C7614">من ٦</div></div>
</div>
<div class="section">
  <h2>الملخص المالي</h2>
  <div class="row"><span style="color:#6D675E">إجمالي الدخل</span><span style="font-weight:700">${fmtN(DD.stats.totalIncome)} USD</span></div>
  <div class="row"><span style="color:#6D675E">إجمالي المصاريف</span><span style="font-weight:700">${fmtN(DD.stats.totalExpenses)} USD</span></div>
  <div class="row"><span style="color:#6D675E">فواتير معلقة</span><span style="font-weight:700">${fmtN(DD.stats.pending)} USD</span></div>
  <div class="grand"><span>صافي الربح</span><span style="color:#1B5E20">${fmtN(net)} USD</span></div>
</div>
<div class="section">
  <h2>ملخص الذكاء الاصطناعي</h2>
  <div class="ai-box">أداؤك المالي هذا الشهر <strong>ممتاز</strong>. دخلك ارتفع <strong>٦٧٪</strong> مقارنة بمارس وهو أعلى مستوى في ٦ أشهر. لديك <strong>عميلان</strong> يحتاجان متابعة تحصيل عاجلة. مصاريفك في حدود معقولة (<strong>٣١٪</strong> من الدخل).</div>
</div>
<div class="footer">مصرف · Masraf · تقرير أبريل ٢٠٢٦ · Sharia-Compliant</div>
</div>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 450);
}

export function DesktopReports({ toast }: {
  toast?: (msg: string, type?: string) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E" }}>التقارير</div>
        <button onClick={() => downloadReportPdf(toast)} style={{ background: "#1B5E20", color: "#FFFDF8", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <MasrafIcon icon={Download01Icon} size={17} color="currentColor" />
          تنزيل PDF
        </button>
      </div>

      {/* AI summary banner */}
      <div style={{ background: "linear-gradient(135deg, #1B5E20, #0D3B0F)", borderRadius: 20, padding: "24px", marginBottom: 24, color: "white", position: "relative", overflow: "hidden" }}>
        <IslamicPattern opacity={0.06} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>ملخص أبريل ٢٠٢٦ — الذكاء الاصطناعي</div>
          <div style={{ fontSize: 15, lineHeight: 1.8, maxWidth: 700 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 4 }}><MasrafIcon icon={AiVoiceIcon} size={15} color="#A5D6A7" /></span>
            أداؤك المالي هذا الشهر <strong>ممتاز</strong>. دخلك ارتفع <strong>٦٧٪</strong> مقارنة بمارس وهو أعلى مستوى في ٦ أشهر. لديك <strong>عميلان</strong> يحتاجان متابعة تحصيل عاجلة. مصاريفك في حدود معقولة (<strong>٣١٪</strong> من الدخل).
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
          <div key={s.l} style={{ background: "#FFFDF8", borderRadius: 16, padding: "18px 20px", border: "1px solid #DDD6CA" }}>
            <div style={{ fontSize: 12, color: "#92897C", marginBottom: 6 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#11100E" }}>{s.v}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.pos ? "#11100E" : "#B3261E", marginTop: 4 }}>{s.d}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "24px", border: "1px solid #DDD6CA" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 16 }}>التدفق النقدي — ٦ أشهر</div>
        <MiniChart data={DD.cashflow} width={700} height={120} />
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10 }}>
          {DD.cashflow.map((d, i) => <div key={i} style={{ fontSize: 11, color: i >= 4 ? "#9C7614" : "#92897C" }}>{d.month}{i >= 4 ? " *" : ""}</div>)}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Notifications ───────────────────────────────────────────────────
export function DesktopNotifications({ toast }: {
  toast?: (msg: string, type?: string, title?: string) => void;
}) {
  const overdue = DD.invoices.filter((i) => i.status === "overdue");
  const items = [
    ...overdue.map((invoice) => ({
      id: invoice.id,
      title: `فاتورة متأخرة: ${invoice.client}`,
      body: `متأخرة ${invoice.daysOverdue} يوماً · ${fmt(invoice.amount)}`,
      tone: "critical" as const,
      action: "إرسال تذكير",
    })),
    { id: "zakat", title: "موعد الزكاة قريب", body: `متبقي ${DD.zakat.daysUntilDue} يوماً على موعد الدفع`, tone: "warning" as const, action: "مراجعة الزكاة" },
    { id: "contract", title: "تحليل عقد يحتاج مراجعة", body: "يوجد بند دفع متأخر وغرامة غير واضحة في أحد العقود", tone: "critical" as const, action: "فتح التحليل" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#11100E" }}>الإشعارات</div>
        <div style={{ fontSize: 13, color: "#92897C", marginTop: 2 }}>التنبيهات الحرجة والمهام التي تحتاج إجراء سريع</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        <div style={{ background: "#FFFDF8", borderRadius: 20, border: "1px solid #DDD6CA", padding: 22 }}>
          {items.map((item) => {
            const critical = item.tone === "critical";
            return (
              <div key={item.id} style={{ background: critical ? "#FFEBEE" : "#FFF9E8", border: `1px solid ${critical ? "#FFCDD2" : "#FFE0A3"}`, borderRadius: 16, padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: critical ? "#B71C1C" : "#9C7614", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MasrafIcon icon={critical ? Alert02Icon : Clock05Icon} size={20} color="currentColor" strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: critical ? "#B71C1C" : "#8A6400", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "#5C5346" }}>{item.body}</div>
                </div>
                <button onClick={() => toast?.("تم تنفيذ الإجراء", "success", item.action)} style={{ background: "#1B5E20", color: "#FFFDF8", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>{item.action}</button>
              </div>
            );
          })}
        </div>
        <div style={{ background: "linear-gradient(135deg, #1B5E20, #0D3B0F)", borderRadius: 20, padding: 24, color: "#FFFDF8", minHeight: 220, position: "relative", overflow: "hidden" }}>
          <IslamicPattern opacity={0.07} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>ملخص اليوم</div>
            <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1 }}>{items.length}</div>
            <div style={{ fontSize: 13, color: "rgba(255,253,248,0.72)", marginTop: 8, lineHeight: 1.8 }}>إشعارات نشطة، منها {overdue.length} مرتبطة بتحصيل الفواتير.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Settings ────────────────────────────────────────────────────────
export function DesktopSettings({ toast, currency = DD.user.currency, onCurrencyChange }: {
  toast?: (msg: string, type?: string, title?: string) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
}) {
  const inputStyle: React.CSSProperties = { padding: "10px 14px", border: "1px solid #E8DFCF", borderRadius: 10, fontSize: 14, fontFamily: "var(--font-ar)", direction: "rtl", background: "#FBF7F0", color: "#2A2520", outline: "none" };
  const [profile, setProfile] = useState({
    name: "أحمد الشمري",
    business: "شمري للتصميم",
    email: "ahmad@shamri.design",
    phone: "+962 79 555 0123",
    currency,
    vat: "16",
    persona: "abdullahai",
    invoiceStyle: "heritage_green",
  });
  const save = (key: keyof typeof profile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
    if (key === "currency") {
      onCurrencyChange?.(value);
      toast?.(`تم تغيير العملة إلى ${value}`, "success", "الإعدادات المالية");
    }
  };
  const sections = [
    {
      title: "الملف الشخصي",
      fields: [
        { key: "name", label: "الاسم الكامل" },
        { key: "business", label: "اسم النشاط التجاري" },
        { key: "email", label: "البريد الإلكتروني" },
        { key: "phone", label: "رقم الهاتف" },
      ],
    },
    {
      title: "الإعدادات المالية",
      fields: [
        { key: "currency", label: "العملة", type: "select", options: [["USD", "دولار أمريكي"], ["SAR", "ريال سعودي"], ["AED", "درهم إماراتي"], ["JOD", "دينار أردني"], ["EGP", "جنيه مصري"], ["KWD", "دينار كويتي"]] },
        { key: "vat", label: "نسبة ضريبة القيمة المضافة (%)" },
        { key: "invoiceStyle", label: "قالب الفاتورة", type: "select", options: [["heritage_green", "أخضر تراثي"], ["gold_zakat", "ذهبي إسلامي"], ["minimal", "هادئ وبسيط"]] },
      ],
    },
    {
      title: "المساعد الصوتي",
      fields: [
        { key: "persona", label: "صوت المساعد", type: "persona" },
      ],
    },
  ] as const;

  return (
    <div style={{ width: "100%", maxWidth: 1040 }}>
      {sections.map((section) => (
        <div key={section.title} style={{ background: "#FFFFFF", borderRadius: 18, padding: "26px 30px", border: "1px solid #E8DFCF", marginBottom: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ color: "#1B5E20" }}><IslamicPattern opacity={0.018} /></div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#C6A35A", letterSpacing: 2, marginBottom: 18, textTransform: "uppercase" }}>{section.title}</div>
          {section.fields.map((field) => {
            const key = field.key as keyof typeof profile;
            const fieldType = "type" in field ? field.type : undefined;
            return (
              <div key={field.key} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 200px) minmax(0, 1fr)", gap: 24, alignItems: "center", padding: "14px 0", borderBottom: "1px solid #F4EDE0", position: "relative", zIndex: 1 }}>
                <label style={{ fontSize: 14, color: "#5C5346", fontWeight: 700 }}>{field.label}</label>
                {fieldType === "select" ? (
                  <select value={profile[key]} onChange={(e) => save(key, e.target.value)} style={inputStyle}>
                    {("options" in field ? field.options : []).map(([value, label]) => <option key={value} value={value}>{label} ({value})</option>)}
                  </select>
                ) : fieldType === "persona" ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ k: "abdullahai", l: "عبدالله", sub: "صوت ذكوري" }, { k: "fatima", l: "فاطمة", sub: "صوت أنثوي" }].map((voice) => (
                      <button key={voice.k} onClick={() => save("persona", voice.k)} style={{ flex: 1, padding: "12px 16px", border: `1px solid ${profile.persona === voice.k ? "#0F3D29" : "#E8DFCF"}`, background: profile.persona === voice.k ? "#0F3D29" : "#FBF7F0", color: profile.persona === voice.k ? "#F4EDE0" : "#2A2520", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-ar)", textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{voice.l}</div>
                        <div style={{ fontSize: 11, opacity: 0.72, marginTop: 2 }}>{voice.sub}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <input value={profile[key]} onChange={(e) => save(key, e.target.value)} style={inputStyle} />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ background: "#FFFFFF", borderRadius: 18, padding: "26px 30px", border: "1px solid #E8DFCF", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ color: "#C6930A" }}><IslamicPattern opacity={0.018} /></div>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#C6A35A", letterSpacing: 2, marginBottom: 18, textTransform: "uppercase" }}>التنبيهات والتخصيص</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 28px", position: "relative", zIndex: 1 }}>
          {["تنبيهات الفواتير المتأخرة", "تذكير الزكاة السنوي", "تحليل العقود بالذكاء الاصطناعي", "مسح الإيصالات", "ملخص التقارير الشهري", "إظهار العبارات الإسلامية"].map((item) => (
            <label key={item} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F4EDE0", cursor: "pointer" }}>
              <span style={{ fontSize: 13, color: "#2A2520", fontWeight: 700 }}>{item}</span>
              <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: "#1B5E20" }} />
            </label>
          ))}
        </div>
      </div>
      <div style={{ background: "#FFFFFF", borderRadius: 18, padding: "26px 30px", border: "1px solid #E8DFCF" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#C6A35A", letterSpacing: 2, marginBottom: 18, textTransform: "uppercase" }}>الحساب</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => toast?.("جاري تصدير بياناتك...", "info")} style={{ background: "#FBF7F0", border: "1px solid #E8DFCF", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 800, color: "#2A2520", cursor: "pointer", fontFamily: "var(--font-ar)" }}>تصدير البيانات</button>
          <button onClick={() => toast?.("تم حفظ الإعدادات", "success", "الإعدادات")} style={{ background: "#1B5E20", border: "1px solid #1B5E20", color: "#FFFFFF", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>حفظ الإعدادات</button>
          <button onClick={() => { authLogout(); toast?.("تم تسجيل الخروج", "info"); window.dispatchEvent(new Event("masraf:logout")); }} style={{ background: "transparent", border: "1px solid #B71C1C", color: "#B71C1C", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-ar)" }}>تسجيل الخروج</button>
        </div>
      </div>
    </div>
  );
}
