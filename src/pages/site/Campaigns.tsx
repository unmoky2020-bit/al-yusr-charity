import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users2, Megaphone, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { Campaign, listPublicCampaigns } from "@/data/campaignsApi";

const Campaigns = () => {
  const { lang } = useLang();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublicCampaigns().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout>
      <SEOHelmet
        title={lang === "ar" ? "حملات التطوع | مؤسسة اليسر" : "Volunteer Campaigns | Al-Yusr"}
        description={lang === "ar" ? "انضم لحملاتنا الموسمية للتطوع في المناسبات والمشاريع الميدانية." : "Join our seasonal volunteer drives."}
        path="/volunteer-campaigns"
      />
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="text-primary-foreground/85"><Breadcrumbs items={[{ name: lang === "ar" ? "الرئيسية" : "Home", href: "/" }, { name: lang === "ar" ? "حملات التطوع" : "Campaigns" }]} /></div>
          <header className="mt-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-primary-foreground backdrop-blur">
              <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">
              {lang === "ar" ? "حملات التطوع المفتوحة" : "Open volunteer campaigns"}
            </h1>
            <p className="mt-2 text-sm text-primary-foreground/85">
              {lang === "ar" ? "اختر حملة وانضم إلى الفريق، فكل مقعد يصنع فرقًا." : "Pick a campaign and join the team."}
            </p>
          </header>
        </div>
      </section>
      <section className="bg-background pt-10 pb-28 sm:pb-36 md:pt-14 md:pb-44">
        <div className="container mx-auto max-w-6xl px-4">
          {loading ? (
            <div className="mt-10 grid place-items-center text-muted-foreground">…</div>
          ) : items.length === 0 ? (
            <div className="mt-10 rounded-2xl bg-card p-10 text-center shadow-soft">
              <p className="text-muted-foreground">{lang === "ar" ? "لا توجد حملات مفتوحة حاليًا. عُد قريبًا." : "No open campaigns right now."}</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => {
                const needed = Number(c.slots_needed) || 30;
                const filled = Number(c.slots_filled) || 0;
                const remaining = Math.max(0, needed - filled);
                const pct = needed > 0 ? Math.min(100, Math.round((filled / needed) * 100)) : 0;
                return (
                  <Link key={c.id} to={`/campaigns/${c.slug}`} className="group flex flex-col rounded-2xl bg-card p-5 shadow-soft transition hover:shadow-lg">
                    <h3 className="text-lg font-extrabold text-primary group-hover:text-primary-glow">{lang === "ar" ? c.title_ar : c.title_en}</h3>
                    <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {c.event_date} {c.event_time && `• ${c.event_time}`}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {c.location || c.city || c.governorate}</div>
                      <div className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" /> {filled}/{needed}</div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-accent">{remaining} {lang === "ar" ? "مقعد متبقٍ" : "slots remaining"}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-primary">
                      {lang === "ar" ? "تقدّم بطلب" : "Apply"} <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Campaigns;
