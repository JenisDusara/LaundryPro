import type { MetadataRoute } from "next";

// Web app manifest — lets LaundryMax be "installed" to the phone home screen and run
// full-screen (standalone), without the browser address/nav bars.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaundryMax",
    short_name: "LaundryMax",
    description: "Laundry Management System",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f5fa",
    theme_color: "#1e40af",
    icons: [
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
