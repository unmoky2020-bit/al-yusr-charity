import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

export type Crumb = { name: string; href?: string };

export const Breadcrumbs = ({ items }: { items: Crumb[] }) => {
  const { lang } = useLang();
  const Sep = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto flex w-full justify-center"
    >
      <ol className="inline-flex max-w-full items-center gap-1 overflow-x-auto whitespace-nowrap rounded-full border border-current/15 bg-background/10 px-2 py-1 text-[10.5px] font-semibold backdrop-blur-md md:gap-1.5 md:px-3 md:py-1.5 md:text-xs">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          const isFirst = i === 0;
          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {c.href && !last ? (
                <Link
                  to={c.href}
                  className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 opacity-80 transition hover:opacity-100 md:px-1.5"
                >
                  {isFirst && <Home className="h-3 w-3 md:h-3.5 md:w-3.5" />}
                  <span>{c.name}</span>
                </Link>
              ) : (
                <span className={last ? "rounded-full bg-current/15 px-1.5 py-0.5 font-extrabold md:px-2" : "px-1 md:px-1.5"}>
                  {c.name}
                </span>
              )}
              {!last && <Sep className="h-3 w-3 opacity-50 md:h-3.5 md:w-3.5" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};