import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { getSettings } from "@/lib/settings";
import {
  LayoutDashboard, Scissors, ShoppingCart, Boxes,
  DollarSign, Users, CalendarCheck, BarChart2,
  LogOut, Package, ChevronRight, Settings
} from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isOwner } = useAuth();
  const [location] = useLocation();
  const settings = getSettings();

  const navItems = [
    { href: "/", label: "لوحة التحكم", icon: LayoutDashboard, show: true },
    { href: "/pos", label: "البيع - خدمات", icon: Scissors, show: true },
    { href: "/pos/products", label: "البيع - منتجات", icon: ShoppingCart, show: true },
    { href: "/inventory", label: "الجرد والمنتجات", icon: Boxes, show: true },
    { href: "/services", label: "الخدمات والأسعار", icon: Scissors, show: isOwner() },
    { href: "/expenses", label: "المصروفات", icon: DollarSign, show: isOwner() || settings.cashierCanViewExpenses },
    { href: "/barbers", label: "الحلاقين", icon: Users, show: isOwner() || settings.cashierCanViewBarbers },
    { href: "/attendance", label: "الحضور والانصراف", icon: CalendarCheck, show: isOwner() || settings.cashierCanAccessAttendance },
    { href: "/reports", label: "التقارير", icon: BarChart2, show: isOwner() || settings.cashierCanViewReports },
    { href: "/settings", label: "الإعدادات", icon: Settings, show: isOwner() },
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <div className="flex h-screen overflow-hidden font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-[#003366] flex flex-col flex-shrink-0 shadow-xl">
        {/* Logo/Brand */}
        <div className="px-6 py-5 border-b border-[#00408a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#CD0000] flex items-center justify-center shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[#C19A6B] font-black text-sm leading-tight">Omar Elsadany</p>
              <p className="text-white/60 text-xs">صالون الحلاقة</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                    isActive
                      ? "bg-[#CD0000] text-white shadow-md"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-70" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="px-4 py-4 border-t border-[#00408a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#CD0000] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-white/50 text-xs">
                {user?.role === "owner" ? "مالك" : user?.role === "cashier" ? "كاشير" : "حلاق"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="text-sm font-semibold text-muted-foreground">
            {visibleItems.find(
              i =>
                location === i.href ||
                (i.href !== "/" && location.startsWith(i.href))
            )?.label || "الرئيسية"}
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
