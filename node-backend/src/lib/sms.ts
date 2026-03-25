import axios from "axios";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) return digits.slice(1);
  return digits;
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) return;
  const normalized = normalizePhone(phone);
  try {
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      { route: "q", message, flash: 0, numbers: normalized },
      { headers: { authorization: key } }
    );
  } catch (e) {
    console.error("SMS failed:", e);
  }
}
