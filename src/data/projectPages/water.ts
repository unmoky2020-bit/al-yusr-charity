import { l, type CampaignPageContent } from "@/data/campaignPages/types";
import { img } from "@/data/pageImages";

/**
 * Default content of the clean-water page (/water). The layout lives in
 * `src/pages/landings/WaterLanding.tsx`; the ids and section keys below are referenced there and must stay
 * stable. The dashboard (المشاريع → سقيا الماء → محتوى الصفحة) saves an override in the project's
 * `page_content`. Not here: the hero image (= the project's cover image) and the FAQ (= the FAQ category
 * linked to the project; the list below is the fallback).
 */
const WATER: CampaignPageContent = {
  hero: {
    eyebrow: l("أفضل الصدقة سقي الماء", "The best charity is giving water"),
    title: l("سقيا الماء — مياه نظيفة لكل بيت", "Clean water — safe water for every home"),
    title2: l("", ""),
    lead: l(
      "وصلة مياه نظيفة داخل البيت تعني أمانًا لصحة الأطفال وكبار السن، وراحة للأم والأب من مشوار الجراكن والمياه الملوثة. افتح الحنفية بالأسفل وشاهد الفرق بنفسك.",
      "A clean water connection at home means safety for children and elders, and relief for parents from long trips and dirty water. Open the tap below and see the difference.",
    ),
    donateLabel: l("تبرع لسقيا الماء", "Give clean water"),
  },

  hadith: {
    text: l("أفضلُ الصدقةِ سَقْيُ الماء", "The best charity is giving water to drink."),
    source: l("رواه أبو داود والنسائي وابن ماجه، وحسّنه الألباني", "Abu Dawud, al-Nasa'i and Ibn Majah; graded hasan by al-Albani"),
  },

  prices: [],
  stats: [],

  sections: {
    why: {
      title: l("لماذا المياه النظيفة أولوية؟", "Why clean water comes first"),
      lead: l(
        "المياه النظيفة هي خط الحماية الأول لصحة الأطفال وكبار السن؛ فجسم الطفل ما زال ينمو ومناعته ضعيفة، وجسم كبير السن لا يحتمل الأمراض التي تنقلها المياه الملوثة. شربة ماء نظيفة في البيت تعني زيارات أقل للطبيب، ومصروفات علاج أقل، وطفلًا يلعب ويذهب إلى مدرسته بصحة جيدة.",
        "Clean water is the first line of protection for children and the elderly. A child's immunity is still developing, and an elder's body copes poorly with waterborne illness. Clean water at home means fewer doctor visits, lower medical costs, and children who play and go to school healthy.",
      ),
      items: [],
    },
    why_more: {
      title: l("فقرة ثانية", "Second paragraph"),
      lead: l(
        "وفي بيوت كثيرة بقرى الدقهلية، تمشي الأم أو الأب مسافات طويلة كل يوم لملء جراكن المياه، وأحيانًا تكون هذه المياه نفسها غير نظيفة. وحين تنقطع المياه يتعطل البيت كله: لا طبخ ولا غسيل ولا وضوء ولا نظافة للصغار. وصلة مياه واحدة تعيد إلى الأسرة وقتها وصحتها وراحة بالها.",
        "In many homes in Dakahlia's villages, a mother or father walks long distances daily to fill jerrycans, and that water is often unclean. When water is cut, the whole home stops: no cooking, washing, ablution or bathing the little ones. One connection gives a family back its time, health and peace of mind.",
      ),
      items: [],
    },
    what: {
      title: l("أين يذهب تبرعك في سقيا الماء؟", "Where your water donation goes"),
      items: [
        { id: "home", title: l("وصلة مياه منزلية", "A home water connection"), desc: l("توصيل مياه الشرب النظيفة من الشبكة الرسمية إلى داخل البيت، شاملًا المواسير والتركيب.", "Connecting clean drinking water from the official network into the home, with pipes and installation.") },
        { id: "meter", title: l("عداد ورسوم رسمية", "Meter and official fees"), desc: l("رسوم العداد والتوصيل الرسمية التي تقف عائقًا أمام أسر كثيرة.", "The official meter and connection fees that stop many families.") },
        { id: "filter", title: l("فلاتر ومحطات تنقية", "Filters and purification units"), desc: l("تنقية المياه في القرى التي شبكتها ضعيفة أو مياهها غير آمنة للشرب.", "Filtering water in villages where the network is weak or unsafe to drink.") },
      ],
    },
    kind: {
      title: l("نوع المشروع", "Project type"),
      lead: l(
        "سقيا الماء مشروع أثر مجتمعي: صحة وأمان للأطفال وكبار السن، وراحة للأمهات والآباء، وصدقة جارية ما دام الناس يشربون.",
        "Clean water is a community-impact project: health for children and elders, relief for parents, and ongoing charity as long as people drink.",
      ),
      items: [],
    },
    gallery: { title: l("من الميدان", "From the field"), items: [] },
  },

  /** Shown only while the project's FAQ category is empty or unreachable. */
  faq: [
    { q: l("من يستفيد من مشروع سقيا الماء؟", "Who benefits?"), a: l("أسر مستحقة في قرى الدقهلية ليس لديها وصلة مياه في البيت أو مياهها غير آمنة، تُختار بعد بحث ميداني من فريق اليسر.", "Families in Dakahlia's villages with no home water connection or unsafe water, selected after a field visit.") },
    { q: l("فيمَ يُستخدم التبرع؟", "What does the donation fund?"), a: l("وصلات مياه منزلية من الشبكة الرسمية، ورسوم العداد، وفلاتر ومحطات تنقية للقرى التي تعاني ضعف المياه.", "Home connections from the official network, meter fees, and filters or purification units for villages.") },
    { q: l("هل سقيا الماء صدقة جارية؟", "Is it ongoing charity?"), a: l("نعم، ما دام الناس يشربون من هذه المياه ويتوضؤون بها فالأجر مستمر، وقد قال ﷺ: «أفضل الصدقة سقي الماء».", "Yes. As long as people drink and make ablution from it, the reward continues.") },
    { q: l("هل سيصلني توثيق؟", "Will I receive proof?"), a: l("نعم، نرسل لك صور التنفيذ بعد تركيب الوصلة وتشغيلها.", "Yes, we send photos once the connection is installed and working.") },
    { q: l("هل يمكنني التبرع بوصلة مياه صدقةً عن متوفى؟", "Can I give it on behalf of someone who has passed?"), a: l("نعم، يمكنك كتابة اسم المتوفى في صفحة التبرع، وتكون الصدقة باسمه.", "Yes, add their name on the donation page.") },
  ],

  cta: {
    title: l("افتح حنفية خير في بيت محتاج", "Open a tap of good in a home in need"),
    sub: l("", ""),
  },

  /** Pictures (dashboard → الصور). The hero image is the project's cover image. */
  images: {
    gallery: {
      label: l("معرض صور سقيا الماء", "Clean water gallery"),
      items: [
        img("program-water-new.jpg", "توصيل مياه نظيفة لبيت أسرة مستحقة في الدقهلية", "Clean water reaching a family home in Dakahlia"),
        img("poster-water.png", "مشروع سقيا الماء من مؤسسة اليسر", "Al-Yusr clean water project"),
        img("yusr-water.png", "مياه شرب نقية للأطفال وكبار السن", "Safe drinking water for children and elders"),
      ],
    },
  },
};

export default WATER;
