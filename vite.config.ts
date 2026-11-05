import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Backend URL — set VITE_BACKEND_URL in .env to switch between environments
const BACKEND = process.env.VITE_BACKEND_URL || "https://api.elyusr.org";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // HMR shares the dev server's own port. Pinning it to 8080 made a second dev server (or any app
    // already on 8080) answer the page with "426 Upgrade Required".
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/v1": {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        headers: { Origin: BACKEND },
        configure: (proxy) => {
          proxy.on("error", (_err, _req, res) => {
            if (res && !("headersSent" in res && res.headersSent) && "writeHead" in res) {
              (res as any).writeHead(502, { "Content-Type": "application/json" });
              (res as any).end(JSON.stringify({ error: "Backend service unreachable" }));
            }
          });
        },
      },
      "/storage": {
        target: BACKEND,
        changeOrigin: true,
        secure: false,
        headers: { Origin: BACKEND },
        configure: (proxy) => {
          proxy.on("error", (_err, _req, res) => {
            if (res && !("headersSent" in res && res.headersSent) && "writeHead" in res) {
              (res as any).writeHead(404, { "Content-Type": "text/plain" });
              (res as any).end("Storage asset unavailable");
            }
          });
        },
      },
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
