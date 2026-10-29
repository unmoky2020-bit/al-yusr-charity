import { useState } from "react";
import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { track } from "@/lib/track";
import { submitKhabiaRequest, buildWhatsAppUrl } from "@/data/api/contactApi";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { z } from "zod";
import {
  Sparkles,
  PiggyBank,
  Truck,
  Gift,
  ShieldCheck,
  HandCoins,
  Home,
  CalendarHeart,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import khabiaCan from "@/assets/khabia-can.png";

/**
 * KhabiaProgram — "الخبيئة"
 * Visitors register, our delegate delivers a Khabia (savings can) to their door,
 * they fill it over time, then we collect & distribute on their behalf.
 */
export const KhabiaProgram = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const [form, setForm] = useState({ name: "", phone: "", city: "" });
  const [address, setAddress] = useState("");
  const [hp, setHp] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);
  // Set when the API call fails: a wa.me link pre-filled with the request so nothing is lost.
  const [whatsAppFallback, setWhatsAppFallback] = useState<string | null>(null);

  const schema = z.object({
    full_name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^01\d{9}$/),
    city: z.string().trim().min(2).max(60),
    address: z.string().trim().max(200).optional().or(z.literal("")),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // bot caught
    const parsed = schema.safeParse({
      full_name: form.name,
      phone: form.phone,
      city: form.city,
      address,
    });
    if (!parsed.success) {
      toast({ title: isRTL ? " راجع البيانات قبل الإرسال" : " Please review the form" });
      return;
    }
    // simple anti-duplicate (last 5 minutes, same phone, in this browser)
    try {
      const last = JSON.parse(localStorage.getItem("alyusr.khabia.last") || "null");
      if (last && last.phone === form.phone && Date.now() - last.at < 5 * 60_000) {
        toast({ title: isRTL ? "تم استلام طلب مماثل قبل قليل " : "A similar request was just received " });
        if (last.ref) setRefCode(last.ref);
        return;
      }
    } catch {}
    setSending(true);
    setWhatsAppFallback(null);
    try {
      // Laravel POST /khabia-requests — throws on any non-2xx, so success below is real.
      const { ref_code } = await submitKhabiaRequest({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        city: parsed.data.city,
        address: parsed.data.address || null,
      });
      const ref = ref_code ?? "";
      setRefCode(ref || null);
      try {
        localStorage.setItem(
          "alyusr.khabia.last",
          JSON.stringify({ phone: form.phone, at: Date.now(), ref }),
        );
      } catch {}
      track("khabia_request", { fbEvent: "Lead", payload: { source: "khabia-section", ref, city: form.city } });
      toast({
        title: ref
          ? (isRTL ? ` تم تسجيل طلبك (${ref}) — هنتواصل خلال ٤٨ ساعة` : `✅ Request received (${ref}) — we'll reach you within 48h`)
          : (isRTL ? " تم تسجيل طلبك — هنتواصل خلال ٤٨ ساعة" : "✅ Request received — we'll reach you within 48h"),
      });
      setForm({ name: "", phone: "", city: "" });
      setAddress("");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(err);
      }
      const waText = [
        "طلب خبيئة اليسر",
        `الاسم: ${parsed.data.full_name}`,
        `الهاتف: ${parsed.data.phone}`,
        `المدينة: ${parsed.data.city}`,
        parsed.data.address ? `العنوان: ${parsed.data.address}` : "",
      ].filter(Boolean).join("\n");
      setWhatsAppFallback(buildWhatsAppUrl(waText));
      toast({
        title: isRTL ? "تعذّر إرسال الطلب" : "Couldn't submit your request",
        description: isRTL
          ? "حصلت مشكلة في الاتصال بالخادم. تقدر تبعت نفس الطلب على واتساب من الزر اللي تحت."
          : "We couldn't reach the server. You can send the same request on WhatsApp using the button below.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const steps = [
    { I: HandCoins, t: isRTL ? "سجّل بياناتك" : "Register", d: isRTL ? "اسمك ورقمك ومدينتك — في أقل من دقيقة." : "Name, phone, city — under a minute." },
    { I: Truck, t: isRTL ? "مندوب لباب البيت" : "Delegate at your door", d: isRTL ? "نوصّلك الخبيئة مجانًا خلال ٤٨ ساعة." : "Free Khabia delivery within 48h." },
    { I: PiggyBank, t: isRTL ? "اجمع على راحتك" : "Save at your pace", d: isRTL ? "حُط فيها كل يوم اللي يتيسّر — جنيه ولا أكتر." : "Drop in what you can each day — even 1 EGP." },
    { I: Gift, t: isRTL ? "نستلم ونوزّع" : "We collect & deliver", d: isRTL ? "نمر نأخذها ونوزّعها بأمانة موثّقة." : "We collect and distribute with full documentation." },
  ];

  return (
    <section
      id="khabia"
      aria-label={isRTL ? "الخبيئة — صدقة لا يعلمها إلا الله" : "Khabia — secret charity"}
      className="relative isolate overflow-hidden bg-gradient-to-b from-background via-muted/40 to-background py-20 md:py-28"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* decorative */}
      <div aria-hidden className="pointer-events-none absolute -top-32 right-1/3 h-72 w-72 rounded-full bg-secondary/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-accent/15 blur-[120px]" />

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          {/* ── Visual side ─────────────────────────── */}
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="absolute inset-0 -z-10 rounded-[3rem] bg-orange-grad opacity-25 blur-3xl" aria-hidden />
            <div className="relative rounded-[2.5rem] border border-border bg-card/60 p-6 shadow-card backdrop-blur sm:p-10">
              <img
                src={khabiaCan}
                alt={isRTL ? "خبيئة اليسر — حصالة الصدقة" : "Al-Yusr Khabia — charity savings can"}
                className="mx-auto w-full max-w-[300px] drop-shadow-[0_25px_50px_hsl(22_88%_30%/0.35)]"
                loading="lazy"
              />
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { I: ShieldCheck, n: isRTL ? "موثّقة" : "Documented" },
                  { I: Home, n: isRTL ? "لباب البيت" : "Door delivery" },
                  { I: CalendarHeart, n: isRTL ? "متابعة دورية" : "Regular pickup" },
                ].map((b) => (
                  <div key={b.n} className="rounded-2xl border border-border bg-background/80 p-3">
                    <b.I className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1.5 text-[11px] font-extrabold text-foreground">{b.n}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Content + Form side ────────────────── */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {isRTL ? "هدية اليسر — الخبيئة" : "Al-Yusr gift — Khabia"}
            </span>

            <h2 className="mt-4 text-3xl font-black leading-tight text-foreground sm:text-4xl md:text-5xl">
              {isRTL ? (
                <>
                  صدقة لا يعلمها <span className="text-gradient-lime">إلّا الله</span>
                </>
              ) : (
                <>
                  A charity known <span className="text-gradient-lime">only to Allah</span>
                </>
              )}
            </h2>

            <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {isRTL
                ? "حصّالة صغيرة بتقعد في بيتك، تجمع فيها كل يوم اللي يتيسّر — جنيه، خمسة، عشرة. مندوب اليسر بيوصّلهالك مجانًا، وبيمر يستلمها كل فترة. أنت بتنوي.. واحنا بنوصّل، وفي ميزانك صدقة جارية موثّقة."
                : "A small can that sits in your home — drop in whatever you can each day. Our delegate delivers it free of charge and stops by to collect. You give the intention, we deliver the goodness — fully documented."}
            </p>

            {/* steps */}
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li key={s.t} className="flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <s.I className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black tracking-[0.18em] text-primary/60">
                      {(isRTL ? "خطوة 0" : "Step 0") + (i + 1)}
                    </p>
                    <h3 className="text-sm font-black text-foreground">{s.t}</h3>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* form */}
            <form
              onSubmit={submit}
              className="mt-7 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
            >
              {/* Honeypot field — hidden from real users, bots will fill it */}
              <input
                type="text"
                name="company"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <p className="text-sm font-extrabold text-primary">
                {isRTL ? "اطلب خبيئتك الآن — مجانًا لباب البيت" : "Request your Khabia — free home delivery"}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Input
                  required
                  maxLength={60}
                  placeholder={isRTL ? "الاسم" : "Full name"}
                  className="h-12"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  required
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="01XXXXXXXXX"
                  className="h-12"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                />
                <Input
                  required
                  maxLength={40}
                  placeholder={isRTL ? "المدينة / الحي" : "City / District"}
                  className="h-12"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <Input
                maxLength={180}
                placeholder={isRTL ? "العنوان التفصيلي (اختياري)" : "Detailed address (optional)"}
                className="mt-3 h-12"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Button
                type="submit"
                disabled={sending}
                className="mt-4 h-14 w-full bg-orange-grad text-base font-black text-accent-foreground shadow-cta hover:opacity-95"
              >
                <PiggyBank className="h-5 w-5" />
                {sending
                  ? (isRTL ? "جاري التسجيل..." : "Submitting...")
                  : (isRTL ? "سجّلني — وصّلولي الخبيئة" : "Register — bring me a Khabia")}
                <Arrow className="h-4 w-4" />
              </Button>
              {whatsAppFallback && (
                <div role="alert" className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-center">
                  <p className="text-xs font-bold text-destructive">
                    {isRTL ? "لم يصل طلبك للخادم. ابعته لنا على واتساب بضغطة واحدة:" : "Your request didn't reach our server. Send it on WhatsApp in one tap:"}
                  </p>
                  <a
                    href={whatsAppFallback}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2 text-xs font-black text-white shadow transition hover:opacity-90"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    {isRTL ? "إرسال الطلب عبر واتساب" : "Send via WhatsApp"}
                  </a>
                </div>
              )}
              {refCode && (
                <p className="mt-3 text-center text-xs font-extrabold text-primary">
                  {isRTL ? "رقم طلبك: " : "Your reference: "}
                  <span className="rounded-md bg-secondary/20 px-2 py-0.5 font-mono">{refCode}</span>
                </p>
              )}
              <p className="mt-3 text-center text-[11px] font-bold text-muted-foreground">
                {isRTL
                  ? "بدون أي رسوم. التوصيل خلال 48 ساعة داخل الدقهلية."
                  : "No fees. Delivery within 48h inside Dakahlia."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default KhabiaProgram;
