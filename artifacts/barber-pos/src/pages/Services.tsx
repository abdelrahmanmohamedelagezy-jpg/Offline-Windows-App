import { useState, useEffect } from "react";
import { db, Service } from "@/lib/db";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const all = await db.services.toArray();
    setServices(all);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setName(""); setPrice(""); setModal(true); };
  const openEdit = (s: Service) => { setEditing(s); setName(s.name); setPrice(String(s.price)); setModal(true); };
  const closeModal = () => { setModal(false); setEditing(null); };

  const save = async () => {
    if (!name.trim() || !price) return;
    setLoading(true);
    if (editing) {
      await db.services.update(editing.id!, { name: name.trim(), price: Number(price) });
    } else {
      await db.services.add({ name: name.trim(), price: Number(price), active: true });
    }
    await load();
    setLoading(false);
    closeModal();
  };

  const remove = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الخدمة؟")) {
      await db.services.delete(id);
      await load();
    }
  };

  const toggle = async (s: Service) => {
    await db.services.update(s.id!, { active: !s.active });
    await load();
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#003366]">إدارة الخدمات والأسعار</h1>
        <button
          data-testid="btn-add-service"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#CD0000] text-white rounded-xl font-bold text-sm hover:bg-[#a30000] transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          خدمة جديدة
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#003366] text-white">
              <tr>
                <th className="px-5 py-3 text-right font-semibold">#</th>
                <th className="px-5 py-3 text-right font-semibold">اسم الخدمة</th>
                <th className="px-5 py-3 text-right font-semibold">السعر</th>
                <th className="px-5 py-3 text-right font-semibold">الحالة</th>
                <th className="px-5 py-3 text-right font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s, i) => (
                <tr key={s.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-5 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-[#003366]">{s.name}</td>
                  <td className="px-5 py-3 font-black text-[#C19A6B] text-base">{s.price} ج</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggle(s)} className="flex items-center gap-1.5 text-sm">
                      {s.active
                        ? <><ToggleRight className="w-5 h-5 text-green-600" /><span className="text-green-700 font-semibold">نشط</span></>
                        : <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-500">معطل</span></>
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        data-testid={`btn-edit-service-${s.id}`}
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        data-testid={`btn-delete-service-${s.id}`}
                        onClick={() => remove(s.id!)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003366] mb-5">{editing ? "تعديل الخدمة" : "خدمة جديدة"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم الخدمة</label>
                <input
                  data-testid="input-service-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  placeholder="مثال: حلاقة شعر"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">السعر (جنيه)</label>
                <input
                  data-testid="input-service-price"
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                data-testid="btn-save-service"
                onClick={save}
                disabled={loading || !name.trim() || !price}
                className="flex-1 bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
              >
                {loading ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 border border-border text-muted-foreground hover:text-foreground py-2.5 rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
