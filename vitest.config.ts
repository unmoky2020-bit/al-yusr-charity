import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Pin the project root: the repo also exists one level up, and Vitest otherwise resolves
// relative setup/test paths against that outer package.
const root = path.resolve(__dirname);

export default defineConfig({
  root,
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(root, "src/test/setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Tests assume the default static content source, whatever the local .env says.
    env: { VITE_CONTENT_SOURCE: "static" },
  },
  resolve: {
    alias: { "@": path.resolve(root, "src") },
  },
});
