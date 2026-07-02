import type { PaymentMethod } from "@/lib/db";

export interface ReceiptData {
  invoiceId?: number | null;
  type: "service" | "product";
  barberName?: string;
  cashierName?: string;
  clientName?: string;
  clientPhone?: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  date: Date;
  paymentMethod?: PaymentMethod;
  instagramHandle?: string;
  tiktokHandle?: string;
}

const PM: Record<string, { label: string; emoji: string }> = {
  cash:     { label: "كاش",         emoji: "💵" },
  instapay: { label: "إنستا باي",   emoji: "📲" },
  vodafone: { label: "فودافون كاش", emoji: "📱" },
};

export function openReceiptWindow(data: ReceiptData) {
  const win = window.open("", "_blank", "width=360,height=700,scrollbars=yes,resizable=yes");
  if (!win) { alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة"); return; }

  const ig = (data.instagramHandle || "@omarelsadany").replace("@", "");
  const tt = (data.tiktokHandle || "@omarelsadany").replace("@", "");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent("https://instagram.com/" + ig)}&color=111111&bgcolor=ffffff&margin=4&format=png`;
  const dateStr = new Date(data.date).toLocaleString("ar-EG");
  const pm = PM[data.paymentMethod || "cash"] || PM.cash;

  const rows = data.items.map(i => `
    <tr>
      <td class="r-name">${i.name}</td>
      <td class="r-qty">${i.quantity}</td>
      <td class="r-unit">${i.price}</td>
      <td class="r-total">${i.price * i.quantity}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>فاتورة #${data.invoiceId ?? ""}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#eee;font-family:'Cairo',sans-serif;direction:rtl;}
.receipt{
  width:300px;
  margin:10px auto;
  background:#fff;
  padding:14px 12px 10px;
  font-size:11px;
  line-height:1.5;
}
/* ── header ── */
.h-center{text-align:center;}
.h-logo{font-size:22px;margin-bottom:2px;}
.h-name{font-size:15px;font-weight:900;letter-spacing:0.5px;color:#000;}
.h-sub{font-size:9px;color:#555;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;}
.dash{border:none;border-top:1.5px dashed #aaa;margin:5px 0;}
.eq{border:none;border-top:2px solid #000;margin:5px 0;}
/* ── info rows ── */
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px 6px;font-size:10px;margin:4px 0;}
.info-cell{display:flex;gap:3px;}
.lbl{color:#666;white-space:nowrap;}
.val{font-weight:700;color:#000;}
.info-full{font-size:10px;display:flex;gap:3px;margin:1px 0;}
/* ── items ── */
table{width:100%;border-collapse:collapse;font-size:10px;margin:4px 0;}
thead th{background:#000;color:#fff;padding:4px 3px;font-size:9px;font-weight:700;}
thead th:first-child{text-align:right;}
thead th:last-child{text-align:left;}
thead th:nth-child(2),thead th:nth-child(3){text-align:center;}
.r-name{padding:3px 3px;border-bottom:1px dashed #ddd;font-weight:600;}
.r-qty,.r-unit{padding:3px 3px;border-bottom:1px dashed #ddd;text-align:center;color:#444;}
.r-total{padding:3px 3px;border-bottom:1px dashed #ddd;text-align:left;font-weight:900;}
tbody tr:last-child td{border-bottom:none;}
/* ── total ── */
.total-row{display:flex;justify-content:space-between;align-items:baseline;padding:5px 2px;background:#000;color:#fff;margin:4px 0;}
.total-lbl{font-size:11px;font-weight:700;padding-right:6px;}
.total-amt{font-size:19px;font-weight:900;color:#d4a843;padding-left:6px;}
/* ── payment ── */
.pm-row{text-align:center;font-size:11px;font-weight:900;padding:4px 0;}
/* ── qr ── */
.qr-wrap{text-align:center;margin:6px 0 4px;}
.qr-img{width:100px;height:100px;border:2px solid #000;}
.social{font-size:9px;font-weight:700;color:#000;margin-top:3px;}
/* ── footer ── */
.footer-txt{text-align:center;font-size:10px;font-weight:900;padding:4px 0;}
/* ── print btn ── */
.print-wrap{text-align:center;padding:12px;}
.print-btn{background:#000;color:#fff;border:none;padding:9px 30px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
@page{
  size: 80mm auto;
  margin: 0;
}
@media print{
  html,body{background:#fff;width:80mm;}
  .receipt{margin:0;padding:6px 5px;width:80mm;box-shadow:none;}
  .print-wrap{display:none!important;}
}
</style>
</head>
<body>
<div class="receipt">

  <div class="h-center">
    <div class="h-logo">✂</div>
    <div class="h-name">OMAR ELSADANY</div>
    <div class="h-sub">Premium Barber Shop</div>
  </div>

  <hr class="eq"/>

  <div class="info-grid">
    ${data.invoiceId ? `<div class="info-cell"><span class="lbl">رقم:</span><span class="val">#${data.invoiceId}</span></div>` : "<div></div>"}
    <div class="info-cell"><span class="lbl">النوع:</span><span class="val">${data.type === "service" ? "خدمات" : "منتجات"}</span></div>
    ${data.barberName ? `<div class="info-cell"><span class="lbl">الحلاق:</span><span class="val">${data.barberName}</span></div>` : "<div></div>"}
    ${data.cashierName ? `<div class="info-cell"><span class="lbl">الكاشير:</span><span class="val">${data.cashierName}</span></div>` : "<div></div>"}
    ${data.clientName ? `<div class="info-cell"><span class="lbl">العميل:</span><span class="val">${data.clientName}</span></div>` : "<div></div>"}
    ${data.clientPhone ? `<div class="info-cell"><span class="lbl">الهاتف:</span><span class="val">${data.clientPhone}</span></div>` : "<div></div>"}
  </div>
  <div class="info-full"><span class="lbl">التاريخ:</span><span class="val">${dateStr}</span></div>

  <hr class="dash"/>

  <table>
    <thead><tr>
      <th>البند</th>
      <th>عدد</th>
      <th>سعر</th>
      <th>الإجمالي</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="total-row">
    <span class="total-lbl">الإجمالي الكلي</span>
    <span class="total-amt">${data.total} ج</span>
  </div>

  <hr class="dash"/>

  <div class="pm-row">${pm.emoji} تم الدفع بـ ${pm.label}</div>

  <hr class="eq"/>

  <div class="qr-wrap">
    <img class="qr-img" src="${qrUrl}" alt="QR" onerror="this.style.display='none'"/>
    <div class="social">📸 @${ig} &nbsp;|&nbsp; 🎵 @${tt}</div>
  </div>

  <hr class="dash"/>
  <div class="footer-txt">شكراً لزيارتكم — نراكم قريباً 🙏</div>
  <hr class="eq"/>

</div>
<div class="print-wrap">
  <button class="print-btn" onclick="window.print()">🖨 طباعة</button>
</div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
