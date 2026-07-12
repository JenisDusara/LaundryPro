"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Check, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, Phone, X, Minus, Plus } from "lucide-react";
import api from "@/lib/api";
import ProtectedLayout from "@/components/ProtectedLayout";
import ItemDeliver from "@/components/ItemDeliver";
import type { Customer, Service, LaundryEntry } from "@/types";

interface ManualItem { id:string; service_id:string; service_name:string; item_name:string; price:number; quantity:number; }
const COLORS=[
  {bg:"var(--grade-b-bg)",border:"var(--grade-b-border)",text:"var(--grade-b-text)"},
  {bg:"var(--grade-a-bg)",border:"var(--grade-a-border)",text:"var(--grade-a-text)"},
  {bg:"var(--grade-c-bg)",border:"var(--grade-c-border)",text:"var(--grade-c-text)"},
  {bg:"var(--grade-d-bg)",border:"var(--grade-d-border)",text:"var(--grade-d-text)"},
  {bg:"var(--grade-a-bg)",border:"var(--grade-a-border)",text:"var(--grade-a-text)"},
  {bg:"var(--grade-c-bg)",border:"var(--grade-c-border)",text:"var(--grade-c-text)"},
];

const statusConfig: Record<string,{color:string;bg:string;border:string;label:string;icon:React.ReactNode}> = {
  pending:     { color:"var(--grade-c-text)", bg:"var(--grade-c-bg)", border:"var(--grade-c-border)", label:"Pending",     icon:<Clock size={12}/> },
  in_delivery: { color:"var(--grade-b-text)", bg:"var(--grade-b-bg)", border:"var(--grade-b-border)", label:"In Delivery", icon:<Truck size={12}/> },
  delivered:   { color:"var(--grade-a-text)", bg:"var(--grade-a-bg)", border:"var(--grade-a-border)", label:"Delivered",   icon:<CheckCircle2 size={12}/> },
};

export default function NewEntry() {
  const [customers,        setCustomers]        = useState<Customer[]>([]);
  const [services,         setServices]         = useState<Service[]>([]);
  const [search,           setSearch]           = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer|null>(null);
  const [items,            setItems]            = useState<ManualItem[]>([]);
  const [notes,            setNotes]            = useState("");
  const [saving,           setSaving]           = useState(false);
  const [success,          setSuccess]          = useState(false);
  const [expandedGroups,   setExpandedGroups]   = useState<Set<string>>(new Set());
  const [openServices,     setOpenServices]     = useState<Set<string>>(new Set());
  const [pastEntries,      setPastEntries]      = useState<LaundryEntry[]>([]);
  const [pastLoading,      setPastLoading]      = useState(false);
  const [showDropdown,     setShowDropdown]     = useState(false);
  const [updatingId,       setUpdatingId]       = useState<string|null>(null);
  const [justDelivered,    setJustDelivered]    = useState<{service_name:string;quantity:number;pickup_date:string}[]>([]);
  const [deliveryDate,     setDeliveryDate]     = useState("");
  const [shopName,         setShopName]         = useState("");
  const router = useRouter();

  useEffect(() => {
    api.get("/customers").then(r=>setCustomers(r.data));
    api.get("/services").then(r=>setServices(r.data));
    api.get("/auth/me").then(r=>setShopName(r.data.shop_name||"")).catch(()=>{});
  }, []);

  // Search: name, flat, society, phone number
  const filtered = search.length > 0
    ? customers.filter(c =>
        c.flat_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.society_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
      )
    : [];

  const selectCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    setSearch(`${c.name} — ${c.flat_number} — ${c.phone}`);
    setShowDropdown(false);
    setPastLoading(true);
    try {
      const res = await api.get("/entries", { params: { customer_id: c.id } });
      setPastEntries(res.data);
    } catch { setPastEntries([]); }
    finally { setPastLoading(false); }
  };

  const reloadPast = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await api.get("/entries", { params: { customer_id: selectedCustomer.id } });
      setPastEntries(res.data);
    } catch { /* keep current list on failure */ }
  };

  const clearCustomer = () => {
    setSelectedCustomer(null); setSearch(""); setPastEntries([]); setShowDropdown(false); setJustDelivered([]);
  };

  const addItem      = (svc:Service) => setItems(prev=>[...prev,{id:Math.random().toString(),service_id:svc.id,service_name:svc.name,item_name:"",price:Number(svc.price)||0,quantity:1}]);
  const updateItem   = (id:string,field:keyof ManualItem,value:string|number) => setItems(prev=>prev.map(item=>item.id===id?{...item,[field]:value}:item));
  const removeItem   = (id:string) => setItems(prev=>prev.filter(item=>item.id!==id));
  const toggleGroup  = (id:string) => { const s=new Set(expandedGroups); s.has(id)?s.delete(id):s.add(id); setExpandedGroups(s); };

  const total = items.reduce((s,i)=>s+(Number(i.price)*Number(i.quantity)),0);

  const SHOP_NAME = shopName || "Your Laundry";

  const sendWAMsg = (phone: string, msg: string) => {
    const url = `whatsapp://send?phone=91${phone.replace(/\D/g,"").slice(-10)}&text=${encodeURIComponent(msg)}`;
    const a = document.createElement("a");
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const today = () => new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});

  const openWhatsApp = (customer: Customer, msgItems: ManualItem[]) => {
    const lines = msgItems.map(i=>`• ${i.item_name?`${i.service_name} - ${i.item_name}`:i.service_name} ×${i.quantity}`).join("\n");
    const msg = `Hi ${customer.name}! 🙏\n\n*${SHOP_NAME}*\n${today()}\n\n🧺 *New Pickup:*\n${lines}\n\nThank you for your business! 🙏\n— ${SHOP_NAME}`;
    sendWAMsg(customer.phone, msg);
  };

  const openDeliveryWhatsApp = (entryItems: {service_name:string;quantity:number}[]) => {
    if (!selectedCustomer) return;
    const lines = entryItems.map(i=>`• ${i.service_name} ×${i.quantity}`).join("\n");
    const msg = `Hi ${selectedCustomer.name}! 🙏\n\n*${SHOP_NAME}*\n${today()}\n\n✅ *Delivered:*\n${lines}\n\nThank you for your business! 🙏\n— ${SHOP_NAME}`;
    sendWAMsg(selectedCustomer.phone, msg);
  };

  const save = async (withWA = false) => {
    if(!selectedCustomer||items.length===0) return;
    setSaving(true);
    const savedItems = [...items];
    const savedCustomer = selectedCustomer;
    try {
      await api.post("/entries",{customer_id:selectedCustomer.id,notes,delivery_date:deliveryDate||null,items:items.map(i=>({service_id:i.service_id,service_name:i.item_name?`${i.service_name} - ${i.item_name}`:i.service_name,quantity:Number(i.quantity),price_per_unit:Number(i.price)}))});
      setSuccess(true); setItems([]); setNotes(""); setDeliveryDate("");
      const res = await api.get("/entries", { params: { customer_id: selectedCustomer.id } });
      setPastEntries(res.data);
      setTimeout(()=>setSuccess(false), 3000);
      if (withWA) {
        const jd = justDelivered;
        if (jd.length > 0) {
          const byDate = new Map<string, string[]>();
          jd.forEach(i => {
            if (!byDate.has(i.pickup_date)) byDate.set(i.pickup_date, []);
            byDate.get(i.pickup_date)!.push(`• ${i.service_name} ×${i.quantity}`);
          });
          const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          const deliveredLines = Array.from(byDate.entries())
            .map(([date, lines]) => `_(Pickup: ${formatDate(date)})_\n${lines.join("\n")}`)
            .join("\n\n");
          let msg = `Hi ${savedCustomer.name}! 🙏\n\n*${SHOP_NAME}*\n${today()}\n\n`;
          msg += `✅ *Delivered:*\n${deliveredLines}\n\n`;
          msg += `🧺 *New Pickup:*\n${savedItems.map(i=>`• ${i.item_name?`${i.service_name} - ${i.item_name}`:i.service_name} ×${i.quantity}`).join("\n")}\n\n`;
          msg += `Thank you for your business! 🙏\n— ${SHOP_NAME}`;
          sendWAMsg(savedCustomer.phone, msg);
        } else {
          openWhatsApp(savedCustomer, savedItems);
        }
        setJustDelivered([]);
      }
    } finally { setSaving(false); }
  };

  const topServices = services;

  const pendingEntries = pastEntries.filter(e =>
    e.delivery_status !== "delivered" && !e.items.every(i => i.item_status === "delivered")
  );

  const markDelivered = async (entryId: string) => {
    setUpdatingId(entryId);
    try {
      await api.patch(`/entries/${entryId}/status`, null, { params: { status: "delivered" } });
      const entry = pastEntries.find(e => e.id === entryId);
      if (entry) {
        const newItems = entry.items
          .filter(i => i.item_status !== "delivered")
          .map(i => ({ service_name: i.service_name, quantity: i.quantity, pickup_date: entry.entry_date }));
        setJustDelivered(jd => [...jd, ...newItems]);
      }
      setPastEntries(prev => prev.map(e => e.id === entryId
        ? { ...e, delivery_status: "delivered", items: e.items.map(i => ({ ...i, item_status: "delivered" })) }
        : e));
    } finally { setUpdatingId(null); }
  };

  const isDisabled = !selectedCustomer || items.length === 0 || saving;

  return (
    <ProtectedLayout>
      <style>{`
        .svc-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-web-lift); }
        .entry-row:hover { background: var(--bg-elevated) !important; }
        @media (max-width: 768px) {
          .mob-handle { display: block !important; }
          .mob-ne-close { display: flex !important; }
          .ne-grid-2col { grid-template-columns: 1fr !important; }
          .ne-actions { flex-direction: column !important; align-items: stretch !important; }
          .ne-save-btn { width: 100% !important; padding: 14px 20px !important; font-size: 15px !important; border-radius: 12px !important; }
        }
      `}</style>

      {/* Mobile handle bar */}
      <div className="mob-handle" style={{display:"none",textAlign:"center",marginBottom:6}}>
        <div style={{width:36,height:4,borderRadius:4,background:"var(--border-hard)",display:"inline-block"}} />
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h2 style={{color:"var(--text-primary)",marginBottom:2,marginTop:0,fontSize:22,fontWeight:800}}>New entry</h2>
          <p style={{color:"var(--text-secondary)",fontSize:13,margin:0}}>Add customer & services</p>
        </div>
        <button className="mob-ne-close" onClick={()=>router.back()}
          style={{display:"none",width:32,height:32,borderRadius:"50%",background:"var(--bg-elevated)",border:"1px solid var(--border-hard)",cursor:"pointer",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <X size={16} color="var(--text-secondary)"/>
        </button>
      </div>

      {success && (
        <div style={{background:"var(--grade-a-bg)",color:"var(--grade-a-text)",padding:"12px 16px",borderRadius:10,marginBottom:16,fontWeight:600,display:"flex",alignItems:"center",gap:8,border:"1px solid var(--grade-a-border)"}}>
          <Check size={18}/> Entry saved successfully!
        </div>
      )}

      {/* ── Customer Search ── */}
      <div className="web-card" style={{background:"var(--bg-card-solid)",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"var(--shadow-web-lift)",border:"1px solid var(--border-hard)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.1em"}}>Customer</div>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 14px",background:"var(--bg-input)"}}>
            <Search size={15} style={{color:"var(--text-muted)"}}/>
            <input
              style={{flex:1,border:"none",outline:"none",fontSize:14,background:"transparent",color:"var(--text-primary)"}}
              placeholder="Search by Name, Phone, Flat or Society..."
              value={search}
              onChange={e=>{ setSearch(e.target.value); setSelectedCustomer(null); setPastEntries([]); setShowDropdown(true); }}
              onFocus={()=>search.length>0&&setShowDropdown(true)}
            />
            {search && (
              <button onClick={clearCustomer} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:2,display:"flex"}}>✕</button>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showDropdown && filtered.length>0 && !selectedCustomer && (
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--bg-card-solid)",border:"1px solid var(--border)",borderRadius:12,zIndex:100,boxShadow:"var(--shadow-web-lift)",maxHeight:260,overflowY:"auto"}}>
              {filtered.map(c=>(
                <div key={c.id}
                  style={{padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid var(--web-bg-band)",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--grade-b-bg)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                  onClick={()=>selectCustomer(c)}
                >
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6EA8FF,#3f7fe0)",display:"flex",alignItems:"center",justifyContent:"center",color:"#0b1830",fontWeight:700,fontSize:14,flexShrink:0}}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{c.name}</div>
                      <div style={{fontSize:12,color:"var(--text-muted)",display:"flex",gap:10,marginTop:2,flexWrap:"wrap"}}>
                        <span style={{display:"flex",alignItems:"center",gap:3}}><Phone size={10}/> {c.phone}</span>
                        {c.flat_number&&<span>🏠 {c.flat_number}</span>}
                        {c.society_name&&<span>🏘️ {c.society_name}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected customer chip */}
        {selectedCustomer && (
          <div style={{marginTop:12,padding:"10px 14px",background:"var(--grade-a-bg)",borderRadius:10,border:"1px solid var(--grade-a-border)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#6EA8FF,#3f7fe0)",display:"flex",alignItems:"center",justifyContent:"center",color:"#0b1830",fontWeight:700,fontSize:14}}>
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:"var(--grade-a-text)"}}>{selectedCustomer.name}</div>
              <div style={{fontSize:12,color:"var(--grade-a-text)",display:"flex",gap:8,marginTop:1,opacity:0.8}}>
                <span><Phone size={10}/> {selectedCustomer.phone}</span>
                {selectedCustomer.flat_number&&<span>🏠 {selectedCustomer.flat_number}, {selectedCustomer.society_name}</span>}
              </div>
            </div>
            <Check size={18} style={{color:"var(--grade-a-text)"}}/>
          </div>
        )}
      </div>

      {/* ── Past History ── */}
      {selectedCustomer && (
        <div className="web-card" style={{background:"var(--bg-card-solid)",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"var(--shadow-web-lift)",border:"1px solid var(--border-hard)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--grade-c-text)",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em"}}>
            Past Entries — {selectedCustomer.name}
          </div>

          {pastLoading ? (
            <p style={{color:"var(--text-muted)",fontSize:13,textAlign:"center",padding:"12px 0"}}>Loading history...</p>
          ) : pendingEntries.length === 0 ? (
            <div style={{textAlign:"center",padding:"16px 0",color:"var(--text-muted)",fontSize:13}}>
              <div style={{fontSize:28,marginBottom:6}}>✅</div>
              {pastEntries.length === 0 ? "New customer — no past entries" : "All deliveries completed!"}
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* Pending notice */}
              <div style={{padding:"10px 14px",background:"var(--grade-c-bg)",border:"1px solid var(--grade-c-border)",borderRadius:8,marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,color:"var(--grade-c-text)"}}>{pendingEntries.length} pending {pendingEntries.length===1?"entry":"entries"} — mark as delivered before saving new pickup</span>
              </div>
              {pendingEntries.map(e => {
                const allDel = e.items.every(i => i.item_status === "delivered");
                const isUpdating = updatingId === e.id;
                const delCount = e.items.filter(i=>i.item_status==="delivered").length;
                return (
                  <div key={e.id} style={{background:"var(--grade-c-bg)",borderRadius:12,padding:"10px 14px",border:"1px solid var(--grade-c-border)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontWeight:700,fontSize:13,color:"var(--grade-c-text)"}}>📅 {new Date(e.entry_date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                        <span style={{fontSize:11,color:"var(--grade-c-text)",opacity:0.8}}>{delCount}/{e.items.length} done</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontWeight:700,fontSize:13,color:"var(--text-primary)"}}>₹{Number(e.total_amount)}</span>
                        {!allDel&&<button onClick={()=>markDelivered(e.id)} disabled={isUpdating}
                          style={{padding:"3px 10px",background:"var(--accent-success)",color:"#0b1830",border:"none",borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",boxShadow:"var(--shadow-glow-green)"}}>
                          {isUpdating?"...":"All ✓"}
                        </button>}
                        <button onClick={()=>openDeliveryWhatsApp(e.items)}
                          title="Send delivery WhatsApp"
                          style={{width:26,height:26,borderRadius:"50%",background:"var(--grade-a-bg)",border:"1px solid var(--grade-a-border)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--grade-a-text)"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        </button>
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                      {e.items.map(item => (
                        <ItemDeliver key={item.id} entryId={e.id} item={item} onChanged={reloadPast} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Select Services ── */}
      <div className="web-card" style={{background:"var(--bg-card-solid)",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"var(--shadow-web-lift)",border:"1px solid var(--border-hard)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:14,textTransform:"uppercase",letterSpacing:"0.1em"}}>Services</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {topServices.map((svc)=>{
            const children = svc.children || [];
            const isOpen = openServices.has(svc.id);
            const toggle = () => setOpenServices(prev=>{ const s=new Set(prev); s.has(svc.id)?s.delete(svc.id):s.add(svc.id); return s; });

            if(children.length === 0) return (
              <button key={svc.id} className="svc-btn" onClick={()=>addItem(svc)}
                style={{padding:"7px 14px",background:"var(--bg-input)",color:"var(--text-secondary)",border:"1px solid var(--border-hard)",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="var(--grade-b-bg)";e.currentTarget.style.borderColor="var(--grade-b-border)";e.currentTarget.style.color="var(--grade-b-text)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--bg-input)";e.currentTarget.style.borderColor="var(--border-hard)";e.currentTarget.style.color="var(--text-secondary)";}}>
                + {svc.name}
              </button>
            );

            return (
              <div key={svc.id} style={{position:"relative"}}>
                <button onClick={toggle}
                  style={{padding:"7px 14px",background:isOpen?"var(--grade-b-bg)":"var(--bg-input)",color:isOpen?"var(--grade-b-text)":"var(--text-secondary)",border:`1px solid ${isOpen?"var(--grade-b-border)":"var(--border-hard)"}`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:5,transition:"all 0.15s"}}>
                  {svc.name} {isOpen ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                </button>
                {isOpen&&(
                  <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"var(--bg-card-solid)",border:"1px solid var(--border)",borderRadius:8,zIndex:50,minWidth:160,maxWidth:"calc(100vw - 28px)",maxHeight:"min(55vh, 300px)",overflowY:"auto",overflowX:"hidden",boxShadow:"var(--shadow-web-lift)"}}>
                    {children.map(child=>(
                      <div key={child.id} onClick={()=>{ addItem(child); toggle(); }}
                        style={{padding:"8px 14px",fontSize:13,cursor:"pointer",display:"flex",justifyContent:"space-between",gap:12,color:"var(--text-primary)"}}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--bg-input)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <span>{child.name}</span>
                        <span style={{color:"var(--text-muted)",fontSize:12}}>₹{child.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Items ── */}
      {items.length>0&&(
        <div className="web-card" style={{background:"var(--bg-card-solid)",borderRadius:14,padding:"18px 20px",marginBottom:14,boxShadow:"var(--shadow-web-lift)",border:"1px solid var(--border-hard)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.1em"}}>Items ({items.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {items.map(item=>(
              <div key={item.id} style={{background:"var(--bg-elevated)",borderRadius:12,padding:"12px 14px",border:"1px solid var(--border-hard)"}}>
                {/* Row 1: name + delete */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontWeight:700,fontSize:14,color:"var(--text-primary)",flex:1,marginRight:8}}>{item.service_name}{item.item_name?` — ${item.item_name}`:""}</span>
                  <button onClick={()=>removeItem(item.id)} style={{width:30,height:30,borderRadius:8,background:"rgba(239,68,68,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Trash2 size={13} color="#ef4444"/>
                  </button>
                </div>
                {/* Row 2: qty controls + price + total */}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{display:"flex",alignItems:"center",background:"var(--bg-input)",borderRadius:8,border:"1px solid var(--border-hard)",overflow:"hidden"}}>
                    <button onClick={()=>updateItem(item.id,"quantity",Math.max(1,Number(item.quantity)-1))} style={{width:32,height:34,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}>
                      <Minus size={14}/>
                    </button>
                    <span style={{width:28,textAlign:"center",fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{item.quantity}</span>
                    <button onClick={()=>updateItem(item.id,"quantity",Number(item.quantity)+1)} style={{width:32,height:34,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}>
                      <Plus size={14}/>
                    </button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:3,background:"var(--bg-input)",border:"1px solid var(--border-hard)",borderRadius:8,padding:"0 10px",height:34,flex:1}}>
                    <span style={{fontSize:12,color:"var(--text-muted)"}}>₹</span>
                    <input type="number" style={{flex:1,border:"none",outline:"none",fontSize:13,fontWeight:600,background:"transparent",color:"var(--text-primary)"}} value={item.price} min={0} onChange={e=>updateItem(item.id,"price",e.target.value)}/>
                  </div>
                  <span style={{fontWeight:800,fontSize:15,color:"var(--accent-success)",minWidth:36,textAlign:"right"}}>₹{(Number(item.price)*Number(item.quantity)).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,marginTop:8,borderTop:"1px solid var(--border-hard)"}}>
            <span style={{color:"var(--text-secondary)",fontSize:13,fontWeight:500}}>Total</span>
            <span style={{fontWeight:700,fontSize:18,color:"var(--accent-success)"}}>₹{total.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* ── Delivery Date + Notes ── */}
      <div className="ne-grid-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div className="web-card" style={{background:"var(--bg-card-solid)",borderRadius:14,padding:"18px 20px",boxShadow:"var(--shadow-web-lift)",border:"1px solid var(--border-hard)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>
            Expected Delivery <span style={{fontSize:10,fontWeight:400,textTransform:"none",color:"var(--text-muted)"}}>(optional)</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="date" value={deliveryDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setDeliveryDate(e.target.value)}
              style={{flex:1,padding:"9px 12px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",background:"var(--bg-input)",color:"var(--text-primary)"}}/>
            {deliveryDate&&(
              <button onClick={()=>setDeliveryDate("")} style={{padding:"7px 10px",background:"var(--grade-f-bg)",border:"1px solid var(--grade-f-border)",borderRadius:7,fontSize:11,fontWeight:500,color:"var(--grade-f-text)",cursor:"pointer"}}>Clear</button>
            )}
          </div>
          {deliveryDate&&(
            <div style={{marginTop:6,fontSize:11,color:"var(--grade-c-text)",fontWeight:500}}>
              {new Date(deliveryDate+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}
            </div>
          )}
        </div>

        <div className="web-card" style={{background:"var(--bg-card-solid)",borderRadius:14,padding:"18px 20px",boxShadow:"var(--shadow-web-lift)",border:"1px solid var(--border-hard)"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>
            Notes <span style={{fontSize:10,fontWeight:400,textTransform:"none",color:"var(--text-muted)"}}>(optional)</span>
          </div>
          <textarea style={{width:"100%",padding:"9px 12px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit",color:"var(--text-primary)",background:"var(--bg-input)",height:72}} placeholder="Any special instructions..." value={notes} onChange={e=>setNotes(e.target.value)}/>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="ne-actions" style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:10,paddingTop:4,marginBottom:16}}>
        <button
          onClick={()=>{ setItems([]); setSelectedCustomer(null); setSearch(""); setNotes(""); setDeliveryDate(""); setPastEntries([]); }}
          style={{padding:"10px 22px",borderRadius:9,border:"1.5px solid var(--border)",background:"var(--bg-input)",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.15s"}}
        >
          Cancel
        </button>
        <button
          onClick={()=>save(true)}
          disabled={isDisabled}
          title="Save & Send WhatsApp"
          style={{
            padding:"10px 14px",borderRadius:9,fontSize:13,fontWeight:600,
            cursor:isDisabled?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:6,transition:"all 0.15s",
            ...(isDisabled
              ? {background:"var(--bg-input)",border:"1.5px solid var(--border)",color:"var(--text-secondary)",opacity:0.55}
              : {background:"var(--accent-success)",border:"none",color:"#0b1830",boxShadow:"var(--shadow-glow-green)"})
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          WA
        </button>
        <button
          className="ne-save-btn"
          onClick={()=>save(false)}
          disabled={isDisabled}
          style={{
            padding:"10px 28px",borderRadius:9,fontSize:14,fontWeight:700,
            cursor:isDisabled?"not-allowed":"pointer",transition:"all 0.15s",
            ...(isDisabled
              ? {background:"var(--bg-input)",border:"1.5px solid var(--border)",color:"var(--text-secondary)",opacity:0.55}
              : {background:"var(--accent-primary)",border:"none",color:"#0b1830",boxShadow:"var(--shadow-glow-blue)"})
          }}
        >
          {saving ? "Saving..." : total > 0 ? `Save entry · ₹${total}` : "Save entry"}
        </button>
      </div>
    </ProtectedLayout>
  );
}
