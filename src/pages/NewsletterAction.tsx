import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, AlertCircle, Heart, Loader2 } from "lucide-react";
import { confirmNewsletter, unsubscribeNewsletter } from "@/data/api/newsletterTokenApi";
import { ApiError } from "@/data/laravelApi";
import { useLang } from "@/i18n/LangContext";
import { PageLayout } from "@/components/layout/PageLayout";
import { track } from "@/lib/track";

/** "error" = invalid/expired link (4xx from the API); "unavailable" = network / server failure. */
type Status = "loading" | "ok" | "error" | "unavailable";

const NewsletterAction = ({ action }: { action: "confirm" | "unsubscribe" }) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    (async () => {
      try {
        // Laravel POST /newsletter/confirm | /newsletter/unsubscribe — throws on any non-2xx.
        const data = action === "confirm"
          ? await confirmNewsletter(token)
          : await unsubscribeNewsletter({ token });
        setEmail(data.email ?? "");
        setStatus("ok");
        track(action === "confirm" ? "newsletter_confirmed" : "newsletter_unsubscribed", {
          payload: { source: "email_link" },
        });
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error(e);
        }
        const code = e instanceof ApiError ? e.status : 0;
        setStatus([400, 404, 410, 422].includes(code) ? "error" : "unavailable");
      }
    })();
  }, [token, action]);

  const titleAr = action === "confirm" ? "تم تأكيد اشتراكك" : "تم إلغاء اشتراكك";
  const titleEn = action === "confirm" ? "Subscription confirmed" : "You're unsubscribed";

  return (
    <PageLayout>
      <Helmet>
        <title>{`${isRTL ? titleAr : titleEn} | Al-Yusr`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <section className="container mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p>{isRTL ? "جارٍ المعالجة..." : "Processing..."}</p>
            </div>
          )}
          {status === "ok" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary/15 text-secondary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-black text-primary md:text-3xl">{isRTL ? titleAr : titleEn}</h1>
              {email && <p className="mt-2 text-sm text-muted-foreground" dir="ltr">{email}</p>}
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                {action === "confirm"
                  ? (isRTL
                      ? "ستصلك أحدث الحملات وقصص الأثر، فابدأ رحلتك معنا بصدقة جارية الآن."
                      : "You'll receive our latest campaigns and impact stories — make your start meaningful with a donation today.")
                  : (isRTL
                      ? "تم إيقاف الرسائل. وإن غيّرت رأيك، يمكنك الاشتراك من جديد في أي وقت."
                      : "We won't email you anymore. You can resubscribe anytime.")}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {action === "confirm" && (
                  <Link to="/donate" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-orange-grad px-5 text-sm font-black text-accent-foreground shadow-cta">
                    <Heart className="h-4 w-4" /> {isRTL ? "تبرع الآن" : "Donate now"}
                  </Link>
                )}
                <Link to="/" className="inline-flex h-11 items-center gap-2 rounded-2xl border border-primary/15 bg-background px-5 text-sm font-extrabold text-primary hover:border-secondary">
                  {isRTL ? "الصفحة الرئيسية" : "Home"}
                </Link>
              </div>
            </>
          )}
          {status === "error" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-black text-primary">
                {isRTL ? "رابط غير صالح" : "Invalid link"}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {isRTL ? "الرابط منتهي الصلاحية أو غير صحيح." : "The link is invalid or expired."}
              </p>
              <Link to="/" className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-primary/15 bg-background px-5 text-sm font-extrabold text-primary hover:border-secondary">
                {isRTL ? "الصفحة الرئيسية" : "Home"}
              </Link>
            </>
          )}
          {status === "unavailable" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-black text-primary">
                {isRTL ? "تعذّر إتمام العملية" : "Something went wrong"}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                {isRTL
                  ? "الخدمة غير متاحة حاليًا. لم يتم تنفيذ طلبك — جرّب فتح الرابط مرة أخرى بعد قليل."
                  : "The service is unavailable right now. Your request was not completed — please open the link again later."}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-primary/15 bg-background px-5 text-sm font-extrabold text-primary hover:border-secondary"
              >
                {isRTL ? "إعادة المحاولة" : "Try again"}
              </button>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default NewsletterAction;
