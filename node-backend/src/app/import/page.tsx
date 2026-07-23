"use client";
import { useState, useEffect, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Users, Wrench, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { downloadAuthedFile } from "@/lib/download";
import ProtectedLayout from "@/components/ProtectedLayout";

type ImportType = "customers" | "prices";
type Result = { imported: number; skipped: number; errors: string[] } | null;

function getRole(): string | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(atob(localStorage.getItem("token")!.split(".")[1])).role || null; } catch { return null; }
}
function getShop(): string { return (typeof window !== "undefined" && localStorage.getItem("sa_shop_id")) || ""; }

export default function ImportPage() {
  const [role, setRole] = useState<string | null>(null);
  const [shop, setShop] = useState("");
  useEffect(() => { setRole(getRole()); setShop(getShop()); }, []);

  if (role && role !== "superadmin") return (
    <ProtectedLayout>
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        <AlertTriangle size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.4 }} />
        <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>Superadmin only</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Bulk import is available to the superadmin account.</div>
      </div>
    </ProtectedLayout>
  );

  return (
    <ProtectedLayout>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ color: "var(--text-primary)", margin: "0 0 3px", fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}><FileSpreadsheet size={22} /> Bulk Import</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>Import a shop&apos;s existing Customers &amp; garment prices from Excel.</p>
      </div>

      {!shop && (
        <div style={{ background: "var(--grade-c-bg)", border: "1px solid var(--grade-c-border)", borderRadius: 10, padding: "11px 16px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "var(--grade-c-text)", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> Please select a shop from the top-left first — data will be imported into that shop.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
        <ImportCard type="customers" title="Customers" icon={<Users size={18} />} cols="Name · Phone · Flat · Society · Address · Email" disabled={!shop} />
        <ImportCard type="prices" title="Garment Prices" icon={<Wrench size={18} />} cols="Service Type · Item Name · Price · Category" disabled={!shop} />
      </div>

      <div style={{ marginTop: 18, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "var(--grade-b-text)", lineHeight: 1.6 }}>
        <b>How to use:</b> 1) Download the sample Excel → 2) fill in your data (do not change headers) → 3) upload.
        Duplicate or incomplete rows are skipped (existing data is not overwritten).
      </div>
    </ProtectedLayout>
  );
}

function ImportCard({ type, title, icon, cols, disabled }: { type: ImportType; title: string; icon: React.ReactNode; cols: string; disabled: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const downloadSample = () => downloadAuthedFile("/import", `sample-${type}.xlsx`, { type, sample: 1 }).catch(() => alert("Sample download failed"));

  const upload = async () => {
    if (!file) return;
    setBusy(true); setResult(null); setError("");
    try {
      const fd = new FormData();
      fd.append("type", type);
      fd.append("file", file);
      const res = await api.post("/import", fd);
      setResult(res.data);
      setFile(null); if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) { setError(e?.response?.data?.detail || "Import failed"); }
    finally { setBusy(false); }
  };

  const card: React.CSSProperties = { background: "var(--bg-card-solid)", border: "1px solid var(--border-hard)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow-web-lift)", opacity: disabled ? 0.55 : 1 };

  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", color: "var(--grade-b-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-primary)" }}>{title}</div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Columns: {cols}</div>

      <button onClick={downloadSample} disabled={disabled}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-secondary)", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
        <Download size={15} /> Download sample Excel
      </button>

      <input ref={inputRef} type="file" accept=".xls,.xlsx" disabled={disabled} onChange={e => setFile(e.target.files?.[0] || null)}
        style={{ width: "100%", boxSizing: "border-box", fontSize: 12.5, marginBottom: 10, color: "var(--text-secondary)" }} />

      <button onClick={upload} disabled={disabled || !file || busy}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 9, border: "none", cursor: (disabled || !file || busy) ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 700,
          ...((disabled || !file) ? { background: "var(--bg-input)", color: "var(--text-secondary)", opacity: 0.6 } : { background: "var(--accent-primary)", color: "#0b1830", boxShadow: "var(--shadow-glow-blue)" }) }}>
        <Upload size={15} /> {busy ? "Importing…" : "Upload & import"}
      </button>

      {error && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 600, color: "#ef4444" }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 12, background: "var(--grade-a-bg)", border: "1px solid var(--grade-a-border)", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--grade-a-text)" }}>
            <CheckCircle2 size={15} /> {result.imported} imported{result.skipped ? ` · ${result.skipped} skipped` : ""}
          </div>
          {result.errors.length > 0 && <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--text-muted)" }}>{result.errors.join(" · ")}</div>}
        </div>
      )}
    </div>
  );
}
