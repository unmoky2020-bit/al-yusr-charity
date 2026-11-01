import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Pinned (scroll-driven) home carousel, in the conditions that made it shake on iPhone:
 * - iOS Safari changes window.innerHeight while the address bar collapses/expands mid-scroll;
 * - momentum scrolling wobbles the position around a zone edge;
 * - a smooth programmatic scroll (arrow / dot / swipe) can take well over 800 ms.
 * Layout is simulated: track 2500px, pinned viewport 800px → 1700px of pinned scroll, 6 slides.
 */
vi.mock("motion/react", async (orig) => ({ ...(await orig<typeof import("motion/react")>()), useReducedMotion: () => false }));
vi.mock("@/lib/campaignsMetrics", () => ({ recordCampaignClick: vi.fn(), recordSectionView: vi.fn() }));
vi.mock("@/data/campaignsSettings", async (orig) => {
  const actual = await orig<typeof import("@/data/campaignsSettings")>();
  const cards = Array.from({ length: 6 }, (_, i) => ({
    id: `c${i}`, sourceType: "custom" as const, slug: `card-${i}`, name_ar: `بطاقة ${i + 1}`, name_en: `Card ${i + 1}`,
    tagline_ar: "", tagline_en: "", image: "/og-ar.jpg", priceFrom: 100, detailsUrl: "/programs", donateUrl: "/donate?program=x", is_active: true,
  }));
  const settings = { ...actual.DEFAULT_CAMPAIGNS_SETTINGS, cards, showFinalCta: false, enableScrollTrigger: true, scrollSpeed: 1 };
  return { ...actual, useCampaignsSettings: () => ({ settings, isLoading: false }) };
});

import { CampaignsScroll } from "@/components/sections/CampaignsScroll";

const TRACK = 2500;
const PIN = 800;
const TRACK_TOP = 1000; // document offset of the track
const RANGE = TRACK - PIN;
let scrollY = 0;
let innerHeight = 800;

const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));
const fireScroll = () => window.dispatchEvent(new Event("scroll"));
const setScroll = async (y: number) => { scrollY = y; fireScroll(); await wait(5); };
const atProgress = (p: number) => setScroll(TRACK_TOP + RANGE * p);
const active = (c: HTMLElement) => c.querySelector('[aria-selected="true"]')?.getAttribute("aria-label")?.match(/\d+/)?.[0];

let scrollToCalls: number[] = [];

beforeEach(() => {
  scrollY = 0;
  innerHeight = 800;
  scrollToCalls = [];
  Object.defineProperty(window, "scrollY", { configurable: true, get: () => scrollY });
  Object.defineProperty(window, "innerHeight", { configurable: true, get: () => innerHeight });
  Object.defineProperty(window, "innerWidth", { configurable: true, get: () => 390 });
  window.scrollTo = ((arg: ScrollToOptions | number) => {
    scrollToCalls.push(typeof arg === "number" ? arg : arg.top ?? 0);
  }) as typeof window.scrollTo;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0) as unknown as number);
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    if (this.classList.contains("cs-track")) return TRACK;
    if (this.classList.contains("cs-pin")) return PIN;
    return 0;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const top = this.classList.contains("cs-track") ? TRACK_TOP - scrollY : 0;
    return { top, bottom: top + (this.classList.contains("cs-track") ? TRACK : 0), left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const mount = async () => {
  const view = render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter><CampaignsScroll /></MemoryRouter>
    </QueryClientProvider>,
  );
  await wait(20);
  expect(view.container.querySelector(".cs-track")).toBeTruthy();
  return view.container;
};

describe("pinned home carousel (iOS-proof scroll mapping)", () => {
  it("advances through the slides as the page scrolls", async () => {
    const c = await mount();
    await atProgress(0.05); expect(active(c)).toBe("1");
    await atProgress(0.3); expect(active(c)).toBe("2");
    await atProgress(0.55); expect(active(c)).toBe("4");
    await atProgress(0.97); expect(active(c)).toBe("6");
  });

  it("keeps the same slide when the iOS address bar changes the viewport height mid-scroll", async () => {
    const c = await mount();
    await atProgress(0.51); expect(active(c)).toBe("4");
    // Toolbar collapses/expands: innerHeight changes, nothing else does.
    for (const h of [700, 760, 640, 800]) {
      innerHeight = h;
      window.dispatchEvent(new Event("resize"));
      fireScroll();
      await wait(5);
      expect(active(c)).toBe("4");
    }
  });

  it("does not flicker when momentum wobbles the position around a zone edge", async () => {
    const c = await mount();
    await atProgress(0.51); expect(active(c)).toBe("4");
    await atProgress(0.495); expect(active(c)).toBe("4"); // just back over the edge → kept
    await atProgress(0.505); expect(active(c)).toBe("4");
    await atProgress(0.47); expect(active(c)).toBe("3"); // clearly in the previous zone → switches
  });

  it("an arrow tap keeps the chosen slide for the whole (slow) smooth scroll, with no jump afterwards", async () => {
    const c = await mount();
    await atProgress(0.05); expect(active(c)).toBe("1");
    const next = c.querySelector<HTMLButtonElement>('[role="region"] button');
    expect(next).toBeTruthy();
    fireEvent.click(next!);
    await wait(5);
    const target = scrollToCalls.at(-1)!;
    const chosen = active(c);
    expect(chosen).toBe("2");
    // Simulate an iOS smooth scroll that takes 1.6 s (twice the old fixed 800 ms lock).
    const from = scrollY;
    for (let i = 1; i <= 16; i++) {
      await setScroll(from + ((target - from) * i) / 16);
      await wait(95);
      expect(active(c)).toBe(chosen);
    }
    await wait(400); // settled
    fireScroll();
    await wait(10);
    expect(active(c)).toBe(chosen);
  });
});

describe("pinned home carousel on touch devices (fixed instead of sticky while pinned)", () => {
  let pinTop = 0;
  beforeEach(() => {
    pinTop = 0;
    const realMM = window.matchMedia;
    vi.stubGlobal("matchMedia", (q: string) => {
      if (q.includes("pointer: coarse")) return { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as unknown as MediaQueryList;
      return realMM ? realMM.call(window, q) : ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as unknown as MediaQueryList);
    });
    const rect = HTMLElement.prototype.getBoundingClientRect as unknown as { mockImplementation: (f: (this: HTMLElement) => DOMRect) => void };
    rect.mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("cs-track")) {
        const top = TRACK_TOP - scrollY;
        return { top, bottom: top + TRACK, left: 0, right: 0, width: 0, height: TRACK, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
      }
      const top = this.classList.contains("cs-pin") ? pinTop : 0;
      return { top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
    });
  });

  const pinEl = (c: HTMLElement) => c.querySelector(".cs-pin") as HTMLElement;

  it("is fixed only inside the fully pinned range, sticky before and after", async () => {
    const c = await mount();
    await setScroll(TRACK_TOP - 300); // section still below the top
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(false);
    await atProgress(0.3);
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(true);
    await atProgress(0.9);
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(true);
    await setScroll(TRACK_TOP + RANGE + 50); // released at the end: sticky carries it off with the page
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(false);
    await atProgress(0.5); // and back in
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(true);
  });

  it("falls back to sticky for good when fixed would not sit at the top of the screen", async () => {
    pinTop = 120; // e.g. an ancestor with a transform
    const c = await mount();
    await atProgress(0.3);
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(false);
    await atProgress(0.6);
    expect(pinEl(c).classList.contains("cs-pin--fixed")).toBe(false);
  });
});

describe("pinned home carousel on touch devices: one swipe = one card", () => {
  beforeEach(() => {
    const realMM = window.matchMedia;
    vi.stubGlobal("matchMedia", (q: string) => {
      if (q.includes("pointer: coarse")) return { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as unknown as MediaQueryList;
      return realMM ? realMM.call(window, q) : ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as unknown as MediaQueryList);
    });
  });

  const touch = (type: string, y: number, x = 200, active = true) => {
    const ev = new Event(type, { cancelable: true, bubbles: true });
    const list = [{ clientX: x, clientY: y }];
    Object.defineProperty(ev, "touches", { value: active ? list : [] });
    Object.defineProperty(ev, "changedTouches", { value: list });
    window.dispatchEvent(ev);
    return ev;
  };
  /** A swipe of `dy` px (negative = finger up = next card). Returns the touchmove event. */
  const swipe = async (dy: number, dx = 0) => {
    touch("touchstart", 600, 200);
    const mv = touch("touchmove", 600 + dy / 2, 200 + dx / 2);
    touch("touchmove", 600 + dy, 200 + dx);
    touch("touchend", 600 + dy, 200 + dx, false);
    await wait(5);
    return mv;
  };
  /** Finger drag (not momentum) that brings the page to progress p, then lifts. */
  const dragTo = async (p: number) => {
    touch("touchstart", 600);
    await atProgress(p);
    touch("touchend", 600, 200, false);
    await wait(300);
  };
  /** Let the programmatic scroll arrive and settle. */
  const arrive = async () => { await setScroll(scrollToCalls.at(-1)!); await wait(300); };

  it("each upward swipe moves exactly one card, and native scrolling is blocked meanwhile", async () => {
    const c = await mount();
    await dragTo(0.05); expect(active(c)).toBe("1");
    const mv = await swipe(-220);
    expect(mv.defaultPrevented).toBe(true);
    expect(active(c)).toBe("2");
    await arrive(); expect(active(c)).toBe("2");
    await swipe(-400); expect(active(c)).toBe("3"); // a long, fast swipe is still one card
    await arrive();
    await swipe(160); expect(active(c)).toBe("2"); // finger down → previous card
  });

  it("leaves the section after the last card and before the first one", async () => {
    const c = await mount();
    await dragTo(0.97); expect(active(c)).toBe("6");
    await swipe(-200);
    expect(scrollToCalls.at(-1)!).toBeGreaterThan(TRACK_TOP + RANGE);
    await dragTo(0.02); expect(active(c)).toBe("1");
    await swipe(200);
    expect(scrollToCalls.at(-1)!).toBeLessThan(TRACK_TOP);
  });

  it("momentum that carries the page into the section stops on the first card", async () => {
    const c = await mount();
    await setScroll(TRACK_TOP - 400); // above the section
    scrollToCalls = [];
    await atProgress(0.7); // momentum jumps deep into the section, no finger on the screen
    expect(scrollToCalls.length).toBeGreaterThan(0);
    expect(active(c)).toBe("1");
  });

  it("leaves taps and horizontal swipes alone", async () => {
    const c = await mount();
    await dragTo(0.3); expect(active(c)).toBe("2");
    await arrive();
    scrollToCalls = [];
    touch("touchstart", 600); touch("touchend", 602, 200, false); await wait(5); // tap
    const mv = await swipe(10, -150); // horizontal
    expect(mv.defaultPrevented).toBe(false);
    expect(scrollToCalls.length).toBe(0);
    expect(active(c)).toBe("2");
  });
});
