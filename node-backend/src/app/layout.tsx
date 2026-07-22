import type { Metadata, Viewport } from "next";
import "./globals.css";
import NoZoom from "@/components/NoZoom";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "LaundryMax",
  description: "Laundry Management System",
  manifest: "/manifest.webmanifest",
  // Setting `icons` at all disables Next's automatic file-convention favicon
  // detection, so the favicon route has to be listed explicitly too.
  icons: { icon: "/icon.svg", apple: "/app-icon.svg" },
  // iOS: run full-screen (no Safari chrome) when added to the home screen.
  appleWebApp: { capable: true, title: "LaundryMax", statusBarStyle: "default" },
};

// Lock the mobile viewport: no pinch-zoom / user scaling, so the layout can't shift or
// "jump" when a finger accidentally zooms the page. This is what fixes the phone-view glitch.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NoZoom />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
