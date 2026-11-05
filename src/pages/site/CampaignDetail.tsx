import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, MapPin, Users2, ArrowLeft, Check } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/auth/AuthContext";
import { Campaign, getCampaignBySlug, submitApplication } from "@/data/campaignsApi";
import { toast } from "@/hooks/use-toast";
import { getProgram } from "@/data/programs";

const CampaignDetail = () => {
  const { lang } = useLang();
  const { slug } = useParams();
  const { user } = useAuth();
  const [c, setC] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", city: "", skills: "", notes: "" });

  useEffect(() => {
    if (!slug) return;
    getCampaignBySlug(slug).then(setC).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: f.full_name || user.name || "", email: f.email || user.email || "" }));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c) return;
    if (!/^01\d{9}$/.test(form.phone.trim())) {
      toast({ title: lang === "ar" ? "رقم هاتف غير صحيح" : "Invalid phone", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await submitApplication({
        campaign_id: c.id,
        volunteer_id: user?.id || null,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        city: form.city.trim() || null,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        notes: form.notes.trim() || null,
        status: "pending",
      });
      setDone(true);
      toast({ title: lang === "ar" ? " تم استلام طلبك" : " Application received" });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) return <PageLayout><div className="grid min-h-[40vh] place-items-center text-muted-foreground">…</div></PageLayout>;
  if (!c) return (
    <PageLayout>
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-primary">{lang === "ar" ? "الحملة غير موجودة" : "Campaign not found"}</h1>
        <Link to="/campaigns" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent">
          <ArrowLeft className="h-4 w-4" /> {lang === "ar" ? "العودة للحملات" : "Back to campaigns"}
        </Link>
      </div>
    </PageLayout>
  );

  const needed = Number(c.slots_needed) || 30;
  const filled = Number(c.slots_filled) || 0;
  const remaining = Math.max(0, needed - filled);
  const pct = needed > 0 ? Math.min(100, Math.round((filled / needed) * 100)) : 0;
  const closed = c.status !== "open" || remaining === 0;
  const title = (lang === "ar" ? c.title_ar : c.title_en) || c.title_ar || c.title_en || (lang === "ar" ? "حملة تطوع" : "Volunteer Campaign");
  const desc = (lang === "ar" ? c.description_ar : c.description_en) || c.description_ar || c.description_en || "";
  // If this campaign mirrors a program slug (e.g. "markoun"), surface its
  // poster gallery so the campaign page reflects the parent program visuals.
  const linkedProgram = getProgram(c.slug);
  const gallery = linkedProgram?.gallery ?? [];
  const heroImage = gallery[0] || linkedProgram?.image;

  return (
    <PageLayout>
      <SEOHelmet
        title={`${title} | ${lang === "ar" ? "حملة تطوع" : "Volunteer campaign"}`}
        description={(desc || "").slice(0, 160)}
        path={`/campaigns/${c.slug}`}
        image={heroImage}
      />
      <section className="pattern-hero-luxe hero-pattern-fade text-primary-foreground">
        <div className="container mx-auto max-w-4xl px-4 py-10 md:py-14">
          <div className="text-primary-foreground/85"><Breadcrumbs items={[
            { name: lang === "ar" ? "الرئيسية" : "Home", href: "/" },
            { name: lang === "ar" ? "حملات التطوع" : "Campaigns", href: "/campaigns" },
            { name: title },
          ]} /></div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">{title}</h1>
        </div>
      </section>
      <section className="bg-background pt-10 pb-28 sm:pb-36 md:pt-14 md:pb-44">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
            <article className="rounded-3xl bg-card p-6 shadow-card md:p-8">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {c.event_date} {c.event_time && `• ${c.event_time}`}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {c.location || c.city || c.governorate}</span>
                <span className="flex items-center gap-1.5"><Users2 className="h-4 w-4" /> {c.slots_filled}/{c.slots_needed}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-to-r from-primary to-primary-glow" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-accent">{remaining} {lang === "ar" ? "مقعد متبقٍ" : "slots remaining"}</p>
              {desc && <p className="mt-5 whitespace-pre-line text-sm leading-7 text-foreground/90">{desc}</p>}
              {linkedProgram && (
                <div className="mt-5 rounded-2xl border border-primary/15 bg-muted/40 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-accent">
                    {lang === "ar" ? "البرنامج الأم" : "Parent program"}
                  </p>
                  <Link
                    to={`/programs/${linkedProgram.slug}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm font-extrabold text-primary hover:underline"
                  >
                    {linkedProgram[lang].name}
                    <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    {lang === "ar"
                      ? "هذه الحملة فرع تطوعي تابع للبرنامج، ومنها تنبثق المشاريع الميدانية لاستلام التبرعات العينية وتسليمها للأسر."
                      : "This campaign is a volunteer-facing branch of the program above; the field projects for collecting and delivering in-kind donations spin off from it."}
                  </p>
                </div>
              )}
              {gallery.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-extrabold text-primary">
                    {lang === "ar" ? "بوسترات الحملة" : "Campaign posters"}
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {gallery.map((src, i) => (
                      <div key={i} className="overflow-hidden rounded-xl bg-muted shadow-soft">
                        <img
                          src={src}
                          alt={`${title} — ${i + 1}`}
                          loading="lazy"
                          className="block h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {c.required_skills && c.required_skills.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-extrabold text-primary">{lang === "ar" ? "المهارات المطلوبة" : "Required skills"}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.required_skills.map((s) => <span key={s} className="rounded-full bg-secondary/30 px-3 py-1 text-xs font-bold text-primary">{s}</span>)}
                  </div>
                </div>
              )}
            </article>

            <aside className="rounded-3xl bg-card p-6 shadow-card md:p-8">
              <h2 className="text-lg font-black text-primary">{lang === "ar" ? "تقدّم بطلب التطوع" : "Apply to volunteer"}</h2>
              {done ? (
                <div className="mt-6 rounded-2xl bg-emerald-500/10 p-6 text-center">
                  <Check className="mx-auto h-10 w-10 text-emerald-600" />
                  <p className="mt-2 font-extrabold text-emerald-700">{lang === "ar" ? "وصلنا طلبك! سنتواصل معك قريبًا." : "We received your application!"}</p>
                </div>
              ) : closed ? (
                <p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">{lang === "ar" ? "هذه الحملة مغلقة حاليًا." : "This campaign is currently closed."}</p>
              ) : (
                <form onSubmit={submit} className="mt-4 space-y-3">
                  <Input required placeholder={lang === "ar" ? "الاسم الكامل" : "Full name"} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  <Input required dir="ltr" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <Input type="email" placeholder={lang === "ar" ? "البريد (اختياري)" : "Email (optional)"} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <Input placeholder={lang === "ar" ? "المدينة" : "City"} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  <Input placeholder={lang === "ar" ? "مهاراتك (مفصولة بفاصلة)" : "Your skills (comma separated)"} value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                  <textarea className="min-h-[80px] w-full rounded-md border border-input bg-background p-3 text-sm" placeholder={lang === "ar" ? "ملاحظات" : "Notes"} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  <Button type="submit" disabled={submitting} className="h-12 w-full bg-orange-grad font-extrabold text-accent-foreground">
                    {submitting ? (lang === "ar" ? "جارٍ الإرسال…" : "Sending…") : (lang === "ar" ? "أرسل الطلب" : "Submit application")}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">{lang === "ar" ? "سيتواصل معك فريقنا للتأكيد." : "Our team will contact you to confirm."}</p>
                </form>
              )}
            </aside>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default CampaignDetail;
