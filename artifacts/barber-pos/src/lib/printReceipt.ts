export interface ReceiptData {
  invoiceId?: number | null;
  type: "service" | "product";
  barberName?: string;
  clientName?: string;
  clientPhone?: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  date: Date;
  instagramHandle?: string;
  tiktokHandle?: string;
}

export function openReceiptWindow(data: ReceiptData) {
  const win = window.open("", "_blank", "width=400,height=700,scrollbars=yes");
  if (!win) {
    alert("يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة");
    return;
  }

  const ig = data.instagramHandle || "@omarelsadany";
  const tt = data.tiktokHandle || "@omarelsadany";
  const qrUrl = `https://instagram.com/${ig.replace("@", "")}`;
  const dateStr = new Date(data.date).toLocaleString("ar-EG");

  const rowsHtml = data.items.map(item => `
    <tr>
      <td style="padding:5px 4px;border-bottom:1px dashed #eee;font-size:13px;">${item.name}</td>
      <td style="padding:5px 4px;border-bottom:1px dashed #eee;text-align:center;font-size:13px;">${item.quantity}</td>
      <td style="padding:5px 4px;border-bottom:1px dashed #eee;text-align:left;font-size:13px;font-weight:bold;">${item.price * item.quantity} ج</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>فاتورة - Omar Elsadany</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { margin:0;padding:0;box-sizing:border-box; }
    body { font-family:'Cairo',Arial,sans-serif; background:#fff; color:#111; direction:rtl; }
    .receipt { width:80mm; max-width:320px; margin:0 auto; padding:16px 12px; }
    .header { text-align:center; border-bottom:2px solid #003366; padding-bottom:12px; margin-bottom:12px; }
    .logo-circle { width:52px;height:52px;border-radius:50%;background:#CD0000;display:inline-flex;align-items:center;justify-content:center;margin-bottom:6px; }
    .logo-icon { font-size:22px;color:#fff; }
    .shop-name { font-size:20px;font-weight:900;color:#003366;line-height:1.1; }
    .shop-sub { font-size:11px;color:#595D62;margin-top:2px; }
    .invoice-info { background:#f8f9fa;border-radius:8px;padding:8px 10px;margin-bottom:12px;font-size:11px;color:#595D62; }
    .invoice-info .inv-row { display:flex;justify-content:space-between;margin-bottom:3px; }
    .invoice-info .inv-row:last-child { margin-bottom:0; }
    .inv-val { font-weight:700;color:#003366; }
    .items-table { width:100%;border-collapse:collapse;margin-bottom:12px; }
    .items-table thead th { background:#003366;color:#fff;padding:6px 4px;font-size:12px;font-weight:700; }
    .items-table thead th:first-child { text-align:right; }
    .items-table thead th:last-child { text-align:left; }
    .items-table thead th:nth-child(2) { text-align:center; }
    .total-row { display:flex;justify-content:space-between;align-items:center;background:#003366;color:#fff;border-radius:8px;padding:10px 12px;margin-bottom:14px; }
    .total-label { font-size:13px;font-weight:600; }
    .total-amount { font-size:22px;font-weight:900;color:#C19A6B; }
    .qr-section { text-align:center;border-top:1px dashed #ccc;padding-top:12px;margin-bottom:8px; }
    .qr-section canvas, .qr-section img { display:inline-block; }
    .social-handles { display:flex;justify-content:center;gap:16px;margin-top:8px;font-size:11px;color:#003366;font-weight:700; }
    .footer { text-align:center;border-top:2px solid #CD0000;padding-top:10px;margin-top:2px; }
    .footer p { font-size:12px;font-weight:700;color:#003366;margin-bottom:3px; }
    .footer small { font-size:10px;color:#595D62; }
    @media print {
      body { background:#fff; }
      .print-btn { display:none!important; }
      .receipt { margin:0;padding:12px 8px; }
    }
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="logo-circle"><span class="logo-icon">✂</span></div>
    <div class="shop-name">Omar Elsadany</div>
    <div class="shop-sub">صالون الحلاقة الفاخر</div>
  </div>

  <div class="invoice-info">
    ${data.invoiceId ? `<div class="inv-row"><span>رقم الفاتورة</span><span class="inv-val">#${data.invoiceId}</span></div>` : ""}
    <div class="inv-row"><span>التاريخ والوقت</span><span class="inv-val">${dateStr}</span></div>
    ${data.barberName ? `<div class="inv-row"><span>الحلاق</span><span class="inv-val">${data.barberName}</span></div>` : ""}
    ${data.clientName ? `<div class="inv-row"><span>العميل</span><span class="inv-val">${data.clientName}</span></div>` : ""}
    ${data.clientPhone ? `<div class="inv-row"><span>الهاتف</span><span class="inv-val">${data.clientPhone}</span></div>` : ""}
    <div class="inv-row"><span>النوع</span><span class="inv-val">${data.type === "service" ? "خدمات" : "منتجات"}</span></div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>البند</th>
        <th style="text-align:center;">عدد</th>
        <th style="text-align:left;">السعر</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="total-row">
    <span class="total-label">الإجمالي</span>
    <span class="total-amount">${data.total} ج</span>
  </div>

  <div class="qr-section">
    <canvas id="qr-canvas"></canvas>
    <div class="social-handles">
      <span>Instagram: ${ig}</span>
      <span>TikTok: ${tt}</span>
    </div>
  </div>

  <div class="footer">
    <p>شكرًا لزيارتكم</p>
    <small>نتمنى لكم يومًا رائعًا — عودوا قريبًا</small>
  </div>

  <div style="text-align:center;margin-top:14px;">
    <button class="print-btn" onclick="window.print()" style="background:#CD0000;color:#fff;border:none;padding:10px 32px;border-radius:8px;font-family:Cairo,sans-serif;font-size:14px;font-weight:700;cursor:pointer;">
      طباعة الفاتورة
    </button>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(document.getElementById('qr-canvas'), '${qrUrl}', {
        width: 100, margin: 1,
        color: { dark: '#003366', light: '#ffffff' }
      });
    }
  });
</script>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
}
