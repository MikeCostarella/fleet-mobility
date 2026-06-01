import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` must match your GitHub repo name for GitHub Pages to resolve assets.
// If you deploy to Vercel/Netlify (served from root), set this back to "/".
export default defineConfig({
  plugins: [react()],
  base: "/fleet-mobility/",
});
