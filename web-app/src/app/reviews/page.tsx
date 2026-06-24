"use client";
import { useState, useEffect } from "react";
import { Star, Trash2, Plus, X, Check, MessageCircle } from "lucide-react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";

const WHATSAPP_MSG = encodeURIComponent("Hi! Thank you for using LaundryPro 🙏\n\nWe'd love to hear your feedback.\nPlease rate our service:\n⭐ 1-5 stars\n\nYour review helps us improve!");

interface Review {
  id: string;
  customer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer: { name: string; phone: string };
}

const DEMO_REVIEWS: Review[] = [
  { id: "d1", customer_id: "c1", rating: 5, comment: "Bahut badhiya service hai! Kapde bilkul saaf aate hain aur time pe delivery milti hai. Main bahut khush hoon.", created_at: "2026-06-18T09:30:00Z", customer: { name: "Sunita Verma", phone: "9988776655" } },
  { id: "d2", customer_id: "c2", rating: 5, comment: "Excellent quality! Shirt aur suit dono perfect ironing ke saath wapas aaye. Highly recommended!", created_at: "2026-06-17T14:00:00Z", customer: { name: "Rajesh Sharma", phone: "9876543210" } },
  { id: "d3", customer_id: "c3", rating: 4, comment: "Achhi service hai. Saree ka kaam zabardast kiya inhone. Thoda time jyada laga lekin quality achhi thi.", created_at: "2026-06-16T11:20:00Z", customer: { name: "Priya Patel", phone: "9765432109" } },
  { id: "d4", customer_id: "c4", rating: 5, comment: "Best laundry in the area! Uniform bilkul crisp milti hai. Office ke liye perfect. Keep it up!", created_at: "2026-06-15T16:45:00Z", customer: { name: "Amit Joshi", phone: "9654321098" } },
  { id: "d5", customer_id: "c5", rating: 4, comment: "Kapde saaf aate hain aur packaging bhi achhi hai. Stain removal ka kaam bhi achha kiya. Shukriya!", created_at: "2026-06-14T10:10:00Z", customer: { name: "Meena Gupta", phone: "9543210987" } },
  { id: "d6", customer_id: "c6", rating: 5, comment: "Mere wedding ke kapde itne sundar press karke diye! Bilkul nayi jaisi condition. Bahut dhanyawad!", created_at: "2026-06-13T13:30:00Z", customer: { name: "Vikram Singh", phone: "9432109876" } },
  { id: "d7", customer_id: "c7", rating: 3, comment: "Theek hai service. Ek baar kapde thode late aaye the lekin quality mein koi problem nahi thi.", created_at: "2026-06-12T09:00:00Z", customer: { name: "Kavita Reddy", phone: "9321098765" } },
  { id: "d8", customer_id: "c8", rating: 5, comment: "Superb! Bachon ke school uniform aur meri office shirts sab ek saath handle karte hain. Very professional.", created_at: "2026-06-11T15:20:00Z", customer: { name: "Suresh Nair", phone: "9210987654" } },
];

const DEMO_CUSTOMERS = [
  { id: "c1", name: "Sunita Verma",  phone: "9988776655" },
  { id: "c2", name: "Rajesh Sharma", phone: "9876543210" },
  { id: "c3", name: "Priya Patel",   phone: "9765432109" },
  { id: "c4", name: "Amit Joshi",    phone: "9654321098" },
  { id: "c5", name: "Meena Gupta",   phone: "9543210987" },
  { id: "c6", name: "Vikram Singh",  phone: "9432109876" },
  { id: "c7", name: "Kavita Reddy",  phone: "9321098765" },
  { id: "c8", name: "Suresh Nair",   phone: "9210987654" },
];

export default function ReviewsPage() {
  const { isAuth } = useAuth();
  const [reviews,  setReviews]  = useState<Review[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ customer_id: "", rating: 5, comment: "" });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { setReviews(DEMO_REVIEWS); setLoading(false); }, []);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3000); };

  const save = () => {
    if (!form.customer_id) { flash("Select a customer", false); return; }
    setSaving(true);
    const cust = DEMO_CUSTOMERS.find(c => c.id === form.customer_id)!;
    const newReview: Review = {
      id: "new_" + Date.now(),
      customer_id: form.customer_id,
      rating: form.rating,
      comment: form.comment,
      created_at: new Date().toISOString(),
      customer: { name: cust.name, phone: cust.phone },
    };
    setReviews(rs => [newReview, ...rs]);
    flash("Review saved!", true);
    setShowForm(false);
    setForm({ customer_id: "", rating: 5, comment: "" });
    setSaving(false);
  };

  const del = (id: string) => {
    setReviews(rs => rs.filter(r => r.id !== id));
    flash("Deleted", true);
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—";
  const starCounts = [5,4,3,2,1].map(s => ({ star: s, count: reviews.filter(r => r.rating === s).length }));

  const StarRow = ({ rating, size = 16 }: { rating: number; size?: number }) => (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} fill={s <= rating ? "#f59e0b" : "none"} color={s <= rating ? "#f59e0b" : "#d1d5db"} />
      ))}
    </div>
  );

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" };

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#78350f,#d97706,#f59e0b)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={24} fill="#fff" color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Customer Reviews</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {reviews.length} reviews · Avg {avgRating} ⭐
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isAuth && (
            <button onClick={() => setShowForm(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 11, border: "none", background: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              <Plus size={15} /> Add Review
            </button>
          )}
        </div>
      </div>

      {msg && <div style={{ padding: "11px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626" }}>{msg.text}</div>}

      {/* Stats + breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: "24px 28px", border: "1.5px solid #e2e8f0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 140 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#f59e0b", lineHeight: 1 }}>{avgRating}</div>
          <StarRow rating={Math.round(Number(avgRating))} size={18} />
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{reviews.length} reviews</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          {starCounts.map(({ star, count }) => (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 24, fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "right" }}>{star}⭐</div>
              <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#f59e0b", borderRadius: 4, width: reviews.length ? `${Math.round((count / reviews.length) * 100)}%` : "0%" }} />
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", width: 24 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add review form */}
      {isAuth && showForm && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Add Customer Review</div>
            <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 6, cursor: "pointer" }}><X size={15} color="#64748b" /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Customer *</div>
              <select style={inp} value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">Select customer…</option>
                {DEMO_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Rating *</div>
              <div style={{ display: "flex", gap: 6, paddingTop: 8 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, rating: s }))}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <Star size={28} fill={s <= form.rating ? "#f59e0b" : "none"} color={s <= form.rating ? "#f59e0b" : "#d1d5db"} />
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Customer's Feedback</div>
              <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="What did the customer say?" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#64748b" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ flex: 2, padding: 10, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#78350f,#d97706)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} />{saving ? "Saving…" : "Save Review"}
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp request tip */}
      <div style={{ background: "linear-gradient(135deg,#064e3b,#059669)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <MessageCircle size={22} color="#fff" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Request review via WhatsApp</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Click a customer's WhatsApp button below to send them a review request message</div>
        </div>
      </div>

      {/* Reviews list */}
      <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
        {loading ? (
          <div style={{ padding: "50px 20px", textAlign: "center", color: "#94a3b8" }}>Loading…</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <Star size={48} style={{ margin: "0 auto 14px", display: "block", color: "#fcd34d", opacity: 0.3 }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>No reviews yet</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Add a review after a customer gives feedback</div>
          </div>
        ) : (
          reviews.map((r, i) => (
            <div key={r.id} style={{ padding: "18px 22px", borderBottom: i < reviews.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", gap: 14, flex: 1 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: "linear-gradient(135deg,#f59e0b,#fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                    {r.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{r.customer.name}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.customer.phone}</span>
                    </div>
                    <StarRow rating={r.rating} />
                    {r.comment && <p style={{ fontSize: 14, color: "#475569", marginTop: 8, lineHeight: 1.6 }}>"{r.comment}"</p>}
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <a href={`https://wa.me/91${r.customer.phone.replace(/\D/g,"")}?text=${WHATSAPP_MSG}`} target="_blank" rel="noreferrer"
                    style={{ width: 32, height: 32, background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 15 }}>
                    💬
                  </a>
                  {isAuth && (
                    <button onClick={() => del(r.id)} style={{ width: 32, height: 32, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} color="#dc2626" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ProtectedLayout>
  );
}
