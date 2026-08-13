import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest, setAccessToken } from "@/lib/api";
import type { AdminUser } from "@/lib/admin-api";

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<AdminUser | null>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

async function restoreSession() {
  const response = await apiRequest<{ user: AdminUser; accessToken: string }>("/auth/refresh", { method: "POST" }, false);
  if (response.user.role !== "ADMIN" && response.user.role !== "SUPER_ADMIN") {
    setAccessToken(null);
    throw new Error("This account does not have administrator access.");
  }
  setAccessToken(response.accessToken);
  return response.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const next = await restoreSession();
      setUser(next);
      return next;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  };

  useEffect(() => { void refresh().finally(() => setIsLoading(false)); }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest<{ user: AdminUser; accessToken: string }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }, false);
    if (response.user.role !== "ADMIN" && response.user.role !== "SUPER_ADMIN") {
      setAccessToken(null);
      throw new Error("This account does not have administrator access.");
    }
    setAccessToken(response.accessToken);
    setUser(response.user);
    return response.user;
  };

  const logout = async () => {
    try { await apiRequest("/auth/logout", { method: "POST" }, false); }
    finally { setAccessToken(null); setUser(null); }
  };

  return <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refresh }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
