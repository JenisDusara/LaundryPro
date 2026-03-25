"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, IndianRupee, PlusCircle, Truck, Clock } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import type { LaundryEntry, Customer } from "@/types";

export default function Dashboard() {
  const router = useRouter();
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
    ]).then(([t, m, c]) => { setTodayEntries(t.data); setMonthEntries(m.data); setCustomers(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const todayTotal = todayEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const monthTotal = monthEntries.reduce((s, e) => s + Number(e.total_amount), 0);
  const pendingCount = todayEntries.filter(e => e.delivery_status === "pending").length;

  if (loading) return <ProtectedLayout><p style={{color:"#94a3b8",textAlign:"center",marginTop:40}}>Loading...</p></ProtectedLayout>;

  return (
    <ProtectedLayout>
      <h2 style={{color:"#1e3a8a",margin:0}}>Dashboard</h2>
      <p style={{color:"#64748b",fontSize:14,marginBottom:20}}>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
        {[
          {icon:<IndianRupee size={20} color="#1e40af"/>, value:`₹${todayTotal}`, label:"Today's Earning", border:"#1e40af"},
          {icon:<IndianRupee size={20} color="#059669"/>, value:`₹${monthTotal}`, label:"This Month", border:"#059669"},
          {icon:<Users size={20} color="#7c3aed"/>, value:customers.length, label:"Customers", border:"#7c3aed"},
          {icon:<Clock size={20} color="#d97706"/>, value:pendingCount, label:"Pending Delivery", border:"#d97706"},
        ].map((stat,i) => (
          <div key={i} style={{background:"#fff",borderRadius:10,padding:16,display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",borderLeft:`4px solid ${stat.border}`}}>
            {stat.icon}
            <div>
              <div style={{fontSize:20,fontWeight:700,color:"#1e293b"}}>{stat.value}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:24}}>
        <h3 style={{fontSize:16,color:"#1e293b",marginBottom:12}}>Quick Actions</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10}}>
          {[{icon:<PlusCircle size={24} color="#1e40af"/>,label:"New Entry",path:"/new-entry"},{icon:<Users size={24} color="#7c3aed"/>,label:"Customers",path:"/customers"},{icon:<ClipboardList size={24} color="#059669"/>,label:"View Entries",path:"/entries"},{icon:<Truck size={24} color="#d97706"/>,label:"Deliveries",path:"/deliveries"}].map((a,i) => (
            <div key={i} onClick={()=>router.push(a.path)} style={{background:"#fff",borderRadius:10,padding:16,display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",fontSize:13,fontWeight:500,color:"#475569"}}>
              {a.icon}<span>{a.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{fontSize:16,color:"#1e293b",marginBottom:12}}>Today&apos;s Entries ({todayEntries.length})</h3>
        {todayEntries.length===0 && <p style={{color:"#94a3b8",fontSize:14}}>No entries today</p>}
        {todayEntries.slice(0,5).map(entry => (
          <div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderRadius:8,padding:"10px 14px",marginBottom:6,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:"#1e293b"}}>{entry.customer?.name}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{entry.items.map(i=>`${i.service_name} ×${i.quantity}`).join(", ")}</div>
            </div>
            <div style={{fontWeight:700,fontSize:15,color:"#1e3a8a"}}>₹{entry.total_amount}</div>
          </div>
        ))}
        {todayEntries.length>5 && <div onClick={()=>router.push("/entries")} style={{textAlign:"center",color:"#3b82f6",fontSize:13,cursor:"pointer",padding:8}}>View all →</div>}
      </div>
    </ProtectedLayout>
  );
}
