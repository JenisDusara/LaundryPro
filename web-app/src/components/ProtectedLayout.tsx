"use client";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuth();
  return (
    <Sidebar>
      {children}
    </Sidebar>
  );
}
