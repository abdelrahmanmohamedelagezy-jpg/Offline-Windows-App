import Dexie, { type Table } from 'dexie';

export interface User {
  id?: number;
  username: string;
  password: string;
  role: 'owner' | 'cashier' | 'barber';
  name: string;
  phone?: string;
}

export interface Barber {
  id?: number;
  code: string;
  name: string;
  phone: string;
  age: number;
  notes?: string;
  active: boolean;
  createdAt: Date;
}

export interface Service {
  id?: number;
  name: string;
  price: number;
  active: boolean;
}

export interface Product {
  id?: number;
  name: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  category: string;
}

export interface InvoiceItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

export type PaymentMethod = 'cash' | 'instapay' | 'vodafone';

export interface Invoice {
  id?: number;
  type: 'service' | 'product';
  barberId?: number;
  barberName?: string;
  clientName?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  total: number;
  date: Date;
  status: 'active' | 'voided';
  paymentMethod?: PaymentMethod;
}

export interface Expense {
  id?: number;
  description: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
}

export interface AttendanceRecord {
  id?: number;
  barberId: number;
  barberName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface PayrollAdjustment {
  id?: number;
  barberId: number;
  type: 'bonus' | 'deduction';
  amount: number;
  reason: string;
  date: Date;
}

class BarberDB extends Dexie {
  users!: Table<User>;
  barbers!: Table<Barber>;
  services!: Table<Service>;
  products!: Table<Product>;
  invoices!: Table<Invoice>;
  expenses!: Table<Expense>;
  attendance!: Table<AttendanceRecord>;
  payrollAdjustments!: Table<PayrollAdjustment>;

  constructor() {
    super('OmarElsadanyBarber');
    this.version(1).stores({
      users: '++id, username, role',
      barbers: '++id, code, active',
      services: '++id, active',
      products: '++id',
      invoices: '++id, type, date, barberId, status',
      expenses: '++id, date, category',
      attendance: '++id, barberId, date',
      payrollAdjustments: '++id, barberId',
    });
  }
}

export const db = new BarberDB();

export async function seedIfEmpty() {
  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.bulkAdd([
      { username: 'admin', password: 'admin123', role: 'owner', name: 'Omar Elsadany' },
      { username: 'cashier', password: '1234', role: 'cashier', name: 'الكاشير' },
    ]);
    await db.services.bulkAdd([
      { name: 'حلاقة شعر', price: 80, active: true },
      { name: 'حلاقة ذقن', price: 50, active: true },
      { name: 'حلاقة شعر + ذقن', price: 120, active: true },
      { name: 'قص أطراف', price: 40, active: true },
      { name: 'تلوين شعر', price: 200, active: true },
      { name: 'مساج', price: 100, active: true },
    ]);
    await db.barbers.bulkAdd([
      { code: 'B01', name: 'أحمد محمد', phone: '01012345678', age: 28, active: true, createdAt: new Date() },
      { code: 'B02', name: 'محمود علي', phone: '01098765432', age: 32, active: true, createdAt: new Date() },
      { code: 'B03', name: 'كريم حسن', phone: '01123456789', age: 25, active: true, createdAt: new Date() },
    ]);
    await db.products.bulkAdd([
      { name: 'كريم تثبيت شعر', buyPrice: 40, sellPrice: 80, quantity: 20, category: 'تصفيف' },
      { name: 'زيت لحية', buyPrice: 60, sellPrice: 120, quantity: 15, category: 'عناية' },
      { name: 'شامبو رجالي', buyPrice: 30, sellPrice: 70, quantity: 30, category: 'عناية' },
    ]);
    const today = new Date().toISOString().split('T')[0];
    const barbers = await db.barbers.toArray();
    for (const b of barbers) {
      await db.attendance.add({
        barberId: b.id!,
        barberName: b.name,
        date: today,
        checkIn: '09:00',
        status: 'present',
      });
    }
  }
}
