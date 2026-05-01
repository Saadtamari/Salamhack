"use client";
import React, { useState } from "react";
import { AiVoiceIcon, Camera01Icon } from "@hugeicons/core-free-icons";
import { MASRAF_DATA } from "@/lib/data";
import type { Invoice } from "@/lib/data";
import { apiConfig, masrafApi } from "@/lib/api";
import { MasrafIcon } from "./icons";

// ─── Invoice HTML Generator ──────────────────────────────────────────────────
function fmtAr(n: number) {
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);
}

function buildInvoiceHtml(p: {
  id: string; client: string; clientEn: string; amount: number; due: string;
  status: string; business: string; currency: string; sym: string;
  subtotal: number; vat: number; terms?: string;
}) {
  const m = (n: number) => `${fmtAr(n)} ${p.sym}`;
  const numDisplay = p.id.split("-").pop() ?? p.id;
  const statusColor = p.status === "overdue" ? "#B71C1C" : "#2A2520";
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>فاتورة ${numDisplay} — مصرف</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Arial',system-ui,sans-serif;direction:rtl;background:#FAFAF8;color:#2A2520;padding:32px 20px}
.invoice{max-width:520px;margin:0 auto;background:#FAFAF8;border:1px solid #E8DFCF;border-radius:18px;overflow:hidden}
.hdr{background:#FFFDF8;border-bottom:1px solid #E8DFCF;padding:14px 20px;display:flex;justify-content:center;align-items:center}
.hdr-title{font-size:11px;font-weight:700;color:#C6A35A;letter-spacing:3px;text-transform:uppercase}
.body{padding:32px 28px 24px}
.bismillah{text-align:center;margin-bottom:26px}
.bismillah .ar{font-size:18px;color:#1B5E20;font-weight:800;margin-bottom:6px}
.bismillah .en{font-size:10px;color:#B8AC97;letter-spacing:1.5px;text-transform:uppercase}
.num-big{font-size:52px;font-weight:800;color:#0F3D29;letter-spacing:-1px;line-height:1}
.num-id{font-size:11px;color:#8A7F6F;margin-top:6px;letter-spacing:1px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.section{margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #E8DFCF}
.label{font-size:10px;color:#B8AC97;margin-bottom:6px;letter-spacing:1.5px;text-transform:uppercase}
.value{font-size:15px;font-weight:700;color:#2A2520}
.sub{font-size:12px;color:#8A7F6F;margin-top:2px}
.items{margin-bottom:24px}
.item-hdr{display:grid;grid-template-columns:1fr auto;gap:16px;padding-bottom:10px;border-bottom:1px solid #E8DFCF;margin-bottom:14px}
.item-hdr span{font-size:10px;color:#B8AC97;letter-spacing:1.5px;text-transform:uppercase}
.item-row{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:baseline}
.item-name{font-size:15px;font-weight:700;color:#2A2520}
.item-sub{font-size:11px;color:#8A7F6F;margin-top:2px}
.item-amt{font-size:15px;font-weight:800;color:#2A2520}
.totals{border-top:1px solid #E8DFCF;padding-top:16px}
.total-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#5C5346}
.grand-row{display:flex;justify-content:space-between;align-items:baseline;padding:14px 0 0;margin-top:10px;border-top:2px solid #0F3D29}
.grand-lbl{font-size:13px;font-weight:600;color:#2A2520}
.grand-val{font-size:24px;font-weight:800;color:#0F3D29}
.footer{margin-top:28px;padding-top:18px;border-top:1px solid #E8DFCF;text-align:center;font-size:10px;color:#B8AC97;letter-spacing:1.5px;text-transform:uppercase}
.print-btn{display:block;width:100%;max-width:520px;margin:0 auto 20px;padding:12px;background:#0F3D29;color:#F4EDE0;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
@media print{.print-btn{display:none}body{padding:0}@page{margin:20px}}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF ↓</button>
<div class="invoice">
  <div class="hdr"><span class="hdr-title">فاتورة · INVOICE</span></div>
  <div class="body">
    <div class="bismillah"><div class="ar">بسم الله الرحمن الرحيم</div><div class="en">Sharia-Compliant Invoice</div></div>
    <div style="margin-bottom:28px"><div class="num-big">${numDisplay}</div><div class="num-id">${p.id}</div></div>
    <div class="grid2 section">
      <div><div class="label">من / From</div><div class="value">${p.business}</div><div class="sub">الأردن · Jordan</div></div>
      <div><div class="label">إلى / To</div><div class="value">${p.client}</div><div class="sub">${p.clientEn}</div></div>
    </div>
    <div class="grid2" style="margin-bottom:28px">
      <div><div class="label">الإصدار</div><div class="value" style="font-size:13px">٢٧ أبريل ٢٠٢٦</div></div>
      <div><div class="label">الاستحقاق</div><div class="value" style="font-size:13px;color:${statusColor}">${p.due !== "—" ? p.due : "٢٧ مايو ٢٠٢٦"}</div></div>
    </div>
    <div class="items">
      <div class="item-hdr"><span>الخدمة</span><span>المبلغ</span></div>
      <div class="item-row">
        <div><div class="item-name">تصميم هوية بصرية</div><div class="item-sub">Brand Identity Design · ١ × ${m(p.subtotal)}</div></div>
        <div class="item-amt">${m(p.subtotal)}</div>
      </div>
    </div>
    <div class="totals">
      <div class="total-row"><span>المجموع الفرعي</span><span>${m(p.subtotal)}</span></div>
      <div class="total-row"><span>ضريبة القيمة المضافة (١٦٪)</span><span>${m(p.vat)}</span></div>
      <div class="grand-row"><span class="grand-lbl">الإجمالي</span><span class="grand-val">${m(p.amount)}</span></div>
    </div>
    <div class="footer">Sharia-Compliant · ${p.terms === "murabaha" ? "مرابحة" : "معاملة إسلامية"}</div>
  </div>
</div>
</body>
</html>`;
}

// ─── Invoice Preview Modal ─────────────────────────────────────────────────────
export function InvoicePreviewModal({ invoice, onClose, onToast }: {
  invoice: Invoice;
  onClose: () => void;
  onToast?: (msg: string, type?: string, title?: string) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const user = MASRAF_DATA.user;
  const currency = typeof globalThis !== "undefined"
    ? ((globalThis as typeof globalThis & { MASRAF_CURRENCY?: string }).MASRAF_CURRENCY || MASRAF_DATA.user.currency)
    : MASRAF_DATA.user.currency;
  const symbols: Record<string, string> = { USD: "$", SAR: "ر.س", AED: "د.إ", JOD: "د.أ", EGP: "ج.م", KWD: "د.ك" };
  const sym = symbols[currency] || currency;
  const subtotal = invoice.amount / 1.16;
  const vat = invoice.amount - subtotal;
  const terms = "terms" in invoice ? invoice.terms : undefined;
  const fmtNum = (n: number) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);
  const fmtMoney = (n: number) => `${fmtNum(n)} ${sym}`;
  const backendId = (invoice as Invoice & { backendId?: string }).backendId;
  const existingPdfUrl = (invoice as Invoice & { pdfUrl?: string | null }).pdfUrl;

  function downloadPdf() {
    if (existingPdfUrl) {
      window.open(existingPdfUrl, "_blank", "noopener,noreferrer");
      onToast?.("تم فتح الفاتورة", "success", "PDF جاهز");
      return;
    }

    // Open window synchronously before any async operation to avoid popup blocker
    const win = window.open("", "_blank", "width=720,height=960");
    if (!win) {
      onToast?.("يرجى السماح بالنوافذ المنبثقة لتنزيل PDF", "error", "PDF");
      return;
    }

    if (apiConfig.useBackend && backendId) {
      setDownloading(true);
      win.document.write(`<html><body style="font-family:sans-serif;text-align:center;padding:40px;direction:rtl"><p>جاري إنشاء PDF...</p></body></html>`);
      masrafApi.invoices.generatePdf(backendId)
        .then((result) => {
          const url = result.signedUrl || result.pdfUrl || (result as Record<string, unknown>).url;
          if (typeof url === "string" && url) {
            win.location.href = url;
          } else {
            win.close();
          }
          onToast?.("تم إنشاء ملف PDF بنجاح", "success", "PDF جاهز");
        })
        .catch(() => {
          win.close();
          onToast?.("تعذر إنشاء PDF الآن، تحقق من اتصال الخلفية", "error", "PDF");
        })
        .finally(() => setDownloading(false));
      return;
    }

    // Client-side PDF: write a styled HTML invoice to the new window then print it
    const html = buildInvoiceHtml({
      id: invoice.id,
      client: invoice.client,
      clientEn: invoice.clientEn,
      amount: invoice.amount,
      due: invoice.due,
      status: invoice.status,
      business: user.business,
      currency,
      sym,
      subtotal,
      vat,
      terms,
    });
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 450);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(15,61,41,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "IBM Plex Sans Arabic, sans-serif", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#FAFAF8", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "94%", overflow: "auto", boxShadow: "0 30px 80px rgba(15,61,41,0.35)", border: "1px solid #E8DFCF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 14px 14px", borderBottom: "1px solid #E8DFCF", background: "#FFFDF8" }}>
          <button onClick={onClose} style={{ background: "transparent", color: "#5C5346", border: "1px solid #E8DFCF", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#C6A35A", letterSpacing: 3, textTransform: "uppercase" }}>فاتورة · INVOICE</div>
          <button onClick={downloadPdf} disabled={downloading} style={{ background: "#0F3D29", color: "#F4EDE0", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: downloading ? "wait" : "pointer", fontFamily: "IBM Plex Sans Arabic" }}>{downloading ? "جاري..." : "تنزيل PDF"}</button>
        </div>
        <div style={{ padding: "32px 28px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ fontSize: 18, color: "#1B5E20", fontWeight: 800, marginBottom: 6 }}>بسم الله الرحمن الرحيم</div>
            <div style={{ fontSize: 10, color: "#B8AC97", letterSpacing: 1.5, textTransform: "uppercase" }}>Sharia-Compliant Invoice</div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: "#0F3D29", letterSpacing: "-1px", lineHeight: 1 }}>{invoice.id.split("-").pop()}</div>
            <div style={{ fontSize: 11, color: "#8A7F6F", marginTop: 6, letterSpacing: 1 }}>{invoice.id}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #E8DFCF" }}>
            <div>
              <div style={{ fontSize: 10, color: "#B8AC97", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>من / From</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2A2520" }}>{user.business}</div>
              <div style={{ fontSize: 12, color: "#8A7F6F", marginTop: 2 }}>الأردن · Jordan</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#B8AC97", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>إلى / To</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#2A2520" }}>{invoice.client}</div>
              <div style={{ fontSize: 12, color: "#8A7F6F", marginTop: 2 }}>{invoice.clientEn}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 10, color: "#B8AC97", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>الإصدار</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2A2520" }}>٢٧ أبريل ٢٠٢٦</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#B8AC97", marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>الاستحقاق</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: invoice.status === "overdue" ? "#B71C1C" : "#2A2520" }}>{invoice.due !== "—" ? invoice.due : "٢٧ مايو ٢٠٢٦"}</div>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, paddingBottom: 10, borderBottom: "1px solid #E8DFCF", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#B8AC97", letterSpacing: 1.5, textTransform: "uppercase" }}>الخدمة</div>
              <div style={{ fontSize: 10, color: "#B8AC97", letterSpacing: 1.5, textTransform: "uppercase" }}>المبلغ</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2A2520" }}>تصميم هوية بصرية</div>
                <div style={{ fontSize: 11, color: "#8A7F6F", marginTop: 2 }}>Brand Identity Design · ١ × {fmtMoney(subtotal)}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2A2520" }}>{fmtMoney(subtotal)}</div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #E8DFCF", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#5C5346" }}>
              <span>المجموع الفرعي</span><span>{fmtMoney(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#5C5346" }}>
              <span>ضريبة القيمة المضافة (١٦٪)</span><span>{fmtMoney(vat)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0 0", marginTop: 10, borderTop: "2px solid #0F3D29" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2A2520" }}>الإجمالي</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#0F3D29" }}>{fmtMoney(invoice.amount)}</span>
            </div>
          </div>
          <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #E8DFCF", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#B8AC97", letterSpacing: 1.5, textTransform: "uppercase" }}>Sharia-Compliant · {terms === "murabaha" ? "مرابحة" : "معاملة إسلامية"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chaser Modal ─────────────────────────────────────────────────────────────
export function ChaserModal({ invoice, onClose, onToast }: {
  invoice: Invoice;
  onClose: () => void;
  onToast?: (msg: string, type?: string) => void;
}) {
  const [tone, setTone] = useState<"soft" | "firm">("soft");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const messages = {
    soft: `السلام عليكم ورحمة الله وبركاته،\n\nأرجو أن تكونوا بخير. أودّ التذكير الودي بالفاتورة رقم ${invoice.id} بمبلغ ${invoice.amount} دولار والتي كان موعد استحقاقها ${invoice.due}.\n\nنتطلع لإتمام هذا الأمر في أقرب وقت ممكن. جزاكم الله خيراً.\n\nمع التقدير،\nأحمد الشمري`,
    firm:  `تحية طيبة،\n\nنُذكّركم بضرورة تسوية الفاتورة رقم ${invoice.id} البالغة ${invoice.amount} دولار والمتأخرة منذ ${invoice.daysOverdue} يوماً.\n\nيُرجى التواصل فوراً لترتيب السداد وتجنّب أي تبعات إضافية.\n\nأحمد الشمري`,
  };

  async function generate() {
    setGenerating(true);
    setMessage("");
    if (apiConfig.useBackend) {
      try {
        const activeCurrency = typeof globalThis !== "undefined"
          ? ((globalThis as typeof globalThis & { MASRAF_CURRENCY?: string }).MASRAF_CURRENCY || MASRAF_DATA.user.currency)
          : MASRAF_DATA.user.currency;
        const result = await masrafApi.ai.generateChaser({
          clientName: invoice.client,
          invoiceNumber: invoice.id,
          amount: invoice.amount,
          currency: activeCurrency,
          daysOverdue: invoice.daysOverdue,
          dueDate: invoice.due,
        });
        setMessage(result.message);
        return;
      } catch {
        onToast?.("تعذر الاتصال بالذكاء الاصطناعي، تم استخدام صيغة محلية", "error");
      } finally {
        setGenerating(false);
      }
    }

    setTimeout(() => { setGenerating(false); setMessage(messages[tone]); }, 700);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(15,61,41,0.58)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, fontFamily: "IBM Plex Sans Arabic, sans-serif", backdropFilter: "blur(5px)" }}>
      <div style={{ background: "#FFFDF8", borderRadius: 22, width: "min(100%, 520px)", maxHeight: "84%", overflow: "auto", padding: "22px", border: "1px solid #E8DFCF", boxShadow: "0 28px 70px rgba(15,61,41,0.32)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <MasrafIcon icon={AiVoiceIcon} size={18} color="#11100E" />
          متابعة الدفع
        </div>
        <div style={{ fontSize: 12, color: "#92897C", marginBottom: 20 }}>الذكاء الاصطناعي يولّد رسالة تحصيل مناسبة ثقافياً</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {([{ k: "soft", l: "لطيف 🤝" }, { k: "firm", l: "حازم 💼" }] as const).map((t) => (
            <button key={t.k} onClick={() => { setTone(t.k); setMessage(""); }}
              style={{ flex: 1, background: tone === t.k ? "#1B5E20" : "#F1EDE5", color: tone === t.k ? "white" : "#11100E", border: "none", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
              {t.l}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={generating}
          style={{ width: "100%", background: generating ? "#DDD6CA" : "#1B5E20", color: generating ? "#92897C" : "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", marginBottom: 16, fontFamily: "IBM Plex Sans Arabic" }}>
          {generating ? "يولّد الذكاء الاصطناعي..." : "ولّد الرسالة"}
        </button>
        {message && (
          <>
            <div style={{ background: "#F1EDE5", borderRadius: 14, padding: "14px 16px", fontSize: 13, color: "#11100E", lineHeight: 1.8, whiteSpace: "pre-line", marginBottom: 16, direction: "rtl" }}>{message}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onToast?.("تم إرسال رسالة المتابعة بنجاح", "success"); onClose(); }}
                style={{ flex: 2, background: "#1B5E20", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>✓ أرسل الآن</button>
              <button onClick={onClose} style={{ flex: 1, background: "#F1EDE5", color: "#11100E", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Receipt Scanner ──────────────────────────────────────────────────────────
type ReceiptCategory =
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

const CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  food_dining: "طعام ومطاعم",
  transport: "مواصلات",
  software_tools: "برمجيات وأدوات",
  office_supplies: "مستلزمات مكتبية",
  communication: "اتصالات",
  marketing: "تسويق",
  education: "تعليم",
  health: "صحة",
  rent: "إيجار",
  utilities: "خدمات",
  entertainment: "ترفيه",
  other: "أخرى",
};

type ReceiptResult = {
  merchant: string;
  amount: number;
  category: ReceiptCategory;
  currency: string;
  date: string;
  halal: boolean;
  needsPurification: boolean;
  descriptionAr: string;
  notes?: string;
};

export function ReceiptScanner({ onClose, onToast }: {
  onClose: () => void;
  onToast?: (msg: string, type?: string) => void;
}) {
  const [stage, setStage] = useState<"upload" | "scanning" | "result">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReceiptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan(file?: File) {
    if (!file) return;
    setSelectedFile(file);
    setStage("scanning");
    setError(null);

    if (apiConfig.useBackend) {
      try {
        const scan = await masrafApi.ai.scanReceipt(file);
        // Fire-and-forget: also persist the receipt image to storage for future audit
        void masrafApi.storage.upload({ file, directory: "receipts", access: "signed" }).catch(() => undefined);

        setResult({
          merchant: scan.merchantNameAr || scan.merchantName,
          amount: scan.amount,
          category: scan.category,
          currency: scan.currency || MASRAF_DATA.user.currency,
          date: scan.transactionDate,
          halal: scan.isHalal,
          needsPurification: scan.needsPurification,
          descriptionAr: scan.descriptionAr,
          notes: scan.notes,
        });
        setStage("result");
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : "تعذر تحليل الإيصال";
        setError(message);
        setStage("upload");
        onToast?.("تعذر تحليل الإيصال، حاول بصورة أوضح", "error");
        return;
      }
    }

    // Mock fallback when backend is not enabled
    window.setTimeout(() => {
      setResult({
        merchant: "مطعم الرياض",
        amount: 42,
        category: "food_dining",
        currency: MASRAF_DATA.user.currency,
        date: new Date().toISOString().slice(0, 10),
        halal: true,
        needsPurification: false,
        descriptionAr: "وجبة في مطعم الرياض",
      });
      setStage("result");
    }, 900);
  }

  async function addExpense() {
    if (!result) return;

    if (apiConfig.useBackend) {
      try {
        await masrafApi.transactions.create({
          type: "expense",
          amount: result.amount,
          currency: result.currency,
          category: result.category,
          descriptionAr: result.descriptionAr || result.merchant,
          merchantName: result.merchant,
          transactionDate: result.date,
          isHalal: result.halal,
          needsPurification: result.needsPurification,
          reference: selectedFile?.name,
        });
        onToast?.("تم إضافة المصروف في الخلفية بنجاح", "success");
        onClose();
        return;
      } catch {
        onToast?.("تعذر حفظ المصروف في الخلفية، تم إبقاء النتيجة للمراجعة", "error");
      }
    }

    onToast?.("تم إضافة المصروف بنجاح", "success");
    onClose();
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(15,61,41,0.58)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, fontFamily: "IBM Plex Sans Arabic, sans-serif", backdropFilter: "blur(5px)" }}>
      <div style={{ background: "#FFFDF8", borderRadius: 22, width: "min(100%, 480px)", maxHeight: "84%", overflow: "auto", padding: "22px", border: "1px solid #E8DFCF", boxShadow: "0 28px 70px rgba(15,61,41,0.32)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <MasrafIcon icon={Camera01Icon} size={18} color="#11100E" />
          مسح الإيصال
        </div>
          {stage === "upload" && (
            <>
              {error && (
                <div style={{ background: "#FFF6F4", border: "1px solid #F5C9C0", color: "#7A2515", borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 12, fontWeight: 700 }}>
                  {error}
                </div>
              )}
              <label style={{ display: "block", background: "#F1EDE5", border: "2px dashed #DDD6CA", borderRadius: 16, padding: "32px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
                <input type="file" accept="image/*" onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void handleScan(file);
                }} style={{ display: "none" }} />
                <div style={{ color: "#11100E", display: "flex", justifyContent: "center", marginBottom: 12 }}><MasrafIcon icon={Camera01Icon} size={38} color="currentColor" /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>اضغط لرفع صورة الإيصال</div>
                <div style={{ marginTop: 16, background: "#1B5E20", color: "white", borderRadius: 10, padding: "10px 24px", display: "inline-block", fontSize: 13, fontWeight: 700 }}>اختر صورة</div>
              </label>
            </>
          )}
        {stage === "scanning" && (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>يحلّل الذكاء الاصطناعي الإيصال...</div>
          </div>
        )}
        {stage === "result" && result && (
          <>
            <div style={{ background: "#FFFDF8", borderRadius: 14, padding: "16px", marginBottom: 14, border: "1px solid #E8DFCF" }}>
              <div style={{ fontSize: 12, color: "#11100E", fontWeight: 700, marginBottom: 12 }}>✓ تم التعرف على الإيصال — راجع وعدّل قبل الحفظ</div>
              <label style={{ display: "block", marginBottom: 10 }}>
                <span style={{ display: "block", fontSize: 11, color: "#6D675E", fontWeight: 700, marginBottom: 4 }}>التاجر</span>
                <input value={result.merchant} onChange={(e) => setResult({ ...result, merchant: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #DDD6CA", borderRadius: 10, background: "#FAFAF8", color: "#11100E", fontFamily: "IBM Plex Sans Arabic", textAlign: "right", direction: "rtl" }} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <label>
                  <span style={{ display: "block", fontSize: 11, color: "#6D675E", fontWeight: 700, marginBottom: 4 }}>المبلغ</span>
                  <input type="number" min={0} step="0.01" value={result.amount}
                    onChange={(e) => setResult({ ...result, amount: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #DDD6CA", borderRadius: 10, background: "#FAFAF8", color: "#11100E", fontFamily: "IBM Plex Sans Arabic", textAlign: "right", direction: "rtl" }} />
                </label>
                <label>
                  <span style={{ display: "block", fontSize: 11, color: "#6D675E", fontWeight: 700, marginBottom: 4 }}>العملة</span>
                  <input value={result.currency} onChange={(e) => setResult({ ...result, currency: e.target.value.toUpperCase() })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #DDD6CA", borderRadius: 10, background: "#FAFAF8", color: "#11100E", fontFamily: "IBM Plex Sans Arabic", textAlign: "right", direction: "rtl" }} />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <label>
                  <span style={{ display: "block", fontSize: 11, color: "#6D675E", fontWeight: 700, marginBottom: 4 }}>الفئة</span>
                  <select value={result.category} onChange={(e) => setResult({ ...result, category: e.target.value as ReceiptCategory })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #DDD6CA", borderRadius: 10, background: "#FAFAF8", color: "#11100E", fontFamily: "IBM Plex Sans Arabic", direction: "rtl" }}>
                    {(Object.keys(CATEGORY_LABELS) as ReceiptCategory[]).map((key) => (
                      <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span style={{ display: "block", fontSize: 11, color: "#6D675E", fontWeight: 700, marginBottom: 4 }}>التاريخ</span>
                  <input type="date" value={result.date} onChange={(e) => setResult({ ...result, date: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #DDD6CA", borderRadius: 10, background: "#FAFAF8", color: "#11100E", fontFamily: "IBM Plex Sans Arabic", direction: "rtl" }} />
                </label>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6D675E", fontWeight: 700, marginBottom: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={result.halal} onChange={(e) => setResult({ ...result, halal: e.target.checked, needsPurification: e.target.checked ? result.needsPurification : true })} />
                  حلال
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={result.needsPurification} onChange={(e) => setResult({ ...result, needsPurification: e.target.checked })} />
                  يحتاج تطهيراً
                </label>
              </div>
              {result.notes && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#92897C", fontStyle: "italic" }}>ملاحظة: {result.notes}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
                <button onClick={addExpense}
                  style={{ flex: 2, background: "#1B5E20", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>✓ إضافة للمصاريف</button>
              <button onClick={onClose} style={{ flex: 1, background: "#F1EDE5", color: "#11100E", border: "none", borderRadius: 12, padding: "13px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Purification Ledger ──────────────────────────────────────────────────────
export function PurificationLedger() {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [charity, setCharity] = useState("");
  const [records, setRecords] = useState([
    { id: 1, amount: 32, reason: "عمولة مشبوهة المصدر",  date: "مارس ٢٠٢٦",   purified: true,  charity: "جمعية الأيتام الأردنية" },
    { id: 2, amount: 18, reason: "معاملة غير مصنّفة",    date: "فبراير ٢٠٢٦", purified: false, charity: "" },
  ]);

  function addRecord() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setRecords((current) => [
      {
        id: Date.now(),
        amount: value,
        reason: reason.trim() || "مبلغ يحتاج تطهيراً",
        date: "مايو ٢٠٢٦",
        purified: Boolean(charity.trim()),
        charity: charity.trim(),
      },
      ...current,
    ]);
    setAmount("");
    setReason("");
    setCharity("");
    setShowAdd(false);
  }

  return (
    <>
      <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", border: "1px solid #DDD6CA", marginTop: 16, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E", marginBottom: 4 }}>سجل التطهير (تطهير)</div>
        <div style={{ fontSize: 12, color: "#92897C", marginBottom: 14 }}>المبالغ غير الملتزمة التي تحتاج تطهيراً بالتصدق</div>
        {records.map((r) => (
          <div key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid #F1EDE5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#11100E" }}>{r.reason}</div>
              <div style={{ fontSize: 11, color: "#92897C", marginTop: 2 }}>{r.date}</div>
              {r.purified && <div style={{ fontSize: 11, color: "#1B5E20", marginTop: 2 }}>✓ {r.charity}</div>}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#9C7614" }}>${r.amount}</div>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: r.purified ? "#E8F5E9" : "#FFF9E8", color: r.purified ? "#1B5E20" : "#9C7614", fontWeight: 700 }}>
                {r.purified ? "مُطهَّر" : "معلق"}
              </span>
            </div>
          </div>
        ))}
        <button onClick={() => setShowAdd(true)} style={{ width: "100%", marginTop: 14, background: "#1B5E20", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
          + إضافة مبلغ للتطهير
        </button>
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,61,41,0.55)", zIndex: 220, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, backdropFilter: "blur(4px)", fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
          <div style={{ background: "#FFFDF8", borderRadius: 22, padding: 22, width: "min(100%, 420px)", border: "1px solid #E8DFCF", boxShadow: "0 24px 60px rgba(15,61,41,0.30)" }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#11100E", marginBottom: 4 }}>إضافة مبلغ للتطهير</div>
            <div style={{ fontSize: 12, color: "#6D675E", marginBottom: 18 }}>سجّل المبلغ والسبب، ويمكنك تحديد جهة الصدقة إن تم التطهير.</div>
            {[
              { label: "المبلغ", value: amount, set: setAmount, placeholder: "0", type: "number" },
              { label: "السبب", value: reason, set: setReason, placeholder: "مثال: عمولة مشبوهة المصدر", type: "text" },
              { label: "جهة الصدقة (اختياري)", value: charity, set: setCharity, placeholder: "مثال: جمعية الأيتام", type: "text" },
            ].map((field) => (
              <label key={field.label} style={{ display: "block", marginBottom: 12 }}>
                <span style={{ display: "block", fontSize: 12, color: "#6D675E", fontWeight: 700, marginBottom: 6 }}>{field.label}</span>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  style={{ width: "100%", padding: "12px 14px", border: "1px solid #DDD6CA", borderRadius: 12, background: "#FAFAF8", color: "#11100E", outline: "none", fontFamily: "IBM Plex Sans Arabic", textAlign: "right", direction: "rtl" }}
                />
              </label>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={addRecord} disabled={!amount} style={{ flex: 2, background: amount ? "#1B5E20" : "#DDD6CA", color: amount ? "white" : "#92897C", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: amount ? "pointer" : "not-allowed", fontFamily: "IBM Plex Sans Arabic" }}>إضافة</button>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: "#F1EDE5", color: "#11100E", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
