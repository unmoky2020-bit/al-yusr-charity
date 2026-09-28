// Lightweight route prefetcher. Triggers the same dynamic imports used by
// React.lazy in App.tsx so the chunk is warm by the time the user clicks.
const map: Record<string, () => Promise<unknown>> = {
  "/about": () => import("@/pages/site/About.tsx"),
  "/contact": () => import("@/pages/site/Contact.tsx"),
  "/stories": () => import("@/pages/site/Stories.tsx"),
  "/projects": () => import("@/pages/site/Projects.tsx"),
  "/cases": () => import("@/pages/site/Cases.tsx"),
  "/gallery": () => import("@/pages/site/Gallery.tsx"),
  "/privacy": () => import("@/pages/site/Privacy.tsx"),
  "/terms": () => import("@/pages/site/Terms.tsx"),
  "/blog": () => import("@/pages/Blog.tsx"),
  "/donate": () => import("@/pages/DonatePage.tsx"),
  "/qurbani": () => import("@/pages/QurbaniLanding.tsx"),
  "/dashboard": () => import("@/pages/DonorDashboard.tsx"),
  "/login": () => import("@/pages/auth/Login.tsx"),
  "/register/donor": () => import("@/pages/auth/RegisterDonor.tsx"),
  "/register/volunteer": () => import("@/pages/auth/RegisterVolunteer.tsx"),
  "/profile": () => import("@/pages/auth/Profile.tsx"),
  "/donate/track": () => import("@/pages/DonationTracking.tsx"),
};

const done = new Set<string>();
export const prefetchRoute = (path: string) => {
  const key = Object.keys(map).find((k) => path === k || path.startsWith(k + "/"));
  if (!key || done.has(key)) return;
  done.add(key);
  // Run on idle to avoid contending with the LCP.
  const run = () => { map[key]().catch(() => done.delete(key)); };
  type IdleWin = Window & { requestIdleCallback?: (cb: () => void) => number };
  const w = window as IdleWin;
  if (typeof window !== "undefined" && w.requestIdleCallback) w.requestIdleCallback(run);
  else setTimeout(run, 200);
};

export const prefetchHandlers = (path: string) => ({
  onMouseEnter: () => prefetchRoute(path),
  onFocus: () => prefetchRoute(path),
  onTouchStart: () => prefetchRoute(path),
});
