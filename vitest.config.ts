import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Tests assume the default static content source, whatever the local .env says.
    env: { VITE_CONTENT_SOURCE: "static" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
