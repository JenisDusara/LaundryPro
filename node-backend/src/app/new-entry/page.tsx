"use client";
import { useState, useEffect, useRef } from "react";
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

// WhatsApp glyph reused in a couple of buttons.
const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

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
  // Entries marked delivered "silently" on this page but not yet folded into a combined
  // pickup message. Kept in a ref so an unmount flush can still notify the customer if the
  // user navigates away without saving a new entry (otherwise the delivery note is lost).
  const [pendingDeliverIds, setPendingDeliverIds] = useState<string[]>([]);
  const pendingDeliverRef = useRef<string[]>([]);
  const [deliveryDate,     setDeliveryDate]     = useState("");
  const [shopName,         setShopName]         = useState("");
  // Billing (discount / extra charge / payment at billing)
  const [discount,         setDiscount]         = useState("");
  const [extraCharge,      setExtraCharge]      = useState("");
  const [payMethod,        setPayMethod]        = useState<"cash"|"upi"|"online"|"later">("later");
  const [amountPaid,       setAmountPaid]       = useState("");   // received now; blank until a method is picked
  const router = useRouter();

  useEffect(() => { pendingDeliverRef.current = pendingDeliverIds; }, [pendingDeliverIds]);
  useEffect(() => () => {
    // On unmount: any still-deferred delivery gets its own (non-silent) notification so
    // the customer is always informed, even if no combined pickup was saved.
    pendingDeliverRef.current.forEach(id =>
      api.patch(`/entries/${id}/status`, null, { params: { status: "delivered" } }).catch(() => {}));
  }, []);

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
  // Billing
  const discountN  = Math.max(0, Number(discount) || 0);
  const extraN     = Math.max(0, Number(extraCharge) || 0);
  const grandTotal = Math.max(0, total - discountN + extraN);
  const paidN      = payMethod === "later" ? 0 : Math.max(0, Number(amountPaid) || 0);
  const balance    = Math.max(0, grandTotal - paidN);
  const pickMethod = (m:"cash"|"upi"|"online"|"later") => { setPayMethod(m); setAmountPaid(m==="later" ? "" : String(grandTotal)); };

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

  const openDeliveryWhatsApp = (entryItems: {service_name:string;quantity:number}[]) => {
    if (!selectedCustomer) return;
    const lines = entryItems.map(i=>`• ${i.service_name} ×${i.quantity}`).join("\n");
    const msg = `Hi ${selectedCustomer.name}! 🙏\n\n*${SHOP_NAME}*\n${today()}\n\n✅ *Delivered:*\n${lines}\n\nThank you for your business! 🙏\n— ${SHOP_NAME}`;
    sendWAMsg(selectedCustomer.phone, msg);
  };

  const save = async () => {
    if(!selectedCustomer||items.length===0) return;
    setSaving(true);
    try {
      // Pass any just-delivered items so the backend sends ONE combined message
      // (delivery note with pickup dates + new pickup) instead of two separate ones.
      await api.post("/entries",{customer_id:selectedCustomer.id,notes,delivery_date:deliveryDate||null,delivered:justDelivered,discount:discountN,extra_charge:extraN,amount_paid:paidN,payment_method:payMethod,items:items.map(i=>({service_id:i.service_id,service_name:i.item_name?`${i.service_name} - ${i.item_name}`:i.service_name,quantity:Number(i.quantity),price_per_unit:Number(i.price)}))});
      setSuccess(true); setItems([]); setNotes(""); setDeliveryDate(""); setDiscount(""); setExtraCharge(""); setPayMethod("later"); setAmountPaid("");
      // These deliveries are now covered by the combined message — clear so the unmount
      // flush doesn't re-notify.
      setJustDelivered([]); setPendingDeliverIds([]);
      const res = await api.get("/entries", { params: { customer_id: selectedCustomer.id } });
      setPastEntries(res.data);
      setTimeout(()=>setSuccess(false), 3000);
    } finally { setSaving(false); }
  };

  const topServices = services;

  const pendingEntries = pastEntries.filter(e =>
    e.delivery_status !== "delivered" && !e.items.every(i => i.item_status === "delivered")
  );

  const markDelivered = async (entryId: string) => {
    setUpdatingId(entryId);
    try {
      // Mark delivered silently — the delivery note is folded into the combined pickup
      // message sent on save (or flushed on unmount if the user leaves without saving).
      await api.patch(`/entries/${entryId}/status`, null, { params: { status: "delivered", silent: "1" } });
      const entry = pastEntries.find(e => e.id === entryId);
      if (entry) {
        const newItems = entry.items
          .filter(i => i.item_status !== "delivered")
          .map(i => ({ service_name: i.service_name, quantity: i.quantity, pickup_date: entry.entry_date }));
        setJustDelivered(jd => [...jd, ...newItems]);
        setPendingDeliverIds(ids => ids.includes(entryId) ? ids : [...ids, entryId]);
      }
      setPastEntries(prev => prev.map(e => e.id === entryId
        ? { ...e, delivery_status: "delivered", items: e.items.map(i => ({ ...i, item_status: "delivered" })) }
        : e));
    } finally { setUpdatingId(null); }
  };

  const isDisabled = !selectedCustomer || items.length === 0 || saving;
  const cardStyle: React.CSSProperties = { background:"var(--bg-card-solid)", borderRadius:14, boxShadow:"var(--shadow-web-lift)", border:"1px solid var(--border-hard)" };
  const label: React.CSSProperties = { fontSize:11, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.1em" };
  const resetForm = () => { setItems([]); setSelectedCustomer(null); setSearch(""); setNotes(""); setDeliveryDate(""); setPastEntries([]); setJustDelivered([]); setDiscount(""); setExtraCharge(""); setPayMethod("later"); setAmountPaid(""); };

  return (
    <ProtectedLayout>
      <style>{`
        .svc-btn:hover { border-color: var(--grade-b-border) !important; }
        .ne-summary { position: sticky; top: 16px; align-self: start; }
        @media (max-width: 860px) {
          .ne-layout { grid-template-columns: 1fr !important; }
          .ne-summary { position: static !important; }
        }
        @media (max-width: 480px) {
          .ne-svc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:20}}>
        <div>
          <h2 style={{color:"var(--text-primary)",marginBottom:3,marginTop:0,fontSize:24,fontWeight:800,letterSpacing:-0.3}}>New entry</h2>
          <p style={{color:"var(--text-secondary)",fontSize:13,margin:0}}>Add a customer and select services</p>
        </div>
        <button onClick={resetForm}
          style={{padding:"9px 18px",borderRadius:10,border:"1px solid var(--border-hard)",background:"var(--bg-input)",color:"var(--text-secondary)",cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>
          Cancel
        </button>
      </div>

      {success && (
        <div style={{background:"var(--grade-a-bg)",color:"var(--grade-a-text)",padding:"12px 16px",borderRadius:10,marginBottom:16,fontWeight:600,display:"flex",alignItems:"center",gap:8,border:"1px solid var(--grade-a-border)"}}>
          <Check size={18}/> Entry saved successfully!
        </div>
      )}

      {/* Two-column layout: left = customer + services + items, right = order summary */}
      <div className="ne-layout" style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16,alignItems:"start"}}>

        {/* ── LEFT ── */}
        <div style={{display:"flex",flexDirection:"column",gap:16,minWidth:0}}>

          {/* Customer */}
          <div style={{...cardStyle,padding:"18px 20px"}}>
            <div style={{...label,marginBottom:12}}>Customer</div>
            <div style={{position:"relative"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 14px",background:"var(--bg-input)"}}>
                <Search size={15} style={{color:"var(--text-muted)"}}/>
                <input
                  style={{flex:1,minWidth:0,border:"none",outline:"none",fontSize:14,background:"transparent",color:"var(--text-primary)"}}
                  placeholder="Search by Name, Phone, Flat or Society..."
                  value={search}
                  onChange={e=>{ setSearch(e.target.value); setSelectedCustomer(null); setPastEntries([]); setShowDropdown(true); }}
                  onFocus={()=>search.length>0&&setShowDropdown(true)}
                />
                {search && (
                  <button onClick={clearCustomer} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:2,display:"flex"}}><X size={16}/></button>
                )}
              </div>

              {showDropdown && filtered.length>0 && !selectedCustomer && (
                <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--bg-card-solid)",border:"1px solid var(--border)",borderRadius:12,zIndex:100,boxShadow:"var(--shadow-web-lift)",maxHeight:260,overflowY:"auto"}}>
                  {filtered.map(c=>(
                    <div key={c.id}
                      style={{padding:"12px 16px",cursor:"pointer",borderBottom:"1px solid var(--web-bg-band)",transition:"background 0.1s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--grade-b-bg)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      onClick={()=>selectCustomer(c)}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#6EA8FF,#3f7fe0)",display:"flex",alignItems:"center",justifyContent:"center",color:"#0b1830",fontWeight:700,fontSize:14,flexShrink:0}}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{minWidth:0}}>
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

            {selectedCustomer && (
              <div style={{marginTop:12,padding:"10px 14px",background:"var(--grade-a-bg)",borderRadius:10,border:"1px solid var(--grade-a-border)",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#6EA8FF,#3f7fe0)",display:"flex",alignItems:"center",justifyContent:"center",color:"#0b1830",fontWeight:700,fontSize:14,flexShrink:0}}>
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:"var(--grade-a-text)"}}>{selectedCustomer.name}</div>
                  <div style={{fontSize:12,color:"var(--grade-a-text)",display:"flex",gap:8,marginTop:1,opacity:0.85,flexWrap:"wrap"}}>
                    <span><Phone size={10}/> {selectedCustomer.phone}</span>
                    {selectedCustomer.flat_number&&<span>🏠 {selectedCustomer.flat_number}{selectedCustomer.society_name?`, ${selectedCustomer.society_name}`:""}</span>}
                  </div>
                </div>
                <Check size={18} style={{color:"var(--grade-a-text)",flexShrink:0}}/>
              </div>
            )}

            {/* Past deliveries status */}
            {selectedCustomer && !pastLoading && (
              pendingEntries.length === 0 ? (
                <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"var(--grade-a-bg)",border:"1px solid var(--grade-a-border)",borderRadius:10,fontSize:12.5,fontWeight:700,color:"var(--grade-a-text)"}}>
                  <CheckCircle2 size={15}/> All past deliveries completed
                </div>
              ) : (
                <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{padding:"10px 14px",background:"var(--grade-c-bg)",border:"1px solid var(--grade-c-border)",borderRadius:10}}>
                    <span style={{fontSize:12,fontWeight:700,color:"var(--grade-c-text)"}}>{pendingEntries.length} pending {pendingEntries.length===1?"entry":"entries"} — mark as delivered before saving new pickup</span>
                  </div>
                  {pendingEntries.map(e => {
                    const allDel = e.items.every(i => i.item_status === "delivered");
                    const isUpdating = updatingId === e.id;
                    const delCount = e.items.filter(i=>i.item_status==="delivered").length;
                    return (
                      <div key={e.id} style={{background:"var(--grade-c-bg)",borderRadius:12,padding:"10px 14px",border:"1px solid var(--grade-c-border)"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8,flexWrap:"wrap"}}>
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
                            <button onClick={()=>openDeliveryWhatsApp(e.items)} title="Send delivery WhatsApp"
                              style={{width:26,height:26,borderRadius:"50%",background:"var(--grade-a-bg)",border:"1px solid var(--grade-a-border)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--grade-a-text)"><path d={WA_PATH}/></svg>
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
              )
            )}
          </div>

          {/* Add services */}
          <div style={{...cardStyle,padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={label}>Add services</div>
              <span style={{fontSize:11,color:"var(--text-muted)"}}>Tap to add an item</span>
            </div>
            <div className="ne-svc-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))",gap:10}}>
              {topServices.map((svc)=>{
                const children = svc.children || [];
                const isOpen = openServices.has(svc.id);
                const toggle = () => setOpenServices(prev=>{ const s=new Set(prev); s.has(svc.id)?s.delete(svc.id):s.add(svc.id); return s; });
                const hasChildren = children.length > 0;
                return (
                  <div key={svc.id} style={{position:"relative"}}>
                    <button className="svc-btn" onClick={()=> hasChildren ? toggle() : addItem(svc)}
                      style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:isOpen?"var(--grade-b-bg)":"var(--bg-input)",border:`1px solid ${isOpen?"var(--grade-b-border)":"var(--border-hard)"}`,borderRadius:12,cursor:"pointer",transition:"border-color 0.15s",textAlign:"left"}}>
                      <span style={{width:28,height:28,borderRadius:8,flexShrink:0,background:"var(--grade-b-bg)",border:"1px solid var(--grade-b-border)",color:"var(--grade-b-text)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {hasChildren ? (isOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>) : <Plus size={15}/>}
                      </span>
                      <span style={{flex:1,minWidth:0,fontSize:13.5,fontWeight:700,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{svc.name}</span>
                      <span style={{fontSize:12,fontWeight:600,color:"var(--text-muted)",flexShrink:0}}>{hasChildren ? "Choose" : `₹${Number(svc.price)||0}`}</span>
                    </button>
                    {hasChildren && isOpen && (
                      <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--bg-card-solid)",border:"1px solid var(--border)",borderRadius:10,zIndex:50,maxHeight:"min(55vh, 300px)",overflowY:"auto",overflowX:"hidden",boxShadow:"var(--shadow-web-lift)"}}>
                        {children.map(child=>(
                          <div key={child.id} onClick={()=>{ addItem(child); toggle(); }}
                            style={{padding:"10px 14px",fontSize:13,cursor:"pointer",display:"flex",justifyContent:"space-between",gap:12,color:"var(--text-primary)"}}
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

          {/* Items */}
          {items.length>0 && (
            <div style={{...cardStyle,padding:"18px 20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <div style={label}>Items</div>
                <span style={{fontSize:11,fontWeight:800,padding:"1px 8px",borderRadius:20,background:"var(--grade-b-bg)",color:"var(--grade-b-text)",border:"1px solid var(--grade-b-border)"}}>{items.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {items.map(item=>(
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",paddingBottom:12,borderBottom:"1px solid var(--border-hard)"}}>
                    {/* name + note */}
                    <div style={{flex:"1 1 160px",minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.service_name}{item.item_name?` — ${item.item_name}`:""}</div>
                      <input value={item.item_name} onChange={e=>updateItem(item.id,"item_name",e.target.value)} placeholder="Add a note…"
                        style={{marginTop:3,width:"100%",maxWidth:200,border:"none",outline:"none",fontSize:12,background:"transparent",color:"var(--text-secondary)",padding:0}}/>
                    </div>
                    {/* qty stepper */}
                    <div style={{display:"flex",alignItems:"center",background:"var(--bg-input)",borderRadius:8,border:"1px solid var(--border-hard)",overflow:"hidden",flexShrink:0}}>
                      <button onClick={()=>updateItem(item.id,"quantity",Math.max(1,Number(item.quantity)-1))} style={{width:32,height:34,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}><Minus size={14}/></button>
                      <span style={{width:26,textAlign:"center",fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{item.quantity}</span>
                      <button onClick={()=>updateItem(item.id,"quantity",Number(item.quantity)+1)} style={{width:32,height:34,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-secondary)"}}><Plus size={14}/></button>
                    </div>
                    {/* price */}
                    <div style={{display:"flex",alignItems:"center",gap:3,background:"var(--bg-input)",border:"1px solid var(--border-hard)",borderRadius:8,padding:"0 10px",height:34,width:82,flexShrink:0}}>
                      <span style={{fontSize:12,color:"var(--text-muted)"}}>₹</span>
                      <input type="number" style={{flex:1,minWidth:0,width:"100%",border:"none",outline:"none",fontSize:13,fontWeight:600,background:"transparent",color:"var(--text-primary)"}} value={item.price} min={0} onChange={e=>updateItem(item.id,"price",e.target.value)}/>
                    </div>
                    {/* total */}
                    <span style={{fontWeight:800,fontSize:15,color:"var(--accent-success)",minWidth:44,textAlign:"right"}}>₹{(Number(item.price)*Number(item.quantity)).toFixed(0)}</span>
                    {/* delete */}
                    <button onClick={()=>removeItem(item.id)} style={{width:30,height:30,borderRadius:8,background:"rgba(239,68,68,0.12)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Trash2 size={13} color="#ef4444"/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Order summary ── */}
        <aside className="ne-summary" style={{...cardStyle,padding:"18px 20px"}}>
          <div style={{...label,marginBottom:10}}>Order summary</div>
          {selectedCustomer ? (
            <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>
              {selectedCustomer.name}{selectedCustomer.flat_number?<span style={{color:"var(--text-muted)",fontWeight:500}}> · {selectedCustomer.flat_number}</span>:null}
            </div>
          ) : (
            <div style={{fontSize:13,color:"var(--text-muted)",marginBottom:12}}>Select a customer to start</div>
          )}

          {items.length === 0 ? (
            <div style={{fontSize:13,color:"var(--text-muted)",padding:"12px 0",borderTop:"1px solid var(--border-hard)"}}>No items added yet</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8,borderTop:"1px solid var(--border-hard)",paddingTop:12}}>
              {items.map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,fontSize:13}}>
                  <span style={{color:"var(--text-secondary)",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {item.service_name}{item.item_name?` — ${item.item_name}`:""} <span style={{color:"var(--text-muted)"}}>× {item.quantity}</span>
                  </span>
                  <span style={{fontWeight:700,color:"var(--text-primary)",flexShrink:0}}>₹{(Number(item.price)*Number(item.quantity)).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Billing — subtotal, discount, extra charge, grand total */}
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--border-hard)",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}>
              <span style={{color:"var(--text-secondary)"}}>Subtotal</span>
              <span style={{fontWeight:700,color:"var(--text-primary)"}}>₹{total.toFixed(0)}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontSize:13,color:"var(--text-secondary)"}}>Discount</span>
              <div style={{display:"flex",alignItems:"center",gap:2,background:"var(--bg-input)",border:"1px solid var(--border-hard)",borderRadius:8,padding:"0 8px",height:32,width:100}}>
                <span style={{fontSize:12,color:"var(--text-muted)"}}>−₹</span>
                <input type="number" min={0} value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0"
                  style={{flex:1,minWidth:0,width:"100%",border:"none",outline:"none",fontSize:13,fontWeight:600,background:"transparent",color:"var(--text-primary)",textAlign:"right"}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontSize:13,color:"var(--text-secondary)"}}>Extra charge</span>
              <div style={{display:"flex",alignItems:"center",gap:2,background:"var(--bg-input)",border:"1px solid var(--border-hard)",borderRadius:8,padding:"0 8px",height:32,width:100}}>
                <span style={{fontSize:12,color:"var(--text-muted)"}}>+₹</span>
                <input type="number" min={0} value={extraCharge} onChange={e=>setExtraCharge(e.target.value)} placeholder="0"
                  style={{flex:1,minWidth:0,width:"100%",border:"none",outline:"none",fontSize:13,fontWeight:600,background:"transparent",color:"var(--text-primary)",textAlign:"right"}}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:2,borderTop:"1px solid var(--border-hard)"}}>
              <span style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>Grand total</span>
              <span style={{fontWeight:800,fontSize:22,color:"var(--accent-success)"}}>₹{grandTotal.toFixed(0)}</span>
            </div>
          </div>

          {/* Payment at billing */}
          <div style={{marginTop:14}}>
            <div style={{...label,marginBottom:8}}>Payment</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {([["cash","Cash"],["upi","UPI"],["online","Online"],["later","Later"]] as [typeof payMethod,string][]).map(([m,lbl])=>(
                <button key={m} onClick={()=>pickMethod(m)}
                  style={{padding:"8px 4px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",
                    border:`1px solid ${payMethod===m?"var(--accent-primary)":"var(--border-hard)"}`,
                    background:payMethod===m?"var(--accent-primary)":"var(--bg-input)",
                    color:payMethod===m?"#0b1830":"var(--text-secondary)"}}>
                  {lbl}
                </button>
              ))}
            </div>
            {payMethod!=="later" && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginTop:10}}>
                <span style={{fontSize:13,color:"var(--text-secondary)"}}>Amount received</span>
                <div style={{display:"flex",alignItems:"center",gap:2,background:"var(--bg-input)",border:"1px solid var(--border-hard)",borderRadius:8,padding:"0 8px",height:34,width:112}}>
                  <span style={{fontSize:12,color:"var(--text-muted)"}}>₹</span>
                  <input type="number" min={0} value={amountPaid} onChange={e=>setAmountPaid(e.target.value)} placeholder="0"
                    style={{flex:1,minWidth:0,width:"100%",border:"none",outline:"none",fontSize:14,fontWeight:700,background:"transparent",color:"var(--text-primary)",textAlign:"right"}}/>
                </div>
              </div>
            )}
            {grandTotal>0 && (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,fontSize:13}}>
                <span style={{color:"var(--text-secondary)"}}>{balance>0?"Balance (udhaar)":"Fully paid"}</span>
                <span style={{fontWeight:800,color:balance>0?"var(--grade-c-text)":"var(--grade-a-text)"}}>
                  {balance>0 ? `₹${balance.toFixed(0)}` : (paidN>grandTotal ? `Change ₹${(paidN-grandTotal).toFixed(0)}` : "✓")}
                </span>
              </div>
            )}
          </div>

          {/* Expected delivery */}
          <div style={{marginTop:16}}>
            <div style={{...label,marginBottom:6}}>Expected delivery <span style={{fontSize:10,fontWeight:400,textTransform:"none",color:"var(--text-muted)"}}>(optional)</span></div>
            <input type="date" value={deliveryDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setDeliveryDate(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",background:"var(--bg-input)",color:"var(--text-primary)"}}/>
          </div>

          {/* Order note */}
          <div style={{marginTop:14}}>
            <div style={{...label,marginBottom:6}}>Order note <span style={{fontSize:10,fontWeight:400,textTransform:"none",color:"var(--text-muted)"}}>(optional)</span></div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any special instructions…"
              style={{width:"100%",boxSizing:"border-box",padding:"10px 12px",border:"1.5px solid var(--border)",borderRadius:8,fontSize:13,outline:"none",resize:"none",fontFamily:"inherit",height:64,background:"var(--bg-input)",color:"var(--text-primary)"}}/>
          </div>

          {/* Actions */}
          <button onClick={()=>save()} disabled={isDisabled}
            style={{marginTop:16,width:"100%",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,cursor:isDisabled?"not-allowed":"pointer",transition:"all 0.15s",
              ...(isDisabled ? {background:"var(--bg-input)",border:"1.5px solid var(--border)",color:"var(--text-secondary)",opacity:0.55}
                             : {background:"var(--accent-primary)",border:"none",color:"#0b1830",boxShadow:"var(--shadow-glow-blue)"})}}>
            {saving ? "Saving…" : grandTotal > 0 ? `Save entry · ₹${grandTotal}` : "Save entry"}
          </button>
          {/* Bill goes to WhatsApp automatically (if the shop enabled auto-send in Settings),
              so the old manual "Save & send on WhatsApp" button was removed. */}
        </aside>
      </div>
    </ProtectedLayout>
  );
}
