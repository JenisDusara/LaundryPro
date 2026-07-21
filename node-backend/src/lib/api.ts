"use client";
import axios, { AxiosResponse } from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use(config => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const shopId = localStorage.getItem("sa_shop_id");
    if (shopId) config.headers["x-selected-shop"] = shopId;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Lightweight GET cache (stale-for-a-few-seconds) ──────────────────────────
// Revisiting a page you just viewed (back/forth, tab switches) returns instantly
// from memory instead of hitting the serverless DB again — the app feels snappy.
// Any write (POST/PUT/PATCH/DELETE) clears the cache so data stays correct after
// a change. JSON GETs only; invoice/export HTML (responseType:"text") is skipped.
const TTL = 20_000; // ms a cached GET stays "fresh enough" to serve instantly
const MAX_CACHE = 120; // cap entries so a long read-only session can't grow memory unbounded
const cache = new Map<string, { ts: number; res: AxiosResponse }>();

const keyOf = (url: string, config?: any) => {
  const shop = (typeof window !== "undefined" && localStorage.getItem("sa_shop_id")) || "";
  const params = config?.params ? JSON.stringify(config.params) : "";
  return `${url}|${params}|${shop}`;
};

const rawGet = api.get.bind(api);
(api as any).get = (url: string, config?: any) => {
  const skip = config && (config.responseType === "text" || config.noCache);
  if (skip) return rawGet(url, config);
  const k = keyOf(url, config);
  const hit = cache.get(k);
  const now = Date.now();
  if (hit && now - hit.ts < TTL) return Promise.resolve(hit.res);
  return rawGet(url, config).then(res => {
    if (cache.size >= MAX_CACHE) { const oldest = cache.keys().next().value; if (oldest !== undefined) cache.delete(oldest); }
    cache.set(k, { ts: Date.now(), res });
    return res;
  });
};

// Clear the GET cache after any mutation so the next read is fresh.
for (const m of ["post", "put", "patch", "delete"] as const) {
  const raw = (api[m] as any).bind(api);
  (api as any)[m] = (...args: any[]) => raw(...args).then((res: AxiosResponse) => { cache.clear(); return res; });
}

export default api;
