import { useState, useEffect, useRef } from "react";
import { db, Barber, Service, InvoiceItem } from "@/lib/db";
import { Trash2, Plus, Minus, Printer, RotateCcw, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.barbers.where("active").equals(1).toArray().then(setBarbers);
    db.services.where("active").equals(1).toArray().then(setServices);
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

  const print = () => {
    window.print();
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
      <h1 className="text-2xl font-black text-[#003366]">نقطة البيع - الخدمات</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Services Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barber & Client */}
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
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#003366] mb-1.5">اسم العميل (اختياري)</label>
                <input
                  data-testid="input-client-name"
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
                  data-testid="input-client-phone"
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
                      <p className="text-xs text-[#CD0000] font-bold">{item.price} ج × {item.quantity}</p>
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
                  onClick={print}
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

      {/* Print Receipt */}
      <div className="hidden print:block" ref={printRef} dir="rtl" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", width: "80mm", margin: "0 auto", padding: "8px" }}>
        <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "8px", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>Omar Elsadany</h2>
          <p style={{ margin: "2px 0", fontSize: "11px" }}>صالون الحلاقة</p>
          <p style={{ margin: "2px 0", fontSize: "10px", color: "#555" }}>{new Date().toLocaleString("ar-EG")}</p>
          {invoiceId && <p style={{ margin: "2px 0", fontSize: "10px" }}>فاتورة رقم: #{invoiceId}</p>}
        </div>
        {(selectedBarber || clientName) && (
          <div style={{ marginBottom: "8px", fontSize: "11px" }}>
            {selectedBarber && <p style={{ margin: "2px 0" }}>الحلاق: {selectedBarber.name}</p>}
            {clientName && <p style={{ margin: "2px 0" }}>العميل: {clientName}</p>}
            {clientPhone && <p style={{ margin: "2px 0" }}>الهاتف: {clientPhone}</p>}
          </div>
        )}
        <div style={{ borderBottom: "1px dashed #000", marginBottom: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ textAlign: "right", padding: "2px 0", fontSize: "11px" }}>الخدمة</th>
                <th style={{ textAlign: "center", padding: "2px 0", fontSize: "11px" }}>عدد</th>
                <th style={{ textAlign: "left", padding: "2px 0", fontSize: "11px" }}>سعر</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: "2px 0", fontSize: "11px" }}>{item.name}</td>
                  <td style={{ textAlign: "center", padding: "2px 0", fontSize: "11px" }}>{item.quantity}</td>
                  <td style={{ textAlign: "left", padding: "2px 0", fontSize: "11px" }}>{item.price * item.quantity} ج</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginBottom: "12px" }}>
          <span>الإجمالي:</span>
          <span>{total} ج</span>
        </div>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <QRCodeSVG value="https://instagram.com/omarelsadany" size={64} />
          <p style={{ fontSize: "9px", marginTop: "4px" }}>@omarelsadany</p>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px dashed #000", paddingTop: "8px", fontSize: "11px" }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>شكرًا لزيارتكم</p>
          <p style={{ margin: "2px 0", fontSize: "10px" }}>نتمنى لكم يومًا سعيدًا</p>
        </div>
      </div>
    </div>
  );
}
