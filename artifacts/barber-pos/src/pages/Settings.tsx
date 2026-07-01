import { useState, useEffect } from "react";
import { getSettings, saveSettings, AppSettings } from "@/lib/settings";
import { Save, Instagram, Video, Shield } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      {/* Cashier Permissions */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <h2 className="font-bold text-sm">صلاحيات الكاشير</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: "cashierCanViewReports" as const, label: "مشاهدة التقارير المالية", desc: "يتيح للكاشير الاطلاع على تقارير الإيرادات والأرباح" },
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  settings[item.key] ? "bg-[#CD0000]" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                    settings[item.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Social Media */}
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
              <input
                type="text"
                value={settings.instagramHandle.replace("@", "")}
                onChange={e => update("instagramHandle", `@${e.target.value.replace("@", "")}`)}
                placeholder="omarelsadany"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#003366] mb-1.5">
              <Video className="w-4 h-4 text-black" />
              حساب التيك توك
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm px-2">tiktok.com/@</span>
              <input
                type="text"
                value={settings.tiktokHandle.replace("@", "")}
                onChange={e => update("tiktokHandle", `@${e.target.value.replace("@", "")}`)}
                placeholder="omarelsadany"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            هذه الحسابات ستظهر على الفاتورة الإلكترونية عند الطباعة
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="font-bold text-sm text-[#003366] mb-3">معلومات التطبيق</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><span className="font-semibold text-foreground">اسم التطبيق:</span> نظام إدارة صالون Omar Elsadany</p>
          <p><span className="font-semibold text-foreground">الإصدار:</span> 1.0.0</p>
          <p><span className="font-semibold text-foreground">نوع التخزين:</span> محلي — IndexedDB (بدون إنترنت)</p>
          <p><span className="font-semibold text-foreground">المطور:</span> عبد الرحمن العديزي</p>
        </div>
      </div>
    </div>
  );
}
