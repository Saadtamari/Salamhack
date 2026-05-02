export function fmtAr(n: number) {
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);
}

export function buildInvoiceHtml(p: {
  id: string; client: string; clientEn: string; amount: number; due: string;
  status: string; business: string; currency: string; sym: string;
  subtotal: number; vat: number; terms?: string; description?: string;
}) {
  const m = (n: number) => `${fmtAr(n)} ${p.sym}`;
  const numDisplay = p.id.split("-").pop() ?? p.id;
  const statusColor = p.status === "overdue" ? "#B71C1C" : "#2A2520";
  const desc = p.description || "تصميم هوية بصرية";
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
        <div><div class="item-name">${desc}</div><div class="item-sub">Professional Service · ١ × ${m(p.subtotal)}</div></div>
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
