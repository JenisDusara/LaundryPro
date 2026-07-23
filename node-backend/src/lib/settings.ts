import prisma, { withRetry } from "@/lib/prisma";

export interface ShopProfile {
  shop_name: string;
  tagline: string;
  phone: string;
  address: string;
  email: string;
  upi_id: string;
  gst_number: string;
  gst_rate: number;
  invoice_terms: string;
  footer_note: string;
  default_labour_rate: number;
  logo_data: string | null;
  weekly_report_enabled: boolean;
  wa_auto_enabled: boolean;
  wa_show_prices: boolean; // when false, WhatsApp bills show only items (no price/total/balance)
  qr_show_full_phone: boolean;
  qr_show_full_address: boolean;
  qr_show_order_notes: boolean;
  qr_pending_expiry_days: number;
  qr_delivery_expiry_hours: number;
}

// Fields a client is allowed to write. id / shop_id / timestamps are never accepted from the request.
const EDITABLE: (keyof ShopProfile)[] = [
  "shop_name", "tagline", "phone", "address", "email", "upi_id", "gst_number", "gst_rate",
  "invoice_terms", "footer_note", "default_labour_rate", "logo_data", "weekly_report_enabled",
  "wa_auto_enabled", "wa_show_prices", "qr_show_full_phone", "qr_show_full_address",
  "qr_show_order_notes", "qr_pending_expiry_days", "qr_delivery_expiry_hours",
];

const NUMERIC: (keyof ShopProfile)[] = ["gst_rate", "default_labour_rate", "qr_pending_expiry_days", "qr_delivery_expiry_hours"];
const BOOLEAN: (keyof ShopProfile)[] = ["weekly_report_enabled", "wa_auto_enabled", "wa_show_prices", "qr_show_full_phone", "qr_show_full_address", "qr_show_order_notes"];

function defaults(shopName = ""): ShopProfile {
  return {
    shop_name: shopName,
    tagline: "",
    phone: "",
    address: "",
    email: "",
    upi_id: "",
    gst_number: "",
    gst_rate: 0,
    invoice_terms: "Garments held 30 days · not responsible for colour bleed or shrinkage",
    footer_note: "Thank you for your business",
    default_labour_rate: 2,
    logo_data: null,
    weekly_report_enabled: true,
    wa_auto_enabled: false,
    wa_show_prices: true,
    qr_show_full_phone: false,
    qr_show_full_address: false,
    qr_show_order_notes: true,
    qr_pending_expiry_days: 90,
    qr_delivery_expiry_hours: 2,
  };
}

// wa_auto_enabled / wa_show_prices live in columns the generated Prisma client may not know
// yet, so they're read/written via raw SQL (same pattern as delivery_date / labour). Defensive:
// if a column doesn't exist, wa_auto_enabled defaults false and wa_show_prices defaults true
// (preserving the current "show prices" behaviour).
async function readFeatureFlags(shopId: string): Promise<Pick<ShopProfile,
  "wa_auto_enabled" | "wa_show_prices" | "qr_show_full_phone" | "qr_show_full_address" |
  "qr_show_order_notes" | "qr_pending_expiry_days" | "qr_delivery_expiry_hours"
>> {
  const d = defaults();
  const flags = {
    wa_auto_enabled: d.wa_auto_enabled,
    wa_show_prices: d.wa_show_prices,
    qr_show_full_phone: d.qr_show_full_phone,
    qr_show_full_address: d.qr_show_full_address,
    qr_show_order_notes: d.qr_show_order_notes,
    qr_pending_expiry_days: d.qr_pending_expiry_days,
    qr_delivery_expiry_hours: d.qr_delivery_expiry_hours,
  };
  for (const key of Object.keys(flags) as (keyof typeof flags)[]) {
    try {
      const r = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT ${key} FROM shop_profiles WHERE shop_id = $1`, shopId);
      const v = r[0]?.[key];
      if (typeof flags[key] === "boolean") (flags as any)[key] = v === true;
      else (flags as any)[key] = Math.max(0, Number(v) || (d as any)[key]);
    } catch { /* column not present → default */ }
  }
  return flags;
}

export async function getShopProfile(shopId: string): Promise<ShopProfile> {
  const row = await withRetry(() => prisma.shopProfile.findUnique({ where: { shop_id: shopId } }));
  const flags = await readFeatureFlags(shopId);
  if (!row) return { ...defaults(), ...flags };
  return {
    ...flags,
    shop_name: row.shop_name,
    tagline: row.tagline,
    phone: row.phone,
    address: row.address,
    email: row.email,
    upi_id: row.upi_id,
    gst_number: row.gst_number,
    gst_rate: row.gst_rate,
    invoice_terms: row.invoice_terms,
    footer_note: row.footer_note,
    default_labour_rate: row.default_labour_rate,
    logo_data: row.logo_data,
    weekly_report_enabled: row.weekly_report_enabled,
  };
}

export async function upsertShopProfile(shopId: string, data: Record<string, unknown>): Promise<ShopProfile> {
  const clean: Record<string, string | number | boolean | null> = {};
  for (const key of EDITABLE) {
    if (key in data) {
      const v = data[key];
      if (key === "logo_data") clean[key] = v == null ? null : String(v);
      else if (NUMERIC.includes(key)) clean[key] = Math.max(0, Number(v) || 0);
      else if (BOOLEAN.includes(key)) clean[key] = Boolean(v);
      else clean[key] = String(v ?? "");
    }
  }
  await withRetry(() => prisma.shopProfile.upsert({
    where: { shop_id: shopId },
    update: clean,
    create: { shop_id: shopId, ...clean },
  }));
  // Defensive fallback for older databases where these columns have not been migrated yet.
  if ("wa_auto_enabled" in data) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE shop_profiles SET wa_auto_enabled = $1 WHERE shop_id = $2`, Boolean(data.wa_auto_enabled), shopId
      );
    } catch { /* column not present yet */ }
  }
  if ("wa_show_prices" in data) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE shop_profiles SET wa_show_prices = $1 WHERE shop_id = $2`, Boolean(data.wa_show_prices), shopId
      );
    } catch { /* column not present yet */ }
  }
  for (const key of ["wa_auto_enabled", "wa_show_prices", "qr_show_full_phone", "qr_show_full_address", "qr_show_order_notes", "qr_pending_expiry_days", "qr_delivery_expiry_hours"]) {
    if (key in data) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE shop_profiles SET ${key} = $1 WHERE shop_id = $2`, key.startsWith("qr_") && key.endsWith("_days") || key.endsWith("_hours") ? Math.max(0, Number((data as any)[key]) || 0) : Boolean((data as any)[key]), shopId
        );
      } catch { /* column not present yet */ }
    }
  }
  return getShopProfile(shopId);
}
