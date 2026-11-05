import { Link } from "react-router-dom";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { formatNumberEN } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";


export type Tier = {
  amount: number; // EGP
  unit_ar: string;
  unit_en: string;
  desc_ar: string;
  desc_en: string;
  highlight?: boolean;
};

interface Props {
  programSlug: string;
  title_ar?: string;
  title_en?: string;
  tiers: Tier[];
}

/** Donation tiers grid that maps a tangible unit (meal / mosque-share / well-share) to amount + payment options. */
export const DonationTiers = ({ programSlug, tiers, title_ar, title_en }: Props) => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const wa = (n: number, unitAr: string, unitEn: string) =>
    `https://wa.me/201097000137?text=${encodeURIComponent(
      isRTL ? `أريد التبرع بـ ${n} جنيه — ${unitAr}` : `I'd like to donate ${n} EGP — ${unitEn}`
    )}`;

  return (
    <section className="bg-background py-14 md:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            {isRTL ? "باقات تبرع جاهزة" : "Ready donation packages"}
          </span>
          <h2 className="mt-3 text-2xl font-black text-primary md:text-4xl">
            {isRTL ? title_ar || "اختر باقة وادعم مباشرة" : title_en || "Pick a package, donate directly"}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg">
            {isRTL
              ? "كل باقة تُترجم تبرعك إلى أثر فعلي محسوب، مع خيارات دفع متعددة وآمنة."
              : "Each package translates your donation into a concrete impact, with multiple secure payment options."}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => (
            <article
              key={t.amount}
              className={`relative rounded-3xl border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card ${
                t.highlight ? "border-secondary/60 ring-2 ring-secondary/30" : "border-border"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 start-5 rounded-full bg-orange-grad px-2.5 py-0.5 text-[10px] font-black text-accent-foreground shadow-cta">
                  {isRTL ? "الأكثر طلبًا" : "Most chosen"}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-3xl font-black text-primary md:text-4xl">{formatNumberEN(t.amount)}</span>
                <span className="text-sm font-bold text-muted-foreground">{isRTL ? "ج.م" : "EGP"}</span>
              </div>
              <div className="mt-1 font-black text-primary">{isRTL ? t.unit_ar : t.unit_en}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{isRTL ? t.desc_ar : t.desc_en}</p>
              <div className="mt-4 flex flex-row justify-end gap-2">
                <Button asChild size="sm" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                  <Link
                    to={`/donate?program=${programSlug}&amount=${t.amount}`}
                    data-source="service-tiers"
                    data-label={`tier-${programSlug}-${t.amount}`}
                  >
                    <Heart className="h-4 w-4" />
                    {isRTL ? "تبرع الآن" : "Donate now"}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={wa(t.amount, t.unit_ar, t.unit_en)} target="_blank" rel="noopener">
                    <WhatsAppIcon className="h-4 w-4" />
                    {isRTL ? "تأكيد عبر واتساب" : "Confirm via WhatsApp"}
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>

      
      </div>
    </section>
  );
};

export default DonationTiers;