import { ShieldCheck, Target, Eye, BadgeCheck, MessageCircle, ArrowLeft, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "@/i18n/LangContext";

const icons = [Eye, Target, ShieldCheck, BadgeCheck];

export const WhyUs = () => {
  const { t, lang } = useLang();
  const waMsg = encodeURIComponent(
    lang === "ar"
      ? "السلام عليكم، حابب أعرف أكتر عن مؤسسة اليسر وطرق التبرع 🌿"
      : "Hello, I'd like to know more about Al-Yusr Foundation and how to donate."
  );
  const items = t.why.items;
  const isOdd = items.length % 2 === 1;

  return (
    <section
      id="why"
      className="relative overflow-hidden bg-primary pattern-hero-luxe hero-pattern-fade py-10 text-primary-foreground md:py-14"
    >
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-secondary/15 blur-[110px]" />
      <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-accent/15 blur-[110px]" />

      <div className="container relative mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-block rounded-full bg-secondary/20 px-3 py-1 text-[10px] font-extrabold tracking-wide text-secondary">
            {t.why.title}
          </span>
          <h2 className="mt-2 text-xl font-black leading-tight md:text-3xl">
            {t.why.title}
          </h2>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 md:mt-8 md:gap-3">
          {items.map((it, i) => {
            const Icon = icons[i] ?? BadgeCheck;
            const lastFull = isOdd && i === items.length - 1;
            return (
              <div
                key={i}
                className={`group rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.07] p-3 backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary-foreground/15 md:p-4 ${
                  lastFull ? "col-span-2" : ""
                }`}
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-secondary-foreground shadow md:h-9 md:w-9">
                  <Icon className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                </div>
                <h3 className="mt-2 text-[13px] font-extrabold md:text-sm">{it.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-primary-foreground/80 md:text-xs">
                  {it.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Two CTAs — row on every screen */}
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-2.5 md:mt-8 md:gap-3">
          <a
            href={`https://wa.me/201097000137?text=${waMsg}`}
            target="_blank"
            rel="noopener"
            data-source="why-us"
            data-label="whyus-whatsapp"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2.5 text-[12px] font-extrabold text-white shadow-cta transition hover:brightness-110 md:text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            {lang === "ar" ? "واتساب" : "WhatsApp"}
          </a>
          <Link
            to="/contact"
            data-source="why-us"
            data-label="whyus-contact"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 text-[12px] font-extrabold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/20 md:text-sm"
          >
            <Mail className="h-4 w-4" />
            {lang === "ar" ? "تواصل معنا" : "Contact us"}
            <ArrowLeft className={`h-3.5 w-3.5 ${lang === "ar" ? "" : "rotate-180"}`} />
          </Link>
        </div>
      </div>
    </section>
  );
};
