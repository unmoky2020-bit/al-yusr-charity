import { Clock, ShieldCheck, Eye, Gem, MessageCircle, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import hourglass from "@/assets/qurbani-hourglass.webp";
import iconCow from "@/assets/poster-meat.webp";
import iconSheep from "@/assets/poster-meat.webp";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { track } from "@/lib/track";

/**
 * Urgency CTA banner inspired by the printed Al-Yusr Qurbani flyer:
 * dark green field, hourglass mark, two prestige chips, and per-card
 * Qurbani price tiers (buffalo, cow, sheep). Mirrors the flyer's tone
 * while keeping site design tokens.
 */
export const QurbaniHourglassCTA = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const chips = isRTL
    ? [
        { icon: ShieldCheck, label: "موثّق" },
        { icon: Eye, label: "شفاف" },
        { icon: Gem, label: "إحترافي" },
      ]
    : [
        { icon: ShieldCheck, label: "Verified" },
        { icon: Eye, label: "Transparent" },
        { icon: Gem, label: "Professional" },
      ];

  const tiers = isRTL
    ? [
        { icon: iconCow,   name: "جاموسي", weight: "وزن الصك ٣٠ ك صافي", price: "١٤٠٠٠ جنيه" },
        { icon: iconCow,   name: "بقري",   weight: "وزن الصك ٣٠ ك صافي", price: "١٦٠٠٠ جنيه" },
        { icon: iconSheep, name: "خروف",   weight: "وزن ٥٠–٦٠ ك قائم",   price: "١٥٠٠–١٤٠٠ جنيه" },
        { icon: iconCow,   name: "بقري",   weight: "وزن الصك ٣٥–٣٧ صافي", price: "١٨٠٠٠ جنيه" },
      ]
    : [
        { icon: iconCow,   name: "Buffalo", weight: "30 kg net per share",  price: "EGP 14,000" },
        { icon: iconCow,   name: "Cow",     weight: "30 kg net per share",  price: "EGP 16,000" },
        { icon: iconSheep, name: "Sheep",   weight: "50–60 kg live",        price: "EGP 1,400–1,500" },
        { icon: iconCow,   name: "Cow",     weight: "35–37 kg net",         price: "EGP 18,000" },
      ];

  const onCta = (label: string) =>
    track("qurbani_cta_click", { fbEvent: "InitiateCheckout", payload: { label, source: "qurbani-hourglass" } });

  return (
    <section className="relative overflow-hidden bg-[hsl(152_45%_12%)] py-16 text-primary-foreground md:py-20" aria-labelledby="qhg-title">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--secondary)/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.18),transparent_60%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(hsl(var(--secondary))_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="container relative mx-auto grid gap-10 px-4 md:grid-cols-[1.05fr_1fr] md:items-center">
        {/* Headline + chips */}
        <div className="text-center md:text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-primary-foreground/5 px-3 py-1 text-[11px] font-extrabold text-secondary">
            <Clock className="h-3.5 w-3.5" />
            {isRTL ? "العدد محدود — فتح باب الاشتراك" : "Limited spots — bookings now open"}
          </span>
          <h2 id="qhg-title" className="mt-4 text-3xl font-black leading-tight md:text-5xl">
            {isRTL ? (
              <>سارع <span className="text-gradient-lime">بحجز فرصتك</span></>
            ) : (
              <>Hurry & <span className="text-gradient-lime">book your share</span></>
            )}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-bold text-primary-foreground/85 md:mx-0 md:text-base">
            {isRTL
              ? "الأسعار شاملة كل النفقات المتعلقة بالصك. الحجز برقم الهاتف والبطاقة، ويصلك مندوب لو حابب."
              : "Prices include every share-related cost. Book by phone & national ID — a rep can reach your door."}
          </p>

          <ul className="mx-auto mt-5 inline-flex flex-wrap justify-center gap-2 md:mx-0">
            {chips.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-primary-foreground/10 px-3 py-1.5 text-xs font-extrabold text-secondary">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
              <Link to="/donate?program=qurbani" onClick={() => onCta("donate")}>
                <Heart className="h-4 w-4" />
                {isRTL ? "احجز صك أضحية" : "Reserve a Qurbani share"}
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
              <a
                href={`https://wa.me/201097000137?text=${encodeURIComponent(isRTL ? "حابب أحجز صك أضحية مع مؤسسة اليسر" : "I'd like to book a Qurbani share with Al-Yusr")}`}
                target="_blank" rel="noopener noreferrer" dir="ltr"
                onClick={() => onCta("whatsapp")}
              >
                <MessageCircle className="h-4 w-4" />
                {isRTL ? "احجز عبر واتساب" : "Book via WhatsApp"}
              </a>
            </Button>
          </div>
        </div>

        {/* Hourglass + price tiers */}
        <div className="relative">
          <div className="absolute -inset-6 -z-0 rounded-[2rem] bg-secondary/15 blur-3xl" aria-hidden />
          <div className="relative grid grid-cols-[110px_1fr] items-center gap-3 rounded-3xl border border-secondary/25 bg-primary-foreground/5 p-3 backdrop-blur sm:grid-cols-[140px_1fr] md:p-4">
            <img
              src={hourglass}
              alt={isRTL ? "ساعة رملية ترمز للوقت المحدود" : "Hourglass — limited time"}
              loading="lazy" decoding="async"
              className="h-auto w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)]"
            />
            <ul className="grid gap-2">
              {tiers.map((t, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-[hsl(152_55%_8%)] px-3 py-2.5 ring-1 ring-secondary/20">
                  <img src={t.icon} alt="" aria-hidden loading="lazy" className="h-9 w-9 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black text-secondary">{t.name}</span>
                      <span className="shrink-0 rounded-full bg-orange-grad px-2 py-0.5 text-[11px] font-black text-accent-foreground shadow-cta">
                        {t.price}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-primary-foreground/75">{t.weight}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-center text-[11px] font-bold text-primary-foreground/70 md:text-start">
            {isRTL ? "⚠️ الأسعار تحت العجز والزيادة وشاملة كل النفقات المتعلقة بالصك." : "⚠️ Prices are subject to weight variance and include all share-related fees."}
          </p>
        </div>
      </div>
    </section>
  );
};
