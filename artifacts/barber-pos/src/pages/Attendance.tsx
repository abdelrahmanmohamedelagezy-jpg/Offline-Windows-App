import { useState, useEffect } from "react";
import { db, Barber, AttendanceRecord } from "@/lib/db";
import { FileDown, Save } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AttendanceStatus = "present" | "absent" | "late";

export default function Attendance() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<Map<number, Partial<AttendanceRecord>>>(new Map());
  const [saved, setSaved] = useState(false);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);

  const load = async () => {
    const bs = await db.barbers.where("active").equals(1).toArray();
    setBarbers(bs);
    const existing = await db.attendance.where("date").equals(date).toArray();
    const map = new Map<number, Partial<AttendanceRecord>>();
    for (const b of bs) {
      const rec = existing.find(e => e.barberId === b.id);
      map.set(b.id!, rec || { barberId: b.id, barberName: b.name, date, status: "present", checkIn: "09:00" });
    }
    setRecords(map);
    setSaved(false);
  };

  useEffect(() => { load(); }, [date]);

  const update = (barberId: number, field: string, value: string) => {
    setRecords(prev => {
      const next = new Map(prev);
      const rec = next.get(barberId) || {};
      next.set(barberId, { ...rec, [field]: value });
      return next;
    });
    setSaved(false);
  };

  const saveAll = async () => {
    for (const [barberId, rec] of records) {
      const existing = await db.attendance.where("barberId").equals(barberId).and(r => r.date === date).first();
      const data = { barberId, barberName: barbers.find(b => b.id === barberId)?.name || "", date, status: (rec.status || "present") as AttendanceStatus, checkIn: rec.checkIn, checkOut: rec.checkOut, notes: rec.notes };
      if (existing) await db.attendance.update(existing.id!, data);
      else await db.attendance.add(data);
    }
    setSaved(true);
  };

  const exportPDF = async () => {
    const start = fromDate; const end = toDate;
    const allRecs = await db.attendance.toArray();
    const filtered = allRecs.filter(r => r.date >= start && r.date <= end);
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Omar Elsadany - Attendance Report", 148, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Period: ${start} to ${end}`, 148, 22, { align: "center" });
    autoTable(doc, {
      startY: 28,
      head: [["Date", "Barber", "Status", "Check In", "Check Out", "Notes"]],
      body: filtered.sort((a, b) => a.date.localeCompare(b.date)).map(r => [
        r.date, r.barberName,
        r.status === "present" ? "Present" : r.status === "late" ? "Late" : "Absent",
        r.checkIn || "-", r.checkOut || "-", r.notes || "-",
      ]),
      styles: { font: "helvetica", fontSize: 9 },
    });
    doc.save(`attendance-${start}-${end}.pdf`);
  };

  const statusColors: Record<AttendanceStatus, string> = {
    present: "border-green-300 bg-green-50",
    late: "border-yellow-300 bg-yellow-50",
    absent: "border-red-300 bg-red-50",
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-[#003366]">الحضور والانصراف</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white shadow-sm" />
          <button onClick={saveAll} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition shadow-md ${saved ? "bg-green-600 text-white" : "bg-[#CD0000] text-white hover:bg-[#a30000]"}`}>
            <Save className="w-4 h-4" />
            {saved ? "تم الحفظ" : "حفظ الحضور"}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-[#003366] text-white px-5 py-3">
          <h2 className="font-bold text-sm">تسجيل الحضور — {date}</h2>
        </div>
        <div className="divide-y divide-border">
          {barbers.map(b => {
            const rec = records.get(b.id!) || {};
            const status = (rec.status || "present") as AttendanceStatus;
            return (
              <div key={b.id} className={`flex items-center gap-4 px-5 py-3.5 border-r-4 ${statusColors[status]}`}>
                <div className="w-10 h-10 rounded-full bg-[#003366] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {b.name[0]}
                </div>
                <div className="w-32 flex-shrink-0">
                  <p className="font-bold text-sm text-[#003366]">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.code}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {(["present", "late", "absent"] as AttendanceStatus[]).map(s => (
                    <button key={s} onClick={() => update(b.id!, "status", s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${status === s ? (s === "present" ? "bg-green-600 text-white border-green-600" : s === "late" ? "bg-yellow-500 text-white border-yellow-500" : "bg-[#CD0000] text-white border-[#CD0000]") : "border-gray-200 text-muted-foreground hover:border-gray-300"}`}>
                      {s === "present" ? "حاضر" : s === "late" ? "متأخر" : "غائب"}
                    </button>
                  ))}
                </div>
                {status !== "absent" && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">دخول</label>
                      <input type="time" value={rec.checkIn || ""} onChange={e => update(b.id!, "checkIn", e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#003366]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">خروج</label>
                      <input type="time" value={rec.checkOut || ""} onChange={e => update(b.id!, "checkOut", e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#003366]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#003366] mb-4">تصدير تقرير الحضور</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">من</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">إلى</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]" />
          </div>
          <button onClick={exportPDF} className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white rounded-xl font-bold text-sm hover:bg-[#002244] transition shadow-md">
            <FileDown className="w-4 h-4" />
            تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
}
