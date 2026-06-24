"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, Search, User, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CUSTOMERS, DEMO_SERVICES_FLAT } from "@/lib/demo-data";
import type { Customer, Service } from "@/types";

interface LineItem { service_id: string; service_name: string; quantity: number; price: number; }

export default function NewEntryPage() {
  const router = useRouter();
  const { isAuth } = useAuth();
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [services,  setServices]      = useState<Service[]>([]);
  const [query,     setQuery]         = useState("");
  const [customer,  setCustomer]      = useState<Customer | null>(null);
  const [showDrop,  setShowDrop]      = useState(false);
  const [items,     setItems]         = useState<LineItem[]>([]);
  const [date,      setDate]          = useState(new Date().toISOString().slice(0, 10));
  const [notes,     setNotes]         = useState("");
  const [saving,    setSaving]        = useState(false);
  const [msg,       setMsg]           = useState<{ text: string; ok: boolean } | null>(null);
  const [showSvc,   setShowSvc]       = useState(false);
  const [svcSearch, setSvcSearch]     = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomers(DEMO_CUSTOMERS as unknown as Customer[]);
    setServices(DEMO_SERVICES_FLAT.filter(s => s.price) as unknown as Service[]);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const flash = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
  );

  const selectCustomer = (c: Customer) => { setCustomer(c); setQuery(c.name); setShowDrop(false); };

  const filteredServices = services.filter(s => s.name.toLowerCase().includes(svcSearch.toLowerCase()));

  const addItem = (svc: Service) => {
    const existing = items.findIndex(it => it.service_id === svc.id);
    if (existing >= 0) { setItems(prev => prev.map((it, i) => i === existing ? { ...it, quantity: it.quantity + 1 } : it)); }
    else { setItems(prev => [...prev, { service_id: svc.id, service_name: svc.name, quantity: 1, price: Number(svc.price) || 0 }]); }
    setShowSvc(false); setSvcSearch("");
  };

  const updateItem = (index: number, field: "quantity" | "price", value: number) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const total = items.reduce((s, it) => s + it.quantity * it.price, 0);

  const submit = async () => {
    if (!customer) { flash("Please select a customer", false); return; }
    if (items.length === 0) { flash("Add at least one item", false); return; }
    setSaving(true);
    try {
      await api.post("/entries", { customer_id: customer.id, entry_date: date, notes, items: items.map(it => ({ service_id: it.service_id, quantity: it.quantity, price: it.price })) });
      flash("Entry created!", true);
      setTimeout(() => router.push("/entries"), 1200);
    } catch (e: any) { flash(e.response?.data?.detail || "Error saving entry", false); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#f8fafc" };

  return (
    <ProtectedLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ animation: "fadeUp 0.3s ease both", background: "linear-gradient(135deg,#1e3a8a,#2563eb)", borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={24} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 20 }}>New Laundry Entry</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>Create a new order</div></div>
        </div>
      </div>

      {msg && <div style={{ padding: "12px 16px", borderRadius: 12, marginBottom: 16, fontSize: 13, fontWeight: 600, background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626", border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}` }}>{msg.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Left: Customer + Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Customer picker */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}><User size={16} color="#2563eb" /> Customer</div>
            <div ref={dropRef} style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input style={{ ...inp, paddingLeft: 36 }} value={query} onChange={e => { setQuery(e.target.value); setShowDrop(true); setCustomer(null); }} onFocus={() => setShowDrop(true)} placeholder="Search by name or phone…" />
              </div>
              {showDrop && filteredCustomers.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, zIndex: 50, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", animation: "slideDown 0.18s ease both" }}>
                  {filteredCustomers.map(c => (
                    <div key={c.id} onClick={() => selectCustomer(c)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f9ff")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 10 }}>
                        <span><Phone size={9} style={{ display: "inline", marginRight: 3 }} />{c.phone}</span>
                        {c.address && <span>· {c.address}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {customer && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>{customer.name.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{customer.name}</div>
                  <div style={{ fontSize: 11, color: "#3b82f6" }}>{customer.phone}</div>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Items ({items.length})</div>
              {isAuth && (
                <button onClick={() => setShowSvc(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 9, background: "linear-gradient(135deg,#1e3a8a,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  <Plus size={13} /> Add Item {showSvc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>

            {showSvc && (
              <div style={{ marginBottom: 14, background: "#f8fafc", borderRadius: 12, padding: 14, border: "1px solid #e2e8f0", animation: "slideDown 0.18s ease both" }}>
                <input style={{ ...inp, marginBottom: 10 }} placeholder="Search service…" value={svcSearch} onChange={e => setSvcSearch(e.target.value)} autoFocus />
                <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {filteredServices.map(s => (
                    <button key={s.id} onClick={() => addItem(s)} style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#0f172a" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                      {s.name} {s.price ? `(₹${Number(s.price).toFixed(0)})` : ""}
                    </button>
                  ))}
                  {filteredServices.length === 0 && <div style={{ color: "#94a3b8", fontSize: 12 }}>No services found</div>}
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#94a3b8" }}>
                <Plus size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.2 }} />
                <div style={{ fontSize: 13 }}>No items yet. Click Add Item above.</div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0fr", gap: 8, marginBottom: 8 }}>
                  {["Service", "Qty", "Price (₹)", ""].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</div>)}
                </div>
                {items.map((it, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", padding: "9px 0" }}>{it.service_name}</div>
                    <input type="number" min={1} style={{ ...inp, textAlign: "center", padding: "8px 6px" }} value={it.quantity} onChange={e => updateItem(i, "quantity", Math.max(1, parseInt(e.target.value) || 1))} />
                    <input type="number" min={0} step={0.5} style={{ ...inp, textAlign: "right", padding: "8px 10px" }} value={it.price} onChange={e => updateItem(i, "price", parseFloat(e.target.value) || 0)} />
                    {isAuth && <button onClick={() => removeItem(i)} style={{ width: 30, height: 30, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={12} color="#dc2626" /></button>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: Summary + Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1.5px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Order Details</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Entry Date</div>
              <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5 }}>Notes</div>
              <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions…" />
            </div>
          </div>

          {/* Bill summary */}
          <div style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)", borderRadius: 16, padding: 20, color: "#fff" }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, opacity: 0.9 }}>Bill Summary</div>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ opacity: 0.85 }}>{it.service_name} × {it.quantity}</span>
                <span style={{ fontWeight: 700 }}>₹{(it.quantity * it.price).toFixed(2)}</span>
              </div>
            ))}
            {items.length > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "12px 0" }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 24 }}>₹{total.toFixed(2)}</span>
            </div>
            {isAuth && (
              <button onClick={submit} disabled={saving || !customer || items.length === 0} style={{ marginTop: 18, width: "100%", padding: "13px 0", border: "none", borderRadius: 12, background: saving || !customer || items.length === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.95)", color: saving || !customer || items.length === 0 ? "rgba(255,255,255,0.5)" : "#1e3a8a", fontWeight: 800, fontSize: 15, cursor: saving || !customer || items.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                <Check size={17} />{saving ? "Saving…" : "Create Entry"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
