# Weekly Report Email — Plan & Implementation

Automated weekly business-report email for each shop, sent every Sunday, with a
manual "Send now" option and a superadmin audit log.

## Goal

Every shop's admin should receive an email each Sunday summarizing the past
week: revenue, entries, delivered/pending counts, new customers, expenses, and
outstanding udhaar (dues) — with a detailed Excel file attached. No third-party
paid service; reuses the app's existing Gmail/nodemailer setup.

## How it works

```
Netlify Scheduled Function (Sunday 08:00 IST)
        │  POST + x-cron-secret
        ▼
/api/cron/weekly-report            /api/reports/weekly/send
  (all shops, respects toggle)       (one shop, manual "Send now",
        │                             always sends, ignores toggle)
        └───────────────┬───────────────┘
                         ▼
          sendWeeklyReportForShop()  (src/lib/weeklyReport.ts)
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
  Query Prisma      Build Excel        Send email via
  (entries,         report              lib/email.ts
  payments,         (ExcelJS)           (nodemailer/Gmail)
  expenses, dues)                            │
        │                                    ▼
        └──────────────────────────►  WeeklyReportLog row
                                       (sent / skipped / failed)
```

## Data model (`prisma/schema.prisma`)

- `ShopProfile.weekly_report_enabled` (`Boolean`, default `true`) — per-shop
  on/off switch for the automatic Sunday email.
- `WeeklyReportLog` — one row per send attempt: `shop_id`, `week_start`,
  `week_end`, `status` (`sent` | `skipped` | `failed`), `reason`, `created_at`.

## Key files

| File | Purpose |
|---|---|
| `src/lib/dates.ts` | `lastWeekRange()` — the past 7 days ending yesterday (IST) |
| `src/lib/email.ts` | `weeklyReportEmailHtml()` — email body template |
| `src/lib/weeklyReport.ts` | `sendWeeklyReportForShop()` — shared logic: fetch stats, build Excel, send email, write log |
| `src/app/api/cron/weekly-report/route.ts` | Loops over all shops, called by the scheduled function (secret-header auth, no user JWT) |
| `src/app/api/reports/weekly/send/route.ts` | Manual "Send now" — JWT-authenticated, current shop only, `force: true` |
| `src/app/api/admin/weekly-report-logs/route.ts` | Superadmin-only — last 100 log rows across all shops |
| `netlify/functions/weekly-report-trigger.mts` | Netlify Scheduled Function, cron `30 2 * * 0` (Sun 08:00 IST) |
| `netlify.toml` | `[functions] directory = "netlify/functions"` |

## Report contents

Revenue, entry count, delivered/pending split, new customers, expenses,
outstanding udhaar (lifetime billed − paid, summed per customer), and a
top-services breakdown — mirrors the existing monthly Excel export
(`src/app/api/exports/combined/route.ts`) but scoped to the past week.

## UI

- **Admin → Settings page**: "Weekly report email" card — on/off toggle
  (saved via the existing `PUT /api/admin/settings`) + a "Send now" button
  that calls `/api/reports/weekly/send` immediately.
- **Superadmin panel**: collapsible "Weekly report log" section below the
  client table — shows every send attempt (sent/skipped/failed, reason,
  week range, date) across all shops.

## Required setup (not automatable — needs dashboard access)

1. Netlify env var `CRON_SECRET` — any random string, must match what
   `weekly-report-trigger.mts` sends and `/api/cron/weekly-report` checks.
2. Each shop's **Settings → Email** field must be filled — shops without an
   email are skipped (logged as `skipped`, reason "No shop email configured").
3. Netlify Scheduled Functions only run once deployed — they do not fire in
   local `next dev`.

## Manual test (after deploy)

```
curl -X POST https://<site>.netlify.app/api/cron/weekly-report \
  -H "x-cron-secret: <CRON_SECRET>"
```
