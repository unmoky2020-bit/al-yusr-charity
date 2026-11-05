import { l, type CampaignPageContent } from "@/data/campaignPages/types";

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
      "حضانات تعليمية للأطفال من ٤ لـ ٦ سنين، ودور تحفيظ قرآن من ٤ لـ ١٦ سنة، بمناهج متخصصة بنبنيها ونشرف عليها بنفسنا، وفريق تربوي قوي، ومسابقات قرآن بتكرّم الحفّاظ.",
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
        { id: "nursery_ages", title: l("٤ – ٦ سنين", "Ages 4–6"), desc: l("حضانات تعليمية", "Learning nurseries") },
        { id: "quran_ages", title: l("٤ – ١٦ سنة", "Ages 4–16"), desc: l("دور تحفيظ القرآن", "Qur'an houses") },
        { id: "curricula", title: l("مناهج خاصة", "Own curricula"), desc: l("بنبنيها ونشرف عليها", "Built and supervised by us") },
        { id: "contests", title: l("مسابقات قرآن", "Qur'an contests"), desc: l("وتكريم للحفّاظ", "With awards for memorisers") },
      ],
    },
    tracks: {
      title: l("المشروع جزئين بيكمّلوا بعض", "Two parts that complete each other"),
      items: [
        {
          id: "nursery",
          title: l("حضانات اليسر التعليمية", "Al-Yusr learning nurseries"),
          desc: l(
            "حضانات تعليمية للأطفال من سن ٤ لحد ٦ سنين. الطفل بيتأسّس فيها قبل المدرسة على القراءة والكتابة والحساب، ويتربّى على القيم والآداب، في بيئة آمنة ومليانة لعب ونشاط.",
            "Learning nurseries for children aged 4 to 6. Before school, children build foundations in reading, writing and numbers and grow on good values, in a safe place full of play and activity.",
          ),
        },
        {
          id: "quran",
          title: l("دور تحفيظ القرآن الكريم", "Qur'an memorisation houses"),
          desc: l(
            "دور تحفيظ للأطفال والشباب من سن ٤ لحد ١٦ سنة. حلقات حفظ ومراجعة وتجويد بتمشي مع الطالب من أول سورة لحد ما يكبر، علشان يطلع جيل حافظ لكتاب الله وفاهم معانيه.",
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
        { id: "p3", title: l("أنشطة ولعب ورسم بتبني شخصية الطفل", "Play, art and activities that build character"), desc: l("", "") },
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
      title: l("رحلة الطفل معانا من ٤ لـ ١٦ سنة", "A child's journey with us, from 4 to 16"),
      lead: l(
        "الطفل بيبدأ معانا في الحضانة وحلقة التحفيظ في نفس الوقت، وبيكمّل في دار التحفيظ لحد ما يبقى شاب.",
        "Children start with us in the nursery and the Qur'an circle at the same time, then continue in the Qur'an house into their teens.",
      ),
      items: [],
    },
    pillars: {
      title: l("إيه اللي بيميّز حضانات ودور اليسر؟", "What sets Al-Yusr's nurseries and Qur'an houses apart"),
      items: [
        {
          id: "curricula",
          title: l("مناهج متخصصة بنبنيها بنفسنا", "Specialised curricula we build ourselves"),
          desc: l(
            "ما بنعتمدش على منهج جاهز. بنبني مناهج الحضانة ومناهج التحفيظ بنفسنا، متدرّجة حسب السن والمستوى، ومربوطة ببعض علشان الطفل يكمّل رحلته من غير ما يتوه.",
            "We don't rely on an off-the-shelf curriculum. We build our nursery and Qur'an curricula ourselves, graded by age and level and connected so each child's journey continues smoothly.",
          ),
        },
        {
          id: "supervision",
          title: l("إشراف ومتابعة مستمرة", "Continuous supervision"),
          desc: l(
            "المؤسسة بتشرف بنفسها على تطبيق المناهج في كل حضانة ودار تحفيظ: زيارات، وتقييم دوري للطلاب، ومتابعة لجودة التعليم.",
            "The foundation itself supervises how the curricula are taught in every nursery and Qur'an house: visits, regular student assessment and quality follow-up.",
          ),
        },
        {
          id: "team",
          title: l("فريق تربوي قوي", "A strong educational team"),
          desc: l(
            "معلمات حضانة ومحفّظين ومحفّظات ومشرفين تربويين، بيتابعوا كل طفل كإنسان قبل ما يكون طالب، وبيتدرّبوا باستمرار على أساليب التعليم والتربية.",
            "Nursery teachers, Qur'an teachers and educational supervisors who see each child as a person before a student, and who train continually in teaching and upbringing.",
          ),
        },
        {
          id: "contests",
          title: l("مسابقات القرآن الكريم", "Qur'an competitions"),
          desc: l(
            "مسابقات دورية في الحفظ والتجويد بتشجّع الطلاب وتخلق روح منافسة حلوة، وبتنتهي بتكريم للحفّاظ قدّام أهاليهم.",
            "Regular memorisation and tajweed competitions that motivate students with healthy rivalry, ending with memorisers honoured in front of their families.",
          ),
        },
      ],
    },
    hadith_label: { title: l("فضل تعلّم القرآن وتعليمه", "The virtue of learning and teaching the Qur'an"), items: [] },
    kind: {
      title: l("نوع المشروع", "Project type"),
      lead: l(
        "حضانات اليسر ودور التحفيظ بتجمع النوعين: مشروع خدمي بيدخّل موارد بتتصرف على أنشطة المؤسسة، وفي نفس الوقت أثره الأكبر هو تربية جيل متعلّم وحافظ للقرآن.",
        "Al-Yusr's nurseries and Qur'an houses are both: a service project whose income funds the foundation's work, and above all a way of raising an educated generation that holds the Qur'an.",
      ),
      items: [],
    },
    give: {
      title: l("تبرعك بيروح فين", "Where your gift goes"),
      lead: l(
        "تبرعك للمشروع بيساعدنا نطوّر المناهج، وندرّب الفريق التربوي، ونجهّز الفصول وحلقات التحفيظ، ونكرّم الحفّاظ في المسابقات. وكل آية بيحفظها طالب صدقة جارية لكل اللي ساهم فيها.",
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
    { q: l("حضانات اليسر لأي سن؟", "What ages do the nurseries serve?"), a: l("حضانات اليسر التعليمية للأطفال من سن ٤ لحد ٦ سنين، يعني مرحلة ما قبل المدرسة.", "Al-Yusr learning nurseries serve children aged 4 to 6, the pre-school years.") },
    { q: l("دور تحفيظ القرآن لأي سن؟", "What ages do the Qur'an houses serve?"), a: l("دور التحفيظ بتستقبل الأطفال والشباب من سن ٤ لحد ١٦ سنة، والحلقات بتتقسّم حسب السن والمستوى.", "Children and teens aged 4 to 16, in circles grouped by age and level.") },
    { q: l("مين اللي بيحط المناهج؟", "Who writes the curricula?"), a: l("مؤسسة اليسر بتبني مناهج الحضانة والتحفيظ بنفسها، وبتشرف على تطبيقها في كل حضانة ودار تحفيظ بزيارات وتقييم دوري.", "Al-Yusr builds its own nursery and Qur'an curricula and supervises how they are taught through visits and regular assessment.") },
    { q: l("إيه هي مسابقات القرآن؟", "What are the Qur'an competitions?"), a: l("مسابقات دورية في الحفظ والتجويد للطلاب، بتشجّعهم على الإتقان وبتنتهي بتكريم الحفّاظ قدّام أهاليهم.", "Regular memorisation and tajweed competitions that motivate students and end with memorisers honoured in front of their families.") },
    { q: l("مين الفريق اللي بيعلّم الأطفال؟", "Who teaches the children?"), a: l("فريق تربوي من معلمات الحضانة والمحفّظين والمحفّظات والمشرفين التربويين، وبيتدرّبوا باستمرار.", "An educational team of nursery teachers, Qur'an teachers and supervisors who train continually.") },
    { q: l("إزاي أدعم المشروع؟", "How can I support the project?"), a: l("تقدر تتبرع من صفحة التبرع، وتبرعك بيروح لتطوير المناهج وتدريب الفريق وتجهيز الفصول وتكريم الحفّاظ.", "Give from the donation page; your gift funds curriculum development, team training, classrooms and awards for memorisers.") },
  ],

  cta: {
    title: l("ساهم في تربية جيل متعلّم وحافظ للقرآن", "Help raise an educated generation that holds the Qur'an"),
    sub: l("", ""),
  },
};

export default NURSERIES;
