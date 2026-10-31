import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";
import { useLang, readLangChoice } from "@/i18n/LangContext";

/** Crawlers and headless browsers: never show them the prompt, so Arabic pages stay purely Arabic. */
const BOT_UA = /bot|crawl|spider|slurp|google|bing|yandex|baidu|duckduck|facebookexternalhit|lighthouse|headless|preview/i;

/**
 * A small, dismissible offer to switch to English for visitors whose browser language is English
 * and who have not chosen a language yet. It never switches by itself; either button records an
 * explicit choice so the prompt does not come back.
 */
export const LanguageSuggestion = () => {
  const { lang, setLang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || lang !== "ar") return;
    if (readLangChoice()) return;
    if (navigator.webdriver || BOT_UA.test(navigator.userAgent)) return;
    const prefersEnglish = (navigator.languages?.length ? navigator.languages : [navigator.language])
      .slice(0, 2)
      .some((l) => l?.toLowerCase().startsWith("en"));
    const prefersArabic = navigator.language?.toLowerCase().startsWith("ar");
    if (!prefersEnglish || prefersArabic) return;
    const t = window.setTimeout(() => setShow(true), 2500); // after the page has settled
    return () => window.clearTimeout(t);
  }, [lang]);

  // Gone for good once the visitor picks any language (here or with the navbar toggle).
  if (!show || lang !== "ar" || readLangChoice()) return null;

  return (
    <div
      dir="ltr"
      role="dialog"
      aria-label="Language"
      className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card sm:inset-x-auto sm:left-4 sm:mx-0"
    >
      <Languages className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <p className="flex-1 text-sm font-bold text-foreground">View this site in English?</p>
      <button
        type="button"
        onClick={() => { setLang("en"); setShow(false); }}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-black text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => { setLang("ar"); setShow(false); }}
        aria-label="Keep Arabic"
        title="Keep Arabic"
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default LanguageSuggestion;
