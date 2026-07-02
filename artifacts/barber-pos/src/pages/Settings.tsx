import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings } from "@/lib/settings";
import { db, User } from "@/lib/db";
import { Save, Instagram, Video, Shield, Users, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

type CashierForm = { name: string; username: string; password: string; phone: string };
const emptyForm = (): CashierForm => ({ name: "", username: "", password: "", phone: "" });

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  // Cashier management
  const [cashiers, setCashiers] = useState<User[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<CashierForm>(emptyForm());
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCashiers = async () => {
    const all = await db.users.toArray();
    setCashiers(all.filter(u => u.role === "cashier"));
  };
  useEffect(() => { loadCashiers(); }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setShowPw(false);
    setModal(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, username: u.username, password: u.password, phone: u.phone || "" });
    setError("");
    setShowPw(false);
    setModal(true);
  };

  const saveCashier = async () => {
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setError("الاسم واسم المستخدم وكلمة المرور مطلوبة");
      return;
    }
    setSaving(true);
    setError("");
    // Check username uniqueness
    const existing = await db.users.where("username").equals(form.username.trim()).first();
    if (existing && existing.id !== editing?.id) {
      setError("اسم المستخدم مستخدم بالفعل");
      setSaving(false);
      return;
    }
    const data = {
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password.trim(),
      role: "cashier" as const,
      phone: form.phone.trim() || undefined,
    };
    if (editing) await db.users.update(editing.id!, data);
    else await db.users.add(data);
    await loadCashiers();
    setSaving(false);
    setModal(false);
  };

  const deleteCashier = async (u: User) => {
    if (!confirm(`حذف الكاشير "${u.name}"؟`)) return;
    await db.users.delete(u.id!);
    await loadCashiers();
  };

  return (
    <div dir="rtl" className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#003366]">الإعدادات</h1>
        <button
          data-testid="btn-save-settings"
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md ${
            saved ? "bg-green-600 text-white" : "bg-[#CD0000] text-white hover:bg-[#a30000]"
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? "تم الحفظ" : "حفظ الإعدادات"}
        </button>
      </div>

      {/* ── Cashier Accounts ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <h2 className="font-bold text-sm">حسابات الكاشيرين</h2>
          </div>
          <button onClick={openAdd} className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-xs font-bold transition">
            <Plus className="w-3.5 h-3.5" />
            إضافة كاشير
          </button>
        </div>
        {cashiers.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            لا يوجد كاشيرين — أضف كاشير جديد
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cashiers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full bg-[#003366] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#003366]">{u.name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}{u.phone ? ` · ${u.phone}` : ""}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(u)} className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteCashier(u)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cashier Permissions ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <h2 className="font-bold text-sm">صلاحيات الكاشير</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: "cashierCanViewReports" as const, label: "مشاهدة التقارير والفواتير", desc: "يتيح للكاشير الاطلاع على تقارير الإيرادات وسجل الفواتير" },
            { key: "cashierCanViewExpenses" as const, label: "مشاهدة المصروفات", desc: "يتيح للكاشير الاطلاع على المصروفات وإضافتها" },
            { key: "cashierCanViewBarbers" as const, label: "مشاهدة بيانات الحلاقين", desc: "يتيح للكاشير الاطلاع على بيانات وأداء الحلاقين" },
            { key: "cashierCanAccessAttendance" as const, label: "تسجيل الحضور والانصراف", desc: "يتيح للكاشير تسجيل حضور وانصراف الحلاقين" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between px-5 py-4">
              <div className="flex-1 ml-4">
                <p className="font-semibold text-sm text-[#003366]">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => update(item.key, !settings[item.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${settings[item.key] ? "bg-[#CD0000]" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Social Media ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3">
          <h2 className="font-bold text-sm">حسابات التواصل الاجتماعي (تظهر على الفاتورة)</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#003366] mb-1.5">
              <Instagram className="w-4 h-4 text-pink-600" />
              حساب الإنستغرام
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm px-2">instagram.com/</span>
              <input type="text" value={settings.instagramHandle.replace("@", "")}
                onChange={e => update("instagramHandle", `@${e.target.value.replace("@", "")}`)}
                placeholder="omarelsadany"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#003366] mb-1.5">
              <Video className="w-4 h-4 text-black" />
              حساب التيك توك
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm px-2">tiktok.com/@</span>
              <input type="text" value={settings.tiktokHandle.replace("@", "")}
                onChange={e => update("tiktokHandle", `@${e.target.value.replace("@", "")}`)}
                placeholder="omarelsadany"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            هذه الحسابات ستظهر على الفاتورة الإلكترونية عند الطباعة
          </div>
        </div>
      </div>

      {/* ── App Info ── */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-sm text-[#003366] mb-3">معلومات التطبيق</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">اسم التطبيق:</span> نظام إدارة صالون Omar Elsadany</p>
          <p><span className="font-semibold text-foreground">الإصدار:</span> 1.0.0</p>
          <p><span className="font-semibold text-foreground">نوع التخزين:</span> محلي — IndexedDB (بدون إنترنت)</p>
          <p><span className="font-semibold text-foreground">المطور:</span> عبد الرحمن العديزي</p>
        </div>
      </div>

      {/* ── Cashier Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[#003366] mb-5">{editing ? "تعديل الكاشير" : "إضافة كاشير جديد"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">الاسم الكامل</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="اسم الكاشير"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم المستخدم</label>
                <input type="text" value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))}
                  placeholder="مثال: cashier2"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))}
                    placeholder="كلمة المرور"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] pl-10" />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">رقم الهاتف (اختياري)</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                  placeholder="01xxxxxxxxx"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveCashier} disabled={saving}
                className="flex-1 bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition">
                {saving ? "..." : "حفظ"}
              </button>
              <button onClick={() => setModal(false)} className="flex-1 border border-border text-muted-foreground hover:text-foreground py-2.5 rounded-xl transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
