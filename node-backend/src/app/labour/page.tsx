"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Wallet, ChevronDown, ChevronUp, ArrowLeft, History } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface LabourType   { id:string; name:string; }
interface WorkEntry    { id:string; labour_id:string; work_date:string; press_count:number; rate_per_piece:number; total:number; }
interface AdvanceEntry { id:string; labour_id:string; advance_date:string; amount:number; description:string; }
interface MonthData    { key:string; label:string; earned:number; advance:number; netPayable:number; press:number; works:WorkEntry[]; advances:AdvanceEntry[]; }

const GRADIENTS = ["linear-gradient(135deg,#1e40af,#3b82f6)","linear-gradient(135deg,#059669,#10b981)","linear-gradient(135deg,#7c3aed,#a78bfa)","linear-gradient(135deg,#d97706,#fbbf24)","linear-gradient(135deg,#dc2626,#f87171)","linear-gradient(135deg,#0891b2,#22d3ee)"];
const LIGHT = ["#eff6ff","#f0fdf4","#f5f3ff","#fffbeb","#fef2f2","#ecfeff"];
const DARK  = ["#1e40af","#059669","#7c3aed","#d97706","#dc2626","#0891b2"];

function groupByMonth(works: WorkEntry[], advances: AdvanceEntry[]): MonthData[] {
  const map = new Map<string, MonthData>();
  const ensure = (dateStr: string) => {
    const key = dateStr.slice(0, 7); // YYYY-MM
    if (!map.has(key)) {
      const [y, m] = key.split("-");
      const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
      map.set(key, { key, label, earned: 0, advance: 0, netPayable: 0, press: 0, works: [], advances: [] });
    }
    return map.get(key)!;
  };
  works.forEach(w => { const m = ensure(w.work_date); m.works.push(w); m.press += w.press_count; m.earned += w.total; });
  advances.forEach(a => { const m = ensure(a.advance_date); m.advances.push(a); m.advance += a.amount; });
  map.forEach(m => { m.netPayable = m.earned - m.advance; });
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export default function Labour() {
  const [labours,        setLabours]        = useState<LabourType[]>([]);
  const [works,          setWorks]          = useState<WorkEntry[]>([]);
  const [advances,       setAdvances]       = useState<AdvanceEntry[]>([]);
  const [monthVal,       setMonthVal]       = useState(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [showLabourForm, setShowLabourForm] = useState(false);
  const [labourName,     setLabourName]     = useState("");
  const [editLabourId,   setEditLabourId]   = useState<string|null>(null);
  const [activeTab,      setActiveTab]      = useState<"work"|"advance">("work");
  const [selectedLabour, setSelectedLabour] = useState<LabourType|null>(null);
  const [historyWorks,   setHistoryWorks]   = useState<WorkEntry[]>([]);
  const [historyAdv,     setHistoryAdv]     = useState<AdvanceEntry[]>([]);
  const [histLoading,    setHistLoading]    = useState(false);
  const [expandedMonth,  setExpandedMonth]  = useState<string|null>(null);
  const [workForm,       setWorkForm]       = useState({labour_id:"",work_date:new Date().toISOString().split("T")[0],press_count:"",rate_per_piece:"2"});
  const [advForm,        setAdvForm]        = useState({labour_id:"",advance_date:new Date().toISOString().split("T")[0],amount:"",description:""});
  const [workMsg,        setWorkMsg]        = useState("");
  const [advMsg,         setAdvMsg]         = useState("");

  const loadLabours  = async () => { const res=await api.get("/labour"); setLabours(res.data); };
  const loadWork     = async () => { const [y,m]=monthVal.split("-"); const res=await api.get("/labour/work",    {params:{month:parseInt(m),year:parseInt(y)}}); setWorks(res.data); };
  const loadAdvances = async () => { const [y,m]=monthVal.split("-"); const res=await api.get("/labour/advance", {params:{month:parseInt(m),year:parseInt(y)}}); setAdvances(res.data); };

  const monthDate = (mv: string) => {
    const [y,m]=mv.split("-"); const now=new Date();
    return parseInt(y)===now.getFullYear()&&parseInt(m)===now.getMonth()+1 ? now.toISOString().split("T")[0] : `${y}-${m}-01`;
  };

  useEffect(()=>{ loadLabours(); },[]);
  useEffect(()=>{
    loadWork(); loadAdvances();
    const d=monthDate(monthVal);
    setWorkForm(f=>({...f,work_date:d}));
    setAdvForm(f=>({...f,advance_date:d}));
  },[monthVal]);

  const openHistory = async (l: LabourType) => {
    setSelectedLabour(l); setHistLoading(true); setExpandedMonth(null);
    try {
      const [rw, ra] = await Promise.all([
        api.get("/labour/work",    { params: { labour_id: l.id } }),
        api.get("/labour/advance", { params: { labour_id: l.id } }),
      ]);
      setHistoryWorks(rw.data); setHistoryAdv(ra.data);
      // auto-expand current month
      const cur = new Date().toISOString().slice(0,7);
      setExpandedMonth(cur);
    } finally { setHistLoading(false); }
  };

  const refreshHistory = async () => {
    if (!selectedLabour) return;
    const [rw, ra] = await Promise.all([
      api.get("/labour/work",    { params: { labour_id: selectedLabour.id } }),
      api.get("/labour/advance", { params: { labour_id: selectedLabour.id } }),
    ]);
    setHistoryWorks(rw.data); setHistoryAdv(ra.data);
  };

  const saveLabour = async () => {
    if(!labourName.trim()) return;
    if(editLabourId) await api.put(`/labour/${editLabourId}`,{name:labourName});
    else await api.post("/labour",{name:labourName});
    setLabourName(""); setEditLabourId(null); setShowLabourForm(false); loadLabours();
  };
  const deleteLabour  = async (id:string) => { if(!confirm("Remove?"))return; await api.delete(`/labour/${id}`); loadLabours(); if(selectedLabour?.id===id) setSelectedLabour(null); };
  const deleteWork    = async (id:string) => { await api.delete(`/labour/work/${id}`);    loadWork(); refreshHistory(); };
  const deleteAdvance = async (id:string) => { await api.delete(`/labour/advance/${id}`); loadAdvances(); refreshHistory(); };

  const saveWork = async () => {
    if(!workForm.labour_id||!workForm.press_count) return;
    try {
      await api.post("/labour/work",{labour_id:workForm.labour_id,work_date:workForm.work_date,press_count:parseInt(workForm.press_count),rate_per_piece:parseFloat(workForm.rate_per_piece)});
      setWorkMsg("saved"); setWorkForm(f=>({...f,press_count:""}));
      setTimeout(()=>setWorkMsg(""),2500); loadWork();
      if(selectedLabour?.id===workForm.labour_id) refreshHistory();
    } catch(e:any){ setWorkMsg("err:"+(e.response?.data?.detail||e.message)); }
  };

  const saveAdvance = async () => {
    if(!advForm.labour_id||!advForm.amount) return;
    try {
      await api.post("/labour/advance",{labour_id:advForm.labour_id,advance_date:advForm.advance_date,amount:parseFloat(advForm.amount),description:advForm.description});
      setAdvMsg("saved"); setAdvForm(f=>({...f,amount:"",description:""}));
      setTimeout(()=>setAdvMsg(""),2500); loadAdvances();
      if(selectedLabour?.id===advForm.labour_id) refreshHistory();
    } catch(e:any){ setAdvMsg("err:"+(e.response?.data?.detail||e.message)); }
  };

  // Current month summary (for the top summary bar)
  const summary = labours.map(l=>{
    const lw=works.filter(w=>w.labour_id===l.id);
    const la=advances.filter(a=>a.labour_id===l.id);
    const totalPay=lw.reduce((s,w)=>s+w.total,0);
    const totalAdv=la.reduce((s,a)=>s+a.amount,0);
    return {...l,totalPress:lw.reduce((s,w)=>s+w.press_count,0),totalPay,totalAdv,netPayable:totalPay-totalAdv};
  });

  const monthHistory = groupByMonth(historyWorks, historyAdv);
  const inp: React.CSSProperties = {width:"100%",padding:"10px 12px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",boxSizing:"border-box",background:"#f8fafc",color:"#1e293b"};
  const lbl: React.CSSProperties = {display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"};
  const monthLabel = new Date(monthVal+"-01").toLocaleString("en-IN",{month:"long",year:"numeric"});

  // ── Labour History View ──────────────────────────────────────────────────
  if (selectedLabour) {
    const li = labours.findIndex(l=>l.id===selectedLabour.id);
    const grad = GRADIENTS[li%GRADIENTS.length];
    const dark = DARK[li%DARK.length];

    const totalEarned  = historyWorks.reduce((s,w)=>s+w.total,0);
    const totalAdvance = historyAdv.reduce((s,a)=>s+a.amount,0);
    const totalNet     = totalEarned - totalAdvance;

    return (
      <ProtectedLayout>
        <style>{`.mrow:hover{background:#f0f9ff!important;} .arow:hover{background:#fef9c3!important;}`}</style>

        {/* Back header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={()=>setSelectedLabour(null)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",background:"#f1f5f9",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,color:"#475569"}}>
            <ArrowLeft size={15}/> Back
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,borderRadius:10,background:grad,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#fff"}}>{selectedLabour.name[0].toUpperCase()}</div>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:"#1e293b"}}>{selectedLabour.name}</div>
              <div style={{fontSize:12,color:"#94a3b8"}}>Full payment history</div>
            </div>
          </div>
        </div>

        {/* All-time summary */}
        <div style={{background:grad,borderRadius:14,padding:"18px 22px",marginBottom:20,display:"flex",gap:0,flexWrap:"wrap"}}>
          {[
            {label:"Total Earned",  val:"₹"+totalEarned.toFixed(0),  color:"#fff"},
            {label:"Total Advance", val:"₹"+totalAdvance.toFixed(0), color:"#fde68a"},
            {label:"Net Payable",   val:"₹"+Math.abs(totalNet).toFixed(0)+(totalNet<0?" (overpaid)":""), color:totalNet>=0?"#bbf7d0":"#fca5a5"},
          ].map(({label,val,color},i)=>(
            <div key={label} style={{flex:1,minWidth:120,padding:"0 16px",borderLeft:i>0?"1px solid rgba(255,255,255,0.2)":"none"}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
              <div style={{fontSize:20,fontWeight:800,color}}>{val}</div>
            </div>
          ))}
        </div>

        {histLoading && <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading history...</div>}

        {/* Month-by-month ledger */}
        {!histLoading&&monthHistory.length===0&&(
          <div style={{textAlign:"center",padding:"40px 0",color:"#94a3b8"}}>No entries found for {selectedLabour.name}</div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {monthHistory.map(month=>{
            const isOpen = expandedMonth===month.key;
            const isPaid = month.netPayable<=0;
            return (
              <div key={month.key} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",border:"1px solid #f1f5f9"}}>

                {/* Month header row */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer",background:isOpen?"#fafcff":"#fff"}} onClick={()=>setExpandedMonth(isOpen?null:month.key)}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#1e293b"}}>{month.label}</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{month.press} pieces • {month.works.length} work entries • {month.advances.length} advances</div>
                  </div>

                  {/* Month stats */}
                  <div style={{display:"flex",gap:16,alignItems:"center",flexShrink:0}}>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"#94a3b8"}}>Earned</div>
                      <div style={{fontWeight:700,color:"#059669",fontSize:14}}>₹{month.earned.toFixed(0)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:"#94a3b8"}}>Advance</div>
                      <div style={{fontWeight:700,color:"#d97706",fontSize:14}}>₹{month.advance.toFixed(0)}</div>
                    </div>
                    <div style={{textAlign:"right",minWidth:80}}>
                      <div style={{fontSize:11,color:"#94a3b8"}}>Net Pay</div>
                      <div style={{fontWeight:800,fontSize:16,color:month.netPayable>=0?"#1e40af":"#dc2626"}}>₹{Math.abs(month.netPayable).toFixed(0)}</div>
                    </div>
                    <div style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:isPaid?"#dcfce7":"#fef9c3",color:isPaid?"#16a34a":"#92400e",flexShrink:0}}>
                      {isPaid?"Paid":"Due"}
                    </div>
                    {isOpen?<ChevronUp size={16} color="#94a3b8"/>:<ChevronDown size={16} color="#94a3b8"/>}
                  </div>
                </div>

                {isOpen&&(
                  <div style={{padding:"0 18px 18px",borderTop:"1px solid #f1f5f9"}}>

                    {/* Calculation summary */}
                    <div style={{background:month.netPayable>=0?"#f0fdf4":"#fef2f2",borderRadius:10,padding:"12px 16px",margin:"14px 0",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,border:`1px solid ${month.netPayable>=0?"#bbf7d0":"#fecaca"}`}}>
                      <span style={{fontSize:13,color:"#475569"}}>
                        <strong style={{color:"#059669"}}>₹{month.earned.toFixed(0)}</strong> earned
                        <span style={{margin:"0 8px",color:"#94a3b8"}}>−</span>
                        <strong style={{color:"#d97706"}}>₹{month.advance.toFixed(0)}</strong> advance
                        <span style={{margin:"0 8px",color:"#94a3b8"}}>=</span>
                      </span>
                      <div style={{fontWeight:800,fontSize:18,color:month.netPayable>=0?"#1e40af":"#dc2626"}}>
                        {month.netPayable>=0?"Pay ":"Overpaid "}₹{Math.abs(month.netPayable).toFixed(0)}
                      </div>
                    </div>

                    {/* Work entries */}
                    {month.works.length>0&&(
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:11,fontWeight:700,color:dark,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>📋 Work Entries</div>
                        <div style={{borderRadius:10,overflow:"hidden",border:"1px solid #f1f5f9"}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 80px 30px",padding:"6px 12px",background:"#f8fafc",fontSize:11,fontWeight:700,color:"#94a3b8",gap:0}}>
                            <span>Date</span><span style={{textAlign:"center"}}>Count</span><span style={{textAlign:"center"}}>Rate</span><span style={{textAlign:"right"}}>Amount</span><span/>
                          </div>
                          {[...month.works].sort((a,b)=>a.work_date.localeCompare(b.work_date)).map((w,ri)=>(
                            <div key={w.id} className="mrow" style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 80px 30px",padding:"9px 12px",fontSize:13,alignItems:"center",background:ri%2===0?"#fff":"#fafafa",transition:"background 0.1s",gap:0}}>
                              <span style={{fontWeight:600,color:"#334155"}}>{new Date(w.work_date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                              <span style={{textAlign:"center",fontWeight:700,color:"#1e293b"}}>{w.press_count}</span>
                              <span style={{textAlign:"center",color:"#64748b"}}>₹{w.rate_per_piece}</span>
                              <span style={{textAlign:"right",fontWeight:700,color:"#059669"}}>₹{w.total.toFixed(0)}</span>
                              <button onClick={()=>deleteWork(w.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",justifyContent:"center"}}><Trash2 size={13} color="#ef4444"/></button>
                            </div>
                          ))}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 80px 30px",padding:"8px 12px",background:"#f0fdf4",fontSize:13,fontWeight:700,gap:0}}>
                            <span style={{color:"#475569"}}>Total</span>
                            <span style={{textAlign:"center",color:"#1e293b"}}>{month.press}</span>
                            <span/>
                            <span style={{textAlign:"right",color:"#059669"}}>₹{month.earned.toFixed(0)}</span>
                            <span/>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Advance entries */}
                    {month.advances.length>0&&(
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#d97706",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>💸 Advances Given</div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {[...month.advances].sort((a,b)=>a.advance_date.localeCompare(b.advance_date)).map(a=>(
                            <div key={a.id} className="arow" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"#fffbeb",border:"1px solid #fde68a",transition:"background 0.1s"}}>
                              <div style={{flex:1}}>
                                <div style={{display:"flex",alignItems:"center",gap:10}}>
                                  <span style={{fontSize:13,color:"#92400e",fontWeight:700}}>{new Date(a.advance_date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                                  <span style={{fontWeight:800,color:"#d97706",fontSize:15}}>₹{a.amount.toFixed(0)}</span>
                                </div>
                                {a.description&&<div style={{fontSize:12,color:"#78350f",marginTop:3}}>📝 {a.description}</div>}
                              </div>
                              <button onClick={()=>deleteAdvance(a.id)} style={{background:"none",border:"none",cursor:"pointer",flexShrink:0}}><Trash2 size={13} color="#ef4444"/></button>
                            </div>
                          ))}
                          <div style={{padding:"8px 12px",background:"#fef9c3",borderRadius:10,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:13,border:"1px solid #fde68a"}}>
                            <span style={{color:"#92400e"}}>Total Advance</span>
                            <span style={{color:"#d97706"}}>₹{month.advance.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {month.works.length===0&&month.advances.length===0&&(
                      <div style={{textAlign:"center",padding:"20px 0",color:"#94a3b8",fontSize:13}}>No entries</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ProtectedLayout>
    );
  }

  // ── Main View ──────────────────────────────────────────────────────────────
  return (
    <ProtectedLayout>
      <style>{`.lab-btn:hover{opacity:0.85;}`}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{color:"#0f172a",margin:"0 0 4px",fontSize:22,fontWeight:800}}>Labour Management</h2>
          <p style={{color:"#94a3b8",fontSize:13,margin:0}}>Track press work & advance payments</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="month" value={monthVal} onChange={e=>setMonthVal(e.target.value)}
            style={{padding:"8px 12px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,outline:"none",background:"#fff",color:"#1e293b",cursor:"pointer"}}/>
          <button onClick={()=>{setShowLabourForm(true);setEditLabourId(null);setLabourName("");}}
            style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            <Plus size={15}/> Add Labour
          </button>
        </div>
      </div>

      {/* Labour cards — click to view history */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:22}}>
        {labours.length===0&&<div style={{color:"#94a3b8",fontSize:14,padding:"20px 0"}}>No labour added yet</div>}
        {labours.map((l,i)=>{
          const s = summary.find(x=>x.id===l.id);
          return (
            <div key={l.id} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",flex:"1 1 220px",minWidth:220,border:"1px solid #f1f5f9"}}>
              <div style={{height:5,background:GRADIENTS[i%GRADIENTS.length]}}/>
              <div style={{padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:GRADIENTS[i%GRADIENTS.length],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#fff",flexShrink:0}}>{l.name[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>{l.name}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>{monthLabel}</div>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button style={{width:28,height:28,border:"none",borderRadius:7,background:LIGHT[i%LIGHT.length],cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setEditLabourId(l.id);setLabourName(l.name);setShowLabourForm(true);}}><Edit2 size={13} color={DARK[i%DARK.length]}/></button>
                    <button style={{width:28,height:28,border:"none",borderRadius:7,background:"#fef2f2",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>deleteLabour(l.id)}><Trash2 size={13} color="#ef4444"/></button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                  <div style={{background:LIGHT[i%LIGHT.length],borderRadius:8,padding:"7px 8px",textAlign:"center"}}>
                    <div style={{fontWeight:800,fontSize:15,color:DARK[i%DARK.length]}}>{s?.totalPress||0}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>Press</div>
                  </div>
                  <div style={{background:"#f0fdf4",borderRadius:8,padding:"7px 8px",textAlign:"center"}}>
                    <div style={{fontWeight:800,fontSize:15,color:"#059669"}}>₹{s?.totalPay.toFixed(0)||0}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>Earned</div>
                  </div>
                  <div style={{background:(s?.netPayable||0)>=0?"#f0f9ff":"#fef2f2",borderRadius:8,padding:"7px 8px",textAlign:"center"}}>
                    <div style={{fontWeight:800,fontSize:15,color:(s?.netPayable||0)>=0?"#1e40af":"#dc2626"}}>₹{Math.abs(s?.netPayable||0).toFixed(0)}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>Net Pay</div>
                  </div>
                </div>
                <button onClick={()=>openHistory(l)} className="lab-btn"
                  style={{width:"100%",padding:"8px",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:9,cursor:"pointer",fontSize:12,fontWeight:700,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"opacity 0.15s"}}>
                  <History size={13}/> View Full History
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entry Forms */}
      <div style={{marginBottom:22}}>
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:12,padding:5,marginBottom:14,width:"fit-content",gap:4}}>
          <button onClick={()=>setActiveTab("work")} style={{padding:"8px 22px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,transition:"all 0.2s",background:activeTab==="work"?"#fff":"transparent",color:activeTab==="work"?"#1e40af":"#94a3b8",boxShadow:activeTab==="work"?"0 2px 8px rgba(0,0,0,0.1)":"none"}}>📋 Daily Work</button>
          <button onClick={()=>setActiveTab("advance")} style={{padding:"8px 22px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,transition:"all 0.2s",background:activeTab==="advance"?"#fff":"transparent",color:activeTab==="advance"?"#d97706":"#94a3b8",boxShadow:activeTab==="advance"?"0 2px 8px rgba(0,0,0,0.1)":"none"}}>💸 Advance</button>
        </div>

        {activeTab==="work"&&(
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",border:"1px solid #f1f5f9"}}>
            <div style={{fontWeight:700,fontSize:14,color:"#1e293b",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><div style={{width:4,height:20,background:"linear-gradient(135deg,#1e40af,#3b82f6)",borderRadius:4}}/>Add Work Entry</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:12}}>
              <div><label style={lbl}>Labour</label><select style={inp} value={workForm.labour_id} onChange={e=>setWorkForm(f=>({...f,labour_id:e.target.value}))}><option value="">Select...</option>{labours.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
              <div><label style={lbl}>Date</label><input type="date" style={inp} value={workForm.work_date} onChange={e=>setWorkForm(f=>({...f,work_date:e.target.value}))}/></div>
              <div><label style={lbl}>Press Count</label><input type="number" style={inp} placeholder="0" min={0} value={workForm.press_count} onChange={e=>setWorkForm(f=>({...f,press_count:e.target.value}))}/></div>
              <div><label style={lbl}>Rate (₹/piece)</label><input type="number" style={inp} value={workForm.rate_per_piece} onChange={e=>setWorkForm(f=>({...f,rate_per_piece:e.target.value}))}/></div>
            </div>
            {workForm.press_count&&workForm.rate_per_piece&&<div style={{padding:"9px 14px",background:"#f0fdf4",borderRadius:10,fontSize:13,color:"#15803d",marginBottom:12,fontWeight:600,border:"1px solid #bbf7d0"}}>💰 {workForm.press_count} × ₹{workForm.rate_per_piece} = <strong style={{fontSize:15}}>₹{(parseInt(workForm.press_count)*parseFloat(workForm.rate_per_piece)).toFixed(0)}</strong></div>}
            {workMsg==="saved"&&<div style={{padding:"8px 14px",background:"#f0fdf4",color:"#16a34a",borderRadius:8,fontSize:13,marginBottom:10,fontWeight:600}}>✅ Work entry saved!</div>}
            {workMsg.startsWith("err:")&&<div style={{padding:"8px 14px",background:"#fef2f2",color:"#dc2626",borderRadius:8,fontSize:13,marginBottom:10}}>❌ {workMsg.slice(4)}</div>}
            <button onClick={saveWork} disabled={!workForm.labour_id||!workForm.press_count}
              style={{padding:"11px 24px",background:(!workForm.labour_id||!workForm.press_count)?"#cbd5e1":"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:(!workForm.labour_id||!workForm.press_count)?"not-allowed":"pointer"}}>
              💾 Save Work Entry
            </button>
          </div>
        )}

        {activeTab==="advance"&&(
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",border:"1.5px solid #fde68a"}}>
            <div style={{fontWeight:700,fontSize:14,color:"#1e293b",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><div style={{width:4,height:20,background:"linear-gradient(135deg,#d97706,#fbbf24)",borderRadius:4}}/>Add Advance Payment</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:12}}>
              <div><label style={lbl}>Labour</label><select style={inp} value={advForm.labour_id} onChange={e=>setAdvForm(f=>({...f,labour_id:e.target.value}))}><option value="">Select...</option>{labours.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
              <div><label style={lbl}>Date</label><input type="date" style={inp} value={advForm.advance_date} onChange={e=>setAdvForm(f=>({...f,advance_date:e.target.value}))}/></div>
              <div><label style={lbl}>Amount (₹)</label><input type="number" style={inp} placeholder="0" min={0} value={advForm.amount} onChange={e=>setAdvForm(f=>({...f,amount:e.target.value}))}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={lbl}>Description</label><input style={inp} placeholder="e.g. Festival advance, Weekly advance..." value={advForm.description} onChange={e=>setAdvForm(f=>({...f,description:e.target.value}))}/></div>
            {advForm.amount&&<div style={{padding:"9px 14px",background:"#fffbeb",borderRadius:10,fontSize:13,color:"#92400e",marginBottom:12,fontWeight:600,border:"1px solid #fde68a"}}>💸 Advance: <strong style={{fontSize:15}}>₹{parseFloat(advForm.amount||"0").toFixed(0)}</strong>{advForm.description&&<span style={{fontWeight:400,color:"#78350f"}}> — {advForm.description}</span>}</div>}
            {advMsg==="saved"&&<div style={{padding:"8px 14px",background:"#fffbeb",color:"#92400e",borderRadius:8,fontSize:13,marginBottom:10,fontWeight:600}}>✅ Advance saved!</div>}
            {advMsg.startsWith("err:")&&<div style={{padding:"8px 14px",background:"#fef2f2",color:"#dc2626",borderRadius:8,fontSize:13,marginBottom:10}}>❌ {advMsg.slice(4)}</div>}
            <button onClick={saveAdvance} disabled={!advForm.labour_id||!advForm.amount}
              style={{padding:"11px 24px",background:(!advForm.labour_id||!advForm.amount)?"#cbd5e1":"linear-gradient(135deg,#d97706,#f59e0b)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:(!advForm.labour_id||!advForm.amount)?"not-allowed":"pointer"}}>
              <Wallet size={14} style={{display:"inline",marginRight:6}}/>Save Advance
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Labour Modal */}
      {showLabourForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}} onClick={()=>setShowLabourForm(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,color:"#1e293b",fontSize:18,fontWeight:800}}>{editLabourId?"Edit":"Add"} Labour</h3>
              <button onClick={()=>setShowLabourForm(false)} style={{background:"#f1f5f9",border:"none",borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#64748b"/></button>
            </div>
            <label style={lbl}>Name</label>
            <input style={{...inp,marginBottom:20}} placeholder="e.g. Ramesh, Suresh..." value={labourName} onChange={e=>setLabourName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveLabour()} autoFocus/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowLabourForm(false)} style={{flex:1,padding:11,background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"}}>Cancel</button>
              <button onClick={saveLabour} disabled={!labourName.trim()} style={{flex:2,padding:11,background:!labourName.trim()?"#cbd5e1":"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:!labourName.trim()?"not-allowed":"pointer"}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
