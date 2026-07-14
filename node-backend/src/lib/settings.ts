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
}

// Fields a client is allowed to write. id / shop_id / timestamps are never accepted from the request.
const EDITABLE: (keyof ShopProfile)[] = [
  "shop_name", "tagline", "phone", "address", "email", "upi_id", "gst_number", "gst_rate",
  "invoice_terms", "footer_note", "default_labour_rate", "logo_data", "weekly_report_enabled",
];

const NUMERIC: (keyof ShopProfile)[] = ["gst_rate", "default_labour_rate"];
const BOOLEAN: (keyof ShopProfile)[] = ["weekly_report_enabled"];

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
  };
}

// wa_auto_enabled lives in a column the generated Prisma client may not know yet, so it is
// read/written via raw SQL (same pattern as delivery_date / labour). Defensive: if the
// column doesn't exist, reads return false and writes are skipped.
async function readWaAuto(shopId: string): Promise<boolean> {
  try {
    const r = await prisma.$queryRawUnsafe<{ wa_auto_enabled: boolean }[]>(
      `SELECT wa_auto_enabled FROM shop_profiles WHERE shop_id = $1`, shopId
    );
    return !!r[0]?.wa_auto_enabled;
  } catch { return false; }
}

export async function getShopProfile(shopId: string): Promise<ShopProfile> {
  const row = await withRetry(() => prisma.shopProfile.findUnique({ where: { shop_id: shopId } }));
  const wa_auto_enabled = await readWaAuto(shopId);
  if (!row) return { ...defaults(), wa_auto_enabled };
  return {
    wa_auto_enabled,
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
  // wa_auto_enabled handled separately via raw SQL (see readWaAuto note above).
  if ("wa_auto_enabled" in data) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE shop_profiles SET wa_auto_enabled = $1 WHERE shop_id = $2`, Boolean(data.wa_auto_enabled), shopId
      );
    } catch { /* column not present yet */ }
  }
  return getShopProfile(shopId);
}
