import { useEffect, useRef } from "react";

/**
 * Scroll reveal without a library: every `[data-reveal]` element inside the returned ref gets
 * `.is-visible` the first time it enters the screen (pair it with the `reveal-up` class). It keeps
 * watching for elements added later (data that loads after the first paint), and shows everything
 * at once when the visitor prefers reduced motion. IntersectionObserver needs no measured positions,
 * so photos or lists that change size above it never leave anything stuck hidden.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const showAll = () => el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((n) => n.classList.add("is-visible"));
    if (typeof IntersectionObserver === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      showAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    const observeAll = () => el.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)").forEach((n) => io.observe(n));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return ref;
}
