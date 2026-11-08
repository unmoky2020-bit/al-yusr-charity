import { useLang } from "@/i18n/LangContext";
import { PAGE_LOADING_ATTR } from "@/lib/bootSplash";

/**
 * The one loading state of the site: route fallbacks, page gates and the boot splash in index.html
 * all look like this (the foundation's mark with a thin progress line, centred in the viewport), so
 * moving from one to the next is invisible. It fills the screen below the header, so the footer
 * never flashes into view while a page loads.
 */
export function PageLoadingState() {
  const { lang } = useLang();

  return (
    <div
      {...{ [PAGE_LOADING_ATTR]: "" }}
      className="grid min-h-[calc(100svh-5rem)] place-items-center px-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{lang === "ar" ? "جارٍ التحميل" : "Loading"}</span>
      <div className="grid justify-items-center gap-4" aria-hidden="true">
        <img
          src="/icons/icon-144.png"
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 rounded-full motion-safe:animate-[yusr-pulse_1.6s_ease-in-out_infinite]"
        />
        <span className="relative block h-[3px] w-28 overflow-hidden rounded-full bg-primary/10">
          <span className="absolute inset-y-0 w-2/5 rounded-full bg-primary motion-safe:animate-[yusr-slide_1.2s_ease-in-out_infinite]" />
        </span>
      </div>
    </div>
  );
}
