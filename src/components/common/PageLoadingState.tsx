import { useLang } from "@/i18n/LangContext";
import { PAGE_LOADING_ATTR } from "@/lib/bootSplash";
import { LoadingMark } from "@/components/common/LoadingMark";

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
      <LoadingMark />
    </div>
  );
}
