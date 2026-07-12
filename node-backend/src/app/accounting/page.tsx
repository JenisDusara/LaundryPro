"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, X, TrendingUp, TrendingDown, Wallet, Pencil, Check,
  CalendarDays, ChevronDown, ChevronRight, ChevronLeft, IndianRupee,
  Banknote, Smartphone, CreditCard
} from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import CollectionsChart from "@/components/CollectionsChart";
import type { Payment } from "@/types";

interface Expense { id: string; date: string; category: string; description: string; amount: number; }
interface EntryItem { service_name: string; quantity: number; subtotal: number; }
interface Entry { id: string; entry_date: string; total_amount: number; delivery_status: string; customer: { name: string; phone: string }; items: EntryItem[]; }
interface PaySummary { total: number; cash: number; upi: number; card: number; other: number; count: number; }

const METHOD_META: Record<string, { label: string; color: string; icon: typeof Banknote }> = {
  cash: { label: "Cash", color: "#16a34a", icon: Banknote },
  upi:  { label: "UPI",  color: "#2563eb", icon: Smartphone },
  card: { label: "Card", color: "#8b5cf6", icon: CreditCard },
  other:{ label: "Other",color: "#64748b", icon: Wallet },
};

const CATEGORIES = ["Rent","Electricity","Salary","Water","Supplies","Maintenance","Transport","Miscellaneous"];
const emptyForm = { date: "", category: CATEGORIES[0], description: "", amount: "" };
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CAT_COLORS: Record<string,string> = {
  Rent:"#6366f1", Electricity:"#f59e0b", Salary:"#10b981", Water:"#3b82f6",
  Supplies:"#8b5cf6", Maintenance:"#ef4444", Transport:"#f97316", Miscellaneous:"#64748b",
};

function MonthYearPicker({ month, year, onChange }: { month: number; year: number; onChange: (m: number, y: number) => void }) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openPicker = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setPickerYear(year);
    setOpen(v => !v);
  };

  const select = (m: number) => { onChange(m, pickerYear); setOpen(false); };

  const dropdown = open && rect && mounted ? (
    <div ref={dropRef} style={{
      position: "fixed",
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
      width: 264,
      background: "#fff",
      borderRadius: 18,
      boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      zIndex: 99999,
      overflow: "hidden",
      border: "1.5px solid #e2e8f0",
    }}>
      {/* Year row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "linear-gradient(135deg,#0f172a,#1e3a8a)" }}>
        <button onClick={() => setPickerYear(y => y - 1)}
          style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>{pickerYear}</span>
        <button onClick={() => setPickerYear(y => y + 1)}
          style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={16} />
        </button>
      </div>
      {/* Month grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5, padding: "12px 10px 14px" }}>
        {MONTH_SHORT.map((m, i) => {
          const isActive  = (i + 1) === month && pickerYear === year;
          const isCurrent = (i + 1) === new Date().getMonth() + 1 && pickerYear === new Date().getFullYear();
          return (
            <button key={i} onClick={() => select(i + 1)}
              style={{
                padding: "11px 4px", borderRadius: 11, cursor: "pointer",
                fontWeight: isActive ? 800 : 600, fontSize: 13,
                border: isCurrent && !isActive ? "1.5px solid #bfdbfe" : "1.5px solid transparent",
                background: isActive ? "linear-gradient(135deg,#1e3a8a,#2563eb)" : "transparent",
                color: isActive ? "#fff" : isCurrent ? "#1d4ed8" : "#374151",
                transition: "all 0.15s",
              }}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={btnRef} onClick={openPicker}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, border: "1.5px solid var(--border-hard,#e2e8f0)", background: "var(--bg-card,#fff)", color: "var(--text-primary,#0f172a)", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <CalendarDays size={15} color="#1d4ed8"/>
        {MONTH_SHORT[month - 1]} {year}
        <ChevronDown size={14} style={{ opacity: 0.4 }} />
      </button>
      {mounted && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function fmtLong(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" });
}

export default function AccountingPage() {
  const now = new Date();
  const [tab,    setTab]    = useState<"expenses"|"daywise"|"collections">("expenses");
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [year,   setYear]   = useState(now.getFullYear());

  const [payments,   setPayments]   = useState<Payment[]>([]);
  const [paySummary, setPaySummary] = useState<PaySummary>({ total: 0, cash: 0, upi: 0, card: 0, other: 0, count: 0 });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income,   setIncome]   = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [saving,   setSaving]   = useState(false);
  const [editId,   setEditId]   = useState<string|null>(null);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [msg,      setMsg]      = useState<{text:string;ok:boolean}|null>(null);

  const [entries,  setEntries]  = useState<Entry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const flash = (text: string, ok: boolean) => {
    setMsg({text,ok}); setTimeout(()=>setMsg(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, entRes, payRes] = await Promise.all([
        api.get("/expenses", {params:{month,year}}),
        api.get("/entries",  {params:{month,year}}),
        api.get("/payments", {params:{month,year}}),
      ]);
      setExpenses(expRes.data);
      setEntries(entRes.data);
      setIncome(entRes.data.reduce((s:number,e:any)=>s+Number(e.total_amount),0));
      setPayments(payRes.data.payments);
      setPaySummary(payRes.data.summary);
    } finally { setLoading(false); }
  }, [month, year]);

  const delPayment = async (id: string) => {
    if (!confirm("Delete this payment record?")) return;
    try {
      await api.delete(`/payments/${id}`);
      setPayments(ps => ps.filter(p => p.id !== id));
      flash("Payment deleted", true);
      load();
    } catch { flash("Delete failed", false); }
  };

  useEffect(()=>{ load(); },[load]);

  const totalExp = expenses.reduce((s,e)=>s+e.amount,0);
  const profit   = income - totalExp;

  const save = async () => {
    if (!form.date||!form.category||!form.amount){flash("Date, category and amount are required",false);return;}
    setSaving(true);
    try {
      if (editId) {
        const res = await api.put(`/expenses/${editId}`,{...form,amount:Number(form.amount)});
        setExpenses(es=>es.map(e=>e.id===editId?res.data:e));
        flash("Expense updated!",true);
      } else {
        const res = await api.post("/expenses",{...form,amount:Number(form.amount)});
        setExpenses(es=>[res.data,...es]);
        flash("Expense added!",true);
      }
      setForm(emptyForm); setShowForm(false); setEditId(null);
    } catch(e:any){ flash(e.response?.data?.detail||"Something went wrong",false); }
    finally { setSaving(false); }
  };

  const openEdit = (exp:Expense)=>{
    setEditId(exp.id);
    setForm({date:exp.date,category:exp.category,description:exp.description,amount:String(exp.amount)});
    setShowForm(true);
  };

  const doDelete = async(id:string)=>{
    try { await api.delete(`/expenses/${id}`); setExpenses(es=>es.filter(e=>e.id!==id)); flash("Deleted!",true); }
    catch { flash("Delete failed",false); }
    setDeleteId(null);
  };

  const byCategory = CATEGORIES.map(cat=>({
    cat, total:expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const byDate = entries.reduce((acc:Record<string,Entry[]>,e)=>{
    if(!acc[e.entry_date]) acc[e.entry_date]=[];
    acc[e.entry_date].push(e); return acc;
  },{});
  const sortedDates = Object.keys(byDate).sort((a,b)=>b.localeCompare(a));
  const bestDay = sortedDates.reduce((best,d)=>{
    const rev=byDate[d].reduce((s,e)=>s+Number(e.total_amount),0);
    return rev>(best.rev||0)?{date:d,rev}:best;
  },{} as {date?:string;rev?:number});

  const toggle=(d:string)=>setExpanded(prev=>{
    const next=new Set(prev); next.has(d)?next.delete(d):next.add(d); return next;
  });

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .acc-tab{transition:all 0.2s ease}
        .exp-row{transition:all 0.15s}
        .exp-row:hover{box-shadow:0 4px 16px rgba(0,0,0,0.1)!important;transform:translateY(-1px)}
        .day-row{transition:background 0.15s;cursor:pointer}
        .day-row:hover{background:var(--pressed)!important}
        @media (max-width: 768px) {
          /* Phone: 3-across summary cards overflow with large ₹ values → 2 columns; the
             expense editor's fixed 280px side column stacks below the list. */
          .acct-summary { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
          .acct-expense-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{animation:"fadeUp 0.3s ease both",marginBottom:20,display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>BOOKS</div>
          <h2 style={{fontWeight:900,fontSize:26,color:"var(--text-primary,#0f172a)",margin:"0 0 4px",letterSpacing:-0.5}}>Accounting</h2>
          <p style={{fontSize:13,color:"#94a3b8",margin:0}}>{MONTH_NAMES[month-1]} {year} — income, expenses & daily report</p>
        </div>
        <MonthYearPicker month={month} year={year} onChange={(m,y)=>{ setMonth(m); setYear(y); }} />
      </div>

      {/* ── 3 SUMMARY CARDS ── */}
      <div className="acct-summary" style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0,1fr))",gap:14,marginBottom:20}}>
        {[
          {label:"Total income",  value:income,       icon:<TrendingUp size={18}/>,   accent:"#22c55e", sub:`${MONTH_SHORT[month-1]} ${year}`},
          {label:"Total expense", value:totalExp,     icon:<TrendingDown size={18}/>, accent:"#ef4444", sub:`${expenses.length} record${expenses.length!==1?"s":""}`},
          {label:profit>=0?"Net profit":"Net loss",value:Math.abs(profit),icon:<TrendingUp size={18}/>,accent:profit>=0?"#3b82f6":"#ef4444", sub:income>0?`${Math.round((profit/income)*100)}% margin`:"—"},
        ].map((c,i)=>(
          <div key={i} style={{animation:`fadeUp 0.3s ease ${i*0.07}s both`,background:"var(--bg-card,#fff)",borderLeft:`3.5px solid ${c.accent}`,borderTop:"1px solid var(--border-hard)",borderRight:"1px solid var(--border-hard)",borderBottom:"1px solid var(--border-hard)",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>{c.label}</span>
              <div style={{color:c.accent,opacity:0.8}}>{c.icon}</div>
            </div>
            <div style={{fontSize:26,fontWeight:900,color:c.accent,letterSpacing:-0.5}}>₹{c.value.toLocaleString("en-IN")}</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontWeight:500}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {([
          {key:"expenses",label:"Expenses"},
          {key:"collections", label:"Collections"},
          {key:"daywise", label:"Day-wise report"},
        ] as const).map(t=>(
          <button key={t.key} className="acc-tab" onClick={()=>setTab(t.key)}
            style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"9px 20px",borderRadius:20,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
              background:tab===t.key?"#2563eb":"var(--bg-input,#f1f5f9)",
              color:tab===t.key?"#fff":"var(--text-secondary)",
              transition:"all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* toast */}
      {msg&&(
        <div style={{animation:"slideIn 0.2s ease both",padding:"12px 18px",borderRadius:12,marginBottom:16,fontSize:14,fontWeight:600,
          background:msg.ok?"rgba(5,150,105,0.1)":"rgba(239,68,68,0.1)",color:msg.ok?"#10b981":"#ef4444",border:`1px solid ${msg.ok?"rgba(5,150,105,0.25)":"rgba(239,68,68,0.25)"}`}}>
          {msg.ok?"✓ ":"✕ "}{msg.text}
        </div>
      )}

      {/* ══════════ EXPENSES TAB ══════════ */}
      {tab==="expenses"&&(
        <div style={{animation:"fadeUp 0.25s ease both"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"var(--text-primary)"}}>Expenses</div>
              <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{expenses.length} record{expenses.length!==1?"s":""} this month</div>
            </div>
            <button onClick={()=>{setShowForm(v=>!v);setEditId(null);setForm(emptyForm);}}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 20px",background:"linear-gradient(135deg,#1e3a8a,#2563eb)",color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",boxShadow:"0 4px 14px rgba(29,78,216,0.28)"}}>
              <Plus size={17}/> Add Expense
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm&&(
            <div style={{animation:"slideIn 0.2s ease both",background:"var(--bg-card)",borderRadius:16,padding:22,marginBottom:18,boxShadow:"0 8px 30px rgba(0,0,0,0.10)",border:"1.5px solid var(--border-hard)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <div style={{fontWeight:800,fontSize:16,color:"var(--text-primary)"}}>{editId?"Edit Expense":"New Expense"}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>Fill in the expense details below</div>
                </div>
                <button onClick={()=>{setShowForm(false);setEditId(null);setForm(emptyForm);}}
                  style={{width:34,height:34,background:"var(--bg-input)",border:"none",borderRadius:9,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <X size={16} color="var(--text-secondary)"/>
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Date *</div>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                    style={{width:"100%",padding:"11px 14px",border:"1.5px solid var(--border-hard)",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}}/>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Amount (₹) *</div>
                  <input type="number" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                    style={{width:"100%",padding:"11px 14px",border:"1.5px solid var(--border-hard)",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}}/>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Category *</div>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                    style={{width:"100%",padding:"11px 14px",border:"1.5px solid var(--border-hard)",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}}>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Description</div>
                  <input type="text" placeholder="Optional note" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    style={{width:"100%",padding:"11px 14px",border:"1.5px solid var(--border-hard)",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",background:"var(--bg-input)",color:"var(--text-primary)"}}/>
                </div>
              </div>
              {/* Action buttons — right-aligned row */}
              <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
                <button onClick={()=>{setShowForm(false);setEditId(null);setForm(emptyForm);}}
                  style={{padding:"10px 22px",border:"1.5px solid var(--border-hard)",borderRadius:9,background:"var(--bg-input)",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>
                  Cancel
                </button>
                <button onClick={save} disabled={saving}
                  style={{padding:"10px 28px",border:"none",borderRadius:9,fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8,background:saving?"var(--bg-elevated)":"#2563eb",color:saving?"var(--text-muted)":"#fff",boxShadow:saving?"none":"0 4px 14px rgba(37,99,235,0.32)",opacity:saving?0.55:1}}>
                  <Check size={16}/> {saving?"Saving…":editId?"Update Expense":"Add Expense"}
                </button>
              </div>
            </div>
          )}

          {/* List + Breakdown */}
          <div className="acct-expense-grid" style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:18,alignItems:"start"}}>
            <div>
              {loading?(
                <div style={{background:"var(--bg-card)",borderRadius:16,padding:60,textAlign:"center",color:"var(--text-muted)",border:"1.5px solid var(--border-hard)"}}>Loading…</div>
              ):expenses.length===0?(
                <div style={{background:"var(--bg-card)",borderRadius:16,padding:"60px 20px",textAlign:"center",border:"1.5px dashed var(--border-hard)"}}>
                  <div style={{width:56,height:56,borderRadius:16,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                    <Wallet size={26} color="var(--text-muted)"/>
                  </div>
                  <div style={{fontWeight:700,fontSize:15,color:"var(--text-muted)",marginBottom:6}}>No expenses this month</div>
                  <div style={{fontSize:13,color:"var(--text-muted)"}}>Click &ldquo;Add Expense&rdquo; to record one</div>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {expenses.map((exp,i)=>(
                    <div key={exp.id} className="exp-row"
                      style={{animation:`fadeUp 0.25s ease ${i*0.04}s both`,background:"var(--bg-card,#fff)",borderRadius:12,padding:"13px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",border:"1px solid var(--border-hard)",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:42,height:42,borderRadius:12,background:"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#ef4444"}}>
                        <TrendingDown size={18}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary,#0f172a)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                          {exp.description||exp.category}
                        </div>
                        <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{new Date(exp.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div>
                      </div>
                      <div style={{fontWeight:800,fontSize:15,color:"#ef4444",flexShrink:0}}>₹{Number(exp.amount).toLocaleString("en-IN")}</div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button onClick={()=>openEdit(exp)}
                          style={{width:30,height:30,background:"transparent",border:"1px solid var(--border-hard)",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}>
                          <Pencil size={13}/>
                        </button>
                        <button onClick={()=>setDeleteId(exp.id)}
                          style={{width:30,height:30,background:"transparent",border:"1px solid var(--border-hard)",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div style={{background:"var(--bg-card,#fff)",borderRadius:14,border:"1px solid var(--border-hard)",overflow:"hidden",position:"sticky",top:20,boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border-hard)"}}>
                <div style={{fontWeight:800,fontSize:14,color:"var(--text-primary,#0f172a)"}}>By category</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{byCategory.length} categories used</div>
              </div>
              {byCategory.length===0?(
                <div style={{padding:"36px 20px",textAlign:"center",color:"#cbd5e1",fontSize:13,fontWeight:500}}>No expense data yet</div>
              ):(
                <div style={{padding:"8px 0"}}>
                  {byCategory.map(({cat,total})=>(
                    <div key={cat} style={{padding:"10px 18px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontWeight:600,fontSize:13,color:"var(--text-primary,#0f172a)"}}>{cat}</span>
                        <span style={{fontWeight:700,fontSize:13,color:"var(--text-primary,#0f172a)"}}>₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <div style={{background:"var(--bg-input,#f1f5f9)",borderRadius:6,height:5,overflow:"hidden"}}>
                        <div style={{width:`${Math.min(100,(total/totalExp)*100)}%`,height:"100%",background:"#3b82f6",borderRadius:6,transition:"width 0.6s ease"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ DAY WISE TAB ══════════ */}
      {tab==="daywise"&&(
        <div style={{animation:"fadeUp 0.25s ease both"}}>
          <div className="acct-summary" style={{display:"grid",gridTemplateColumns:"repeat(3, minmax(0,1fr))",gap:14,marginBottom:20}}>
            {[
              {label:"Total Revenue", value:`₹${income.toLocaleString("en-IN")}`,          sub:`${entries.length} entries`,             iconColor:"#10b981", iconBg:"rgba(5,150,105,0.15)"},
              {label:"Total Entries", value:String(entries.length),                          sub:`${MONTH_SHORT[month-1]} ${year}`,        iconColor:"#3b82f6", iconBg:"rgba(37,99,235,0.15)"},
              {label:"Best Day",      value:bestDay.rev?`₹${bestDay.rev.toLocaleString("en-IN")}`:"—", sub:bestDay.date?fmtLong(bestDay.date):"No data yet", iconColor:"#f59e0b", iconBg:"rgba(245,158,11,0.15)"},
            ].map((c,i)=>(
              <div key={i} style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",marginBottom:10}}>{c.label}</div>
                <div style={{fontSize:26,fontWeight:900,color:c.iconColor,letterSpacing:-0.5}}>{c.value}</div>
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>{c.sub}</div>
              </div>
            ))}
          </div>

          {loading?(
            <div style={{background:"var(--bg-card)",borderRadius:16,padding:60,textAlign:"center",color:"var(--text-muted)",border:"1.5px solid var(--border-hard)"}}>Loading…</div>
          ):sortedDates.length===0?(
            <div style={{background:"var(--bg-card)",borderRadius:16,padding:"60px 20px",textAlign:"center",border:"1.5px dashed var(--border-hard)"}}>
              <div style={{width:56,height:56,borderRadius:16,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                <CalendarDays size={26} color="var(--text-muted)"/>
              </div>
              <div style={{fontWeight:700,fontSize:15,color:"var(--text-muted)",marginBottom:6}}>No entries this month</div>
              <div style={{fontSize:13,color:"var(--text-muted)"}}>Entries for {MONTH_NAMES[month-1]} {year} will appear here</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {sortedDates.map((date,idx)=>{
                const dayEntries=byDate[date];
                const dayRev=dayEntries.reduce((s,e)=>s+Number(e.total_amount),0);
                const isOpen=expanded.has(date);
                const isBest=date===bestDay.date;
                const delivered=dayEntries.filter(e=>e.delivery_status==="delivered").length;
                const pending=dayEntries.filter(e=>e.delivery_status!=="delivered").length;
                return(
                  <div key={date} style={{animation:`fadeUp 0.28s ease ${idx*0.04}s both`,background:"var(--bg-card)",borderRadius:16,border:`1.5px solid ${isBest?"#fcd34d":"var(--border-hard)"}`,boxShadow:"0 2px 10px rgba(0,0,0,0.05)",overflow:"hidden"}}>
                    <div className="day-row" onClick={()=>toggle(date)}
                      style={{display:"flex",alignItems:"center",padding:"16px 20px",background:isBest?"rgba(252,211,77,0.08)":"transparent"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                          <span style={{fontWeight:800,fontSize:15,color:"var(--text-primary)"}}>{fmtLong(date)}</span>
                          {isBest&&<span style={{fontSize:10,fontWeight:800,background:"rgba(245,158,11,0.2)",color:"#f59e0b",padding:"2px 8px",borderRadius:6,border:"1px solid rgba(245,158,11,0.3)"}}>★ BEST DAY</span>}
                        </div>
                        <div style={{display:"flex",gap:14,fontSize:12}}>
                          <span style={{color:"var(--text-muted)"}}>{dayEntries.length} entr{dayEntries.length===1?"y":"ies"}</span>
                          <span style={{color:"#10b981",fontWeight:600}}>✓ {delivered} delivered</span>
                          {pending>0&&<span style={{color:"#f59e0b",fontWeight:600}}>{pending} pending</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{fontWeight:900,fontSize:20,color:"#10b981"}}>₹{dayRev.toLocaleString("en-IN")}</div>
                        <div style={{width:30,height:30,borderRadius:8,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {isOpen?<ChevronDown size={16} color="var(--text-secondary)"/>:<ChevronRight size={16} color="var(--text-secondary)"/>}
                        </div>
                      </div>
                    </div>

                    {isOpen&&(
                      <div style={{borderTop:"1px solid var(--border-hard)"}}>
                        {dayEntries.map((entry,ei)=>(
                          <div key={entry.id}
                            style={{padding:"14px 20px",borderBottom:ei<dayEntries.length-1?"1px solid var(--border-hard)":"none",display:"flex",alignItems:"center",gap:14}}>
                            <div style={{width:38,height:38,borderRadius:11,background:"rgba(37,99,235,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#3b82f6",fontWeight:800,fontSize:16,flexShrink:0}}>
                              {entry.customer?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{entry.customer?.name}</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:5}}>
                                {entry.items.map((it,ii)=>(
                                  <span key={ii} style={{fontSize:11,background:"var(--bg-elevated)",border:"1px solid var(--border-hard)",borderRadius:6,padding:"2px 8px",color:"var(--text-secondary)"}}>
                                    {it.service_name} ×{it.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div style={{textAlign:"right",flexShrink:0}}>
                              <div style={{fontWeight:800,fontSize:15,color:"var(--text-primary)"}}>₹{Number(entry.total_amount).toLocaleString("en-IN")}</div>
                              <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6,marginTop:4,display:"inline-block",
                                background:entry.delivery_status==="delivered"?"rgba(5,150,105,0.12)":"rgba(245,158,11,0.12)",
                                color:entry.delivery_status==="delivered"?"#10b981":"#f59e0b"}}>
                                {entry.delivery_status==="delivered"?"Delivered":"Pending"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ COLLECTIONS TAB ══════════ */}
      {tab==="collections"&&(
        <div style={{animation:"fadeUp 0.25s ease both"}}>
          {/* Method breakdown — donut chart */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:16,padding:"20px 22px",marginBottom:20,boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{fontWeight:800,fontSize:16,color:"var(--text-primary)"}}>Collections by method</div>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>{paySummary.count} payment{paySummary.count!==1?"s":""} · {MONTH_NAMES[month-1]} {year}</div>
            </div>
            <CollectionsChart cash={paySummary.cash} upi={paySummary.upi} card={paySummary.card} size={152} />
          </div>

          {/* Payments list */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <div style={{fontWeight:800,fontSize:16,color:"var(--text-primary)"}}>Payments received</div>
              <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2}}>{MONTH_NAMES[month-1]} {year} · record payments from the Customers page</div>
            </div>
          </div>

          {loading?(
            <div style={{background:"var(--bg-card)",borderRadius:16,padding:60,textAlign:"center",color:"var(--text-muted)",border:"1.5px solid var(--border-hard)"}}>Loading…</div>
          ):payments.length===0?(
            <div style={{background:"var(--bg-card)",borderRadius:16,padding:"60px 20px",textAlign:"center",border:"1.5px dashed var(--border-hard)"}}>
              <div style={{width:56,height:56,borderRadius:16,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                <IndianRupee size={26} color="var(--text-muted)"/>
              </div>
              <div style={{fontWeight:700,fontSize:15,color:"var(--text-muted)",marginBottom:6}}>No payments this month</div>
              <div style={{fontSize:13,color:"var(--text-muted)"}}>Go to Customers → tap the ₹ button to record a payment</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {payments.map((pay,i)=>{
                const m = METHOD_META[pay.method] || METHOD_META.other;
                const Icon = m.icon;
                return (
                  <div key={pay.id} className="exp-row"
                    style={{animation:`fadeUp 0.25s ease ${Math.min(i,10)*0.03}s both`,background:"var(--bg-card)",borderRadius:12,padding:"13px 16px",boxShadow:"0 1px 6px rgba(0,0,0,0.04)",border:"1px solid var(--border-hard)",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:42,height:42,borderRadius:12,background:`${m.color}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:m.color}}>
                      <Icon size={18}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{pay.customer_name}</div>
                      <div style={{fontSize:12,color:"var(--text-muted)",marginTop:2,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontWeight:700,color:m.color}}>{m.label}</span>
                        <span>·</span>
                        <span>{fmt(pay.date)}</span>
                        {pay.note&&<><span>·</span><span>{pay.note}</span></>}
                      </div>
                    </div>
                    <div style={{fontWeight:800,fontSize:15,color:"#0f766e",flexShrink:0}}>₹{Number(pay.amount).toLocaleString("en-IN")}</div>
                    <button onClick={()=>delPayment(pay.id)}
                      style={{width:30,height:30,background:"transparent",border:"1px solid var(--border-hard)",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",flexShrink:0}}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setDeleteId(null)}>
          <div style={{background:"var(--bg-card)",borderRadius:20,padding:28,maxWidth:320,width:"100%",boxShadow:"0 24px 60px rgba(0,0,0,0.2)",animation:"slideIn 0.2s ease both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{width:54,height:54,borderRadius:16,background:"rgba(239,68,68,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
                <Trash2 size={24} color="#ef4444"/>
              </div>
              <div style={{fontWeight:800,fontSize:17,color:"var(--text-primary)",marginBottom:6}}>Delete Expense?</div>
              <div style={{fontSize:13,color:"var(--text-muted)"}}>This action cannot be undone.</div>
            </div>
            {/* Delete confirm buttons — right-aligned row */}
            <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
              <button onClick={()=>setDeleteId(null)}
                style={{padding:"10px 22px",border:"1px solid var(--border-hard)",borderRadius:9,background:"transparent",fontWeight:600,fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>
                Cancel
              </button>
              <button onClick={()=>doDelete(deleteId)}
                style={{padding:"10px 28px",border:"none",borderRadius:9,background:"#ef4444",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
