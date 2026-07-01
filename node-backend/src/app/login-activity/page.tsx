"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, Search, RefreshCw, Shield, User } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

interface Log {
  id: string; username: string; name: string;
  shop_name: string; role: string; status: "success" | "failed";
  reason: string; ip: string; created_at: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return "Yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

const AVATAR_COLORS = ["#1d4ed8","#7c3aed","#059669","#d97706","#be185d","#0891b2"];
function avatarColor(str: string) { return AVATAR_COLORS[str.charCodeAt(0) % AVATAR_COLORS.length]; }

export default function LoginActivityPage() {
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState<"all"|"success"|"failed">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string,string> = { limit: "200" };
      if (filter !== "all") params.status = filter;
      const res = await api.get("/admin/login-logs", { params });
      setLogs(res.data);
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
        @keyframes spin{to{transform:rotate(360deg)}}
        .log-row:hover{background:var(--pressed)!important}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>Super Admin</div>
          <h2 style={{color:"var(--text-primary)",margin:"0 0 4px",fontSize:26,fontWeight:900,letterSpacing:-0.5}}>Login activity</h2>
          <p style={{color:"var(--text-muted)",fontSize:13,margin:0}}>Authentication events across every shop</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",border:"1px solid var(--border-hard)",borderRadius:10,background:"var(--bg-card)",color:"var(--text-secondary)",fontSize:13,fontWeight:600,cursor:"pointer"}}>
          <RefreshCw size={14} style={{animation:loading?"spin 1s linear infinite":undefined}}/> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:24}}>
        {[
          {label:"Total logins",    value:logs.length,  icon:<Activity size={18}/>,     iconBg:"rgba(29,78,216,0.15)",  iconColor:"#3b82f6"},
          {label:"Successful",      value:successCount, icon:<CheckCircle2 size={18}/>, iconBg:"rgba(5,150,105,0.15)",  iconColor:"#10b981"},
          {label:"Failed attempts", value:failedCount,  icon:<XCircle size={18}/>,      iconBg:"rgba(239,68,68,0.15)",  iconColor:"#ef4444"},
          {label:"Unique users",    value:uniqueUsers,  icon:<User size={18}/>,         iconBg:"rgba(245,158,11,0.15)", iconColor:"#f59e0b"},
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

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200,position:"relative"}}>
          <Search size={15} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
          <input placeholder="Search by user, name, shop, IP…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:"100%",padding:"10px 14px 10px 38px",border:"1px solid var(--border-hard)",borderRadius:10,fontSize:13,outline:"none",background:"var(--bg-input)",boxSizing:"border-box",color:"var(--text-primary)"}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          {(["all","success","failed"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:"9px 18px",border:"none",borderRadius:20,cursor:"pointer",fontWeight:700,fontSize:13,
                background:filter===f?"#2563eb":"var(--bg-input)",
                color:filter===f?"#fff":"var(--text-secondary)",
                transition:"all 0.15s"}}>
              {f==="all"?"All":f==="success"?"Success":"Failed"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mob-scroll" style={{borderRadius:14}}>
      <div style={{background:"var(--bg-card)",border:"1px solid var(--border-hard)",borderRadius:14,overflow:"hidden",minWidth:580}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1.2fr 1fr",padding:"12px 20px",background:"var(--bg-elevated)",borderBottom:"1px solid var(--border-hard)"}}>
          {["Account","Shop / Role","Status","IP Address","Time"].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{padding:"60px 20px",textAlign:"center",color:"var(--text-muted)"}}>
            <RefreshCw size={28} style={{margin:"0 auto 12px",display:"block",opacity:0.3,animation:"spin 1s linear infinite"}}/>
            <div style={{fontWeight:600}}>Loading activity…</div>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{padding:"60px 20px",textAlign:"center",color:"var(--text-muted)"}}>
            <Shield size={36} style={{margin:"0 auto 12px",display:"block",opacity:0.2}}/>
            <div style={{fontWeight:600}}>No logs found</div>
          </div>
        ) : (
          <div>
            {displayed.map((log,i)=>(
              <div key={log.id} className="log-row"
                style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1.2fr 1fr",padding:"14px 20px",borderBottom:i<displayed.length-1?"1px solid var(--border-hard)":"none",alignItems:"center"}}>

                {/* Account */}
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:`${avatarColor(log.username)}22`,display:"flex",alignItems:"center",justifyContent:"center",color:avatarColor(log.username),fontWeight:800,fontSize:15,flexShrink:0}}>
                    {(log.name||log.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{log.name||log.username}</div>
                    <div style={{fontSize:12,color:"var(--text-muted)",marginTop:1}}>@{log.username}</div>
                  </div>
                </div>

                {/* Shop / Role */}
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:"var(--text-primary)"}}>{log.shop_name||"—"}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginTop:1,textTransform:"capitalize"}}>{log.role}</div>
                </div>

                {/* Status */}
                <div>
                  {log.status==="success" ? (
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(5,150,105,0.12)",border:"1px solid rgba(5,150,105,0.3)",borderRadius:20,padding:"5px 12px"}}>
                      <CheckCircle2 size={13} color="#10b981"/>
                      <span style={{fontSize:12,fontWeight:700,color:"#10b981"}}>Success</span>
                    </div>
                  ) : (
                    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:20,padding:"5px 12px"}}>
                      <XCircle size={13} color="#ef4444"/>
                      <span style={{fontSize:12,fontWeight:700,color:"#ef4444"}}>Failed</span>
                    </div>
                  )}
                  {log.status==="failed"&&log.reason&&(
                    <div style={{fontSize:11,color:"var(--text-muted)",marginTop:3}}>{log.reason}</div>
                  )}
                </div>

                {/* IP */}
                <div style={{fontSize:13,fontWeight:500,color:"var(--text-secondary)",fontFamily:"monospace"}}>{log.ip}</div>

                {/* Time */}
                <div style={{fontSize:13,fontWeight:600,color:"var(--text-muted)"}}>{timeAgo(log.created_at)}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && displayed.length > 0 && (
          <div style={{padding:"12px 20px",borderTop:"1px solid var(--border-hard)",background:"var(--bg-elevated)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"var(--text-muted)"}}>Showing {displayed.length} of {logs.length} records</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{fontSize:12,fontWeight:600,color:"#10b981",background:"rgba(5,150,105,0.1)",border:"1px solid rgba(5,150,105,0.2)",padding:"3px 10px",borderRadius:6}}>{successCount} success</span>
              <span style={{fontSize:12,fontWeight:600,color:"#ef4444",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",padding:"3px 10px",borderRadius:6}}>{failedCount} failed</span>
            </div>
          </div>
        )}
      </div>
      </div>
    </ProtectedLayout>
  );
}
