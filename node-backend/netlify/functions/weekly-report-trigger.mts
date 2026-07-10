import type { Config } from "@netlify/functions";

// Runs every Sunday at 02:30 UTC = 08:00 IST. Netlify invokes this on its own —
// no request from the app. It just calls the real report logic in the Next.js API
// route (which has DB/email access) using a shared secret instead of a user JWT.
export default async () => {
  const siteUrl = process.env.URL || process.env.DEPLOY_URL;
  if (!siteUrl) {
    console.error("weekly-report-trigger: no site URL available in this environment");
    return;
  }

  const res = await fetch(`${siteUrl}/api/cron/weekly-report`, {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
  });

  const body = await res.text();
  console.log(`weekly-report-trigger: status=${res.status} body=${body}`);
};

export const config: Config = {
  schedule: "30 2 * * 0",
};
