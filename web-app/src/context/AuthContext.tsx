"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LoginResult { ok: boolean; detail?: string; }
interface AuthCtx { isAuth: boolean; login: (pw: string) => Promise<LoginResult>; logout: () => void; }

const Ctx = createContext<AuthCtx>({ isAuth: false, login: async () => ({ ok: false }), logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(localStorage.getItem("lp_auth") === "1");
  }, []);

  const login = async (pw: string): Promise<LoginResult> => {
    try {
      const res  = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("lp_auth", "1");
        localStorage.setItem("lp_token", data.token);
        setIsAuth(true);
        return { ok: true };
      }
      return { ok: false, detail: data.detail };
    } catch {
      return { ok: false, detail: "Network error. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("lp_auth");
    localStorage.removeItem("lp_token");
    setIsAuth(false);
  };

  return <Ctx.Provider value={{ isAuth, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
