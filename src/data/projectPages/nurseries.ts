import { l, type CampaignPageContent } from "@/data/campaignPages/types";
import { img } from "@/data/pageImages";

/**
 * Default content of the nurseries & Qur'an houses page (/nurseries). The layout lives in
 * `src/pages/landings/NurseriesLanding.tsx`; the ids and section keys below are referenced there and
 * must stay stable. The dashboard (المشاريع → حضانات اليسر → محتوى الصفحة) saves an override in the
 * project's `page_content`. Not here: prices (= the project's donation packages), FAQ (= the FAQ
 * category linked to the project) and the hero image (= the project's cover image).
 */
const NURSERIES: CampaignPageContent = {
  hero: {
    eyebrow: l("مشروع تعليمي · صدقة جارية", "Education project · ongoing charity"),
    title: l("حضانات اليسر التعليمية ودور تحفيظ القرآن", "Al-Yusr learning nurseries and Qur'an houses"),
    title2: l("", ""),
    lead: l(
      "حضانات تعليمية للأطفال من ٤ إلى ٦ سنوات، ودور تحفيظ قرآن من ٤ إلى ١٦ سنة، بمناهج متخصصة نبنيها ونشرف عليها بأنفسنا، وفريق تربوي قوي، ومسابقات قرآن تكرّم الحفّاظ.",
      "Learning nurseries for ages 4–6 and Qur'an houses for ages 4–16, with specialised curricula we build and supervise ourselves, a strong educational team, and Qur'an competitions that honour memorisers.",
    ),
    donateLabel: l("ادعم المشروع", "Support the project"),
  },

  hadith: {
    text: l("خيرُكم مَن تعلَّمَ القرآنَ وعلَّمَه", "The best of you are those who learn the Qur'an and teach it."),
    source: l("رواه البخاري", "Sahih al-Bukhari"),
  },

  prices: [],
  stats: [],

  sections: {
    facts: {
      title: l("المشروع في سطور", "The project at a glance"),
      items: [
        { id: "nursery_ages", title: l("٤ – ٦ سنوات", "Ages 4–6"), desc: l("حضانات تعليمية", "Learning nurseries") },
        { id: "quran_ages", title: l("٤ – ١٦ سنة", "Ages 4–16"), desc: l("دور تحفيظ القرآن", "Qur'an houses") },
        { id: "curricula", title: l("مناهج خاصة", "Own curricula"), desc: l("نبنيها ونشرف عليها", "Built and supervised by us") },
        { id: "contests", title: l("مسابقات قرآن", "Qur'an contests"), desc: l("وتكريم للحفّاظ", "With awards for memorisers") },
      ],
    },
    tracks: {
      title: l("المشروع جزءان يكمّل أحدهما الآخر", "Two parts that complete each other"),
      items: [
        {
          id: "nursery",
          title: l("حضانات اليسر التعليمية", "Al-Yusr learning nurseries"),
          desc: l(
            "حضانات تعليمية للأطفال من سن ٤ إلى ٦ سنوات، يتأسّس فيها الطفل قبل المدرسة على القراءة والكتابة والحساب، ويتربّى على القيم والآداب، في بيئة آمنة مليئة باللعب والنشاط.",
            "Learning nurseries for children aged 4 to 6. Before school, children build foundations in reading, writing and numbers and grow on good values, in a safe place full of play and activity.",
          ),
        },
        {
          id: "quran",
          title: l("دور تحفيظ القرآن الكريم", "Qur'an memorisation houses"),
          desc: l(
            "دور تحفيظ للأطفال والشباب من سن ٤ إلى ١٦ سنة، فيها حلقات حفظ ومراجعة وتجويد ترافق الطالب من أول سورة حتى يكبر، لينشأ جيل يحفظ كتاب الله ويفهم معانيه.",
            "Qur'an houses for children and teens aged 4 to 16. Memorisation, review and tajweed circles that grow with the student from the first surah onward, raising a generation that holds the Qur'an and understands it.",
          ),
        },
      ],
    },
    nursery_points: {
      title: l("نقاط الحضانة", "Nursery points"),
      dynamic: true,
      items: [
        { id: "p1", title: l("تأسيس في القراءة والكتابة والحساب", "Foundations in reading, writing and numbers"), desc: l("", "") },
        { id: "p2", title: l("قيم وآداب إسلامية بأسلوب يناسب سنّهم", "Islamic values and manners suited to their age"), desc: l("", "") },
        { id: "p3", title: l("أنشطة ولعب ورسم تبني شخصية الطفل", "Play, art and activities that build character"), desc: l("", "") },
      ],
    },
    quran_points: {
      title: l("نقاط دور التحفيظ", "Qur'an house points"),
      dynamic: true,
      items: [
        { id: "p1", title: l("حلقات حسب مستوى كل طالب وسنّه", "Circles matched to each student's level and age"), desc: l("", "") },
        { id: "p2", title: l("تعليم أحكام التجويد والتلاوة الصحيحة", "Tajweed and correct recitation"), desc: l("", "") },
        { id: "p3", title: l("مراجعة دورية تثبّت الحفظ", "Regular review that makes memorisation last"), desc: l("", "") },
      ],
    },
    journey: {
      title: l("رحلة الطفل معنا من ٤ إلى ١٦ سنة", "A child's journey with us, from 4 to 16"),
      lead: l(
        "يبدأ الطفل معنا في الحضانة وحلقة التحفيظ في الوقت نفسه، ثم يواصل في دار التحفيظ حتى يصير شابًا.",
        "Children start with us in the nursery and the Qur'an circle at the same time, then continue in the Qur'an house into their teens.",
      ),
      items: [],
    },
    pillars: {
      title: l("ما الذي يميّز حضانات ودور اليسر؟", "What sets Al-Yusr's nurseries and Qur'an houses apart"),
      items: [
        {
          id: "curricula",
          title: l("مناهج متخصصة نبنيها بأنفسنا", "Specialised curricula we build ourselves"),
          desc: l(
            "لا نعتمد على منهج جاهز، بل نبني مناهج الحضانة والتحفيظ بأنفسنا، متدرّجة حسب السن والمستوى ومترابطة فيما بينها، ليواصل الطفل رحلته دون أن يتشتت.",
            "We don't rely on an off-the-shelf curriculum. We build our nursery and Qur'an curricula ourselves, graded by age and level and connected so each child's journey continues smoothly.",
          ),
        },
        {
          id: "supervision",
          title: l("إشراف ومتابعة مستمرة", "Continuous supervision"),
          desc: l(
            "تشرف المؤسسة بنفسها على تطبيق المناهج في كل حضانة ودار تحفيظ: زيارات، وتقييم دوري للطلاب، ومتابعة لجودة التعليم.",
            "The foundation itself supervises how the curricula are taught in every nursery and Qur'an house: visits, regular student assessment and quality follow-up.",
          ),
        },
        {
          id: "team",
          title: l("فريق تربوي قوي", "A strong educational team"),
          desc: l(
            "معلمات حضانة ومحفّظون ومحفّظات ومشرفون تربويون، يتابعون كل طفل إنسانًا قبل أن يكون طالبًا، ويتدرّبون باستمرار على أساليب التعليم والتربية.",
            "Nursery teachers, Qur'an teachers and educational supervisors who see each child as a person before a student, and who train continually in teaching and upbringing.",
          ),
        },
        {
          id: "contests",
          title: l("مسابقات القرآن الكريم", "Qur'an competitions"),
          desc: l(
            "مسابقات دورية في الحفظ والتجويد تشجّع الطلاب وتخلق روح منافسة جميلة، وتنتهي بتكريم الحفّاظ أمام أهاليهم.",
            "Regular memorisation and tajweed competitions that motivate students with healthy rivalry, ending with memorisers honoured in front of their families.",
          ),
        },
      ],
    },
    hadith_label: { title: l("فضل تعلّم القرآن وتعليمه", "The virtue of learning and teaching the Qur'an"), items: [] },
    kind: {
      title: l("نوع المشروع", "Project type"),
      lead: l(
        "تجمع حضانات اليسر ودور التحفيظ بين النوعين: فهي مشروع خدمي يدرّ موارد تُصرف على أنشطة المؤسسة، وأثرها الأكبر في الوقت نفسه هو تربية جيل متعلّم يحفظ القرآن.",
        "Al-Yusr's nurseries and Qur'an houses are both: a service project whose income funds the foundation's work, and above all a way of raising an educated generation that holds the Qur'an.",
      ),
      items: [],
    },
    give: {
      title: l("أين يذهب تبرعك؟", "Where your gift goes"),
      lead: l(
        "يساعدنا تبرعك للمشروع على تطوير المناهج، وتدريب الفريق التربوي، وتجهيز الفصول وحلقات التحفيظ، وتكريم الحفّاظ في المسابقات. وكل آية يحفظها طالب صدقة جارية لكل من ساهم فيها.",
        "Your gift helps us develop the curricula, train the educational team, equip classrooms and Qur'an circles, and honour memorisers at the competitions. Every verse a student memorises is ongoing charity for all who helped.",
      ),
      items: [],
    },
    shares: {
      title: l("ساهم في حضانات ودور اليسر", "Support Al-Yusr's nurseries and Qur'an houses"),
      lead: l(
        "اختر السهم المناسب لك، ويمكنك زيادة عدد الأسهم أو تعديل المبلغ في صفحة التبرع.",
        "Pick the share that suits you; you can add more shares or change the amount on the donation page.",
      ),
      items: [],
    },
    gallery: { title: l("من حضاناتنا ودورنا", "From our nurseries and Qur'an houses"), items: [] },
  },

  /** Shown only while the project's FAQ category is empty or unreachable. */
  faq: [
    { q: l("ما الفئة العمرية لحضانات اليسر؟", "What ages do the nurseries serve?"), a: l("حضانات اليسر التعليمية للأطفال من سن ٤ إلى ٦ سنوات، أي مرحلة ما قبل المدرسة.", "Al-Yusr learning nurseries serve children aged 4 to 6, the pre-school years.") },
    { q: l("ما الفئة العمرية لدور تحفيظ القرآن؟", "What ages do the Qur'an houses serve?"), a: l("تستقبل دور التحفيظ الأطفال والشباب من سن ٤ إلى ١٦ سنة، وتُقسَّم الحلقات حسب السن والمستوى.", "Children and teens aged 4 to 16, in circles grouped by age and level.") },
    { q: l("من يضع المناهج؟", "Who writes the curricula?"), a: l("تبني مؤسسة اليسر مناهج الحضانة والتحفيظ بنفسها، وتشرف على تطبيقها في كل حضانة ودار تحفيظ بالزيارات والتقييم الدوري.", "Al-Yusr builds its own nursery and Qur'an curricula and supervises how they are taught through visits and regular assessment.") },
    { q: l("ما مسابقات القرآن؟", "What are the Qur'an competitions?"), a: l("مسابقات دورية في الحفظ والتجويد للطلاب، تشجّعهم على الإتقان وتنتهي بتكريم الحفّاظ أمام أهاليهم.", "Regular memorisation and tajweed competitions that motivate students and end with memorisers honoured in front of their families.") },
    { q: l("من الفريق الذي يعلّم الأطفال؟", "Who teaches the children?"), a: l("فريق تربوي من معلمات الحضانة والمحفّظين والمحفّظات والمشرفين التربويين، يتدرّبون باستمرار.", "An educational team of nursery teachers, Qur'an teachers and supervisors who train continually.") },
    { q: l("كيف أدعم المشروع؟", "How can I support the project?"), a: l("يمكنك التبرع من صفحة التبرع، ويذهب تبرعك إلى تطوير المناهج وتدريب الفريق وتجهيز الفصول وتكريم الحفّاظ.", "Give from the donation page; your gift funds curriculum development, team training, classrooms and awards for memorisers.") },
  ],

  cta: {
    title: l("ساهم في تربية جيل متعلّم وحافظ للقرآن", "Help raise an educated generation that holds the Qur'an"),
    sub: l("", ""),
  },

  /** Pictures (dashboard → الصور). The hero image is the project's cover image. */
  images: {
    gallery: {
      label: l("معرض صور الحضانات ودور التحفيظ", "Nurseries gallery"),
      items: [
        img("program-education.jpg", "أطفال في فصل تعليمي بحضانات اليسر", "Children in an Al-Yusr nursery classroom"),
        img("axis-education.jpg", "حلقة تحفيظ قرآن للأطفال في دور اليسر", "A children's Qur'an circle"),
        img("poster-education.png", "تعليم الأطفال في مؤسسة اليسر", "Children's education at Al-Yusr"),
        img("hero-child.jpg", "طفل من أطفال حضانات اليسر", "A child at an Al-Yusr nursery"),
      ],
    },
  },
};

export default NURSERIES;
