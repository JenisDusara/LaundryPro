"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, RefreshCw, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface ReportLog {
  id: string; shop_id: string; shop_name: string;
  week_start: string; week_end: string;
  status: "sent" | "skipped" | "failed"; reason: string; created_at: string;
}

export default function WeeklyReportLogPage() {
  const router = useRouter();
  const [logs,    setLogs]    = useState<ReportLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me").then(r => {
      if (r.data.role !== "superadmin") { router.replace("/dashboard"); return; }
      load();
    }).catch(() => router.replace("/login"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    setLoading(true);
    api.get("/admin/weekly-report-logs").then(r => setLogs(r.data)).finally(() => setLoading(false));
  };

  const sentCount    = logs.filter(l => l.status === "sent").length;
  const skippedCount = logs.filter(l => l.status === "skipped").length;
  const failedCount  = logs.filter(l => l.status === "failed").length;

  return (
    <ProtectedLayout>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Super Admin</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Weekly report log</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>Sunday auto-email history — sent / skipped / failed per shop</p>
        </div>
        <button onClick={load} style={{width:38,height:38,borderRadius:10,border:"1px solid var(--border-hard)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}>
          <RefreshCw size={15} style={{animation:loading?"spin 1s linear infinite":undefined}}/>
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14,marginBottom:24}}>
        {[
          {label:"Sent",    value:sentCount,    icon:<CheckCircle2 size={18}/>, iconBg:"rgba(16,185,129,0.15)", iconColor:"#10b981"},
          {label:"Skipped", value:skippedCount, icon:<MinusCircle size={18}/>,  iconBg:"rgba(245,158,11,0.15)", iconColor:"#f59e0b"},
          {label:"Failed",  value:failedCount,  icon:<XCircle size={18}/>,      iconBg:"rgba(239,68,68,0.15)",  iconColor:"#ef4444"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-card)",borderRadius:14,padding:"16px 18px",border:"1px solid var(--border-hard)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.iconBg,display:"flex",alignItems:"center",justifyContent:"center",color:s.iconColor,flexShrink:0}}>{s.icon}</div>
              <span style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)"}}>{s.label}</span>
            </div>
            <div style={{fontSize:28,fontWeight:900,color:s.iconColor}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:14,overflow:"hidden"}}>
        {loading ? (
          <div style={{padding:"40px 20px",textAlign:"center",color:"var(--text-muted)",fontSize:13}}>Loading…</div>
        ) : logs.length === 0 ? (
          <div style={{padding:"40px 20px",textAlign:"center",color:"var(--text-muted)"}}>
            <Mail size={36} style={{margin:"0 auto 14px",display:"block",opacity:0.2}}/>
            <div style={{fontWeight:700,fontSize:14}}>No weekly reports sent yet</div>
          </div>
        ) : (
          <div className="mob-scroll">
          <div style={{minWidth:640}}>
            {logs.map((l,i) => {
              const cfg = l.status === "sent"
                ? {icon:<CheckCircle2 size={14}/>, color:"#10b981", bg:"rgba(16,185,129,0.1)"}
                : l.status === "skipped"
                ? {icon:<MinusCircle size={14}/>, color:"#f59e0b", bg:"rgba(245,158,11,0.1)"}
                : {icon:<XCircle size={14}/>, color:"#ef4444", bg:"rgba(239,68,68,0.1)"};
              return (
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderBottom:i<logs.length-1?"1px solid var(--border-hard)":"none"}}>
                  <div style={{width:32,height:32,borderRadius:9,background:cfg.bg,color:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {cfg.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:700,color:"var(--text-primary)"}}>{l.shop_name}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)"}}>
                      {l.week_start} to {l.week_end}
                      {l.reason && <span> · {l.reason}</span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:cfg.color,textTransform:"capitalize"}}>{l.status}</div>
                    <div style={{fontSize:11,color:"var(--text-muted)"}}>{new Date(l.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
