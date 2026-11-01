import { Droplets, Shirt, Truck, MapPin, Clock, HeartHandshake, type LucideIcon } from "lucide-react";
import { CampaignLandingShell } from "@/components/sections/CampaignLandingShell";
import { HadithBlock, HADITH } from "@/components/campaigns/HadithBlock";
import { ProjectKindNote } from "@/components/campaigns/ProjectKind";
import { useLang } from "@/i18n/LangContext";
import takrimVan from "@/assets/takrim-van.jpg";

const DONATE = "/donate?project=takrim";

const SERVICES: { icon: LucideIcon; ar: string; en: string; bodyAr: string; bodyEn: string }[] = [
  {
    icon: Droplets,
    ar: "غسل الميت على السنة",
    en: "Washing the deceased per the Sunnah",
    bodyAr:
      "فريق مدرّب على غسل الميت بالطريقة الشرعية، بستر واحترام كامل لحرمة المتوفى ولمشاعر أهله. بنوفّر مستلزمات الغسل كاملة، ونراعي إن الرجل يغسّله رجال والمرأة تغسّلها نساء.",
    bodyEn:
      "A trained team washes the deceased according to the Sunnah, with full dignity for the departed and care for the family. We supply the complete washing kit, and men are washed by men and women by women.",
  },
  {
    icon: Shirt,
    ar: "التكفين الشرعي",
    en: "Islamic shrouding",
    bodyAr:
      "كفن شرعي نظيف ومستلزماته (الأقمشة، الحنوط، الأربطة) يتجهّز بسرعة، علشان الأسرة ما تتلخبطش في لحظة صعبة وتدوّر على كل حاجة لوحدها.",
    bodyEn:
      "A clean Islamic shroud with its supplies (cloth, perfume, ties) prepared quickly, so the family is not left searching for everything at a painful moment.",
  },
  {
    icon: Truck,
    ar: "سيارات نقل الموتى داخل المنصورة",
    en: "Funeral vans inside Mansoura",
    bodyAr:
      "سيارات تكريم الإنسان المجهّزة بتنقل المتوفى من البيت أو المستشفى للمسجد وللمقابر داخل مدينة المنصورة، بهدوء ووقار ومن غير ما الأسرة تشيل هم المواصلات.",
    bodyEn:
      "Equipped Takrim vans carry the deceased from home or hospital to the mosque and the cemetery inside Mansoura, calmly and with dignity, so the family need not worry about transport.",
  },
];

const PHASES = [
  { ar: "المرحلة الحالية: المنصورة", en: "Now: Mansoura", bodyAr: "غسل وتكفين ونقل الموتى داخل مدينة المنصورة بمحافظة الدقهلية.", bodyEn: "Washing, shrouding and funeral transport inside Mansoura, Dakahlia.", now: true },
  { ar: "المرحلة القادمة: القاهرة", en: "Next: Cairo", bodyAr: "التوسّع بالخدمة وبسيارات تكريم الإنسان إلى القاهرة، وكل سهم بتتبرع بيه بيقرّب الخطوة دي.", bodyEn: "Extending the service and the Takrim vans to Cairo. Every share you give brings this step closer.", now: false },
];

const TakrimBody = () => {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <div className="space-y-12">
      {/* Services in detail */}
      <div>
        <h2 className="text-center text-2xl font-black text-primary md:text-3xl">
          {isAr ? "خدمات تكريم الإنسان: غسل وتكفين ونقل الموتى في المنصورة" : "Takrim services: washing, shrouding and funeral transport in Mansoura"}
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-sm leading-loose text-muted-foreground sm:text-base">
          {isAr
            ? "لحظة الوفاة من أصعب اللحظات على أي أسرة، وكتير من الأسر في المنصورة مش عارفة تلاقي مين يغسّل ويكفّن، أو مش قادرة على تكلفة عربية نقل الموتى. مشروع تكريم الإنسان من مؤسسة اليسر بيشيل الحمل ده عن الأسرة: من الغسل والتكفين لحد ما الجثمان يوصل للمسجد ويتدفن، وبدون مقابل للأسر غير القادرة."
            : "A death is among the hardest moments for any family, and many families in Mansoura cannot find someone to wash and shroud, or cannot afford a funeral van. Al-Yusr's Takrim project carries that load for them, from washing and shrouding until the deceased reaches the mosque and is buried, free of charge for families who cannot pay."}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {SERVICES.map(({ icon: Icon, ar, en, bodyAr, bodyEn }) => (
            <article key={en} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-black text-primary">{isAr ? ar : en}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isAr ? bodyAr : bodyEn}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Coverage roadmap */}
      <div>
        <h2 className="text-center text-2xl font-black text-primary md:text-3xl">{isAr ? "نطاق الخدمة: من المنصورة إلى القاهرة" : "Coverage: from Mansoura to Cairo"}</h2>
        <ol className="relative mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          {PHASES.map((ph) => (
            <li key={ph.en} className={`rounded-3xl border p-6 ${ph.now ? "border-secondary bg-secondary/10" : "border-dashed border-border bg-card"}`}>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${ph.now ? "bg-secondary text-slate-950" : "bg-muted text-muted-foreground"}`}>
                {ph.now ? <MapPin className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                {ph.now ? (isAr ? "متاحة الآن" : "Available now") : (isAr ? "قريبًا" : "Coming next")}
              </span>
              <h3 className="mt-3 text-xl font-black text-primary">{isAr ? ph.ar : ph.en}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{isAr ? ph.bodyAr : ph.bodyEn}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Hadith: the qirat of following a funeral */}
      <div className="overflow-hidden rounded-3xl border border-border">
        <HadithBlock hadith={HADITH.takrim} tone="light" label={isAr ? "فضل اتّباع الجنازة" : "The reward of following a funeral"} />
      </div>

      <div className="flex items-start gap-3 rounded-3xl bg-primary p-6 text-primary-foreground">
        <HeartHandshake className="mt-1 h-6 w-6 shrink-0 text-secondary" />
        <p className="text-sm leading-loose sm:text-base">
          {isAr
            ? "لما تتبرع لتكريم الإنسان، بتشارك في كل جنازة بتخرج بكرامة: في الغسل والكفن وفي الطريق للمسجد والمقابر. صدقة عن نفسك أو عن روح حد غالي عليك، وأجرها بيوصل مع كل أسرة اتيسّر عليها الحمل."
            : "When you give to Takrim, you take part in every funeral that leaves with dignity: the washing, the shroud and the journey to the mosque and the grave. Give it for yourself or for a loved one who has passed."}
        </p>
      </div>

      <ProjectKindNote
        kinds={["impact"]}
        noteAr="تكريم الإنسان مشروع أثر مجتمعي: هدفه تيسير نقل الموتى وتكريمهم ومساندة الأسر وقت الاحتياج، مش تحقيق دخل."
        noteEn="Takrim is a community-impact project: its aim is dignified funeral transport and standing with families in need, not income."
      />
    </div>
  );
};

const TakrimLanding = () => (
  <CampaignLandingShell
    slug="takrim"
    path="/takrim"
    crumbParent={{ ar: "مشاريعنا", en: "Our projects", href: "/projects" }}
    badgeAr="خدمة إنسانية · المنصورة والقاهرة قريبًا"
    badgeEn="Humanitarian service · Mansoura, Cairo next"
    titleAr="تكريم الإنسان — غسل وتكفين ونقل الموتى في المنصورة"
    titleEn="Takrim — washing, shrouding and funeral transport in Mansoura"
    taglineAr="من الغسل والكفن لحد المسجد والمقابر: فريق وسيارات مجهّزة بتكرّم المتوفى وتشيل الحمل عن أهله، بدون مقابل للأسر غير القادرة. بنخدم المنصورة دلوقتي، والمرحلة الجاية القاهرة."
    taglineEn="From washing and shrouding to the mosque and the grave: a team and equipped vans that honour the deceased and carry the load for the family, free for those who cannot pay. Serving Mansoura now, Cairo next."
    metaDescAr="خدمة غسل وتكفين الميت وسيارات نقل الموتى داخل المنصورة من مؤسسة اليسر، بدون مقابل للأسر غير القادرة، والمرحلة القادمة القاهرة. تبرع لتكريم الإنسان صدقة جارية."
    metaDescEn="Washing, shrouding and funeral van service inside Mansoura by Al-Yusr, free for families in need, expanding to Cairo next. Support Takrim as ongoing charity."
    seo={{
      title: { ar: "غسل وتكفين ونقل الموتى في المنصورة | تكريم الإنسان — مؤسسة اليسر", en: "Funeral washing, shrouding & vans in Mansoura | Takrim — Al-Yusr" },
    }}
    heroImage={takrimVan}
    heroAlt="سيارة تكريم الإنسان لنقل الموتى في المنصورة من مؤسسة اليسر"
    pillars={[
      { titleAr: "كرامة المتوفى أولًا", titleEn: "Dignity first", descAr: "ستر واحترام في الغسل والتكفين والنقل، زي ما نحب نتعامل مع أهلنا.", descEn: "Discretion and respect in washing, shrouding and transport, as we would want for our own." },
      { titleAr: "راحة لأهل المتوفى", titleEn: "Relief for the family", descAr: "الأسرة ما تشيلش هم المستلزمات ولا المواصلات في لحظة الحزن.", descEn: "The family does not have to worry about supplies or transport while grieving." },
      { titleAr: "للأسر غير القادرة بدون مقابل", titleEn: "Free for families in need", descAr: "تبرعاتكم بتغطي الوقود والصيانة والأكفان، علشان الخدمة توصل لكل محتاج.", descEn: "Your gifts cover fuel, maintenance and shrouds so the service reaches everyone in need." },
    ]}
    steps={[
      { titleAr: "اتصال أو واتساب", titleEn: "Call or WhatsApp", descAr: "أهل المتوفى بيتواصلوا مع اليسر ويبلغوا بالمكان ووقت الصلاة.", descEn: "The family contacts Al-Yusr with the location and prayer time." },
      { titleAr: "الغسل والتكفين", titleEn: "Washing and shrouding", descAr: "الفريق بيوصل بالمستلزمات ويغسّل ويكفّن على السنة.", descEn: "The team arrives with supplies and washes and shrouds per the Sunnah." },
      { titleAr: "النقل للمسجد", titleEn: "To the mosque", descAr: "سيارة تكريم الإنسان بتنقل الجثمان للمسجد لصلاة الجنازة.", descEn: "The Takrim van carries the deceased to the mosque for the funeral prayer." },
      { titleAr: "إلى المقابر", titleEn: "To the cemetery", descAr: "ومن المسجد للمقابر، لحد ما يتم الدفن بهدوء ووقار.", descEn: "Then on to the cemetery until burial is complete, calmly and with dignity." },
    ]}
    body={<TakrimBody />}
    relatedLinks={[
      { href: "/projects", ar: "كل مشاريع اليسر", en: "All projects" },
      { href: "/water", ar: "مشروع سقيا الماء", en: "Clean water project" },
      { href: "/nurseries", ar: "حضانات اليسر ودور التحفيظ", en: "Nurseries & Qur'an houses" },
      { href: "/trust", ar: "الشفافية والتقارير", en: "Trust & reports" },
    ]}
    faq={{
      ar: [
        { q: "إزاي أطلب سيارة نقل موتى في المنصورة من اليسر؟", a: "تواصل معانا على واتساب أو تليفون المؤسسة، وبلّغ بمكان المتوفى ووقت صلاة الجنازة، والفريق بينسّق معاك فورًا." },
        { q: "هل خدمة الغسل والتكفين ونقل الموتى مجانية؟", a: "الخدمة بدون مقابل للأسر غير القادرة، وتكلفتها بتتغطى من تبرعات مشروع تكريم الإنسان." },
        { q: "إيه المناطق اللي بتخدموها؟", a: "حاليًا داخل مدينة المنصورة بمحافظة الدقهلية، والمرحلة القادمة التوسع في القاهرة." },
        { q: "مين بيغسّل المتوفى؟", a: "فريق مدرّب على الغسل الشرعي، والرجل يغسّله رجال والمرأة تغسّلها نساء، بستر واحترام كامل." },
        { q: "إزاي أساهم في المشروع؟", a: "تقدر تتبرع بسهم وقود وصيانة، أو كفن ومستلزمات غسل، أو تكفل رحلة نقل كاملة، من صفحة التبرع." },
        { q: "إيه فضل المشاركة في الجنازة؟", a: "قال ﷺ: «من شهد الجنازة حتى يُصلّى عليها فله قيراط، ومن شهدها حتى تُدفن كان له قيراطان»، قيل: وما القيراطان؟ قال: «مثل الجبلين العظيمين». متفق عليه." },
      ],
      en: [
        { q: "How do I request a funeral van in Mansoura?", a: "Contact us on WhatsApp or by phone with the location and prayer time; the team coordinates right away." },
        { q: "Is the service free?", a: "It is free for families who cannot pay; costs are covered by donations to the Takrim project." },
        { q: "Which areas do you cover?", a: "Inside Mansoura, Dakahlia for now, with Cairo as the next phase." },
        { q: "Who washes the deceased?", a: "A team trained in Islamic washing; men are washed by men and women by women." },
        { q: "How can I help?", a: "Give a fuel and maintenance share, a shroud and washing kit, or sponsor a full transport trip from the donation page." },
        { q: "What is the reward of attending a funeral?", a: "The Prophet ﷺ said whoever attends until the prayer gets one qirat, and until burial two qirats, each like a great mountain (Bukhari & Muslim)." },
      ],
    }}
    donateHref={DONATE}
    donateLabelAr="تبرع لتكريم الإنسان"
    donateLabelEn="Support Takrim"
    bottomCtaAr="شارك في تكريم كل إنسان في آخر طريقه"
    bottomCtaEn="Help honour every person at the end of their journey"
  />
);

export default TakrimLanding;
