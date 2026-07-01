const BASE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Cairo',Arial,sans-serif; background:#fff; color:#111; direction:rtl; font-size:13px; }
  .page { max-width:900px; margin:0 auto; padding:24px 28px; }
  .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:14px; border-bottom:3px solid #003366; margin-bottom:20px; }
  .header-left { display:flex; align-items:center; gap:14px; }
  .logo { width:52px; height:52px; border-radius:50%; background:#CD0000; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; flex-shrink:0; }
  .shop-name { font-size:22px; font-weight:900; color:#003366; }
  .shop-sub { font-size:11px; color:#595D62; margin-top:2px; }
  .report-title { text-align:left; }
  .report-title h2 { font-size:16px; font-weight:700; color:#CD0000; }
  .report-title p { font-size:11px; color:#595D62; margin-top:3px; }
  .section { margin-bottom:22px; }
  .section-title { font-size:14px; font-weight:900; color:#003366; background:#f0f4fa; padding:7px 14px; border-right:4px solid #CD0000; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  thead tr { background:#003366; color:#fff; }
  thead th { padding:8px 12px; text-align:right; font-weight:700; }
  tbody tr { border-bottom:1px solid #e8e8e8; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  tbody td { padding:7px 12px; }
  tfoot tr { background:#f0f4fa; font-weight:700; border-top:2px solid #003366; }
  tfoot td { padding:8px 12px; }
  .kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
  .kpi { border:1px solid #e0e7f0; border-radius:10px; padding:12px 16px; text-align:center; }
  .kpi-value { font-size:22px; font-weight:900; color:#003366; }
  .kpi-label { font-size:11px; color:#595D62; margin-top:3px; }
  .kpi.red .kpi-value { color:#CD0000; }
  .kpi.gold .kpi-value { color:#C19A6B; }
  .kpi.green .kpi-value { color:#15803d; }
  .badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700; }
  .badge-blue { background:#dbeafe; color:#003366; }
  .badge-red { background:#fee2e2; color:#CD0000; }
  .badge-green { background:#dcfce7; color:#15803d; }
  .badge-yellow { background:#fef9c3; color:#854d0e; }
  .footer { margin-top:28px; padding-top:12px; border-top:2px solid #CD0000; display:flex; justify-content:space-between; align-items:center; }
  .footer p { font-size:10px; color:#595D62; }
  .print-btn { display:block; margin:18px auto 0; background:#003366; color:#fff; border:none; padding:11px 40px; border-radius:10px; font-family:Cairo,sans-serif; font-size:14px; font-weight:700; cursor:pointer; }
  @media print {
    .print-btn { display:none !important; }
    body { background:#fff; }
    .page { padding:10px 14px; }
  }
`;

function openReportWindow(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=960,height=750,scrollbars=yes");
  if (!win) { alert("يرجى السماح بالنوافذ المنبثقة لتصدير التقرير"); return; }
  const now = new Date().toLocaleString("ar-EG");
  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="logo">✂</div>
      <div>
        <div class="shop-name">Omar Elsadany</div>
        <div class="shop-sub">صالون الحلاقة الفاخر</div>
      </div>
    </div>
    <div class="report-title">
      <h2>${title}</h2>
      <p>طُبع بتاريخ: ${now}</p>
    </div>
  </div>
  ${bodyHtml}
  <div class="footer">
    <p>تصميم وتطوير: عبد الرحمن العديزي</p>
    <p>Omar Elsadany Barber POS &copy; ${new Date().getFullYear()}</p>
  </div>
</div>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
}

/* ── Attendance ─────────────────────────────────────────── */
export interface AttendanceRow {
  date: string;
  barberName: string;
  status: "present" | "absent" | "late";
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export function exportAttendancePDF(fromDate: string, toDate: string, rows: AttendanceRow[]) {
  const statusLabel = (s: string) =>
    s === "present" ? `<span class="badge badge-green">حاضر</span>` :
    s === "late"    ? `<span class="badge badge-yellow">متأخر</span>` :
                     `<span class="badge badge-red">غائب</span>`;

  const presentCount = rows.filter(r => r.status === "present").length;
  const absentCount  = rows.filter(r => r.status === "absent").length;
  const lateCount    = rows.filter(r => r.status === "late").length;

  const body = `
    <div class="section">
      <div class="section-title">ملخص الفترة: ${fromDate} — ${toDate}</div>
      <div class="kpi-grid">
        <div class="kpi green"><div class="kpi-value">${presentCount}</div><div class="kpi-label">حاضر</div></div>
        <div class="kpi red"><div class="kpi-value">${absentCount}</div><div class="kpi-label">غائب</div></div>
        <div class="kpi gold"><div class="kpi-value">${lateCount}</div><div class="kpi-label">متأخر</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">تفاصيل الحضور والانصراف</div>
      <table>
        <thead><tr>
          <th>التاريخ</th><th>الحلاق</th><th>الحالة</th><th>وقت الدخول</th><th>وقت الخروج</th><th>ملاحظات</th>
        </tr></thead>
        <tbody>
          ${rows.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888">لا توجد سجلات</td></tr>` :
            rows.sort((a,b) => a.date.localeCompare(b.date)).map(r => `
              <tr>
                <td>${r.date}</td>
                <td style="font-weight:700">${r.barberName}</td>
                <td>${statusLabel(r.status)}</td>
                <td>${r.checkIn || "—"}</td>
                <td>${r.checkOut || "—"}</td>
                <td style="color:#888;font-size:11px">${r.notes || "—"}</td>
              </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  openReportWindow("تقرير الحضور والانصراف", body);
}

/* ── Expenses ───────────────────────────────────────────── */
export interface ExpenseRow {
  description: string;
  category: string;
  amount: number;
  date: Date | string;
  notes?: string;
}

export function exportExpensesPDF(filterLabel: string, rows: ExpenseRow[]) {
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byCategory = new Map<string, number>();
  for (const r of rows) byCategory.set(r.category, (byCategory.get(r.category) || 0) + r.amount);

  const catRows = Array.from(byCategory.entries()).map(([cat, amt]) => `
    <tr><td>${cat}</td><td style="font-weight:900;color:#CD0000">${amt} ج</td></tr>`).join("");

  const body = `
    <div class="section">
      <div class="section-title">ملخص — ${filterLabel}</div>
      <div class="kpi-grid" style="grid-template-columns:1fr 1fr">
        <div class="kpi red"><div class="kpi-value">${total} ج</div><div class="kpi-label">إجمالي المصروفات</div></div>
        <div class="kpi"><div class="kpi-value">${rows.length}</div><div class="kpi-label">عدد البنود</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">المصروفات حسب الفئة</div>
      <table><thead><tr><th>الفئة</th><th>الإجمالي</th></tr></thead>
      <tbody>${catRows}</tbody></table>
    </div>
    <div class="section">
      <div class="section-title">تفاصيل المصروفات</div>
      <table>
        <thead><tr><th>#</th><th>الوصف</th><th>الفئة</th><th>المبلغ</th><th>التاريخ</th><th>ملاحظات</th></tr></thead>
        <tbody>
          ${rows.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:20px;color:#888">لا توجد مصروفات</td></tr>` :
            rows.map((r, i) => `
              <tr>
                <td style="color:#888">${i + 1}</td>
                <td style="font-weight:700">${r.description}</td>
                <td><span class="badge badge-blue">${r.category}</span></td>
                <td style="font-weight:900;color:#CD0000">${r.amount} ج</td>
                <td>${new Date(r.date).toLocaleDateString("ar-EG")}</td>
                <td style="color:#888;font-size:11px">${r.notes || "—"}</td>
              </tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="3">الإجمالي</td><td style="color:#CD0000">${total} ج</td><td colspan="2"></td></tr></tfoot>
      </table>
    </div>`;
  openReportWindow("تقرير المصروفات", body);
}

/* ── Financial Reports ──────────────────────────────────── */
export interface FinancialSummary {
  revenue: number; expenses: number; profit: number;
  serviceRevenue: number; productRevenue: number; invoiceCount: number;
}

export function exportFinancialPDF(
  fromDate: string, toDate: string,
  summary: FinancialSummary,
  barberData: { name: string; total: number }[],
  serviceData: { name: string; count: number }[],
) {
  const body = `
    <div class="section">
      <div class="section-title">الملخص المالي: ${fromDate} — ${toDate}</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-value">${summary.revenue} ج</div><div class="kpi-label">إجمالي الإيرادات</div></div>
        <div class="kpi red"><div class="kpi-value">${summary.serviceRevenue} ج</div><div class="kpi-label">إيرادات الخدمات</div></div>
        <div class="kpi gold"><div class="kpi-value">${summary.productRevenue} ج</div><div class="kpi-label">إيرادات المنتجات</div></div>
        <div class="kpi"><div class="kpi-value" style="color:#595D62">${summary.expenses} ج</div><div class="kpi-label">إجمالي المصروفات</div></div>
        <div class="kpi ${summary.profit >= 0 ? "green" : "red"}"><div class="kpi-value">${summary.profit} ج</div><div class="kpi-label">صافي الربح</div></div>
        <div class="kpi"><div class="kpi-value">${summary.invoiceCount}</div><div class="kpi-label">عدد الفواتير</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">إيرادات الحلاقين</div>
      <table>
        <thead><tr><th>الحلاق</th><th>الإيراد</th><th>النسبة %</th></tr></thead>
        <tbody>
          ${barberData.length === 0 ? `<tr><td colspan="3" style="text-align:center;padding:16px;color:#888">لا توجد بيانات</td></tr>` :
            barberData.map(b => `
              <tr>
                <td style="font-weight:700">${b.name}</td>
                <td style="font-weight:900;color:#C19A6B">${b.total} ج</td>
                <td>${summary.revenue > 0 ? Math.round(b.total / summary.revenue * 100) : 0}%</td>
              </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="section">
      <div class="section-title">أكثر الخدمات طلبًا</div>
      <table>
        <thead><tr><th>الخدمة</th><th>عدد المرات</th></tr></thead>
        <tbody>
          ${serviceData.length === 0 ? `<tr><td colspan="2" style="text-align:center;padding:16px;color:#888">لا توجد بيانات</td></tr>` :
            serviceData.map(s => `<tr><td style="font-weight:700">${s.name}</td><td style="color:#003366;font-weight:900">${s.count}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  openReportWindow("التقرير المالي الشامل", body);
}

/* ── Barber Payroll ─────────────────────────────────────── */
export interface BarberReportData {
  name: string; code: string; phone?: string;
  fromDate: string; toDate: string;
  invoices: { clientName?: string; total: number; date: Date | string; items: { name: string }[] }[];
  totalRevenue: number;
  presentDays: number; absentDays: number; lateDays: number;
  bonuses: number; deductions: number; netSalary: number;
  adjustments: { type: string; amount: number; reason: string; date: Date | string }[];
}

export function exportBarberPDF(d: BarberReportData) {
  const body = `
    <div class="section">
      <div class="section-title">بيانات الحلاق</div>
      <table style="width:auto;min-width:340px">
        <tbody>
          <tr><td style="font-weight:700;width:130px">الاسم</td><td>${d.name}</td></tr>
          <tr><td style="font-weight:700">الكود</td><td>${d.code}</td></tr>
          ${d.phone ? `<tr><td style="font-weight:700">الهاتف</td><td>${d.phone}</td></tr>` : ""}
          <tr><td style="font-weight:700">الفترة</td><td>${d.fromDate} — ${d.toDate}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="section">
      <div class="section-title">ملخص الأداء</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-value">${d.invoices.length}</div><div class="kpi-label">عدد الفواتير</div></div>
        <div class="kpi gold"><div class="kpi-value">${d.totalRevenue} ج</div><div class="kpi-label">إجمالي الإيراد</div></div>
        <div class="kpi green"><div class="kpi-value">${d.presentDays}</div><div class="kpi-label">أيام الحضور</div></div>
        <div class="kpi red"><div class="kpi-value">${d.absentDays}</div><div class="kpi-label">أيام الغياب</div></div>
        <div class="kpi"><div class="kpi-value">${d.bonuses} ج</div><div class="kpi-label">المكافآت</div></div>
        <div class="kpi ${d.netSalary >= 0 ? "green" : "red"}"><div class="kpi-value">${d.netSalary >= 0 ? "+" : ""}${d.netSalary} ج</div><div class="kpi-label">صافي التسويات</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">المكافآت والخصومات</div>
      <table>
        <thead><tr><th>النوع</th><th>المبلغ</th><th>السبب</th><th>التاريخ</th></tr></thead>
        <tbody>
          ${d.adjustments.length === 0 ? `<tr><td colspan="4" style="text-align:center;padding:14px;color:#888">لا توجد تسويات</td></tr>` :
            d.adjustments.map(a => `
              <tr>
                <td><span class="badge ${a.type === "bonus" ? "badge-green" : "badge-red"}">${a.type === "bonus" ? "مكافأة" : "خصم"}</span></td>
                <td style="font-weight:900;color:${a.type === "bonus" ? "#15803d" : "#CD0000"}">${a.type === "bonus" ? "+" : "-"}${a.amount} ج</td>
                <td>${a.reason}</td>
                <td>${new Date(a.date).toLocaleDateString("ar-EG")}</td>
              </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="section">
      <div class="section-title">الفواتير (${d.invoices.length})</div>
      <table>
        <thead><tr><th>#</th><th>العميل</th><th>الخدمات</th><th>الإجمالي</th><th>التاريخ</th></tr></thead>
        <tbody>
          ${d.invoices.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:14px;color:#888">لا توجد فواتير</td></tr>` :
            d.invoices.map((inv, i) => `
              <tr>
                <td style="color:#888">${i + 1}</td>
                <td>${inv.clientName || "—"}</td>
                <td style="font-size:11px;color:#595D62">${inv.items.map(x => x.name).join("، ")}</td>
                <td style="font-weight:900;color:#C19A6B">${inv.total} ج</td>
                <td>${new Date(inv.date).toLocaleDateString("ar-EG")}</td>
              </tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="3">الإجمالي</td><td style="color:#C19A6B">${d.totalRevenue} ج</td><td></td></tr></tfoot>
      </table>
    </div>`;
  openReportWindow(`تقرير الحلاق — ${d.name}`, body);
}

/* ── End of Day ─────────────────────────────────────────── */
export interface EndOfDayInvoice {
  type: string; barberName?: string; clientName?: string; total: number; date: Date | string;
}

export function exportEndOfDayPDF(dateStr: string, invoices: EndOfDayInvoice[], totalExpenses: number) {
  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const netProfit = totalRevenue - totalExpenses;

  const body = `
    <div class="section">
      <div class="section-title">ملخص اليوم — ${dateStr}</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-value">${totalRevenue} ج</div><div class="kpi-label">إجمالي الإيرادات</div></div>
        <div class="kpi red"><div class="kpi-value">${totalExpenses} ج</div><div class="kpi-label">إجمالي المصروفات</div></div>
        <div class="kpi ${netProfit >= 0 ? "green" : "red"}"><div class="kpi-value">${netProfit} ج</div><div class="kpi-label">صافي الربح</div></div>
        <div class="kpi"><div class="kpi-value">${invoices.length}</div><div class="kpi-label">عدد الفواتير</div></div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">تفاصيل الفواتير</div>
      <table>
        <thead><tr><th>#</th><th>النوع</th><th>الحلاق</th><th>العميل</th><th>الإجمالي</th><th>الوقت</th></tr></thead>
        <tbody>
          ${invoices.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:16px;color:#888">لا توجد فواتير اليوم</td></tr>` :
            invoices.map((inv, i) => `
              <tr>
                <td style="color:#888">${i + 1}</td>
                <td><span class="badge ${inv.type === "service" ? "badge-blue" : "badge-blue"}">${inv.type === "service" ? "خدمات" : "منتجات"}</span></td>
                <td>${inv.barberName || "—"}</td>
                <td>${inv.clientName || "—"}</td>
                <td style="font-weight:900;color:#C19A6B">${inv.total} ج</td>
                <td style="color:#595D62;font-size:11px">${new Date(inv.date).toLocaleTimeString("ar-EG")}</td>
              </tr>`).join("")}
        </tbody>
        <tfoot><tr><td colspan="4">الإجمالي</td><td style="color:#C19A6B">${totalRevenue} ج</td><td></td></tr></tfoot>
      </table>
    </div>`;
  openReportWindow(`تقرير نهاية اليوم — ${dateStr}`, body);
}

/* ── Inventory ──────────────────────────────────────────── */
export interface ProductRow {
  name: string; category: string;
  buyPrice: number; sellPrice: number; quantity: number;
}

export function exportInventoryPDF(products: ProductRow[]) {
  const totalCost   = products.reduce((s, p) => s + p.buyPrice * p.quantity, 0);
  const totalValue  = products.reduce((s, p) => s + p.sellPrice * p.quantity, 0);
  const lowStock    = products.filter(p => p.quantity < 5);

  const body = `
    <div class="section">
      <div class="section-title">ملخص المخزون</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-value">${products.length}</div><div class="kpi-label">إجمالي المنتجات</div></div>
        <div class="kpi gold"><div class="kpi-value">${totalCost} ج</div><div class="kpi-label">تكلفة المخزون (شراء)</div></div>
        <div class="kpi green"><div class="kpi-value">${totalValue} ج</div><div class="kpi-label">قيمة المخزون (بيع)</div></div>
        <div class="kpi red"><div class="kpi-value">${totalValue - totalCost} ج</div><div class="kpi-label">الربح المتوقع</div></div>
        <div class="kpi ${lowStock.length > 0 ? "red" : "green"}"><div class="kpi-value">${lowStock.length}</div><div class="kpi-label">مخزون منخفض (&lt;5)</div></div>
        <div class="kpi"><div class="kpi-value">${products.reduce((s,p) => s + p.quantity, 0)}</div><div class="kpi-label">إجمالي الوحدات</div></div>
      </div>
    </div>
    ${lowStock.length > 0 ? `
    <div class="section">
      <div class="section-title" style="border-right-color:#f59e0b">تنبيه: منتجات بمخزون منخفض</div>
      <table>
        <thead><tr><th>المنتج</th><th>المخزون المتبقي</th><th>سعر البيع</th></tr></thead>
        <tbody>${lowStock.map(p => `<tr><td style="font-weight:700">${p.name}</td><td style="color:#f59e0b;font-weight:900">${p.quantity}</td><td>${p.sellPrice} ج</td></tr>`).join("")}</tbody>
      </table>
    </div>` : ""}
    <div class="section">
      <div class="section-title">قائمة المنتجات الكاملة</div>
      <table>
        <thead><tr><th>#</th><th>المنتج</th><th>الفئة</th><th>سعر الشراء</th><th>سعر البيع</th><th>المخزون</th><th>ربح/وحدة</th><th>قيمة المخزون</th></tr></thead>
        <tbody>
          ${products.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:20px;color:#888">لا توجد منتجات</td></tr>` :
            products.map((p, i) => `
              <tr>
                <td style="color:#888">${i + 1}</td>
                <td style="font-weight:700;color:#003366">${p.name}</td>
                <td><span class="badge badge-blue">${p.category}</span></td>
                <td>${p.buyPrice} ج</td>
                <td style="font-weight:900;color:#C19A6B">${p.sellPrice} ج</td>
                <td style="font-weight:900;color:${p.quantity < 5 ? "#CD0000" : "#15803d"}">${p.quantity}</td>
                <td style="color:#15803d;font-weight:700">${p.sellPrice - p.buyPrice} ج</td>
                <td style="font-weight:700">${p.sellPrice * p.quantity} ج</td>
              </tr>`).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4">الإجمالي</td>
            <td>${totalCost} ج</td>
            <td>${products.reduce((s,p) => s + p.quantity, 0)}</td>
            <td></td>
            <td>${totalValue} ج</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
  openReportWindow("تقرير الجرد والمنتجات", body);
}
