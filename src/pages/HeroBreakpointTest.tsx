import { useMemo, useState } from "react";

const BREAKPOINTS = [
  { w: 320, h: 720, label: "320 — Small Android" },
  { w: 375, h: 812, label: "375 — iPhone" },
  { w: 768, h: 1024, label: "768 — Tablet" },
  { w: 1024, h: 720, label: "1024 — Laptop" },
];

const sanitizeIframePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { safePath: "/", blocked: false };
  }

  try {
    const candidate = new URL(trimmed, window.location.origin);
    const safePath = `${candidate.pathname}${candidate.search}${candidate.hash}` || "/";

    if (candidate.origin !== window.location.origin) {
      return { safePath: "/", blocked: true };
    }

    return { safePath, blocked: false };
  } catch {
    if (trimmed.startsWith("/")) {
      return { safePath: trimmed, blocked: false };
    }

    return { safePath: "/", blocked: true };
  }
};

const HeroBreakpointTest = () => {
  const [path, setPath] = useState("/");
  const [refreshKey, setRefreshKey] = useState(0);

  const { safePath, blocked } = useMemo(() => sanitizeIframePath(path), [path]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">Hero Breakpoint Snapshots</h1>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 text-sm w-64"
          placeholder="/"
        />
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
        >
          Reload all
        </button>
        <p className="text-xs text-neutral-400 w-full">
          Each frame renders the live page at its true viewport. Verify the hero characters are NOT cropped (object-contain + center bottom). Scroll inside each frame to test the cinematic timeline.
        </p>
        {blocked && (
          <p className="text-xs text-amber-300">
            Unsafe external URL blocked. Only same-origin paths are allowed in the iframe tester.
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {BREAKPOINTS.map((bp) => (
          <div key={bp.w} className="bg-neutral-900 rounded-xl p-3 border border-neutral-800">
            <div className="flex items-center justify-between mb-2 text-xs text-neutral-400">
              <span className="font-mono">{bp.label}</span>
              <span className="font-mono">
                {bp.w}×{bp.h}
              </span>
            </div>
            <div
              className="mx-auto overflow-hidden border border-neutral-800 bg-white"
              style={{ width: bp.w, maxWidth: "100%" }}
            >
              <iframe
                key={`${bp.w}-${refreshKey}`}
                src={safePath}
                title={bp.label}
                width={bp.w}
                height={bp.h}
                referrerPolicy="no-referrer"
                sandbox="allow-scripts"
                style={{ width: bp.w, height: bp.h, border: 0, display: "block" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroBreakpointTest;