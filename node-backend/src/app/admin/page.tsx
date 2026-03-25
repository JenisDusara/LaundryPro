"use client";
import { useState, useEffect } from "react";
import { Settings, Users, Download, Key } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";

export default function Admin() {
  const [tab, setTab] = useState<"settings"|"users"|"backup"|"password">("settings");
  const [shopName, setShopName] = useState(""); const [contact, setContact] = useState(""); const [address, setAddress] = useState(""); const [settingsMsg, setSettingsMsg] = useState("");
  const [admins, setAdmins] = useState<{id:string;username:string;created_at:string}[]>([]);
  const [newUsername, setNewUsername] = useState(""); const [newPassword, setNewPassword] = useState(""); const [userMsg, setUserMsg] = useState("");
  const [oldPass, setOldPass] = useState(""); const [newPass, setNewPass] = useState(""); const [passMsg, setPassMsg] = useState("");

  useEffect(()=>{ api.get("/admin/settings").then(r=>{setShopName(r.data.shop_name);setContact(r.data.contact);setAddress(r.data.address);}); api.get("/admin/users").then(r=>setAdmins(r.data)); },[]);

  const saveSettings = async () => { await api.put("/admin/settings",{shop_name:shopName,contact,address}); setSettingsMsg("✅ Saved!"); setTimeout(()=>setSettingsMsg(""),3000); };
  const createAdmin = async () => { if(!newUsername||!newPassword)return; try { await api.post("/admin/users",{username:newUsername,password:newPassword}); setNewUsername("");setNewPassword("");setUserMsg("✅ Admin created!"); api.get("/admin/users").then(r=>setAdmins(r.data)); } catch(e:any){setUserMsg("❌ "+(e.response?.data?.detail||"Error"));} setTimeout(()=>setUserMsg(""),3000); };
  const deleteAdmin = async (id:string) => { if(!confirm("Delete?"))return; await api.delete(`/admin/users/${id}`); api.get("/admin/users").then(r=>setAdmins(r.data)); };
  const changePassword = async () => { if(!oldPass||!newPass)return; try { await api.post("/admin/change-password",{old_password:oldPass,new_password:newPass}); setOldPass("");setNewPass("");setPassMsg("✅ Changed!"); } catch(e:any){setPassMsg("❌ "+(e.response?.data?.detail||"Error"));} setTimeout(()=>setPassMsg(""),3000); };
  const backup = () => window.open(`/api/admin/backup?token=${localStorage.getItem("token")}`,"_blank");

  const inp: React.CSSProperties = {width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,marginBottom:12,outline:"none",boxSizing:"border-box"};
  const btn: React.CSSProperties = {padding:"10px 20px",background:"#1e40af",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:600};
  const msg: React.CSSProperties = {padding:"8px 12px",background:"#f0fdf4",color:"#16a34a",borderRadius:6,marginBottom:12,fontSize:13};

  return (
    <ProtectedLayout>
      <h2 style={{color:"#1e3a8a",marginBottom:16}}>Admin Panel</h2>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {([["settings","⚙️ Shop Settings"],["users","👥 Manage Users"],["backup","💾 Backup"],["password","🔑 Password"]] as const).map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{padding:"8px 16px",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,background:tab===key?"#1e40af":"#e2e8f0",color:tab===key?"#fff":"#475569"}}>{label}</button>
        ))}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:24,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",maxWidth:500}}>
        {tab==="settings"&&<div>
          <h3 style={{color:"#1e3a8a",marginBottom:16,fontSize:16}}>Shop Settings</h3>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>Shop Name</label><input style={inp} value={shopName} onChange={e=>setShopName(e.target.value)}/>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>Contact</label><input style={inp} value={contact} onChange={e=>setContact(e.target.value)}/>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>Address</label><input style={inp} value={address} onChange={e=>setAddress(e.target.value)}/>
          {settingsMsg&&<div style={msg}>{settingsMsg}</div>}
          <button style={btn} onClick={saveSettings}>Save Settings</button>
        </div>}
        {tab==="users"&&<div>
          <h3 style={{color:"#1e3a8a",marginBottom:16,fontSize:16}}>Admin Users</h3>
          <div style={{marginBottom:8}}>
            {admins.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}><div><div style={{fontWeight:600}}>{a.username}</div><div style={{fontSize:12,color:"#94a3b8"}}>Created: {new Date(a.created_at).toLocaleDateString("en-IN")}</div></div><button onClick={()=>deleteAdmin(a.id)} style={{padding:"4px 12px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:600}}>Delete</button></div>)}
          </div>
          <h3 style={{color:"#1e3a8a",marginTop:24,marginBottom:16,fontSize:16}}>Add New Admin</h3>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>Username</label><input style={inp} value={newUsername} onChange={e=>setNewUsername(e.target.value)} placeholder="Username"/>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>Password</label><input style={inp} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Password"/>
          {userMsg&&<div style={msg}>{userMsg}</div>}
          <button style={btn} onClick={createAdmin}>Create Admin</button>
        </div>}
        {tab==="backup"&&<div>
          <h3 style={{color:"#1e3a8a",marginBottom:16,fontSize:16}}>Backup Data</h3>
          <p style={{color:"#64748b",marginBottom:16,fontSize:14}}>Download a complete JSON backup of all data.</p>
          <button style={btn} onClick={backup}>⬇️ Download Backup</button>
        </div>}
        {tab==="password"&&<div>
          <h3 style={{color:"#1e3a8a",marginBottom:16,fontSize:16}}>Change Password</h3>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>Current Password</label><input style={inp} type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Current password"/>
          <label style={{display:"block",fontSize:13,color:"#475569",marginBottom:4}}>New Password</label><input style={inp} type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="New password"/>
          {passMsg&&<div style={msg}>{passMsg}</div>}
          <button style={btn} onClick={changePassword}>Change Password</button>
        </div>}
      </div>
    </ProtectedLayout>
  );
}
