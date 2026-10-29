import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { useLang } from "@/i18n/LangContext";

/**
 * A program URL that is not (or no longer) published on the backend: missing, inactive or hidden.
 * Not indexed; points the visitor to the live programs and the donation form instead of old content.
 */
export function ProgramUnavailable() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <PageLayout>
      <Helmet>
        <title>{isAr ? "البرنامج غير متاح حالياً | مؤسسة اليسر الخيرية" : "Program not available | Al-Yusr"}</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="container mx-auto grid min-h-[50vh] max-w-xl place-items-center px-4 py-20 text-center">
        <div>
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-primary sm:text-3xl">
            {isAr ? "البرنامج غير متاح حالياً" : "This program is not available right now"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {isAr
              ? "البرنامج ده مش بيستقبل تبرعات دلوقتي. تقدر تختار برنامج تاني من برامجنا الحالية، أو تتبرع تبرع عام ونوصله للأشد احتياجاً."
              : "This program is not accepting donations right now. Choose one of our current programs, or give a general donation for the families most in need."}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="rounded-full px-6 font-black">
              <Link to="/programs">{isAr ? "برامجنا الحالية" : "Current programs"}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-6 font-black">
              <Link to="/donate">{isAr ? "تبرع عام" : "General donation"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
