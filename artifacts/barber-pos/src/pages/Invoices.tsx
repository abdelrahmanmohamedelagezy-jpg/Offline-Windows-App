import { useState, useEffect } from "react";
import { db, Invoice } from "@/lib/db";
import { FileDown, Search, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { exportInvoicesPDF } from "@/lib/exportReport";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "كاش",
  instapay: "إنستا باي",
  vodafone: "فودافون كاش",
};
const PAYMENT_COLORS: Record<string, string> = {
  cash: "bg-green-50 text-green-700",
  instapay: "bg-purple-50 text-purple-700",
  vodafone: "bg-red-50 text-red-700",
};

export default function Invoices() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState<"all" | "service" | "product">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "instapay" | "vodafone">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "voided">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    const all = await db.invoices.toArray();
    setInvoices(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(inv => {
    const d = new Date(inv.date).toISOString().split("T")[0];
    if (d < fromDate || d > toDate) return false;
    if (typeFilter !== "all" && inv.type !== typeFilter) return false;
    if (paymentFilter !== "all" && inv.paymentMethod !== paymentFilter) return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const match =
        String(inv.id).includes(s) ||
        (inv.barberName || "").toLowerCase().includes(s) ||
        (inv.clientName || "").toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const totalActive = filtered.filter(i => i.status === "active").reduce((s, i) => s + i.total, 0);
  const countActive = filtered.filter(i => i.status === "active").length;
  const countVoided = filtered.filter(i => i.status === "voided").length;

  const voidInvoice = async (inv: Invoice) => {
    if (!confirm(`هل أنت متأكد من إلغاء الفاتورة #${inv.id}؟`)) return;
    await db.invoices.update(inv.id!, { status: "voided" });
    await load();
  };

  const handleExport = () => {
    exportInvoicesPDF(fromDate, toDate, filtered);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#003366]">سجل الفواتير</h1>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-xl font-bold text-sm hover:bg-[#002244] transition shadow-md">
          <FileDown className="w-4 h-4" />
          تصدير PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">من تاريخ</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">إلى تاريخ</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">النوع</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]">
              <option value="all">الكل</option>
              <option value="service">خدمات</option>
              <option value="product">منتجات</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">طريقة الدفع</label>
            <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as typeof paymentFilter)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]">
              <option value="all">الكل</option>
              <option value="cash">كاش</option>
              <option value="instapay">إنستا باي</option>
              <option value="vodafone">فودافون كاش</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث برقم الفاتورة أو اسم الحلاق أو العميل..."
              className="w-full border border-border rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]">
            <option value="all">كل الحالات</option>
            <option value="active">نشطة</option>
            <option value="voided">ملغاة</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-[#003366]">{countActive}</p>
          <p className="text-xs text-muted-foreground mt-1">فاتورة نشطة</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-[#C19A6B]">{totalActive} ج</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-[#CD0000]">{countVoided}</p>
          <p className="text-xs text-muted-foreground mt-1">فاتورة ملغاة</p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">لا توجد فواتير في هذه الفترة</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(inv => (
              <div key={inv.id} className={`${inv.status === "voided" ? "bg-gray-50 opacity-70" : ""}`}>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  {/* Invoice ID */}
                  <div className="w-12 h-12 rounded-xl bg-[#003366] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    #{inv.id}
                  </div>
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inv.type === "service" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        {inv.type === "service" ? "خدمات" : "منتجات"}
                      </span>
                      {inv.paymentMethod && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[inv.paymentMethod] || "bg-gray-50 text-gray-600"}`}>
                          {PAYMENT_LABELS[inv.paymentMethod] || inv.paymentMethod}
                        </span>
                      )}
                      {inv.status === "voided" && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">ملغاة</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {inv.barberName && <span>✂ {inv.barberName}</span>}
                      {inv.clientName && <span>👤 {inv.clientName}</span>}
                      <span className="text-xs">{new Date(inv.date).toLocaleString("ar-EG")}</span>
                    </div>
                  </div>
                  {/* Total */}
                  <div className="text-right">
                    <p className={`text-lg font-black ${inv.status === "voided" ? "line-through text-gray-400" : "text-[#C19A6B]"}`}>{inv.total} ج</p>
                    <p className="text-xs text-muted-foreground">{inv.items.length} بنود</p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {inv.status === "active" && (
                      <button onClick={() => voidInvoice(inv)} title="إلغاء الفاتورة"
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setExpanded(expanded === inv.id! ? null : inv.id!)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition">
                      {expanded === inv.id! ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {/* Expanded Items */}
                {expanded === inv.id! && (
                  <div className="bg-gray-50 border-t border-border px-5 py-3">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b border-border">
                          <th className="text-right pb-2 font-semibold">البند</th>
                          <th className="text-center pb-2 font-semibold">الكمية</th>
                          <th className="text-center pb-2 font-semibold">سعر الوحدة</th>
                          <th className="text-left pb-2 font-semibold">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/50 last:border-0">
                            <td className="py-1.5 font-medium">{item.name}</td>
                            <td className="py-1.5 text-center">{item.quantity}</td>
                            <td className="py-1.5 text-center text-muted-foreground">{item.price} ج</td>
                            <td className="py-1.5 text-left font-bold text-[#CD0000]">{item.price * item.quantity} ج</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
