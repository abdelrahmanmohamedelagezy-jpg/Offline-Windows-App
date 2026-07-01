import { useState, useEffect } from "react";
import { db, Product, InvoiceItem } from "@/lib/db";
import { Trash2, Plus, Minus, Printer, RotateCcw, CheckCircle, PackageX } from "lucide-react";

interface CartItem extends InvoiceItem { stock: number; }

export default function ProductPOS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    db.products.toArray().then(setProducts);
  }, []);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      setError(`${product.name} غير متوفر في المخزون`);
      setTimeout(() => setError(""), 3000);
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id!);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setError("الكمية المطلوبة تتجاوز المخزون");
          setTimeout(() => setError(""), 3000);
          return prev;
        }
        return prev.map(c => c.id === product.id! ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: product.id!, name: product.name, price: product.sellPrice, quantity: 1, type: "product", stock: product.quantity }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newQty = c.quantity + delta;
      if (newQty > c.stock) return c;
      return { ...c, quantity: Math.max(1, newQty) };
    }));
  };

  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.id !== id));
  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const saveInvoice = async () => {
    if (cart.length === 0) return;
    const id = await db.invoices.add({
      type: "product",
      clientName: clientName || undefined,
      clientPhone: clientPhone || undefined,
      items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, quantity: c.quantity, type: "product" })),
      total,
      date: new Date(),
      status: "active",
    });
    for (const item of cart) {
      const product = products.find(p => p.id === item.id);
      if (product) {
        await db.products.update(item.id, { quantity: product.quantity - item.quantity });
      }
    }
    setInvoiceId(id as number);
    setSaved(true);
    setProducts(await db.products.toArray());
  };

  const reset = () => {
    setCart([]);
    setClientName("");
    setClientPhone("");
    setSaved(false);
    setInvoiceId(null);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <h1 className="text-2xl font-black text-[#003366]">نقطة البيع - المنتجات</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
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

          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h2 className="text-base font-bold text-[#003366] mb-4">اختر المنتجات</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map(product => (
                <button
                  key={product.id}
                  data-testid={`product-${product.id}`}
                  onClick={() => addToCart(product)}
                  disabled={product.quantity <= 0}
                  className={`border rounded-xl p-4 text-right transition-all shadow-sm ${
                    product.quantity <= 0
                      ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                      : "bg-amber-50 hover:bg-[#C19A6B] hover:text-white border-amber-100 text-[#003366] group cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-bold text-sm">{product.name}</p>
                    {product.quantity <= 0 && <PackageX className="w-4 h-4 text-gray-400" />}
                  </div>
                  <p className="text-[#CD0000] font-black text-lg">{product.sellPrice} ج</p>
                  <p className="text-xs text-muted-foreground mt-1">المخزون: {product.quantity}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-[#003366] text-white px-5 py-4">
              <h2 className="font-bold text-base">فاتورة المنتجات</h2>
            </div>
            <div className="p-4 space-y-2 min-h-32">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">لم تختر أي منتج بعد</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-amber-50/50 rounded-lg p-2">
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
                  data-testid="btn-save-product-invoice"
                  onClick={saveInvoice}
                  disabled={cart.length === 0}
                  className="w-full bg-[#CD0000] hover:bg-[#a30000] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  حفظ الفاتورة
                </button>
              ) : (
                <button
                  onClick={() => window.print()}
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الفاتورة
                </button>
              )}
              <button
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

      {/* Print Section */}
      <div className="hidden print:block" dir="rtl" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", width: "80mm", margin: "0 auto", padding: "8px" }}>
        <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "8px", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>Omar Elsadany</h2>
          <p style={{ margin: "2px 0", fontSize: "11px" }}>فاتورة مبيعات منتجات</p>
          <p style={{ margin: "2px 0", fontSize: "10px" }}>{new Date().toLocaleString("ar-EG")}</p>
          {invoiceId && <p style={{ margin: "2px 0", fontSize: "10px" }}>رقم: #{invoiceId}</p>}
        </div>
        {clientName && <p style={{ fontSize: "11px", margin: "4px 0" }}>العميل: {clientName}</p>}
        {clientPhone && <p style={{ fontSize: "11px", margin: "4px 0" }}>الهاتف: {clientPhone}</p>}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000" }}>
              <th style={{ textAlign: "right", padding: "2px 0", fontSize: "11px" }}>المنتج</th>
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
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginTop: "8px", borderTop: "1px dashed #000", paddingTop: "8px" }}>
          <span>الإجمالي:</span>
          <span>{total} ج</span>
        </div>
        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "11px" }}>
          <p style={{ fontWeight: "bold" }}>شكرًا لزيارتكم</p>
        </div>
      </div>
    </div>
  );
}
