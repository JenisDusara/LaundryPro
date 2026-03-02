import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import api from "../api/client";

interface LabourType { id: string; name: string; }
interface WorkEntry {
  id: string; labour_id: string; labour_name: string;
  work_date: string; press_count: number; rate_per_piece: number; total: number;
}

export default function Labour() {
  const [labours, setLabours] = useState<LabourType[]>([]);
  const [works, setWorks] = useState<WorkEntry[]>([]);
  const [monthVal, setMonthVal] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [showLabourForm, setShowLabourForm] = useState(false);
  const [labourName, setLabourName] = useState("");
  const [editLabourId, setEditLabourId] = useState<string | null>(null);
  const [workForm, setWorkForm] = useState({
    labour_id: "", work_date: new Date().toISOString().split("T")[0],
    press_count: "", rate_per_piece: "2",
  });
  const [workMsg, setWorkMsg] = useState("");

  const loadLabours = async () => {
    const res = await api.get("/labour/");
    setLabours(res.data);
  };

  const loadWork = async () => {
    const [y, m] = monthVal.split("-");
    const res = await api.get("/labour/work", { params: { month: parseInt(m), year: parseInt(y) } });
    setWorks(res.data);
  };

  useEffect(() => { loadLabours(); }, []);
  useEffect(() => { loadWork(); }, [monthVal]);

  const saveLabour = async () => {
    if (!labourName.trim()) return;
    if (editLabourId) {
      await api.put(`/labour/${editLabourId}`, { name: labourName });
    } else {
      await api.post("/labour/", { name: labourName });
    }
    setLabourName(""); setEditLabourId(null); setShowLabourForm(false);
    loadLabours();
  };

  const deleteLabour = async (id: string) => {
    if (!confirm("Remove this labour?")) return;
    await api.delete(`/labour/${id}`);
    loadLabours();
  };

  const saveWork = async () => {
    if (!workForm.labour_id || !workForm.press_count) return;
    try {
      await api.post("/labour/work", {
        labour_id: workForm.labour_id,
        work_date: workForm.work_date,
        press_count: parseInt(workForm.press_count),
        rate_per_piece: parseFloat(workForm.rate_per_piece),
      });
      setWorkMsg("✅ Saved!");
      setWorkForm(f => ({ ...f, press_count: "" }));
      setTimeout(() => setWorkMsg(""), 2000);
      loadWork();
    } catch (e: any) {
      setWorkMsg("❌ " + (e.response?.data?.detail || e.message));
    }
  };

  const deleteWork = async (id: string) => {
    await api.delete(`/labour/work/${id}`);
    loadWork();
  };

  const summary = labours.map(l => {
    const lWorks = works.filter(w => w.labour_id === l.id);
    const totalPress = lWorks.reduce((acc, w) => acc + w.press_count, 0);
    const totalPay = lWorks.reduce((acc, w) => acc + w.total, 0);
    return { ...l, totalPress, totalPay, works: lWorks };
  });

  return (
    <div>
      <h2 style={{ color: "#1e3a8a", marginBottom: 4 }}>Labour Management</h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Track daily press work & monthly payment</p>

      {/* Labour List */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>👷 Labour Members</h3>
          <button style={s.addBtn} onClick={() => { setShowLabourForm(true); setEditLabourId(null); setLabourName(""); }}>
            <Plus size={16} /> Add Labour
          </button>
        </div>
        <div style={s.labourGrid}>
          {labours.length === 0 && <p style={{ color: "#94a3b8", fontSize: 14 }}>No labour added yet</p>}
          {labours.map((l, i) => (
            <div key={l.id} style={{ ...s.labourCard, borderLeft: `4px solid ${i === 0 ? "#3b82f6" : "#10b981"}` }}>
              <div style={s.labourAvatar}>{l.name[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Active</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={s.iconBtn} onClick={() => { setEditLabourId(l.id); setLabourName(l.name); setShowLabourForm(true); }}>
                  <Edit2 size={14} color="#3b82f6" />
                </button>
                <button style={s.iconBtn} onClick={() => deleteLabour(l.id)}>
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Work Entry */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>📋 Add Daily Work</h3>
        <div style={s.workForm}>
          <div style={s.formRow}>
            <div style={s.formGroup}>
              <label style={s.label}>Labour</label>
              <select style={s.input} value={workForm.labour_id} onChange={e => setWorkForm(f => ({ ...f, labour_id: e.target.value }))}>
                <option value="">Select Labour</option>
                {labours.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Date</label>
              <input type="date" style={s.input} value={workForm.work_date}
                onChange={e => setWorkForm(f => ({ ...f, work_date: e.target.value }))} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Press Count</label>
              <input type="number" style={s.input} placeholder="0" min={0} value={workForm.press_count}
                onChange={e => setWorkForm(f => ({ ...f, press_count: e.target.value }))} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Rate (₹/piece)</label>
              <input type="number" style={s.input} value={workForm.rate_per_piece}
                onChange={e => setWorkForm(f => ({ ...f, rate_per_piece: e.target.value }))} />
            </div>
          </div>
          {workForm.press_count && workForm.rate_per_piece && (
            <div style={s.calcPreview}>
              💰 {workForm.press_count} × ₹{workForm.rate_per_piece} = <strong>₹{(parseInt(workForm.press_count) * parseFloat(workForm.rate_per_piece)).toFixed(0)}</strong>
            </div>
          )}
          {workMsg && <div style={s.successMsg}>{workMsg}</div>}
          <button style={s.saveBtn} onClick={saveWork} disabled={!workForm.labour_id || !workForm.press_count}>
            💾 Save Entry
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <h3 style={s.sectionTitle}>📊 Monthly Summary</h3>
          <input type="month" style={s.monthInput} value={monthVal} onChange={e => setMonthVal(e.target.value)} />
        </div>
        <div style={s.summaryGrid}>
          {summary.map((l, i) => (
            <div key={l.id} style={s.summaryCard}>
              <div style={s.summaryHeader}>
                <div style={{ ...s.labourAvatar, background: i === 0 ? "#eff6ff" : "#f0fdf4", color: i === 0 ? "#3b82f6" : "#10b981" }}>{l.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Monthly Summary</div>
                </div>
              </div>
              <div style={s.summaryStats}>
                <div style={s.statBox}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1e3a8a" }}>{l.totalPress}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Total Press</div>
                </div>
                <div style={s.statBox}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>₹{l.totalPay.toFixed(0)}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Total Pay</div>
                </div>
              </div>
              {l.works.length > 0 && (
                <div style={s.dayList}>
                  <div style={s.dayHeader}>
                    <span>Date</span><span>Count</span><span>Rate</span><span>Amount</span><span></span>
                  </div>
                  {[...l.works].sort((a, b) => a.work_date.localeCompare(b.work_date)).map(w => (
                    <div key={w.id} style={s.dayRow}>
                      <span>{new Date(w.work_date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      <span style={{ fontWeight: 600 }}>{w.press_count}</span>
                      <span style={{ color: "#64748b" }}>₹{w.rate_per_piece}</span>
                      <span style={{ fontWeight: 700, color: "#059669" }}>₹{w.total.toFixed(0)}</span>
                      <Trash2 size={13} color="#ef4444" style={{ cursor: "pointer" }} onClick={() => deleteWork(w.id)} />
                    </div>
                  ))}
                </div>
              )}
              {l.works.length === 0 && <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No entries this month</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Labour Form Modal */}
      {showLabourForm && (
        <div style={s.overlay} onClick={() => setShowLabourForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h3 style={{ margin: 0, color: "#1e3a8a" }}>{editLabourId ? "Edit" : "Add"} Labour</h3>
              <X size={20} style={{ cursor: "pointer" }} onClick={() => setShowLabourForm(false)} />
            </div>
            <label style={s.label}>Name</label>
            <input style={s.input} placeholder="Labour name" value={labourName}
              onChange={e => setLabourName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveLabour()} />
            <button style={s.saveBtn} onClick={saveLabour} disabled={!labourName.trim()}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  section: { marginBottom: 28 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: "#1e293b", margin: 0, fontSize: 16, fontWeight: 700 },
  addBtn: { display: "flex", alignItems: "center", gap: 6, background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  labourGrid: { display: "flex", gap: 12, flexWrap: "wrap" },
  labourCard: { background: "#fff", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minWidth: 200 },
  labourAvatar: { width: 38, height: 38, borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 },
  iconBtn: { width: 28, height: 28, border: "none", borderRadius: 6, background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  workForm: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  formRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  formGroup: { flex: 1, minWidth: 140 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  calcPreview: { margin: "12px 0 8px", padding: "8px 14px", background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: "#15803d" },
  successMsg: { padding: "8px 14px", background: "#f0fdf4", color: "#16a34a", borderRadius: 8, fontSize: 13, marginBottom: 8 },
  saveBtn: { marginTop: 12, padding: "10px 20px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  monthInput: { padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 },
  summaryCard: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  summaryHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  summaryStats: { display: "flex", gap: 12, marginBottom: 16 },
  statBox: { flex: 1, background: "#f8fafc", borderRadius: 10, padding: "12px 16px", textAlign: "center" as const },
  dayList: { borderTop: "1px solid #f1f5f9", paddingTop: 12 },
  dayHeader: { display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, marginBottom: 6, padding: "0 4px" },
  dayRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 4px", borderBottom: "1px solid #f8fafc", fontSize: 13 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modal: { background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 360 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
};