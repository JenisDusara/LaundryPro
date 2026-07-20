import { neon } from "@neondatabase/serverless";

/**
 * Neon serverless SQL client for the marketing site.
 *
 * IMPORTANT: this reuses the same Neon database as the product, but only ever
 * touches its own clearly-namespaced tables (`marketing_leads`,
 * `marketing_reviews`). Tables are created with CREATE TABLE IF NOT EXISTS and
 * never dropped, so product tables are never affected.
 */
export const sql = neon(process.env.DATABASE_URL!);

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
