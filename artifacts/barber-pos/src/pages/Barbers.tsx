import { useState, useEffect } from "react";
import { db, Barber } from "@/lib/db";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronLeft } from "lucide-react";

export default function Barbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [form, setForm] = useState({ code: "", name: "", phone: "", age: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => setBarbers(await db.barbers.toArray());
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ code: "", name: "", phone: "", age: "", notes: "" }); setModal(true); };
  const openEdit = (b: Barber) => { setEditing(b); setForm({ code: b.code, name: b.name, phone: b.phone, age: String(b.age), notes: b.notes || "" }); setModal(true); };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setLoading(true);
    const data = { code: form.code.trim().toUpperCase(), name: form.name.trim(), phone: form.phone.trim(), age: Number(form.age) || 0, notes: form.notes || undefined, active: true, createdAt: new Date() };
    if (editing) await db.barbers.update(editing.id!, { ...data, active: editing.active, createdAt: editing.createdAt });
    else await db.barbers.add(data);
    await load();
    setLoading(false);
    setModal(false);
  };

  const remove = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الحلاق؟")) { await db.barbers.delete(id); await load(); }
  };

  const toggle = async (b: Barber) => { await db.barbers.update(b.id!, { active: !b.active }); await load(); };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#003366]">إدارة الحلاقين والموظفين</h1>
        <button data-testid="btn-add-barber" onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CD0000] text-white rounded-xl font-bold text-sm hover:bg-[#a30000] transition shadow-md">
          <Plus className="w-4 h-4" />
          حلاق جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {barbers.map(b => (
          <div key={b.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${b.active ? "border-border" : "border-gray-200 opacity-70"}`}>
            <div className={`px-5 py-3 ${b.active ? "bg-[#003366]" : "bg-gray-400"} flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white text-sm font-black">
                  {b.name[0]}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{b.name}</p>
                  <p className="text-white/60 text-xs">{b.code}</p>
                </div>
              </div>
              <button onClick={() => toggle(b)} className="text-white/80 hover:text-white transition">
                {b.active ? <ToggleRight className="w-6 h-6 text-green-300" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
            <div className="px-5 py-4 space-y-1.5">
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">الهاتف:</span> {b.phone}</p>
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">العمر:</span> {b.age} سنة</p>
              {b.notes && <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">ملاحظات:</span> {b.notes}</p>}
              <p className="text-xs text-muted-foreground">تاريخ التسجيل: {new Date(b.createdAt).toLocaleDateString("ar-EG")}</p>
            </div>
            <div className="px-4 pb-4 flex items-center gap-2">
              <Link href={`/barbers/${b.id}`} className="flex-1">
                <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-[#003366] hover:bg-blue-100 font-semibold py-2 rounded-xl text-sm transition">
                  <ChevronLeft className="w-4 h-4" />
                  تفاصيل / الراتب
                </button>
              </Link>
              <button onClick={() => openEdit(b)} className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(b.id!)} className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003366] mb-5">{editing ? "تعديل بيانات الحلاق" : "حلاق جديد"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الكود</label>
                  <input type="text" value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="B01" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="اسم الحلاق" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="01xxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">العمر</label>
                  <input type="number" value={form.age} onChange={e => setForm(p => ({...p, age: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" placeholder="0" min="16" max="70" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ملاحظات (اختياري)</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={loading || !form.code.trim() || !form.name.trim()} className="flex-1 bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition">{loading ? "..." : "حفظ"}</button>
              <button onClick={() => setModal(false)} className="flex-1 border border-border text-muted-foreground hover:text-foreground py-2.5 rounded-xl transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
