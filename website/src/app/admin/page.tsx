"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Lock,
  LogOut,
  Users,
  Star,
  Download,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type Lead = {
  id: number;
  name: string;
  shop: string;
  phone: string;
  email: string;
  status: "new" | "contacted" | "converted";
  created_at: string;
};

type Review = {
  id: number;
  name: string;
  city: string;
  quote: string;
  rating: number;
  published: boolean;
  created_at: string;
};

const STATUS_STYLE: Record<Lead["status"], string> = {
  new: "bg-navy/10 text-navy dark:bg-sky-400/15 dark:text-sky-300",
  contacted: "bg-amber/15 text-amber-deep dark:text-amber",
  converted: "bg-wa/15 text-wa-deep",
};

function fmt(d: string) {
  const date = new Date(d);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"leads" | "reviews">("leads");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // new-review form
  const [rName, setRName] = useState("");
  const [rCity, setRCity] = useState("");
  const [rQuote, setRQuote] = useState("");
  const [rRating, setRRating] = useState(5);
  const [savingReview, setSavingReview] = useState(false);

  const loadData = useCallback(async () => {
    const r = await fetch("/api/leads", { cache: "no-store" });
    if (r.status === 401) {
      setAuthed(false);
      return;
    }
    setAuthed(true);
    const d = await r.json();
    setLeads(d.leads || []);
    const rv = await fetch("/api/reviews?all=1", { cache: "no-store" });
    const dv = await rv.json();
    setReviews(dv.reviews || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    setBusy(true);
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (r.ok) {
      setPassword("");
      loadData();
    } else {
      setLoginErr("Wrong password. Try again.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setLeads([]);
    setReviews([]);
  }

  async function setStatus(id: number, status: Lead["status"]) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function delLead(id: number) {
    if (!window.confirm("Delete this lead?")) return;
    setLeads((ls) => ls.filter((l) => l.id !== id));
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
  }

  async function addReview(e: React.FormEvent) {
    e.preventDefault();
    if (!rName.trim() || !rQuote.trim()) return;
    setSavingReview(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rName, city: rCity, quote: rQuote, rating: rRating }),
    });
    setSavingReview(false);
    setRName("");
    setRCity("");
    setRQuote("");
    setRRating(5);
    const rv = await fetch("/api/reviews?all=1", { cache: "no-store" });
    const dv = await rv.json();
    setReviews(dv.reviews || []);
  }

  async function togglePublish(r: Review) {
    setReviews((rs) =>
      rs.map((x) => (x.id === r.id ? { ...x, published: !x.published } : x))
    );
    await fetch(`/api/reviews/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !r.published }),
    });
  }

  async function delReview(id: number) {
    if (!window.confirm("Delete this review?")) return;
    setReviews((rs) => rs.filter((x) => x.id !== id));
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
  }

  const stats = useMemo(() => {
    const now = Date.now();
    const week = leads.filter(
      (l) => now - new Date(l.created_at).getTime() < 7 * 864e5
    ).length;
    return {
      total: leads.length,
      week,
      new: leads.filter((l) => l.status === "new").length,
      converted: leads.filter((l) => l.status === "converted").length,
    };
  }, [leads]);

  // ---------- loading ----------
  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-muted">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

  // ---------- login ----------
  if (!authed) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-5">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 shadow-card"
        >
          <div className="mb-6 flex justify-center">
            <Logo size={40} />
          </div>
          <div className="mb-5 flex items-center gap-2 text-[15px] font-bold text-text">
            <Lock size={16} className="text-navy dark:text-sky-400" /> Admin login
          </div>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-[14.5px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
          />
          {loginErr && (
            <p className="mt-2 text-[13px] font-medium text-danger">{loginErr}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-gradient mt-4 w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-navy disabled:opacity-60"
          >
            {busy ? "Checking…" : "Log in"}
          </button>
        </form>
      </div>
    );
  }

  // ---------- dashboard ----------
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <span className="rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-navy dark:bg-sky-400/15 dark:text-sky-300">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-muted transition-colors hover:text-text"
              aria-label="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[13px] font-semibold text-text transition-colors hover:border-danger/40 hover:text-danger"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total leads", value: stats.total },
            { label: "This week", value: stats.week },
            { label: "New", value: stats.new },
            { label: "Converted", value: stats.converted },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-line bg-card p-5 shadow-card"
            >
              <div className="font-display text-[30px] font-extrabold leading-none text-text">
                {s.value}
              </div>
              <div className="mt-1.5 text-[12.5px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="mt-8 flex gap-1 rounded-xl border border-line bg-card p-1">
          {[
            { k: "leads" as const, label: "Registrations", icon: Users },
            { k: "reviews" as const, label: "Reviews", icon: Star },
          ].map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                tab === k
                  ? "bg-navy text-white shadow-navy"
                  : "text-muted hover:text-text"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* LEADS */}
        {tab === "leads" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-text">
                Demo registrations
              </h2>
              <a
                href="/api/leads/export"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[13px] font-semibold text-text transition-colors hover:border-navy/40"
              >
                <Download size={14} /> Export CSV
              </a>
            </div>

            {leads.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-card/50 p-10 text-center text-[14px] text-muted">
                No registrations yet. They&apos;ll appear here when someone books a
                demo.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead className="border-b border-line text-[12px] uppercase tracking-wide text-faint">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Shop</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">When</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-navy/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-text">{l.name || "—"}</div>
                            {l.email && (
                              <a
                                href={`mailto:${l.email}`}
                                className="text-[11px] text-muted transition-colors hover:text-navy dark:hover:text-sky-400"
                              >
                                {l.email}
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted">{l.shop || "—"}</td>
                          <td className="px-4 py-3 text-muted">
                            {l.phone ? (
                              <a
                                href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-wa-deep hover:underline"
                              >
                                {l.phone}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted">
                            {fmt(l.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={l.status}
                              onChange={(e) =>
                                setStatus(l.id, e.target.value as Lead["status"])
                              }
                              className={`rounded-full px-2.5 py-1 text-[12px] font-bold outline-none ${STATUS_STYLE[l.status]}`}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="converted">Converted</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => delLead(l.id)}
                              className="text-faint transition-colors hover:text-danger"
                              aria-label="Delete lead"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {tab === "reviews" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* list */}
            <div>
              <h2 className="mb-3 text-[15px] font-bold text-text">
                Customer reviews{" "}
                <span className="text-muted">
                  ({reviews.filter((r) => r.published).length} live)
                </span>
              </h2>
              {reviews.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-card/50 p-10 text-center text-[14px] text-muted">
                  No reviews yet. Add one on the right — it shows on the site
                  instantly.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-2xl border p-5 shadow-card transition-colors ${
                        r.published
                          ? "border-line bg-card"
                          : "border-dashed border-line bg-card/50 opacity-70"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={14} className="fill-amber text-amber" />
                        ))}
                      </div>
                      <p className="text-[14px] leading-relaxed text-text">
                        &ldquo;{r.quote}&rdquo;
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-[13px] font-semibold text-text">
                          {r.name}
                          {r.city && (
                            <span className="font-normal text-muted"> · {r.city}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePublish(r)}
                            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-muted transition-colors hover:text-text"
                          >
                            {r.published ? (
                              <>
                                <Eye size={14} /> Live
                              </>
                            ) : (
                              <>
                                <EyeOff size={14} /> Hidden
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => delReview(r.id)}
                            className="text-faint transition-colors hover:text-danger"
                            aria-label="Delete review"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* add form */}
            <form
              onSubmit={addReview}
              className="h-fit rounded-2xl border border-line bg-card p-6 shadow-card lg:sticky lg:top-24"
            >
              <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-text">
                <Plus size={16} className="text-navy dark:text-sky-400" /> Add a review
              </h3>
              <div className="space-y-3">
                <input
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
                />
                <input
                  value={rCity}
                  onChange={(e) => setRCity(e.target.value)}
                  placeholder="City (e.g. Surat)"
                  className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
                />
                <textarea
                  value={rQuote}
                  onChange={(e) => setRQuote(e.target.value)}
                  placeholder="What the customer said…"
                  rows={4}
                  className="w-full resize-y rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-muted">Rating</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRRating(n)}
                      aria-label={`${n} stars`}
                    >
                      <Star
                        size={20}
                        className={
                          n <= rRating
                            ? "fill-amber text-amber"
                            : "text-line"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={savingReview || !rName.trim() || !rQuote.trim()}
                className="btn-gradient mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-navy disabled:opacity-60"
              >
                {savingReview ? "Adding…" : "Add review"}
              </button>
              <p className="mt-2 text-center text-[12px] text-faint">
                Shows in the site&apos;s Reviews section right away.
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
