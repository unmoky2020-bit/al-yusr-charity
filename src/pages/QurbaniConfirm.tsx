import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, ShieldCheck, Receipt as ReceiptIcon, Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { donationsStore, subscribeDonations, type DonationRecord } from "@/data/donationsStore";

const STATUS_LABEL = {
  pending:    { ar: "بانتظار التأكيد",   en: "Pending confirmation", color: "bg-amber-500/15 text-amber-700" },
  processing: { ar: "قيد المعالجة",       en: "Processing",           color: "bg-sky-500/15 text-sky-700" },
  completed:  { ar: "تم التأكيد ✓",       en: "Confirmed ✓",          color: "bg-emerald-500/15 text-emerald-700" },
  failed:     { ar: "فشلت العملية",       en: "Failed",               color: "bg-red-500/15 text-red-700" },
} as const;

const QurbaniConfirm = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const [params] = useSearchParams();
  const ref = params.get("ref") || "";
  const [rec, setRec] = useState<DonationRecord | undefined>(() => (ref ? donationsStore.byRef(ref) : undefined));

  useEffect(() => {
    if (!ref) return;
    const u = subscribeDonations(() => setRec(donationsStore.byRef(ref)));
    return u;
  }, [ref]);

  // Fire success / fail events when status resolves
  useEffect(() => {
    if (!rec) return;
    const map: Record<string, string> = { completed: "qurbani_payment_success", failed: "qurbani_payment_fail" };
    const evt = map[rec.status];
    if (!evt) return;
    const payload = { source: "qurbani-confirm", method: rec.method, value: rec.amount, currency: "EGP", transaction_id: rec.ref };
    (window as any).dataLayer?.push?.({ event: evt, ...payload });
    (window as any).gtag?.("event", evt, payload);
    if (rec.status === "completed") {
      (window as any).fbq?.("track", "Purchase", { value: rec.amount, currency: "EGP", content_name: "qurbani", content_category: rec.method });
      // Fire a precise Lead event tying the booking step to the order ref + source
      const lead = { source: "qurbani-confirm", program: "odhya", transaction_id: rec.ref, value: rec.amount, currency: "EGP", method: rec.method };
      (window as any).dataLayer?.push?.({ event: "qurbani_lead", ...lead });
      (window as any).gtag?.("event", "qurbani_lead", lead);
      (window as any).fbq?.("track", "Lead", { content_name: "qurbani", content_category: rec.method, value: rec.amount, currency: "EGP" });
      (window as any).fbq?.("trackCustom", "QurbaniLead", lead);
    }
    if (rec.status === "failed")    (window as any).fbq?.("trackCustom", "QurbaniPaymentFail", payload);
  }, [rec?.status, rec?.ref]);

  const status = rec ? STATUS_LABEL[rec.status] : null;
  const waText = useMemo(() => encodeURIComponent(isAr
    ? `حابب أتابع طلب صك الأضحية رقم ${ref}`
    : `I'd like to follow up on Qurbani order ${ref}`), [isAr, ref]);

  return (
    <PageLayout>
      <SEOHelmet
        title={isAr ? `تأكيد صك الأضحية ${ref ? "— " + ref : ""} | اليسر` : `Qurbani confirmation ${ref ? "— " + ref : ""} | Al-Yusr`}
        description={isAr ? "تأكيد طلب صك الأضحية مع رقم المرجع وحالة الدفع وخطوات المتابعة." : "Qurbani booking confirmation with reference number, payment status and follow-up steps."}
        path="/qurbani/confirm"
      />

      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <Breadcrumbs items={[
            { name: isAr ? "الرئيسية" : "Home", href: "/" },
            { name: isAr ? "صك الأضحية" : "Qurbani", href: "/qurbani" },
            { name: isAr ? "تأكيد الحجز" : "Confirmation" },
          ]} />

          {!rec ? (
            <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-card">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground" />
              <h1 className="mt-4 text-2xl font-black text-primary">
                {isAr ? "مفيش طلب بهذا الرقم" : "No order found"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isAr ? "تأكد من رابط التأكيد أو ابدأ حجز جديد." : "Check the link or start a new booking."}
              </p>
              <Button asChild className="mt-6 bg-orange-grad text-accent-foreground shadow-cta">
                <Link to="/qurbani"><Heart className="h-4 w-4" />{isAr ? "احجز صك أضحية" : "Reserve a share"}</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-3xl border border-secondary/30 bg-card shadow-card">
              <div className="pattern-hero-luxe hero-pattern-fade p-6 text-center text-primary-foreground md:p-8">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-secondary-foreground shadow-glow">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h1 className="mt-4 text-2xl font-black md:text-3xl">
                  {isAr ? "تم استلام طلب صك الأضحية" : "Qurbani booking received"}
                </h1>
                <p className="mt-1 text-sm text-primary-foreground/85">
                  {isAr ? "هنبعتلك إيصال PDF ورابط متابعة على الواتساب والإيميل." : "You'll get a PDF receipt and a follow-up link by WhatsApp and email."}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-extrabold ring-1 ring-secondary/40">
                  <ReceiptIcon className="h-4 w-4 text-secondary" />
                  <span className="font-mono">{rec.ref}</span>
                </div>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
                <Field label={isAr ? "الحالة" : "Status"}>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${status!.color}`}>
                    {status![lang]}
                  </span>
                </Field>
                <Field label={isAr ? "طريقة الدفع" : "Payment method"}>
                  <span className="font-extrabold text-primary">
                    {rec.method === "paymob" ? "Kashier (Visa/Master)"
                      : rec.method === "vodafone" ? "Vodafone Cash"
                      : rec.method === "instapay" ? "InstaPay"
                      : (isAr ? "تحويل بنكي CIB" : "CIB Bank Transfer")}
                  </span>
                </Field>
                <Field label={isAr ? "المبلغ" : "Amount"}>
                  <span className="font-mono text-lg font-black text-primary">{rec.amount.toLocaleString()} <small className="text-xs">{isAr ? "ج.م" : "EGP"}</small></span>
                </Field>
                <Field label={isAr ? "البرنامج" : "Program"}>
                  <span className="font-extrabold text-primary">{rec.programLabel}</span>
                </Field>
                <Field label={isAr ? "اسم المتبرع" : "Donor"}>
                  <span className="font-bold text-foreground">{rec.donor.name}</span>
                </Field>
                <Field label={isAr ? "رقم الهاتف" : "Phone"}>
                  <span dir="ltr" className="font-mono text-foreground">{rec.donor.phone}</span>
                </Field>
              </div>

              {/* Next steps */}
              <div className="border-t border-border bg-muted/30 p-6 md:p-8">
                <h2 className="text-lg font-black text-primary">{isAr ? "الخطوات الجاية" : "Next steps"}</h2>
                <ol className="mt-3 space-y-2 text-sm">
                  {[
                    isAr ? "تأكيد المبلغ وإصدار الإيصال خلال دقائق" : "Amount confirmed and receipt issued within minutes",
                    isAr ? "تواصل من فريقنا قبل العيد لتأكيد العنوان" : "Our team contacts you pre-Eid to confirm address",
                    isAr ? "صور ومعاينة طبية للأضحية قبل الذبح" : "Vet check + photos before slaughter",
                    isAr ? "فيديو الذبح + توصيل لباب البيت يوم العيد" : "Slaughter video + doorstep delivery on Eid",
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                      <span className="text-foreground/85">{s}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="bg-orange-grad text-accent-foreground shadow-cta">
                    <Link to={`/donate/track/${rec.ref}`}
                      onClick={() => {
                        const p = { source: "qurbani-confirm", transaction_id: rec.ref };
                        (window as any).dataLayer?.push?.({ event: "track_order_click", ...p });
                        (window as any).gtag?.("event", "track_order_click", p);
                      }}>
                      <ReceiptIcon className="h-4 w-4" />{isAr ? "تتبع الطلب" : "Track order"}
                    </Link>
                  </Button>
                  <a
                    href={`https://wa.me/201097000137?text=${waText}`}
                    target="_blank" rel="noopener"
                    onClick={() => {
                      const p = { source: "qurbani-confirm", transaction_id: rec.ref };
                      (window as any).dataLayer?.push?.({ event: "whatsapp_click", ...p });
                      (window as any).gtag?.("event", "whatsapp_click", p);
                      (window as any).fbq?.("trackCustom", "WhatsAppQurbani", p);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-md border border-secondary/40 bg-card px-5 text-sm font-extrabold text-primary hover:bg-secondary/10"
                  >
                    <MessageCircle className="h-4 w-4" />{isAr ? "تواصل واتساب" : "WhatsApp us"}
                  </a>
                  <Button asChild variant="outline">
                    <Link to="/qurbani"><ArrowLeft className="h-4 w-4" />{isAr ? "صفحة الأضحية" : "Qurbani page"}</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-background p-3">
    <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1">{children}</div>
  </div>
);

export default QurbaniConfirm;