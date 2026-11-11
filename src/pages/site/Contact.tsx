import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Send, ShieldCheck, Heart, User, MessageSquare, ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema, ContactPageSchema } from "@/components/common/Schemas";
import { ContactChannels } from "@/components/contact/ContactChannels";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/hooks/use-toast";
import { track } from "@/lib/track";
import { submitContactMessage, buildWhatsAppUrl } from "@/data/api/contactApi";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { ORG } from "@/data/orgInfo";
import { z } from "zod";

import { useQuery } from "@tanstack/react-query";
import { fetchFaqs } from "@/data/faqsApi";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { FOUNDATION_EMAIL } from "@/data/api/contactApi";
import { bankAccountLabel, useBankAccounts } from "@/data/paymentOptions";
import { PhoneInput } from "@/components/common/PhoneInput";

/* ─── Inquiry options ─────────────────────────────────────────── */
const INQUIRY_OPTIONS = [
  { value: "general",     ar: "استفسار عام",               en: "General inquiry" },
  { value: "donation",    ar: "تبرع / سؤال عن مشروع",      en: "Donation / Project" },
  { value: "qurbani",     ar: "صك أضحية",                  en: "Qurbani share" },
  { value: "volunteer",   ar: "تطوع معنا",                  en: "Volunteering" },
  { value: "partnership", ar: "شراكة / رعاية",              en: "Partnership / Sponsorship" },
];

/* ─── Custom Dropdown ─────────────────────────────────────────── */
function SelectDropdown({
  value,
  onChange,
  isRTL,
}: {
  value: string;
  onChange: (v: string) => void;
  isRTL: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = INQUIRY_OPTIONS.find((o) => o.value === value) ?? INQUIRY_OPTIONS[0];

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div ref={ref} className="relative" role="combobox" aria-expanded={open} aria-haspopup="listbox">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={isRTL ? "نوع الاستفسار" : "Inquiry type"}
        className={`flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-4 text-sm font-bold text-foreground shadow-sm ring-offset-background transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${open ? "border-primary/60 ring-2 ring-primary/20" : ""}`}
      >
        <span className="truncate">{isRTL ? selected.ar : selected.en}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-card"
          style={{ direction: isRTL ? "rtl" : "ltr" }}
        >
          {INQUIRY_OPTIONS.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 font-extrabold text-primary"
                    : "font-semibold text-foreground hover:bg-muted/60"
                }`}
              >
                {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                {!isActive && <span className="h-1.5 w-1.5 shrink-0" />}
                {isRTL ? opt.ar : opt.en}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Field wrapper with label ────────────────────────────────── */
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
const Contact = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  // The official account from the dashboard's payment methods (hidden when none is active).
  const bankAccount = useBankAccounts()[0];
  const base = "https://elyusr.org";
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", section: "general" });
  const [sending, setSending] = useState(false);
  const startedAt = useRef<number>(Date.now());
  const focused = useRef(false);
  const [hp, setHp] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);
  // Set when the API call fails: a wa.me link pre-filled with the visitor's message so nothing is lost.
  const [whatsAppFallback, setWhatsAppFallback] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyBank = () => {
    try {
      if (!bankAccount) return;
      navigator.clipboard.writeText(bankAccount.value);
      setCopiedBank(true);
      toast({ title: isRTL ? "تم نسخ رقم الحساب البنكي" : "Bank account number copied" });
      setTimeout(() => setCopiedBank(false), 2000);
    } catch { /* no clipboard (old browser / http): the number stays on screen */ }
  };

  const handleCopyPhone = () => {
    try {
      navigator.clipboard.writeText("+201097000137");
      setCopiedPhone(true);
      toast({ title: isRTL ? "تم نسخ رقم الهاتف" : "Phone number copied" });
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch { /* no clipboard (old browser / http): the number stays on screen */ }
  };

  const { data: rawContactFaqs } = useQuery({
    queryKey: ["faqs-contact"],
    queryFn: () => fetchFaqs({ categorySlug: "contact" }),
    staleTime: 60_000,
  });

  const contactFaqItems = (rawContactFaqs && rawContactFaqs.length > 0)
    ? rawContactFaqs.map((f) => ({
        q: isRTL ? f.question_ar : (f.question_en || f.question_ar),
        a: isRTL ? f.answer_ar : (f.answer_en || f.answer_ar),
      }))
    : [];

  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(20).optional().or(z.literal("")),
    section: z.string().min(1).max(40),
    message: z.string().trim().min(5).max(2000),
  });

  useEffect(() => {
    track("contact_view", { payload: { source: "contact-page", referrer: document.referrer || "direct" } });
  }, []);

  const onFocusOnce = () => {
    if (focused.current) return;
    focused.current = true;
    track("contact_form_start", { payload: { source: "contact-page", section: form.section, referrer: document.referrer || "direct" } });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return;
    if (Date.now() - startedAt.current < 3000) {
      toast({ title: isRTL ? "يُرجى التمهّل قليلًا في كتابة رسالتك" : "Please take a moment to fill the form " });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
      toast({ title: isRTL ? "يُرجى مراجعة البيانات" : " Please review the form", description: first });
      return;
    }
    try {
      const last = JSON.parse(localStorage.getItem("alyusr.contact.last") || "null");
      if (last && last.email === form.email && Date.now() - last.at < 5 * 60_000) {
        toast({ title: isRTL ? "تم استلام رسالتك بالفعل " : "Your message was already received " });
        return;
      }
    } catch { /* private mode: no duplicate check, the server still dedupes */ }
    setSending(true);
    setWhatsAppFallback(null);
    try {
      // Laravel POST /contact-messages — throws on any non-2xx, so success below is real.
      const { ref_code } = await submitContactMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        section: parsed.data.section,
        message: parsed.data.message,
      });
      const ref = ref_code ?? "";
      setRefCode(ref || null);
      try { localStorage.setItem("alyusr.contact.last", JSON.stringify({ email: form.email, at: Date.now(), ref })); } catch { /* private mode */ }
      track("contact_submit", { fbEvent: "Lead", payload: { ref } });
      toast({
        title: ref
          ? (isRTL ? `تم استلام رسالتك (${ref})، وسنرد عليك خلال 24 ساعة` : `✅ Message received (${ref}) — we'll reply within 24 hours`)
          : (isRTL ? "تم استلام رسالتك، وسنرد عليك خلال 24 ساعة" : "✅ Message received — we'll reply within 24 hours"),
      });
      setForm({ name: "", email: "", phone: "", message: "", section: "general" });
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      const sectionLabel = INQUIRY_OPTIONS.find((o) => o.value === parsed.data.section)?.ar ?? parsed.data.section;
      const waText = [
        "رسالة من صفحة تواصل معنا",
        `الاسم: ${parsed.data.name}`,
        `البريد: ${parsed.data.email}`,
        parsed.data.phone ? `الهاتف: ${parsed.data.phone}` : "",
        `نوع الاستفسار: ${sectionLabel}`,
        `الرسالة: ${parsed.data.message}`,
      ].filter(Boolean).join("\n");
      setWhatsAppFallback(buildWhatsAppUrl(waText));
      toast({
        title: isRTL ? "تعذّر إرسال الرسالة" : "Couldn't send your message",
        description: isRTL
          ? "حدثت مشكلة في الاتصال بالخادم. يمكنك إرسال الرسالة نفسها عبر واتساب من الزر أدناه."
          : "We couldn't reach the server. You can send the same message on WhatsApp using the button below.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <PageLayout>
      <SEOHelmet
        title={isRTL ? "تواصل مع مؤسسة اليسر الخيرية — رقم التليفون وواتساب والعنوان في المنصورة" : "Contact Al-Yusr Charity — phone, WhatsApp and address in Mansoura"}
        description={isRTL
          ? `كلّم مؤسسة اليسر الخيرية على ${ORG.phoneDisplay} أو واتساب، أو ابعت على ${ORG.email}. مقرنا: ${ORG.addressAr}. ${ORG.hours.labelAr}. نرد خلال 24 ساعة على أسئلة التبرع والزكاة والتطوع.`
          : `Call Al-Yusr Charity on +20 109 700 0137 or WhatsApp, or email ${ORG.email}. Office: ${ORG.addressEn}. ${ORG.hours.labelEn}. We reply within 24 hours.`}
        path="/contact"
        keywords={isRTL ? "تواصل معنا, جمعيات خيرية بالمنصورة, جمعيات خيرية بالدقهلية, تبرع, اليسر, واتساب, حساب بنكي, صدقات, زكاة, أضاحي, كفالة أيتام, تطوع" : "contact us, charity in Mansoura, charity in Dakahlia, donate, al-yusr, WhatsApp, sadaqah, zakat, qurbani, volunteer"}
      />
      <SiteSchemas />
      <ContactPageSchema />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${base}/` },
        { name: isRTL ? "تواصل معنا" : "Contact", url: `${base}/contact` },
      ]} />

      {/* ── Compact, Clean & Consistent Hero Header ────────────── */}
      <section className="pattern-hero-luxe hero-pattern-fade relative overflow-hidden text-primary-foreground">
        <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-40" />
        
        <div className="container relative mx-auto max-w-4xl px-4 py-8 text-center md:py-12">
          {/* Breadcrumbs */}
          <div className="flex justify-center text-primary-foreground/75">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "تواصل معنا" : "Contact" }]} />
          </div>

          {/* Main title */}
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            {isRTL ? (
              <>رسالتك أمانة عندنا <span className="text-gradient-lime">نرد خلال ٢٤ ساعة</span></>
            ) : (
              <>Your message is a trust <span className="text-gradient-lime">reply within 24 hours</span></>
            )}
          </h1>

          <p className="mx-auto mt-2.5 max-w-2xl text-xs leading-relaxed text-primary-foreground/85 sm:text-sm md:text-base">
            {isRTL
              ? "سواء أردت أن تتبرّع، أو تقترح حالة، أو تتطوّع، أو تطمئن على وصول كرتونة، ففريقنا متاح من السبت إلى الخميس، من 10 صباحًا حتى 9 مساءً."
              : "Whether you want to donate, suggest a case, volunteer, or confirm a delivery — our team is here Saturday to Thursday, 10am–9pm."}
          </p>

          {/* CTA buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+201097000137"
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-grad px-6 py-2.5 text-xs font-black text-accent-foreground shadow-cta transition hover:opacity-90"
            >
              <Phone className="h-4 w-4" />
              {isRTL ? "اتصل الآن" : "Call now"}
            </a>
            <a
              href={`mailto:${FOUNDATION_EMAIL}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-xs font-black text-primary-foreground backdrop-blur transition hover:bg-white/20"
            >
              <Mail className="h-4 w-4" />
              {isRTL ? "راسلنا بالبريد الإلكتروني" : "Email us"}
            </a>
          </div>

          {/* Row 2: "نسمع ونرد بأمانة" badge in a centered row below the buttons */}
          <div className="mx-auto mt-3 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary-foreground/90 backdrop-blur shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              {isRTL ? "نسمع ونرد بأمانة" : "We listen & respond"}
            </span>
          </div>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────────────── */}
      <section className="pattern-programs relative overflow-x-clip py-8 md:py-12 pb-16 md:pb-24">
        <div className="container relative mx-auto grid min-w-0 max-w-6xl gap-6 px-4 lg:grid-cols-2 lg:items-stretch">

          {/* ── Info column (Right in RTL) ───────────────────────── */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* Header card */}
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-card transition-all">
              <div aria-hidden className="pointer-events-none absolute -start-10 -top-10 h-32 w-32 rounded-full bg-secondary/15 blur-2xl" />
              <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                      {isRTL ? "معلومات سريعة ومباشرة" : "Quick contact info"}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl font-black text-foreground sm:text-2xl">
                    {isRTL ? "كل تفاصيل الاتصال بين يديك" : "All contact details within reach"}
                  </h2>
                </div>
                <span className="inline-flex items-center self-start sm:self-auto rounded-full bg-secondary/15 px-3.5 py-1.5 text-[11px] font-black text-primary ring-1 ring-secondary/30 shadow-xs">
                  {isRTL ? "نرد خلال 24 ساعة" : "Reply within 24h"}
                </span>
              </div>
              <p className="relative mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {isRTL
                  ? "من البريد الإلكتروني وواتساب إلى المكالمات والزيارات الميدانية، فريقنا مستعد لمتابعة طلبك وضمان وصول التبرعات بأسرع الطرق وأوضحها، وبكل أمانة."
                  : "From email and WhatsApp to calls and field visits — our team is ready to follow up your request and ensure donations arrive fastest and most transparently."}
              </p>
            </div>

            {/* One calm box: every way to reach us, and where / when to visit */}
            <ContactChannels
              isRTL={isRTL}
              copiedPhone={copiedPhone}
              onCopyPhone={handleCopyPhone}
              bank={bankAccount ? { title: bankAccountLabel(bankAccount).split(":")[0], value: bankAccount.value } : null}
              copiedBank={copiedBank}
              onCopyBank={handleCopyBank}
            />

            {/* Trust strip (Solid bg-card, no transparency) */}
            <div className="relative overflow-hidden rounded-3xl border border-border/80 border-s-4 border-s-secondary bg-card p-4 sm:p-5 shadow-card">
              <div aria-hidden className="pointer-events-none absolute -bottom-10 -end-10 h-28 w-28 rounded-full bg-secondary/10 blur-2xl" />
              <div className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-secondary/20 text-primary ring-1 ring-secondary/30 shadow-xs">
                  <ShieldCheck className="h-5 w-5 text-secondary" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-foreground">
                      {isRTL ? "مؤسسة موثّقة ومرخّصة رسميًا" : "Officially Licensed & Verified"}
                    </span>
                    <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-black text-primary">
                      {isRTL ? "منذ 2019" : "Since 2019"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {isRTL
                      ? "إشهار رقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي. كل تبرع موثّق بالصور والفيديو، وكل رسالة نرد عليها بأمانة تامة."
                      : "Registered NGO #2665 (2019) under the Ministry of Social Solidarity. Every donation is verified and documented."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form column (Left in RTL) ───────────────────────── */}
          <form
            onSubmit={submit}
            onFocus={onFocusOnce}
            className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-card sm:p-7 md:p-8"
          >
            {/* Decorative glows */}
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-secondary/15 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />

            {/* Form header */}
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary ring-1 ring-secondary/30">
                <Heart className="h-3 w-3 text-secondary fill-secondary" /> {isRTL ? "نحن نسمعك دائمًا" : "We're listening"}
              </span>
              <h2 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">
                {isRTL ? "أرسل إلينا رسالتك" : "Send us your message"}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                {isRTL ? "سنرد عليك خلال 24 ساعة عمل، وهذا وعد منا." : "We'll reply within 24 working hours — promise."}
              </p>
            </div>

            {/* Honeypot */}
            <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} autoComplete="off" tabIndex={-1} aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />

            {/* Fields */}
            {/* On wide screens the form is as tall as the info column: the message box takes the spare room */}
            <div className="relative mt-6 grid flex-1 gap-4 sm:grid-cols-2 lg:grid-rows-[auto_auto_minmax(0,1fr)]">
              {/* Name */}
              <FieldGroup label={isRTL ? "الاسم *" : "Name *"}>
                <div className="relative">
                  <User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    maxLength={100}
                    placeholder={isRTL ? "محمد أحمد" : "John Smith"}
                    className="h-12 ps-10 rounded-2xl border-border/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </FieldGroup>

              {/* Email */}
              <FieldGroup label={isRTL ? "البريد الإلكتروني *" : "Email *"}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    maxLength={255}
                    placeholder="example@email.com"
                    className="h-12 ps-10 rounded-2xl border-border/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </FieldGroup>

              {/* Phone */}
              <FieldGroup label={isRTL ? "رقم الهاتف" : "Phone (optional)"}>
                <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} className="rounded-2xl bg-background/50" />
              </FieldGroup>

              {/* Inquiry type — custom dropdown */}
              <FieldGroup label={isRTL ? "نوع الاستفسار" : "Inquiry type"}>
                <SelectDropdown
                  value={form.section}
                  onChange={(v) => setForm({ ...form, section: v })}
                  isRTL={isRTL}
                />
              </FieldGroup>

              {/* Message — full width */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  {isRTL ? "رسالتك *" : "Your message *"}
                </label>
                <div className="relative flex-1">
                  <MessageSquare className="pointer-events-none absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    required
                    maxLength={1000}
                    rows={4}
                    placeholder={isRTL ? "اكتب رسالتك أو استفسارك هنا بكل تفصيل..." : "Write your message here..."}
                    className="h-full min-h-[7.5rem] rounded-2xl ps-10 resize-none border-border/80 bg-background/50 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={sending}
              className="mx-auto mt-6 flex h-12 w-full max-w-[320px] items-center justify-center gap-2 rounded-full bg-orange-grad text-sm font-extrabold text-accent-foreground shadow-cta transition-all hover:opacity-95 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? (isRTL ? "جارٍ الإرسال..." : "Sending...") : (isRTL ? "إرسال الرسالة الآن" : "Send message now")}
            </Button>

            <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] font-bold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary shrink-0" />
              <span>{isRTL ? "بياناتك مشفّرة ومحمية، ولا نشاركها مع أي جهة" : "Your data is strictly confidential and protected"}</span>
            </div>

            {whatsAppFallback && (
              <div role="alert" className="mx-auto mt-4 max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                <p className="text-xs font-bold text-destructive">
                  {isRTL ? "لم تصل رسالتك إلى الخادم. أرسلها إلينا عبر واتساب بضغطة واحدة:" : "Your message didn't reach our server. Send it on WhatsApp in one tap:"}
                </p>
                <a
                  href={whatsAppFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-xs font-black text-white shadow transition hover:opacity-90"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {isRTL ? "إرسال الرسالة عبر واتساب" : "Send via WhatsApp"}
                </a>
              </div>
            )}

            {refCode && (
              <p className="mt-3 text-center text-xs font-extrabold text-primary">
                {isRTL ? "رقم مرجع رسالتك: " : "Your reference: "}
                <span className="rounded-md bg-secondary/20 px-2.5 py-1 font-mono text-foreground font-black">{refCode}</span>
              </p>
            )}
          </form>
        </div>

        {/* ── Map section ──────────────────────────────────────────── */}
        <div id="contact-map" className="container mx-auto mt-12 max-w-6xl px-4 mb-4 scroll-mt-24">
          <div className="overflow-hidden rounded-3xl border border-primary/20 shadow-[0_24px_80px_-20px_hsl(150_55%_8%/0.5)]">
            {/* Header */}
            <div className="pattern-hero-luxe relative overflow-hidden px-6 pb-4 pt-5 text-primary-foreground">
              <div aria-hidden className="brand-leaf-tile pointer-events-none absolute inset-0 opacity-35" />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/60" />
              <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.26em] text-primary-foreground/85 backdrop-blur">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    {isRTL ? "موقعنا على الخريطة" : "Our location on the map"}
                  </span>
                  <h2 className="mt-2 text-xl font-black md:text-2xl">
                    {isRTL ? "المنصورة · تقسيم خطاب" : "Mansoura · Khattab District"}
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-primary-foreground/80 sm:text-sm">
                    {isRTL
                      ? "بجوار وكالة المنصورة — مقر المؤسسة والمجمّع الطبي."
                      : "Next to Mansoura Agency — Foundation HQ & medical complex."}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${ORG.geo.lat},${ORG.geo.lng}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-secondary px-5 py-2 text-xs font-black text-primary shadow-glow transition hover:opacity-90"
                >
                  <MapPin className="h-4 w-4" />
                  {isRTL ? "افتح الاتجاهات" : "Open directions"}
                </a>
              </div>
            </div>

            {/* Iframe */}
            <div className="relative overflow-hidden">
              <iframe
                title={isRTL ? "موقع مؤسسة اليسر — المنصورة" : "Al-Yusr Charity — Mansoura location"}
                src={ORG.mapsEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[340px] w-full border-0 md:h-[420px]"
              />
            </div>
          </div>
        </div>

      </section>

      {/* ── Contact Page FAQs — outside main section for full-width bg ── */}
      {contactFaqItems.length > 0 && (
        <LocalFAQ
          items={contactFaqItems}
          title={isRTL ? "أسئلة شائعة حول التواصل والزيارة" : "Contact & Visit FAQs"}
          intro={isRTL ? "إجابات عن أهم الاستفسارات حول مواعيد العمل ومكاتب المؤسسة ومندوبي التحصيل." : "Frequently asked questions regarding working hours, headquarters, and delegates."}
          id="contact-faqs"
        />
      )}
    </PageLayout>
  );
};
export default Contact;
