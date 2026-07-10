// Timezone-safe date helpers. The app stores dates as "YYYY-MM-DD" strings and
// operates in India (IST, UTC+5:30, no DST). Using `new Date().toISOString()` on a
// server running in UTC produces the wrong calendar day after 18:30 IST, and
// `new Date(y, m, 0).toISOString()` shifts month boundaries by a day. These helpers
// avoid both problems by building the strings directly.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Today's calendar date in IST as "YYYY-MM-DD", regardless of server timezone.
export function todayIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

// First and last day of a month as "YYYY-MM-DD" strings, with no timezone drift.
// `new Date(year, month, 0).getDate()` reads only the day-of-month number, so it is
// safe from the toISOString() UTC shift.
export function monthRange(year: number, month: number): { start: string; end: string } {
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

// The most recently completed 7-day window (yesterday, IST, back 6 more days) as
// "YYYY-MM-DD" strings. Used for the Sunday-morning weekly report so it covers a full
// past week (last Sun–Sat) rather than the still-in-progress current day.
export function lastWeekRange(): { start: string; end: string } {
  const todayIstMs = Date.now() + IST_OFFSET_MS;
  const end = new Date(todayIstMs - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const start = new Date(todayIstMs - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { start, end };
}
