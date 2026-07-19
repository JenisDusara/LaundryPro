import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaundryMax — Laundry Shop Management Software for India",
  description:
    "LaundryMax handles customers, billing, deliveries, labour and reports for Indian laundry & dry-cleaning shops. Ditch the register. Try the live demo.",
  keywords: [
    "laundry software",
    "dry cleaning management",
    "laundry shop billing",
    "laundry management India",
  ],
  openGraph: {
    title: "LaundryMax — Manage Your Shop. Grow Profitably.",
    description:
      "Billing in 10 seconds, delivery tracking, labour wages and daily revenue reports — built for Indian laundry shops.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

// Set the theme class before paint to avoid a flash of the wrong theme.
// Light-first; respects a saved choice.
const themeScript = `
(function(){try{if(localStorage.getItem('lp-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
