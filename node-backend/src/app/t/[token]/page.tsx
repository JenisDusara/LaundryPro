"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, MapPin, Phone, User, Shirt } from "lucide-react";
import api from "@/lib/api";

type ScanData = {
  expired: boolean;
  entry_id?: string;
  entry_date?: string;
  delivery_date?: string | null;
  delivery_status?: string;
  tag_status?: string;
  tag_notes?: string;
  notes?: string;
  delivered_at?: string;
  scanned_garment?: { seq: number; service_name: string; quantity: number } | null;
  customer?: { name: string; phone: string; flat_number: string; society_name: string; address: string };
  items?: { service_name: string; quantity: number; item_status: string }[];
  events?: { action: string; status: string; detail: string; username: string; created_at: string }[];
};

const STATUSES: { key: string; label: string }[] = [
  { key: "collected", label: "Collected" },
  { key: "in_process", label: "In process" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
  { key: "issue", label: "Issue" },
];

const card: React.CSSProperties = {
  background: "var(--bg-card-solid)",
  borderRadius: 14,
  padding: 20,
  boxShadow: "var(--shadow-web-lift)",
  border: "1px solid var(--border-hard)",
};

export default function ScanPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [data, setData] = useState<ScanData | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchTag = () =>
    api.get(`/tags/${token}`, { noCache: true } as any)
      .then(res => {
        sessionStorage.removeItem("post_login_redirect");
        setData(res.data);
        setState("ok");
      })
      .catch(err => {
        if (err.response?.status === 404) setState("notfound");
        else if (err.response?.status !== 401) setState("error");
        // 401 is handled globally (redirect to /login); post_login_redirect is already set.
      });

  useEffect(() => {
    // Set BEFORE the request — covers both "never logged in" (redirect below) and "session
    // expired mid-request" (the global 401 interceptor in src/lib/api.ts redirects to /login),
    // so either path lands the staff member back on this exact tag after they sign in.
    sessionStorage.setItem("post_login_redirect", `/t/${token}`);
    if (!localStorage.getItem("token")) { router.replace("/login"); return; }
    fetchTag();
  }, [token, router]);

  const setStatus = async (status: string) => {
    setUpdating(true);
    try {
      await api.patch(`/tags/${token}?status=${status}`);
      await fetchTag();
    } catch { /* leave current view; a failed update just doesn't change state */ }
    finally { setUpdating(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", padding: 16, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, paddingTop: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, textAlign: "center" }}>
          Order Tag
        </h1>

        {state === "loading" && (
          <div style={{ ...card, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
        )}

        {state === "notfound" && (
          <div style={{ ...card, textAlign: "center", color: "var(--grade-f-text)" }}>Tag not found.</div>
        )}

        {state === "error" && (
          <div style={{ ...card, textAlign: "center", color: "var(--grade-f-text)" }}>
            Something went wrong. Try again.
          </div>
        )}

        {state === "ok" && data?.expired && (
          <div style={{ ...card, textAlign: "center" }}>
            <Clock size={28} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
            <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Tag expired</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              This order was delivered
              {data.delivered_at ? ` on ${new Date(data.delivered_at).toLocaleString("en-IN")}` : ""} and the tag is no
              longer active.
            </div>
          </div>
        )}

        {state === "ok" && data && !data.expired && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.scanned_garment && (
              <div style={{ ...card, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, background: "var(--grade-b-bg)", borderColor: "var(--grade-b-border)" }}>
                <Shirt size={16} style={{ color: "var(--grade-b-text)" }} />
                <span style={{ fontWeight: 700, color: "var(--grade-b-text)" }}>
                  {data.scanned_garment.service_name} {data.scanned_garment.seq}/{data.scanned_garment.quantity}
                </span>
              </div>
            )}

            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <User size={16} style={{ color: "var(--accent-primary)" }} />
                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 16 }}>{data.customer?.name}</span>
              </div>
              {data.customer?.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "var(--text-secondary)", fontSize: 14 }}>
                  <Phone size={14} /> {data.customer.phone}
                </div>
              )}
              {(data.customer?.flat_number || data.customer?.society_name || data.customer?.address) && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}>
                  <MapPin size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>
                    {[data.customer?.flat_number, data.customer?.society_name, data.customer?.address].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                <span>Entry: {data.entry_date}</span>
                <span>Delivery: {data.delivery_date || "—"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.items?.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, color: "var(--text-primary)" }}>
                    <span>{it.service_name} × {it.quantity}</span>
                    {it.item_status === "delivered" && <Check size={14} style={{ color: "var(--grade-a-text)" }} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Status workflow — staff can advance the order right from the scan. */}
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Update status
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STATUSES.map(s => {
                  const active = data.tag_status === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setStatus(s.key)}
                      disabled={updating || active}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: active || updating ? "default" : "pointer",
                        border: active ? "none" : "1px solid var(--border-hard)",
                        background: active ? "var(--accent-primary)" : "var(--bg-input)",
                        color: active ? "#0b1830" : "var(--text-secondary)",
                        opacity: updating && !active ? 0.6 : 1,
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(data.tag_notes || data.notes) && (
              <div style={{ ...card, fontSize: 13, color: "var(--text-secondary)" }}>
                {data.tag_notes && <div><strong>Tag note:</strong> {data.tag_notes}</div>}
                {data.notes && <div style={{ marginTop: data.tag_notes ? 6 : 0 }}><strong>Order note:</strong> {data.notes}</div>}
              </div>
            )}

            {data.events && data.events.length > 0 && (
              <div style={{ ...card, fontSize: 12.5, color: "var(--text-secondary)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                  Recent tag activity
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {data.events.slice(0, 6).map((e, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span>
                        <strong>{e.action.replace("tag.", "")}</strong>
                        {e.status ? ` · ${e.status}` : ""}
                        {e.detail ? ` · ${e.detail}` : ""}
                        {e.username ? ` · ${e.username}` : ""}
                      </span>
                      <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
