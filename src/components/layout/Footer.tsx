import { Logo } from "@/components/common/Logo";
import { Link, useLocation } from "react-router-dom";
import { Facebook, Instagram, Phone, Mail, MapPin, Building2, BadgeCheck, HandHeart, HeartHandshake, Heart, ShieldCheck, Beef, Sparkles, ArrowLeft, Clock, Send, Bell, CheckCircle2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useLang } from "@/i18n/LangContext";
import { prefetchHandlers } from "@/lib/prefetch";
import { useState } from "react";
import { toast } from "sonner";
import { newsletterApi } from "@/data/laravelApi";
import { track } from "@/lib/track";
import ctaHourglass from "@/assets/cta-hourglass-banner.jpg";
import logoCircle from "@/assets/logo-circle.png";
import { FOUNDATION_EMAIL } from "@/data/api/contactApi";
import { bankAccountLabel, useBankAccounts } from "@/data/paymentOptions";

export const Footer = () => {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const bankAccounts = useBankAccounts();
  const bankText = bankAccounts[0] ? bankAccountLabel(bankAccounts[0]) : "";
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
      // Laravel POST /newsletter — same call the homepage Newsletter section uses.
      // apiFetch throws on any non-2xx, so success is only shown for a real 2xx.
      const res = await newsletterApi.subscribe(value, lang === "en" ? "en" : "ar");
      setSubscribed(true);
      setEmail("");
      track("newsletter_subscribe", {
        fbEvent: "Lead",
        payload: { email_domain: value.split("@")[1], lang, source: "footer", path: pathname, status: res?.data?.status ?? "confirmed" },
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

      {/* Newsletter — an airmail envelope that floats over the previous section */}
      <div className="relative overflow-visible">
        <div className="container relative z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -translate-y-[15%] -mb-7 sm:-mb-8 md:-mb-10">
          <div className="relative mx-auto w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#fbfdf7] via-[#f1f8e7] to-[#e6f3d6] text-[#0b4429] shadow-[0_26px_60px_-28px_rgba(6,48,28,0.45)] ring-1 ring-[#0b4429]/10">
            {/* airmail edge */}
            <div aria-hidden className="h-2.5 w-full" style={{ background: "repeating-linear-gradient(135deg,#f58220 0 16px,#fdfaf3 16px 26px,#8cc63f 26px 42px,#fdfaf3 42px 52px)" }} />
            {/* faint envelope fold lines */}
            <svg aria-hidden className="pointer-events-none absolute inset-x-0 top-2.5 h-full w-full text-[#0b4429]/[0.07]" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 0 L50 22 L100 0" fill="none" stroke="currentColor" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* stamp */}
            <div aria-hidden className="absolute start-6 top-8 hidden rotate-[-6deg] md:block lg:start-10">
              {/* perforated edge: a ring of holes around a solid face */}
              <div
                className="h-[86px] w-[74px] p-[4px] drop-shadow-md"
                style={{ background: "radial-gradient(circle at 4px 4px, transparent 2.4px, #ffffff 2.9px) -4px -4px / 8px 8px" }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 border border-dashed border-[#0b4429]/35 bg-white">
                  <img src={logoCircle} alt="" className="h-9 w-9" loading="lazy" />
                  <span className="text-[9px] font-black text-[#0b4429]">{isRTL ? "بريد الخير" : "Al-Yusr post"}</span>
                </div>
              </div>
              {/* postmark */}
              <div className="absolute -end-10 top-10 h-12 w-12 rotate-[14deg] rounded-full border-2 border-[#0b4429]/25 text-center text-[8px] font-black leading-[2.6rem] text-[#0b4429]/45">
                {isRTL ? "المنصورة" : "Mansoura"}
              </div>
            </div>

            {!subscribed ? (
              <div className="relative grid items-end gap-6 px-5 pb-7 pt-9 sm:px-8 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-10 md:pb-10 md:pt-14">
                <div className="text-center md:ps-28 md:text-start lg:ps-32">
                  <p className="text-xs font-black text-[#4d8a1f]">{isRTL ? "نشرة اليسر، كل أسبوعين" : "Al-Yusr letter, every two weeks"}</p>
                  <h3 className="mt-2 text-[1.45rem] font-black leading-snug md:text-[1.8rem]">
                    {isRTL ? "رسالة من الميدان توصل بريدك" : "A letter from the field, in your inbox"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#0b4429]/70">
                    {isRTL
                      ? "صور التوزيع، والحالات اللي اكتملت بتبرعاتكم، والحملة الجاية قبل ما تبدأ."
                      : "Photos from distributions, cases your gifts completed, and the next campaign before it starts."}
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="relative w-full" noValidate>
                  <label htmlFor="newsletter-email" className="mb-1 block text-xs font-black text-[#0b4429]/55">
                    {isRTL ? "إلى:" : "To:"}
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <input
                      id="newsletter-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="h-12 min-w-0 flex-1 border-0 border-b-2 border-dashed border-[#0b4429]/30 bg-transparent px-1 text-base font-bold text-[#0b4429] outline-none transition-colors placeholder:text-[#0b4429]/35 focus:border-[#f58220] focus-visible:ring-0"
                    />
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-grad px-6 text-sm font-black text-accent-foreground shadow-cta transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b4429] focus-visible:ring-offset-2 disabled:translate-y-0 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4 rtl:-scale-x-100" />
                      {subscribing ? (isRTL ? "بيتبعت..." : "Sending...") : (isRTL ? "ابعتولي النشرة" : "Send me the letter")}
                    </button>
                  </div>
                  <p className="mt-2.5 text-[11px] font-semibold text-[#0b4429]/50">
                    {isRTL ? "تقدر تلغي الاشتراك من أي رسالة بضغطة واحدة." : "Unsubscribe from any letter with one click."}
                  </p>
                </form>
              </div>
            ) : (
              <div className="relative flex flex-col items-center gap-4 px-5 py-7 text-center sm:px-8 md:flex-row md:justify-between md:px-10 md:text-start" role="status">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <div className="grid h-14 w-14 shrink-0 rotate-[-8deg] place-items-center rounded-full border-2 border-dashed border-[#4d8a1f] text-[#4d8a1f]">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-tight sm:text-xl md:text-2xl">
                      {isRTL ? "اتسجّلت. فاضل خطوة واحدة" : "You're on the list. One step left"}
                    </h3>
                    <p className="mt-1 text-sm text-[#0b4429]/70">
                      {isRTL
                        ? "بعتنالك إيميل تأكيد. افتحه واضغط على الرابط علشان النشرة توصلك."
                        : "We sent you a confirmation email. Open it and click the link to start receiving the letter."}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-center gap-2">
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
                    className="inline-flex h-10 items-center rounded-xl border border-[#0b4429]/20 bg-white/70 px-3.5 text-xs font-bold text-[#0b4429] hover:border-[#0b4429]/50"
                  >
                    {isRTL ? "سجّل بريد تاني" : "Add another email"}
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
              <li><Link to="/trust" {...prefetchHandlers("/trust")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "الشفافية" : "Transparency"}</Link></li>
              <li><Link to="/about#achievements" {...prefetchHandlers("/about")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "إنجازاتنا" : "Achievements"}</Link></li>
              <li><Link to="/gallery" {...prefetchHandlers("/gallery")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "معرض الصور" : "Gallery"}</Link></li>
              <li><Link to="/blog" {...prefetchHandlers("/blog")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "المدونة" : "Blog"}</Link></li>
              <li><Link to="/faqs" {...prefetchHandlers("/faqs")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "الأسئلة الشائعة" : "FAQs"}</Link></li>
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
              <li><Link to="/takrim" {...prefetchHandlers("/takrim")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "تكريم الإنسان (غسل ونقل الموتى)" : "Takrim (funeral service)"}</Link></li>
              <li><Link to="/water" {...prefetchHandlers("/water")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "سقيا الماء" : "Clean water"}</Link></li>
              <li><Link to="/medical" {...prefetchHandlers("/medical")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "المساعدات الطبية" : "Medical aid"}</Link></li>
              <li><Link to="/ten-days" {...prefetchHandlers("/ten-days")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "صدقات العشر الأوائل" : "The ten days"}</Link></li>
              <li><Link to="/misbaha" {...prefetchHandlers("/misbaha")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "المسبحة الإلكترونية" : "Digital tasbih"}</Link></li>
              <li><Link to="/nurseries" {...prefetchHandlers("/nurseries")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حضانات اليسر ودور التحفيظ" : "Nurseries & Qur'an houses"}</Link></li>
              <li><Link to="/athar" {...prefetchHandlers("/athar")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "حملة أَثَر التعليمية" : "Athar Education"}</Link></li>
              <li><Link to="/ramadan" {...prefetchHandlers("/ramadan")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "موسم رمضان المبارك" : "Ramadan Season"}</Link></li>
              <li><Link to="/food-box" {...prefetchHandlers("/food-box")} className="block text-primary-foreground/85 hover:text-secondary">{lang === "ar" ? "الغذاء الشهري" : "Monthly Food"}</Link></li>
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
                <a href={`mailto:${FOUNDATION_EMAIL}`} className="text-primary-foreground/80 hover:text-secondary">{FOUNDATION_EMAIL}</a>
              </li>
              {bankAccounts.map((acc) => (
                <li key={acc.value} className="flex items-start justify-center gap-2 sm:justify-start">
                  <Building2 className="mt-0.5 hidden h-4 w-4 shrink-0 text-secondary sm:inline-block" aria-hidden />
                  <span dir="ltr" className="text-primary-foreground/80">{isRTL ? "الحساب البنكي" : "Bank account"} {bankAccountLabel(acc).split(":")[0]}: <span className="font-bold text-secondary">{acc.value}</span></span>
                </li>
              ))}
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
