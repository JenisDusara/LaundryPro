"use client";
import { useEffect, useState } from "react";
import { QrCode, X, Printer } from "lucide-react";
import api from "@/lib/api";

type QrTag = { token: string; url: string; qr_data_url: string; label: string };
export type QrTagData = {
  mode: string;
  entry: { id: string; entry_date: string; delivery_date: string | null; tag_notes: string; items: { service_name: string; quantity: number }[] };
  customer: { name: string; phone: string; flat_number: string; society_name: string; address: string };
  tags: QrTag[];
};

const QR_PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #qr-print-area, #qr-print-area * { visibility: visible; }
  #qr-print-area { position: absolute; left: 0; top: 0; width: 100%; }
}`;

/**
 * In-app QR tag preview (no new browser tab). Fetches the tag for `entryId` when opened and
 * renders a clean printable card. `mode` defaults to "order" (one QR for the whole order); when
 * multiple tags come back (stickers/item mode) they are shown in a print-ready grid.
 */
export default function QrTagModal({ entryId, mode = "order", onClose }: { entryId: string; mode?: string; onClose: () => void }) {
  const [data, setData] = useState<QrTagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Optional description printed on the tag. Prefilled from any saved note; editable here.
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const fetchTag = () => {
    setLoading(true); setError(false); setData(null);
    api.post(`/entries/${entryId}/tag`, { mode })
      .then(res => { setData(res.data); setNote(res.data?.entry?.tag_notes || ""); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTag(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [entryId, mode]);

  // Persist the note (as tag_notes) so it survives reopen and shows on the scan page.
  const saveNote = async () => {
    setSavingNote(true); setNoteSaved(false);
    try {
      const res = await api.post(`/entries/${entryId}/tag`, { mode, tag_notes: note });
      setData(res.data);
      setNoteSaved(true);
    } catch {
      /* leave the typed note in place; user can retry */
    } finally {
      setSavingNote(false);
    }
  };

  const multi = (data?.tags.length || 0) > 1;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400, padding: 16 }} onClick={onClose}>
      <style>{QR_PRINT_CSS}</style>
      <div onClick={ev => ev.stopPropagation()}
        style={{ background: "var(--bg-card-solid)", borderRadius: 18, border: "1px solid var(--border-hard)", boxShadow: "0 24px 60px rgba(0,0,0,0.35)", width: "100%", maxWidth: multi ? 560 : 380, maxHeight: "92vh", overflow: "auto" }}>
        {/* Header */}
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "16px 18px", borderBottom: "1px solid var(--border-hard)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <QrCode size={18} color="var(--accent-primary)" />
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)" }}>QR tag</div>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg-input)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="var(--text-secondary)" /></button>
        </div>

        <div style={{ padding: 20 }}>
          {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>Generating QR…</div>}

          {!loading && error && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ color: "var(--grade-f-text)", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Could not generate the QR. Please try again.</div>
              <button onClick={fetchTag} style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-primary)", fontWeight: 700, cursor: "pointer" }}>Retry</button>
            </div>
          )}

          {!loading && data && data.tags.length > 0 && (
            <>
              <div id="qr-print-area" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
                {data.tags.map((tag, i) => (
                  <div key={i} style={{ width: 240, border: "1.5px solid #000", borderRadius: 10, padding: 14, background: "#fff", color: "#000", fontFamily: "system-ui, sans-serif", breakInside: "avoid" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tag.qr_data_url} alt="QR" width={multi ? 130 : 170} height={multi ? 130 : 170} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, textAlign: "center" }}>{data.customer.name}</div>
                    {data.customer.phone && <div style={{ fontSize: 12, textAlign: "center", marginTop: 2 }}>{data.customer.phone}</div>}
                    {(data.customer.flat_number || data.customer.society_name) && (
                      <div style={{ fontSize: 12, textAlign: "center", marginTop: 2 }}>{[data.customer.flat_number, data.customer.society_name].filter(Boolean).join(", ")}</div>
                    )}
                    <div style={{ borderTop: "1px dashed #999", margin: "9px 0", paddingTop: 7, fontSize: 11.5, lineHeight: 1.5 }}>
                      {data.entry.items.map((it, j) => <div key={j}>{it.service_name} ×{it.quantity}</div>)}
                    </div>
                    <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
                      <span>Entry: {data.entry.entry_date}</span>
                      {data.entry.delivery_date && <span>Delivery: {data.entry.delivery_date}</span>}
                    </div>
                    {note.trim() && <div style={{ fontSize: 11, fontStyle: "italic", marginTop: 5 }}>{note.trim()}</div>}
                    {multi && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 5, textAlign: "center" }}>{tag.label}</div>}
                  </div>
                ))}
              </div>

              {/* Optional description — add a note to print on the tag (e.g. "red saree, stain on sleeve") */}
              <div className="no-print" style={{ marginTop: 16 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  <span>Description <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>(optional)</span></span>
                  {noteSaved && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--grade-a-text)" }}>Saved ✓</span>}
                </label>
                <textarea
                  value={note}
                  onChange={e => { setNote(e.target.value); setNoteSaved(false); }}
                  rows={2}
                  placeholder="e.g. red saree, stain on sleeve"
                  style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1.5px solid var(--border)", borderRadius: 9, fontSize: 13, background: "var(--bg-input)", color: "var(--text-primary)", resize: "vertical", outline: "none" }}
                />
                <button onClick={saveNote} disabled={savingNote}
                  style={{ marginTop: 8, padding: "7px 14px", borderRadius: 9, border: "1px solid var(--border-hard)", background: "var(--bg-card-solid)", color: "var(--text-primary)", fontWeight: 700, fontSize: 12.5, cursor: savingNote ? "not-allowed" : "pointer", opacity: savingNote ? 0.6 : 1 }}>
                  {savingNote ? "Saving…" : "Save description"}
                </button>
              </div>

              <div className="no-print" style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-secondary)", fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>Close</button>
                <button onClick={() => window.print()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 10, border: "none", background: "var(--accent-primary)", color: "#0b1830", boxShadow: "var(--shadow-glow-blue)", fontWeight: 800, cursor: "pointer", fontSize: 13.5 }}><Printer size={16} /> Print</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
