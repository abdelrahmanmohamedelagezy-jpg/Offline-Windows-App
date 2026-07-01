import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { db, Barber, Invoice, AttendanceRecord, PayrollAdjustment } from "@/lib/db";
import { ArrowRight, Plus, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function BarberDetail() {
  const { id } = useParams<{ id: string }>();
  const barberId = Number(id);

  const [barber, setBarber] = useState<Barber | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [adjustments, setAdjustments] = useState<PayrollAdjustment[]>([]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [adjModal, setAdjModal] = useState(false);
  const [adjForm, setAdjForm] = useState({ type: "bonus" as "bonus" | "deduction", amount: "", reason: "" });

  const load = async () => {
    const b = await db.barbers.get(barberId);
    if (!b) return;
    setBarber(b);

    const start = new Date(fromDate); start.setHours(0,0,0,0);
    const end = new Date(toDate); end.setHours(23,59,59,999);

    const [invs, adjs] = await Promise.all([
      db.invoices.where("barberId").equals(barberId).toArray(),
      db.payrollAdjustments.where("barberId").equals(barberId).toArray(),
    ]);
    const filteredInvs = invs.filter(i => new Date(i.date) >= start && new Date(i.date) <= end && i.status === "active");
    const filteredAdjs = adjs.filter(a => new Date(a.date) >= start && new Date(a.date) <= end);
    setInvoices(filteredInvs);
    setAdjustments(filteredAdjs);

    const startStr = fromDate;
    const endStr = toDate;
    const atts = await db.attendance.where("barberId").equals(barberId).toArray();
    setAttendance(atts.filter(a => a.date >= startStr && a.date <= endStr));
  };

  useEffect(() => { load(); }, [barberId, fromDate, toDate]);

  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const presentDays = attendance.filter(a => a.status === "present").length;
  const absentDays = attendance.filter(a => a.status === "absent").length;
  const lateDays = attendance.filter(a => a.status === "late").length;
  const bonuses = adjustments.filter(a => a.type === "bonus").reduce((s, a) => s + a.amount, 0);
  const deductions = adjustments.filter(a => a.type === "deduction").reduce((s, a) => s + a.amount, 0);
  const netSalary = bonuses - deductions;

  const saveAdj = async () => {
    if (!adjForm.amount || !adjForm.reason.trim()) return;
    await db.payrollAdjustments.add({
      barberId, type: adjForm.type, amount: Number(adjForm.amount),
      reason: adjForm.reason.trim(), date: new Date(),
    });
    setAdjModal(false);
    setAdjForm({ type: "bonus", amount: "", reason: "" });
    await load();
  };

  const exportPDF = () => {
    if (!barber) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Omar Elsadany - Barber Payroll Report", 105, 18, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Barber: ${barber.name} (${barber.code})`, 14, 30);
    doc.text(`Period: ${fromDate} to ${toDate}`, 14, 38);

    autoTable(doc, {
      startY: 45,
      head: [["Item", "Value"]],
      body: [
        ["Total Invoices", String(invoices.length)],
        ["Total Revenue", `${totalRevenue} EGP`],
        ["Days Present", String(presentDays)],
        ["Days Absent", String(absentDays)],
        ["Days Late", String(lateDays)],
        ["Bonuses", `+${bonuses} EGP`],
        ["Deductions", `-${deductions} EGP`],
        ["Net Adjustment", `${netSalary} EGP`],
      ],
      styles: { font: "helvetica", fontSize: 11 },
    });

    const y1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text("Invoices", 14, y1);
    autoTable(doc, {
      startY: y1 + 5,
      head: [["#", "Client", "Total", "Date"]],
      body: invoices.map((inv, i) => [
        String(i + 1), inv.clientName || "-", `${inv.total} EGP`,
        new Date(inv.date).toLocaleDateString("ar-EG"),
      ]),
      styles: { font: "helvetica", fontSize: 9 },
    });

    const y2 = (doc as any).lastAutoTable.finalY + 10;
    doc.text("Adjustments", 14, y2);
    autoTable(doc, {
      startY: y2 + 5,
      head: [["Type", "Amount", "Reason", "Date"]],
      body: adjustments.map(a => [
        a.type === "bonus" ? "Bonus" : "Deduction",
        `${a.type === "bonus" ? "+" : "-"}${a.amount} EGP`,
        a.reason,
        new Date(a.date).toLocaleDateString("ar-EG"),
      ]),
      styles: { font: "helvetica", fontSize: 9 },
    });

    doc.save(`barber-${barber.code}-report.pdf`);
  };

  if (!barber) return <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/barbers">
          <button className="p-2 rounded-xl bg-white border border-border hover:bg-gray-50 transition">
            <ArrowRight className="w-4 h-4 text-[#003366]" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#003366]">{barber.name}</h1>
          <p className="text-sm text-muted-foreground">كود: {barber.code} — {barber.phone}</p>
        </div>
        <button onClick={exportPDF} className="mr-auto flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl font-bold text-sm hover:bg-[#002244] transition shadow-md">
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "الفواتير", value: invoices.length, color: "text-[#003366]" },
          { label: "إجمالي الإيراد", value: `${totalRevenue} ج`, color: "text-[#C19A6B]" },
          { label: "أيام الحضور", value: `${presentDays}/${attendance.length}`, color: "text-green-700" },
          { label: "صافي التسويات", value: `${netSalary >= 0 ? "+" : ""}${netSalary} ج`, color: netSalary >= 0 ? "text-green-700" : "text-[#CD0000]" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="bg-[#003366] text-white px-5 py-3 flex justify-between items-center">
            <h2 className="font-bold text-sm">الحضور والانصراف</h2>
            <div className="flex gap-2 text-xs">
              <span className="bg-green-500/30 px-2 py-0.5 rounded-full">{presentDays} حاضر</span>
              <span className="bg-red-500/30 px-2 py-0.5 rounded-full">{absentDays} غائب</span>
              <span className="bg-yellow-500/30 px-2 py-0.5 rounded-full">{lateDays} متأخر</span>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {attendance.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">لا توجد سجلات</p>
            ) : attendance.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm">{a.date}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  a.status === "present" ? "bg-green-100 text-green-700" : a.status === "late" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                }`}>
                  {a.status === "present" ? "حاضر" : a.status === "late" ? "متأخر" : "غائب"}
                </span>
                <span className="text-xs text-muted-foreground">{a.checkIn || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Adjustments */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="bg-[#003366] text-white px-5 py-3 flex justify-between items-center">
            <h2 className="font-bold text-sm">المكافآت والخصومات</h2>
            <button onClick={() => setAdjModal(true)} className="flex items-center gap-1 text-xs bg-[#CD0000] px-3 py-1 rounded-full hover:bg-[#a30000] transition">
              <Plus className="w-3 h-3" />
              إضافة
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-border">
            {adjustments.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">لا توجد تسويات</p>
            ) : adjustments.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{a.reason}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("ar-EG")}</p>
                </div>
                <span className={`font-black text-sm ${a.type === "bonus" ? "text-green-700" : "text-[#CD0000]"}`}>
                  {a.type === "bonus" ? "+" : "-"}{a.amount} ج
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border bg-gray-50 flex justify-between">
            <span className="text-sm text-muted-foreground">الصافي</span>
            <span className={`font-black text-base ${netSalary >= 0 ? "text-green-700" : "text-[#CD0000]"}`}>
              {netSalary >= 0 ? "+" : ""}{netSalary} ج
            </span>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3">
          <h2 className="font-bold text-sm">الفواتير ({invoices.length})</h2>
        </div>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-right text-muted-foreground font-semibold text-xs">#</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-semibold text-xs">العميل</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-semibold text-xs">الخدمات</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-semibold text-xs">الإجمالي</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-semibold text-xs">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">لا توجد فواتير</td></tr>
              ) : invoices.map((inv, i) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5">{inv.clientName || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{inv.items.map(i => i.name).join("، ")}</td>
                  <td className="px-4 py-2.5 font-black text-[#C19A6B]">{inv.total} ج</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(inv.date).toLocaleDateString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adjModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setAdjModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003366] mb-5">إضافة مكافأة / خصم</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                {["bonus", "deduction"].map(type => (
                  <button key={type} onClick={() => setAdjForm(p => ({...p, type: type as any}))} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition ${adjForm.type === type ? (type === "bonus" ? "bg-green-600 text-white border-green-600" : "bg-[#CD0000] text-white border-[#CD0000]") : "border-border text-muted-foreground"}`}>
                    {type === "bonus" ? "مكافأة" : "خصم"}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">المبلغ (ج)</label>
                <input type="number" value={adjForm.amount} onChange={e => setAdjForm(p => ({...p, amount: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" min="0" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">السبب</label>
                <input type="text" value={adjForm.reason} onChange={e => setAdjForm(p => ({...p, reason: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="سبب المكافأة أو الخصم" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveAdj} disabled={!adjForm.amount || !adjForm.reason.trim()} className="flex-1 bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition">حفظ</button>
              <button onClick={() => setAdjModal(false)} className="flex-1 border border-border text-muted-foreground py-2.5 rounded-xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
