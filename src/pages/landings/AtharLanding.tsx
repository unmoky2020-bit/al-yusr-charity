import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Plus, Heart, BookOpen } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { amountHref, waHref, fmtNum, CampaignCrumbs, HeroActions, BentoGallery } from "@/components/campaigns/shared";
import { HadithBlock, type Hadith } from "@/components/campaigns/HadithBlock";
import { WhatsAppIcon } from "@/components/common/icons/WhatsAppIcon";
import { useCampaignPage } from "@/hooks/useCampaignPage";
import ATHAR_DEFAULTS from "@/data/campaignPages/athar";
import posterEdu from "@/assets/poster-education.png";

import { campaignDonateHref } from "@/data/campaignPages/index";
const DONATE = campaignDonateHref("athar");

/** Price ids rendered by the kit builder, in display order (content: `src/data/campaignPages/athar.ts`). */
const KIT_IDS = ["bag", "uniform", "tuition"] as const;
/** Price ids of the three package cards under the kit builder. */
const PACKAGE_IDS = ["full", "nursery_share", "classroom"] as const;
/** Price ids of the dedication cards (ongoing charity in a loved one's name). */
const DEDICATE_IDS = ["dedicate_student", "dedicate_nursery"] as const;
/** Open / in-preparation flag per nursery item id (kept in code; the dashboard edits the names). */
const NURSERY_LIVE: Record<string, boolean> = { abu_bakr: true, farouq_omar: true, athar: false };

const AtharHero = () => {
  const { c, t, isAr, images } = useCampaignPage("athar", ATHAR_DEFAULTS);
  const heroImg = images("hero")[0];
  return (
    <section className="athar-paper relative overflow-hidden text-foreground">
      <div className="container relative mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-24 md:pt-14">
        <CampaignCrumbs isAr={isAr} name={isAr ? "حملة أَثَر" : "Athar"} className="text-primary/80" />
        <div className="mt-10 grid items-center gap-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="text-center md:text-start">
            <p className="text-sm font-black text-accent">{t(c.hero.eyebrow)}</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.35] text-primary sm:text-5xl lg:text-6xl">
              <span className="athar-mark">{t(c.hero.title)}</span>{" "}
              <span className="mt-2 block text-3xl sm:text-4xl lg:text-5xl">{t(c.hero.title2)}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.9] text-foreground/80 md:mx-0 md:text-lg">{t(c.hero.lead)}</p>
            <HeroActions isAr={isAr} donateHref={DONATE} donateLabel={t(c.hero.donateLabel)} wa={waHref(isAr, "حملة أثر", "the Athar campaign")} tone="light" className="mt-8 justify-center md:justify-start" />
          </div>
          <figure className="athar-photo relative mx-auto w-full max-w-sm">
            <span aria-hidden className="athar-tape absolute -top-3 start-8 z-10 h-7 w-24 -rotate-6" />
            <span aria-hidden className="athar-tape absolute -bottom-3 end-8 z-10 h-7 w-24 rotate-3" />
            <img src={heroImg?.src ?? posterEdu} alt={heroImg ? (isAr ? heroImg.altAr : heroImg.altEn) : ""} loading="eager" className="w-full rounded-md bg-card object-cover p-3 shadow-card" />
          </figure>
        </div>
      </div>
    </section>
  );
};

const AtharMain = () => {
  const { c, t, isAr, price, amount, section, images } = useCampaignPage("athar", ATHAR_DEFAULTS);
  const galleryImgs = images("gallery");
  const [picked, setPicked] = useState<Record<string, boolean>>({ bag: true, uniform: true, tuition: false });
  const [students, setStudents] = useState(1);
  const perStudent = useMemo(() => KIT_IDS.reduce((s, id) => s + (picked[id] ? amount(id) : 0), 0), [picked, amount]);
  const total = perStudent * students;

  const hadith: Hadith = { ar: c.hadith.text.ar, en: c.hadith.text.en, sourceAr: c.hadith.source.ar, sourceEn: c.hadith.source.en };
  const kit = section("kit");
  const pages = section("pages");
  const note = section("note");
  const noteItem = note?.items[0];
  const nurseries = section("nurseries");
  const books = section("books");
  const dedicate = section("dedicate");
  const year = section("year");
  const gallery = section("gallery");

  return (
    <>
      {/* Kit builder */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <p className="text-sm font-black text-accent">{isAr ? "جهّز شنطة طالب" : "Pack a student's bag"}</p>
          <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(kit?.title)}</h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <fieldset className="athar-sheet rounded-2xl border border-border p-6 sm:p-8">
              <legend className="sr-only">{isAr ? "مستلزمات الطالب" : "Student needs"}</legend>
              <ul className="space-y-1">
                {KIT_IDS.map((id) => {
                  const k = price(id);
                  if (!k) return null;
                  const on = !!picked[id];
                  return (
                    <li key={id}>
                      <label className="flex min-h-[64px] cursor-pointer items-center gap-4 rounded-lg px-2 transition-colors hover:bg-primary/[0.03]">
                        <input type="checkbox" checked={on} onChange={(e) => setPicked((p) => ({ ...p, [id]: e.target.checked }))} className="peer sr-only" />
                        <span aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 ${on ? "border-primary bg-primary text-secondary" : "border-primary/40 bg-card"}`}>
                          {on && <Check className="h-4 w-4" strokeWidth={3} />}
                        </span>
                        <span className={`flex-1 text-base font-bold sm:text-lg ${on ? "text-primary" : "text-foreground/70"}`}>{t(k.label)}</span>
                        <span className="font-mono text-base font-black tabular-nums text-primary sm:text-lg">{fmtNum(k.amount, isAr)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div className="rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-primary-foreground/80">{isAr ? "عدد الطلاب" : "Students"}</span>
                <div className="flex items-center gap-1 rounded-xl bg-primary-foreground/10 p-1">
                  <button type="button" aria-label={isAr ? "طالب أقل" : "Fewer"} onClick={() => setStudents((n) => Math.max(1, n - 1))} disabled={students <= 1} className="grid h-10 w-10 place-items-center rounded-lg transition-colors hover:bg-primary-foreground/15 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    <Minus className="h-4 w-4" />
                  </button>
                  <output className="w-10 text-center font-mono text-lg font-black tabular-nums" aria-live="polite">{fmtNum(students, isAr)}</output>
                  <button type="button" aria-label={isAr ? "طالب أكثر" : "More"} onClick={() => setStudents((n) => Math.min(50, n + 1))} className="grid h-10 w-10 place-items-center rounded-lg transition-colors hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-6 border-t border-dashed border-primary-foreground/25 pt-6">
                <div className="text-sm font-bold text-primary-foreground/75">{isAr ? "الإجمالي" : "Total"}</div>
                <div className="mt-1 text-4xl font-black tabular-nums text-secondary" aria-live="polite">
                  {fmtNum(total, isAr)} <span className="text-lg">{isAr ? "جنيه" : "EGP"}</span>
                </div>
              </div>
              <Link
                to={total > 0 ? amountHref(DONATE, total) : DONATE}
                aria-disabled={total === 0}
                className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-grad text-base font-black text-accent-foreground shadow-cta transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary ${total === 0 ? "pointer-events-none opacity-50" : ""}`}
              >
                <Heart className="h-5 w-5" /> {isAr ? "جهّز الشنطة وتبرّع" : "Pack it and donate"}
              </Link>
              {total === 0 && <p className="mt-2 text-center text-xs text-primary-foreground/70">{isAr ? "اختر بنداً واحداً على الأقل" : "Pick at least one item"}</p>}
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {PACKAGE_IDS.map((id) => {
              const p = price(id);
              if (!p) return null;
              return (
                <Link key={id} to={amountHref(DONATE, p.amount)} className="rounded-xl border-2 border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="text-sm font-bold text-muted-foreground">{t(p.note)}</div>
                  <div className="mt-1 font-black text-primary">{t(p.label)}</div>
                  <div className="mt-2 text-2xl font-black tabular-nums text-accent">{fmtNum(p.amount, isAr)} <span className="text-sm font-bold text-muted-foreground">{isAr ? "جنيه" : "EGP"}</span></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notebook page: the five ways */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <div>
              <h2 className="text-3xl font-black text-primary md:text-4xl">{t(pages?.title)}</h2>
              <p className="mt-4 text-base leading-relaxed text-foreground/75">{t(pages?.lead)}</p>
            </div>
            <ol className="athar-sheet athar-margin rounded-2xl border border-border">
              {(pages?.items ?? []).map((pg, i) => (
                <li key={pg.id} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-b border-dashed border-primary/15 px-5 py-5 last:border-0 sm:px-7">
                  <span className="font-mono text-2xl font-black tabular-nums text-accent">{fmtNum(i + 1, isAr)}</span>
                  <div>
                    <h3 className="text-lg font-black text-primary">{t(pg.title)}</h3>
                    <p className="mt-1 text-sm leading-[1.8] text-foreground/75 sm:text-base">{t(pg.desc)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Inherited impact + nurseries */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div className="athar-book relative mx-auto w-full max-w-md rounded-e-2xl rounded-s-md border border-border bg-card p-8 shadow-card sm:p-10">
            <BookOpen className="h-6 w-6 text-accent" aria-hidden />
            <p className="mt-4 text-xs font-bold text-muted-foreground">{t(noteItem?.title)}</p>
            <p className="athar-hand mt-4 text-xl leading-[2] text-primary">{t(noteItem?.desc)}</p>
          </div>
          <div>
            <p className="text-sm font-black text-accent">{isAr ? "مبادرة «أثر يتوارث»" : "“Inherited Impact”"}</p>
            <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(note?.title)}</h2>
            <p className="mt-4 max-w-[55ch] text-base leading-[1.9] text-foreground/80">{t(note?.lead)}</p>
            <h3 className="mt-10 text-lg font-black text-primary">{t(nurseries?.title)}</h3>
            <ul className="mt-4 space-y-2">
              {(nurseries?.items ?? []).map((n) => {
                const live = !!NURSERY_LIVE[n.id];
                return (
                  <li key={n.id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
                    <span className="font-bold text-primary">{t(n.title)}</span>
                    <span className={`rounded-md px-2.5 py-1 text-xs font-black ${live ? "bg-secondary/25 text-primary" : "bg-accent/15 text-accent"}`}>
                      {live ? (isAr ? "تعمل" : "Open") : (isAr ? "جاري التجهيز" : "In preparation")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <HadithBlock hadith={hadith} tone="paper" label={isAr ? "العلم صدقة جارية" : "Knowledge is ongoing charity"} />

      {/* Donate your books */}
      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <p className="text-sm font-black text-accent">{isAr ? "شارك بكتبك" : "Give your books"}</p>
          <h2 className="mt-2 text-3xl font-black text-primary md:text-4xl">{t(books?.title)}</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {(books?.items ?? []).map((st, i) => (
              <li key={st.id} className="athar-sheet rounded-2xl border border-border p-6">
                <span className="font-mono text-3xl font-black tabular-nums text-accent">{fmtNum(i + 1, isAr)}</span>
                <h3 className="mt-3 text-lg font-black text-primary">{t(st.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{t(st.desc)}</p>
              </li>
            ))}
          </ol>
          <a href={waHref(isAr, "التبرع بكتب دراسية لمبادرة أثر يتوارث", "donating textbooks to Inherited Impact")} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl border-2 border-primary px-6 font-black text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <WhatsAppIcon className="h-5 w-5" /> {isAr ? "أتبرع بكتبي" : "I'll give my books"}
          </a>
        </div>
      </section>

      {/* Ongoing charity through knowledge */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div>
            <p className="text-sm font-black text-secondary">{isAr ? "صدقة جارية بالعلم" : "Ongoing charity through knowledge"}</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">{t(dedicate?.title)}</h2>
            <p className="mt-4 max-w-[55ch] text-base leading-[1.9] text-primary-foreground/85">{t(dedicate?.lead)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DEDICATE_IDS.map((id) => {
              const o = price(id);
              if (!o) return null;
              return (
                <Link key={id} to={amountHref(DONATE, o.amount)} className="rounded-xl bg-primary-foreground/[0.07] p-5 transition-colors hover:bg-primary-foreground/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                  <span className="block text-sm font-bold text-primary-foreground/75">{t(o.label)}</span>
                  <span className="mt-1 block text-3xl font-black tabular-nums text-secondary">{fmtNum(o.amount, isAr)} <span className="text-sm">{isAr ? "جنيه" : "EGP"}</span></span>
                </Link>
              );
            })}
            <a href={waHref(isAr, "كفالة تعليمية صدقة جارية عن متوفى", "a dedicated education sponsorship")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 text-sm font-black text-secondary underline underline-offset-4 hover:text-primary-foreground sm:col-span-2">
              <WhatsAppIcon className="h-4 w-4" /> {isAr ? "أرسل لنا اسم من تنوي عنه" : "Send us the name to dedicate it"}
            </a>
          </div>
        </div>
      </section>

      {/* School year */}
      <section className="bg-muted/50 py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(year?.title)}</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {(year?.items ?? []).map((y) => (
              <li key={y.id} className="rounded-2xl bg-card p-6">
                <span className="inline-block rounded-md bg-primary px-2.5 py-1 text-xs font-black text-secondary">{t(y.extra)}</span>
                <h3 className="mt-4 text-lg font-black text-primary">{t(y.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/75 sm:text-base">{t(y.desc)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-background py-16 md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-primary md:text-4xl">{t(gallery?.title)}</h2>
          <div className="mt-8"><BentoGallery items={galleryImgs} isAr={isAr} /></div>
        </div>
      </section>
    </>
  );
};

const AtharLanding = () => {
  const { c, section, images } = useCampaignPage("athar", ATHAR_DEFAULTS);
  const page = section("page");
  return (
    <CampaignLandingShell
      slug="athar"
      seo={c.seo}
      path="/athar"
      titleAr={page?.title.ar ?? ""}
      titleEn={page?.title.en ?? ""}
      taglineAr={page?.lead?.ar ?? ""}
      taglineEn={page?.lead?.en ?? ""}
      metaDescAr="شارك في حملة أَثَر التعليمية مع مؤسسة اليسر: شنط وأدوات مدرسية، زي مدرسي، سداد مصروفات، مبادرة تدوير الكتب 'أثر يتوارث'، ودور تحفيظ القرآن وحضانات نموذجية بالدقهلية."
      metaDescEn="Join Al-Yusr's Athar Education Campaign: school bags, supplies, uniforms, tuition sponsorship, textbook recycling, and Quranic pre-schools across Dakahlia, Egypt."
      heroImage={images("hero")[0]?.src ?? posterEdu}
      heroAlt="حملة أثر التعليمية - شنط وأدوات مدرسية وكفالة مصاريف للطلاب المستحقين"
      hero={<AtharHero />}
      main={<AtharMain />}
      relatedLinks={[
        { href: "/markoun", ar: "حملة مَرْكون (الأثاث والكتب)", en: "Markoun campaign" },
        { href: "/setr", ar: "حملة سِتر (تسقيف الشتاء والكسوة)", en: "Setr campaign" },
        { href: "/dhill", ar: "حملة ظِلّ (سقيا الماء وبرودة الصيف)", en: "Dhill campaign" },
        { href: "/trust", ar: "الشفافية والتقارير الميدانية", en: "Trust & reports" },
      ]}
      faq={{
        ar: c.faq.map((f) => ({ q: f.q.ar, a: f.a.ar })),
        en: c.faq.map((f) => ({ q: f.q.en, a: f.a.en })),
      }}
      donateHref={DONATE}
      donateLabelAr={c.hero.donateLabel.ar}
      donateLabelEn={c.hero.donateLabel.en}
      bottomCtaAr={c.cta.title.ar}
      bottomCtaEn={c.cta.title.en}
      bottomSubAr={c.cta.sub.ar}
      bottomSubEn={c.cta.sub.en}
    />
  );
};

export default AtharLanding;
