"use client";
import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, ShoppingBag, Users, Download } from "lucide-react";
import api from "@/lib/api";
import { downloadAuthedFile } from "@/lib/download";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "@/components/Filters";
import { useBlockStaff } from "@/lib/useRoleGuard";
import { Donut, Bars } from "@/components/Charts";
import { isEntryDelivered } from "@/lib/entry-status";
import type { LaundryEntry, CustomerBalance, Customer } from "@/types";

type Expense = { id: string; date: string; category: string; description: string; amount: number };
const invFmt = (n?: number | null) => (n ? "INV-" + String(n).padStart(4, "0") : "—");
const fmtD = (d: string) => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); } catch { return d; } };

// Total chip (like MyUniclean's "Total Balance Amount: ₹490") + a simple scrollable table.
function TotalChip({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "inline-block", background: "var(--grade-b-bg)", border: "1px solid var(--grade-b-border)", color: "var(--grade-b-text)", borderRadius: 10, padding: "8px 14px", fontSize: 14, fontWeight: 800, marginBottom: 14 }}>{label}: {value}</div>;
}
function RepTable({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (!rows.length) return <EmptyState compact title="No data" subtitle={empty} />;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "right", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border-hard)", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={{ textAlign: ci === 0 ? "left" : "right", padding: "10px 12px", fontSize: 13, color: "var(--text-primary)", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const allowed = useBlockStaff();
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const mStart = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
  const mEnd   = () => { const d=new Date(); const e=new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`; };
  const [from, setFrom] = useState(mStart);
  const [to, setTo] = useState(mEnd);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily"|"services"|"society"|"customers"|"collection"|"orders"|"expense"|"balance"|"labour">("daily");
  const [expandedSociety, setExpandedSociety] = useState<string|null>(null);
  const [coll, setColl] = useState<{ total:number; cash:number; upi:number; card:number; other:number; count:number }>({ total:0, cash:0, upi:0, card:0, other:0, count:0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<CustomerBalance[]>([]);
  const [custMap, setCustMap] = useState<Record<string,{name:string;phone:string}>>({});
  // Labour report data (range-scoped).
  const [labWorks, setLabWorks] = useState<{labour_id:string;labour_name:string;total:number;press_count:number}[]>([]);
  const [labAdvs, setLabAdvs] = useState<{labour_id:string;labour_name:string;amount:number}[]>([]);
  const [labPays, setLabPays] = useState<{labour_id:string;labour_name:string;amount:number}[]>([]);

  useEffect(()=>{ if(!from||!to) return; setLoading(true);
    Promise.all([
      api.get("/entries",{params:{from,to}}).then(r=>setEntries(r.data)),
      api.get("/payments",{params:{from,to}}).then(r=>setColl(r.data.summary)).catch(()=>setColl({ total:0, cash:0, upi:0, card:0, other:0, count:0 })),
      api.get("/expenses",{params:{from,to}}).then(r=>setExpenses(r.data)).catch(()=>setExpenses([])),
      api.get("/customers/balances").then(r=>setBalances(r.data)).catch(()=>setBalances([])),
      api.get("/customers").then(r=>{ const m:Record<string,{name:string;phone:string}>={}; (r.data as Customer[]).forEach(c=>m[c.id]={name:c.name,phone:c.phone}); setCustMap(m); }).catch(()=>{}),
      api.get("/labour/work",{params:{from,to}}).then(r=>setLabWorks(r.data)).catch(()=>setLabWorks([])),
      api.get("/labour/advance",{params:{from,to}}).then(r=>setLabAdvs(r.data)).catch(()=>setLabAdvs([])),
      api.get("/labour/payment",{params:{from,to}}).then(r=>setLabPays(r.data)).catch(()=>setLabPays([])),
    ]).finally(()=>setLoading(false));
  },[from,to]);

  const exportCombined = () => { downloadAuthedFile("/exports/combined",`LaundryMax-Report-${from}_${to}.xlsx`,{from,to}).catch(()=>alert("Failed to export report")); };

  const totalRevenue=entries.reduce((s,e)=>s+Number(e.total_amount),0);
  const totalExpense=expenses.reduce((s,e)=>s+Number(e.amount),0);
  const netAfterExpense=totalRevenue-totalExpense; // revenue minus this month's expenses

  const dailyMap=new Map<string,number>();
  entries.forEach(e=>dailyMap.set(e.entry_date,(dailyMap.get(e.entry_date)||0)+Number(e.total_amount)));
  const dailyData=[...dailyMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]));

  const serviceMap=new Map<string,{qty:number;revenue:number}>();
  entries.forEach(e=>e.items.forEach(item=>{ const ex=serviceMap.get(item.service_name)||{qty:0,revenue:0}; ex.qty+=item.quantity; ex.revenue+=Number(item.subtotal); serviceMap.set(item.service_name,ex); }));
  const serviceData=[...serviceMap.entries()].sort((a,b)=>b[1].revenue-a[1].revenue);
  const maxSvcRev=Math.max(...serviceData.map(d=>d[1].revenue),1);

  const societyMap=new Map<string,{revenue:number;customers:Map<string,{name:string;revenue:number}>}>();
  entries.forEach(e=>{ const soc=e.customer?.society_name||"Unknown"; if(!societyMap.has(soc)) societyMap.set(soc,{revenue:0,customers:new Map()}); const sd=societyMap.get(soc)!; sd.revenue+=Number(e.total_amount); const cx=sd.customers.get(e.customer_id)||{name:e.customer?.name||"Unknown",revenue:0}; cx.revenue+=Number(e.total_amount); sd.customers.set(e.customer_id,cx); });
  const societyData=[...societyMap.entries()].sort((a,b)=>b[1].revenue-a[1].revenue);
  const maxSocRev=Math.max(...societyData.map(d=>d[1].revenue),1);

  const customerMap=new Map<string,{name:string;flat:string;revenue:number;count:number}>();
  entries.forEach(e=>{ const ex=customerMap.get(e.customer_id)||{name:e.customer?.name||"Unknown",flat:e.customer?.flat_number||"",revenue:0,count:0}; ex.revenue+=Number(e.total_amount); ex.count+=1; customerMap.set(e.customer_id,ex); });
  const customerData=[...customerMap.values()].sort((a,b)=>b.revenue-a.revenue);

  const PALETTE=["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16"];
  const fmtShort=(d:string)=>{ try { return new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
  const monthName= from===to ? fmtShort(from) : `${fmtShort(from)} – ${fmtShort(to)}`;

  // Month navigation — most shops bill monthly, so a simple ◀ Month ▶ + "This month".
  const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const cur = from ? new Date(from+"T00:00:00") : new Date();
  const monthTitle = new Date(cur.getFullYear(),cur.getMonth(),1).toLocaleString("en-IN",{month:"long",year:"numeric"});
  const isFullMonth = from===iso(new Date(cur.getFullYear(),cur.getMonth(),1)) && to===iso(new Date(cur.getFullYear(),cur.getMonth()+1,0));
  const goMonth=(delta:number)=>{ const d=new Date(cur.getFullYear(),cur.getMonth()+delta,1); setFrom(iso(new Date(d.getFullYear(),d.getMonth(),1))); setTo(iso(new Date(d.getFullYear(),d.getMonth()+1,0))); };
  const nowM=new Date();
  const atCurrentMonth = cur.getFullYear()===nowM.getFullYear() && cur.getMonth()===nowM.getMonth();

  if (!allowed) return null;
  if(loading) return <ProtectedLayout><p style={{color:"var(--text-muted)",textAlign:"center",marginTop:40}}>Loading...</p></ProtectedLayout>;

  return (
    <ProtectedLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.bar-fill{transition:width 0.8s cubic-bezier(0.4,0,0.2,1);}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em"}}>Insights</div>
          <h2 style={{color:"var(--text-primary)",margin:"2px 0 0",fontSize:24,fontWeight:700}}>Reports</h2>
          <p style={{color:"var(--text-secondary)",margin:"4px 0 0",fontSize:14}}>{monthName}</p>
        </div>
        <button onClick={exportCombined} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,boxShadow:"var(--shadow-glow-blue)"}}><Download size={14}/> Export Excel</button>
      </div>

      {/* Month navigation (primary — monthly billing) */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{display:"inline-flex",alignItems:"center",background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:10,overflow:"hidden"}}>
          <button onClick={()=>goMonth(-1)} title="Previous month" style={{padding:"9px 14px",border:"none",background:"transparent",cursor:"pointer",color:"var(--text-secondary)",fontSize:16,fontWeight:800}}>‹</button>
          <span style={{padding:"9px 8px",minWidth:150,textAlign:"center",fontSize:14,fontWeight:800,color:"var(--text-primary)"}}>{isFullMonth?monthTitle:"Custom range"}</span>
          <button onClick={()=>goMonth(1)} disabled={atCurrentMonth&&isFullMonth} title="Next month" style={{padding:"9px 14px",border:"none",background:"transparent",cursor:(atCurrentMonth&&isFullMonth)?"not-allowed":"pointer",color:"var(--text-secondary)",fontSize:16,fontWeight:800,opacity:(atCurrentMonth&&isFullMonth)?0.35:1}}>›</button>
        </div>
        {!(atCurrentMonth&&isFullMonth) && (
          <button onClick={()=>{ setFrom(mStart()); setTo(mEnd()); }} style={{padding:"9px 16px",borderRadius:10,border:"1px solid var(--accent-primary)",background:"var(--grade-b-bg)",color:"var(--grade-b-text)",fontSize:13,fontWeight:700,cursor:"pointer"}}>This month</button>
        )}
      </div>

      {/* Custom date range filter */}
      <FilterPanel
        dateRange
        initial={{ from, to }}
        onApply={(v)=>{ setFrom(v.from || mStart()); setTo(v.to || mEnd()); }}
      />
      {/* Compact KPI strip — slim single-line cards, 2×2 on phone, 4-across on desktop */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:18}}>
        {[
          {label:"Total revenue", value:`₹${totalRevenue.toLocaleString()}`,                     icon:<IndianRupee size={16}/>, iconBg:"var(--grade-b-bg)", iconColor:"var(--grade-b-text)"},
          {label:"Expenses",      value:`₹${totalExpense.toLocaleString()}`,                     icon:<ShoppingBag size={16}/>, iconBg:"var(--grade-f-bg)", iconColor:"var(--grade-f-text)"},
          {label:"Net (after expense)", value:`₹${netAfterExpense.toLocaleString()}`,            icon:<TrendingUp size={16}/>,  iconBg: netAfterExpense>=0?"var(--grade-a-bg)":"var(--grade-f-bg)", iconColor: netAfterExpense>=0?"var(--grade-a-text)":"var(--grade-f-text)"},
        ].map((stat,i)=>(
          <div key={i} style={{background:"var(--bg-card)",borderRadius:12,padding:"11px 13px",border:"1px solid var(--border-hard)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:9,background:stat.iconBg,display:"flex",alignItems:"center",justifyContent:"center",color:stat.iconColor,flexShrink:0}}>{stat.icon}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:10.5,fontWeight:600,color:"var(--text-secondary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{stat.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:stat.iconColor,lineHeight:1.2}}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Tabs — single scrollable row on mobile (no wrapping to 3 lines) */}
      <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
        {([["daily","Daily"],["orders","Orders"],["collection","Collection"],["balance","Balance"],["expense","Expense"],["labour","Labour"],["services","Services"],["society","Society"],["customers","Customers"]] as [typeof activeTab,string][]).map(([tab,lbl])=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"8px 18px",border:"none",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0,whiteSpace:"nowrap",
            background:activeTab===tab?"#2563eb":"var(--bg-input)",
            color:activeTab===tab?"#fff":"var(--text-secondary)",
            transition:"all 0.15s"}}>
            {lbl}
          </button>
        ))}
      </div>
      <div style={{background:"var(--bg-card)",borderRadius:14,padding:24,border:"1px solid var(--border-hard)"}}>
        {activeTab==="daily"&&<div>
          <h3 style={{margin:"0 0 20px",color:"var(--text-primary)",fontSize:16,fontWeight:700}}>Daily Earnings — {monthName}</h3>
          {dailyData.length===0
            ? <EmptyState compact title="No data" subtitle={`Nothing for ${monthName} yet.`}/>
            : <Bars data={dailyData.map(([date,amount])=>({label:String(new Date(date+"T00:00:00").getDate()),value:amount}))}/>}
        </div>}
        {activeTab==="services"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Service-wise Revenue</h3>
          {serviceData.length===0?<EmptyState compact title="No data" subtitle={`Nothing for ${monthName} yet.`}/>:<div>
            <div style={{marginBottom:22}}>
              <Donut segments={serviceData.map(([name,data],i)=>({label:name,value:data.revenue,color:PALETTE[i%PALETTE.length]}))} centerLabel="Revenue"/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {serviceData.map(([name,data],i)=><div key={name}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{name}</span><span style={{fontSize:13,fontWeight:700,color:PALETTE[i%PALETTE.length]}}>₹{data.revenue.toLocaleString()} <span style={{fontWeight:400,color:"var(--text-muted)"}}>({data.qty} pcs)</span></span></div><div style={{height:14,background:"var(--bg-input)",borderRadius:7,overflow:"hidden"}}><div className="bar-fill" style={{height:"100%",width:`${(data.revenue/maxSvcRev)*100}%`,background:"linear-gradient(90deg,#6EA8FF,#3f7fe0)",borderRadius:7,minWidth:4}}/></div></div>)}
            </div>
          </div>}
        </div>}
        {activeTab==="society"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Society-wise Revenue</h3>
          {societyData.length===0?<EmptyState compact title="No data" subtitle={`Nothing for ${monthName} yet.`}/>:<div style={{display:"flex",flexDirection:"column",gap:14}}>
            {societyData.map(([name,data],i)=>{ const color=PALETTE[i%PALETTE.length]; const exp=expandedSociety===name; const custList=[...data.customers.values()].sort((a,b)=>b.revenue-a.revenue); return (
              <div key={name}>
                <div onClick={()=>setExpandedSociety(exp?null:name)} style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"8px 10px",borderRadius:10,background:exp?`${color}10`:"transparent",border:exp?`1px solid ${color}30`:"1px solid transparent"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:`${color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{name}</span><span style={{fontSize:13,fontWeight:700,color}}>₹{data.revenue.toLocaleString()} <span style={{fontSize:11,color:"var(--text-muted)"}}>{custList.length} customers {exp?"▲":"▼"}</span></span></div><div style={{height:8,background:"var(--bg-input)",borderRadius:4,overflow:"hidden"}}><div className="bar-fill" style={{height:"100%",width:`${(data.revenue/maxSocRev)*100}%`,background:"linear-gradient(90deg,#6EA8FF,#3f7fe0)",borderRadius:4}}/></div></div>
                </div>
                {exp&&<div style={{marginLeft:46,marginTop:6,marginBottom:8,display:"flex",flexDirection:"column",gap:6}}>{custList.map((c,j)=><div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:"var(--bg-input)",borderRadius:8,border:"1px solid var(--border-hard)"}}><span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>👤 {c.name}</span><span style={{fontSize:13,fontWeight:700,color}}>₹{c.revenue.toLocaleString()}</span></div>)}</div>}
              </div>
            );})}
          </div>}
        </div>}
        {activeTab==="customers"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Top Customers</h3>
          {customerData.length===0?<EmptyState compact title="No data" subtitle={`Nothing for ${monthName} yet.`}/>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {customerData.slice(0,10).map((cust,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:i===0?"var(--grade-c-bg)":"var(--bg-input)",borderRadius:10,border:i===0?"1px solid var(--grade-c-border)":"1px solid var(--border-hard)"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7c2e":"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:i<3?"#fff":"var(--text-muted)",flexShrink:0}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{cust.name}</div><div style={{fontSize:12,color:"var(--text-secondary)"}}>{cust.flat&&`🏠 ${cust.flat} • `}{cust.count} entries</div></div>
                <div style={{fontWeight:800,fontSize:16,color:i===0?"var(--grade-c-text)":"var(--accent-primary)"}}>₹{cust.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>}
        </div>}
        {activeTab==="collection"&&(()=>{
          const billed = totalRevenue;
          const collected = coll.total;
          const outstanding = Math.max(0, billed - collected);
          const methods: [string,number,string][] = [["Cash",coll.cash,"#16a34a"],["UPI",coll.upi,"#2563eb"],["Card",coll.card,"#7c3aed"],["Other",coll.other,"#f59e0b"]];
          return (
            <div>
              <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Billing vs Collection — {monthName}</h3>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:22}}>
                {[
                  {label:"Billed",      value:billed,      bg:"var(--grade-b-bg)", bd:"var(--grade-b-border)", tc:"var(--grade-b-text)"},
                  {label:"Collected",   value:collected,   bg:"var(--grade-a-bg)", bd:"var(--grade-a-border)", tc:"var(--grade-a-text)"},
                  {label:"Outstanding (udhaar)", value:outstanding, bg:"var(--grade-c-bg)", bd:"var(--grade-c-border)", tc:"var(--grade-c-text)"},
                ].map((t,i)=>(
                  <div key={i} style={{background:t.bg,border:`1px solid ${t.bd}`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{fontSize:12,fontWeight:600,color:t.tc}}>{t.label}</div>
                    <div style={{fontSize:24,fontWeight:900,color:t.tc,marginTop:4}}>₹{t.value.toLocaleString("en-IN")}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:"var(--text-secondary)",marginBottom:12}}>Collected by method {coll.count>0?`· ${coll.count} payments`:""}</div>
              {collected===0?<EmptyState compact title="No collection" subtitle={`No payments received in ${monthName}.`}/>:(
                <Donut centerLabel="Collected" segments={methods.map(([name,amt,color])=>({label:name,value:amt,color}))}/>
              )}
            </div>
          );
        })()}

        {activeTab==="orders"&&(()=>{
          const rows=[...entries].sort((a,b)=>(b.invoice_no||0)-(a.invoice_no||0));
          const total=rows.reduce((s,e)=>s+Number(e.total_amount),0);
          const totPaid=rows.reduce((s,e)=>s+(e.amount_paid??0),0);
          return <div>
            <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Orders / Invoices — {monthName}</h3>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <TotalChip label="Orders" value={`${rows.length}`}/>
              <TotalChip label="Total Amount" value={`₹${total.toLocaleString("en-IN")}`}/>
              <TotalChip label="Collected" value={`₹${totPaid.toLocaleString("en-IN")}`}/>
            </div>
            <RepTable head={["Invoice","Date","Customer","Items","Amount (₹)","Paid (₹)","Balance (₹)","Status"]} empty={`No orders in ${monthName}.`}
              rows={rows.map(e=>{ const paid=e.amount_paid??0; const bal=Math.max(0,Number(e.total_amount)-paid); return [invFmt(e.invoice_no), fmtD(e.entry_date), e.customer?.name||"—", e.items.reduce((s,i)=>s+i.quantity,0), `₹${Number(e.total_amount).toLocaleString("en-IN")}`, `₹${paid.toLocaleString("en-IN")}`, `₹${bal.toLocaleString("en-IN")}`, isEntryDelivered(e)?"Delivered":(bal<=0?"Paid · Pending":"Pending")]; })}/>
          </div>;
        })()}

        {activeTab==="expense"&&(()=>{
          const rows=[...expenses].sort((a,b)=>b.date.localeCompare(a.date));
          const total=rows.reduce((s,x)=>s+Number(x.amount),0);
          return <div>
            <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Expense Report — {monthName}</h3>
            <TotalChip label="Total Expense" value={`₹${total.toLocaleString("en-IN")}`}/>
            <RepTable head={["Date","Category","Description","Amount (₹)"]} empty={`No expenses in ${monthName}.`}
              rows={rows.map(x=>[fmtD(x.date), x.category, x.description||"—", `₹${Number(x.amount).toLocaleString("en-IN")}`])}/>
          </div>;
        })()}

        {activeTab==="balance"&&(()=>{
          const rows=[...balances].filter(b=>Number(b.outstanding)>0).sort((a,b)=>Number(b.outstanding)-Number(a.outstanding));
          const total=rows.reduce((s,b)=>s+Number(b.outstanding),0);
          return <div>
            <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Balance Report (Udhaar)</h3>
            <TotalChip label="Total Balance Amount" value={`₹${total.toLocaleString("en-IN")}`}/>
            <RepTable head={["Customer","Phone","Billed (₹)","Paid (₹)","Balance (₹)"]} empty="No outstanding balances — sab clear! 🎉"
              rows={rows.map(b=>[custMap[b.customer_id]?.name||"—", custMap[b.customer_id]?.phone||"—", `₹${Number(b.billed).toLocaleString("en-IN")}`, `₹${Number(b.paid).toLocaleString("en-IN")}`, `₹${Number(b.outstanding).toLocaleString("en-IN")}`])}/>
          </div>;
        })()}

        {activeTab==="labour"&&(()=>{
          // Aggregate per-labour for the range: earned (work) − advance = net; paid = actual payouts.
          const agg=new Map<string,{name:string;press:number;earned:number;advance:number;paid:number}>();
          const ensure=(id:string,name:string)=>{ if(!agg.has(id)) agg.set(id,{name,press:0,earned:0,advance:0,paid:0}); return agg.get(id)!; };
          labWorks.forEach(w=>{ const a=ensure(w.labour_id,w.labour_name); a.press+=Number(w.press_count); a.earned+=Number(w.total); });
          labAdvs.forEach(x=>{ const a=ensure(x.labour_id,x.labour_name); a.advance+=Number(x.amount); });
          labPays.forEach(p=>{ const a=ensure(p.labour_id,p.labour_name); a.paid+=Number(p.amount); });
          const rows=[...agg.values()].sort((a,b)=>b.earned-a.earned);
          const tEarned=rows.reduce((s,r)=>s+r.earned,0);
          const tAdvance=rows.reduce((s,r)=>s+r.advance,0);
          const tPaid=rows.reduce((s,r)=>s+r.paid,0);
          const tNet=tEarned-tAdvance;
          return <div>
            <h3 style={{margin:"0 0 14px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Labour Report — {monthName}</h3>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <TotalChip label="Earned" value={`₹${tEarned.toLocaleString("en-IN")}`}/>
              <TotalChip label="Advance" value={`₹${tAdvance.toLocaleString("en-IN")}`}/>
              <TotalChip label="Net payable" value={`₹${tNet.toLocaleString("en-IN")}`}/>
              <TotalChip label="Paid out" value={`₹${tPaid.toLocaleString("en-IN")}`}/>
            </div>
            <RepTable head={["Labour","Pieces","Earned (₹)","Advance (₹)","Net (₹)","Paid (₹)"]} empty={`No labour activity in ${monthName}.`}
              rows={rows.map(r=>[r.name, r.press, `₹${r.earned.toLocaleString("en-IN")}`, `₹${r.advance.toLocaleString("en-IN")}`, `₹${(r.earned-r.advance).toLocaleString("en-IN")}`, `₹${r.paid.toLocaleString("en-IN")}`])}/>
          </div>;
        })()}
      </div>
    </ProtectedLayout>
  );
}
