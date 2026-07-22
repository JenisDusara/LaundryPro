"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarClock,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type LeadStatus = "new" | "contacted" | "converted";

type Lead = {
  id: number;
  name: string;
  shop: string;
  phone: string;
  email: string;
  status: LeadStatus;
  notes: string;
  follow_up_date: string;
  archived_at: string | null;
  email_status: "pending" | "sent" | "failed" | "";
  email_error: string;
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

type Activity = {
  id: number;
  action: string;
  entity: string;
  entity_id: number | null;
  detail: string;
  ip: string;
  created_at: string;
};

type LoginEvent = {
  id: number;
  ip: string;
  ok: boolean;
  created_at: string;
};

type Tab = "leads" | "reviews" | "activity" | "logins";

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-navy/10 text-navy dark:bg-sky-400/15 dark:text-sky-300",
  contacted: "bg-amber/15 text-amber-deep dark:text-amber",
  converted: "bg-wa/15 text-wa-deep",
};

const EMAIL_STYLE: Record<string, string> = {
  sent: "bg-wa/15 text-wa-deep",
  failed: "bg-danger/10 text-danger",
  pending: "bg-amber/15 text-amber-deep dark:text-amber",
  "": "bg-line text-muted",
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

function todayIso() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("leads");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [archived, setArchived] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dueOnly, setDueOnly] = useState(false);

  const [rName, setRName] = useState("");
  const [rCity, setRCity] = useState("");
  const [rQuote, setRQuote] = useState("");
  const [rRating, setRRating] = useState(5);
  const [savingReview, setSavingReview] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const leadQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (archived) params.set("archived", "1");
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (dueOnly) params.set("follow", "due");
    return params.toString();
  }, [archived, dueOnly, fromDate, q, statusFilter, toDate]);

  const exportHref = `/api/leads/export${leadQuery ? `?${leadQuery}` : ""}`;

  const loadData = useCallback(async () => {
    setLoadError("");
    try {
      const r = await fetch(`/api/leads${leadQuery ? `?${leadQuery}` : ""}`, {
        cache: "no-store",
      });
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      if (!r.ok) throw new Error("Could not load registrations");
      setAuthed(true);
      const d = await r.json();
      setLeads(d.leads || []);

      const [rv, ac, lg] = await Promise.all([
        fetch("/api/reviews?all=1", { cache: "no-store" }),
        fetch("/api/admin/activity", { cache: "no-store" }),
        fetch("/api/admin/login-events", { cache: "no-store" }),
      ]);
      if (rv.ok) setReviews((await rv.json()).reviews || []);
      if (ac.ok) setActivity((await ac.json()).activity || []);
      if (lg.ok) setLoginEvents((await lg.json()).events || []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load admin data");
      setAuthed((v) => v ?? false);
    }
  }, [leadQuery]);

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
      setLoginErr(r.status === 429 ? "Too many attempts. Try again later." : "Wrong password. Try again.");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setLeads([]);
    setReviews([]);
    setActivity([]);
    setLoginEvents([]);
  }

  async function saveLead(id: number, patch: Partial<Lead>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const r = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) loadData();
  }

  async function archiveLead(id: number, restore = false) {
    const label = restore ? "restore this lead" : "archive this lead";
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    setLeads((ls) => ls.filter((l) => l.id !== id));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: restore ? "restore" : "archive" }),
    });
    loadData();
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
    loadData();
  }

  function startEditReview(r: Review) {
    setEditingReview({ ...r });
  }

  async function saveReviewEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingReview?.name.trim() || !editingReview.quote.trim()) return;
    await fetch(`/api/reviews/${editingReview.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingReview),
    });
    setEditingReview(null);
    loadData();
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
    loadData();
  }

  async function delReview(id: number) {
    if (!window.confirm("Delete this review?")) return;
    setReviews((rs) => rs.filter((x) => x.id !== id));
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    loadData();
  }

  const stats = useMemo(() => {
    const now = Date.now();
    const active = leads.filter((l) => !l.archived_at);
    return {
      total: active.length,
      week: active.filter((l) => now - new Date(l.created_at).getTime() < 7 * 864e5).length,
      new: active.filter((l) => l.status === "new").length,
      converted: active.filter((l) => l.status === "converted").length,
    };
  }, [leads]);

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-muted">
        <RefreshCw className="animate-spin" />
      </div>
    );
  }

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
          {loginErr && <p className="mt-2 text-[13px] font-medium text-danger">{loginErr}</p>}
          <button
            type="submit"
            disabled={busy}
            className="btn-gradient mt-4 w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-navy disabled:opacity-60"
          >
            {busy ? "Checking..." : "Log in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
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
              title="Refresh"
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

      <main className="mx-auto max-w-6xl px-5 py-8">
        {loadError && (
          <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-[13px] font-semibold text-danger">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active leads", value: stats.total },
            { label: "This week", value: stats.week },
            { label: "New", value: stats.new },
            { label: "Converted", value: stats.converted },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-card p-5 shadow-card">
              <div className="font-display text-[30px] font-extrabold leading-none text-text">
                {s.value}
              </div>
              <div className="mt-1.5 text-[12.5px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-1 rounded-xl border border-line bg-card p-1 sm:grid-cols-4">
          {[
            { k: "leads" as const, label: "Registrations", icon: Users },
            { k: "reviews" as const, label: "Reviews", icon: Star },
            { k: "activity" as const, label: "Activity", icon: ClipboardList },
            { k: "logins" as const, label: "Logins", icon: ShieldCheck },
          ].map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
                tab === k ? "bg-navy text-white shadow-navy" : "text-muted hover:text-text"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === "leads" && (
          <div className="mt-6">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[15px] font-bold text-text">Demo registrations</h2>
                <p className="mt-1 text-[12.5px] text-muted">
                  Showing latest 500 matching records.
                </p>
              </div>
              <a
                href={exportHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-[13px] font-semibold text-text transition-colors hover:border-navy/40"
              >
                <Download size={14} /> Export CSV
              </a>
            </div>

            <div className="mb-4 grid gap-2 rounded-2xl border border-line bg-card p-3 shadow-card md:grid-cols-[minmax(180px,1.5fr)_150px_130px_130px_130px_120px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, shop, phone, email"
                  className="w-full rounded-xl border border-line bg-bg py-2.5 pl-9 pr-3 text-[13.5px] text-text outline-none focus:border-navy/60"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-[13.5px] text-text outline-none focus:border-navy/60"
              >
                <option value="">All status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-[13.5px] text-text outline-none focus:border-navy/60"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border border-line bg-bg px-3 py-2.5 text-[13.5px] text-text outline-none focus:border-navy/60"
              />
              <button
                type="button"
                onClick={() => setDueOnly((v) => !v)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  dueOnly ? "border-amber/50 bg-amber/15 text-amber-deep dark:text-amber" : "border-line bg-bg text-muted hover:text-text"
                }`}
              >
                <CalendarClock size={14} /> Due
              </button>
              <button
                type="button"
                onClick={() => setArchived((v) => !v)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                  archived ? "border-navy/40 bg-navy/10 text-navy dark:text-sky-300" : "border-line bg-bg text-muted hover:text-text"
                }`}
              >
                <Archive size={14} /> Archive
              </button>
            </div>

            {leads.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-card/50 p-10 text-center text-[14px] text-muted">
                No registrations found.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1060px] text-left text-[13.5px]">
                    <thead className="border-b border-line text-[12px] uppercase tracking-wide text-faint">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Phone</th>
                        <th className="px-4 py-3 font-semibold">When</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Follow-up</th>
                        <th className="px-4 py-3 font-semibold">Notes</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {leads.map((l) => {
                        const due = l.follow_up_date && l.follow_up_date <= todayIso();
                        return (
                          <tr key={l.id} className="hover:bg-navy/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-text">{l.name || "-"}</div>
                              <div className="text-[12px] text-muted">{l.shop || "-"}</div>
                              {l.email && (
                                <a
                                  href={`mailto:${l.email}`}
                                  className="mt-0.5 inline-flex items-center gap-1 text-[11.5px] text-muted transition-colors hover:text-navy dark:hover:text-sky-400"
                                >
                                  <Mail size={11} /> {l.email}
                                </a>
                              )}
                            </td>
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
                                "-"
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-muted">{fmt(l.created_at)}</td>
                            <td className="px-4 py-3">
                              <select
                                value={l.status}
                                onChange={(e) => saveLead(l.id, { status: e.target.value as LeadStatus })}
                                className={`rounded-full px-2.5 py-1 text-[12px] font-bold outline-none ${STATUS_STYLE[l.status]}`}
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={l.follow_up_date || ""}
                                onChange={(e) => setLeads((ls) => ls.map((x) => (x.id === l.id ? { ...x, follow_up_date: e.target.value } : x)))}
                                onBlur={(e) => saveLead(l.id, { follow_up_date: e.target.value })}
                                className={`w-[140px] rounded-lg border bg-bg px-2 py-1.5 text-[12.5px] outline-none ${
                                  due ? "border-amber/60 text-amber-deep dark:text-amber" : "border-line text-text"
                                }`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <textarea
                                value={l.notes || ""}
                                onChange={(e) => setLeads((ls) => ls.map((x) => (x.id === l.id ? { ...x, notes: e.target.value } : x)))}
                                onBlur={(e) => saveLead(l.id, { notes: e.target.value })}
                                rows={2}
                                placeholder="Internal notes"
                                className="w-[220px] resize-y rounded-lg border border-line bg-bg px-2 py-1.5 text-[12.5px] text-text outline-none focus:border-navy/60"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${EMAIL_STYLE[l.email_status || ""]}`}
                                title={l.email_error || undefined}
                              >
                                {l.email_status || "unknown"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => archiveLead(l.id, Boolean(l.archived_at))}
                                className="text-faint transition-colors hover:text-danger"
                                aria-label={l.archived_at ? "Restore lead" : "Archive lead"}
                                title={l.archived_at ? "Restore lead" : "Archive lead"}
                              >
                                {l.archived_at ? <RotateCcw size={15} /> : <Archive size={15} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "reviews" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <h2 className="mb-3 text-[15px] font-bold text-text">
                Customer reviews{" "}
                <span className="text-muted">({reviews.filter((r) => r.published).length} live)</span>
              </h2>
              {reviews.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-card/50 p-10 text-center text-[14px] text-muted">
                  No reviews yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-2xl border p-5 shadow-card transition-colors ${
                        r.published ? "border-line bg-card" : "border-dashed border-line bg-card/50 opacity-80"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={14} className="fill-amber text-amber" />
                        ))}
                      </div>
                      <p className="text-[14px] leading-relaxed text-text">&ldquo;{r.quote}&rdquo;</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-[13px] font-semibold text-text">
                          {r.name}
                          {r.city && <span className="font-normal text-muted"> · {r.city}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startEditReview(r)}
                            className="text-faint transition-colors hover:text-text"
                            aria-label="Edit review"
                            title="Edit review"
                          >
                            <Pencil size={15} />
                          </button>
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
                            title="Delete review"
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

            <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
              {editingReview && (
                <form onSubmit={saveReviewEdit} className="rounded-2xl border border-line bg-card p-6 shadow-card">
                  <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-text">
                    <Pencil size={16} className="text-navy dark:text-sky-400" /> Edit review
                  </h3>
                  <ReviewFields
                    name={editingReview.name}
                    city={editingReview.city}
                    quote={editingReview.quote}
                    rating={editingReview.rating}
                    setName={(name) => setEditingReview((r) => (r ? { ...r, name } : r))}
                    setCity={(city) => setEditingReview((r) => (r ? { ...r, city } : r))}
                    setQuote={(quote) => setEditingReview((r) => (r ? { ...r, quote } : r))}
                    setRating={(rating) => setEditingReview((r) => (r ? { ...r, rating } : r))}
                  />
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingReview(null)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line px-5 py-3 text-sm font-bold text-text"
                    >
                      <X size={15} /> Cancel
                    </button>
                    <button type="submit" className="btn-gradient inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-navy">
                      <Save size={15} /> Save
                    </button>
                  </div>
                </form>
              )}

              <form onSubmit={addReview} className="rounded-2xl border border-line bg-card p-6 shadow-card">
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-text">
                  <Plus size={16} className="text-navy dark:text-sky-400" /> Add a review
                </h3>
                <ReviewFields
                  name={rName}
                  city={rCity}
                  quote={rQuote}
                  rating={rRating}
                  setName={setRName}
                  setCity={setRCity}
                  setQuote={setRQuote}
                  setRating={setRRating}
                />
                <button
                  type="submit"
                  disabled={savingReview || !rName.trim() || !rQuote.trim()}
                  className="btn-gradient mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold text-white shadow-navy disabled:opacity-60"
                >
                  {savingReview ? "Adding..." : "Add review"}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <AdminTable
            empty="No admin activity recorded yet."
            headers={["When", "Action", "Entity", "Detail", "IP"]}
            rows={activity.map((a) => [
              fmt(a.created_at),
              a.action,
              `${a.entity}${a.entity_id ? ` #${a.entity_id}` : ""}`,
              a.detail || "-",
              a.ip || "-",
            ])}
          />
        )}

        {tab === "logins" && (
          <AdminTable
            empty="No login attempts recorded yet."
            headers={["When", "Result", "IP"]}
            rows={loginEvents.map((e) => [
              fmt(e.created_at),
              e.ok ? "Success" : "Failed",
              e.ip || "-",
            ])}
          />
        )}
      </main>
    </div>
  );
}

function ReviewFields({
  name,
  city,
  quote,
  rating,
  setName,
  setCity,
  setQuote,
  setRating,
}: {
  name: string;
  city: string;
  quote: string;
  rating: number;
  setName: (value: string) => void;
  setCity: (value: string) => void;
  setQuote: (value: string) => void;
  setRating: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Customer name"
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
      />
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City"
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
      />
      <textarea
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        placeholder="Review text"
        rows={4}
        className="w-full resize-y rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] text-text outline-none focus:border-navy/60 focus:ring-2 focus:ring-navy/15"
      />
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-muted">Rating</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star size={20} className={n <= rating ? "fill-amber text-amber" : "text-line"} />
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-card">
      {rows.length === 0 ? (
        <p className="p-10 text-center text-[14px] text-muted">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13.5px]">
            <thead className="border-b border-line text-[12px] uppercase tracking-wide text-faint">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-navy/[0.02] dark:hover:bg-white/[0.02]">
                  {r.map((c, j) => (
                    <td key={`${i}-${j}`} className="px-4 py-3 text-muted">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
