import { useState, useEffect } from "react";
import { db, Expense } from "@/lib/db";
import { Plus, Trash2, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const categories = ["إيجار", "فواتير", "أدوات", "خامات", "رواتب", "صيانة", "أخرى"];

const filterOptions = [
  { label: "هذا الأسبوع", value: "week" },
  { label: "هذا الشهر", value: "month" },
  { label: "الكل", value: "all" },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState("month");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "إيجار", date: new Date().toISOString().split("T")[0], notes: "" });
  const [loading, setLoading] = useState(false);

  const getRange = () => {
    const now = new Date();
    if (filter === "week") {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      return { start, end };
    }
    if (filter === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    return { start: new Date(2000, 0, 1), end: new Date(2099, 0, 1) };
  };

  const load = async () => {
    const { start, end } = getRange();
    const all = await db.expenses.where("date").between(start, end).toArray();
    setExpenses(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => { load(); }, [filter]);

  const save = async () => {
    if (!form.description.trim() || !form.amount) return;
    setLoading(true);
    await db.expenses.add({
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: new Date(form.date),
      notes: form.notes || undefined,
    });
    await load();
    setLoading(false);
    setModal(false);
    setForm({ description: "", amount: "", category: "إيجار", date: new Date().toISOString().split("T")[0], notes: "" });
  };

  const remove = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
      await db.expenses.delete(id);
      await load();
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Omar Elsadany - Expenses Report", 105, 20, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Filter: ${filterOptions.find(f => f.value === filter)?.label}`, 105, 28, { align: "center" });
    autoTable(doc, {
      startY: 35,
      head: [["#", "Description", "Category", "Amount (EGP)", "Date"]],
      body: expenses.map((e, i) => [
        String(i + 1), e.description, e.category,
        String(e.amount), new Date(e.date).toLocaleDateString("ar-EG"),
      ]),
      foot: [["", "", "Total", String(total) + " EGP", ""]],
      styles: { font: "helvetica", fontSize: 10 },
    });
    doc.save("expenses-report.pdf");
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[#003366]">المصروفات العامة</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-border rounded-xl overflow-hidden shadow-sm">
            {filterOptions.map(f => (
              <button
                key={f.value}
                data-testid={`filter-${f.value}`}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 text-sm font-semibold transition ${filter === f.value ? "bg-[#003366] text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-[#003366] rounded-xl font-semibold text-sm hover:bg-gray-50 transition shadow-sm">
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button
            data-testid="btn-add-expense"
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#CD0000] text-white rounded-xl font-bold text-sm hover:bg-[#a30000] transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            مصروف جديد
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 col-span-1">
          <p className="text-sm text-muted-foreground mb-1">إجمالي المصروفات</p>
          <p className="text-3xl font-black text-[#CD0000]">{total} ج</p>
          <p className="text-xs text-muted-foreground mt-1">{filterOptions.find(f => f.value === filter)?.label}</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 col-span-2">
          <p className="text-sm text-muted-foreground mb-2">حسب الفئة</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
              if (catTotal === 0) return null;
              return (
                <div key={cat} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                  <span className="text-xs font-semibold text-[#003366]">{cat}: </span>
                  <span className="text-xs font-black text-[#CD0000]">{catTotal} ج</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#003366] text-white">
              <tr>
                <th className="px-5 py-3 text-right">#</th>
                <th className="px-5 py-3 text-right">الوصف</th>
                <th className="px-5 py-3 text-right">الفئة</th>
                <th className="px-5 py-3 text-right">المبلغ</th>
                <th className="px-5 py-3 text-right">التاريخ</th>
                <th className="px-5 py-3 text-right">ملاحظات</th>
                <th className="px-5 py-3 text-right">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">لا توجد مصروفات</td></tr>
              ) : expenses.map((e, i) => (
                <tr key={e.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-5 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold">{e.description}</td>
                  <td className="px-5 py-3"><span className="bg-blue-50 text-[#003366] text-xs font-semibold px-2 py-0.5 rounded-full">{e.category}</span></td>
                  <td className="px-5 py-3 font-black text-[#CD0000]">{e.amount} ج</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(e.date).toLocaleDateString("ar-EG")}</td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{e.notes || "-"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => remove(e.id!)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003366] mb-5">مصروف جديد</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">الوصف</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="وصف المصروف" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">المبلغ (ج)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الفئة</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">التاريخ</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ملاحظات (اختياري)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" rows={2} placeholder="ملاحظات إضافية" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={loading || !form.description.trim() || !form.amount} className="flex-1 bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition">{loading ? "..." : "حفظ"}</button>
              <button onClick={() => setModal(false)} className="flex-1 border border-border text-muted-foreground hover:text-foreground py-2.5 rounded-xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
