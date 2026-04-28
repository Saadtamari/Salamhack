// ─── Shared components: Toasts, Invoice Preview, Chaser, Receipt Scanner, Empty States
// Used by both mobile and desktop

const { useState: useSState, useEffect: useSEffect, useRef: useSRef } = React;

// ─── Toast System ─────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div style={{ position:"absolute", top:16, left:"50%", transform:"translateX(-50%)", zIndex:999, display:"flex", flexDirection:"column", gap:8, width:"90%", maxWidth:360, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="success" ? "#1B5E20" : t.type==="error" ? "#B71C1C" : t.type==="warning" ? "#E65100" : "#1A1A18",
          color:"white", borderRadius:14, padding:"12px 16px", fontSize:13, fontWeight:600,
          fontFamily:"IBM Plex Sans Arabic, sans-serif", boxShadow:"0 8px 24px rgba(0,0,0,0.2)",
          display:"flex", alignItems:"center", gap:10, pointerEvents:"all",
          animation:"toastSlide 0.3s ease-out"
        }}>
          <span style={{ fontSize:18 }}>{t.type==="success"?"✓":t.type==="error"?"✕":t.type==="warning"?"⚠️":"ℹ️"}</span>
          <div style={{ flex:1 }}>
            {t.title && <div style={{ fontWeight:700 }}>{t.title}</div>}
            <div style={{ opacity:0.9, fontSize:12 }}>{t.message}</div>
          </div>
        </div>
      ))}
      <style>{`@keyframes toastSlide { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = React.useState([]);
  function toast(message, type="success", title="") {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type, title }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }
  return { toasts, toast };
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon="📋", title, subtitle, cta, onCta }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 32px", textAlign:"center", fontFamily:"IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ width:80, height:80, borderRadius:24, background:"#F5F5F0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, marginBottom:20 }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:700, color:"#1A1A18", marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:13, color:"#9C9C95", marginBottom:24, maxWidth:240, lineHeight:1.7 }}>{subtitle}</div>
      {cta && <button onClick={onCta} style={{ background:"#1B5E20", color:"white", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>{cta}</button>}
    </div>
  );
}

// ─── Invoice Preview Modal ────────────────────────────────────────────────────
function InvoicePreviewModal({ invoice, onClose, onToast }) {
  const inv = invoice || window.MASRAF_DATA.invoices[2];
  const user = window.MASRAF_DATA.user;
  const currency = window.MASRAF_CURRENCY || "USD";
  const symbols = { USD: "$", SAR: "ر.س", AED: "د.إ", JOD: "د.أ", EGP: "ج.م", KWD: "د.ك" };
  const sym = symbols[currency] || currency;
  const subtotal = inv.amount / 1.16;
  const vat = inv.amount - subtotal;
  const fmtNum = (n) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);
  const fmtMoney = (n) => `${fmtNum(n)} ${sym}`;
  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(15,61,41,0.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"IBM Plex Sans Arabic, sans-serif", backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#FBF7F0", borderRadius:18, width:"100%", maxWidth:520, maxHeight:"94%", overflow:"auto", boxShadow:"0 30px 80px rgba(15,61,41,0.35)", border:"1px solid #E8DFCF" }}>

        {/* Slim header bar */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px 14px 14px", borderBottom:"1px solid #E8DFCF", background:"#FFFFFF" }}>
          <button onClick={onClose} style={{ background:"transparent", color:"#5C5346", border:"1px solid #E8DFCF", borderRadius:8, width:32, height:32, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }} aria-label="إغلاق">✕</button>
          <div style={{ flex:1, textAlign:"center", fontSize:11, fontWeight:700, color:"#C6A35A", letterSpacing:3, textTransform:"uppercase" }}>فاتورة · INVOICE</div>
          <button onClick={() => { onToast && onToast("تم تنزيل الفاتورة", "success", "PDF جاهز"); onClose(); }} style={{ background:"#0F3D29", color:"#F4EDE0", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>تنزيل PDF</button>
        </div>

        {/* Document body */}
        <div style={{ padding:"32px 28px 24px" }}>

          {/* Big invoice number */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:52, fontWeight:800, color:"#0F3D29", letterSpacing:"-1px", lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{inv.id.split("-").pop()}</div>
            <div style={{ fontSize:11, color:"#8A7F6F", marginTop:6, letterSpacing:1 }}>{inv.id}</div>
          </div>

          {/* From → To */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:28, paddingBottom:24, borderBottom:"1px solid #E8DFCF" }}>
            <div>
              <div style={{ fontSize:10, color:"#B8AC97", marginBottom:6, letterSpacing:1.5, textTransform:"uppercase" }}>من / From</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#2A2520" }}>{user.business}</div>
              <div style={{ fontSize:12, color:"#8A7F6F", marginTop:2 }}>الأردن · Jordan</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#B8AC97", marginBottom:6, letterSpacing:1.5, textTransform:"uppercase" }}>إلى / To</div>
              <div style={{ fontSize:15, fontWeight:700, color:"#2A2520" }}>{inv.client}</div>
              <div style={{ fontSize:12, color:"#8A7F6F", marginTop:2 }}>{inv.clientEn}</div>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:28 }}>
            <div>
              <div style={{ fontSize:10, color:"#B8AC97", marginBottom:6, letterSpacing:1.5, textTransform:"uppercase" }}>الإصدار</div>
              <div style={{ fontSize:13, fontWeight:600, color:"#2A2520" }}>٢٧ أبريل ٢٠٢٦</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#B8AC97", marginBottom:6, letterSpacing:1.5, textTransform:"uppercase" }}>الاستحقاق</div>
              <div style={{ fontSize:13, fontWeight:600, color: inv.status==="overdue" ? "#B71C1C" : "#2A2520" }}>{inv.due !== "—" ? inv.due : "٢٧ مايو ٢٠٢٦"}</div>
            </div>
          </div>

          {/* Items — clean rows, no green table header */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, paddingBottom:10, borderBottom:"1px solid #E8DFCF", marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#B8AC97", letterSpacing:1.5, textTransform:"uppercase" }}>الخدمة</div>
              <div style={{ fontSize:10, color:"#B8AC97", letterSpacing:1.5, textTransform:"uppercase" }}>المبلغ</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:16, alignItems:"baseline" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:600, color:"#2A2520" }}>تصميم هوية بصرية</div>
                <div style={{ fontSize:11, color:"#8A7F6F", marginTop:2 }}>Brand Identity Design · ١ × {fmtMoney(subtotal)}</div>
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:"#2A2520", fontVariantNumeric:"tabular-nums" }}>{fmtMoney(subtotal)}</div>
            </div>
          </div>

          {/* Totals — minimal */}
          <div style={{ borderTop:"1px solid #E8DFCF", paddingTop:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:13, color:"#5C5346" }}>
              <span>المجموع الفرعي</span><span style={{ fontVariantNumeric:"tabular-nums" }}>{fmtMoney(subtotal)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:13, color:"#5C5346" }}>
              <span>ضريبة القيمة المضافة (١٦٪)</span><span style={{ fontVariantNumeric:"tabular-nums" }}>{fmtMoney(vat)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"14px 0 0", marginTop:10, borderTop:"2px solid #0F3D29" }}>
              <span style={{ fontSize:13, fontWeight:600, color:"#2A2520" }}>الإجمالي</span>
              <span style={{ fontSize:24, fontWeight:800, color:"#0F3D29", fontVariantNumeric:"tabular-nums", letterSpacing:"-0.5px" }}>{fmtMoney(inv.amount)}</span>
            </div>
          </div>

          {/* Footer — calligraphic, no emoji */}
          <div style={{ marginTop:28, paddingTop:18, borderTop:"1px solid #E8DFCF", textAlign:"center" }}>
            <div style={{ fontSize:14, color:"#C6A35A", fontWeight:600, marginBottom:6, fontFamily:"IBM Plex Sans Arabic, serif", letterSpacing:0.5 }}>بسم الله الرحمن الرحيم</div>
            <div style={{ fontSize:10, color:"#B8AC97", letterSpacing:1.5, textTransform:"uppercase" }}>Sharia-Compliant Transaction</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Chaser Modal ─────────────────────────────────────────────────────
function ChaserModal({ invoice, onClose, onToast }) {
  const [tone, setTone] = React.useState("soft");
  const [generating, setGenerating] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const messages = {
    soft: `السلام عليكم ورحمة الله وبركاته،\n\nأرجو أن تكونوا بخير. أودّ التذكير الودي بالفاتورة رقم ${invoice?.id || "INV-2026-018"} بمبلغ ${invoice?.amount || 2400} دولار والتي كان موعد استحقاقها ${invoice?.due || "٥ أبريل ٢٠٢٦"}.\n\nنتطلع لإتمام هذا الأمر في أقرب وقت ممكن. جزاكم الله خيراً.\n\nمع التقدير،\nأحمد الشمري`,
    firm: `تحية طيبة،\n\nنُذكّركم بضرورة تسوية الفاتورة رقم ${invoice?.id || "INV-2026-018"} البالغة ${invoice?.amount || 2400} دولار والمتأخرة منذ ${invoice?.daysOverdue || 22} يوماً.\n\nيُرجى التواصل فوراً لترتيب السداد وتجنّب أي تبعات إضافية.\n\nأحمد الشمري`
  };

  function generate() {
    setGenerating(true);
    setMessage("");
    setTimeout(() => {
      setGenerating(false);
      setMessage(messages[tone]);
    }, 1400);
  }

  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"flex-end", fontFamily:"IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0", width:"100%", maxHeight:"88%", overflow:"auto", padding:"20px" }}>
        <div style={{ width:40, height:4, background:"#E8E5DE", borderRadius:2, margin:"0 auto 20px" }}></div>
        <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:4 }}>متابعة الدفع 🤖</div>
        <div style={{ fontSize:12, color:"#9C9C95", marginBottom:20 }}>الذكاء الاصطناعي يولّد رسالة تحصيل مناسبة ثقافياً</div>

        {/* Tone selector */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[{k:"soft",l:"لطيف 🤝"},{k:"firm",l:"حازم 💼"}].map(t => (
            <button key={t.k} onClick={() => { setTone(t.k); setMessage(""); }}
              style={{ flex:1, background:tone===t.k?"#7B1FA2":"#F5F5F0", color:tone===t.k?"white":"#1A1A18", border:"none", borderRadius:12, padding:"10px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>
              {t.l}
            </button>
          ))}
        </div>

        <button onClick={generate} disabled={generating}
          style={{ width:"100%", background: generating ? "#E8E5DE" : "linear-gradient(135deg,#7B1FA2,#AB47BC)", color: generating ? "#9C9C95" : "white", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:700, cursor:generating?"not-allowed":"pointer", marginBottom:16, fontFamily:"IBM Plex Sans Arabic" }}>
          {generating ? "⚙️ يولّد الذكاء الاصطناعي..." : "✨ ولّد الرسالة"}
        </button>

        {message && (
          <>
            <div style={{ background:"#F5F5F0", borderRadius:14, padding:"14px 16px", fontSize:13, color:"#1A1A18", lineHeight:1.8, whiteSpace:"pre-line", marginBottom:16, direction:"rtl" }}>{message}</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { onToast && onToast("تم إرسال رسالة المتابعة بنجاح", "success"); onClose(); }}
                style={{ flex:2, background:"#1B5E20", color:"white", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>✓ أرسل الآن</button>
              <button onClick={onClose}
                style={{ flex:1, background:"#F5F5F0", color:"#1A1A18", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Receipt Scanner ──────────────────────────────────────────────────────────
function ReceiptScanner({ onClose, onToast }) {
  const [stage, setStage] = React.useState("upload"); // upload | scanning | result
  const [result, setResult] = React.useState(null);

  function handleScan() {
    setStage("scanning");
    setTimeout(() => {
      setResult({ merchant:"مطعم الرياض", amount:42, category:"طعام ومطاعم", date:"٢٧ أبريل ٢٠٢٦", halal:true });
      setStage("result");
    }, 2000);
  }

  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"flex-end", fontFamily:"IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ background:"#FFFFFF", borderRadius:"20px 20px 0 0", width:"100%", padding:"20px" }}>
        <div style={{ width:40, height:4, background:"#E8E5DE", borderRadius:2, margin:"0 auto 20px" }}></div>
        <div style={{ fontSize:16, fontWeight:800, color:"#1A1A18", marginBottom:4 }}>مسح الإيصال 📸</div>
        <div style={{ fontSize:12, color:"#9C9C95", marginBottom:20 }}>ارفع صورة الإيصال وسيصنّفه الذكاء الاصطناعي تلقائياً</div>

        {stage === "upload" && (
          <div onClick={handleScan} style={{ background:"#F5F5F0", border:"2px dashed #E8E5DE", borderRadius:16, padding:"32px", textAlign:"center", cursor:"pointer", marginBottom:16 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📷</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>اضغط لرفع صورة الإيصال</div>
            <div style={{ fontSize:12, color:"#9C9C95", marginTop:4 }}>JPG, PNG — حتى ١٠ ميجابايت</div>
            <div style={{ marginTop:16, background:"#1B5E20", color:"white", borderRadius:10, padding:"10px 24px", display:"inline-block", fontSize:13, fontWeight:700 }}>اختر صورة (تجريبي)</div>
          </div>
        )}

        {stage === "scanning" && (
          <div style={{ textAlign:"center", padding:"32px" }}>
            <div style={{ fontSize:36, marginBottom:16 }}>🔍</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#7B1FA2" }}>يحلّل الذكاء الاصطناعي الإيصال...</div>
            <div style={{ fontSize:12, color:"#9C9C95", marginTop:8 }}>يستخرج المبلغ والتاجر والفئة</div>
          </div>
        )}

        {stage === "result" && result && (
          <>
            <div style={{ background:"#E8F5E9", borderRadius:14, padding:"16px", marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#1B5E20", fontWeight:700, marginBottom:12 }}>✓ تم التعرف على الإيصال</div>
              {[
                { label:"التاجر", value:result.merchant },
                { label:"المبلغ", value:`$${result.amount}` },
                { label:"الفئة", value:result.category },
                { label:"التاريخ", value:result.date },
                { label:"الحالة", value:result.halal ? "✓ حلال" : "⚠️ يحتاج مراجعة" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:13 }}>
                  <span style={{ color:"#6B6B65" }}>{r.label}</span>
                  <span style={{ fontWeight:700, color:"#1A1A18" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => { onToast && onToast("تم إضافة المصروف بنجاح", "success"); onClose(); }}
                style={{ flex:2, background:"#1B5E20", color:"white", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>✓ إضافة للمصاريف</button>
              <button onClick={onClose} style={{ flex:1, background:"#F5F5F0", color:"#1A1A18", border:"none", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>إلغاء</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Purification Ledger (تطهير) ──────────────────────────────────────────────
function PurificationLedger() {
  const records = [
    { id:1, amount:32, reason:"عمولة مشبوهة المصدر", date:"مارس ٢٠٢٦", purified:true, charity:"جمعية الأيتام الأردنية" },
    { id:2, amount:18, reason:"معاملة غير مصنّفة", date:"فبراير ٢٠٢٦", purified:false, charity:"" },
  ];
  return (
    <div style={{ background:"#FFFFFF", borderRadius:20, padding:"16px", border:"1px solid #E8E5DE", marginTop:16, fontFamily:"IBM Plex Sans Arabic, sans-serif" }}>
      <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18", marginBottom:4 }}>سجل التطهير (تطهير)</div>
      <div style={{ fontSize:12, color:"#9C9C95", marginBottom:14 }}>المبالغ غير الملتزمة التي تحتاج تطهيراً بالتصدق</div>
      {records.map(r => (
        <div key={r.id} style={{ padding:"12px 0", borderBottom:"1px solid #F5F5F0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#1A1A18" }}>{r.reason}</div>
            <div style={{ fontSize:11, color:"#9C9C95", marginTop:2 }}>{r.date}</div>
            {r.purified && <div style={{ fontSize:11, color:"#1B5E20", marginTop:2 }}>✓ {r.charity}</div>}
          </div>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#C6930A" }}>${r.amount}</div>
            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:r.purified?"#E8F5E9":"#FFF8E1", color:r.purified?"#1B5E20":"#C6930A", fontWeight:700 }}>
              {r.purified ? "مُطهَّر" : "معلق"}
            </span>
          </div>
        </div>
      ))}
      <button style={{ width:"100%", marginTop:14, background:"linear-gradient(135deg,#C6930A,#7A5906)", color:"white", border:"none", borderRadius:12, padding:"12px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"IBM Plex Sans Arabic" }}>
        + إضافة مبلغ للتطهير
      </button>
    </div>
  );
}

// ─── Runway Indicator ─────────────────────────────────────────────────────────
function RunwayIndicator({ days=47 }) {
  const color = days > 60 ? "#1B5E20" : days > 30 ? "#C6930A" : "#B71C1C";
  const bg    = days > 60 ? "#E8F5E9" : days > 30 ? "#FFF8E1" : "#FFEBEE";
  return (
    <div style={{ background:bg, borderRadius:14, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"IBM Plex Sans Arabic, sans-serif" }}>
      <div>
        <div style={{ fontSize:11, color, fontWeight:600 }}>🛩️ المدرج المالي</div>
        <div style={{ fontSize:12, color:"#6B6B65", marginTop:2 }}>المصاريف الحالية تكفي لـ</div>
      </div>
      <div style={{ textAlign:"left" }}>
        <div style={{ fontSize:26, fontWeight:900, color, lineHeight:1 }}>{days}</div>
        <div style={{ fontSize:11, color, fontWeight:600 }}>يوماً</div>
      </div>
    </div>
  );
}

// ─── Halal Badge ──────────────────────────────────────────────────────────────
function HalalBadge({ halal = true }) {
  return (
    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:halal?"#E8F5E9":"#FFEBEE", color:halal?"#1B5E20":"#B71C1C", fontWeight:700, fontFamily:"IBM Plex Sans Arabic" }}>
      {halal ? "حلال" : "مشبوه"}
    </span>
  );
}

// ─── Voice Persona Selector ───────────────────────────────────────────────────
function VoicePersonaSelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:10, fontFamily:"IBM Plex Sans Arabic, sans-serif" }}>
      {[
        { key:"abdullah", label:"عبدالله", icon:"👨", sub:"صوت ذكوري سعودي" },
        { key:"sha",      label:"شا",      icon:"👩", sub:"صوت أنثوي سعودي" },
      ].map(p => (
        <div key={p.key} onClick={() => onChange(p.key)}
          style={{ flex:1, background:value===p.key?"#7B1FA2":"#F5F5F0", borderRadius:14, padding:"12px", cursor:"pointer", textAlign:"center", transition:"all 0.15s", border:value===p.key?"2px solid #7B1FA2":"2px solid transparent" }}>
          <div style={{ fontSize:28 }}>{p.icon}</div>
          <div style={{ fontSize:13, fontWeight:700, color:value===p.key?"white":"#1A1A18", marginTop:4 }}>{p.label}</div>
          <div style={{ fontSize:10, color:value===p.key?"rgba(255,255,255,0.75)":"#9C9C95", marginTop:2 }}>{p.sub}</div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  ToastContainer, useToast, EmptyState,
  InvoicePreviewModal, ChaserModal,
  ReceiptScanner, PurificationLedger,
  RunwayIndicator, HalalBadge, VoicePersonaSelector,
});
