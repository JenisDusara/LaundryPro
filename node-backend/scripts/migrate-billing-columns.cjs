/*
 * Runs scripts/add-billing-columns.sql against the database in DATABASE_URL.
 * Idempotent — safe to run any number of times.
 *
 * Usage (from node-backend/):
 *   node scripts/migrate-billing-columns.cjs
 *       → uses DATABASE_URL from .env (your current DB)
 *
 *   # To target PRODUCTION explicitly, pass the prod URL inline:
 *   DATABASE_URL="postgres://...neon.../prod" node scripts/migrate-billing-columns.cjs
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

// Load DATABASE_URL: prefer the environment, else read it from .env.
let url = process.env.DATABASE_URL;
if (!url) {
  try {
    const envTxt = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
    const m = envTxt.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/m);
    if (m) url = m[1].trim().replace(/^["']|["']$/g, "");
  } catch { /* no .env */ }
}
if (!url) { console.error("❌ DATABASE_URL not set (env or .env)"); process.exit(1); }

const sql = fs.readFileSync(path.join(__dirname, "add-billing-columns.sql"), "utf8");
// Split into individual statements (strip SQL comments + blank lines first).
const statements = sql
  .split("\n").filter(l => !l.trim().startsWith("--")).join("\n")
  .split(";").map(s => s.trim()).filter(Boolean);

const prisma = new PrismaClient({ datasources: { db: { url } } });

(async () => {
  const host = (url.match(/@([^/:]+)/) || [])[1] || "unknown-host";
  console.log(`Applying ${statements.length} column(s) to DB @ ${host} …\n`);
  let ok = 0;
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      const col = (stmt.match(/ADD COLUMN IF NOT EXISTS (\w+)/) || [])[1] || stmt.slice(0, 48);
      console.log(`  ✓ ${col}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${stmt.slice(0, 60)}…  → ${e.message}`);
    }
  }
  await prisma.$disconnect();
  console.log(`\nDone — ${ok}/${statements.length} applied. (Re-running is safe.)`);
  process.exit(ok === statements.length ? 0 : 1);
})();
