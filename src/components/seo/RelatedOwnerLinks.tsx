import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { relatedOwners } from "@/data/seoOwnerLinks";

/**
 * «صفحات قريبة» above the footer on the pages that own our search keywords: four related pages,
 * each linked with the words it should rank for (src/data/seoOwnerLinks.ts). Visible, not hidden text.
 */
export function RelatedOwnerLinks() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  const ar = lang === "ar";
  const links = relatedOwners(pathname);
  if (!links.length) return null;
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <nav aria-label={ar ? "صفحات قريبة" : "Related pages"} className="border-t border-border/60 bg-muted/30">
      {/* Bottom padding: the footer's newsletter card is pulled up over the section before it. */}
      <div className="container mx-auto max-w-6xl px-4 pb-20 pt-8 md:pb-32">
        {/* A heading role on a <p>: the site-wide mobile rule blows every <h2> up to display size. */}
        <p role="heading" aria-level={2} className="text-sm font-black text-primary">{ar ? "صفحات قد تهمك" : "You may also need"}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((l) => (
            <li key={l.path}>
              <Link
                to={l.path}
                data-source="related-owner-links"
                data-label={l.path}
                className="group flex h-full items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm font-bold text-primary transition hover:border-secondary/60 hover:shadow-soft"
              >
                <span>{ar ? l.ar : l.en}</span>
                <Arrow className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
