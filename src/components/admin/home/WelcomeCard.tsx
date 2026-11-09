import { Link } from "react-router-dom";
import { CalendarDays, ShieldCheck, type LucideIcon } from "lucide-react";

export type HomeAction = { to: string; label: string; icon: LucideIcon; primary?: boolean };

/** «صباح الخير» before noon, «مساء الخير» after (the device's clock). */
function greeting(lang: "ar" | "en", now = new Date()): string {
  const morning = now.getHours() < 12;
  if (lang === "ar") return morning ? "صباح الخير" : "مساء الخير";
  return morning ? "Good morning" : "Good evening";
}

/**
 * The top of every dashboard home: who is signed in, their role, one line on how their work goes,
 * and the two or three things they do most. Light background, so it reads as a greeting, not a banner.
 */
export function WelcomeCard({ lang, name, roleLabel, note, actions, compact = false }: {
  lang: "ar" | "en";
  name: string;
  roleLabel: string;
  note: string;
  actions: HomeAction[];
  /** The money overview keeps it to one short band above the figures. */
  compact?: boolean;
}) {
  const today = new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" });
  return (
    <section className={`relative overflow-hidden rounded-3xl border border-secondary/35 bg-gradient-to-l from-secondary/[0.22] via-secondary/[0.09] to-card shadow-soft ltr:bg-gradient-to-r ${compact ? "p-4 md:p-5" : "p-5 md:p-7"}`}>
      <span aria-hidden className="pointer-events-none absolute -top-20 end-[-3rem] h-56 w-56 rounded-full bg-secondary/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 start-1/3 h-48 w-48 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-primary/70">
            <span>{greeting(lang)}</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-primary/30" />
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{today}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className={`font-black leading-tight text-primary ${compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}>{name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-black text-primary ring-1 ring-secondary/45">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary-foreground" />{roleLabel}
            </span>
          </div>
          <p className={`max-w-2xl text-sm leading-7 text-foreground/75 ${compact ? "mt-1" : "mt-2"}`}>{note}</p>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:max-w-[46%] lg:shrink-0 lg:justify-end">
            {actions.map(({ to, label, icon: Icon, primary }) => (
              <Link
                key={to}
                to={to}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  primary
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "bg-card text-primary ring-1 ring-border hover:ring-secondary/60"
                }`}
              >
                <Icon className="h-4 w-4" />{label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
