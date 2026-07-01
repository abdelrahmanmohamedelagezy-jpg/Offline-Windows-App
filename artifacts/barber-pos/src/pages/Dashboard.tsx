import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db, Invoice, Expense } from "@/lib/db";
import { Link } from "wouter";
import {
  DollarSign, Scissors, Users, TrendingDown,
  ShoppingCart, Boxes, CalendarCheck, BarChart2,
  FileText, AlertCircle
} from "lucide-react";
import { exportEndOfDayPDF } from "@/lib/exportReport";

export default function Dashboard() {
  const { isOwner } = useAuth();
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayInvoices, setTodayInvoices] = useState(0);
  const [todayClients, setTodayClients] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  useEffect(() => {
    const load = async () => {
      const [invoices, expenses, recent] = await Promise.all([
        db.invoices.where("date").between(today, tomorrow).toArray(),
        db.expenses.where("date").between(today, tomorrow).toArray(),
        db.invoices.orderBy("date").reverse().limit(10).toArray(),
      ]);
      const activeInvoices = invoices.filter(i => i.status === "active");
      setTodayRevenue(activeInvoices.reduce((s, i) => s + i.total, 0));
      setTodayInvoices(activeInvoices.filter(i => i.type === "service").length);
      setTodayClients(activeInvoices.filter(i => i.clientName).length);
      setTodayExpenses(expenses.reduce((s, e) => s + e.amount, 0));
      setRecentInvoices(recent);
      setLoading(false);
    };
    load();
  }, []);

  const endOfDay = async () => {
    const allInvoices = await db.invoices.where("date").between(today, tomorrow).toArray();
    const allExpenses = await db.expenses.where("date").between(today, tomorrow).toArray();
    const active = allInvoices.filter(i => i.status === "active");
    const totalRevenue = active.reduce((s, i) => s + i.total, 0);
    const totalExpenses = allExpenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    exportEndOfDayPDF(
      today.toLocaleDateString("ar-EG"),
      active.map(inv => ({
        type: inv.type, barberName: inv.barberName,
        clientName: inv.clientName, total: inv.total, date: inv.date,
      })),
      totalExpenses
    );
  };

  const quickLinks = [
    { href: "/pos", label: "نقطة البيع", icon: Scissors, color: "bg-[#CD0000]" },
    { href: "/pos/products", label: "بيع المنتجات", icon: ShoppingCart, color: "bg-[#003366]" },
    { href: "/inventory", label: "الجرد", icon: Boxes, color: "bg-[#C19A6B]" },
    { href: "/attendance", label: "الحضور", icon: CalendarCheck, color: "bg-[#595D62]" },
    { href: "/reports", label: "التقارير", icon: BarChart2, color: "bg-[#003366]" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#CD0000] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#003366]">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {today.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {isOwner() && (
          <button
            data-testid="btn-end-of-day"
            onClick={endOfDay}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-xl font-bold text-sm hover:bg-[#002244] transition shadow-md"
          >
            <FileText className="w-4 h-4" />
            إنهاء اليوم + PDF
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إيرادات اليوم", value: `${todayRevenue} ج`, icon: DollarSign, color: "bg-red-50 text-[#CD0000]", border: "border-red-100" },
          { label: "فواتير الخدمات", value: String(todayInvoices), icon: Scissors, color: "bg-blue-50 text-[#003366]", border: "border-blue-100" },
          { label: "العملاء المسجلون", value: String(todayClients), icon: Users, color: "bg-amber-50 text-[#C19A6B]", border: "border-amber-100" },
          { label: "مصروفات اليوم", value: `${todayExpenses} ج`, icon: TrendingDown, color: "bg-gray-50 text-[#595D62]", border: "border-gray-100" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-white rounded-2xl border ${stat.border} p-5 shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-base font-bold text-[#003366] mb-3">الوصول السريع</h2>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  data-testid={`quick-${link.href.replace(/\//g, "-")}`}
                  className={`${link.color} rounded-xl p-4 text-white text-center cursor-pointer hover:opacity-90 transition shadow-md`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-xs font-bold">{link.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <h2 className="text-base font-bold text-[#003366] mb-3">آخر الفواتير</h2>
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لا توجد فواتير بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#003366] text-white">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold">#</th>
                    <th className="px-4 py-3 text-right font-semibold">النوع</th>
                    <th className="px-4 py-3 text-right font-semibold">الحلاق</th>
                    <th className="px-4 py-3 text-right font-semibold">العميل</th>
                    <th className="px-4 py-3 text-right font-semibold">الإجمالي</th>
                    <th className="px-4 py-3 text-right font-semibold">الوقت</th>
                    <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentInvoices.map((inv, i) => (
                    <tr key={inv.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{inv.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inv.type === "service" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {inv.type === "service" ? "خدمة" : "منتج"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{inv.barberName || "-"}</td>
                      <td className="px-4 py-3">{inv.clientName || "-"}</td>
                      <td className="px-4 py-3 font-bold text-[#C19A6B]">{inv.total} ج</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(inv.date).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {inv.status === "active" ? "نشط" : "ملغي"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
