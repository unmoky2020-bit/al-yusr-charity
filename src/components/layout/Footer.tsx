import { Logo } from "@/components/common/Logo";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Phone, Mail, MapPin, Building2, BadgeCheck, HandHeart, HeartHandshake, Heart, ShieldCheck, Beef, Sparkles, ArrowLeft, Clock, Send, Bell, CheckCircle2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useLang } from "@/i18n/LangContext";
import { prefetchHandlers } from "@/lib/prefetch";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/track";
import ctaHourglass from "@/assets/cta-hourglass-banner.jpg";

export const Footer = () => {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const { pathname } = useLocation();
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
      toast.error(isRTL ? "ادخل بريد إلكتروني صحيح" : "Please enter a valid email");
      return;
    }
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("newsletter-subscribe", {
        body: { email: value, lang, source: `footer:${pathname}` },
      });
      if (error || (data && (data as any).error)) throw error || new Error((data as any).error);
      setSubscribed(true);
      setEmail("");
      track("newsletter_subscribe", {
        fbEvent: "Lead",
        payload: { email_domain: value.split("@")[1], lang, source: "footer", path: pathname, status: (data as any)?.status ?? "pending" },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err);
      }
      toast.error(isRTL ? "تعذّر إتمام الاشتراك، حاول مجددًا" : "Couldn't complete the subscription, try again");
    } finally {
      setSubscribing(false);
    }
  };
  // Hide the closing donation CTA on auth/profile/admin pages — those
  // contexts have their own primary action (login / dashboard / save).
  const hideClosingCta =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/admin") ||
    // Pre-Eid soft launch: the closing CTA pushes /qurbani which is
    // intentionally hidden from header/footer right now.
    true;
  const year = new Date().getFullYear();
  const rightsText = isRTL
    ? `جميع الحقوق محفوظة © ${year} مؤسسة اليسر الخيرية`
    : `All rights reserved © ${year} Al-Yusr Charity Foundation`;

  return (
    <footer id="contact" data-source="footer" dir={isRTL ? "rtl" : "ltr"} className="relative z-30 overflow-visible pattern-hero-luxe hero-pattern-fade text-primary-foreground">
      {/* === Closing CTA — hidden on auth/profile/admin === */}
      {!hideClosingCta && (
        <section className="relative overflow-hidden text-primary">

          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f8f1de]/85 via-[#f5ecd8]/70 to-[#efe3c5]/90" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />

          <div className="container relative mx-auto px-4 pt-12 md:pt-16 pb-24 md:pb-36">
            <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
              {/* Hourglass visual */}
              <div className="relative order-1 mx-auto w-full max-w-sm md:order-none md:max-w-none">
                <div className="relative overflow-hidden rounded-[2rem] ring-1 ring-secondary/40 shadow-card">
                  <img
                    src={ctaHourglass}
                    alt={isRTL ? "ساعة رملية تذكرنا بأن الوقت ينفد" : "Hourglass — time is running out"}
                    loading="lazy"
                    decoding="async"
                    width={1280}
                    height={800}
                    className="h-full w-full object-cover"
                  />
                  <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/10" />
                </div>
                <span className="absolute -bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-card px-3 py-1.5 text-[11px] font-extrabold text-primary shadow-soft">
                  <Clock className="h-3 w-3 text-accent" />
                  {isRTL ? "العدد محدود" : "Limited spots"}
                </span>
              </div>

              {/* Copy + actions */}
              <div className="text-center md:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-card/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-primary shadow-soft backdrop-blur">
                  <Sparkles className="h-3 w-3 text-accent" />
                  {isRTL ? "حملة العيد الكبير 2026" : "Eid al-Adha 2026"}
                </span>
                <h2 className="mt-4 text-2xl font-black leading-[1.2] text-primary sm:text-3xl md:text-[2.25rem]">
                  {isRTL ? (
                    <>سارع بحجز <span className="text-accent">صك أضحيتك</span> قبل ما يخلص الوقت</>
                  ) : (
                    <>Reserve <span className="text-accent">your Qurbani</span> before time runs out</>
                  )}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm font-semibold text-primary/75 md:mx-0 md:text-base">
                  {isRTL
                    ? "كل صك بيتعاين قبل الذبح ويتوثّق بالصور والفيديو — لراحة بال كاملة."
                    : "Every share is inspected pre-slaughter and documented with photo & video — for full peace of mind."}
                </p>

                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row md:justify-start">
                  <Link
                    to="/qurbani"
                    className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-grad px-6 py-3.5 text-sm font-black text-accent-foreground shadow-cta transition-all hover:-translate-y-0.5 hover:opacity-95 sm:text-base"
                  >
                    <Heart className="h-4 w-4" />
                    {isRTL ? "احجز صك أضحية الآن" : "Reserve a share now"}
                    <ArrowLeft className={`h-4 w-4 transition-transform ${isRTL ? "group-hover:-translate-x-1" : "rotate-180 group-hover:translate-x-1"}`} />
                  </Link>
                  <Link
                    to="/donate"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 bg-card px-6 py-3.5 text-sm font-black text-primary transition-all hover:border-secondary hover:bg-secondary/10 sm:text-base"
                  >
                    <HeartHandshake className="h-4 w-4 text-accent" />
                    {isRTL ? "تبرّع الآن" : "Donate now"}
                  </Link>
                </div>

                <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-extrabold md:justify-start">
                  {[
                    { I: ShieldCheck, ar: "أمانة شرعية", en: "Sharia-compliant" },
                    { I: Beef, ar: "جودة مضمونة", en: "Quality guaranteed" },
                    { I: BadgeCheck, ar: "توثيق كامل", en: "Full documentation" },
                  ].map(({ I, ar, en }) => (
                    <li key={en} className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-card/80 px-3 py-1.5 text-primary shadow-soft backdrop-blur">
                      <I className="h-3 w-3 text-accent" />
                      <span>{isRTL ? ar : en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter card — floats upward overlapping into previous section */}
      <div className="relative overflow-visible">
        <div className="container relative z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -translate-y-[15%] -mb-7 sm:-mb-8 md:-mb-10">
          <div className="group relative mx-auto w-full overflow-hidden rounded-[2.2rem] border border-accent/30 bg-card text-primary shadow-[0_22px_65px_-20px_rgba(15,76,44,0.35)]">

            {!subscribed ? (
              <div className="relative grid items-center gap-6 p-5 sm:p-7 md:grid-cols-[1fr_1.15fr] md:gap-8 md:p-8">
                <div className="text-center md:text-start">
                  <span className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3.5 py-1.5 text-xs font-black text-accent">
                    <span>{isRTL ? "النشرة البريدية الحصرية" : "Exclusive Newsletter"}</span>
                    <Bell className="h-3.5 w-3.5 shrink-0 text-accent" />
                  </span>
                  <h3 className="mt-3 text-xl font-black leading-tight tracking-tight md:text-[1.55rem]">
                    {isRTL ? (
                      <>اشترك وتابع أحدث <span className="text-accent">حملاتنا</span> وقصص الأثر</>
                    ) : (
                      <>Subscribe for our latest <span className="text-accent">campaigns</span> &amp; impact stories</>
                    )}
                  </h3>
                </div>

                <form onSubmit={handleSubscribe} className="relative flex w-full flex-col gap-2 rounded-2xl border border-accent/30 bg-background p-1.5 shadow-[0_6px_25px_rgb(0,0,0,0.06)] sm:flex-row sm:items-center">
                  <label className="sr-only" htmlFor="newsletter-email">Email</label>
                  <div className="relative flex-1 flex items-center min-w-0">
                    <Mail className="absolute start-3.5 h-4 w-4 shrink-0 text-primary/40 pointer-events-none" />
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      dir={isRTL ? "rtl" : "ltr"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isRTL ? "بريدك الإلكتروني" : "your@email.com"}
                      className="h-11 w-full rounded-xl border border-transparent bg-transparent ps-10 pe-4 text-xs font-bold text-primary outline-none placeholder:text-primary/40 focus:border-accent/50 transition-all sm:text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-accent px-6 text-xs font-black text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-60 sm:text-sm"
                  >
                    <span className="flex items-center">
                      {subscribing ? (isRTL ? "جاري..." : "Subscribing...") : (isRTL ? "اشترك الآن" : "Subscribe Now")}
                    </span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-6 text-center md:flex-row md:text-start md:justify-between md:gap-6 md:p-8">
                <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-start">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-cta">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight sm:text-xl md:text-2xl">
                      {isRTL ? "تم الاشتراك — تأكيد البريد في طريقه إليك ✉️" : "You're in — please confirm via the email we just sent ✉️"}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-primary/75 sm:text-sm">
                      {isRTL
                        ? "ادخل بريدك واضغط على رابط التفعيل لتبدأ تستقبل أخبار حملاتنا."
                        : "Open the email and click the activation link to start receiving our updates."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 shrink-0 md:justify-end">
                  <Link
                    to="/donate"
                    onClick={() => track("newsletter_thanks_cta_donate", { payload: { source: "footer" } })}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-grad px-4 text-xs font-black text-accent-foreground shadow-cta hover:-translate-y-0.5"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    {isRTL ? "تبرع الآن" : "Donate now"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubscribed(false)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/15 bg-background px-3.5 text-xs font-bold text-primary hover:border-secondary"
                  >
                    {isRTL ? "اشترك ببريد آخر" : "Add another email"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information */}
      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 md:pt-12 md:pb-16">
        {/* Mobile-centered, desktop 4-col */}
        {/* Mobile & Desktop 4-column layout */}
        <div className="grid gap-8 text-center sm:text-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {/* 1. Brand & NGO Mission */}
          <div className="flex flex-col items-center sm:items-start">
            <Logo stackedOnMobile size="lg" className="text-primary-foreground" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/75">
              {t.footer.tagline}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
              <BadgeCheck className="h-3.5 w-3.5" /> {t.footer.values}
            </div>

            {/* CTA badges — كن متبرعاً / كن متطوعاً */}
            <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-2.5">
              <Link
                to="/donate"
                className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-3.5 py-1.5 text-xs font-extrabold text-secondary transition hover:bg-secondary hover:text-primary"
              >
                <Heart className="h-3.5 w-3.5" />
                {lang === "ar" ? "كن متبرعاً" : "Be a Donor"}
              </Link>
              <Link
                to="/volunteer"
                className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-3.5 py-1.5 text-xs font-extrabold text-secondary transition hover:bg-secondary hover:text-primary"
              >
                <HandHeart className="h-3.5 w-3.5" />
                {lang === "ar" ? "كن متطوعاً" : "Volunteer"}
              </Link>
            </div>
          </div>

          {/* 2. Quick Links — 2 columns on mobile */}
          <div>
            <h3 className="mb-4 text-base sm:text-lg font-extrabold text-secondary">{t.footer.quickLinks}</h3>
            <ul className="mx-auto grid max-w-xs grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm font-bold sm:max-w-none">
              <li><Link to="/about" {...prefetchHandlers("/about")} className="block text-primary-foreground/85 hover:text-secondary">{t.nav.about}</Link></li>
              <li><Link to="/programs" {...prefetchHandlers("/programs")} className="block text-primary-foreground/85 hover:text-secondary">{t.nav.programs}</Link></li>
              <li><Link to="/projects" {...prefetchHandlers("/projects")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "مشاريعنا" : "Projects"}</Link></li>
              <li><Link to="/cases" {...prefetchHandlers("/cases")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "الحالات الإنسانية" : "Cases"}</Link></li>
              <li><Link to="/about#achievements" {...prefetchHandlers("/about")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "إنجازاتنا" : "Achievements"}</Link></li>
              <li><Link to="/gallery" {...prefetchHandlers("/gallery")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "معرض الصور" : "Gallery"}</Link></li>
              <li><Link to="/blog" {...prefetchHandlers("/blog")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "المدونة" : "Blog"}</Link></li>
              <li><Link to="/donate/track" {...prefetchHandlers("/donate/track")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "تتبع تبرعك" : "Track donation"}</Link></li>
              <li><Link to="/contact" {...prefetchHandlers("/contact")} className="block text-primary-foreground/85 hover:text-secondary">{t.nav.contact}</Link></li>
              <li><Link to="/volunteer-campaigns" {...prefetchHandlers("/volunteer-campaigns")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حملات التطوع" : "Volunteer Opps"}</Link></li>
            </ul>
          </div>

          {/* 3. Dedicated Campaigns Column — 2 columns on mobile */}
          <div>
            <h3 className="mb-4 text-base sm:text-lg font-extrabold text-secondary">
              <Link to="/campaigns" className="hover:underline">
                {lang === "ar" ? "حملات ومبادرات اليسر" : "Al-Yusr Campaigns"}
              </Link>
            </h3>
            <ul className="mx-auto grid max-w-xs grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm font-bold sm:max-w-none">
              <li><Link to="/dhill" {...prefetchHandlers("/dhill")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حملة ظِلّ (سقيا وأسقف)" : "Dhill (Water)"}</Link></li>
              <li><Link to="/setr" {...prefetchHandlers("/setr")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حملة سِتْر (الشتاء)" : "Setr (Winter)"}</Link></li>
              <li><Link to="/markoun" {...prefetchHandlers("/markoun")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حملة مَرْكُون (الأجهزة)" : "Markoun In-Kind"}</Link></li>
              <li><Link to="/arboun" {...prefetchHandlers("/arboun")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "مبادرة عربون خير" : "Arboun Khair"}</Link></li>
              <li><Link to="/athar" {...prefetchHandlers("/athar")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حملة أَثَر التعليمية" : "Athar Education"}</Link></li>
              <li><Link to="/ramadan" {...prefetchHandlers("/ramadan")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "موسم رمضان المبارك" : "Ramadan Season"}</Link></li>
              <li><Link to="/food-box" {...prefetchHandlers("/food-box")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "كرتونة الغذاء الشهرية" : "Monthly Food"}</Link></li>
              <li><Link to="/qurbani" {...prefetchHandlers("/qurbani")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "صكوك الأضاحي" : "Qurbani Shares"}</Link></li>
              <li className="col-span-2 pt-1"><Link to="/campaigns" {...prefetchHandlers("/campaigns")} className="inline-flex items-center gap-1 text-accent hover:underline">{lang === "ar" ? "عرض كل الحملات والمبادرات ←" : "View all campaigns →"}</Link></li>
            </ul>
          </div>

          {/* 4. Contact & Social */}
          <div className="flex flex-col items-center sm:items-start">
            <h3 className="mb-4 text-base sm:text-lg font-extrabold text-secondary">{t.footer.contactUs}</h3>
            <ul className="mx-auto inline-flex max-w-xs flex-col gap-2.5 text-xs sm:text-sm sm:mx-0 sm:max-w-none">
              <li className="flex items-start justify-center gap-2 sm:justify-start">
                <MapPin className="mt-0.5 hidden h-4 w-4 shrink-0 text-secondary sm:inline-block" aria-hidden />
                <span className="text-primary-foreground/80">{t.footer.address}</span>
              </li>
              <li className="flex items-center justify-center gap-2 sm:justify-start">
                <Phone className="hidden h-4 w-4 shrink-0 text-secondary sm:inline-block" aria-hidden />
                <a href="tel:+201097000137" dir="ltr" className="text-primary-foreground/80 hover:text-secondary">+20 109 700 0137</a>
              </li>
              <li className="flex items-center justify-center gap-2 sm:justify-start">
                <WhatsAppIcon className="hidden h-4 w-4 shrink-0 text-secondary sm:inline-block" />
                <a href="https://wa.me/201097000137" target="_blank" rel="noopener" dir="ltr" className="text-primary-foreground/80 hover:text-secondary">WhatsApp</a>
              </li>
              <li className="flex items-center justify-center gap-2 sm:justify-start">
                <Mail className="hidden h-4 w-4 shrink-0 text-secondary sm:inline-block" aria-hidden />
                <a href="mailto:info@elyosrcharity.com" className="text-primary-foreground/80 hover:text-secondary">info@elyosrcharity.com</a>
              </li>
              <li className="flex items-start justify-center gap-2 sm:justify-start">
                <Building2 className="mt-0.5 hidden h-4 w-4 shrink-0 text-secondary sm:inline-block" aria-hidden />
                <span dir="ltr" className="text-primary-foreground/80">{t.contact.bankLabel}: <span className="font-bold text-secondary">{t.contact.bank}</span></span>
              </li>
            </ul>

            <div className="mt-4 flex justify-center sm:justify-start gap-2.5">
              <a href="https://www.facebook.com/Elyosr.Charity/" target="_blank" rel="noopener" aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 transition hover:bg-secondary hover:text-secondary-foreground">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={`https://instagram.com/${t.contact.facebook}`} target="_blank" rel="noopener" aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 transition hover:bg-secondary hover:text-secondary-foreground">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://wa.me/201097000137" target="_blank" rel="noopener" aria-label="WhatsApp"
                className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 transition hover:bg-secondary hover:text-secondary-foreground">
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>



      {/* Bottom Copyright & Legal Bar — Ordered per user preference on mobile */}
      <div className="relative z-10 border-t border-secondary/15 bg-black/60 pt-5 pb-8 md:py-6 backdrop-blur-md">
        <div className="container relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-primary-foreground/80 md:flex-row md:gap-6 md:text-start">

          {/* Order 1 on mobile: Legal Links */}
          <nav aria-label={isRTL ? "روابط قانونية" : "Legal"} className="order-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-primary-foreground/90 font-bold md:order-2 md:justify-end">
            <Link to="/privacy" {...prefetchHandlers("/privacy")} className="transition hover:text-secondary">
              {isRTL ? "الخصوصية" : "Privacy"}
            </Link>
            <span aria-hidden className="text-primary-foreground/30">•</span>
            <Link to="/terms" {...prefetchHandlers("/terms")} className="font-bold transition hover:text-secondary">
              {isRTL ? "الشروط" : "Terms"}
            </Link>
          </nav>

          {/* Order 2 on mobile: Copyright & Registration Badge */}
          <div className="order-2 flex flex-col items-center gap-2 sm:flex-row sm:gap-3.5 md:order-1 md:justify-start">
            <span className="shrink-0 font-medium leading-relaxed">{rightsText}</span>
            <span className="hidden text-primary-foreground/30 sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-secondary">
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t.contact.reg}
            </span>
          </div>

        </div>
      </div>
    </footer>

  );
};
