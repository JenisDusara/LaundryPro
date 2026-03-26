"use client";
import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, ShoppingBag, Users, Download } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry } from "@/types";

export default function Reports() {
  const [entries, setEntries] = useState<LaundryEntry[]>([]);
  const [monthVal, setMonthVal] = useState(()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily"|"services"|"society"|"customers">("daily");
  const [expandedSociety, setExpandedSociety] = useState<string|null>(null);

  useEffect(()=>{ setLoading(true); const [y,m]=monthVal.split("-"); api.get("/entries",{params:{year:parseInt(y),month:parseInt(m)}}).then(r=>setEntries(r.data)).finally(()=>setLoading(false)); },[monthVal]);

  const exportCombined = () => { const [y,m]=monthVal.split("-"); window.open(`/api/exports/combined?month=${m}&year=${y}&token=${localStorage.getItem("token")}`,"_blank"); };

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
  const monthName=new Date(monthVal+"-01").toLocaleString("en-IN",{month:"long",year:"numeric"});

  if(loading) return <ProtectedLayout><p style={{color:"#94a3b8",textAlign:"center",marginTop:40}}>Loading...</p></ProtectedLayout>;

  return (
    <ProtectedLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}.bar-fill{transition:width 0.8s cubic-bezier(0.4,0,0.2,1);}`}</style>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div><h2 style={{color:"#0f172a",margin:0,fontSize:24,fontWeight:700}}>Reports</h2><p style={{color:"#64748b",margin:"4px 0 0",fontSize:14}}>{monthName}</p></div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input type="month" value={monthVal} onChange={e=>setMonthVal(e.target.value)} style={{padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,outline:"none"}}/>
          <button onClick={exportCombined} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:"linear-gradient(135deg,#1e40af,#7c3aed)",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,boxShadow:"0 2px 8px rgba(30,64,175,0.3)"}}><Download size={14}/> Export Excel</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[{label:"Total Revenue",value:`₹${totalRevenue.toLocaleString()}`,icon:<IndianRupee size={20}/>,color:"#1e40af",bg:"#eff6ff",border:"#bfdbfe"},{label:"Total Entries",value:entries.length,icon:<ShoppingBag size={20}/>,color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"},{label:"Avg per Entry",value:`₹${avgPerEntry}`,icon:<TrendingUp size={20}/>,color:"#059669",bg:"#f0fdf4",border:"#bbf7d0"},{label:"Customers",value:uniqueCustomers,icon:<Users size={20}/>,color:"#d97706",bg:"#fffbeb",border:"#fde68a"}].map((stat,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:"16px 18px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",border:`1px solid ${stat.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:36,height:36,borderRadius:10,background:stat.bg,display:"flex",alignItems:"center",justifyContent:"center",color:stat.color}}>{stat.icon}</div><span style={{fontSize:12,color:"#64748b"}}>{stat.label}</span></div>
            <div style={{fontSize:22,fontWeight:800,color:stat.color}}>{stat.value}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16,background:"#f1f5f9",padding:4,borderRadius:10,width:"fit-content"}}>
        {(["daily","services","society","customers"] as const).map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"7px 16px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,background:activeTab===tab?"#fff":"transparent",color:activeTab===tab?"#1e40af":"#64748b",boxShadow:activeTab===tab?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>{tab==="daily"?"📅 Daily":tab==="services"?"🧺 Services":tab==="society"?"🏘️ Society":"👥 Customers"}</button>)}
      </div>
      <div style={{background:"#fff",borderRadius:14,padding:24,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        {activeTab==="daily"&&<div>
          <h3 style={{margin:"0 0 20px",color:"#0f172a",fontSize:16,fontWeight:700}}>Daily Earnings — {monthName}</h3>
          {dailyData.length===0?<p style={{color:"#94a3b8",textAlign:"center",padding:40}}>No data</p>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {dailyData.map(([date,amount])=>(
              <div key={date} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:32,fontSize:12,fontWeight:700,color:"#94a3b8",textAlign:"right"}}>{new Date(date+"T00:00:00").getDate()}</div>
                <div style={{flex:1,height:28,background:"#f1f5f9",borderRadius:6,overflow:"hidden",maxWidth:500}}>
                  <div className="bar-fill" style={{height:"100%",width:`${(amount/maxDaily)*100}%`,background:"linear-gradient(90deg,#3b82f6,#60a5fa)",borderRadius:6,display:"flex",alignItems:"center",paddingLeft:8,minWidth:2}}>
                    {(amount/maxDaily)>0.15&&<span style={{fontSize:11,fontWeight:700,color:"#fff"}}>₹{amount.toLocaleString()}</span>}
                  </div>
                </div>
                {(amount/maxDaily)<=0.15&&<div style={{fontSize:12,fontWeight:700,color:"#1e40af",width:70}}>₹{amount.toLocaleString()}</div>}
              </div>
            ))}
          </div>}
        </div>}
        {activeTab==="services"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700}}>Service-wise Revenue</h3>
          {serviceData.length===0?<p style={{color:"#94a3b8",textAlign:"center",padding:40}}>No data</p>:<div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
              {serviceData.map(([name,data],i)=><div key={name} style={{display:"flex",alignItems:"center",gap:6,background:"#f8fafc",padding:"6px 12px",borderRadius:20}}><div style={{width:10,height:10,borderRadius:"50%",background:PALETTE[i%PALETTE.length]}}/><span style={{fontSize:12,fontWeight:600,color:"#475569"}}>{name}</span><span style={{fontSize:12,fontWeight:800,color:PALETTE[i%PALETTE.length]}}>{Math.round((data.revenue/totalSvcRev)*100)}%</span></div>)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {serviceData.map(([name,data],i)=><div key={name}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600}}>{name}</span><span style={{fontSize:13,fontWeight:700,color:PALETTE[i%PALETTE.length]}}>₹{data.revenue.toLocaleString()} <span style={{fontWeight:400,color:"#94a3b8"}}>({data.qty} pcs)</span></span></div><div style={{height:14,background:"#f1f5f9",borderRadius:7,overflow:"hidden"}}><div className="bar-fill" style={{height:"100%",width:`${(data.revenue/maxSvcRev)*100}%`,background:PALETTE[i%PALETTE.length],borderRadius:7,minWidth:4}}/></div></div>)}
            </div>
          </div>}
        </div>}
        {activeTab==="society"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700}}>Society-wise Revenue</h3>
          {societyData.length===0?<p style={{color:"#94a3b8",textAlign:"center",padding:40}}>No data</p>:<div style={{display:"flex",flexDirection:"column",gap:14}}>
            {societyData.map(([name,data],i)=>{ const color=PALETTE[i%PALETTE.length]; const exp=expandedSociety===name; const custList=[...data.customers.values()].sort((a,b)=>b.revenue-a.revenue); return (
              <div key={name}>
                <div onClick={()=>setExpandedSociety(exp?null:name)} style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"8px 10px",borderRadius:10,background:exp?`${color}10`:"transparent",border:exp?`1px solid ${color}30`:"1px solid transparent"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:`${color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color,flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600}}>{name}</span><span style={{fontSize:13,fontWeight:700,color}}>₹{data.revenue.toLocaleString()} <span style={{fontSize:11,color:"#94a3b8"}}>{custList.length} customers {exp?"▲":"▼"}</span></span></div><div style={{height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}><div className="bar-fill" style={{height:"100%",width:`${(data.revenue/maxSocRev)*100}%`,background:color,borderRadius:4}}/></div></div>
                </div>
                {exp&&<div style={{marginLeft:46,marginTop:6,marginBottom:8,display:"flex",flexDirection:"column",gap:6}}>{custList.map((c,j)=><div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 14px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}><span style={{fontSize:13,fontWeight:600}}>👤 {c.name}</span><span style={{fontSize:13,fontWeight:700,color}}>₹{c.revenue.toLocaleString()}</span></div>)}</div>}
              </div>
            );})}
          </div>}
        </div>}
        {activeTab==="customers"&&<div>
          <h3 style={{margin:"0 0 20px",fontSize:16,fontWeight:700}}>Top Customers</h3>
          {customerData.length===0?<p style={{color:"#94a3b8",textAlign:"center",padding:40}}>No data</p>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
            {customerData.slice(0,10).map((cust,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:i===0?"#fffbeb":"#f8fafc",borderRadius:10,border:i===0?"1px solid #fde68a":"1px solid #f1f5f9"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"#94a3b8":i===2?"#cd7c2e":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:i<3?"#fff":"#64748b",flexShrink:0}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{cust.name}</div><div style={{fontSize:12,color:"#64748b"}}>{cust.flat&&`🏠 ${cust.flat} • `}{cust.count} entries</div></div>
                <div style={{fontWeight:800,fontSize:16,color:i===0?"#d97706":"#1e40af"}}>₹{cust.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>}
        </div>}
      </div>
    </ProtectedLayout>
  );
}
