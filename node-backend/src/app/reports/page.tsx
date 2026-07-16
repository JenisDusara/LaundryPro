"use client";
import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, ShoppingBag, Users, Download } from "lucide-react";
import api from "@/lib/api";
import { downloadAuthedFile } from "@/lib/download";
import ProtectedLayout from "@/components/ProtectedLayout";
import EmptyState from "@/components/EmptyState";
import { FilterPanel } from "@/components/Filters";
import type { LaundryEntry } from "@/types";

export default function Reports() {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const mStart = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; };
  const mEnd   = () => { const d=new Date(); const e=new Date(d.getFullYear(), d.getMonth()+1, 0); return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`; };
  const [from, setFrom] = useState(mStart);
  const [to, setTo] = useState(mEnd);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily"|"services"|"society"|"customers"|"collection">("daily");
  const [expandedSociety, setExpandedSociety] = useState<string|null>(null);
  const [coll, setColl] = useState<{ total:number; cash:number; upi:number; card:number; other:number; count:number }>({ total:0, cash:0, upi:0, card:0, other:0, count:0 });

  useEffect(()=>{ if(!from||!to) return; setLoading(true);
    Promise.all([
      api.get("/entries",{params:{from,to}}).then(r=>setEntries(r.data)),
      api.get("/payments",{params:{from,to}}).then(r=>setColl(r.data.summary)).catch(()=>setColl({ total:0, cash:0, upi:0, card:0, other:0, count:0 })),
    ]).finally(()=>setLoading(false));
  },[from,to]);

  const exportCombined = () => { downloadAuthedFile("/exports/combined",`LaundryPro-Report-${from}_${to}.xlsx`,{from,to}).catch(()=>alert("Failed to export report")); };

  const totalRevenue=entries.reduce((s,e)=>s+Number(e.total_amount),0);
  const uniqueCustomers=new Set(entries.map(e=>e.customer_id)).size;
  const avgPerEntry=entries.length>0?Math.round(totalRevenue/entries.length):0;

  const dailyMap=new Map<string,number>();
  entries.forEach(e=>dailyMap.set(e.entry_date,(dailyMap.get(e.entry_date)||0)+Number(e.total_amount)));
  const dailyData=[...dailyMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  const maxDaily=Math.max(...dailyData.map(d=>d[1]),1);

  const serviceMap=new Map<string,{qty:number;revenue:number}>();
  entries.forEach(e=>e.items.forEach(item=>{ const ex=serviceMap.get(item.service_name)||{qty:0,revenue:0}; ex.qty+=item.quantity; ex.revenue+=Number(item.subtotal); serviceMap.set(item.service_name,ex); }));
  const serviceData=[...serviceMap.entries()].sort((a,b)=>b[1].revenue-a[1].revenue);
  const maxSvcRev=Math.max(...serviceData.map(d=>d[1].revenue),1);
  const totalSvcRev=serviceData.reduce((s,[,d])=>s+d.revenue,0);

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

      {/* Date range filter (MyUniclean-style) */}
      <FilterPanel
        dateRange
        initial={{ from, to }}
        onApply={(v)=>{ setFrom(v.from || mStart()); setTo(v.to || mEnd()); }}
      />
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[
          {label:"Total revenue", value:`₹${totalRevenue.toLocaleString()}`, icon:<IndianRupee size={18}/>, iconBg:"var(--grade-a-bg)", iconColor:"var(--grade-a-text)"},
          {label:"Total entries",  value:entries.length,                     icon:<ShoppingBag size={18}/>, iconBg:"var(--grade-b-bg)", iconColor:"var(--grade-b-text)"},
          {label:"Avg per entry",  value:`₹${avgPerEntry}`,                  icon:<TrendingUp size={18}/>,  iconBg:"var(--grade-b-bg)", iconColor:"var(--grade-b-text)"},
          {label:"Customers",      value:uniqueCustomers,                     icon:<Users size={18}/>,       iconBg:"var(--grade-c-bg)", iconColor:"var(--grade-c-text)"},
        ].map((stat,i)=>(
          <div key={i} style={{background:"var(--bg-card)",borderRadius:14,padding:"16px 18px",border:"1px solid var(--border-hard)",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:stat.iconBg,display:"flex",alignItems:"center",justifyContent:"center",color:stat.iconColor,flexShrink:0}}>{stat.icon}</div>
              <span style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)"}}>{stat.label}</span>
            </div>
            <div style={{fontSize:24,fontWeight:900,color:stat.iconColor}}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {(["daily","services","society","customers","collection"] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"8px 18px",border:"none",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:700,
            background:activeTab===tab?"#2563eb":"var(--bg-input)",
            color:activeTab===tab?"#fff":"var(--text-secondary)",
            transition:"all 0.15s"}}>
            {tab==="daily"?"Daily":tab==="services"?"Services":tab==="society"?"Society":tab==="customers"?"Customers":"Collection"}
          </button>
        ))}
      </div>
      <div style={{background:"var(--bg-card)",borderRadius:14,padding:24,border:"1px solid var(--border-hard)"}}>
        {activeTab==="daily"&&<div>
          <h3 style={{margin:"0 0 20px",color:"var(--text-primary)",fontSize:16,fontWeight:700}}>Daily Earnings — {monthName}</h3>
          {dailyData.length===0?<EmptyState compact title="No data" subtitle={`Nothing for ${monthName} yet.`}/>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {dailyData.map(([date,amount])=>(
              <div key={date} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:32,fontSize:12,fontWeight:700,color:"var(--text-muted)",textAlign:"right"}}>{new Date(date+"T00:00:00").getDate()}</div>
                <div style={{flex:1,height:28,background:"var(--bg-input)",borderRadius:6,overflow:"hidden",maxWidth:500}}>
                  <div className="bar-fill" style={{height:"100%",width:`${(amount/maxDaily)*100}%`,background:"linear-gradient(90deg,#6EA8FF,#3f7fe0)",borderRadius:6,display:"flex",alignItems:"center",paddingLeft:8,minWidth:2}}>
                    {(amount/maxDaily)>0.15&&<span style={{fontSize:11,fontWeight:700,color:"#0b1830"}}>₹{amount.toLocaleString()}</span>}
                  </div>
                </div>
                {(amount/maxDaily)<=0.15&&<div style={{fontSize:12,fontWeight:700,color:"var(--accent-primary)",width:70}}>₹{amount.toLocaleString()}</div>}
              </div>
            ))}
          </div>}
        </div>}
        {activeTab==="services"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Service-wise Revenue</h3>
          {serviceData.length===0?<EmptyState compact title="No data" subtitle={`Nothing for ${monthName} yet.`}/>:<div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
              {serviceData.map(([name,data],i)=><div key={name} style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg-input)",padding:"6px 12px",borderRadius:20,border:"1px solid var(--border-hard)"}}><div style={{width:10,height:10,borderRadius:"50%",background:PALETTE[i%PALETTE.length]}}/><span style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)"}}>{name}</span><span style={{fontSize:12,fontWeight:800,color:PALETTE[i%PALETTE.length]}}>{Math.round((data.revenue/totalSvcRev)*100)}%</span></div>)}
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
          const maxM = Math.max(...methods.map(m=>m[1]),1);
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
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {methods.filter(m=>m[1]>0).map(([name,amt,color])=>(
                    <div key={name}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{name}</span>
                        <span style={{fontSize:13,fontWeight:700,color}}>₹{amt.toLocaleString("en-IN")}</span>
                      </div>
                      <div style={{height:14,background:"var(--bg-input)",borderRadius:7,overflow:"hidden"}}>
                        <div className="bar-fill" style={{height:"100%",width:`${(amt/maxM)*100}%`,background:color,borderRadius:7,minWidth:4}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </ProtectedLayout>
  );
}
