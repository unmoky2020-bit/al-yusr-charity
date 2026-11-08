/**
 * Suggested About-page content the dashboard can load into its editor («استخدام المحتوى المقترح»).
 * Nothing here is shown to visitors directly while the backend has content: an admin loads it,
 * reviews it and saves it to /admin/about-us/{section} like any other edit.
 */
import type { AboutUsProgramItem, AboutUsWhyUsItem } from "@/data/laravelApi";

/** «لماذا تثق بنا؟» — the guarantees a donor can check for themselves. */
export const SUGGESTED_WHY_US: AboutUsWhyUsItem[] = [
  { icon: "BadgeCheck", title_ar: "كيان رسمي مشهر", title_en: "A licensed, official entity",
    description_ar: "مؤسسة مشهرة برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي، وتدخل كل التبرعات حسابات رسمية باسم المؤسسة.",
    description_en: "Registered under No. 2665/2019 with the Ministry of Social Solidarity; every donation goes into the foundation's official accounts." },
  { icon: "Camera", title_ar: "توثيق بالصور والفيديو", title_en: "Photo & video proof",
    description_ar: "يُوثَّق كل تبرع بالصور والفيديو لحظة التسليم أو التنفيذ ويصلك التوثيق، مع الحفاظ على كرامة الأسرة.",
    description_en: "Every donation is documented on photo and video at delivery or completion and sent to you, while protecting the family's dignity." },
  { icon: "HandHeart", title_ar: "وصّل صدقتك بيدك", title_en: "Deliver it yourself",
    description_ar: "إن أحببت، يمكنك مرافقتنا لتسلّم تبرعك إلى الأسرة بنفسك، أو تحضر تنفيذ العمل (سقف، وصلة مياه، كرتونة)، ويرتّب فريقنا لك الزيارة.",
    description_en: "If you wish, come with us and hand over your donation yourself or attend the work (a roof, a water line, a food box); our team arranges the visit." },
  { icon: "Users", title_ar: "تطوّع بنفسك معنا", title_en: "Volunteer with us",
    description_ar: "انضم إلى فريق المتطوعين في التعبئة والتوزيع والقوافل والزيارات الميدانية، وشاهد الأثر بعينك.",
    description_en: "Join our volunteers in packing, distribution, convoys and field visits, and see the impact first-hand." },
  { icon: "HeartHandshake", title_ar: "أولادك يتطوعون أيضًا", title_en: "Your children can volunteer too",
    description_ar: "اجعل أولادك يشاركوننا في مهام تناسب أعمارهم، ليتربّوا على العطاء وهم يرون أثره.",
    description_en: "Your children can take part in age-appropriate tasks and grow up seeing what giving does." },
  { icon: "FileCheck2", title_ar: "إيصال ورقم متابعة", title_en: "Receipt & tracking number",
    description_ar: "بعد تأكيد تبرعك يصلك إيصال ورقم متابعة تتابع به تبرعك حتى يُنفَّذ.",
    description_en: "Once confirmed, you get a receipt and a number to follow your donation until it is delivered." },
];

const A = (icon: string, title_ar: string, title_en: string, description_ar: string, description_en: string, href: string): AboutUsProgramItem =>
  ({ icon, title_ar, title_en, description_ar, description_en, href });

/** «أنشطتنا الدائمة» — the 15 most requested kinds of giving, each linked to its page on the site. */
export const SUGGESTED_ACTIVITIES: AboutUsProgramItem[] = [
  A("Baby", "كفالة يتيم", "Orphan sponsorship", "كفالة شهرية تغطي احتياجات اليتيم من أكل وتعليم وعلاج.", "Monthly sponsorship covering an orphan's food, schooling and care.", "/programs/orphans"),
  A("Soup", "إطعام — وجبة ساخنة", "Hot meals", "وجبات ساخنة تُطبخ وتُوزَّع على الأسر الأولى بالرعاية.", "Hot meals cooked and delivered to families in need.", "/programs/kitchen"),
  A("Package", "كرتونة غذائية شهرية", "Monthly food box", "كرتونة أساسيات تصل إلى الأسرة كل شهر.", "A box of staples delivered to a family every month.", "/programs/box"),
  A("Moon", "إفطار صائم وكرتونة رمضان", "Iftar & Ramadan boxes", "وجبات إفطار وكراتين رمضان للأسر المستحقة.", "Iftar meals and Ramadan boxes for families in need.", "/ramadan"),
  A("Landmark", "بناء وعمارة المساجد", "Building & restoring mosques", "بناء وترميم وفرش المساجد في القرى — صدقة جارية.", "Building, restoring and furnishing village mosques.", "/projects/mosques"),
  A("Droplets", "سقيا الماء ووصلات المياه", "Water connections", "توصيل مياه نظيفة للبيوت المحرومة منها.", "Bringing clean water lines to homes without them.", "/programs/water"),
  A("HeartPulse", "علاج المرضى والقوافل الطبية", "Medical aid & convoys", "عمليات وأدوية وقوافل طبية مجانية للمحتاجين.", "Surgeries, medicines and free medical convoys.", "/programs/treatment"),
  A("GraduationCap", "التعليم ومصروفات الطلاب", "Education & school fees", "مصروفات دراسية وأدوات تعليمية للطلاب غير القادرين.", "School fees and supplies for students who can't afford them.", "/programs/education"),
  A("BookOpen", "تحفيظ القرآن الكريم", "Quran memorisation", "حلقات ومكاتب تحفيظ القرآن ومكافآت للمحفّظين.", "Quran circles and support for teachers.", "/programs/quran"),
  A("Gift", "تيسير زواج اليتيمات", "Helping orphan brides marry", "تجهيز العرائس بالأجهزة والمستلزمات الأساسية.", "Essential appliances and household items for brides.", "/programs/bride"),
  A("HandCoins", "كفالة الأسر شهريًا", "Monthly family sponsorship", "مساعدة شهرية ثابتة للأسر الأولى بالرعاية.", "A fixed monthly allowance for families most in need.", "/programs/monthly-sponsorship"),
  A("Beef", "صكوك الأضاحي واللحوم", "Qurbani & meat", "ذبح وتوزيع لحوم الأضاحي على الأسر المستحقة.", "Qurbani slaughter and meat distribution to families.", "/qurbani"),
  A("Shirt", "كسوة وبطاطين الشتاء", "Winter clothing & blankets", "ملابس وأغطية شتوية للأسر في البرد.", "Warm clothes and blankets for families in winter.", "/setr"),
  A("Home", "تسقيف وترميم البيوت", "Roofing & repairing homes", "أسقف وترميمات للبيوت المتهالكة.", "Roofs and repairs for homes that are falling apart.", "/projects/shelter"),
  A("Sprout", "الوقف والصدقة الجارية", "Endowments & ongoing charity", "مشروعات وقفية يستمر خيرها ودخلها للأسر.", "Endowment projects whose benefit keeps going.", "/projects/waqf"),
];
