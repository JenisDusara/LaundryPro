import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon serverless SQL client for the marketing site.
 *
 * IMPORTANT: this reuses the same Neon database as the product, but only ever
 * touches its own clearly-namespaced tables (`marketing_leads`,
 * `marketing_reviews`). Tables are created with CREATE TABLE IF NOT EXISTS and
 * never dropped, so product tables are never affected.
 *
 * The client is created lazily (on first query), NOT at module load — otherwise
 * `next build` throws when DATABASE_URL isn't present in the build environment.
 */
let _client: NeonQueryFunction<false, false> | null = null;
function client(): NeonQueryFunction<false, false> {
  if (!_client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _client = neon(url);
  }
  return _client;
}

// Tagged-template proxy so existing `sql`...`` usage keeps working, but neon()
// is only invoked at request time.
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  client()(strings, ...values)) as unknown as NeonQueryFunction<false, false>;

export type Lead = {
  id: number;
  name: string;
  shop: string;
  phone: string;
  email: string;
  status: "new" | "contacted" | "converted";
  notes: string;
  follow_up_date: string;
  archived_at: string | null;
  email_status: "pending" | "sent" | "failed" | "";
  email_error: string;
  created_at: string;
  ip: string;
};

export type Review = {
  id: number;
  name: string;
  city: string;
  quote: string;
  rating: number;
  published: boolean;
  created_at: string;
};

let ready: Promise<void> | null = null;

/** Idempotently create the marketing tables. Safe to call on every request. */
export function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS marketing_leads (
          id         SERIAL PRIMARY KEY,
          name       TEXT NOT NULL DEFAULT '',
          shop       TEXT NOT NULL DEFAULT '',
          phone      TEXT NOT NULL DEFAULT '',
          email      TEXT NOT NULL DEFAULT '',
          status     TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // add email to any table created before this column existed
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS ip TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS follow_up_date TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ`;
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'pending'`;
      await sql`ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS email_error TEXT NOT NULL DEFAULT ''`;
      await sql`
        CREATE INDEX IF NOT EXISTS marketing_leads_status_created_idx
        ON marketing_leads (status, created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS marketing_leads_archived_created_idx
        ON marketing_leads (archived_at, created_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS marketing_reviews (
          id         SERIAL PRIMARY KEY,
          name       TEXT NOT NULL,
          city       TEXT NOT NULL DEFAULT '',
          quote      TEXT NOT NULL,
          rating     INTEGER NOT NULL DEFAULT 5,
          published  BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS marketing_admin_login_events (
          id         SERIAL PRIMARY KEY,
          ip         TEXT NOT NULL DEFAULT '',
          ok         BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS marketing_admin_login_events_ip_created_idx
        ON marketing_admin_login_events (ip, created_at DESC)
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS marketing_admin_activity (
          id         SERIAL PRIMARY KEY,
          action     TEXT NOT NULL DEFAULT '',
          entity     TEXT NOT NULL DEFAULT '',
          entity_id  INTEGER,
          detail     TEXT NOT NULL DEFAULT '',
          ip         TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS marketing_admin_activity_created_idx
        ON marketing_admin_activity (created_at DESC)
      `;
    })().catch((e) => {
      // reset so a later request can retry if the first attempt failed
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function logActivity(
  action: string,
  entity: string,
  entityId: number | null,
  detail = "",
  ip = ""
): Promise<void> {
  try {
    await ensureTables();
    await sql`
      INSERT INTO marketing_admin_activity (action, entity, entity_id, detail, ip)
      VALUES (${action}, ${entity}, ${entityId}, ${detail.slice(0, 500)}, ${ip})
    `;
  } catch (e) {
    console.error("Marketing admin activity not recorded:", e instanceof Error ? e.message : e);
  }
}
