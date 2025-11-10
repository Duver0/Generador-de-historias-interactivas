import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoBase =
  process.env.VITE_BASE_PATH || "/Generador-de-historias-interactivas/";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? repoBase : "/",
  server: {
    host: "0.0.0.0",
    strictPort: false,
    middlewareMode: false,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
