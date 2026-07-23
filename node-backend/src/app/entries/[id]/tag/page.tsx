"use client";
import { useEffect, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

type Tag = { token: string; url: string; qr_data_url: string; label: string };
type TagData = {
  mode: string;
  entry: { id: string; entry_date: string; delivery_date: string | null; tag_notes: string; items: { service_name: string; quantity: number }[] };
  customer: { name: string; phone: string; flat_number: string; society_name: string; address: string };
  tags: Tag[];
};

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  #tag-print-area, #tag-print-area * { visibility: visible; }
  #tag-print-area { position: absolute; left: 0; top: 0; width: 100%; }
  .no-print { display: none !important; }
}
`;

export default function TagPrintPage({ params }: { params: { id: string } }) {
  const [mode, setMode] = useState("order");
  const [count, setCount] = useState<string | null>(null);
  const [labelSize, setLabelSize] = useState<"thermal" | "compact" | "a4">("thermal");
  const [data, setData] = useState<TagData | null>(null);
  const [note, setNote] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = (m: string, c: string | null, tagNotes?: string, opts?: { regenerate?: boolean; labels?: Record<string, string> }) => {
    const body: any = { mode: m };
    if (c) body.count = Number(c);
    if (tagNotes !== undefined) body.tag_notes = tagNotes;
    if (opts?.regenerate) body.regenerate = true;
    if (opts?.labels) body.labels = opts.labels;
    return api.post(`/entries/${params.id}/tag`, body).then(res => {
      setData(res.data);
      setNote(res.data.entry.tag_notes || "");
      setLabels((prev) => {
        const next: Record<string, string> = {};
        for (const tag of res.data.tags || []) next[tag.token] = prev[tag.token] || tag.label.split(" - ").slice(1).join(" - ");
        return next;
      });
    });
  };

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const m = sp.get("mode") || "order";
    const c = sp.get("count");
    setMode(m); setCount(c);
    load(m, c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const saveNote = async () => {
    setSaving(true);
    try { await load(mode, count, note); } finally { setSaving(false); }
  };
  const saveLabels = async () => {
    setSaving(true);
    try { await load(mode, count, note, { labels }); } finally { setSaving(false); }
  };
  const regenerateTags = async () => {
    if (!window.confirm("Regenerate QR tokens? Old printed tags for this mode will stop working.")) return;
    const reason = window.prompt("Reason for regenerate/lost tag?");
    if (!reason?.trim()) return;
    setSaving(true); setData(null);
    try {
      const bodyLabels = mode === "item" ? labels : undefined;
      const body: any = { mode, regenerate: true, reason: reason.trim() };
      if (count) body.count = Number(count);
      if (note !== undefined) body.tag_notes = note;
      if (bodyLabels) body.labels = bodyLabels;
      await api.post(`/entries/${params.id}/tag`, body).then(res => {
        setData(res.data);
        setNote(res.data.entry.tag_notes || "");
        setLabels({});
      });
    } finally { setSaving(false); }
  };

  const switchMode = (m: string) => {
    if (m === mode) return;
    setMode(m); setData(null);
    // Stickers mode defaults its count to the order's total quantity; the API handles that when
    // count is omitted, so we drop the (possibly stale) URL count on any manual mode switch.
    setCount(null);
    load(m, null, note || undefined);
  };
  const MODE_LABELS: Record<string, string> = { order: "Per order", stickers: "Stickers", item: "Per garment" };
  const dims = {
    thermal: { w: 260, qr: 90, font: 11, label: "Thermal" },
    compact: { w: 210, qr: 74, font: 10, label: "Compact" },
    a4: { w: 300, qr: 102, font: 12, label: "A4" },
  }[labelSize];

  return (
    <ProtectedLayout>
      <style>{PRINT_CSS}</style>
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h2 style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 800 }}>Print Tag</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={regenerateTags}
            disabled={!data || saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-secondary)", fontWeight: 700, cursor: data && !saving ? "pointer" : "not-allowed" }}
          >
            <RefreshCw size={16} /> Regenerate
          </button>
          <button
            onClick={() => window.print()}
            disabled={!data}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8, border: "none", background: "var(--accent-primary)", color: "#0b1830", fontWeight: 700, cursor: data ? "pointer" : "not-allowed" }}
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["order", "stickers", "item"].map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: m === mode ? "default" : "pointer",
              border: m === mode ? "none" : "1px solid var(--border-hard)",
              background: m === mode ? "var(--accent-primary)" : "var(--bg-input)",
              color: m === mode ? "#0b1830" : "var(--text-secondary)",
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
        <select
          value={labelSize}
          onChange={(e) => setLabelSize(e.target.value as any)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-hard)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, fontWeight: 700 }}
        >
          <option value="thermal">Thermal label</option>
          <option value="compact">Compact label</option>
          <option value="a4">A4 sheet</option>
        </select>
      </div>

      {!data && <div className="no-print" style={{ color: "var(--text-muted)" }}>Loading…</div>}

      {data && (
        <>
          <div className="no-print" style={{ maxWidth: 480, marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
              Tag note (printed on every tag)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. red border saree, stain on sleeve"
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--bg-input)", color: "var(--text-primary)", resize: "vertical" }}
            />
            <button
              onClick={saveNote}
              disabled={saving}
              style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card-solid)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}
            >
              {saving ? "Saving…" : "Save note"}
            </button>
          </div>

          {mode === "item" && (
            <div className="no-print" style={{ maxWidth: 620, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>Per-garment labels</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
                {data.tags.map(tag => (
                  <label key={tag.token} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                    {tag.label.split(" - ")[0]}
                    <input
                      value={labels[tag.token] || ""}
                      onChange={e => setLabels(prev => ({ ...prev, [tag.token]: e.target.value }))}
                      placeholder="e.g. red border"
                      style={{ padding: "8px 10px", border: "1px solid var(--border-hard)", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-primary)" }}
                    />
                  </label>
                ))}
              </div>
              <button onClick={saveLabels} disabled={saving} style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card-solid)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save labels"}
              </button>
            </div>
          )}

          <div id="tag-print-area" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {data.tags.map((tag, i) => (
              <div
                key={i}
                style={{
                  width: dims.w,
                  border: "1.5px solid #000",
                  borderRadius: 6,
                  padding: 10,
                  display: "flex",
                  gap: 10,
                  breakInside: "avoid",
                  fontFamily: "system-ui, sans-serif",
                  color: "#000",
                  background: "#fff",
                }}
              >
                <img src={tag.qr_data_url} alt="QR" width={dims.qr} height={dims.qr} />
                <div style={{ fontSize: dims.font, lineHeight: 1.4, overflow: "hidden" }}>
                  <div style={{ fontWeight: 700, fontSize: dims.font + 1 }}>{data.customer.name}</div>
                  {data.customer.phone && <div>{data.customer.phone}</div>}
                  {(data.customer.flat_number || data.customer.society_name) && (
                    <div>{[data.customer.flat_number, data.customer.society_name].filter(Boolean).join(", ")}</div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    {data.entry.items.map((it, j) => (
                      <div key={j}>{it.service_name} ×{it.quantity}</div>
                    ))}
                  </div>
                  <div style={{ marginTop: 4 }}>Entry: {data.entry.entry_date}</div>
                  {data.entry.delivery_date && <div>Delivery: {data.entry.delivery_date}</div>}
                  {note && <div style={{ marginTop: 4, fontStyle: "italic" }}>{note}</div>}
                  <div style={{ marginTop: 4, fontWeight: 700 }}>{tag.label}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ProtectedLayout>
  );
}
