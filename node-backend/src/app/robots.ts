import { MetadataRoute } from "next";

// Keeps the public QR-tag scan URLs (/t/<token>) out of search engines — the token is the only
// thing protecting them, and a crawled/cached listing would defeat that even though the page
// itself also requires a staff login.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/t/" }],
  };
}
