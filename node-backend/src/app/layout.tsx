import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import NoZoom from "@/components/NoZoom";
import PWARegister from "@/components/PWARegister";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LaundryPro",
  description: "Laundry Management System",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/app-icon.png" },
  // iOS: run full-screen (no Safari chrome) when added to the home screen.
  appleWebApp: { capable: true, title: "LaundryPro", statusBarStyle: "default" },
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
    <html lang="en" className={montserrat.variable}>
      <body>
        <NoZoom />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
