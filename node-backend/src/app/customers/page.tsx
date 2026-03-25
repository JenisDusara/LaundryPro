"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, Mail, Phone, Home, Building2, MapPin, User } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { Customer } from "@/types";

const empty = { name: "", phone: "", flat_number: "", society_name: "", address: "", email: "" };
const curMonth = new Date().getMonth() + 1, curYear = new Date().getFullYear();
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const avatarColors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const getColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];
const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0",
  borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box",
  background: "#f8fafc", transition: "border-color 0.2s",
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState<Customer | null>(null);
  const [invoiceMonth, setInvoiceMonth] = useState(curMonth);
  const [invoiceYear, setInvoiceYear] = useState(curYear);
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState("");
  const [focusField, setFocusField] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const load = async (q = "") => {
    const res = await api.get("/customers", { params: q ? { search: q } : {} });
    setCustomers(res.data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (form.phone.length !== 10) { setPhoneError("Phone number must be exactly 10 digits"); return; }
    setLoading(true);
    try {
      if (editId) await api.put(`/customers/${editId}`, form);
      else await api.post("/customers", form);
      setShowForm(false); load(search);
    } catch (e: any) { alert(e.response?.data?.detail || "Error"); }
    finally { setLoading(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await api.delete(`/customers/${id}`); load(search);
  };

  const sendInvoice = async () => {
    if (!invoiceCustomer) return;
    setInvoiceSending(true); setInvoiceMsg("");
    try {
      await api.post(`/invoices/${invoiceCustomer.id}/email`, null, { params: { month: invoiceMonth, year: invoiceYear } });
      setInvoiceMsg("success");
    } catch (e: any) { setInvoiceMsg(e.response?.data?.detail || "Failed to send"); }
    finally { setInvoiceSending(false); }
  };

  const fields = [
    { key: "name", label: "Full Name", icon: <User size={15} />, required: true },
    { key: "phone", label: "Phone Number", icon: <Phone size={15} />, required: true },
    { key: "flat_number", label: "Flat Number", icon: <Home size={15} /> },
    { key: "society_name", label: "Society Name", icon: <Building2 size={15} /> },
    { key: "address", label: "Address", icon: <MapPin size={15} /> },
    { key: "email", label: "Email", icon: <Mail size={15} /> },
  ];

  return (
    <ProtectedLayout>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 4px 20px rgba(59,130,246,0.3)"
      }}>
        <div>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 700 }}>Customers</h2>
          <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
            {customers.length} total customers
          </p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditId(null); setShowForm(true); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.2)", color: "#fff",
            border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 10,
            padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            backdropFilter: "blur(4px)", transition: "all 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#fff", border: "1.5px solid #e2e8f0",
        borderRadius: 12, padding: "12px 16px", marginBottom: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
      }}>
        <Search size={18} color="#94a3b8" />
        <input
          style={{ border: "none", outline: "none", flex: 1, fontSize: 14, color: "#1e293b", background: "transparent" }}
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value); }}
        />
        {search && <X size={16} color="#94a3b8" style={{ cursor: "pointer" }} onClick={() => { setSearch(""); load(); }} />}
      </div>

      {/* Customer Cards */}
      {customers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>No customers found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {customers.map(c => {
            const color = getColor(c.name);
            return (
              <div key={c.id} style={{
                background: "#fff", borderRadius: 14, padding: 18,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9",
                transition: "all 0.2s", cursor: "default"
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, background: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 16, flexShrink: 0
                  }}>
                    {getInitials(c.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 6 }}>{c.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                        <Phone size={12} color="#94a3b8" /> {c.phone}
                      </div>
                      {c.flat_number && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                          <Home size={12} color="#94a3b8" /> {c.flat_number}
                          {c.society_name && `, ${c.society_name}`}
                        </div>
                      )}
                      {c.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                          <Mail size={12} color="#94a3b8" />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                  {c.email && (
                    <button
                      onClick={() => { setInvoiceCustomer(c); setInvoiceMsg(""); }}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "8px 0", background: "#f0fdf4", color: "#16a34a",
                        border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
                      }}
                    >
                      <Mail size={13} /> Invoice
                    </button>
                  )}
                  <button
                    onClick={() => { setForm({ name: c.name, phone: c.phone, flat_number: c.flat_number, society_name: c.society_name, address: c.address, email: c.email || "" }); setEditId(c.id); setShowForm(true); }}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 0", background: "#eff6ff", color: "#2563eb",
                      border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => del(c.id)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "8px 0", background: "#fff5f5", color: "#dc2626",
                      border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{editId ? "Edit" : "New"} Customer</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8" }}>{editId ? "Update customer details" : "Add a new customer"}</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    {f.icon} {f.label} {f.required && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      borderColor: f.key === "phone" && phoneError ? "#ef4444" : focusField === f.key ? "#3b82f6" : "#e2e8f0",
                      boxShadow: f.key === "phone" && phoneError ? "0 0 0 3px rgba(239,68,68,0.1)" : focusField === f.key ? "0 0 0 3px rgba(59,130,246,0.1)" : "none"
                    }}
                    placeholder={f.key === "phone" ? "10-digit number" : `Enter ${f.label.toLowerCase()}`}
                    value={(form as any)[f.key]}
                    inputMode={f.key === "phone" ? "numeric" : "text"}
                    maxLength={f.key === "phone" ? 10 : undefined}
                    onChange={e => {
                      if (f.key === "phone") {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setForm({ ...form, phone: val });
                        setPhoneError(val.length > 0 && val.length < 10 ? "Must be 10 digits" : "");
                      } else {
                        setForm({ ...form, [f.key]: e.target.value });
                      }
                    }}
                    onFocus={() => setFocusField(f.key)}
                    onBlur={() => setFocusField("")}
                  />
                  {f.key === "phone" && (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      {phoneError
                        ? <span style={{ fontSize: 11, color: "#ef4444" }}>{phoneError}</span>
                        : <span />
                      }
                      <span style={{ fontSize: 11, color: form.phone.length === 10 ? "#16a34a" : "#94a3b8" }}>
                        {form.phone.length}/10
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              style={{
                width: "100%", padding: "13px 0", marginTop: 20,
                background: !form.name || !form.phone ? "#e2e8f0" : "linear-gradient(135deg, #1e40af, #3b82f6)",
                color: !form.name || !form.phone ? "#94a3b8" : "#fff",
                border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: !form.name || !form.phone ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
              onClick={save}
              disabled={loading || !form.name || !form.phone}
            >
              {loading ? "Saving..." : editId ? "Update Customer" : "Add Customer"}
            </button>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceCustomer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, backdropFilter: "blur(4px)" }}
          onClick={() => setInvoiceCustomer(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>Send Invoice</h3>
              <button onClick={() => setInvoiceCustomer(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex" }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            {/* Customer Info */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
              <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{invoiceCustomer.name}</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{invoiceCustomer.email}</div>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Month</label>
                <select style={{ ...inputStyle }} value={invoiceMonth} onChange={e => setInvoiceMonth(Number(e.target.value))}>
                  {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div style={{ width: 100 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Year</label>
                <select style={{ ...inputStyle }} value={invoiceYear} onChange={e => setInvoiceYear(Number(e.target.value))}>
                  {[curYear - 1, curYear, curYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {invoiceMsg && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 500,
                background: invoiceMsg === "success" ? "#f0fdf4" : "#fff5f5",
                color: invoiceMsg === "success" ? "#16a34a" : "#dc2626",
                border: `1px solid ${invoiceMsg === "success" ? "#bbf7d0" : "#fecaca"}`
              }}>
                {invoiceMsg === "success" ? "✅ Invoice sent successfully!" : `❌ ${invoiceMsg}`}
              </div>
            )}

            <button
              style={{
                width: "100%", padding: "13px 0",
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: invoiceSending ? "not-allowed" : "pointer",
                opacity: invoiceSending ? 0.7 : 1
              }}
              onClick={sendInvoice}
              disabled={invoiceSending}
            >
              {invoiceSending ? "Sending..." : "📧 Send Invoice"}
            </button>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
