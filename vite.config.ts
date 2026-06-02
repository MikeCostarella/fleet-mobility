import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// `base` must match your GitHub repo name for GitHub Pages to resolve assets.
// If you deploy to Vercel/Netlify (served from root), set this back to "/".
export default defineConfig({
  base: "/fleet-mobility/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32x32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Costarella Transportation — Fleet & Mobility",
        short_name: "Costarella",
        description: "Fleet management dashboard: vehicles, drivers, maintenance, and telematics.",
        theme_color: "#0d1117",
        background_color: "#0d1117",
        display: "standalone",
        orientation: "any",
        scope: "/fleet-mobility/",
        start_url: "/fleet-mobility/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
});
