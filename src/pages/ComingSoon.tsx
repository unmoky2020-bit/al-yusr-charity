import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart, Home, Clock } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/**
 * Pre-launch placeholder for auth + dashboard routes.
 * To restore the real pages: open src/App.tsx and re-enable the
 * routes marked with [DISABLED-PRE-LAUNCH] (remove the JSX comments
 * and the placeholder routes that point here).
 */
const ComingSoon = () => {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <main className="grid min-h-[80vh] place-items-center bg-background px-4 py-16">
      <Helmet>
        <title>{ar ? "قريبًا — سنبلة الخير" : "Coming soon — Sanbula"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-soft md:p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-secondary/20 text-primary">
          <Clock className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-primary md:text-3xl">
          {ar ? "هذه الخدمة قريبًا" : "This feature is coming soon"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground/70 md:text-base">
          {ar
            ? "نعمل على تجهيز حسابات المتبرعين ولوحة المتابعة. حاليًا يمكنك التبرع مباشرة بدون تسجيل."
            : "Donor accounts and the tracking dashboard are on the way. For now, you can donate directly without signing in."}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 rounded-full bg-orange-grad px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-cta hover:opacity-95"
          >
            <Heart className="h-4 w-4" />
            {ar ? "تبرع الآن" : "Donate now"}
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold text-foreground/80 hover:bg-secondary/15"
          >
            <Home className="h-4 w-4" />
            {ar ? "الرئيسية" : "Home"}
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ComingSoon;