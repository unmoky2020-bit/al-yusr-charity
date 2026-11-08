import { useState } from "react";
import { Send, Mail, Heart, ShieldCheck, Sparkles, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { newsletterApi } from "@/data/laravelApi";
import { toast } from "@/hooks/use-toast";

export const Newsletter = () => {
  const { t, lang } = useLang();
  const isRTL = lang === "ar";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading || success) return;
    setLoading(true);
    try {
      await newsletterApi.subscribe(email, lang as "ar" | "en", "home");
      setSuccess(true);
      setEmail("");
      toast({
        title: isRTL ? "تم تسجيل اشتراكك" : "Subscription saved",
        description: isRTL ? "ستصلك رسالة تأكيد على بريدك الإلكتروني، اضغط على الرابط الموجود فيها لتبدأ النشرة في الوصول إليك." : "Check your inbox for a confirmation link.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast({
        variant: "destructive",
        title: isRTL ? "حدث خطأ" : "Error",
        description: msg || (isRTL ? "تعذر الاشتراك، يرجى المحاولة مرة أخرى." : "Could not subscribe. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate overflow-hidden bg-yusr-leaves py-20 text-primary-foreground md:py-28">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-secondary/20 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-accent/20 blur-[120px]" />
      <div className="container relative mx-auto max-w-4xl px-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-secondary backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {isRTL ? "نشرة اليسر" : "Al-Yusr letter"}
        </span>
        <h2 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
          {isRTL ? (
            <>
              <span>كن أول من يقرأ </span>
              <br className="hidden sm:block" />
              <span className="text-gradient-lime">قصص الخير وأثر تبرعاتك</span>
            </>
          ) : (
            <>
              <span>Be the first to read</span>
              <br className="hidden sm:block" />
              <span className="text-gradient-lime">stories of goodness</span>
            </>
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-primary-foreground/80 md:text-lg">
          {isRTL
            ? "كرتونة تصل لأم تدعو لك، وسقف يحمي أطفالًا من المطر — قصص حقيقية تصلك مرتين شهريًا دون إزعاج."
            : "A box delivered to a mother praying for you, a roof protecting children — true stories sent once every two weeks. No spam."}
        </p>
        <form className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row" onSubmit={handleSubmit} dir={isRTL ? "rtl" : "ltr"}>
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-4 ltr:left-4" />
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.newsletter.placeholder}
              className="h-14 rounded-2xl border-0 bg-background/95 text-foreground shadow-card backdrop-blur rtl:pr-11 ltr:pl-11"
              required
              disabled={loading || success}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || success}
            className="h-14 rounded-2xl bg-orange-grad px-6 text-base font-black text-accent-foreground shadow-cta hover:opacity-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {success ? (isRTL ? "تم الاشتراك" : "Subscribed") : t.newsletter.cta}
          </Button>
        </form>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-bold text-primary-foreground/75">
          <li className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-secondary" />{isRTL ? "بياناتك محمية 100%" : "Your data stays private"}</li>
          <li className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-secondary" />{isRTL ? "رسالتان شهريًا فقط" : "Only 2 emails / month"}</li>
          <li className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-secondary" />{isRTL ? "إلغاء اشتراك بضغطة واحدة" : "One-click unsubscribe"}</li>
        </ul>
      </div>
    </section>
  );
};
