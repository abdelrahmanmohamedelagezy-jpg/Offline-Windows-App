import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import barberBgImage from "@assets/image_1782908784908.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      setLocation("/");
    } else {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${barberBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#003366]/80" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#003366] px-8 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#CD0000] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm2.122-2.122L19 5" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-[#C19A6B]">Omar Elsadany</h1>
            <p className="text-white/70 text-sm mt-1">نظام إدارة صالون الحلاقة</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-bold text-[#003366] mb-6 text-center">تسجيل الدخول</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">اسم المستخدم</label>
                <input
                  data-testid="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                <input
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}
              <button
                data-testid="btn-login"
                type="submit"
                disabled={loading}
                className="w-full bg-[#CD0000] hover:bg-[#a30000] text-white font-bold py-3 rounded-lg transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "جاري الدخول..." : "دخول"}
              </button>
            </form>
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>المالك: admin / admin123</p>
              <p>كاشير: cashier / 1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
