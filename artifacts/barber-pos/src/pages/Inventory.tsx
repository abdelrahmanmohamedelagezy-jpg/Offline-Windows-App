import { useState, useEffect } from "react";
import { db, Product } from "@/lib/db";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";

const CATEGORIES = ["تصفيف", "عناية", "حلاقة", "تلوين", "أخرى"];

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", buyPrice: "", sellPrice: "", quantity: "", category: "تصفيف" });
  const [loading, setLoading] = useState(false);

  const load = async () => setProducts(await db.products.toArray());
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", buyPrice: "", sellPrice: "", quantity: "", category: "تصفيف" }); setModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ name: p.name, buyPrice: String(p.buyPrice), sellPrice: String(p.sellPrice), quantity: String(p.quantity), category: p.category }); setModal(true); };

  const save = async () => {
    if (!form.name.trim() || !form.sellPrice) return;
    setLoading(true);
    const data = { name: form.name.trim(), buyPrice: Number(form.buyPrice), sellPrice: Number(form.sellPrice), quantity: Number(form.quantity), category: form.category };
    if (editing) await db.products.update(editing.id!, data);
    else await db.products.add(data);
    await load();
    setLoading(false);
    setModal(false);
  };

  const remove = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) { await db.products.delete(id); await load(); }
  };

  const lowStock = products.filter(p => p.quantity < 5);

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#003366]">الجرد والمنتجات</h1>
        <button data-testid="btn-add-product" onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CD0000] text-white rounded-xl font-bold text-sm hover:bg-[#a30000] transition shadow-md">
          <Plus className="w-4 h-4" />
          منتج جديد
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-bold text-amber-800">تنبيه: مخزون منخفض</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                {p.name} — {p.quantity} قطعة
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl font-black text-[#003366]">{products.length}</p>
          <p className="text-sm text-muted-foreground mt-1">إجمالي المنتجات</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl font-black text-[#C19A6B]">{products.reduce((s, p) => s + p.quantity * p.buyPrice, 0)} ج</p>
          <p className="text-sm text-muted-foreground mt-1">قيمة المخزون (شراء)</p>
        </div>
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm text-center">
          <p className="text-2xl font-black text-[#CD0000]">{lowStock.length}</p>
          <p className="text-sm text-muted-foreground mt-1">منتجات بمخزون منخفض</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#003366] text-white">
              <tr>
                <th className="px-5 py-3 text-right">#</th>
                <th className="px-5 py-3 text-right">اسم المنتج</th>
                <th className="px-5 py-3 text-right">الفئة</th>
                <th className="px-5 py-3 text-right">سعر الشراء</th>
                <th className="px-5 py-3 text-right">سعر البيع</th>
                <th className="px-5 py-3 text-right">المخزون</th>
                <th className="px-5 py-3 text-right">الربح/وحدة</th>
                <th className="px-5 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">لا توجد منتجات</td></tr>
              ) : products.map((p, i) => (
                <tr key={p.id} className={`hover:bg-red-50/30 transition-colors ${p.quantity < 5 ? "bg-amber-50/40" : ""}`}>
                  <td className="px-5 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-[#003366]">{p.name}</td>
                  <td className="px-5 py-3"><span className="bg-blue-50 text-[#003366] text-xs font-semibold px-2 py-0.5 rounded-full">{p.category}</span></td>
                  <td className="px-5 py-3">{p.buyPrice} ج</td>
                  <td className="px-5 py-3 font-bold text-[#C19A6B]">{p.sellPrice} ج</td>
                  <td className="px-5 py-3">
                    <span className={`font-bold ${p.quantity < 5 ? "text-amber-600" : "text-green-700"}`}>
                      {p.quantity}
                      {p.quantity < 5 && <AlertTriangle className="inline w-3 h-3 mr-1" />}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-green-700">{p.sellPrice - p.buyPrice} ج</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(p.id!)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
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
            <h2 className="text-lg font-bold text-[#003366] mb-5">{editing ? "تعديل المنتج" : "منتج جديد"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم المنتج</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="اسم المنتج" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">سعر الشراء</label>
                  <input type="number" value={form.buyPrice} onChange={e => setForm(p => ({...p, buyPrice: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">سعر البيع</label>
                  <input type="number" value={form.sellPrice} onChange={e => setForm(p => ({...p, sellPrice: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الكمية</label>
                  <input type="number" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الفئة</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={loading || !form.name.trim() || !form.sellPrice} className="flex-1 bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition">{loading ? "..." : "حفظ"}</button>
              <button onClick={() => setModal(false)} className="flex-1 border border-border text-muted-foreground hover:text-foreground py-2.5 rounded-xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
