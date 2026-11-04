import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/i18n/LangContext";
import { usePrograms } from "@/data/sources/programs";
import { isListedProgram } from "@/data/programScope";
import { programHref } from "@/data/programLandings";

/**
 * Building blocks shared by the search landing pages (/charity-egypt, /donate-from-abroad):
 * the live programs grid, a numbered steps card and the FAQ block. Content comes from the page;
 * programs come from the dashboard, with a skeleton until they arrive.
 */

export type Faq = { q: string; a: string };

/** Live programs from the dashboard (the same list as /programs), first `limit` listed ones. */
export function ProgramsGrid({ title, subtitle, limit = 6, className = "bg-muted/30" }: { title: string; subtitle?: string; limit?: number; className?: string }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const { programs: all, isLoading } = usePrograms();
  const programs = useMemo(() => all.filter((p) => isListedProgram(p.slug)).slice(0, limit), [all, limit]);
  return (
    <section className={`${className} py-12 md:py-16`}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-primary md:text-3xl">{title}</h2>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>}
          </div>
          <Link to="/programs" className="inline-flex items-center gap-1 text-sm font-black text-primary hover:text-secondary">
            {ar ? "كل البرامج" : "All programs"} <Arrow className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <div className="space-y-2 p-5"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <Link key={p.slug} to={programHref(p.slug)} className="group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  {p.image && <img src={p.image} alt={ar ? p.ar.name : p.en.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-primary">{ar ? p.ar.name : p.en.name}</h3>
                  {(ar ? p.ar.tagline : p.en.tagline) && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{ar ? p.ar.tagline : p.en.tagline}</p>}
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-black text-accent">{ar ? "اتبرع للبرنامج" : "Give to this program"} <Arrow className="h-4 w-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/** A card with a heading, an icon and numbered steps (how to give by card, by transfer…). */
export function StepsCard({ Icon, title, steps, note, children }: { Icon: LucideIcon; title: string; steps: { t: string; d: string }[]; note?: string; children?: ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-soft md:p-7">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-5 w-5" /></span>
        <h3 className="text-lg font-black leading-snug text-primary md:text-xl">{title}</h3>
      </div>
      <ol className="mt-5 flex-1 space-y-4">
        {steps.map((s, i) => (
          <li key={s.t} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-sm font-black text-slate-950">{i + 1}</span>
            <div className="min-w-0">
              <p className="font-black text-foreground">{s.t}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      {note && <p className="mt-5 rounded-2xl bg-muted/60 px-4 py-3 text-xs font-bold leading-relaxed text-muted-foreground">{note}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/** The page's questions as an accordion (the same items feed FAQSchema), with the closing buttons under it. */
export function FaqSection({ title, items, className = "bg-background", children }: { title: string; items: Faq[]; className?: string; children?: ReactNode }) {
  return (
    <section className={`${className} pb-28 pt-12 sm:pb-36 md:pb-44 md:pt-16`}>
      <div className="container mx-auto max-w-3xl px-4">
        <h2 className="text-2xl font-black text-primary md:text-3xl">{title}</h2>
        <Accordion type="single" collapsible className="mt-6 rounded-3xl border border-border/70 bg-card px-5 shadow-soft">
          {items.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className={i === items.length - 1 ? "border-b-0" : ""}>
              <AccordionTrigger className="gap-3 text-[15px] font-black text-primary hover:no-underline">
                <span className="flex-1 text-start leading-relaxed">{f.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {children && <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">{children}</div>}
      </div>
    </section>
  );
}
