import { l, type CampaignPageContent } from "./types";
import { img } from "@/data/pageImages";

/**
 * Default content for the first ten days of Dhul Hijjah page (/ten-days).
 * Ids and section keys are referenced by `src/pages/landings/AshrLanding.tsx`; keep them stable.
 * Price ids (= the `key` of the campaign's donation packages): day, daily, arafah_iftar, meat, water.
 * Section keys: days (one item per day d1…d10), why, arafah, qurbani.
 * Editable from the dashboard once a donation campaign exists whose slug (or landing slug) is
 * `ten-days`, or whose Arabic name contains «العشر».
 */
const ashr: CampaignPageContent = {
  hero: {
    eyebrow: l("العشر الأوائل من ذي الحجة", "The first ten days of Dhul Hijjah"),
    title: l("أحبّ الأيام إلى الله", "The days most beloved to Allah"),
    title2: l("صدقتك فيها مضاعفة", "make your charity count in them"),
    lead: l(
      "عشرة أيام العملُ الصالح فيها أحبّ إلى الله من أي وقت آخر. صدقة كل يوم، وإفطار صائم يوم عرفة، وأضحية يوم النحر، كلها تصل إلى أسر مستحقة في الدقهلية ومصر بتوثيق كامل.",
      "Ten days in which good deeds are more beloved to Allah than at any other time. A charity every day, iftar for a fasting person on the day of Arafah and a Qurbani on the day of sacrifice, all reaching families in need with full documentation.",
    ),
    donateLabel: l("تصدّق في العشر", "Give in the ten days"),
  },

  hadith: {
    text: l(
      "ما من أيامٍ العملُ الصالحُ فيها أحبُّ إلى الله من هذه الأيام، يعني أيام العشر",
      "There are no days in which righteous deeds are more beloved to Allah than these days, meaning the ten days.",
    ),
    source: l("رواه أبو داود والترمذي، وأصله في صحيح البخاري", "Abu Dawud and al-Tirmidhi; its origin is in Sahih al-Bukhari"),
  },

  prices: [
    { id: "day", label: l("صدقة يوم واحد", "Charity for one day"), amount: 50, note: l("لأي يوم من العشر", "For any of the ten days") },
    { id: "daily", label: l("صدقة كل يوم طوال العشر", "Charity every day of the ten"), amount: 500, note: l("نوزّعها على الأيام العشرة", "Spread over the ten days") },
    { id: "arafah_iftar", label: l("إفطار صائم يوم عرفة", "Iftar for a fasting person on Arafah"), amount: 95, note: l("وجبة ساخنة", "A hot meal") },
    { id: "meat", label: l("سهم لحوم بلدي (1 كجم)", "Local meat share (1 kg)"), amount: 420, note: l("من مزرعتنا الوقفية", "From our waqf farm") },
    { id: "water", label: l("سهم في وصلة مياه", "Share in a water connection"), amount: 500, note: l("صدقة جارية", "Ongoing charity") },
  ],

  stats: [],

  sections: {
    days: {
      title: l("خطة صدقة العشر يوم بيوم", "A day-by-day plan for the ten days"),
      lead: l("اختر اليوم واطّلع على العمل المقترح فيه، وتصدّق في اليوم نفسه.", "Pick a day, see the suggested deed and give on that very day."),
      items: [
        { id: "d1", title: l("اليوم الأول", "Day 1"), desc: l("ابدأ العشر بنيّة صادقة وصدقة ولو قليلة، فأحب الأعمال إلى الله أدومها وإن قل.", "Begin with a sincere intention and a charity, however small: the deeds most loved by Allah are the most constant, even if little.") },
        { id: "d2", title: l("اليوم الثاني", "Day 2"), desc: l("أطعم أسرة محتاجة، فإطعام الطعام من أفضل القربات في الأيام الفاضلة.", "Feed a family in need: feeding others is among the best deeds in blessed days.") },
        { id: "d3", title: l("اليوم الثالث", "Day 3"), desc: l("ساهم في سقيا الماء، وأفضل الصدقة سقي الماء.", "Help provide water: the best charity is giving water to drink.") },
        { id: "d4", title: l("اليوم الرابع", "Day 4"), desc: l("أدخِل السرور على يتيم بكسوة أو مصروف أو هدية.", "Bring joy to an orphan with clothes, pocket money or a gift.") },
        { id: "d5", title: l("اليوم الخامس", "Day 5"), desc: l("ساند مريضًا في علاجه بوصفة طبية أو تحليل أو أشعة.", "Support a patient's treatment with a prescription, a test or a scan.") },
        { id: "d6", title: l("اليوم السادس", "Day 6"), desc: l("صدقة جارية تبقى بعدك: سهم في وصلة مياه أو في الوقف.", "An ongoing charity that outlives you: a share in a water connection or in the waqf.") },
        { id: "d7", title: l("اليوم السابع", "Day 7"), desc: l("ساهم في تعليم طفل وتحفيظه القرآن.", "Help a child learn and memorise the Qur'an.") },
        { id: "d8", title: l("يوم التروية", "Day of Tarwiyah"), desc: l("اليوم الثامن. جهّز صدقة يوم عرفة، وشارك في إفطار الصائمين.", "The eighth day. Prepare your Arafah charity and take part in feeding those who fast.") },
        { id: "d9", title: l("يوم عرفة", "Day of Arafah"), desc: l("يوم المغفرة والعتق من النار. صُم، وأكثِر من الدعاء، فخير الدعاء دعاء يوم عرفة، وفطّر صائمًا.", "The day of forgiveness. Fast, make plenty of du'a, for the best du'a is that of the day of Arafah, and give iftar to a fasting person.") },
        { id: "d10", title: l("يوم النحر", "Day of Sacrifice"), desc: l("يوم العيد والأضحية. شارك أسرة محتاجة فرحة العيد بلحم الأضحية.", "The day of Eid and the Qurbani. Share Eid's joy with a family in need through Qurbani meat.") },
      ],
    },
    why: {
      title: l("لماذا تتصدّق في العشر؟", "Why give in the ten days?"),
      items: [
        { id: "beloved", title: l("أحبّ الأيام إلى الله", "The days most beloved to Allah"), desc: l("العمل الصالح فيها أحب إلى الله من غيرها، والصدقة من أعظم العمل الصالح.", "Good deeds in them are more beloved to Allah than at other times, and charity is among the greatest of deeds.") },
        { id: "arafah", title: l("فيها يوم عرفة", "They contain the day of Arafah"), desc: l("يوم المغفرة والعتق من النار، وصيامه يكفّر سنتين.", "The day of forgiveness, whose fast expiates two years.") },
        { id: "sacrifice", title: l("فيها يوم النحر", "They contain the day of sacrifice"), desc: l("يوم الأضحية وإدخال الفرحة على الأسر في العيد.", "The day of the Qurbani and of bringing joy to families at Eid.") },
        { id: "constant", title: l("صدقة كل يوم", "Charity every day"), desc: l("صدقة يومية صغيرة طوال العشر تضمن ألا يفوتك يوم منها.", "A small daily charity throughout the ten days makes sure you do not miss a single one.") },
      ],
    },
    arafah: {
      title: l("يوم عرفة", "The day of Arafah"),
      lead: l(
        "قال ﷺ عن صيام يوم عرفة: «أحتسبُ على الله أن يكفّر السنةَ التي قبله والسنةَ التي بعده» رواه مسلم. شارك أجر الصائمين بإفطار صائم في يوم عرفة.",
        "The Prophet ﷺ said of fasting the day of Arafah: \"I hope from Allah that it expiates the year before it and the year after it\" (Muslim). Share the reward of those who fast by giving iftar on the day of Arafah.",
      ),
      items: [],
    },
    qurbani: {
      title: l("أضحيتك من مزرعتنا الوقفية", "Your Qurbani from our waqf farm"),
      lead: l(
        "صك أضحية بالتكلفة الفعلية، بذبح شرعي وتوزيع على الأسر المستحقة في يوم العيد نفسه، وتوثيق بالصور والفيديو.",
        "A Qurbani share at actual cost, with Sharia slaughter and distribution to families in need on Eid day itself, documented with photos and video.",
      ),
      items: [],
    },
  },

  faq: [
    { q: l("متى تكون العشر الأوائل من ذي الحجة؟", "When are the first ten days of Dhul Hijjah?"), a: l("هي أول عشرة أيام من شهر ذي الحجة، وآخرها يوم النحر (أول أيام عيد الأضحى)، واليوم التاسع منها يوم عرفة.", "They are the first ten days of Dhul Hijjah; the last is the day of sacrifice (the first day of Eid al-Adha) and the ninth is the day of Arafah.") },
    { q: l("كيف أتصدّق يوميًا طوال العشر؟", "How do I give a charity every day of the ten?"), a: l("اختر «صدقة كل يوم طوال العشر» وادفع مرة واحدة، ونحن نوزّع المبلغ على الأيام العشرة.", "Choose «Charity every day of the ten» and pay once; we spread the amount over the ten days.") },
    { q: l("هل يمكنني أن أتصدّق عن متوفى في العشر؟", "Can I give on behalf of someone who has passed away?"), a: l("نعم، اكتب اسمه في صفحة التبرع، وتكون الصدقة عنه.", "Yes, write their name on the donation page and the charity will be on their behalf.") },
    { q: l("متى يصل إفطار الصائم يوم عرفة؟", "When is the Arafah iftar delivered?"), a: l("تُوزَّع الوجبات على الأسر الصائمة وقت المغرب في يوم عرفة نفسه.", "The meals are distributed to fasting families at sunset on the day of Arafah itself.") },
    { q: l("هل الأضحية متاحة في هذه الصفحة؟", "Is the Qurbani on this page?"), a: l("لصك الأضحية صفحة خاصة فيها كل التفاصيل والأسعار، ويمكنك الوصول إليها من الزر في قسم الأضحية.", "The Qurbani share has its own page with all details and prices, linked from the Qurbani section.") },
  ],

  cta: {
    title: l("لا تفوّت أحبّ الأيام إلى الله", "Don't miss the days most beloved to Allah"),
    sub: l("صدقة صغيرة كل يوم من العشر تصنع فرقًا لأسرة محتاجة، وفي ميزان حسناتك.", "A small charity every day of the ten makes a difference to a family in need, and to your scale of deeds."),
  },

  /** Pictures (dashboard → الصور). */
  images: {
    hero: {
      label: l("الصورة الرئيسية", "Main image"),
      hint: l("تظهر في قسم الأضحية داخل الصفحة وعند مشاركة الرابط.", "Shown in the Qurbani section and when the link is shared."),
      max: 1,
      items: [img("qurbani-hero-trays.webp", "لحوم أضاحي اليسر جاهزة للتوزيع على الأسر", "Al-Yusr Qurbani meat ready for distribution")],
    },
  },
};

export default ashr;
