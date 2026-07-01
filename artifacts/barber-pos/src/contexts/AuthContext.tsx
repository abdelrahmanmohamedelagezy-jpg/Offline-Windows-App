import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db, User } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isOwner: () => boolean;
  isCashier: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("barber_user_id");
    if (storedId) {
      db.users.get(Number(storedId)).then((u) => {
        if (u) setUser(u);
      });
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const found = await db.users.where("username").equals(username).first();
    if (found && found.password === password) {
      setUser(found);
      localStorage.setItem("barber_user_id", String(found.id));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("barber_user_id");
  };

  const isOwner = () => user?.role === "owner";
  const isCashier = () => user?.role === "cashier" || user?.role === "barber";

  return (
    <AuthContext.Provider value={{ user, login, logout, isOwner, isCashier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
