import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, translations } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)[Lang];
  dir: "rtl" | "ltr";
};

const LangContext = createContext<Ctx | null>(null);

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    // Allow ?lang=ar|en to override (used by admin "Preview" button)
    try {
      const qp = new URLSearchParams(window.location.search).get("lang");
      if (qp === "ar" || qp === "en") return qp;
    } catch {}
    const saved = localStorage.getItem("alyusr_lang") as Lang;
    if (saved === "ar" || saved === "en") return saved;
    // Smart Browser Language Detection for international visitors
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) {
      return "en";
    }
    return "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("alyusr_lang", lang);
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang], dir }}>
      {children}
    </LangContext.Provider>
  );
};

// Safe fallback context so a missing provider (or a stale HMR swap) never
// causes a blank screen. Consumers still get working translations + dir.
const fallbackLang: Lang = (typeof window !== "undefined" &&
  typeof localStorage !== "undefined" &&
  typeof localStorage.getItem === "function" &&
  (localStorage.getItem("alyusr_lang") as Lang)) || "ar";
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
