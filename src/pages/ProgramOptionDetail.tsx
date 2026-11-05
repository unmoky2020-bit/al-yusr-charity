import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Heart, Loader2, ShieldCheck, Camera, Truck, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { LinkedCasesSection } from "@/components/cases/LinkedCasesSection";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useLang } from "@/i18n/LangContext";
import { usePrograms } from "@/data/sources/programs";
import { track } from "@/lib/track";
import { RelatedContentLinks } from "@/components/common/RelatedContentLinks";
import { FieldConvoysGallery } from "@/components/sections/FieldConvoysGallery";
import { StickyQurbaniCTA } from "@/components/common/StickyQurbaniCTA";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";

type Node = {
  id: string; slug: string; type: string; parent_id: string | null;
  title_ar: string; title_en: string;
  description_ar: string | null; description_en: string | null;
  image_url: string | null; amount: number | null; target_amount: number | null;
  collected_amount: number; active: boolean;
  metadata: any | null;
};

const ProgramOptionDetail = () => {
  const { slug, option } = useParams<{ slug: string; option: string }>();
  const { lang, t } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  // Auto-redirect alias parent slugs to canonical (keeps option path intact)
  const ALIAS_OF: Record<string, string> = { satr: "shelter", food: "box" };
  // Static by default; reads /programs when VITE_CONTENT_SOURCE is "api"/"auto". Called before the alias return (rules of hooks).
  // An option is one of the program's shares (backend donation_packages): /programs/{slug}/{key or id}.
  const { programs, isLoading } = usePrograms();
  const program = slug ? programs.find((p) => p.slug === slug) : undefined;
  const siblings: Node[] = (program?.packages ?? []).map((pk) => ({
    id: String(pk.id), slug: pk.slug, type: "option", parent_id: null,
    title_ar: pk.nameAr, title_en: pk.nameEn, description_ar: null, description_en: null,
    image_url: null, amount: pk.amount || null, target_amount: null, collected_amount: 0, active: true, metadata: null,
  }));
  const node = siblings.find((n) => n.slug === option || n.id === option) ?? null;
  const parent: Node | null = null;

  useEffect(() => {
    if (node) track("option_view", { fbEvent: "ViewContent", payload: { program: slug, option, source: "option-detail" } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  if (slug && ALIAS_OF[slug]) {
    return <Navigate to={`/programs/${ALIAS_OF[slug]}/${option || ""}`} replace />;
  }
  if (isLoading && !node) {
    return <PageLayout><div className="container mx-auto grid place-items-center py-24"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div></PageLayout>;
  }
  if (!node) return <Navigate to={`/programs/${slug || ""}`} replace />;

  const meta = (node.metadata || {}) as any;
  const programMeta = (parent?.metadata || {}) as any;
  const title = isRTL ? node.title_ar : (node.title_en || node.title_ar);
  const programTitle = isRTL ? (parent?.title_ar || program?.ar?.name) : (parent?.title_en || program?.en?.name || parent?.title_ar);
  const desc = (isRTL ? node.description_ar : node.description_en) || (isRTL ? `تبرع بـ ${node.amount?.toLocaleString()} جنيه — جزء من ${programTitle}.` : `Donate ${node.amount?.toLocaleString()} EGP — part of ${programTitle}.`);
  const metaTitle = (isRTL ? meta.meta_title_ar : meta.meta_title_en) || `${title} — ${programTitle} | ${isRTL ? "مؤسسة اليسر" : "Al-Yusr Charity"}`;
  const metaDesc = (isRTL ? meta.meta_desc_ar : meta.meta_desc_en) || desc;
  const ogImage = meta.og_image_url || node.image_url || parent?.image_url || program?.image;
  const path = `/programs/${slug}/${option}`;
  const baseUrl = "https://elyusr.org";
  const url = meta.canonical_url || `${baseUrl}${path}`;
  const noindex = !!meta.noindex; const nofollow = !!meta.nofollow;
  const robots = `${noindex ? "noindex" : "index"},${nofollow ? "nofollow" : "follow"}`;
  const schemaType = (meta.schema_type as string) || (node.amount ? "Product" : "Service");
  const keywords = (isRTL ? meta.keywords_ar : meta.keywords_en) || "";

  // FAQ — pipe-separated lines
  const faqLines = ((isRTL ? meta.faq_ar : meta.faq_en) || "").split("\n").map((l: string) => {
    const [q, ...rest] = l.split("|"); return { q: (q || "").trim(), a: rest.join("|").trim() };
  }).filter((x: any) => x.q && x.a);

  const donateHref = `/donate?program=${slug}&package=${node.id}`;

  // Schema
  const baseSchema: any = {
    "@context": "https://schema.org", "@type": schemaType,
    name: title, description: metaDesc,
    image: ogImage,
    provider: { "@id": `${baseUrl}/#org` },
    areaServed: { "@type": "AdministrativeArea", name: meta.geo_placename || "Dakahlia, Egypt" },
    isPartOf: { "@type": "Service", name: programTitle, url: `${baseUrl}/programs/${slug}` },
  };
  if (node.amount) {
    baseSchema.offers = { "@type": "Offer", price: node.amount, priceCurrency: "EGP", availability: "https://schema.org/InStock", url };
  }

  return (
    <PageLayout>
      <SEOHelmet title={metaTitle} description={metaDesc} path={path} image={ogImage || undefined} />
      <Helmet>
        <meta name="robots" content={robots} />
        {keywords && <meta name="keywords" content={keywords} />}
        {meta.geo_region && <meta name="geo.region" content={meta.geo_region} />}
        {meta.geo_placename && <meta name="geo.placename" content={meta.geo_placename} />}
        {meta.geo_position && <meta name="geo.position" content={meta.geo_position} />}
        {meta.geo_position && <meta name="ICBM" content={meta.geo_position.replace(";", ", ")} />}
        <meta name="twitter:card" content={meta.twitter_card || "summary_large_image"} />
        {meta.og_title_ar && isRTL && <meta property="og:title" content={meta.og_title_ar} />}
        {meta.og_title_en && !isRTL && <meta property="og:title" content={meta.og_title_en} />}
        {meta.og_desc_ar && isRTL && <meta property="og:description" content={meta.og_desc_ar} />}
        {meta.og_desc_en && !isRTL && <meta property="og:description" content={meta.og_desc_en} />}
        <link rel="canonical" href={url} />
        <script type="application/ld+json">{JSON.stringify(baseSchema)}</script>
        {faqLines.length > 0 && (
          <script type="application/ld+json">{JSON.stringify({
            "@context": "https://schema.org", "@type": "FAQPage",
            mainEntity: faqLines.map((f: any) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          })}</script>
        )}
      </Helmet>
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: t.nav.home, url: `${baseUrl}/` },
        { name: t.nav.programs, url: `${baseUrl}/#programs` },
        { name: programTitle || "", url: `${baseUrl}/programs/${slug}` },
        { name: title, url },
      ]} />

      <section className="relative -mt-px overflow-hidden pattern-hero-luxe text-primary-foreground">
        <div className="container relative mx-auto grid gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-16">
          <div className="text-center md:text-start">
            <div className="flex justify-center md:justify-start">
              <Breadcrumbs items={[
                { name: t.nav.home, href: "/" },
                { name: programTitle || "", href: `/programs/${slug}` },
                { name: title },
              ]} />
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
              <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "خيار من البرنامج" : "Program option"}
            </span>
            <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{title}</h1>
            <p className="mt-3 mx-auto md:mx-0 max-w-xl text-primary-foreground/85 md:text-lg">{desc}</p>
            {meta.ai_summary_ar && isRTL && <p className="mt-3 mx-auto md:mx-0 max-w-xl text-sm text-primary-foreground/75">{meta.ai_summary_ar}</p>}
            {meta.ai_summary_en && !isRTL && <p className="mt-3 mx-auto md:mx-0 max-w-xl text-sm text-primary-foreground/75">{meta.ai_summary_en}</p>}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {node.amount && (
                <span className="inline-flex items-center rounded-2xl bg-secondary px-4 py-2 text-base font-extrabold text-secondary-foreground shadow-cta">
                  {node.amount.toLocaleString()} EGP
                </span>
              )}
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to={donateHref} onClick={() => track("option_donate", { fbEvent: "InitiateCheckout", payload: { program: slug, option, amount: node.amount } })}>
                  <Heart className="h-5 w-5" />{isRTL ? "تبرع لهذا الجزء" : "Donate to this item"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary/50 bg-transparent text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground">
                <a href="https://wa.me/201097000137" target="_blank" rel="noopener" dir="ltr"><WhatsAppIcon className="h-5 w-5" /> WhatsApp</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary/50 bg-transparent text-primary-foreground hover:bg-secondary/20 hover:text-primary-foreground">
                <Link to={`/programs/${slug}`}><Arrow className="h-5 w-5" />{isRTL ? "كل خيارات البرنامج" : "All program options"}</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md md:max-w-full">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-secondary/25 blur-3xl" />
            <img src={ogImage || "/placeholder.svg"} alt={title} loading="eager" decoding="async"
              className="relative aspect-[4/3] w-full rounded-[2rem] object-cover shadow-card md:rounded-[2.5rem]" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-muted/30 py-10">
        <div className="container mx-auto grid max-w-5xl gap-3 px-4 sm:grid-cols-3">
          {[
            { Icon: ShieldCheck, t: isRTL ? "شفافية كاملة" : "Full transparency", d: isRTL ? "تقارير مالية مراجعة." : "Audited reports." },
            { Icon: Camera, t: isRTL ? "توثيق مصوّر" : "Photo proof", d: isRTL ? "صور وفيديو لكل تنفيذ." : "Photos & videos." },
            { Icon: Truck, t: isRTL ? "تسليم لباب البيت" : "Doorstep delivery", d: isRTL ? "بكرامة وسرعة." : "Dignified & fast." },
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft">
              <c.Icon className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
              <div><h3 className="text-sm font-extrabold text-primary">{c.t}</h3><p className="mt-0.5 text-xs text-muted-foreground">{c.d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Long content from metadata */}
      {(((isRTL ? meta.long_content_ar : meta.long_content_en) || []).length > 0) && (
        <section className="bg-background py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-primary md:text-3xl">{isRTL ? "تفاصيل الخدمة" : "Service details"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{isRTL ? `جزء من برنامج ${programTitle}` : `Part of the ${programTitle} program`}</p>
            </div>
            <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/85">
              {((isRTL ? meta.long_content_ar : meta.long_content_en) as string[]).map((p, i) => (<p key={i}>{p}</p>))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      {(((isRTL ? meta.benefits_ar : meta.benefits_en) || []).length > 0) && (
        <section className="bg-muted/20 py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
                <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "ليه تتبرع لهذا الخيار" : "Why donate to this item"}
              </span>
              <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">{isRTL ? "مزايا التبرع" : "Benefits"}</h2>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {((isRTL ? meta.benefits_ar : meta.benefits_en) as string[]).map((b, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
                  <p className="text-sm font-semibold text-foreground/90">{b}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to={donateHref}><Heart className="h-5 w-5" />{isRTL ? `تبرع الآن — ${node.amount?.toLocaleString() || ""} ج` : `Donate now${node.amount ? ` — ${node.amount.toLocaleString()} EGP` : ""}`}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Field proof gallery for Qurbani / food box options */}
      {(slug === "odhya" || slug === "box") && (
        <FieldConvoysGallery
          variant={slug === "odhya" ? "qurbani" : "all"}
          donateHref={donateHref}
          galleryKey={slug === "odhya" ? "qurbani" : "programs"}
        />
      )}

      {/* FAQ */}
      {faqLines.length > 0 && (
        <section className="bg-background py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-secondary">
                <Sparkles className="h-3.5 w-3.5" /> {isRTL ? "أسئلة شائعة" : "FAQ"}
              </span>
              <h2 className="mt-3 text-2xl font-black text-primary md:text-3xl">{isRTL ? "أسئلة قبل التبرع" : "Before you donate"}</h2>
            </div>
            <div className="mt-6 space-y-3">
              {faqLines.map((f: any, i: number) => (
                <details key={i} className="group rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <summary className="cursor-pointer text-base font-extrabold text-primary">{f.q}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sibling options */}
      {siblings.filter((s) => s.id !== node.id).length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <h2 className="text-2xl font-black text-primary md:text-3xl">{isRTL ? "خيارات أخرى في نفس البرنامج" : "Other options in this program"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{isRTL ? "اختار اللي يلمس قلبك من أجزاء البرنامج." : "Pick the part that moves your heart."}</p>
              <Link to={`/programs/${slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-accent hover:underline">
                {isRTL ? "كل الخيارات" : "All options"} <Arrow className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.filter((s) => s.id !== node.id).map((s) => {
                const stitle = isRTL ? s.title_ar : (s.title_en || s.title_ar);
                const sDonate = `/donate?program=${slug}&package=${s.id}`;
                return (
                  <div key={s.id} className="group flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-card">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-primary">{stitle}</h3>
                        {s.amount ? (
                          <span className="shrink-0 rounded-full bg-secondary/25 px-2.5 py-1 text-[11px] font-black text-primary">{s.amount.toLocaleString()} EGP</span>
                        ) : null}
                      </div>
                      {(s.description_ar || s.description_en) && (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted-foreground">{isRTL ? s.description_ar : s.description_en}</p>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="flex-1 bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                        <Link to={sDonate}><Heart className="h-4 w-4" />{isRTL ? "تبرع" : "Donate"}</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-secondary/50">
                        <Link to={`/programs/${slug}/${s.slug}`}>{isRTL ? "تفاصيل" : "Details"}</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      {slug && (
        <RelatedContentLinks programSlug={slug} optionSlug={option} />
      )}
      <StickyQurbaniCTA
        donateHref={donateHref}
        dismissKey={`option-${slug}-${option}-cta-dismissed`}
        ariaLabel={{ ar: `دعم ${title}`, en: `Support ${title}` }}
        title={{ ar: `ادعم ${title}`, en: `Support ${title}` }}
        description={{
          ar: "كل تبرع بيوصل لأسرة محتاجة موثّقة بالصور والفيديو.",
          en: "Every donation reaches a verified family with photo & video documentation.",
        }}
        ctaLabel={{ ar: "تبرع الآن", en: "Donate now" }}
        waText={isRTL ? `السلام عليكم، عايز أعرف تفاصيل ${title}.` : `Hi, I'd like details on ${title}.`}
      />
      {program?.apiId && (
        <LinkedCasesSection filter={{ programId: program.apiId }} isRTL={isRTL}
          title={isRTL ? `حالات ضمن ${program.ar.name}` : `Cases in ${program.en.name}`} />
      )}
    </PageLayout>
  );
};

export default ProgramOptionDetail;
