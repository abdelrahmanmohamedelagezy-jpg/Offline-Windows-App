import type { PaymentMethod } from "@/lib/db";

export interface ReceiptData {
  invoiceId?: number | null;
  type: "service" | "product";
  barberName?: string;
  clientName?: string;
  clientPhone?: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  date: Date;
  paymentMethod?: PaymentMethod;
  instagramHandle?: string;
  tiktokHandle?: string;
}

const PAYMENT_META: Record<string, { label: string; emoji: string; bg: string; color: string; border: string }> = {
  cash:      { label: "كاش",         emoji: "💵", bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
  instapay:  { label: "إنستا باي",   emoji: "📲", bg: "#faf5ff", color: "#7c3aed", border: "#d8b4fe" },
  vodafone:  { label: "فودافون كاش", emoji: "📱", bg: "#fff1f2", color: "#CD0000", border: "#fca5a5" },
};

export function openReceiptWindow(data: ReceiptData) {
  const win = window.open("", "_blank", "width=430,height=880,scrollbars=yes,resizable=yes");
  if (!win) { alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة"); return; }

  const ig = data.instagramHandle || "@omarelsadany";
  const tt = data.tiktokHandle || "@omarelsadany";
  const igHandle = ig.startsWith("@") ? ig : "@" + ig;
  const ttHandle = tt.startsWith("@") ? tt : "@" + tt;
  const igUrl = `https://instagram.com/${ig.replace("@", "")}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(igUrl)}&color=003366&bgcolor=ffffff&margin=8&format=png&ecc=M`;
  const dateStr = new Date(data.date).toLocaleString("ar-EG");
  const pm = data.paymentMethod ? PAYMENT_META[data.paymentMethod] : PAYMENT_META["cash"];

  const rowsHtml = data.items.map(item => `
    <tr>
      <td class="item-name">${item.name}</td>
      <td class="item-qty">${item.quantity}</td>
      <td class="item-price">${item.price} ج</td>
      <td class="item-total">${item.price * item.quantity} ج</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>فاتورة #${data.invoiceId ?? ""} — Omar Elsadany</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{font-family:'Cairo',Arial,sans-serif;background:#f5f5f5;direction:rtl;}
    .page{width:320px;margin:8px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.12);}

    /* ── Header ── */
    .header{background:linear-gradient(135deg,#003366 0%,#004a8f 100%);padding:14px 16px 10px;text-align:center;position:relative;}
    .header::after{content:"";display:block;height:14px;background:#fff;clip-path:ellipse(54% 100% at 50% 100%);margin-top:6px;}
    .logo-wrap{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#CD0000;box-shadow:0 0 0 3px rgba(255,255,255,0.2);margin-bottom:5px;}
    .logo-scissors{font-size:18px;color:#fff;}
    .shop-name{font-size:15px;font-weight:900;color:#fff;letter-spacing:0.5px;}
    .shop-gold{color:#C19A6B;}
    .shop-sub{font-size:8px;color:rgba(255,255,255,0.65);margin-top:1px;letter-spacing:1px;text-transform:uppercase;}

    /* ── Divider ── */
    .scissors-divider{text-align:center;color:#ccc;font-size:10px;margin:2px 0;letter-spacing:2px;}

    /* ── Info box ── */
    .info-box{margin:0 10px 8px;background:#f8faff;border:1px solid #e0e7f0;border-radius:8px;padding:7px 10px;}
    .info-row{display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:10px;border-bottom:1px dashed #e8eef8;}
    .info-row:last-child{border-bottom:none;padding-bottom:0;}
    .info-label{color:#6b7280;font-weight:600;}
    .info-val{color:#003366;font-weight:700;text-align:left;}

    /* ── Items table ── */
    .items-wrap{margin:0 10px 8px;}
    .items-table{width:100%;border-collapse:collapse;font-size:10px;}
    .items-table thead tr{background:#003366;}
    .items-table thead th{color:#fff;padding:5px 6px;font-weight:700;font-size:9px;}
    .items-table thead th:first-child{text-align:right;border-radius:5px 0 0 0;}
    .items-table thead th:last-child{text-align:left;border-radius:0 5px 0 0;}
    .items-table thead th:nth-child(2),.items-table thead th:nth-child(3){text-align:center;}
    .item-name{padding:5px 6px;border-bottom:1px dashed #f0f0f0;font-weight:600;color:#1a1a2e;}
    .item-qty{padding:5px 6px;border-bottom:1px dashed #f0f0f0;text-align:center;color:#555;}
    .item-price{padding:5px 6px;border-bottom:1px dashed #f0f0f0;text-align:center;color:#888;}
    .item-total{padding:5px 6px;border-bottom:1px dashed #f0f0f0;text-align:left;font-weight:900;color:#CD0000;}
    .items-table tbody tr:last-child td{border-bottom:none;}
    .items-table tbody tr:nth-child(even) td{background:#fafafa;}

    /* ── Total ── */
    .total-box{margin:0 10px 8px;background:linear-gradient(135deg,#003366,#004a8f);border-radius:10px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;}
    .total-label{color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;}
    .total-amount{color:#C19A6B;font-size:20px;font-weight:900;}

    /* ── Payment badge ── */
    .payment-badge{margin:0 10px 8px;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 10px;border-radius:8px;font-size:11px;font-weight:900;border:1.5px solid;}

    /* ── QR section ── */
    .qr-section{margin:0 10px 10px;text-align:center;padding:10px 8px;border:1.5px dashed #cbd5e1;border-radius:10px;background:#f8faff;}
    .qr-title{font-size:8px;font-weight:700;color:#003366;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;}
    .qr-img{width:96px;height:96px;border-radius:6px;border:2px solid #003366;display:block;margin:0 auto 6px;}
    .qr-img-wrap{position:relative;display:inline-block;margin-bottom:6px;}
    .qr-center-badge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:22px;height:22px;background:#CD0000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 0 0 2px #fff;}
    .social-row{display:flex;justify-content:center;gap:10px;font-size:9px;font-weight:700;color:#003366;}
    .social-item{display:flex;align-items:center;gap:2px;}

    /* ── Footer ── */
    .footer{background:linear-gradient(135deg,#CD0000,#a30000);padding:9px 16px;text-align:center;}
    .footer-main{color:#fff;font-size:11px;font-weight:900;margin-bottom:1px;}
    .footer-sub{color:rgba(255,255,255,0.7);font-size:8px;}

    /* ── Print button ── */
    .print-btn-wrap{text-align:center;padding:12px;}
    .print-btn{background:#CD0000;color:#fff;border:none;padding:9px 32px;border-radius:8px;font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:background 0.2s;}
    .print-btn:hover{background:#a30000;}

    @media print{
      html,body{background:#fff;}
      .page{margin:0;box-shadow:none;border-radius:0;width:100%;}
      .print-btn-wrap{display:none!important;}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-wrap"><span class="logo-scissors">✂</span></div>
    <div class="shop-name"><span class="shop-gold">Omar</span> Elsadany</div>
    <div class="shop-sub">Premium Barber Shop</div>
  </div>

  <div class="scissors-divider">✦ · · · ✦ · · · ✦ · · · ✦</div>

  <!-- Invoice Info -->
  <div class="info-box">
    ${data.invoiceId ? `<div class="info-row"><span class="info-label">رقم الفاتورة</span><span class="info-val" style="color:#CD0000;font-size:15px">#${data.invoiceId}</span></div>` : ""}
    <div class="info-row"><span class="info-label">التاريخ</span><span class="info-val">${dateStr}</span></div>
    <div class="info-row"><span class="info-label">النوع</span><span class="info-val">${data.type === "service" ? "⚡ خدمات" : "📦 منتجات"}</span></div>
    ${data.barberName ? `<div class="info-row"><span class="info-label">الحلاق</span><span class="info-val">✂ ${data.barberName}</span></div>` : ""}
    ${data.clientName ? `<div class="info-row"><span class="info-label">العميل</span><span class="info-val">👤 ${data.clientName}</span></div>` : ""}
    ${data.clientPhone ? `<div class="info-row"><span class="info-label">الهاتف</span><span class="info-val">${data.clientPhone}</span></div>` : ""}
  </div>

  <!-- Items -->
  <div class="items-wrap">
    <table class="items-table">
      <thead>
        <tr>
          <th>البند</th>
          <th>عدد</th>
          <th>سعر</th>
          <th>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Total -->
  <div class="total-box">
    <span class="total-label">الإجمالي الكلي</span>
    <span class="total-amount">${data.total} ج</span>
  </div>

  <!-- Payment -->
  <div class="payment-badge" style="background:${pm.bg};color:${pm.color};border-color:${pm.border};">
    <span style="font-size:18px;">${pm.emoji}</span>
    <span>تم الدفع بـ ${pm.label}</span>
  </div>

  <div class="scissors-divider">· · · ✂ · · ·</div>

  <!-- QR -->
  <div class="qr-section">
    <div class="qr-title">تابعنا على السوشيال ميديا</div>
    <div class="qr-img-wrap">
      <img src="${qrApiUrl}" class="qr-img" alt="QR Code" onerror="this.style.display='none'" />
      <div class="qr-center-badge">✂</div>
    </div>
    <div class="social-row">
      <div class="social-item">📸 ${igHandle}</div>
      <div class="social-item">🎵 ${ttHandle}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-main">شكراً لزيارتكم 🙏</div>
    <div class="footer-sub">نتمنى لكم يومًا رائعًا — نحن في انتظاركم دائمًا</div>
  </div>

</div>

<div class="print-btn-wrap">
  <button class="print-btn" onclick="window.print()">🖨️ طباعة الفاتورة</button>
</div>

</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
