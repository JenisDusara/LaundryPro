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
  status: "new" | "contacted" | "converted";
  created_at: string;
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
          status     TEXT NOT NULL DEFAULT 'new',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
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
    })().catch((e) => {
      // reset so a later request can retry if the first attempt failed
      ready = null;
      throw e;
    });
  }
  return ready;
}
