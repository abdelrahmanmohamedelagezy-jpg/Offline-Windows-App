import { useState, useEffect } from "react";
import { db, Barber, AttendanceRecord } from "@/lib/db";
import { FileDown, Save, LogIn, LogOut, Clock } from "lucide-react";
import { exportAttendancePDF } from "@/lib/exportReport";

type AttendanceStatus = "present" | "absent" | "late";

function nowTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5); // "HH:MM"
}

export default function Attendance() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Map<number, Partial<AttendanceRecord>>>(new Map());
  const [saved, setSaved] = useState(false);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const load = async () => {
    const all = await db.barbers.toArray();
    const bs = all.filter(b => b.active);
    setBarbers(bs);
    const existing = await db.attendance.where("date").equals(date).toArray();
    const map = new Map<number, Partial<AttendanceRecord>>();
    for (const b of bs) {
      const rec = existing.find(e => e.barberId === b.id);
      map.set(b.id!, rec || { barberId: b.id, barberName: b.name, date, status: undefined });
    }
    setRecords(map);
    setSaved(false);
  };

  useEffect(() => { load(); }, [date]);

  const update = (barberId: number, fields: Partial<AttendanceRecord>) => {
    setRecords(prev => {
      const next = new Map(prev);
      const rec = next.get(barberId) || {};
      next.set(barberId, { ...rec, ...fields });
      return next;
    });
    setSaved(false);
  };

  // Click "حاضر" or "متأخر" → set status + auto-stamp check-in if not set
  const markArrival = (barberId: number, status: "present" | "late") => {
    setRecords(prev => {
      const next = new Map(prev);
      const rec = next.get(barberId) || {};
      next.set(barberId, {
        ...rec,
        status,
        checkIn: rec.checkIn || nowTime(), // auto-stamp only if not already set
      });
      return next;
    });
    setSaved(false);
  };

  // Click "انصراف" → auto-stamp check-out now
  const markDeparture = (barberId: number) => {
    setRecords(prev => {
      const next = new Map(prev);
      const rec = next.get(barberId) || {};
      next.set(barberId, { ...rec, checkOut: nowTime() });
      return next;
    });
    setSaved(false);
  };

  const markAbsent = (barberId: number) => {
    setRecords(prev => {
      const next = new Map(prev);
      const rec = next.get(barberId) || {};
      next.set(barberId, { ...rec, status: "absent", checkIn: undefined, checkOut: undefined });
      return next;
    });
    setSaved(false);
  };

  const saveAll = async () => {
    for (const [barberId, rec] of records) {
      if (!rec.status) continue; // skip unset rows
      const existing = await db.attendance
        .where("barberId").equals(barberId)
        .and(r => r.date === date)
        .first();
      const barber = barbers.find(b => b.id === barberId);
      const data = {
        barberId,
        barberName: barber?.name || rec.barberName || "",
        date,
        status: rec.status as AttendanceStatus,
        checkIn: rec.checkIn,
        checkOut: rec.checkOut,
        notes: rec.notes,
      };
      if (existing) {
        await db.attendance.update(existing.id!, data);
      } else {
        await db.attendance.add(data);
      }
    }
    setSaved(true);
  };

  const exportPDF = async () => {
    const allRecs = await db.attendance.toArray();
    const filtered = allRecs.filter(r => r.date >= fromDate && r.date <= toDate);
    exportAttendancePDF(fromDate, toDate, filtered.map(r => ({
      date: r.date,
      barberName: r.barberName,
      status: r.status,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      notes: r.notes,
    })));
  };

  const statusBorder: Record<string, string> = {
    present: "border-r-green-500 bg-green-50/30",
    late:    "border-r-yellow-500 bg-yellow-50/30",
    absent:  "border-r-red-500 bg-red-50/30",
    "":      "border-r-gray-200 bg-white",
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[#003366]">الحضور والانصراف</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white shadow-sm"
          />
          <button
            onClick={saveAll}
            disabled={barbers.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 ${
              saved ? "bg-green-600 text-white" : "bg-[#CD0000] text-white hover:bg-[#a30000]"
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? "تم الحفظ ✓" : "حفظ الحضور"}
          </button>
        </div>
      </div>

      {/* Quick-stamp hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-blue-700">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>اضغط <strong>حاضر</strong> أو <strong>متأخر</strong> لتسجيل وقت الدخول تلقائيًا، ثم اضغط <strong>انصراف</strong> عند المغادرة لتسجيل وقت الخروج.</span>
      </div>

      {/* Attendance Cards */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-bold text-sm">تسجيل الحضور — {date}</h2>
          <span className="text-white/60 text-xs">
            {Array.from(records.values()).filter(r => r.status === "present" || r.status === "late").length} / {barbers.length} حضروا
          </span>
        </div>

        {barbers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm font-semibold">لا يوجد حلاقون نشطون</p>
            <p className="text-xs mt-1">أضف حلاقين من صفحة إدارة الحلاقين أولًا</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {barbers.map(b => {
              const rec = records.get(b.id!) || {};
              const status = rec.status || "";
              const hasCheckedIn  = !!(rec.checkIn);
              const hasCheckedOut = !!(rec.checkOut);

              return (
                <div
                  key={b.id}
                  className={`flex flex-wrap items-center gap-3 px-5 py-4 border-r-4 transition-colors ${statusBorder[status]}`}
                >
                  {/* Avatar + Name */}
                  <div className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {b.name[0]}
                  </div>
                  <div className="w-32 flex-shrink-0">
                    <p className="font-bold text-sm text-[#003366]">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.code}</p>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => markArrival(b.id!, "present")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        status === "present"
                          ? "bg-green-600 text-white border-green-600 shadow-sm"
                          : "border-green-200 text-green-700 hover:bg-green-50 bg-white"
                      }`}
                    >
                      <LogIn className="w-3 h-3" />
                      حاضر
                    </button>
                    <button
                      onClick={() => markArrival(b.id!, "late")}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        status === "late"
                          ? "bg-yellow-500 text-white border-yellow-500 shadow-sm"
                          : "border-yellow-200 text-yellow-700 hover:bg-yellow-50 bg-white"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      متأخر
                    </button>
                    <button
                      onClick={() => markAbsent(b.id!)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                        status === "absent"
                          ? "bg-[#CD0000] text-white border-[#CD0000] shadow-sm"
                          : "border-red-200 text-red-600 hover:bg-red-50 bg-white"
                      }`}
                    >
                      غائب
                    </button>
                  </div>

                  {/* Departure button + Times */}
                  {status !== "absent" && status !== "" && (
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Check-in badge */}
                      {hasCheckedIn && (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                          <LogIn className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-bold text-green-700">{rec.checkIn}</span>
                          <input
                            type="time"
                            value={rec.checkIn || ""}
                            onChange={e => update(b.id!, { checkIn: e.target.value })}
                            className="text-xs border-0 bg-transparent text-green-700 focus:outline-none w-0 opacity-0 absolute"
                            tabIndex={-1}
                          />
                          <button
                            onClick={() => update(b.id!, { checkIn: nowTime() })}
                            title="تحديث وقت الدخول للآن"
                            className="text-green-500 hover:text-green-700 transition"
                          >
                            <Clock className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Departure button */}
                      <button
                        onClick={() => markDeparture(b.id!)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          hasCheckedOut
                            ? "bg-[#003366] text-white border-[#003366] shadow-sm"
                            : "border-[#003366] text-[#003366] hover:bg-blue-50 bg-white"
                        }`}
                      >
                        <LogOut className="w-3 h-3" />
                        {hasCheckedOut ? `انصرف ${rec.checkOut}` : "تسجيل الانصراف"}
                      </button>

                      {/* Manual time overrides (compact) */}
                      <div className="flex items-center gap-2 mr-1">
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-muted-foreground">دخول</label>
                          <input
                            type="time"
                            value={rec.checkIn || ""}
                            onChange={e => update(b.id!, { checkIn: e.target.value })}
                            className="border border-border rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#003366] bg-white w-20"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-muted-foreground">خروج</label>
                          <input
                            type="time"
                            value={rec.checkOut || ""}
                            onChange={e => update(b.id!, { checkOut: e.target.value })}
                            className="border border-border rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#003366] bg-white w-20"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#003366] mb-4">تصدير تقرير الحضور</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">من</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">إلى</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white rounded-xl font-bold text-sm hover:bg-[#002244] transition shadow-md"
          >
            <FileDown className="w-4 h-4" />
            تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
}
