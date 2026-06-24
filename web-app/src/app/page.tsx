"use client";
import { useEffect } from "react";

const WHATSAPP = "919999999999";
const PHONE    = "+91 99999 99999";

const testimonials = [
  {
    quote: "Earlier I managed everything in a notebook. Now billing is done in 10 seconds and my customers love getting proper receipts. I wish I had found this two years sooner.",
    name: "Rajesh Sharma", city: "Ahmedabad", shop: "Sharma Laundry & Dry Clean",
  },
  {
    quote: "The delivery tracking alone is worth it. All pending orders on one screen — I haven't missed a single delivery since switching. My customers have noticed the difference.",
    name: "Priya Patel", city: "Surat", shop: "Patel's Express Laundry",
  },
  {
    quote: "My staff learned it in one day. It tracks their work, calculates wages automatically, and I can see every month's revenue in seconds. Running my shop became genuinely easier.",
    name: "Mohammed Raza", city: "Mumbai", shop: "Raza Laundry Services",
  },
];

const billItems = [
  { name: "Shirt",   qty: 3, rate: 30 },
  { name: "Pant",    qty: 2, rate: 35 },
  { name: "Saree",   qty: 1, rate: 60 },
  { name: "Blanket", qty: 1, rate: 80 },
];

export default function LandingPage() {
  const waUrl = `https://wa.me/${WHATSAPP}?text=Hi%2C%20I%27m%20interested%20in%20LaundryPro.`;
  const total  = billItems.reduce((s, i) => s + i.qty * i.rate, 0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) (e.target as HTMLElement).classList.add("in"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background: "#fff", color: "#0C0C0E", overflowX: "hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
        ::-webkit-scrollbar { width: 5px }
        ::-webkit-scrollbar-track { background: #f5f5f5 }
        ::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 3px }

        @keyframes fadeUp { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }

        .reveal { opacity:0; transform:translateY(20px); transition:opacity .65s cubic-bezier(0.16,1,0.3,1), transform .65s cubic-bezier(0.16,1,0.3,1) }
        .reveal.in { opacity:1; transform:translateY(0) }
        .d1{transition-delay:.07s} .d2{transition-delay:.14s} .d3{transition-delay:.21s} .d4{transition-delay:.28s}

        .btn-orange { display:inline-flex; align-items:center; gap:8px; padding:13px 26px; border-radius:9px; background:#F97316; color:#fff; font-weight:700; font-size:14px; text-decoration:none; transition:background .15s, transform .15s }
        .btn-orange:hover { background:#EA580C; transform:translateY(-2px) }
        .btn-ghost-dark { display:inline-flex; align-items:center; gap:8px; padding:13px 26px; border-radius:9px; border:1.5px solid rgba(255,255,255,0.18); color:rgba(255,255,255,0.8); font-weight:600; font-size:14px; text-decoration:none; transition:border-color .15s, background .15s, transform .15s }
        .btn-ghost-dark:hover { border-color:rgba(255,255,255,0.4); background:rgba(255,255,255,0.07); transform:translateY(-2px) }
        .nav-a { color:#525252; font-weight:500; font-size:14px; text-decoration:none; padding:7px 12px; border-radius:7px; transition:color .15s }
        .nav-a:hover { color:#F97316 }
        .feat-row { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center }
        .mock-hover { transition:transform .25s ease, box-shadow .25s ease }
        .mock-hover:hover { transform:translateY(-4px); box-shadow:0 20px 48px rgba(0,0,0,0.1) }

        @media (max-width:860px) {
          .feat-row { grid-template-columns:1fr !important; gap:32px !important }
          .hero-grid { grid-template-columns:1fr !important }
          .step-grid { grid-template-columns:1fr 1fr !important }
          .prob-grid { grid-template-columns:1fr !important }
          .test-row { grid-template-columns:1fr !important; gap:24px !important }
          .cta-grid { grid-template-columns:1fr !important; gap:40px !important }
        }
        @media (prefers-reduced-motion:reduce) {
          .reveal { opacity:1; transform:none; transition:none }
          * { animation-duration:.01ms !important; animation-iteration-count:1 !important }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.97)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",borderBottom:"1px solid #EBEBEB",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 6%" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:"#F97316",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
          </div>
          <span style={{ fontWeight:800,fontSize:16,letterSpacing:-0.4 }}>LaundryPro</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:2 }}>
          <a href="#how-it-works" className="nav-a">How It Works</a>
          <a href="#features"     className="nav-a">Features</a>
          <a href="#reviews"      className="nav-a">Reviews</a>
          <div style={{ width:1,height:20,background:"#E5E5E5",margin:"0 8px" }}/>
          <a href="/dashboard" className="btn-orange" style={{ padding:"8px 18px",fontSize:13 }}>Try Demo</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background:"#0C0C0E",padding:"80px 6% 0",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.028) 1px,transparent 1px)",backgroundSize:"56px 56px",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",top:-60,left:"38%",width:520,height:520,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,115,22,0.1) 0%,transparent 62%)",pointerEvents:"none" }}/>

        <div style={{ maxWidth:1100,margin:"0 auto",position:"relative" }}>

          {/* Top row: headline left, stats right */}
          <div className="hero-grid" style={{ display:"grid",gridTemplateColumns:"1.1fr 0.9fr",gap:60,alignItems:"center",paddingBottom:64 }}>
            <div style={{ animation:"fadeUp .5s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div style={{ display:"inline-block",padding:"4px 12px",borderRadius:6,background:"rgba(249,115,22,0.14)",color:"#F97316",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:26 }}>
                Laundry Management · India
              </div>
              <h1 style={{ color:"#fff",fontWeight:900,fontSize:"clamp(38px,5.8vw,74px)",lineHeight:1.04,letterSpacing:"-2.5px",marginBottom:14 }}>
                Manage Your Shop.<br/>
                <span style={{ color:"#F97316" }}>Grow Profitably.</span>
              </h1>
              <p style={{ color:"rgba(255,255,255,0.3)",fontSize:15,marginBottom:6,fontStyle:"italic" }}>
                Register pe likhna band karo.
              </p>
              <p style={{ color:"rgba(255,255,255,0.5)",fontSize:16,lineHeight:1.8,marginBottom:36,maxWidth:440 }}>
                LaundryPro handles customers, orders, billing, deliveries, labour, and reports — so you can focus on running your shop.
              </p>
              <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                <a href="/dashboard" className="btn-orange">Try Live Demo →</a>
                <a href={waUrl} target="_blank" rel="noreferrer" className="btn-ghost-dark">WhatsApp Us</a>
              </div>
            </div>

            {/* Stats */}
            <div style={{ animation:"fadeUp .55s .07s cubic-bezier(0.16,1,0.3,1) both",borderLeft:"1px solid rgba(255,255,255,0.08)" }}>
              {[
                ["500+",    "Laundry shops use LaundryPro daily"],
                ["4.9 / 5", "Average rating from verified owners"],
                ["1 Day",   "Average time to set up and go live"],
              ].map(([num, label], i) => (
                <div key={i} style={{ padding:"28px 36px",borderBottom:i<2?"1px solid rgba(255,255,255,0.08)":"none" }}>
                  <div style={{ color:"#fff",fontWeight:900,fontSize:"clamp(34px,4vw,52px)",letterSpacing:"-2px",lineHeight:1 }}>{num}</div>
                  <div style={{ color:"rgba(255,255,255,0.35)",fontSize:13,marginTop:7,fontWeight:500 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* App screenshot mockup */}
          <div style={{ maxWidth:900,margin:"0 auto",animation:"fadeUp .6s .12s cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"16px 16px 0 0",overflow:"hidden" }}>
              {/* Browser bar */}
              <div style={{ padding:"11px 16px",background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ display:"flex",gap:5 }}>
                  {["#f87171","#fbbf24","#4ade80"].map((c,i) => <div key={i} style={{ width:9,height:9,borderRadius:"50%",background:c }}/>)}
                </div>
                <div style={{ flex:1,background:"rgba(255,255,255,0.05)",borderRadius:5,height:20,display:"flex",alignItems:"center",paddingLeft:10 }}>
                  <span style={{ color:"rgba(255,255,255,0.2)",fontSize:10 }}>app.laundrpro.com/dashboard</span>
                </div>
              </div>
              {/* App body */}
              <div style={{ display:"grid",gridTemplateColumns:"190px 1fr",minHeight:260 }}>
                {/* Sidebar */}
                <div style={{ borderRight:"1px solid rgba(255,255,255,0.06)",padding:"18px 14px" }}>
                  <div style={{ fontWeight:800,fontSize:13,color:"rgba(255,255,255,0.85)",marginBottom:18 }}>LaundryPro</div>
                  {["Dashboard","New Entry","Orders","Deliveries","Customers","Reports","Labour"].map((item,i) => (
                    <div key={item} style={{ padding:"8px 12px",borderRadius:8,background:i===0?"rgba(249,115,22,0.14)":"transparent",color:i===0?"#F97316":"rgba(255,255,255,0.32)",fontSize:12,fontWeight:i===0?700:500,marginBottom:2 }}>{item}</div>
                  ))}
                </div>
                {/* Main */}
                <div style={{ padding:"20px 24px" }}>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:22 }}>
                    {[["₹8,420","Today's Revenue","#F97316"],["14","Orders","#fff"],["3","Pending","#FBBF24"],["11","Delivered","#4ade80"]].map(([v,l,c]) => (
                      <div key={String(l)} style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 10px" }}>
                        <div style={{ color:c as string,fontWeight:900,fontSize:18,letterSpacing:-0.5 }}>{v}</div>
                        <div style={{ color:"rgba(255,255,255,0.28)",fontSize:9,marginTop:3,fontWeight:600 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.22)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:9 }}>Recent Orders</div>
                  {[
                    { name:"Ramesh Patel",  items:"3 Shirts, 2 Pants",  amount:"₹160", status:"Ready",    dot:"#4ade80" },
                    { name:"Priya Shah",    items:"1 Saree, 1 Blanket", amount:"₹140", status:"Washing",  dot:"#FBBF24" },
                    { name:"Suresh Kumar",  items:"5 Shirts",            amount:"₹150", status:"Pending",  dot:"#94a3b8" },
                  ].map((o) => (
                    <div key={o.name} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                        <div style={{ width:28,height:28,borderRadius:8,background:"rgba(249,115,22,0.18)",display:"flex",alignItems:"center",justifyContent:"center",color:"#F97316",fontWeight:800,fontSize:12,flexShrink:0 }}>{o.name[0]}</div>
                        <div>
                          <div style={{ color:"rgba(255,255,255,0.78)",fontWeight:600,fontSize:11 }}>{o.name}</div>
                          <div style={{ color:"rgba(255,255,255,0.28)",fontSize:9 }}>{o.items}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                        <span style={{ color:"#fff",fontWeight:700,fontSize:11 }}>{o.amount}</span>
                        <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                          <div style={{ width:5,height:5,borderRadius:"50%",background:o.dot }}/>
                          <span style={{ color:"rgba(255,255,255,0.35)",fontSize:9,fontWeight:600 }}>{o.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ background:"#F5F4F0",borderBottom:"1px solid #E8E7E2",padding:"16px 6%" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",gap:0,flexWrap:"wrap",columnGap:0 }}>
          <span style={{ color:"#888",fontSize:13,marginRight:16 }}>Trusted by shops in</span>
          {["Ahmedabad","Mumbai","Delhi","Surat","Jaipur","Pune","Vadodara","Rajkot","Bangalore"].map((city,i,arr) => (
            <span key={city} style={{ color:"#0C0C0E",fontWeight:700,fontSize:13 }}>
              {city}
              {i < arr.length-1 && <span style={{ color:"#D4D4D4",margin:"0 12px" }}>·</span>}
            </span>
          ))}
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding:"96px 6%",background:"#fff",borderBottom:"1px solid #EBEBEB" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className="reveal" style={{ marginBottom:56 }}>
            <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14 }}>The Problem</div>
            <h2 style={{ fontWeight:900,fontSize:"clamp(26px,4vw,50px)",lineHeight:1.08,letterSpacing:"-1.5px",maxWidth:680 }}>
              Running a laundry shop without software means losing money every day.
            </h2>
          </div>
          <div className="prob-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)" }}>
            {[
              { n:"01", title:"Orders get lost",         body:"When 50+ garments come in daily through calls, WhatsApp, and walk-ins — tracking them in a notebook leads to missed deliveries, angry customers, and lost income.", accent:true },
              { n:"02", title:"No revenue visibility",   body:"Without reports, you don't know if your shop earned ₹8,000 or ₹18,000 last month. You can't plan, can't grow, and can't spot problems early.", accent:false },
              { n:"03", title:"Labour tracking is hard", body:"Calculating wages, tracking press count per worker, managing salary advances — doing this on paper takes hours every week and errors always happen.", accent:false },
            ].map((p,i) => (
              <div key={i} className={`reveal d${i+1}`} style={{ padding:"40px 32px",borderLeft:i>0?"1px solid #EBEBEB":"none",borderTop:`3px solid ${p.accent?"#F97316":"#EBEBEB"}` }}>
                <div style={{ fontWeight:900,fontSize:56,color:"#F0EFEB",lineHeight:1,marginBottom:20,letterSpacing:"-3px" }}>{p.n}</div>
                <div style={{ fontWeight:800,fontSize:18,marginBottom:13,color:"#0C0C0E" }}>{p.title}</div>
                <div style={{ color:"#555",fontSize:14,lineHeight:1.85 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding:"96px 6%",background:"#F5F4F0",borderBottom:"1px solid #E8E7E2" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className="reveal" style={{ marginBottom:56 }}>
            <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14 }}>How It Works</div>
            <h2 style={{ fontWeight:900,fontSize:"clamp(26px,4vw,50px)",lineHeight:1.08,letterSpacing:"-1.5px" }}>
              From customer walk-in to delivery — all tracked.
            </h2>
          </div>
          <div className="step-grid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:"1px solid #DDDBD5" }}>
            {[
              { n:"01", title:"Customer walks in", body:"Search by phone or name. Found instantly. New customer? Added in under 10 seconds." },
              { n:"02", title:"Add garments",      body:"Pick garment, enter quantity. Rate fills from your price list. Total calculates automatically." },
              { n:"03", title:"Bill generated",    body:"Itemized, accurate bill in seconds. Share on WhatsApp or print. Customer confirms on the spot." },
              { n:"04", title:"Mark delivered",    body:"When clothes are ready, mark delivered with one tap. Revenue updates. Record is complete." },
            ].map((s,i) => (
              <div key={i} className={`reveal d${i+1}`} style={{ padding:"36px 28px",borderRight:i<3?"1px solid #DDDBD5":"none",borderTop:`3px solid ${i===0?"#F97316":"transparent"}` }}>
                <div style={{ fontWeight:900,fontSize:44,color:"#E8E7E2",lineHeight:1,marginBottom:18,letterSpacing:"-2px" }}>{s.n}</div>
                <div style={{ fontWeight:800,fontSize:15,marginBottom:10,color:"#0C0C0E" }}>{s.title}</div>
                <div style={{ color:"#666",fontSize:13,lineHeight:1.8 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:"96px 6%",background:"#fff" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className="reveal" style={{ marginBottom:80 }}>
            <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14 }}>Features</div>
            <h2 style={{ fontWeight:900,fontSize:"clamp(26px,4vw,50px)",lineHeight:1.08,letterSpacing:"-1.5px" }}>Everything your shop needs, nothing it doesn't.</h2>
          </div>

          {/* Feature 01 — Customers */}
          <div className="reveal" style={{ paddingBottom:72,marginBottom:72,borderBottom:"1px solid #EBEBEB" }}>
            <div className="feat-row">
              <div>
                <div style={{ fontWeight:900,fontSize:72,color:"#F0EFEB",lineHeight:1,letterSpacing:"-4px",marginBottom:4 }}>01</div>
                <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:16 }}>Customer Management</div>
                <h3 style={{ fontWeight:900,fontSize:"clamp(22px,3vw,36px)",letterSpacing:"-1px",marginBottom:16 }}>Every customer, searchable in seconds.</h3>
                <p style={{ color:"#555",fontSize:15,lineHeight:1.88,marginBottom:28 }}>Store names, phone numbers, and addresses. Search anyone in seconds by name or phone — no flipping through pages. Full order history per customer, always up to date.</p>
                {["Search by name or phone number","Complete order history per customer","Saved addresses for easy delivery"].map((pt,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10,fontSize:14,color:"#0C0C0E" }}>
                    <div style={{ width:6,height:6,borderRadius:"50%",background:"#F97316",flexShrink:0 }}/>
                    {pt}
                  </div>
                ))}
              </div>
              <div className="mock-hover" style={{ background:"#F9F9F8",border:"1px solid #E8E8E8",borderRadius:16,overflow:"hidden" }}>
                <div style={{ padding:"13px 18px",borderBottom:"1px solid #EBEBEB",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <span style={{ fontWeight:700,fontSize:13 }}>Customers</span>
                  <div style={{ padding:"5px 12px",borderRadius:6,background:"#F97316",color:"#fff",fontSize:11,fontWeight:700 }}>+ Add</div>
                </div>
                <div style={{ padding:"10px 16px",borderBottom:"1px solid #F5F5F5" }}>
                  <div style={{ background:"#F5F4F0",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#999",display:"flex",alignItems:"center",gap:8 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    Search by name or phone…
                  </div>
                </div>
                {[
                  ["Ramesh Patel",   "98765 43210", "Satellite, Ahmedabad",   "R"],
                  ["Priya Shah",     "87654 32109", "Navrangpura, Ahmedabad", "P"],
                  ["Suresh Kumar",   "76543 21098", "Bopal, Ahmedabad",       "S"],
                  ["Anita Verma",    "65432 10987", "Gota, Ahmedabad",        "A"],
                ].map(([name, phone, addr, init]) => (
                  <div key={name} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 18px",borderBottom:"1px solid #F8F8F8" }}>
                    <div style={{ width:38,height:38,borderRadius:10,background:"#F97316",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0 }}>{init}</div>
                    <div>
                      <div style={{ fontWeight:700,fontSize:13,color:"#0C0C0E" }}>{name}</div>
                      <div style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>{phone} · {addr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 02 — Billing */}
          <div className="reveal" style={{ paddingBottom:72,marginBottom:72,borderBottom:"1px solid #EBEBEB" }}>
            <div className="feat-row">
              <div className="mock-hover" style={{ background:"#111118",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:28,overflow:"hidden" }}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22,paddingBottom:16,borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <div style={{ color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>New Entry</div>
                    <div style={{ color:"#fff",fontWeight:800,fontSize:15,marginTop:4 }}>Ramesh Patel</div>
                  </div>
                  <div style={{ padding:"5px 12px",borderRadius:6,background:"rgba(249,115,22,0.15)",color:"#F97316",fontSize:11,fontWeight:700 }}>Active</div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,marginBottom:10,padding:"0 0 8px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  {["ITEM","QTY","AMOUNT"].map(h => <div key={h} style={{ fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.22)",textTransform:"uppercase",letterSpacing:"0.08em" }}>{h}</div>)}
                </div>
                {billItems.map(item => (
                  <div key={item.name} style={{ display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,padding:"11px 0",borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color:"rgba(255,255,255,0.72)",fontSize:13,fontWeight:600 }}>{item.name}</span>
                    <span style={{ color:"rgba(255,255,255,0.3)",fontSize:13,textAlign:"center" }}>{item.qty}</span>
                    <span style={{ color:"#FBBF24",fontWeight:800,fontSize:13,textAlign:"right" }}>₹{item.qty*item.rate}</span>
                  </div>
                ))}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,marginTop:4 }}>
                  <span style={{ color:"rgba(255,255,255,0.4)",fontSize:13 }}>Total Amount</span>
                  <span style={{ color:"#F97316",fontWeight:900,fontSize:34,letterSpacing:"-1px" }}>₹{total}</span>
                </div>
                <div style={{ marginTop:20,padding:"13px",borderRadius:10,background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.2)",color:"#FDBA74",fontSize:13,fontWeight:600,textAlign:"center" }}>
                  Share on WhatsApp →
                </div>
              </div>
              <div>
                <div style={{ fontWeight:900,fontSize:72,color:"#F0EFEB",lineHeight:1,letterSpacing:"-4px",marginBottom:4 }}>02</div>
                <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:16 }}>Billing & Orders</div>
                <h3 style={{ fontWeight:900,fontSize:"clamp(22px,3vw,36px)",letterSpacing:"-1px",marginBottom:16 }}>A complete, accurate bill in under 10 seconds.</h3>
                <p style={{ color:"#555",fontSize:15,lineHeight:1.88,marginBottom:28 }}>Select the garment, enter the quantity — the rate fills automatically from your price list and the total calculates instantly. No manual math. No mistakes.</p>
                {["Your rates, set exactly how you want","Auto-calculated totals, zero errors","Share on WhatsApp or print for customer"].map((pt,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10,fontSize:14,color:"#0C0C0E" }}>
                    <div style={{ width:6,height:6,borderRadius:"50%",background:"#F97316",flexShrink:0 }}/>
                    {pt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 03 — Reports */}
          <div className="reveal">
            <div className="feat-row">
              <div>
                <div style={{ fontWeight:900,fontSize:72,color:"#F0EFEB",lineHeight:1,letterSpacing:"-4px",marginBottom:4 }}>03</div>
                <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:16 }}>Reports & Labour</div>
                <h3 style={{ fontWeight:900,fontSize:"clamp(22px,3vw,36px)",letterSpacing:"-1px",marginBottom:16 }}>Know your numbers. Every day.</h3>
                <p style={{ color:"#555",fontSize:15,lineHeight:1.88,marginBottom:28 }}>Daily and monthly revenue reports. Worker output tracking and automatic wage calculation. Expense recording by category. Your shop's finances, completely visible — no guesswork.</p>
                {["Daily and monthly revenue reports","Worker tracking and auto wage calculation","Expenses by category — rent, salary, materials"].map((pt,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10,fontSize:14,color:"#0C0C0E" }}>
                    <div style={{ width:6,height:6,borderRadius:"50%",background:"#F97316",flexShrink:0 }}/>
                    {pt}
                  </div>
                ))}
              </div>
              <div className="mock-hover" style={{ background:"#F9F9F8",border:"1px solid #E8E8E8",borderRadius:16,padding:24,overflow:"hidden" }}>
                <div style={{ fontWeight:700,fontSize:13,marginBottom:20,color:"#0C0C0E" }}>June 2026 — Monthly Report</div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24 }}>
                  {[["₹48,200","Revenue","#F97316"],["22","Orders","#0C0C0E"],["17","Delivered","#16a34a"],["₹37,000","Net Profit","#4F46E5"]].map(([v,l,c]) => (
                    <div key={String(l)} style={{ background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"14px 12px" }}>
                      <div style={{ color:c as string,fontWeight:900,fontSize:22,letterSpacing:-0.5 }}>{v}</div>
                      <div style={{ color:"#94a3b8",fontSize:10,marginTop:3,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em" }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontWeight:700,fontSize:10,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10 }}>Daily Revenue — June</div>
                <div style={{ display:"flex",alignItems:"flex-end",gap:3,height:64 }}>
                  {[55,70,45,90,65,80,100,60,75,88,50,92,70,84,40,78,95,60,72,88,100,65,80].map((h,i) => (
                    <div key={i} style={{ flex:1,borderRadius:"2px 2px 0 0",background:h>85?"#F97316":"#E8E8E8",height:`${h}%`,transition:"height .3s" }}/>
                  ))}
                </div>
                <div style={{ marginTop:20,borderTop:"1px solid #EBEBEB",paddingTop:16 }}>
                  <div style={{ fontWeight:700,fontSize:10,color:"#999",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12 }}>Top Workers — June</div>
                  {[["Raju Prasad","1,240 pieces","₹12,400"],["Mohan Lal","980 pieces","₹9,800"]].map(([n,pieces,wages]) => (
                    <div key={n} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <div style={{ width:28,height:28,borderRadius:8,background:"#F97316",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800 }}>{n[0]}</div>
                        <div>
                          <div style={{ fontWeight:700,fontSize:12 }}>{n}</div>
                          <div style={{ fontSize:10,color:"#94a3b8" }}>{pieces}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight:700,fontSize:12,color:"#16a34a" }}>{wages}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" style={{ padding:"96px 6%",background:"#F5F4F0",borderTop:"1px solid #E8E7E2" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className="reveal" style={{ marginBottom:72 }}>
            <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:14 }}>Reviews</div>
            <h2 style={{ fontWeight:900,fontSize:"clamp(26px,4vw,50px)",lineHeight:1.08,letterSpacing:"-1.5px" }}>What shop owners say.</h2>
          </div>

          {testimonials.map((t,i) => (
            <div key={i} className={`reveal d${i+1}`} style={{ display:"grid",gridTemplateColumns:"220px 1fr",gap:64,alignItems:"start",paddingBottom:56,marginBottom:56,borderBottom:i<2?"1px solid #E0DED8":"none" }} >
              <div>
                <div style={{ width:56,height:56,borderRadius:14,background:"#F97316",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:22,marginBottom:18 }}>{t.name[0]}</div>
                <div style={{ fontWeight:800,fontSize:15,color:"#0C0C0E",marginBottom:3 }}>{t.name}</div>
                <div style={{ fontSize:13,color:"#666" }}>{t.shop}</div>
                <div style={{ fontSize:13,color:"#F97316",fontWeight:600,marginTop:3 }}>{t.city}</div>
                <div style={{ display:"flex",gap:2,marginTop:12 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color:"#F59E0B",fontSize:15 }}>★</span>)}
                </div>
              </div>
              <blockquote style={{ fontStyle:"italic",fontSize:"clamp(17px,2vw,24px)",color:"#0C0C0E",lineHeight:1.68,fontWeight:500,letterSpacing:"-0.3px",borderLeft:"3px solid #F97316",paddingLeft:32,margin:0 }}>
                "{t.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"112px 6%",background:"#0C0C0E" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className="cta-grid reveal" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center" }}>
            <div>
              <div style={{ color:"#F97316",fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:16 }}>Get Started</div>
              <h2 style={{ color:"#fff",fontWeight:900,fontSize:"clamp(32px,5vw,60px)",lineHeight:1.05,letterSpacing:"-2px",marginBottom:18 }}>
                Ready to run your shop the right way?
              </h2>
              <p style={{ color:"rgba(255,255,255,0.4)",fontSize:15,lineHeight:1.8 }}>
                Contact us on WhatsApp — we will set up LaundryPro for your shop today. Same-day setup. No technical knowledge needed.
              </p>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <a href={waUrl} target="_blank" rel="noreferrer"
                style={{ display:"flex",alignItems:"center",gap:16,padding:"22px 26px",borderRadius:14,background:"#22c55e",color:"#fff",textDecoration:"none",transition:"background .15s, transform .15s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="#16a34a";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="#22c55e";(e.currentTarget as HTMLElement).style.transform="none"}}>
                <div style={{ width:46,height:46,borderRadius:12,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight:800,fontSize:17 }}>WhatsApp Us Now</div>
                  <div style={{ fontSize:13,opacity:0.75,marginTop:2 }}>Usually responds within 1 hour</div>
                </div>
              </a>
              <a href="/dashboard"
                style={{ display:"flex",alignItems:"center",gap:16,padding:"22px 26px",borderRadius:14,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",textDecoration:"none",transition:"background .15s, transform .15s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.09)";(e.currentTarget as HTMLElement).style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.05)";(e.currentTarget as HTMLElement).style.transform="none"}}>
                <div style={{ width:46,height:46,borderRadius:12,background:"rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight:800,fontSize:17 }}>Try the Live Demo</div>
                  <div style={{ fontSize:13,opacity:0.45,marginTop:2 }}>See the full software in action — no signup</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:"#080809",padding:"26px 6%",borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:28,height:28,borderRadius:7,background:"#F97316",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
            </div>
            <span style={{ color:"rgba(255,255,255,0.4)",fontSize:13 }}>LaundryPro · © 2026 · Laundry Management Software for India</span>
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <a href="/dashboard" style={{ padding:"7px 14px",borderRadius:7,background:"rgba(249,115,22,0.12)",color:"#F97316",fontSize:12,fontWeight:700,textDecoration:"none" }}>Try Demo</a>
            <a href={waUrl} target="_blank" rel="noreferrer" style={{ padding:"7px 14px",borderRadius:7,background:"rgba(34,197,94,0.08)",color:"#4ade80",fontSize:12,fontWeight:700,textDecoration:"none" }}>WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
