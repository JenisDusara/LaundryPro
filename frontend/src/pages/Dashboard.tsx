import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ClipboardList, IndianRupee, PlusCircle, Truck, Clock } from "lucide-react";
import api from "../api/client";
import type { LaundryEntry, Customer } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [todayEntries, setTodayEntries] = useState<LaundryEntry[]>([]);
  const [monthEntries, setMonthEntries] = useState<LaundryEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    Promise.all([
      api.get("/entries", { params: { entry_date: today } }),
      api.get("/entries", { params: { month, year } }),
      api.get("/customers"),
    ]).then(([t, m, c]) => {
      setTodayEntries(t.data);
      setMonthEntries(m.data);
      setCustomers(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const todayTotal = todayEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const monthTotal = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const pendingCount = todayEntries.filter(e => e.delivery_status === "pending").length;

  if (loading) return <p style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>Loading...</p>;

  return (
    <div>
      <h2 style={s.title}>Dashboard</h2>
      <p style={s.date}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>

      {/* Stats */}
      <div style={s.statsGrid}>
        <div style={{ ...s.statCard, borderLeft: "4px solid #1e40af" }}>
          <IndianRupee size={20} color="#1e40af" />
          <div>
            <div style={s.statValue}>₹{todayTotal}</div>
            <div style={s.statLabel}>Today's Earning</div>
          </div>
        </div>
        <div style={{ ...s.statCard, borderLeft: "4px solid #059669" }}>
          <IndianRupee size={20} color="#059669" />
          <div>
            <div style={s.statValue}>₹{monthTotal}</div>
            <div style={s.statLabel}>This Month</div>
          </div>
        </div>
        <div style={{ ...s.statCard, borderLeft: "4px solid #7c3aed" }}>
          <Users size={20} color="#7c3aed" />
          <div>
            <div style={s.statValue}>{customers.length}</div>
            <div style={s.statLabel}>Customers</div>
          </div>
        </div>
        <div style={{ ...s.statCard, borderLeft: "4px solid #d97706" }}>
          <Clock size={20} color="#d97706" />
          <div>
            <div style={s.statValue}>{pendingCount}</div>
            <div style={s.statLabel}>Pending Delivery</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Quick Actions</h3>
        <div style={s.actionGrid}>
          <div style={s.actionCard} onClick={() => navigate("/new-entry")}>
            <PlusCircle size={24} color="#1e40af" />
            <span>New Entry</span>
          </div>
          <div style={s.actionCard} onClick={() => navigate("/customers")}>
            <Users size={24} color="#7c3aed" />
            <span>Customers</span>
          </div>
          <div style={s.actionCard} onClick={() => navigate("/entries")}>
            <ClipboardList size={24} color="#059669" />
            <span>View Entries</span>
          </div>
          <div style={s.actionCard} onClick={() => navigate("/entries")}>
            <Truck size={24} color="#d97706" />
            <span>Deliveries</span>
          </div>
        </div>
      </div>

      {/* Today's Entries */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Today's Entries ({todayEntries.length})</h3>
        {todayEntries.length === 0 && <p style={{ color: "#94a3b8", fontSize: 14 }}>No entries today</p>}
        {todayEntries.slice(0, 5).map(entry => (
          <div key={entry.id} style={s.entryRow}>
            <div>
              <div style={s.entryName}>{entry.customer?.name}</div>
              <div style={s.entryItems}>{entry.items.map(i => `${i.service_name} ×${i.quantity}`).join(", ")}</div>
            </div>
            <div style={s.entryAmount}>₹{entry.total_amount}</div>
          </div>
        ))}
        {todayEntries.length > 5 && (
          <div style={s.viewAll} onClick={() => navigate("/entries")}>View all →</div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  title: { color: "#1e3a8a", margin: 0 },
  date: { color: "#64748b", fontSize: 14, marginBottom: 20 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  statValue: { fontSize: 20, fontWeight: 700, color: "#1e293b" },
  statLabel: { fontSize: 12, color: "#64748b" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, color: "#1e293b", marginBottom: 12 },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 },
  actionCard: { background: "#fff", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontSize: 13, fontWeight: 500, color: "#475569", transition: "transform 0.15s" },
  entryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: 8, padding: "10px 14px", marginBottom: 6, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
  entryName: { fontWeight: 600, fontSize: 14, color: "#1e293b" },
  entryItems: { fontSize: 12, color: "#64748b", marginTop: 2 },
  entryAmount: { fontWeight: 700, fontSize: 15, color: "#1e3a8a" },
  viewAll: { textAlign: "center", color: "#3b82f6", fontSize: 13, cursor: "pointer", padding: 8 },
};