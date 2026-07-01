import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState({ revenue: 0, expenses: 0, profit: 0, serviceRevenue: 0, productRevenue: 0, invoiceCount: 0 });
  const [barberData, setBarberData] = useState<{ name: string; total: number }[]>([]);
  const [serviceData, setServiceData] = useState<{ name: string; count: number }[]>([]);

  const load = async () => {
    const start = new Date(fromDate); start.setHours(0,0,0,0);
    const end = new Date(toDate); end.setHours(23,59,59,999);

    const [invoices, expenses] = await Promise.all([
      db.invoices.where("date").between(start, end).toArray(),
      db.expenses.where("date").between(start, end).toArray(),
    ]);
    const active = invoices.filter(i => i.status === "active");
    const revenue = active.reduce((s, i) => s + i.total, 0);
    const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
    const serviceRevenue = active.filter(i => i.type === "service").reduce((s, i) => s + i.total, 0);
    const productRevenue = active.filter(i => i.type === "product").reduce((s, i) => s + i.total, 0);

    setData({ revenue, expenses: expTotal, profit: revenue - expTotal, serviceRevenue, productRevenue, invoiceCount: active.length });

    // Barber revenue
    const barberMap = new Map<string, number>();
    for (const inv of active.filter(i => i.barberName)) {
      barberMap.set(inv.barberName!, (barberMap.get(inv.barberName!) || 0) + inv.total);
    }
    setBarberData(Array.from(barberMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total));

    // Service count
    const svcMap = new Map<string, number>();
    for (const inv of active.filter(i => i.type === "service")) {
      for (const item of inv.items) {
        svcMap.set(item.name, (svcMap.get(item.name) || 0) + item.quantity);
      }
    }
    setServiceData(Array.from(svcMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8));
  };

  useEffect(() => { load(); }, [fromDate, toDate]);

  const exportPDF = async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Omar Elsadany - Financial Report", 105, 18, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Period: ${fromDate} to ${toDate}`, 105, 26, { align: "center" });

    autoTable(doc, {
      startY: 33,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", `${data.revenue} EGP`],
        ["Service Revenue", `${data.serviceRevenue} EGP`],
        ["Product Revenue", `${data.productRevenue} EGP`],
        ["Total Expenses", `${data.expenses} EGP`],
        ["Net Profit", `${data.profit} EGP`],
        ["Total Invoices", String(data.invoiceCount)],
      ],
      styles: { font: "helvetica", fontSize: 11 },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Revenue by Barber", 14, y1);
    autoTable(doc, {
      startY: y1 + 5,
      head: [["Barber", "Revenue (EGP)"]],
      body: barberData.map(b => [b.name, String(b.total)]),
      styles: { font: "helvetica", fontSize: 10 },
    });

    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Top Services", 14, y2);
    autoTable(doc, {
      startY: y2 + 5,
      head: [["Service", "Count"]],
      body: serviceData.map(s => [s.name, String(s.count)]),
      styles: { font: "helvetica", fontSize: 10 },
    });

    doc.save(`report-${fromDate}-${toDate}.pdf`);
  };

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[#003366]">التقارير المالية</h1>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl font-bold text-sm hover:bg-[#002244] transition shadow-md">
          <FileDown className="w-4 h-4" />
          تصدير PDF
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-4 flex-wrap">
        <p className="text-sm font-bold text-[#003366]">الفترة:</p>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">من</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">إلى</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: `${data.revenue} ج`, bg: "bg-blue-50", text: "text-[#003366]", border: "border-blue-100" },
          { label: "إيرادات الخدمات", value: `${data.serviceRevenue} ج`, bg: "bg-red-50", text: "text-[#CD0000]", border: "border-red-100" },
          { label: "إيرادات المنتجات", value: `${data.productRevenue} ج`, bg: "bg-amber-50", text: "text-[#C19A6B]", border: "border-amber-100" },
          { label: "إجمالي المصروفات", value: `${data.expenses} ج`, bg: "bg-gray-50", text: "text-[#595D62]", border: "border-gray-100" },
          { label: "صافي الربح", value: `${data.profit} ج`, bg: data.profit >= 0 ? "bg-green-50" : "bg-red-50", text: data.profit >= 0 ? "text-green-700" : "text-red-700", border: data.profit >= 0 ? "border-green-100" : "border-red-100" },
          { label: "عدد الفواتير", value: String(data.invoiceCount), bg: "bg-blue-50", text: "text-[#003366]", border: "border-blue-100" },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-2xl p-5 shadow-sm`}>
            <p className={`text-2xl font-black ${card.text}`}>{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Barber Revenue Chart */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#003366] mb-4">إيرادات الحلاقين</h2>
          {barberData.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">لا توجد بيانات</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barberData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#595D62" }} />
                <YAxis tick={{ fontSize: 10, fill: "#595D62" }} />
                <Tooltip formatter={(v) => [`${v} ج`, "الإيراد"]} />
                <Bar dataKey="total" fill="#CD0000" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Services Chart */}
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <h2 className="text-base font-bold text-[#003366] mb-4">أكثر الخدمات طلبًا</h2>
          {serviceData.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">لا توجد بيانات</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#595D62" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#595D62" }} width={80} />
                <Tooltip formatter={(v) => [v, "عدد المرات"]} />
                <Bar dataKey="count" fill="#003366" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
