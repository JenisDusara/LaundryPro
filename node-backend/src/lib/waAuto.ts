// Server-side client for the always-on WA-Service (Baileys). Thin HTTP wrappers used by
// the /api/whatsapp/* routes and the entry/payment auto-send hooks. If WA_SERVICE_URL is
// not configured, everything no-ops gracefully (feature simply disabled).

const BASE = process.env.WA_SERVICE_URL;
const SECRET = process.env.WA_SHARED_SECRET || "";

export function waConfigured(): boolean {
  return !!BASE;
}

async function waFetch(path: string, method: "GET" | "POST", body?: unknown): Promise<{ status: number; data: any } | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(BASE.replace(/\/$/, "") + path, {
      method,
      headers: { "Content-Type": "application/json", "x-wa-secret": SECRET },
      body: body ? JSON.stringify(body) : undefined,
      // Bound the wait so a hung WA-Service never blocks a request for long.
      signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch {
    return null;
  }
}

export async function waStatus(shopId: string): Promise<{ state: string; qr?: string | null; number?: string | null }> {
  const r = await waFetch(`/status?shop_id=${encodeURIComponent(shopId)}`, "GET");
  return r?.data ?? { state: "unavailable" };
}

export async function waConnect(shopId: string): Promise<{ state: string; qr?: string | null }> {
  const r = await waFetch(`/connect`, "POST", { shop_id: shopId });
  return r?.data ?? { state: "unavailable" };
}

export async function waPair(shopId: string, phone: string): Promise<{ state: string; pairingCode?: string | null }> {
  const r = await waFetch(`/pair`, "POST", { shop_id: shopId, phone });
  return r?.data ?? { state: "unavailable" };
}

export async function waDisconnect(shopId: string): Promise<{ ok?: boolean }> {
  const r = await waFetch(`/disconnect`, "POST", { shop_id: shopId });
  return r?.data ?? {};
}

// Best-effort send — never throws; returns whether it went through.
export async function waSend(shopId: string, phone: string, text: string): Promise<boolean> {
  const r = await waFetch(`/send`, "POST", { shop_id: shopId, phone, text });
  return !!(r && r.status === 200 && r.data?.ok);
}
