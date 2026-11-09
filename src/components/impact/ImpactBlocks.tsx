import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Eye, Hourglass, MapPin, PackageCheck, Truck, Users } from "lucide-react";
import { formatServerImageUrl } from "@/data/laravelApi";
import type { DistributionCard, ImpactCaseCard, ImpactNumbers, ImpactTarget, ImpactTargetRow } from "@/data/api/impactApi";
import { CASE_RESULT, DISTRIBUTION_STAGE, KIND_LABEL, formatDay, egp, impactPath } from "@/lib/impactLabels";
import { publicUrls } from "@/lib/publicUrls";
import { cn, formatNumberEN } from "@/lib/utils";
import { PhotoStrip } from "./PhotoViewer";

type Lang = "ar" | "en";
const img = (u?: string) => (u ? formatServerImageUrl(u) || u : "");

/** Team-only preview notice (while the report is not public yet). */
export function PreviewBanner({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  return (
    <div className="bg-amber-100 text-amber-950">
      <p className="container mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-[12.5px] font-bold leading-relaxed sm:px-6">
        <Eye className="mt-0.5 h-4 w-4 shrink-0" />
        {ar
          ? "معاينة لفريق العمل بس — الزوار لسه مش شايفين الصفحة دي. الأرقام فيها تبرعات تجريبية (كروت كاشير في وضع التجربة وتبرعات الفريق)؛ امسحها أو علّمها «مُرتجع» وبعدين ننشر التقرير."
          : "Team preview only — visitors can't see this page yet. The numbers include test donations; clear them before publishing."}
      </p>
    </div>
  );
}

/** Big numbers on a dark band. Zeros are left out so nothing looks empty. */
export function NumbersLedger({ n, lang, className }: { n: ImpactNumbers; lang: Lang; className?: string }) {
  const ar = lang === "ar";
  const items = [
    { v: egp(n.collected, lang), l: ar ? "تبرعات مدفوعة" : "paid donations", show: true },
    { v: formatNumberEN(n.donors), l: ar ? "متبرع" : "donors", show: n.donors > 0 },
    { v: formatNumberEN(n.delivered), l: ar ? "تبرع وصل لأصحابه" : "donations delivered", show: n.delivered > 0 },
    { v: formatNumberEN(n.families), l: ar ? "أسرة استلمت" : "families reached", show: n.families > 0 },
    { v: formatNumberEN(n.distributions), l: ar ? "يوم توزيع" : "distribution days", show: n.distributions > 0 },
    { v: formatNumberEN(n.completed), l: ar ? "حالة اكتملت" : "cases completed", show: n.completed > 0 },
    { v: egp(n.spent, lang), l: ar ? "اتصرف على الحالات بإيصالات" : "spent on cases, with receipts", show: n.spent > 0 },
  ].filter((x) => x.show).slice(0, 4);
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 lg:grid-cols-4", className)}>
      {items.map((x) => (
        <div key={x.l} className="bg-primary/60 px-4 py-5 text-center backdrop-blur">
          <dt className="sr-only">{x.l}</dt>
          <dd className="text-2xl font-black tabular-nums text-white sm:text-3xl">{x.v}</dd>
          <dd className="mt-1 text-xs font-bold text-white/75">{x.l}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Where the paid donations stand on their way to families. */
export function WayBar({ n, lang }: { n: ImpactNumbers; lang: Lang }) {
  const ar = lang === "ar";
  const total = Math.max(1, n.donations);
  const waiting = Math.max(0, n.donations - n.delivered - n.on_the_way);
  const parts = [
    { k: "delivered", v: n.delivered, l: ar ? "وصل لأصحابه" : "Delivered", c: "bg-emerald-500", I: Truck },
    { k: "way", v: n.on_the_way, l: ar ? "في الطريق (اتحددت الأسرة / بيتجهز)" : "On the way", c: "bg-secondary", I: PackageCheck },
    { k: "wait", v: waiting, l: ar ? "مستني دوره في التوزيع" : "Waiting for its turn", c: "bg-muted-foreground/30", I: Hourglass },
  ];
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full bg-muted" role="img" aria-label={parts.map((p) => `${p.l}: ${p.v}`).join("، ")}>
        {parts.map((p) => p.v > 0 && <div key={p.k} className={p.c} style={{ width: `${(p.v / total) * 100}%` }} />)}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.k} className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
            <span className={cn("h-3 w-3 shrink-0 rounded-full", p.c)} />
            <span className="min-w-0 flex-1 text-xs font-bold text-muted-foreground">{p.l}</span>
            <b className="text-lg font-black tabular-nums text-primary">{formatNumberEN(p.v)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TargetCard({ t, lang }: { t: ImpactTargetRow; lang: Lang }) {
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <Link to={impactPath(t)} className="group flex gap-3 rounded-3xl border border-border bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/60">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
        {t.image && <img src={img(t.image)} alt="" loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-black text-primary">{KIND_LABEL[t.kind][lang]}</span>
        <p className="mt-1 truncate text-sm font-black text-primary">{t.name}</p>
        <p className="mt-0.5 text-[12px] font-bold text-emerald-700">{egp(t.collected, lang)}</p>
        <p className="text-[11px] text-muted-foreground">
          {ar ? `${t.donations} تبرع · ${t.delivered} وصل` : `${t.donations} donations · ${t.delivered} delivered`}
          {t.families > 0 && (ar ? ` · ${t.families} أسرة` : ` · ${t.families} families`)}
        </p>
      </div>
      <Arrow className="h-4 w-4 shrink-0 self-center text-muted-foreground transition group-hover:text-primary" aria-hidden />
    </Link>
  );
}

export function DistributionView({ d, lang }: { d: DistributionCard; lang: Lang }) {
  const ar = lang === "ar";
  const st = DISTRIBUTION_STAGE[d.stage];
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {d.photos[0] ? (
        <div className="aspect-[16/10] overflow-hidden bg-muted"><img src={img(d.photos[0])} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
      ) : (
        <div className="grid aspect-[16/10] place-items-center bg-gradient-to-br from-secondary/15 to-muted"><PackageCheck className="h-10 w-10 text-secondary" /></div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-black", st?.tone)}>{ar ? st?.doneAr : st?.en}</span>
          {d.target?.name && <span className="truncate text-[11px] font-bold text-muted-foreground">{d.target.name}</span>}
        </div>
        <h3 className="mt-2 text-[15px] font-black leading-snug text-primary">{d.title}</h3>
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] font-bold text-muted-foreground">
          {d.happened_on && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDay(d.happened_on, lang)}</span>}
          {d.place && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.place}</span>}
          {d.families_count > 0 && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{ar ? `${d.families_count} أسرة` : `${d.families_count} families`}</span>}
        </p>
        {d.note && <p className="mt-2 line-clamp-3 text-[12.5px] leading-6 text-foreground/80">{d.note}</p>}
        {d.photos.length > 1 && <PhotoStrip className="mt-3" photos={d.photos} lang={lang} size="sm" caption={d.title} />}
      </div>
    </article>
  );
}

export function FinishedCaseView({ c, lang }: { c: ImpactCaseCard; lang: Lang }) {
  const ar = lang === "ar";
  const o = c.outcome;
  const r = o ? CASE_RESULT[o.result] : null;
  const pics = [o?.before_url, o?.after_url].filter(Boolean) as string[];
  return (
    <Link to={publicUrls.case(c.code)} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:border-secondary/60">
      {pics.length === 2 ? (
        <div className="grid grid-cols-2 gap-px bg-border">
          {pics.map((p, i) => (
            <div key={p} className="relative aspect-square overflow-hidden bg-muted">
              <img src={img(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
              <span className={cn("absolute start-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black", i ? "bg-[#a3e635] text-[#06301c]" : "bg-black/60 text-white")}>{i ? (ar ? "بعد" : "After") : ar ? "قبل" : "Before"}</span>
            </div>
          ))}
        </div>
      ) : (pics[0] || c.cover) ? (
        <div className="aspect-[16/10] overflow-hidden bg-muted"><img src={img(pics[0] || c.cover)} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
      ) : null}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {r && <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-black", r.tone)}><BadgeCheck className="h-3 w-3" />{r[lang]}</span>}
          {c.place && <span className="text-[11px] font-bold text-muted-foreground">{c.place}</span>}
        </div>
        <h3 className="mt-2 text-[15px] font-black leading-snug text-primary">{c.title}</h3>
        {o?.summary && <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-6 text-foreground/80">{o.summary}</p>}
        <p className="mt-auto pt-3 text-[11.5px] font-bold text-muted-foreground">
          {ar ? "اتجمع" : "Collected"} <b className="text-primary">{egp(c.collected, lang)}</b>
          {c.spent > 0 && <> · {ar ? "اتصرف" : "spent"} <b className="text-emerald-700">{egp(c.spent, lang)}</b></>}
        </p>
      </div>
    </Link>
  );
}

/** How every pound is documented — the same four promises on every report page. */
export function HowWeDocument({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  const steps = ar
    ? [
        ["رقم تتبع لكل تبرع", "وكل خطوة لحد التسليم بتوصلك إشعار وتظهر في صفحة التتبع."],
        ["أيام توزيع بالصور", "كل يوم توزيع بيتسجل بالمكان والتاريخ وعدد الأسر، ويظهر في سجل كل تبرع اتوزع فيه."],
        ["ملف شفافية لكل حالة", "كل بند اتشترى بتكلفته الحقيقية وصورة إيصاله، ومسؤول متابعة من الفريق."],
        ["الوشوش مموّهة", "صور الأسر بتتغطى وشوشها قبل ما ترفع — كرامة الناس قبل أي صورة."],
      ]
    : [
        ["A tracking number per donation", "Every step to delivery notifies you and shows on the tracking page."],
        ["Distribution days with photos", "Each day is logged with place, date and families, and shows in every donation it covered."],
        ["A transparency file per case", "Every line bought with its real cost and receipt, and a team member following it."],
        ["Faces are blurred", "Families' faces are covered before any photo is uploaded — dignity first."],
      ];
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map(([t, d], i) => (
        <li key={t} className="rounded-3xl border border-border bg-card p-4">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary/20 text-sm font-black text-primary">{i + 1}</span>
          <h3 className="mt-3 text-sm font-black text-primary">{t}</h3>
          <p className="mt-1 text-[12.5px] leading-6 text-muted-foreground">{d}</p>
        </li>
      ))}
    </ol>
  );
}

/** Visitors' page while the report is not public yet. */
export function ImpactComingSoon({ lang }: { lang: Lang }) {
  const ar = lang === "ar";
  return (
    <section className="bg-background pb-36 pt-16">
      <div className="container mx-auto max-w-xl px-4 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/15 text-primary"><PackageCheck className="h-7 w-7" /></span>
        <h1 className="mt-4 text-2xl font-black text-primary">{ar ? "تقرير الأثر بيتجهز" : "The impact report is on its way"}</h1>
        <p className="mt-2 leading-7 text-muted-foreground">
          {ar ? "قريب هتلاقي هنا كل تبرع وصل لفين، بالأرقام والصور. لحد ده، تقدر تتابع تبرعك برقمه أو تشوف ملف أي حالة." : "Soon: where every donation went, with numbers and photos. Meanwhile, track your donation or open any case's file."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/donate/track" className="inline-flex h-11 items-center rounded-xl bg-orange-grad px-5 text-sm font-black text-accent-foreground shadow-cta">{ar ? "تابع تبرعك" : "Track your donation"}</Link>
          <Link to="/cases" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-black text-primary hover:bg-muted">{ar ? "الحالات" : "Cases"}</Link>
        </div>
      </div>
    </section>
  );
}
