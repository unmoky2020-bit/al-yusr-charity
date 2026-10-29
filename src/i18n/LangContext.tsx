import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, translations } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)[Lang];
  dir: "rtl" | "ltr";
};

const LangContext = createContext<Ctx | null>(null);

/**
 * The language a visitor explicitly picked with the language switch. Arabic is the site's language:
 * English is shown only when chosen here or requested with ?lang=en. The browser language is never
 * used to switch automatically, because search engines crawl with an English browser and would
 * otherwise index the English version of every Arabic page.
 * (A new key on purpose: the old "alyusr_lang" value was also written by the removed auto-detection.)
 */
export const LANG_CHOICE_KEY = "alyusr_lang_choice";

export const readLangChoice = (): Lang | null => {
  try {
    const v = localStorage.getItem(LANG_CHOICE_KEY);
    return v === "ar" || v === "en" ? v : null;
  } catch {
    return null;
  }
};

const saveLangChoice = (l: Lang) => {
  try { localStorage.setItem(LANG_CHOICE_KEY, l); } catch { /* storage unavailable */ }
};

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    // ?lang=ar|en overrides for this visit only (shared English links, admin "Preview" button)
    try {
      const qp = new URLSearchParams(window.location.search).get("lang");
      if (qp === "ar" || qp === "en") return qp;
    } catch { /* malformed URL */ }
    return readLangChoice() ?? "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("alyusr_lang", lang);
  }, [lang, dir]);

  // Only an explicit switch is remembered.
  const setLang = (l: Lang) => {
    saveLangChoice(l);
    setLangState(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang], dir }}>
      {children}
    </LangContext.Provider>
  );
};

// Safe fallback context so a missing provider (or a stale HMR swap) never
// causes a blank screen. Consumers still get working translations + dir.
const fallbackLang: Lang = (typeof window !== "undefined" && readLangChoice()) || "ar";
const fallbackCtx: Ctx = {
  lang: fallbackLang,
  setLang: () => {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.warn("[useLang] called outside <LangProvider>; ignoring setLang");
    }
  },
  t: translations[fallbackLang],
  dir: fallbackLang === "ar" ? "rtl" : "ltr",
};

export const useLang = (): Ctx => {
  const ctx = useContext(LangContext);
  if (!ctx) {
    if (typeof window !== "undefined" && import.meta.env.DEV) {
      console.warn("[useLang] no LangProvider found — using fallback context");
    }
    return fallbackCtx;
  }
  return ctx;
};

// Force a full page reload when this module (which owns the React Context
// identity) is hot-replaced. Without this, changing `translations.ts` causes
// Vite to swap LangContext, leaving mounted consumers reading a stale null
// context and throwing "useLang must be inside LangProvider".
if (import.meta.hot) {
  import.meta.hot.invalidate();
}
