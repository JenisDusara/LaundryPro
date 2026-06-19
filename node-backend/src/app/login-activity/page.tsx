"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, Search, RefreshCw, Shield, User, Wifi, Clock } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Log {
  id: string;
  username: string;
  name: string;
  shop_name: string;
  role: string;
  status: "success" | "failed";
  reason: string;
  ip: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true });
}

const AVATAR_COLORS = ["#1d4ed8","#7c3aed","#059669","#d97706","#be185d","#0891b2"];
function avatarColor(str: string) { return AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length]; }

export default function LoginActivityPage() {
  const [logs,     setLogs]     = useState<Log[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"all"|"success"|"failed">("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = { limit: "200" };
      if (filter !== "all") params.status = filter;
      const res = await api.get("/admin/login-logs", { params });
      setLogs(res.data);
      setLastRefresh(new Date());
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const displayed = logs.filter(l =>
    !search ||
    l.username.toLowerCase().includes(search.toLowerCase()) ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.shop_name.toLowerCase().includes(search.toLowerCase()) ||
    l.ip.includes(search)
  );

  const successCount = logs.filter(l => l.status === "success").length;
  const failedCount  = logs.filter(l => l.status === "failed").length;
  const uniqueUsers  = new Set(logs.map(l => l.username)).size;

  return (
    <ProtectedLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .log-row{transition:background 0.12s}
        .log-row:hover{background:#f8fafc!important}
      `}</style>

      {/* Header */}
      <div style={{animation:"fadeUp 0.3s ease both",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)",borderRadius:20,padding:"24px 28px",marginBottom:20,color:"#fff",boxShadow:"0 8px 32px rgba(49,46,129,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:50,height:50,borderRadius:14,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.2)"}}>
              <Activity size={24}/>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:22,letterSpacing:-0.3}}>Login Activity</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2}}>Track all authentication events across your system</div>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            style={{display:"flex",alignItems:"center",gap:8,padding:"9px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.12)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            <RefreshCw size={15} style={{animation:loading?"spin 1s linear infinite":undefined}}/>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:20}}>
        {[
          {label:"Total Logins",   value:logs.length,   icon:<Activity size={18}/>,     color:"#1d4ed8",bg:"linear-gradient(135deg,#eff6ff,#dbeafe)",border:"#93c5fd"},
          {label:"Successful",     value:successCount,  icon:<CheckCircle2 size={18}/>, color:"#059669",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",border:"#86efac"},
          {label:"Failed Attempts",value:failedCount,   icon:<XCircle size={18}/>,      color:"#dc2626",bg:"linear-gradient(135deg,#fef2f2,#fee2e2)",border:"#fca5a5"},
          {label:"Unique Users",   value:uniqueUsers,   icon:<User size={18}/>,         color:"#7c3aed",bg:"linear-gradient(135deg,#f5f3ff,#ede9fe)",border:"#c4b5fd"},
        ].map((s,i)=>(
          <div key={i} style={{animation:`fadeUp 0.3s ease ${i*0.07}s both`,background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:16,padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:600,color:"#475569"}}>{s.label}</span>
              <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",color:s.color}}>{s.icon}</div>
            </div>
            <div style={{fontSize:28,fontWeight:900,color:s.color,letterSpacing:-0.5}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        {/* Search */}
        <div style={{flex:1,minWidth:200,position:"relative"}}>
          <Search size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}/>
          <input placeholder="Search by user, name, shop, IP…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"10px 14px 10px 38px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,outline:"none",background:"#fff",boxSizing:"border-box",color:"#0f172a"}}/>
        </div>
        {/* Status filter */}
        <div style={{display:"flex",background:"#e2e8f0",borderRadius:12,padding:4,gap:4}}>
          {(["all","success","failed"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:"8px 16px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
                background:filter===f?"#fff":"transparent",
                color:filter===f?f==="failed"?"#dc2626":f==="success"?"#059669":"#1d4ed8":"#64748b",
                boxShadow:filter===f?"0 2px 8px rgba(0,0,0,0.08)":"none"}}>
              {f==="all"?"All":f==="success"?"Success":"Failed"}
            </button>
          ))}
        </div>
        <div style={{fontSize:12,color:"#94a3b8",whiteSpace:"nowrap"}}>
          <Clock size={12} style={{display:"inline",marginRight:4}}/>
          {fmtTime(lastRefresh.toISOString())}
        </div>
      </div>

      {/* Table */}
      <div style={{background:"#fff",borderRadius:18,border:"1.5px solid #e2e8f0",overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
        {/* Table header */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1.2fr 1fr",gap:0,padding:"12px 20px",background:"linear-gradient(135deg,#f8fafc,#f1f5f9)",borderBottom:"1.5px solid #e2e8f0"}}>
          {["Account","Shop / Role","Status","IP Address","Time"].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>

        {loading?(
          <div style={{padding:"60px 20px",textAlign:"center",color:"#94a3b8"}}>
            <RefreshCw size={28} style={{margin:"0 auto 12px",display:"block",opacity:0.3}}/>
            <div style={{fontWeight:600}}>Loading activity…</div>
          </div>
        ):displayed.length===0?(
          <div style={{padding:"60px 20px",textAlign:"center",color:"#94a3b8"}}>
            <Shield size={36} style={{margin:"0 auto 12px",display:"block",opacity:0.2}}/>
            <div style={{fontWeight:600}}>No logs found</div>
          </div>
        ):(
          <div>
            {displayed.map((log,i)=>(
              <div key={log.id} className="log-row"
                style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1.2fr 1fr",gap:0,padding:"14px 20px",borderBottom:i<displayed.length-1?"1px solid #f1f5f9":"none",alignItems:"center",background:"#fff"}}>

                {/* Account */}
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${avatarColor(log.username)},${avatarColor(log.username)}aa)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0}}>
                    {(log.name||log.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{log.name||log.username}</div>
                    <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>@{log.username}</div>
                  </div>
                </div>

                {/* Shop / Role */}
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:"#374151"}}>{log.shop_name||"—"}</div>
                  <div style={{display:"inline-block",marginTop:3,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:5,
                    background:log.role==="superadmin"?"linear-gradient(135deg,#fbbf24,#f59e0b)":"#eff6ff",
                    color:log.role==="superadmin"?"#78350f":"#1d4ed8"}}>
                    {log.role==="superadmin"?"SUPERADMIN":"ADMIN"}
                  </div>
                </div>

                {/* Status */}
                <div>
                  {log.status==="success"?(
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:8,padding:"5px 12px"}}>
                      <CheckCircle2 size={13} color="#059669"/>
                      <span style={{fontSize:12,fontWeight:700,color:"#059669"}}>Success</span>
                    </div>
                  ):(
                    <div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#fef2f2",border:"1.5px solid #fca5a5",borderRadius:8,padding:"5px 12px",marginBottom:4}}>
                        <XCircle size={13} color="#dc2626"/>
                        <span style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>Failed</span>
                      </div>
                      {log.reason&&<div style={{fontSize:11,color:"#94a3b8"}}>{log.reason}</div>}
                    </div>
                  )}
                </div>

                {/* IP */}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <Wifi size={13} color="#94a3b8"/>
                  <span style={{fontSize:13,fontWeight:500,color:"#475569",fontFamily:"monospace"}}>{log.ip}</span>
                </div>

                {/* Time */}
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#374151"}}>{timeAgo(log.created_at)}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{fmtTime(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading&&displayed.length>0&&(
          <div style={{padding:"12px 20px",borderTop:"1.5px solid #f1f5f9",background:"#f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#94a3b8"}}>Showing {displayed.length} of {logs.length} records</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{fontSize:12,fontWeight:600,color:"#059669",background:"#f0fdf4",border:"1px solid #86efac",padding:"3px 10px",borderRadius:6}}>✓ {successCount} success</span>
              <span style={{fontSize:12,fontWeight:600,color:"#dc2626",background:"#fef2f2",border:"1px solid #fca5a5",padding:"3px 10px",borderRadius:6}}>✕ {failedCount} failed</span>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
