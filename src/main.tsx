import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  try {
    const v = localStorage.getItem("elyusr_data_version");
    if (v !== "3.1") {
      // Clear ALL cached data — backend is now the sole source of truth
      [
        "elyusr_homepage_content",
        "elyusr_stats_home_stats",
        "elyusr_stats_achievements",
        "elyusr_axes_items_data",
        "elyusr_about_us_data",
        "elyusr_about_us_content",
        "elyusr_collage_images",
        "elyusr_section2_cta_settings",
      ].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
      localStorage.setItem("elyusr_data_version", "3.1");
    }
  } catch {}
}

createRoot(document.getElementById("root")!).render(<App />);

