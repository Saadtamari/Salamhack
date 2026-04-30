"use client";
import React, { useState } from "react";
import { AiVoiceIcon, Camera01Icon } from "@hugeicons/core-free-icons";
import { MASRAF_DATA } from "@/lib/data";
import { Invoice } from "@/lib/data";
import { MasrafIcon } from "./icons";

// ─── Invoice Preview Modal ─────────────────────────────────────────────────────
export function InvoicePreviewModal({ invoice, onClose, onToast }: {
  invoice: Invoice;
  onClose: () => void;
  onToast?: (msg: string, type?: string, title?: string) => void;
}) {
  const user = MASRAF_DATA.user;
  const currency = "USD";
  const symbols: Record<string, string> = { USD: "$", SAR: "ر.س", AED: "د.إ", JOD: "د.أ", EGP: "ج.م", KWD: "د.ك" };
  const sym = symbols[currency] || currency;
  const subtotal = invoice.amount / 1.16;
  const vat = invoice.amount - subtotal;
  const fmtNum = (n: number) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);
  const fmtMoney = (n: number) => `${fmtNum(n)} ${sym}`;

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(15,61,41,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "IBM Plex Sans Arabic, sans-serif", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#F7F4EE", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "94%", overflow: "auto", boxShadow: "0 30px 80px rgba(15,61,41,0.35)", border: "1px solid #E8DFCF" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 14px 14px", borderBottom: "1px solid #E8DFCF", background: "#FFFDF8" }}>
          <button onClick={onClose} style={{ background: "transparent", color: "#5C5346", border: "1px solid #E8DFCF", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#C6A35A", letterSpacing: 3, textTransform: "uppercase" }}>فاتورة · INVOICE</div>
          <button onClick={() => { onToast?.("تم تنزيل الفاتورة", "success", "PDF جاهز"); onClose(); }} style={{ background: "#11100E", color: "#F4EDE0", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>تنزيل PDF</button>
        </div>
        <div style={{ padding: "32px 28px 24px" }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: "#11100E", letterSpacing: "-1px", lineHeight: 1 }}>{invoice.id.split("-").pop()}</div>
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
          <div style={{ borderTop: "1px solid #E8DFCF", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#5C5346" }}>
              <span>المجموع الفرعي</span><span>{fmtMoney(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#5C5346" }}>
              <span>ضريبة القيمة المضافة (١٦٪)</span><span>{fmtMoney(vat)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0 0", marginTop: 10, borderTop: "2px solid #11100E" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#2A2520" }}>الإجمالي</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#11100E" }}>{fmtMoney(invoice.amount)}</span>
            </div>
          </div>
          <div style={{ marginTop: 28, paddingTop: 18, borderTop: "1px solid #E8DFCF", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#C6A35A", fontWeight: 600, marginBottom: 6 }}>بسم الله الرحمن الرحيم</div>
            <div style={{ fontSize: 10, color: "#B8AC97", letterSpacing: 1.5, textTransform: "uppercase" }}>Sharia-Compliant Transaction</div>
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

  function generate() {
    setGenerating(true);
    setMessage("");
    setTimeout(() => { setGenerating(false); setMessage(messages[tone]); }, 1400);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end", fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#FFFDF8", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "88%", overflow: "auto", padding: "20px" }}>
        <div style={{ width: 40, height: 4, background: "#DDD6CA", borderRadius: 2, margin: "0 auto 20px" }}></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <MasrafIcon icon={AiVoiceIcon} size={18} color="#11100E" />
          متابعة الدفع
        </div>
        <div style={{ fontSize: 12, color: "#92897C", marginBottom: 20 }}>الذكاء الاصطناعي يولّد رسالة تحصيل مناسبة ثقافياً</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {([{ k: "soft", l: "لطيف 🤝" }, { k: "firm", l: "حازم 💼" }] as const).map((t) => (
            <button key={t.k} onClick={() => { setTone(t.k); setMessage(""); }}
              style={{ flex: 1, background: tone === t.k ? "#11100E" : "#F1EDE5", color: tone === t.k ? "white" : "#11100E", border: "none", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
              {t.l}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={generating}
          style={{ width: "100%", background: generating ? "#DDD6CA" : "#11100E", color: generating ? "#92897C" : "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", marginBottom: 16, fontFamily: "IBM Plex Sans Arabic" }}>
          {generating ? "يولّد الذكاء الاصطناعي..." : "ولّد الرسالة"}
        </button>
        {message && (
          <>
            <div style={{ background: "#F1EDE5", borderRadius: 14, padding: "14px 16px", fontSize: 13, color: "#11100E", lineHeight: 1.8, whiteSpace: "pre-line", marginBottom: 16, direction: "rtl" }}>{message}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onToast?.("تم إرسال رسالة المتابعة بنجاح", "success"); onClose(); }}
                style={{ flex: 2, background: "#11100E", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>✓ أرسل الآن</button>
              <button onClick={onClose} style={{ flex: 1, background: "#F1EDE5", color: "#11100E", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Receipt Scanner ──────────────────────────────────────────────────────────
export function ReceiptScanner({ onClose, onToast }: {
  onClose: () => void;
  onToast?: (msg: string, type?: string) => void;
}) {
  const [stage, setStage] = useState<"upload" | "scanning" | "result">("upload");
  const [result, setResult] = useState<{ merchant: string; amount: number; category: string; date: string; halal: boolean } | null>(null);

  function handleScan() {
    setStage("scanning");
    setTimeout(() => {
      setResult({ merchant: "مطعم الرياض", amount: 42, category: "طعام ومطاعم", date: "٢٧ أبريل ٢٠٢٦", halal: true });
      setStage("result");
    }, 2000);
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end", fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background: "#FFFDF8", borderRadius: "20px 20px 0 0", width: "100%", padding: "20px" }}>
        <div style={{ width: 40, height: 4, background: "#DDD6CA", borderRadius: 2, margin: "0 auto 20px" }}></div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#11100E", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          <MasrafIcon icon={Camera01Icon} size={18} color="#11100E" />
          مسح الإيصال
        </div>
        {stage === "upload" && (
          <div onClick={handleScan} style={{ background: "#F1EDE5", border: "2px dashed #DDD6CA", borderRadius: 16, padding: "32px", textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
            <div style={{ color: "#11100E", display: "flex", justifyContent: "center", marginBottom: 12 }}><MasrafIcon icon={Camera01Icon} size={38} color="currentColor" /></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>اضغط لرفع صورة الإيصال</div>
            <div style={{ marginTop: 16, background: "#11100E", color: "white", borderRadius: 10, padding: "10px 24px", display: "inline-block", fontSize: 13, fontWeight: 700 }}>اختر صورة (تجريبي)</div>
          </div>
        )}
        {stage === "scanning" && (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E" }}>يحلّل الذكاء الاصطناعي الإيصال...</div>
          </div>
        )}
        {stage === "result" && result && (
          <>
            <div style={{ background: "#FFFDF8", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#11100E", fontWeight: 700, marginBottom: 12 }}>✓ تم التعرف على الإيصال</div>
              {[
                { label: "التاجر", value: result.merchant },
                { label: "المبلغ", value: `$${result.amount}` },
                { label: "الفئة", value: result.category },
                { label: "التاريخ", value: result.date },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                  <span style={{ color: "#6D675E" }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: "#11100E" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { onToast?.("تم إضافة المصروف بنجاح", "success"); onClose(); }}
                style={{ flex: 2, background: "#11100E", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>✓ إضافة للمصاريف</button>
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
  const records = [
    { id: 1, amount: 32, reason: "عمولة مشبوهة المصدر",  date: "مارس ٢٠٢٦",   purified: true,  charity: "جمعية الأيتام الأردنية" },
    { id: 2, amount: 18, reason: "معاملة غير مصنّفة",    date: "فبراير ٢٠٢٦", purified: false, charity: "" },
  ];
  return (
    <div style={{ background: "#FFFDF8", borderRadius: 20, padding: "16px", border: "1px solid #DDD6CA", marginTop: 16, fontFamily: "IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#11100E", marginBottom: 4 }}>سجل التطهير (تطهير)</div>
      <div style={{ fontSize: 12, color: "#92897C", marginBottom: 14 }}>المبالغ غير الملتزمة التي تحتاج تطهيراً بالتصدق</div>
      {records.map((r) => (
        <div key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid #F1EDE5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#11100E" }}>{r.reason}</div>
            <div style={{ fontSize: 11, color: "#92897C", marginTop: 2 }}>{r.date}</div>
            {r.purified && <div style={{ fontSize: 11, color: "#11100E", marginTop: 2 }}>✓ {r.charity}</div>}
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#9C7614" }}>${r.amount}</div>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: r.purified ? "#FFFDF8" : "#FFF9E8", color: r.purified ? "#11100E" : "#9C7614", fontWeight: 700 }}>
              {r.purified ? "مُطهَّر" : "معلق"}
            </span>
          </div>
        </div>
      ))}
      <button style={{ width: "100%", marginTop: 14, background: "#11100E", color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "IBM Plex Sans Arabic" }}>
        + إضافة مبلغ للتطهير
      </button>
    </div>
  );
}
