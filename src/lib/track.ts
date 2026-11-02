// Lightweight analytics helper that fans out to dataLayer / gtag / Meta Pixel (fbq).
// Safe to call in any environment — guards against SSR / missing globals.

type AnyObj = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: AnyObj[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    __alyusrAnchorTrackerBound?: boolean;
  }
}

export interface TrackOptions {
  /** Standard Meta Pixel event to also fire (e.g. "Lead", "Contact"). */
  fbEvent?: string;
  /** Optional extra payload merged into all sinks. */
  payload?: AnyObj;
  /** Also send the event to Meta as a custom event (default: only when there is no standard fbEvent). */
  fbCustom?: boolean;
}

/**
 * Track a named event across all configured analytics sinks.
 */
export function track(event: string, opts: TrackOptions = {}) {
  if (typeof window === "undefined") return;
  const payload: AnyObj = {
    event,
    page_path: window.location.pathname + window.location.search,
    page_title: document?.title,
    ts: Date.now(),
    ...(opts.payload || {}),
  };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {}
  try {
    window.gtag?.("event", event, payload);
  } catch {}
  try {
    // One Meta event per action: the standard event when there is one (Lead, Contact, PageView…),
    // otherwise a custom event. Sending both made every lead and page show up twice in Events Manager.
    if (opts.fbEvent) {
      window.fbq?.("track", opts.fbEvent, opts.payload || {});
    } else if (opts.fbCustom !== false) {
      window.fbq?.("trackCustom", event, payload);
    }
  } catch {}
}

/**
 * Unified donation funnel event. Use everywhere we start a checkout
 * (homepage teaser CTA + /donate confirm step) so Google, Meta and our
 * internal sinks all see the SAME event name and shape.
 *
 * Standard event:    `donation_initiate_checkout`
 * Meta Pixel event:  `InitiateCheckout`
 * GA4 event:         `begin_checkout`
 */
export function trackDonationStarted(payload: {
  amount: number;
  program?: string;
  method?: string;
  source: string;
}) {
  const data = {
    value: payload.amount,
    currency: "EGP",
    content_name: payload.program || "general",
    content_category: payload.method || "unknown",
    program: payload.program || "general",
    method: payload.method || "unknown",
    source: payload.source,
  };
  // dataLayer / GTM custom event
  track("donation_initiate_checkout", { payload: data, fbEvent: "InitiateCheckout" });
  // GA4 standard ecommerce event (so Google Ads conversions can pick it up).
  try {
    window.gtag?.("event", "begin_checkout", {
      ...data,
      items: [{ item_id: data.program, item_name: data.program, price: payload.amount, quantity: 1 }],
    });
  } catch { /* ignore */ }
}

/**
 * Bind a single delegated click listener that tracks every <a> click in the app.
 * Idempotent — safe to call multiple times.
 */
export function bindAnchorClickTracker() {
  if (typeof window === "undefined" || window.__alyusrAnchorTrackerBound) return;
  window.__alyusrAnchorTrackerBound = true;

  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const a = target.closest("a") as HTMLAnchorElement | null;
      if (!a) return;

      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("javascript:")) return;

      const isExternal = /^https?:\/\//i.test(href) && !href.includes(window.location.host);
      const isMailto = href.startsWith("mailto:");
      const isTel = href.startsWith("tel:");
      const isHash = href.startsWith("#") || href.startsWith("/#");
      const isWhatsapp = /wa\.me|api\.whatsapp\.com/.test(href);

      let kind: string = "internal";
      if (isMailto) kind = "mailto";
      else if (isTel) kind = "tel";
      else if (isWhatsapp) kind = "whatsapp";
      else if (isExternal) kind = "external";
      else if (isHash) kind = "anchor";

      const source =
        a.dataset.source ||
        a.closest("[data-source]")?.getAttribute("data-source") ||
        (a.closest("header") ? "navbar" : a.closest("footer") ? "footer" : "page");

      const label =
        a.dataset.label ||
        a.getAttribute("aria-label") ||
        a.textContent?.trim().slice(0, 80) ||
        "";

      track("link_click", {
        payload: {
          href,
          kind,
          source,
          label,
          target: a.target || "_self",
        },
      });

      // Map a few common kinds to Meta standard events automatically.
      if (isWhatsapp || isTel) {
        try {
          window.fbq?.("track", "Contact", { source, label, href });
        } catch {}
      }
    },
    { capture: true },
  );
}