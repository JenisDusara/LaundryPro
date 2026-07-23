import { randomBytes } from "crypto";
import QRCode from "qrcode";

// Random, unguessable token for a scan URL. 16 bytes → 32 hex chars. Collision probability is
// negligible; the qr_token column also has a UNIQUE index as a backstop.
export function makeToken(): string {
  return randomBytes(16).toString("hex");
}

// Base URL the QR should point at. PUBLIC_APP_URL wins (set it in prod so tags link to the live
// domain); otherwise we derive the origin from the incoming request headers, which keeps QR codes
// correct in local/dev and preview deployments without any extra config. Trailing slash trimmed.
export function publicBaseUrl(req?: { headers: Headers }): string {
  const env = process.env.PUBLIC_APP_URL?.trim();
  if (env) {
    const clean = env.replace(/\/+$/, "");
    if (!/^https:\/\//i.test(clean) && process.env.NODE_ENV === "production") {
      throw new Error("PUBLIC_APP_URL must be an https:// URL in production");
    }
    return clean;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("PUBLIC_APP_URL is required in production for secure QR links");
  }
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) return `${proto}://${host}`.replace(/\/+$/, "");
  }
  return "";
}

// Full scan URL for a tag token.
export function tagUrl(token: string, req?: { headers: Headers }): string {
  return `${publicBaseUrl(req)}/t/${token}`;
}

// PNG data-URL for a QR encoding `text`. `size` is the pixel width. Used both in the print view
// (an <img src>) and anywhere a QR needs to be embedded. Higher error-correction ("M") survives a
// bit of smudging on a printed label.
export async function qrDataUrl(text: string, size = 240): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
  });
}
