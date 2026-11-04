import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Heart, Minus, Plus } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { entityDonateHref, shareDonateHref, type EntityKind, type Share } from "@/data/entityShares";

/**
 * Giving controls for landing pages that sell a backend record's packages:
 * a package picker with a quantity stepper and live total, a single-package band, and helpers.
 * Prices read «يبدأ من»; the donate link opens the form on that package with the chosen count.
 */
type Bi = { ar: string; en: string };
const t = (isAr: boolean, v: Bi) => (isAr ? v.ar : v.en);
const fmt = (n: number) => n.toLocaleString("en-US");
export type Source = { kind: EntityKind; slug: string };

/* ───────────────────────── Giving controls ───────────────────────── */

export const Stepper = ({ qty, setQty, dark = false }: { qty: number; setQty: (n: number) => void; dark?: boolean }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const btn = `grid h-10 w-10 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 ${dark ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 focus-visible:ring-secondary" : "bg-muted hover:bg-muted/70 focus-visible:ring-primary"} disabled:opacity-40`;
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={isAr ? "عدد الأسهم" : "Number of shares"}>
      <button type="button" className={btn} onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label={isAr ? "سهم أقل" : "One less"}>
        <Minus className="h-4 w-4" />
      </button>
      <output aria-live="polite" className="w-10 text-center text-xl font-black tabular-nums">{qty}</output>
      <button type="button" className={btn} onClick={() => setQty(Math.min(99, qty + 1))} disabled={qty >= 99} aria-label={isAr ? "سهم إضافي" : "One more"}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

export const DonateBtn = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link
    to={to}
    className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-orange-grad px-5 text-base font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  >
    <Heart className="h-4 w-4 shrink-0" />
    {children}
  </Link>
);

export const StartsFrom = ({ amount, dark = false }: { amount: number; dark?: boolean }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <span className={`text-sm font-bold ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
      {isAr ? "يبدأ من " : "From "}
      <span dir="ltr" className={`font-black tabular-nums ${dark ? "text-secondary" : "text-primary"}`}>{fmt(amount)}</span> {isAr ? "جنيه" : "EGP"}
    </span>
  );
};

/** Pick a package, choose how many, see the total, donate. */
export const DonationPicker = ({ source, shares, title, dark = false }: { source: Source; shares: Share[]; title: string; dark?: boolean }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [selId, setSelId] = useState(shares[0]?.id);
  const [qty, setQty] = useState(1);
  const sel = shares.find((s) => s.id === selId) ?? shares[0];
  useEffect(() => setQty(1), [selId]);
  if (!sel) return null;
  const ring = dark ? "ring-primary-foreground/15" : "ring-border";
  return (
    <div className={`mt-12 grid overflow-hidden rounded-2xl ring-1 ${ring} md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]`}>
      <fieldset className={`p-5 sm:p-7 ${dark ? "bg-primary-foreground/[0.04]" : "bg-card"}`}>
        <legend className="sr-only">{title}</legend>
        <p className={`text-lg font-black ${dark ? "text-primary-foreground" : "text-primary"}`}>{title}</p>
        <div className="mt-4 space-y-2">
          {shares.map((s) => {
            const on = s.id === sel.id;
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors ${
                  on ? (dark ? "bg-secondary text-slate-950" : "bg-primary text-primary-foreground") : dark ? "hover:bg-primary-foreground/[0.07]" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name={`pick-${source.slug}-${title}`} value={s.id} checked={on} onChange={() => setSelId(s.id)} className="sr-only" />
                  <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? (dark ? "border-slate-950" : "border-secondary") : dark ? "border-primary-foreground/40" : "border-primary/30"}`}>
                    {on && <span className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-slate-950" : "bg-secondary"}`} />}
                  </span>
                  <span className="text-[0.95rem] font-black leading-snug">{t(isAr, { ar: s.nameAr, en: s.nameEn })}</span>
                </span>
                <span className={`shrink-0 text-xs font-bold ${on ? "" : dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {isAr ? "يبدأ من " : "from "}
                  <span dir="ltr" className="text-sm font-black tabular-nums">{fmt(s.amount)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className={`flex flex-col justify-between gap-6 p-5 sm:p-7 ${dark ? "bg-primary-foreground/[0.08]" : "bg-muted/60"}`}>
        <div>
          <p className={`text-xs font-black ${dark ? "text-secondary" : "text-primary/60"}`}>{isAr ? "تبرعك" : "Your gift"}</p>
          <p className={`mt-1 text-lg font-black leading-snug ${dark ? "text-primary-foreground" : "text-primary"}`}>{t(isAr, { ar: sel.nameAr, en: sel.nameEn })}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <Stepper qty={qty} setQty={setQty} dark={dark} />
            <p className={`text-3xl font-black tabular-nums ${dark ? "text-secondary" : "text-primary"}`}>
              <span dir="ltr">{fmt(sel.amount * qty)}</span> <span className={`text-sm font-bold ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{isAr ? "جنيه" : "EGP"}</span>
            </p>
          </div>
          <p className={`mt-3 text-xs leading-relaxed ${dark ? "text-primary-foreground/65" : "text-muted-foreground"}`}>
            {isAr ? "السعر يبدأ من قيمة السهم، ويمكنك زيادة عدد الأسهم هنا أو تعديل المبلغ في صفحة التبرع." : "Prices start at one share; add more shares here or change the amount on the donation page."}
          </p>
        </div>
        <DonateBtn to={shareDonateHref(source.kind, source.slug, sel, qty)}>{isAr ? "أكمل التبرع" : "Continue to donate"}</DonateBtn>
      </div>
    </div>
  );
};

/** One package with a quantity stepper, laid out as a band. */
export const ShareBand = ({ source, share, fallbackTitle }: { source: Source; share?: Share; fallbackTitle: Bi }) => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [qty, setQty] = useState(1);
  if (!share) {
    return (
      <div className="mt-10 max-w-sm">
        <DonateBtn to={entityDonateHref(source.kind, source.slug)}>{isAr ? `ساهم في ${fallbackTitle.ar}` : `Give to ${fallbackTitle.en}`}</DonateBtn>
      </div>
    );
  }
  return (
    <div className="mt-10 grid items-center gap-5 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6 md:grid-cols-[minmax(0,1fr)_auto_auto_minmax(0,240px)] md:gap-8">
      <div>
        <p className="text-lg font-black text-primary">{t(isAr, { ar: share.nameAr, en: share.nameEn })}</p>
        <StartsFrom amount={share.amount} />
      </div>
      <Stepper qty={qty} setQty={setQty} />
      <p className="text-3xl font-black tabular-nums text-primary">
        <span dir="ltr">{fmt(share.amount * qty)}</span> <span className="text-sm font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span>
      </p>
      <DonateBtn to={shareDonateHref(source.kind, source.slug, share, qty)}>{isAr ? "تبرّع الآن" : "Donate now"}</DonateBtn>
    </div>
  );
};
