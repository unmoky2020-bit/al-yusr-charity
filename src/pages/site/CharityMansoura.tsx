import { Link } from "react-router-dom";
import {
  BadgeCheck, Camera, Search, MapPin, Phone, MessageCircle, Heart, ArrowLeft, ArrowRight,
  Coins, Calculator, Beef, Shirt, Baby, Droplets, ShieldCheck, Landmark,
} from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SEOHelmet } from "@/components/common/SEOHelmet";
import { SiteSchemas, BreadcrumbSchema } from "@/components/common/Schemas";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { LocalFAQ } from "@/components/common/LocalFAQ";
import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LangContext";
import heroImg from "@/assets/about-hero.jpg";

/**
 * /charity-mansoura — a visible, indexable guide for people searching for
 * «مؤسسة خيرية في المنصورة» / «جمعية خيرية في المنصورة» / «تبرع في الدقهلية».
 * Facts only from what the site already states (license, HQ address, programs).
 * Other charities are named once, neutrally, with no claims about them.
 */

const BASE = "https://elyusr.org";
const PATH = "/charity-mansoura";
const LICENSE = "2665/2019";
const PHONE = "+20 109 700 0137";
const WA_NUMBER = "201097000137";

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="grid gap-3 border-b border-border pb-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-end md:gap-10">
      <h2 className="text-balance text-3xl font-black leading-tight text-primary md:text-4xl">{title}</h2>
      {sub && <p className="max-w-md leading-relaxed text-foreground/75 md:text-lg">{sub}</p>}
    </div>
  );
}

const CharityMansoura = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  const title = isRTL
    ? "أفضل مؤسسة خيرية في المنصورة | مؤسسة اليسر الخيرية"
    : "Best charity in Mansoura, Egypt | Al-Yusr Charity Foundation";
  const description = isRTL
    ? `مؤسسة اليسر الخيرية أفضل مؤسسة خيرية مضمونة وموثوقة في المنصورة، مشهرة برقم ${LICENSE}، وتعمل في محافظات مصر. تبرع بالمال أو الزكاة أو الأضحية أو الملابس والأثاث المستعمل، مع توثيق لكل تبرع.`
    : `Al-Yusr Charity Foundation (No. ${LICENSE}) is headquartered in Mansoura and works across Egypt. Give money, zakat, qurbani or used clothes and furniture — with proof for every gift.`;

  const trust = isRTL
    ? [
        { I: BadgeCheck, t: `مشهرة برقم ${LICENSE}`, d: "مؤسسة أهلية مسجّلة لدى وزارة التضامن الاجتماعي منذ 2019." },
        { I: Search, t: "رقم تتبع لكل تبرع", d: "تتابع تبرعك من الاستلام حتى التسليم في صفحة «تتبع تبرعك»." },
        { I: Camera, t: "توثيق بالصور والفيديو", d: "دليل مرئي على وصول التبرع، مع حفظ كرامة الأسر." },
        { I: ShieldCheck, t: "توزيع معلن للتبرعات", d: "ننشر نسب ما يذهب إلى البرامج والتشغيل والإدارة في صفحة الشفافية." },
      ]
    : [
        { I: BadgeCheck, t: `Registered No. ${LICENSE}`, d: "An NGO registered with the Ministry of Social Solidarity since 2019." },
        { I: Search, t: "A tracking number per gift", d: "Follow your donation from receipt to delivery on the Track page." },
        { I: Camera, t: "Photo & video proof", d: "Visual proof of delivery, with every family's dignity protected." },
        { I: ShieldCheck, t: "Published spending split", d: "We publish how donations split between programs, operations and administration." },
      ];

  const ways = isRTL
    ? [
        { I: Coins, t: "تبرع بالمال", d: "صدقة عامة أو صدقة جارية تصل إلى الأسر المستحقة.", href: "/donate" },
        { I: Calculator, t: "زكاة المال", d: "احسب زكاتك وأخرجها إلى أسر مستحقة موثقة.", href: "/zakat" },
        { I: Beef, t: "صك أضحية", d: "أضحية تُذبح وتوزَّع على الأسر مع توثيق بالصور.", href: "/qurbani" },
        { I: Shirt, t: "ملابس وأثاث وأجهزة مستعملة", d: "حملة مَرْكون تستلم الملابس والأثاث والأجهزة من بيتك في الدقهلية.", href: "/markoun" },
        { I: Baby, t: "كفالة يتيم", d: "كفالة شهرية تغطي احتياجات اليتيم.", href: "/programs/orphans" },
        { I: Droplets, t: "وصلة مياه", d: "توصيل مياه شرب نظيفة لبيوت محرومة منها — صدقة جارية.", href: "/water" },
      ]
    : [
        { I: Coins, t: "Give money", d: "General or ongoing charity that reaches families in need.", href: "/donate" },
        { I: Calculator, t: "Zakat", d: "Calculate your zakat and give it to verified families.", href: "/zakat" },
        { I: Beef, t: "Qurbani share", d: "A sacrifice slaughtered and distributed with photo proof.", href: "/qurbani" },
        { I: Shirt, t: "Used clothes, furniture & appliances", d: "The Markoun campaign collects them from your home in Dakahlia.", href: "/markoun" },
        { I: Baby, t: "Orphan sponsorship", d: "A monthly sponsorship covering an orphan's needs.", href: "/programs/orphans" },
        { I: Droplets, t: "Water connection", d: "Clean drinking water for homes without it — ongoing charity.", href: "/water" },
      ];

  const faq = isRTL
    ? [
        { q: "هل مؤسسة اليسر الخيرية في المنصورة؟", a: "نعم، المقر الرئيسي لمؤسسة اليسر الخيرية في المنصورة، تقسيم خطاب، بجوار وكالة المنصورة، محافظة الدقهلية. وتعمل المؤسسة في محافظات مصر." },
        { q: "هل مؤسسة اليسر مرخّصة؟", a: `نعم، مؤسسة أهلية مشهرة لدى وزارة التضامن الاجتماعي برقم ${LICENSE}.` },
        { q: "هل تعمل المؤسسة في الدقهلية فقط؟", a: "لا. مقرنا في المنصورة ولنا جذور عميقة في الدقهلية، لكننا نعمل في محافظات مصر، ونقبل الحالات في أي محافظة بعد بحث ميداني." },
        { q: "أين أتبرع بالملابس المستعملة في المنصورة؟", a: "من خلال حملة مَرْكون: أرسل كلمة «تبرع» على واتساب 01097000137 مع عنوانك ونوع ما تريد التبرع به، ونتفق معك على موعد استلام مجاني داخل محافظة الدقهلية. نستقبل أيضًا الأثاث والأجهزة الكهربائية." },
        { q: "كيف أتبرع لمؤسسة اليسر؟", a: "تبرع من الموقع بالبطاقة أو المحفظة الإلكترونية، أو عبر إنستاباي أو فودافون كاش أو التحويل البنكي، أو زُر المقر في المنصورة. ويصلك رقم تتبع لكل تبرع." },
        { q: "هل يمكنني زيارة المقر في المنصورة؟", a: "نعم، أبوابنا مفتوحة للمتبرعين. ننصح بالتواصل معنا على واتساب قبل الزيارة لنستقبلك في الموعد المناسب." },
      ]
    : [
        { q: "Is Al-Yusr Charity Foundation in Mansoura?", a: "Yes. Its head office is in Mansoura (Khattab district, next to Mansoura Agency), Dakahlia, and it works across Egypt's governorates." },
        { q: "Is Al-Yusr licensed?", a: `Yes — a non-governmental foundation registered with the Ministry of Social Solidarity under No. ${LICENSE}.` },
        { q: "Does Al-Yusr work only in Dakahlia?", a: "No. We are headquartered in Mansoura with deep roots in Dakahlia, but we work across Egypt and accept cases in any governorate after a field assessment." },
        { q: "Where can I donate used clothes in Mansoura?", a: "Through the Markoun campaign: send \"donate\" on WhatsApp to 01097000137 with your address and what you want to give, and we arrange a free pickup within Dakahlia. We also accept furniture and appliances." },
        { q: "How do I donate to Al-Yusr?", a: "Give online by card or e-wallet, via InstaPay, Vodafone Cash or bank transfer, or visit our Mansoura office. Every donation gets a tracking number." },
        { q: "Can I visit the office in Mansoura?", a: "Yes, our doors are open to donors. Message us on WhatsApp before you come so we can welcome you at a suitable time." },
      ];

  return (
    <PageLayout>
      <SEOHelmet
        title={title}
        description={description}
        path={PATH}
        image={heroImg}
        keywords={isRTL
          ? "مؤسسة خيرية في المنصورة, جمعية خيرية في المنصورة, تبرع في الدقهلية, التبرع بالملابس المستعملة في المنصورة"
          : "charity in Mansoura, charity in Dakahlia, donate in Mansoura Egypt"}
      />
      <SiteSchemas />
      <BreadcrumbSchema items={[
        { name: isRTL ? "الرئيسية" : "Home", url: `${BASE}/` },
        { name: isRTL ? "مؤسسة خيرية في المنصورة" : "Charity in Mansoura", url: `${BASE}${PATH}` },
      ]} />

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <img src={heroImg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/80 to-primary" aria-hidden />
        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-14">
          <div className="text-primary-foreground/80">
            <Breadcrumbs items={[{ name: isRTL ? "الرئيسية" : "Home", href: "/" }, { name: isRTL ? "مؤسسة خيرية في المنصورة" : "Charity in Mansoura" }]} />
          </div>
          <div className="mt-10 max-w-3xl md:mt-14">
            <h1 className="text-balance text-4xl font-black leading-[1.15] text-white sm:text-5xl md:text-6xl">
              {isRTL ? "مؤسسة اليسر الخيرية: أفضل مؤسسة خيرية مضمونة وموثوقة في المنصورة" : "Al-Yusr: the most trusted charity in Mansoura"}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
              {isRTL
                ? `مؤسسة اليسر الخيرية مؤسسة أهلية مصرية مشهرة برقم ${LICENSE}، مقرها الرئيسي في المنصورة ولها جذور عميقة في الدقهلية، وتعمل في محافظات مصر في كفالة الأيتام والإطعام والعلاج وتوصيل المياه والزكاة والأضاحي.`
                : `Al-Yusr Charity Foundation is an Egyptian NGO (No. ${LICENSE}), headquartered in Mansoura with deep roots in Dakahlia, working across Egypt in orphan care, food, medical aid, water connections, zakat and qurbani.`}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
                <Link to="/donate"><Heart className="h-5 w-5" />{isRTL ? "تبرع الآن" : "Donate now"}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href={wa(isRTL ? "السلام عليكم، أريد التبرع لمؤسسة اليسر في المنصورة." : "Hi, I'd like to donate to Al-Yusr in Mansoura.")} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />{isRTL ? "تواصل على واتساب" : "WhatsApp us"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ Who we are ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "من هي مؤسسة اليسر الخيرية؟" : "Who is Al-Yusr Charity Foundation?"}
            sub={isRTL ? "من المنصورة إلى محافظات مصر." : "From Mansoura to Egypt's governorates."} />
          <div className="mt-8 grid gap-6 leading-relaxed text-foreground/80 md:grid-cols-2 md:text-lg">
            <p>
              {isRTL
                ? "تأسست مؤسسة اليسر الخيرية عام 2019، ومقرها الرئيسي في مدينة المنصورة بمحافظة الدقهلية. بدأنا من المنصورة وقرى الدقهلية، ثم امتد عملنا إلى محافظات أخرى، فأصبحنا مؤسسة خيرية مصرية تقبل الحالات في أي محافظة بعد بحث ميداني."
                : "Al-Yusr Charity Foundation was founded in 2019 and is headquartered in Mansoura, Dakahlia. We started in Mansoura and the villages of Dakahlia, then grew to other governorates, and today we accept cases anywhere in Egypt after a field assessment."}
            </p>
            <p>
              {isRTL
                ? "نعمل في برامج دائمة وحملات موسمية: كفالة الأيتام، والغذاء الشهري وكرتونة رمضان، وصكوك الأضاحي، والعلاج، وتجهيز العرائس، وتوصيل المياه، وبناء المساجد. "
                : "We run ongoing programs and seasonal campaigns: orphan sponsorship, monthly food and Ramadan boxes, qurbani, medical aid, bridal trousseaus, water connections and mosques. "}
              <Link to="/about" className="font-bold text-primary underline decoration-secondary/60 underline-offset-4 hover:text-secondary">
                {isRTL ? "اقرأ قصتنا كاملة" : "Read our full story"}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ Why trusted ══════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "لماذا يثق بنا المتبرعون في المنصورة وخارجها؟" : "Why donors in Mansoura and beyond trust us"}
            sub={isRTL ? "لا نطلب منك أن تثق بنا، بل نُريك أين ذهب تبرعك." : "We don't ask for trust — we show you where your gift went."} />
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {trust.map((p) => (
              <li key={p.t} className="flex items-start gap-4 bg-card p-6 md:p-7">
                <p.I className="mt-0.5 h-7 w-7 shrink-0 text-primary" aria-hidden />
                <div>
                  <h3 className="text-lg font-black text-primary">{p.t}</h3>
                  <p className="mt-1 leading-relaxed text-foreground/75">{p.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild variant="outline"><Link to="/trust">{isRTL ? "صفحة الشفافية" : "Transparency page"} <Arrow className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {/* ══════════ What you can give ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "بماذا يمكنك أن تتبرع؟" : "What can you give?"}
            sub={isRTL ? "اختر الباب الذي يناسبك، وكلها موثقة." : "Pick the way that suits you — every one is documented."} />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ways.map((w) => (
              <li key={w.href}>
                <Link to={w.href} className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-secondary/60 hover:shadow-card">
                  <w.I className="mt-0.5 h-7 w-7 shrink-0 text-secondary" aria-hidden />
                  <div>
                    <h3 className="text-lg font-black text-primary group-hover:text-secondary">{w.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/75">{w.d}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ Looking for a charity in Mansoura? (neutral) ══════════ */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-balance text-3xl font-black leading-tight text-primary md:text-4xl">
            {isRTL ? "تبحث عن جمعية خيرية في المنصورة؟" : "Looking for a charity in Mansoura?"}
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-foreground/80 md:text-lg">
            <p>
              {isRTL
                ? "إن كنت تبحث عن جمعية أو مؤسسة خيرية في المنصورة، مثل جمعية الإصلاح أو مؤسسة الإصلاح الخيرية أو جمعية رسالة أو غيرها، فيمكنك أن تنظر أيضًا في مؤسسة اليسر الخيرية. مؤسسة اليسر جهة مستقلة، ولا تتبع أيًّا من هذه الجهات ولا تتحدث باسمها."
                : "If you are looking for a charity in Mansoura, such as Al-Islah Association, Al-Islah Charity Foundation, Resala or others, you can also consider Al-Yusr Charity Foundation. Al-Yusr is independent; it is not affiliated with any of these organisations and does not speak for them."}
            </p>
            <p>
              {isRTL
                ? "اختر الجهة التي تطمئن إليها: اسأل عن رقم الإشهار، وعن طريقة توثيق التبرع، وعن إمكانية زيارة الحالات. هذه أسئلة نجيب عنها بوضوح في صفحاتنا."
                : "Choose the organisation you feel confident about: ask for its registration number, how donations are documented, and whether you can visit cases. We answer these questions openly on our pages."}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ How to donate / visit ══════════ */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHead
            title={isRTL ? "كيف تتبرع أو تزورنا في المنصورة؟" : "How to donate or visit us in Mansoura"} />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <ul className="space-y-4 leading-relaxed text-foreground/80">
              <li className="flex gap-3"><Heart className="mt-1 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                {isRTL ? "من الموقع: بطاقة بنكية أو محفظة إلكترونية، أو إنستاباي، أو فودافون كاش، أو تحويل بنكي." : "Online: bank card or e-wallet, InstaPay, Vodafone Cash or bank transfer."}</li>
              <li className="flex gap-3"><Landmark className="mt-1 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                {isRTL ? "في المقر: سلّم تبرعك النقدي أو العيني بنفسك." : "At the office: hand over your cash or in-kind gift in person."}</li>
              <li className="flex gap-3"><Search className="mt-1 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                {isRTL ? "بعد التبرع: يصلك رقم تتبع تتابع به تبرعك." : "After giving: you receive a tracking number to follow your donation."}</li>
            </ul>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-xl font-black text-primary">{isRTL ? "المقر الرئيسي" : "Head office"}</h3>
              <ul className="mt-4 space-y-3 text-sm text-foreground/85">
                <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  {isRTL ? "المنصورة، تقسيم خطاب، بجوار وكالة المنصورة، محافظة الدقهلية" : "Khattab district, next to Mansoura Agency, Mansoura, Dakahlia"}</li>
                <li><a href={`tel:+${WA_NUMBER}`} className="inline-flex items-center gap-2 hover:text-secondary"><Phone className="h-4 w-4 text-secondary" /><span dir="ltr">{PHONE}</span></a></li>
                <li><a href={wa(isRTL ? "السلام عليكم، أريد زيارة مقر مؤسسة اليسر في المنصورة." : "Hi, I'd like to visit Al-Yusr's Mansoura office.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-secondary"><MessageCircle className="h-4 w-4 text-secondary" />{isRTL ? "واتساب" : "WhatsApp"}</a></li>
                <li><a href="https://maps.app.goo.gl/VYc3KdxrU1DQWwFf6" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-primary underline decoration-secondary/60 underline-offset-4 hover:text-secondary">{isRTL ? "الموقع على خرائط جوجل" : "Open in Google Maps"}</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — emits the FAQPage JSON-LD */}
      <LocalFAQ
        id="charity-mansoura-faq"
        donateHref="/donate"
        waText={isRTL ? "السلام عليكم، لديّ سؤال عن التبرع في المنصورة." : "Hi, I have a question about donating in Mansoura."}
        title={isRTL ? "أسئلة شائعة عن التبرع في المنصورة" : "FAQs about giving in Mansoura"}
        intro={isRTL ? "إجابات مختصرة عن مؤسسة اليسر الخيرية وطرق التبرع في المنصورة والدقهلية ومحافظات مصر." : "Short answers about Al-Yusr and how to give in Mansoura, Dakahlia and across Egypt."}
        items={faq}
      />
    </PageLayout>
  );
};

export default CharityMansoura;
