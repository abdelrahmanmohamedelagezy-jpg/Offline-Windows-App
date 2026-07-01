import { useState, useEffect } from "react";
import { db, Barber, Service, InvoiceItem } from "@/lib/db";
import { Trash2, Plus, Minus, Printer, RotateCcw, CheckCircle } from "lucide-react";
import { openReceiptWindow } from "@/lib/printReceipt";
import { getSettings } from "@/lib/settings";

interface CartItem extends InvoiceItem {}

export default function POS() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

  useEffect(() => {
    db.barbers.toArray().then(all => setBarbers(all.filter(b => b.active)));
    db.services.toArray().then(all => setServices(all.filter(s => s.active)));
  }, []);

  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === service.id!);
      if (existing) {
        return prev.map(c => c.id === service.id! ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: service.id!, name: service.name, price: service.price, quantity: 1, type: "service" }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const saveInvoice = async () => {
    if (cart.length === 0) return;
    const id = await db.invoices.add({
      type: "service",
      barberId: selectedBarber?.id,
      barberName: selectedBarber?.name,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      items: cart,
      total,
      date: new Date(),
      status: "active",
    });
    setInvoiceId(id as number);
    setSaved(true);
  };

  const handlePrint = () => {
    const settings = getSettings();
    openReceiptWindow({
      invoiceId,
      type: "service",
      barberName: selectedBarber?.name,
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      items: cart,
      total,
      date: new Date(),
      instagramHandle: settings.instagramHandle,
      tiktokHandle: settings.tiktokHandle,
    });
  };

  const reset = () => {
    setCart([]);
    setClientName("");
    setClientPhone("");
    setSelectedBarber(null);
    setSaved(false);
    setInvoiceId(null);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <h1 className="text-2xl font-black text-[#003366]">نقطة البيع — الخدمات</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Services Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barber & Client Info */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#003366] mb-1.5">الحلاق</label>
                <select
                  data-testid="select-barber"
                  value={selectedBarber?.id || ""}
                  onChange={e => {
                    const b = barbers.find(b => b.id === Number(e.target.value));
                    setSelectedBarber(b || null);
                  }}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                >
                  <option value="">اختر الحلاق</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
                {barbers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">لا يوجد حلاقون نشطون — أضف حلاقًا من صفحة الحلاقين أولًا</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#003366] mb-1.5">اسم العميل (اختياري)</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="اسم العميل"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#003366] mb-1.5">رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                />
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#003366] mb-4">اختر الخدمات</h2>
            {services.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">لا توجد خدمات نشطة — أضف خدمات من صفحة الخدمات والأسعار</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map(service => (
                  <button
                    key={service.id}
                    data-testid={`service-${service.id}`}
                    onClick={() => addToCart(service)}
                    className="bg-red-50 hover:bg-[#CD0000] hover:text-white border border-red-100 text-[#003366] rounded-xl p-4 text-right transition-all group shadow-sm"
                  >
                    <p className="font-bold text-sm mb-1 group-hover:text-white">{service.name}</p>
                    <p className="text-[#C19A6B] font-black text-lg group-hover:text-yellow-200">{service.price} ج</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-[#003366] text-white px-5 py-4">
              <h2 className="font-bold text-base">الفاتورة</h2>
              {selectedBarber && <p className="text-white/70 text-xs mt-0.5">الحلاق: {selectedBarber.name}</p>}
            </div>
            <div className="p-4 space-y-2 min-h-32">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">لم تختر أي خدمة بعد</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-red-50/50 rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#003366] truncate">{item.name}</p>
                      <p className="text-xs text-[#CD0000] font-bold">{item.price} ج × {item.quantity} = {item.price * item.quantity} ج</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center mr-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <span className="text-2xl font-black text-[#C19A6B]">{total} ج</span>
              </div>
            </div>
            <div className="px-4 pb-4 space-y-2">
              {!saved ? (
                <button
                  data-testid="btn-save-invoice"
                  onClick={saveInvoice}
                  disabled={cart.length === 0}
                  className="w-full bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  حفظ الفاتورة
                </button>
              ) : (
                <button
                  data-testid="btn-print"
                  onClick={handlePrint}
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الفاتورة
                </button>
              )}
              <button
                data-testid="btn-reset"
                onClick={reset}
                className="w-full border border-border text-muted-foreground hover:text-foreground py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                مسح الفاتورة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
