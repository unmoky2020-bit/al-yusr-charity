import { apiFetch, API_BASE_URL, invalidateApiCache } from "./laravelApi";
import { apiErrorMessage, fetchList, unwrapItem, unwrapList } from "./api/adminApiHelpers";

export interface FaqCategory {
  id: number;
  name_ar: string;
  name_en?: string | null;
  slug: string;
  is_active?: boolean;
  sort_order?: number;
  faqs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FaqItem {
  id: number | string;
  faq_category_id?: number | null;
  question_ar: string;
  question_en?: string | null;
  answer_ar: string;
  answer_en?: string | null;
  sort_order?: number;
  is_active: boolean;
  category?: FaqCategory | null;
  created_at?: string;
  updated_at?: string;
  // Fallback virtual category slug for client filtering
  pageCategory?: string;
}

/** Pre-defined Page Category Mapping matching site pages */
export const FAQ_PAGE_CATEGORIES: {
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  iconName: string;
  sort_order: number;
}[] = [
  {
    slug: "home",
    name_ar: "الصفحة الرئيسية",
    name_en: "Home Page",
    description_ar: "الأسئلة الأكثر شيوعًا عن مؤسسة اليسر، والأثر المباشر للتبرعات، وطرق الدفع.",
    description_en: "Most common questions about Al-Yusr foundation and direct donation impact.",
    iconName: "Home",
    sort_order: 1,
  },
  {
    slug: "about",
    name_ar: "صفحة من نحن",
    name_en: "About Us",
    description_ar: "الترخيص الرسمي، المقرات، الإعفاء الضريبي، التطوع والتحقق الميداني.",
    description_en: "Official registration, headquarters, tax exemption, volunteering, and verification.",
    iconName: "Building2",
    sort_order: 2,
  },
  {
    slug: "programs",
    name_ar: "صفحة البرامج والمشاريع",
    name_en: "Programs & Projects",
    description_ar: "مسارات البرامج، الفرق بين البرامج والحالات، سقيا الماء، وتخصيص التبرعات.",
    description_en: "Program paths, differences with cases, clean water, and donation allocations.",
    iconName: "Compass",
    sort_order: 3,
  },
  {
    slug: "contact",
    name_ar: "صفحة تواصل معنا",
    name_en: "Contact Us",
    description_ar: "مواعيد العمل، ووسائل التواصل، والمندوبون، والمقرات الرسمية.",
    description_en: "Working hours, communication channels, delegates, and office locations.",
    iconName: "PhoneCall",
    sort_order: 4,
  },
  {
    slug: "campaigns",
    name_ar: "صفحة كل الحملات",
    name_en: "All Campaigns",
    description_ar: "أسئلة شائعة حول جميع حملات ومبادرات مؤسسة اليسر الخيرية في مصر.",
    description_en: "Common questions about all Al-Yusr charitable campaigns and initiatives.",
    iconName: "Target",
    sort_order: 5,
  },
  {
    slug: "markoun",
    name_ar: "صفحة حملة مَرْكون",
    name_en: "Markoun Campaign",
    description_ar: "التبرع بالأثاث والأجهزة والملابس والمستلزمات الفائضة، مع استلام مجاني.",
    description_en: "Donating stored furniture, appliances, and clothes with free doorstep pickup.",
    iconName: "Package",
    sort_order: 6,
  },
  {
    slug: "qurbani",
    name_ar: "صفحة صكوك الأضاحي",
    name_en: "Qurbani Shares",
    description_ar: "شروط الصكوك وأسعارها، والذبح الشرعي، وتوزيع اللحوم الطازجة في القرى.",
    description_en: "Sacrifice share prices, Islamic rulings, fresh meat distribution.",
    iconName: "Flame",
    sort_order: 7,
  },
  {
    slug: "zakat",
    name_ar: "صفحة الزكاة والصدقات",
    name_en: "Zakat & Charity",
    description_ar: "حساب نصاب الزكاة، ومصارفها الشرعية، والحساب المنفصل للزكاة بنسبة 100%.",
    description_en: "Calculating Zakat Nisab, legitimate beneficiaries, and 100% dedicated fund.",
    iconName: "Coins",
    sort_order: 8,
  },
  {
    slug: "trust",
    name_ar: "صفحة الشفافية والتقارير",
    name_en: "Trust & Transparency",
    description_ar: "توثيق التبرعات بالصور، وتتبعها بالرقم المرجعي، ومطابقة المعايير.",
    description_en: "Photo documentation, tracking by ref code, and governance reports.",
    iconName: "ShieldCheck",
    sort_order: 9,
  },
  {
    slug: "campaign-zell",
    name_ar: "حملة ظل — أسقف ووصلات مياه",
    name_en: "Zell Campaign",
    description_ar: "أسقف المنازل، ووصلات المياه النقية ومحطاتها، والأبواب والشبابيك للأسر المستحقة.",
    description_en: "Roofs, clean water connections, and doors/windows for families in need.",
    iconName: "Sun",
    sort_order: 10,
  },
  {
    slug: "campaign-sitr",
    name_ar: "حملة ستر — دفء الشتاء",
    name_en: "Sitr Campaign",
    description_ar: "أسقف وأبواب وشبابيك، وأسِرّة ومراتب وألحفة فايبر، وكسوة شتوية للأسر.",
    description_en: "Roofs, doors, windows, beds, mattresses, and winter warm clothing.",
    iconName: "Shield",
    sort_order: 11,
  },
  {
    slug: "campaign-markoon",
    name_ar: "حملة مركون — التبرع العيني",
    name_en: "Markoon Campaign",
    description_ar: "أول حملة مصرية تجمع الأثاث والأجهزة والملابس والأدوية والكتب من البيوت.",
    description_en: "Donating furniture, appliances, used clothes, and medicine with home pickup.",
    iconName: "Archive",
    sort_order: 12,
  },
  {
    slug: "campaign-ramadan",
    name_ar: "موسم الخير — رمضان المبارك",
    name_en: "Ramadan Season",
    description_ar: "كرتونة الخير 25 كجم، ومطبخ اليسر لإفطار الصائمين، وذبائح المزارع الوقفية، وزكاة الفطر.",
    description_en: "Ramadan 25kg food boxes, hot iftar meals, sacrifices, and Zakat.",
    iconName: "Moon",
    sort_order: 13,
  },
  {
    slug: "campaign-athar",
    name_ar: "حملة أثر — دعم التعليم والطلاب",
    name_en: "Athar Campaign",
    description_ar: "الحقيبة والزي المدرسي، وسداد المصروفات، ومبادرة «استدامة» للكتب، وحضانات القرآن.",
    description_en: "School bags, uniforms, tuition fees, Istidama book recycling, and nurseries.",
    iconName: "GraduationCap",
    sort_order: 14,
  },
  {
    slug: "campaign-arboun-kheir",
    name_ar: "عربون خير — مبادرة الفريلانسرز",
    name_en: "Arboun Kheir",
    description_ar: "مبادرة تدعو الشباب العاملين في العمل الحر (الفريلانسرز) إلى استقطاع نسبة مرنة من أرباح مشاريعهم، زكاةً للمهنة وبركةً في الرزق.",
    description_en: "Freelancers initiative donating a flexible percentage from project profits.",
    iconName: "Laptop",
    sort_order: 15,
  },
];

/** Centralized curated static dataset classified by page category */
export const DEFAULT_STATIC_FAQS: Omit<FaqItem, "id">[] = [
  // ─── 1. Home Page (الرئيسية) ───
  {
    pageCategory: "home",
    question_ar: "كيف أتأكد أن تبرعي وصل فعلًا إلى المستحقين؟",
    question_en: "How do I know my donation reached the right people?",
    answer_ar: "نوثّق كل تبرع بتقارير ميدانية وصور، ونرسل إلى المتبرعين متابعة دورية، مع احترام خصوصية الأسر وكرامتها.",
    answer_en: "We document every gift with field reports and photos, sending donors regular updates while preserving family privacy.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "هل مؤسسة اليسر مرخصة وشفافة؟",
    question_en: "Is Al-Yusr officially licensed and transparent?",
    answer_ar: "نعم. اليسر مسجلة رسميًا بوزارة التضامن الاجتماعي برقم 2665/2019 وتصدر تقارير مالية وميدانية دورية لكل حملة.",
    answer_en: "Yes — registered under No. 2665/2019, we publish regular financial and field reports for every campaign.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "كيف تختارون الأسر والمشاريع؟",
    question_en: "How do you choose families and projects?",
    answer_ar: "نعتمد على زيارات ميدانية وبحث اجتماعي دقيق وفق معايير استحقاق واضحة، لنختار الأسر الأكثر حاجة والمشاريع ذات الأثر المستدام.",
    answer_en: "We use field visits and real eligibility criteria to select the most deserving families and sustainable projects.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "ما البرامج التي تدعمها المؤسسة الآن؟",
    question_en: "Which programs does the foundation support now?",
    answer_ar: "نركز على الغذاء المستمر، والرعاية الصحية، والتعليم، وسقيا الماء، وترميم المساكن، وكفالة الأيتام، مع متابعة مستمرة حتى تستقر أحوال الأسرة.",
    answer_en: "We focus on food, health, education, water, shelter, and orphan sponsorship with follow-up until families improve.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "ما طرق الدفع المتاحة للتبرع السريع؟",
    question_en: "What payment methods are available?",
    answer_ar: "بطاقات فيزا وماستركارد عبر Kashier، وإنستاباي InstaPay، وفودافون كاش، والتحويل البنكي على CIB، ومندوب تحصيل يصل إليك أينما كنت.",
    answer_en: "Visa/Mastercard via Kashier, InstaPay, Vodafone Cash, CIB bank transfer, and home pickup delegates.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "هل يمكنني التبرع بعملات أخرى من خارج مصر؟",
    question_en: "Can I donate in different currencies?",
    answer_ar: "نعم، نستقبل التبرعات بالجنيه المصري والدولار الأمريكي والريال السعودي عبر الحسابات البنكية الدولية المعتمدة والبطاقات الائتمانية.",
    answer_en: "Yes — we accept EGP, USD, and SAR via official bank transfers and credit cards.",
    sort_order: 6,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "هل يمكنني التطوع أو الشراكة معكم؟",
    question_en: "Can I volunteer or partner with you?",
    answer_ar: "بالتأكيد. نرحب بجميع المتطوعين والشركات والمبادرات المجتمعية، ويتواصل معك فريقنا خلال 48 ساعة من تقديم الطلب.",
    answer_en: "Absolutely. Register as a volunteer or contact us for community partnerships, and our team will respond within 48 hours.",
    sort_order: 7,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "هل دعمكم للأسر لمرة واحدة أم مستمر؟",
    question_en: "Is your support one-off or ongoing?",
    answer_ar: "نؤمن بالأثر المستدام؛ فبرامجنا تبدأ بإغاثة عاجلة، تليها متابعة دورية وتمكين اقتصادي وتعليم للأبناء، حتى تصل الأسرة إلى الاكتفاء.",
    answer_en: "We believe in sustainable impact; our programs include emergency relief followed by long-term empowerment and education.",
    sort_order: 8,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "أين تنفّذ مؤسسة اليسر مشاريعها حاليًا؟",
    question_en: "Where do you operate currently?",
    answer_ar: "تركيزنا الأساسي في المنصورة وقرى محافظة الدقهلية الأكثر احتياجًا، مع قوافل موسمية وإغاثية تمتد إلى محافظات الشرقية وكفر الشيخ والفيوم.",
    answer_en: "Our main focus is Mansoura and needy villages in Dakahlia, with seasonal caravans reaching neighboring governorates.",
    sort_order: 9,
    is_active: true,
  },
  {
    pageCategory: "home",
    question_ar: "هل تحافظون على كرامة الأسر وخصوصيتها أثناء التوزيع؟",
    question_en: "Do you protect beneficiary dignity?",
    answer_ar: "هذا مبدأ لا تهاون فيه. كل توزيع يتم بكرامة تامة، ولا نُظهر وجوه الأسر أو الأطفال إلا بموافقتهم، وإلا موّهناها احترامًا لهم.",
    answer_en: "This is non-negotiable. Every distribution is conducted with utmost dignity and privacy.",
    sort_order: 10,
    is_active: true,
  },

  // ─── 2. About Us Page (من نحن) ───
  {
    pageCategory: "about",
    question_ar: "ما هي مؤسسة اليسر الخيرية؟",
    question_en: "What is Al-Yusr Charity Foundation?",
    answer_ar: "مؤسسة اليسر الخيرية مؤسسة أهلية مصرية مقرها مدينة المنصورة بمحافظة الدقهلية، تعمل منذ 2019 في رعاية الأيتام والأسر المتعففة، والعلاج، والتعليم، وسقيا الماء، وترميم المساكن، وتوزيع الزكاة والصدقات وصكوك الأضاحي، مع توثيق كل تبرع بالصور والفيديو.",
    answer_en: "Al-Yusr Charity Foundation is an Egyptian non-governmental foundation based in Mansoura, Dakahlia. Since 2019 it has supported orphans and low-income families through healthcare, education, clean water, home repair, Zakat and sadaqah distribution and Qurbani shares, documenting every donation with photos and video.",
    sort_order: 0,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "هل اليسر جمعية أم مؤسسة؟ وما رقم إشهارها؟",
    question_en: "Is Al-Yusr an association or a foundation, and what is its registration number?",
    answer_ar: "الاسم القانوني هو «مؤسسة اليسر الخيرية»، وهي مؤسسة أهلية مشهرة برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي. كثيرون يبحثون عنها باسم «جمعية اليسر» أو «اليسر الخيرية» أو «اليسر المنصورة»، وكلها تشير إلى الجهة نفسها.",
    answer_en: "The legal name is Al-Yusr Charity Foundation, a non-governmental foundation registered under No. 2665 of 2019 with the Egyptian Ministry of Social Solidarity. People also search for it as 'Al-Yusr association', 'Al-Yusr Charity' or 'Al-Yusr Mansoura'; all refer to the same organisation.",
    sort_order: 0,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "ما الاسم الرسمي للمؤسسة بالإنجليزية؟",
    question_en: "What is the foundation's official English name?",
    answer_ar: "الاسم المعتمد بالإنجليزية هو Al-Yusr Charity Foundation، ونطاقنا الرسمي الوحيد هو elyusr.org. قد تجد الاسم مكتوبًا أحيانًا Elyosr أو Al-Yosr على صفحاتنا القديمة في فيسبوك وإنستجرام، وهي نفس المؤسسة.",
    answer_en: "The official English name is Al-Yusr Charity Foundation, and our only official website is elyusr.org. You may also see the spellings Elyosr or Al-Yosr on our older Facebook and Instagram pages; they refer to the same foundation.",
    sort_order: 0,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "هل مؤسسة اليسر لها علاقة بمتجر أجهزة أو شركة تحمل اسم «اليسر»؟",
    question_en: "Is the foundation related to an electronics store or company called Al-Yusr?",
    answer_ar: "لا. مؤسسة اليسر الخيرية جهة خيرية غير هادفة للربح، ولا تربطها أي علاقة بمتاجر الأجهزة أو الشركات التجارية التي تحمل الاسم نفسه. تحقق دائمًا من النطاق الرسمي elyusr.org ورقم الواتساب 01097000137 قبل التبرع.",
    answer_en: "No. Al-Yusr Charity Foundation is a non-profit charity only and has no connection to any electronics store or commercial company with the same name. Always verify the official domain elyusr.org and WhatsApp number +201097000137 before donating.",
    sort_order: 0,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "هل تعمل مؤسسة اليسر خارج المنصورة والدقهلية؟",
    question_en: "Does Al-Yusr operate outside Mansoura and Dakahlia?",
    answer_ar: "نعم. مقرنا وأكبر شبكة ميدانية لنا في المنصورة ومراكز وقرى الدقهلية، لكن حملاتنا تصل حسب الحاجة إلى محافظات أخرى مثل كفر الشيخ والشرقية والفيوم وصعيد مصر، ونستقبل تبرعات من داخل مصر وخارجها.",
    answer_en: "Yes. Our headquarters and largest field network are in Mansoura and the towns and villages of Dakahlia, but campaigns also reach other governorates such as Kafr El-Sheikh, Sharqia, Fayoum and Upper Egypt as needed, and we accept donations from inside and outside Egypt.",
    sort_order: 0,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "كيف أتبرع لعمل خيري في المنصورة بشكل موثّق؟",
    question_en: "How can I make a documented charitable donation in Mansoura?",
    answer_ar: "اختر برنامجًا أو حالة من صفحة التبرع elyusr.org/donate، ثم ادفع بالبطاقة أو المحفظة عبر كاشير، أو بإنستاباي، أو فودافون كاش، أو بالتحويل إلى حساب CIB، أو عن طريق مندوب يصل إليك في المنصورة. بعد التنفيذ يصلك رقم تتبع وصور أو فيديو للتسليم.",
    answer_en: "Pick a program or a verified case on elyusr.org/donate, then pay by card or wallet through Kashier, InstaPay, Vodafone Cash, a CIB bank transfer, or a collection delegate in Mansoura. After delivery you receive a tracking reference plus photos or video of the handover.",
    sort_order: 0,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "أين مقر مؤسسة اليسر الخيرية؟",
    question_en: "Where is Al-Yusr Charity headquartered?",
    answer_ar: "المقر الرئيسي في المنصورة — تقسيم خطاب، بجوار وكالة المنصورة، محافظة الدقهلية، وتغطي قوافلنا ومشاريعنا كل محافظات مصر.",
    answer_en: "Headquarters in Mansoura — Khattab District, next to Mansoura Agency, Dakahlia, with active convoys and aid operations serving families all across Egypt.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "هل تبرعاتي مُعفاة ضريبيًا؟",
    question_en: "Are donations tax-exempt?",
    answer_ar: "نعم، مؤسسة اليسر مرخصة رسميًا برقم 2665 لسنة 2019 بوزارة التضامن الاجتماعي وتبرعاتك تخضع للإعفاء الضريبي وفق القانون المصري.",
    answer_en: "Yes — Al-Yusr is a registered NGO under license #2665/2019, fully compliant with Egyptian tax-deduction regulations.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "كيف أتأكد من وصول تبرعي بنفسي؟",
    question_en: "How can I verify my donation?",
    answer_ar: "نوفّر ميزة «الحضور بنفسك»؛ إذ يمكنك مرافقة مندوبينا في الميدان لتسليم تبرعك أو معاينة وصلة المياه أو السقف، إلى جانب التوثيق الفوري بالصور والفيديو مع كود تتبع.",
    answer_en: "We offer 'In-Person Delivery' where donors can join our field teams, along with real-time video/photo reporting and tracking codes.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "about",
    question_ar: "هل أستطيع التطوع معكم؟",
    question_en: "Can my family and I volunteer?",
    answer_ar: "نعم، نرحب بالمتطوعين والشباب والعائلات ليكونوا جزءًا من فريقنا الميداني عبر صفحة التطوع بالموقع.",
    answer_en: "Yes — we welcome volunteers of all ages to join our distribution drives through our volunteer portal.",
    sort_order: 4,
    is_active: true,
  },

  // ─── 3. Programs Page (برامج التبرع) ───
  {
    pageCategory: "programs",
    question_ar: "ما هي أبواب التبرع المتاحة في مؤسسة اليسر؟",
    question_en: "What donation programs does Al-Yusr offer?",
    answer_ar: "نوفّر مسارات تبرع لكل نية: صك أضحية، وكرتونة عزومة شهرية، وكيلو لحم بلدي من مزارعنا الوقفية، وزكاة المال، وكفالة يتيم، والتعليم (في سبتمبر)، والعلاج والقوافل الطبية، ووصلات المياه، وتجهيز العرائس، وحملة ستر للتسقيف والترميم.",
    answer_en: "We provide a track for every intention: Qurbani vouchers, monthly food box, fresh farm meat, Zakat, orphan sponsorship, education (September), healthcare and medical convoys, water connections, bride preparation, and the Sitr roofing & repair campaign.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "هل تبرعي يصل فعلًا للمستحقين؟",
    question_en: "Does my donation really reach the beneficiaries?",
    answer_ar: "نعم، فكل تبرع يسبقه بحث اجتماعي ميداني للأسر، ويُسلَّم بكرامة حتى باب البيت، ويُوثَّق بصور وفيديو تصلك عبر واتساب أو البريد بعد التنفيذ.",
    answer_en: "Yes — every donation goes through field social assessment, dignified doorstep delivery, and is documented with photos and videos shared with you on WhatsApp or email after execution.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "هل أحصل على إيصال رسمي بالتبرع؟",
    question_en: "Will I receive an official receipt?",
    answer_ar: "بمجرد إتمام الدفع يصلك إيصال إلكتروني فوري برقم مرجعي يمكنك أن تتابع به حالته من صفحة «تتبع التبرع».",
    answer_en: "An electronic receipt with a reference code is emailed to you instantly so you can track the case from our donation tracking page.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "ما الفرق بين التبرع لبرنامج والتبرع لحالة موثّقة؟",
    question_en: "What is the difference between donating to a program and donating to a verified case?",
    answer_ar: "التبرع لبرنامج (مثل صك أضحية أو كرتونة عزومة) يُوزَّع على أسر متعددة بحسب الأكثر احتياجًا، أما التبرع لحالة موثّقة فيذهب إلى حالة فردية بعينها مع متابعة نتيجتها.",
    answer_en: "Program donations (e.g. a Qurbani voucher or food box) are distributed across multiple families by need. A verified case donation goes to one specific family with outcome follow-up.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "هل يمكنني تخصيص تبرعي لمحافظة معينة؟",
    question_en: "Can I designate my donation to a specific governorate?",
    answer_ar: "نعم. تركيزنا الأساسي محافظة الدقهلية بكل مدنها وقراها، ونغطّي حالات أيضًا في كفر الشيخ والصعيد. اطلب التخصيص من فريقنا على واتساب 201097000137+.",
    answer_en: "Yes. Our primary focus is Dakahlia (all cities and villages); we also serve cases in Kafr El-Sheikh and Upper Egypt. Request a designation via WhatsApp +201097000137.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "ما طرق الدفع المتاحة؟",
    question_en: "What payment methods are supported?",
    answer_ar: "فيزا وماستركارد، وVodafone Cash، وInstaPay، والتحويل البنكي على CIB، أو الدفع نقدًا لممثل المؤسسة في المنصورة.",
    answer_en: "Visa/Mastercard, Vodafone Cash, InstaPay, bank transfer to CIB, or in-person cash via our Mansoura representative.",
    sort_order: 6,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "هل المؤسسة مرخّصة رسميًا؟",
    question_en: "Is the foundation officially licensed?",
    answer_ar: "مؤسسة اليسر الخيرية مرخّصة من وزارة التضامن الاجتماعي تحت رقم إشهار 2665/2019، ومقرها الرئيسي بالمنصورة - الدقهلية.",
    answer_en: "Al-Yusr Charity Foundation is licensed by the Ministry of Social Solidarity under license number 2665/2019, headquartered in Mansoura, Dakahlia.",
    sort_order: 7,
    is_active: true,
  },
  {
    pageCategory: "programs",
    question_ar: "كيف أتطوع أو أنضم إلى فريق العمل؟",
    question_en: "How can I volunteer or join the field team?",
    answer_ar: "ادخل إلى صفحة حملات التطوع، واختر حملة، وقدّم على الدور المناسب لمهاراتك. نوفّر تدريبًا ميدانيًا ومتابعة لكل متطوع جديد.",
    answer_en: "Visit our volunteer campaigns page, pick a campaign, and apply for the slot that matches your skills. We provide field training and follow-up for every new volunteer.",
    sort_order: 8,
    is_active: true,
  },

  // ─── 4. Contact Page (تواصل معنا) ───
  {
    pageCategory: "contact",
    question_ar: "ما هي مواعيد العمل الرسمية واستقبال المتبرعين بالمقر؟",
    question_en: "What are the official working hours?",
    answer_ar: "نستقبلكم يوميًا من السبت إلى الخميس من الساعة 9:00 صباحًا وحتى 5:00 مساءً، وفريق خدمة العملاء متاح هاتفيًا وعبر واتساب 24/7.",
    answer_en: "We welcome visitors Saturday to Thursday, 9:00 AM to 5:00 PM. Our WhatsApp team is available 24/7.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "contact",
    question_ar: "أين تقع المقرات والمكاتب الرئيسية لمؤسسة اليسر الخيرية؟",
    question_en: "Where are the official offices located?",
    answer_ar: "المقر الرئيسي في مدينة المنصورة، محافظة الدقهلية (حي الجامعة)، ولدينا نقاط توزيع ومندوبون ميدانيون لتغطية باقي المراكز والقرى.",
    answer_en: "Headquarters is located in Mansoura, Dakahlia. We have field coordination points across surrounding towns.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "contact",
    question_ar: "كيف أتأكد من هوية مندوب التحصيل الميداني عند زيارته لي؟",
    question_en: "How do I verify a field collection delegate?",
    answer_ar: "يحمل مندوبنا كارنيهًا رسميًا معتمدًا بالرقم القومي والصورة، ويسلّمك إيصال تحصيل رسميًا مختومًا من المؤسسة يحتوي على رقم التبرع ورقم الترخيص.",
    answer_en: "Our representative carries an official ID card and provides an official stamped receipt with license and donation numbers.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "contact",
    question_ar: "كيف أتواصل معكم إذا كنت مقيمًا خارج جمهورية مصر العربية؟",
    question_en: "How can international donors contact you?",
    answer_ar: "يمكنكم التواصل المباشر عبر خط الواتساب الدولي (+201097000137) أو عبر البريد الإلكتروني المخصص للعلاقات الدولية donor@alyusr.org.",
    answer_en: "You can reach us directly via international WhatsApp (+201097000137) or email at donor@alyusr.org.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "contact",
    question_ar: "ما هو أسرع وقت للرد على نموذج الاستفسارات والشكاوى؟",
    question_en: "How quickly do you reply to web inquiries?",
    answer_ar: "يتواصل معك فريق متابعة المتبرعين خلال ساعتين في أوقات العمل الرسمية، وخلال 24 ساعة كحد أقصى لجميع الاستفسارات.",
    answer_en: "Our donor care team reaches out within 2 hours during official hours and within 24 hours maximum.",
    sort_order: 5,
    is_active: true,
  },

  // ─── 4b. All Campaigns (كل الحملات) ───
  {
    pageCategory: "campaigns",
    question_ar: "ما الحملات التي تنفذها مؤسسة اليسر؟",
    question_en: "Which campaigns does Al-Yusr run?",
    answer_ar: "ست حملات رئيسية: ظِلّ لوصلات المياه والأسقف (elyusr.org/dhill)، سِتر لدفء الشتاء والأسرّة والأغطية (elyusr.org/setr)، أَثَر لدعم التعليم والطلاب (elyusr.org/athar)، موسم الخير في رمضان (elyusr.org/ramadan)، مَرْكون للتبرع العيني بالأثاث والأجهزة (elyusr.org/markoun)، وعربون خير للمستقلين والفريلانسرز (elyusr.org/arboun). تجدها كلها في صفحة الحملات elyusr.org/campaigns.",
    answer_en: "Six main campaigns: Dhill for water connections and roofs (elyusr.org/dhill), Setr for winter warmth, beds and blankets (elyusr.org/setr), Athar for education and students (elyusr.org/athar), the Ramadan Season of Goodness (elyusr.org/ramadan), Markoun for in-kind furniture and appliance donations (elyusr.org/markoun), and Arboun Kheir for freelancers (elyusr.org/arboun). All are listed at elyusr.org/campaigns.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaigns",
    question_ar: "كيف أختار الحملة المناسبة لنيتي؟",
    question_en: "How do I choose the right campaign for my intention?",
    answer_ar: "إن كانت نيتك صدقة جارية فاختر وصلة مياه أو سقفًا من حملة ظِلّ؛ وللزكاة اختر الحالات أو صفحة الزكاة؛ وللتبرع العيني بأغراض من بيتك اختر مَرْكون؛ ولتجهيز الطلاب اختر أَثَر؛ وللشتاء اختر سِتر. وإن احترت فراسلنا على واتساب 01097000137 ونرشّح لك الأنسب.",
    answer_en: "For ongoing charity choose a water connection or roof from Dhill; for Zakat use the cases or Zakat page; for in-kind items from your home choose Markoun; for students choose Athar; for winter choose Setr. If unsure, message us on WhatsApp +201097000137 and we will suggest the best fit.",
    sort_order: 2,
    is_active: true,
  },

  // ─── 5. Markoun Campaign (حملة مَرْكون) ───
  {
    pageCategory: "markoun",
    question_ar: "ما حملة مَرْكون، ولماذا أشارك فيها؟",
    question_en: "What is Markoun campaign?",
    answer_ar: "مَرْكون مبادرة لإعادة إحياء الأثاث والأجهزة الكهربائية والملابس المركونة في بيتك وتدويرها، ثم توجيهها لتجهيز منازل الأسر الأكثر احتياجًا.",
    answer_en: "Markoun turns unused furniture, appliances, and clothes into dignified support for low-income families.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "markoun",
    question_ar: "كيف أتبرع بالأغراض المركونة عندي، ومن يستلمها؟",
    question_en: "How do I donate stored items?",
    answer_ar: "بمجرد تسجيل بياناتك وصور الأغراض عبر صفحة الحملة أو واتساب، يتحرك فريق لوجستي متخصص بسيارة المؤسسة لاستلامها من باب بيتك.",
    answer_en: "Submit photos and details on the campaign page or WhatsApp, and our logistics team will collect them from your door.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "markoun",
    question_ar: "هل يكلفني الاستلام من باب البيت أي رسوم أو مصاريف شحن؟",
    question_en: "Is doorstep collection free?",
    answer_ar: "الاستلام والنقل مجانيان بالكامل، وتتحمل المؤسسة تكلفتهما داخل نطاق محافظة الدقهلية والمدن المجاورة.",
    answer_en: "Doorstep pickup is 100% free; transportation costs are fully covered by Al-Yusr.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "markoun",
    question_ar: "هل تقبلون الأجهزة أو الأثاث الذي يحتاج إلى صيانة أو تنظيف بسيط؟",
    question_en: "Do you accept items needing minor repairs?",
    answer_ar: "نعم، لدينا ورش صيانة وتجهيز متخصصة تقوم بفحص الأجهزة وإصلاحها وتنظيف الأثاث قبل تسليمه للأسر المستحقة بكرامة تامة.",
    answer_en: "Yes, our dedicated maintenance workshop inspects, repairs, and sanitizes items before delivering them.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "markoun",
    question_ar: "ما هي شروط التبرع بالأدوية الفائضة عن الحاجة؟",
    question_en: "What are the rules for surplus medication donation?",
    answer_ar: "يجب أن تكون الأدوية سليمة التخزين وواضحة تاريخ الصلاحية وسارية لمدة لا تقل عن شهرين، ويقوم صيدلي متخصص بفحصها وتصنيفها فور استلامها.",
    answer_en: "Medications must be properly stored with valid expiration for at least 2 months, reviewed by our licensed pharmacist.",
    sort_order: 5,
    is_active: true,
  },

  // ─── 6. Qurbani Shares (صكوك الأضاحي) ───
  {
    pageCategory: "qurbani",
    question_ar: "ما هي أنواع الصكوك المتاحة للتبرع وأسعارها؟",
    question_en: "What Qurbani shares are available?",
    answer_ar: "نوفر صك عجل بلدي بقري وجاموسي (سهم سُبع)، وصك خروف كامل، وصك مستورد وفق الأسعار المعتمدة لموسم 2026 مع ضمان الذبح في المواعيد الشرعية.",
    answer_en: "We offer local beef share (1/7th), full sheep, and certified shares in compliance with Islamic timings.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "qurbani",
    question_ar: "متى وأين يتم الذبح الشرعي للأضاحي؟",
    question_en: "When and where is the slaughter conducted?",
    answer_ar: "يتم الذبح في مجازر وزارة الزراعة المعتمدة وتحت إشراف بيطري كامل، ويبدأ عقب صلاة عيد الأضحى مباشرة وحتى عصر رابع أيام التشريق.",
    answer_en: "Slaughtering takes place in official veterinary-inspected facilities from Eid prayer until fourth Tashreeq afternoon.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "qurbani",
    question_ar: "هل يمكن للمضحي استلام نصيبه الشرعي من اللحوم؟",
    question_en: "Can the donor receive their share of meat?",
    answer_ar: "نعم، يمكنك اختيار استلام ثلثك الشرعي مغلفًا ومبردًا حتى باب منزلك، أو التبرع بكامل الصك للأسر الأكثر احتياجًا في قرى الدلتا.",
    answer_en: "Yes, you can request delivery of your 1/3 share chilled to your home, or donate the full share to needy families.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "qurbani",
    question_ar: "كيف أضمن سلامة ذبح صكي وتوثيقه باسمي؟",
    question_en: "How do I verify the slaughter with my name?",
    answer_ar: "نرسل للمضحي رسالة نصية وفيديو توثيقي لذبح أضحيته باسمه المسجل في الصك مع إشعار فور بدء التوزيع في القرى المستهدفة.",
    answer_en: "Donors receive SMS and video documentation showing their name called during slaughter and distribution alerts.",
    sort_order: 4,
    is_active: true,
  },

  // ─── 7. Zakat (الزكاة والصدقات) ───
  {
    pageCategory: "zakat",
    question_ar: "كيف يتم حساب نصاب زكاة المال لعام 2026؟",
    question_en: "How is Zakat Nisab calculated in 2026?",
    answer_ar: "نصاب زكاة المال يعادل قيمة 85 جرامًا من الذهب عيار 21 بسعر السوق الحالي، فإذا حال عليه الحول الهجري تخرج عنه نسبة 2.5%.",
    answer_en: "Zakat Nisab equals the market value of 85 grams of 21k gold held for one lunar year, with a 2.5% rate.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "zakat",
    question_ar: "هل تخصص المؤسسة حسابًا مستقلًا للزكاة الشرعية؟",
    question_en: "Does Al-Yusr maintain a dedicated Zakat account?",
    answer_ar: "نعم، لدينا حساب بنكي منفصل يُوجّه بنسبة 100% لمصارف الزكاة الثمانية المحددة في القرآن الكريم دون خصم أي مصاريف إدارية منه.",
    answer_en: "Yes, a 100% dedicated bank account is strictly disbursed to the 8 Quranic categories without administrative deductions.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "zakat",
    question_ar: "ما هي أهم مصارف الزكاة التي تركز عليها مؤسسة اليسر؟",
    question_en: "What are the primary Zakat distribution channels?",
    answer_ar: "سداد ديون الغارمين والغارمات لمنع تفكك الأسر، والعمليات الجراحية العاجلة والعلاج الشهري، ودعم الأسر الفقيرة التي لا عائل لها.",
    answer_en: "Relieving indebted families (Gharimeen), urgent surgeries, chronic medical aid, and supporting widowed households.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "zakat",
    question_ar: "هل يجوز إخراج زكاة الفطر نقديًا عبر المؤسسة؟",
    question_en: "Can Zakat al-Fitr be paid in cash?",
    answer_ar: "نعم، وفقًا لفتوى دار الإفتاء المصرية، وتقوم المؤسسة بشراء مواد غذائية وحبوب وتوزيعها على المستحقين قبل صلاة العيد.",
    answer_en: "Yes, following Egypt Dar Al-Ifta fatwa, which is converted to staple food cartons and distributed before Eid prayer.",
    sort_order: 4,
    is_active: true,
  },

  // ─── 8. Trust & Transparency (الشفافية والتقارير) ───
  {
    pageCategory: "trust",
    question_ar: "كيف يمكنني تتبع تبرعي ومعرفة أثره الميداني؟",
    question_en: "How can I track my donation and see its impact?",
    answer_ar: "عند التبرع تحصل على رقم مرجعي (Ref Code) يمكنك إدخاله في صفحة «تتبع التبرع» بالموقع لمعرفة مرحلة التنفيذ وصور التوثيق.",
    answer_en: "Every gift receives a unique Ref Code to enter into the 'Track Donation' page to inspect status and photo proofs.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "trust",
    question_ar: "كيف أتأكد أن تبرعي وصل فعلًا؟",
    question_en: "How do I confirm my donation actually arrived?",
    answer_ar: "بعد الدفع يصلك رقم تتبع على واتساب أو البريد. أدخله في صفحة تتبع التبرع elyusr.org/donate/track دون الحاجة إلى إنشاء حساب، لتشاهد مرحلة التنفيذ ثم صور أو فيديو التسليم للأسرة المستحقة.",
    answer_en: "After payment you receive a tracking reference by WhatsApp or email. Enter it at elyusr.org/donate/track, with no account needed, to see the execution stage and then the delivery photos or video for the family.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "trust",
    question_ar: "هل يمكن التبرع لمؤسسة اليسر من خارج مصر؟",
    question_en: "Can I donate to Al-Yusr from outside Egypt?",
    answer_ar: "نعم. يمكنك الدفع بالبطاقة الدولية عبر بوابة كاشير من صفحة التبرع، أو التحويل البنكي على حساب المؤسسة في بنك CIB رقم 100043605733 (بيانات SWIFT متاحة عند الطلب). تواصل معنا على واتساب +201097000137 لأي استفسار عن التحويلات الدولية.",
    answer_en: "Yes. Pay with an international card through the Kashier gateway on the donate page, or wire to the foundation's CIB account 100043605733 (SWIFT details on request). Contact us on WhatsApp +201097000137 for any question about international transfers.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "trust",
    question_ar: "هل يمكن للمتبرع مرافقة القوافل الميدانية أثناء التوزيع؟",
    question_en: "Can donors accompany field caravans?",
    answer_ar: "نرحب بالمتبرعين لمرافقة قوافلنا الميدانية والتأكد بأنفسهم من تسليم المساعدات للأهالي في القرى الأكثر احتياجًا.",
    answer_en: "Donors are welcome to join our field caravans to personally observe deliveries to deserving village families.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "trust",
    question_ar: "أين يمكنني مراجعة التقارير المالية وميزانيات المؤسسة؟",
    question_en: "Where can I inspect audited financial statements?",
    answer_ar: "ننشر تقارير ربع سنوية وسنوية معتمدة من محاسب قانوني خارجي على صفحة «الشفافية والموثوقية»، وهي متاحة للجميع للاطلاع والتحميل.",
    answer_en: "We publish quarterly and annual financial statements audited by external certified accountants on our Trust page.",
    sort_order: 3,
    is_active: true,
  },

  // ─── 9. Volunteer (التطوع والعمل الميداني) ───
  {
    pageCategory: "volunteer",
    question_ar: "ما هي شروط الانضمام لفريق متطوعي مؤسسة اليسر؟",
    question_en: "What are the requirements to join as a volunteer?",
    answer_ar: "أن يكون عمر المتقدم 16 سنة فما فوق، ولديه الرغبة الصادقة في العمل الإنساني والالتزام بأخلاقيات ومعايير المؤسسة الميدانية.",
    answer_en: "Applicants must be at least 16 years old with genuine commitment to humanitarian work and organizational ethics.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "volunteer",
    question_ar: "هل يحصل المتطوع على شهادة خبرة معتمدة بساعات التطوع؟",
    question_en: "Do volunteers receive an official certificate?",
    answer_ar: "نعم، تمنح المؤسسة شهادة تطوع رسمية معتمدة بعد إتمام عدد الساعات أو المشاريع المتفق عليها، مع توثيق المهام المنجزة.",
    answer_en: "Yes, official certificates documenting completed volunteer hours and project impact are awarded.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "volunteer",
    question_ar: "ما هي المجالات المتاحة للتطوع بالمؤسسة؟",
    question_en: "What volunteer tracks are available?",
    answer_ar: "العمل الميداني وتعبئة الكراتين، والقوافل الطبية، والتصوير وصناعة المحتوى، والدعم التقني والبرمجة، والبحث الاجتماعي للأسر.",
    answer_en: "Field distribution, medical caravans, media & photography, IT & tech, and family social field research.",
    sort_order: 3,
    is_active: true,
  },

  // ─── 10. Services & Programs (خريطة الخدمات) ───
  {
    pageCategory: "services",
    question_ar: "ما هي القطاعات التنموية الرئيسية التي تغطيها المؤسسة؟",
    question_en: "What main developmental sectors do you cover?",
    answer_ar: "قطاع الأمن الغذائي (كراتين الغذاء والإطعام)، وقطاع الصحة والعلاج، وقطاع سقيا الماء وحفر الآبار، وقطاع الإيواء وتأهيل المنازل.",
    answer_en: "Food security, health & medical clinics, clean water wells, and housing rehabilitation.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "services",
    question_ar: "كيف يتم التحقق من حاجة القرية أو المنطقة لمشروع سقيا ماء أو محطة تنقية؟",
    question_en: "How do you verify water well projects?",
    answer_ar: "نقوم بإجراء تحاليل معملية معتمدة لنسبة ملوحة وشوائب المياه في القرية بالتعاون مع شركة المياه والجهات المختصة لتحديد الأولوية.",
    answer_en: "We run certified laboratory water tests for salinity and purity in collaboration with water authorities to set priority.",
    sort_order: 2,
    is_active: true,
  },

  // ─── 11. General (عامة والتبرعات) ───
  {
    pageCategory: "general",
    question_ar: "هل تتيح المؤسسة التبرع عبر المحافظ الإلكترونية وإنستاباي InstaPay؟",
    question_en: "Do you support mobile wallets and InstaPay?",
    answer_ar: "نعم، يمكنك التحويل فورًا على رقم إنستاباي المعتمد أو محفظة فودافون كاش الرسمية وتأكيد التبرع خلال ثوانٍ.",
    answer_en: "Yes, you can transfer instantly via our certified InstaPay handle or Vodafone Cash wallet.",
    sort_order: 1,
    is_active: true,
  },

  // ─── 12. Campaign Zell (حملة ظل — أسقف ووصلات مياه) ───
  {
    pageCategory: "campaign-zell",
    question_ar: "ما هي حملة ظل؟",
    question_en: "What is the Zell campaign?",
    answer_ar: "حملة من مؤسسة اليسر الخيرية تنفذ أسقف المنازل ووصلات المياه وخطوط المياه والأبواب والشبابيك والمراوح لأسر مستحقة، وجميع أنشطتها صدقات جارية.",
    answer_en: "A campaign by Al-Yusr Charity Foundation that provides house roofs, water connections, water lines, doors, windows and fans for families in need. All its activities are ongoing charity.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaign-zell",
    question_ar: "كم تكلفة تسقيف منزل وكيف أساهم بجزء منها؟",
    question_en: "How much does a roof cost and how can I contribute part of it?",
    answer_ar: "يتراوح سعر السقف حاليًا (2026) من 15,000 إلى 20,000 جنيه مصري حسب مساحة المنزل، ويمكنك المساهمة بسهم بقيمة 500 جنيه ليشارك أكثر من متبرع في إتمام سقف واحد.",
    answer_en: "A roof currently (2026) costs between EGP 15,000 and 20,000 depending on the house size. You can contribute a EGP 500 share so that several donors complete one roof together.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "campaign-zell",
    question_ar: "كم تكلفة وصلة المياه، وما الذي تشمله؟",
    question_en: "How much is a water connection and what does it include?",
    answer_ar: "من 7,000 إلى 8,000 جنيه مصري، وتشمل المواسير وموتور الرفع وخزان المياه وحوض المطبخ والحنفيات والدش ومصاريف التركيب كاملة، ويمكن تقسيمها إلى أسهم بـ 500 جنيه.",
    answer_en: "EGP 7,000 to 8,000. It includes pipes, a lifting pump, a water tank, a kitchen sink, taps, a shower and full installation costs, and it can be split into EGP 500 shares.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "campaign-zell",
    question_ar: "هل يمكن التبرع بوصلة مياه عن شخص متوفى؟",
    question_en: "Can I donate a water connection on behalf of a deceased person?",
    answer_ar: "نعم، يمكنك أن تنوي الوصلة صدقةً جارية عن أحد المتوفين من أسرتك أو عن الأحياء، فسُقيا الماء من أفضل الصدقات الجارية.",
    answer_en: "Yes. You can intend the connection as ongoing charity for a deceased family member or for the living; giving water to drink is one of the best forms of ongoing charity.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "campaign-zell",
    question_ar: "ما العمر الافتراضي للسقف ووصلة المياه؟",
    question_en: "What is the lifespan of the roof and water connection?",
    answer_ar: "السقف من 8 إلى 10 أعوام، ووصلة المياه من 5 إلى 10 سنوات حسب صيانة الموتور واستخدام الأسرة.",
    answer_en: "A roof lasts 8 to 10 years; a water connection 5 to 10 years, depending on pump maintenance and household use.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "campaign-zell",
    question_ar: "في أي محافظات تنفذ الحملة؟",
    question_en: "In which governorates does the campaign operate?",
    answer_ar: "في 2026 ركزنا على الدقهلية وكفر الشيخ والشرقية، ومنذ 2021 وصلت الحملة أيضًا إلى الفيوم والإسماعيلية والوادي الجديد وسوهاج وقنا. ونتحرك دائمًا بحسب أولوية المستحقين وليس المكان.",
    answer_en: "In 2026 we focused on Dakahlia, Kafr El-Sheikh and Sharqia; since 2021 the campaign has also reached Fayoum, Ismailia, New Valley, Sohag and Qena. We always move by the priority of those in need, not by location.",
    sort_order: 6,
    is_active: true,
  },

  // ─── 13. Campaign Sitr (حملة ستر — دفء الشتاء) ───
  {
    pageCategory: "campaign-sitr",
    question_ar: "ما هي حملة ستر؟",
    question_en: "What is the Sitr campaign?",
    answer_ar: "حملة شتوية من مؤسسة اليسر الخيرية تؤمّن منازل الأسر المستحقة وتوفر لها الأسِرّة والمراتب والألحفة الفايبر والكسوة الشتوية، انطلاقًا من الحديث النبوي في فضل ستر المسلم.",
    answer_en: "A winter campaign by Al-Yusr Charity Foundation that secures the homes of families in need and provides them with beds, mattresses, fiber quilts and winter clothing, inspired by the Prophetic hadith on the virtue of shielding a Muslim.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaign-sitr",
    question_ar: "متى تبدأ حملة ستر وإلى متى تستمر؟",
    question_en: "When does Sitr start and how long does it run?",
    answer_ar: "تنطلق سنويًا في شهر أكتوبر مع بداية الخريف وتستمر حتى شهر فبراير لمواجهة أشد موجات البرد.",
    answer_en: "It launches every year in October at the start of autumn and continues until February to face the harshest cold waves.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "campaign-sitr",
    question_ar: "ماذا تشمل الحملة بالتحديد؟",
    question_en: "What exactly does the campaign cover?",
    answer_ar: "الأسقف والأبواب والشبابيك، والأسِرّة الخشبية والمراتب، والألحفة الفايبر، وكسوة الشتاء الثقيلة لأفراد الأسرة.",
    answer_en: "Roofs, doors and windows; wooden beds and mattresses; fiber quilts; and heavy winter clothing for family members.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "campaign-sitr",
    question_ar: "لماذا تهتم الحملة بالأسِرّة والمراتب؟",
    question_en: "Why does the campaign focus on beds and mattresses?",
    answer_ar: "لأن كثيرًا من الأسر تنام على الأرض الباردة، فنرفع الأطفال وكبار السن عنها ونوفر لهم نومًا هادئًا وصحيًا.",
    answer_en: "Because many families sleep on the cold floor; we lift children and the elderly off it and give them calm, healthy sleep.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "campaign-sitr",
    question_ar: "من ينفذ أعمال الحملة ميدانيًا؟",
    question_en: "Who carries out the campaign's work?",
    answer_ar: "فريق المتطوعين بالمؤسسة، بالتعاون مع فنيين محترفين من نجارين وبنائين لضمان جودة الأمان والتنفيذ.",
    answer_en: "The foundation's volunteer team, together with professional carpenters and builders.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "campaign-sitr",
    question_ar: "هل يمكنني التبرع بكفالة شتوية كاملة لأسرة؟",
    question_en: "Can I donate a full winter sponsorship for a family?",
    answer_ar: "نعم، يمكنك اختيار قيمة السهم أو التبرع بكفالة شتوية كاملة لأسرة من خلال زر التبرع في الصفحة.",
    answer_en: "Yes. You can choose a share value or donate a full winter sponsorship for a family through the donation button on this page.",
    sort_order: 6,
    is_active: true,
  },

  // ─── 14. Campaign Markoon (حملة مركون — التبرع العيني) ───
  {
    pageCategory: "campaign-markoon",
    question_ar: "ما هي حملة مركون؟",
    question_en: "What is the Markoon campaign?",
    answer_ar: "هي أول حملة مصرية تجمع الأشياء غير المستخدمة في بيوتكم (أثاث، أجهزة، ملابس، أدوية، كتب) لتوزيعها على أسر مستحقة بعد فحصها وتأهيلها وصيانتها.",
    answer_en: "The first Egyptian campaign that collects items you no longer use at home (furniture, appliances, clothes, medicine, books) and distributes them to families in need after inspection and preparation.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaign-markoon",
    question_ar: "ما الذي يمكنني التبرع به في حملة مركون؟",
    question_en: "What can I donate in Markoon?",
    answer_ar: "الأثاث المنزلي، والأجهزة الكهربائية، والملابس المستعملة بحالة جيدة، والأدوية الفائضة الصالحة للاستخدام، والكتب المدرسية والثقافية والتعليمية.",
    answer_en: "Household furniture, electrical appliances, used clothes in good condition, surplus usable medicine, and school, cultural and educational books.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "campaign-markoon",
    question_ar: "هل يصلني مندوب لاستلام التبرعات من المنزل؟",
    question_en: "Will a representative come to collect donations from my home?",
    answer_ar: "نعم، بمجرد تواصلك على 01097000137 يتوجه مندوب المؤسسة بمركبات المؤسسة الرسمية لاستلام التبرعات وتوثيقها بكرامة واحترافية.",
    answer_en: "Yes. As soon as you call 01097000137, a foundation representative comes in the foundation's vehicles to collect and document the donations.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "campaign-markoon",
    question_ar: "ماذا يحدث للأدوية التي أتبرع بها؟",
    question_en: "What happens to the medicine I donate?",
    answer_ar: "يتم فحصها وتصنيفها تحت إشراف طبي دقيق من صيادلة متخصصين، ثم توزيعها مجانًا على المرضى غير القادرين على توفير تكلفة العلاج.",
    answer_en: "It is checked and classified under careful medical supervision, then distributed free to patients who cannot afford treatment.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "campaign-markoon",
    question_ar: "كيف تضمنون وصول التبرع العيني للمكان المناسب؟",
    question_en: "How do you make sure in-kind donations reach the right place?",
    answer_ar: "نعتمد على نظام رقمي وقواعد بيانات دقيقة تربط كل قطعة بالاحتياج الفعلي للأسرة، وتمر التبرعات بمراحل فحص وتأهيل وصيانة قبل التسليم.",
    answer_en: "We use a digital system and accurate databases that match each item to the family's actual need, and donations go through inspection, preparation and maintenance before delivery.",
    sort_order: 5,
    is_active: true,
  },

  // ─── 15. Campaign Ramadan (موسم الخير — رمضان المبارك) ───
  {
    pageCategory: "campaign-ramadan",
    question_ar: "ما هو موسم الخير في رمضان؟",
    question_en: "What is the Season of Goodness in Ramadan?",
    answer_ar: "هو موسم مؤسسة اليسر الخيرية في رمضان لتأمين الغذاء وإدخال الفرحة على الأسر المتعففة والأيتام، عبر كرتونة الخير 25 كجم، ومطبخ اليسر للوجبات، والذبائح، وتيسير الزواج، وكسوة العيد وكعكه، ومسابقات القرآن.",
    answer_en: "It is Al-Yusr Charity Foundation's Ramadan season for securing food and bringing joy to humble families and orphans, through the Goodness Box, Al-Yusr Kitchen, sacrifices, marriage support, Eid clothes and cookies, and Quran competitions.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaign-ramadan",
    question_ar: "ماذا تحتوي كرتونة الخير في رمضان؟",
    question_en: "What does the Ramadan Goodness Box contain?",
    answer_ar: "تزن 25 كيلو وتشمل بقوليات ومعلبات وأساسيات البيت من منتجات بلدية طازجة 100%، ويُرفق بها لحوم بلدية طازجة ودواجن لتكفي الأسرة شهرًا كاملًا.",
    answer_en: "It weighs 25 kg and includes legumes, canned goods and household basics from 100% local products, plus fresh local meat and poultry sustaining the family for the whole month.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "campaign-ramadan",
    question_ar: "من يستفيد من وجبات مطبخ اليسر الرمضانية؟",
    question_en: "Who benefits from Al-Yusr Kitchen meals?",
    answer_ar: "عابرو السبيل والمسافرون ومرافقو المرضى في المستشفيات الحكومية، بالإضافة إلى الأسر المستحقة والمتعففة في منازلها.",
    answer_en: "Passers-by, travellers and patients' companions in hospitals, as well as families in need and humble families in their homes.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "campaign-ramadan",
    question_ar: "هل يمكنني إخراج زكاة المال وزكاة الفطر عن طريق المؤسسة؟",
    question_en: "Can I pay Zakat al-Mal and Zakat al-Fitr through the foundation?",
    answer_ar: "نعم، نوصل زكاة مالك وزكاة فطرك إلى مستحقيها الشرعيين في مصارفها المحددة بمنتهى الدقة والشفافية.",
    answer_en: "Yes. We deliver your Zakat al-Mal and Zakat al-Fitr to its rightful recipients with accuracy and transparency.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "campaign-ramadan",
    question_ar: "متى تُوزع زكاة الفطر؟",
    question_en: "When is Zakat al-Fitr distributed?",
    answer_ar: "تُجمع وتُوزع في مواعيدها الشرعية خلال العشر الأواخر من رمضان، وقبل صلاة العيد لتدخل البهجة على البيوت المستحقة.",
    answer_en: "It is collected and distributed at its prescribed times during the last ten days of Ramadan, before the Eid prayer.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "campaign-ramadan",
    question_ar: "ما هي حملة «الفرحة فرحتين» لتيسير الزواج في رمضان؟",
    question_en: "What is the 'Double the Joy' campaign?",
    answer_ar: "حملة لتيسير الزواج بتجهيز العرائس من البنات اليتيمات وغير القادرات، لتجتمع فرحة الزواج بفرحة العيد وتوفير الأجهزة الأساسية لبدء حياة مستقرة.",
    answer_en: "A marriage-support campaign that prepares brides among orphaned and underprivileged girls, so the joy of the wedding meets the joy of Eid.",
    sort_order: 6,
    is_active: true,
  },

  // ─── 16. Campaign Athar (حملة أثر — دعم التعليم) ───
  {
    pageCategory: "campaign-athar",
    question_ar: "ما هي حملة أثر؟",
    question_en: "What is the Athar campaign?",
    answer_ar: "حملة تعليمية من مؤسسة اليسر الخيرية تدعم الطلاب غير القادرين والأيتام بالحقيبة والأدوات والزي المدرسي ومصاريف الدراسة، إلى جانب مبادرة استدامة ودور تحفيظ القرآن والحضانات.",
    answer_en: "An educational campaign by Al-Yusr Charity Foundation that supports students in need and orphans with bags, supplies, uniforms and school fees, alongside the Istidama initiative, Quran memorisation centres and nurseries.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaign-athar",
    question_ar: "متى تنطلق حملة أثر؟",
    question_en: "When does Athar campaign launch?",
    answer_ar: "تنطلق سنويًا مع بداية الموسم الدراسي لتجهيز الطلاب قبل اليوم الأول للدراسة وضمان حضورهم بثقة وكرامة.",
    answer_en: "It launches every year at the start of the school season to equip students before day one.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "campaign-athar",
    question_ar: "ماذا تشمل الحقيبة المدرسية في حملة أثر؟",
    question_en: "What does the school bag include?",
    answer_ar: "حقيبة مدرسية متينة ومجهزة بالكامل بأفضل أدوات الكتابة والرسم والكراسات، لتلبي احتياجات الطالب طوال العام الدراسي.",
    answer_en: "A sturdy, fully equipped school bag with the best writing and drawing tools to meet the student's needs throughout the year.",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "campaign-athar",
    question_ar: "ما هي مبادرة استدامة لتجميع الكتب المدرسية؟",
    question_en: "What is the Istidama initiative?",
    answer_ar: "مبادرة لجمع الكتب الدراسية المستعملة وإعادة تدويرها لتصل لطلاب غير قادرين على شرائها، مع رسالة تشجيعية بخط يد الطالب المتبرع في أول صفحة لزرع التكافل والأخوة.",
    answer_en: "An initiative to collect used school books and recycle them so they reach students who cannot afford them, with a handwritten encouraging note from the donor student on the first page.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "campaign-athar",
    question_ar: "هل يمكنني دفع مصروفات طالب غير قادر بالكامل؟",
    question_en: "Can I pay a student's school fees?",
    answer_ar: "نعم، تكفل الحملة المصاريف المدرسية للطلاب العاجزين عن سدادها لضمان استمرارهم في التعليم ومنع تسربهم من المدارس.",
    answer_en: "Yes. The campaign sponsors school fees for students unable to pay, so they stay in school and do not drop out.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "campaign-athar",
    question_ar: "ما هي الحضانات النموذجية التابعة للمؤسسة؟",
    question_en: "What nurseries does the foundation operate?",
    answer_ar: "حضانة أبي بكر الصديق، وحضانة الفاروق عمر، وحضانة أثر (الجاري تجهيزها لتكون منارة تعليمية جديدة).",
    answer_en: "Abu Bakr Al-Siddiq Nursery, Al-Farouq Omar Nursery, and Athar Nursery (under construction and equipping).",
    sort_order: 6,
    is_active: true,
  },

  // ─── 17. Campaign Arboun Kheir (عربون خير — الفريلانسرز) ───
  {
    pageCategory: "campaign-arboun-kheir",
    question_ar: "ما مبادرة عربون خير للفريلانسرز؟",
    question_en: "What is the Arboun Kheir initiative for freelancers?",
    answer_ar: "مبادرة «عربون خير» تشجّع الشباب العاملين في العمل الحر (الفريلانس) على استقطاع نسبة مرنة من أرباح كل مشروع يسلّمونه، وتوجيهها صدقةً لدعم الأسر المحتاجة، طلبًا للبركة وتخفيفًا لقلق العمل وضغوطه.",
    answer_en: "The 'Arboun Kheir' initiative encourages young people working in freelancing to set aside a flexible percentage of the earnings of every delivered project and direct it as charity to support families in need, aiming to bring blessing and ease work anxiety and pressure.",
    sort_order: 1,
    is_active: true,
  },
  {
    pageCategory: "campaign-arboun-kheir",
    question_ar: "هل يوجد حد أدنى للتبرع من أرباح المشاريع في عربون خير؟",
    question_en: "Is there a minimum donation from project earnings?",
    answer_ar: "لا يوجد حد أدنى. يمكنك التبرع بأي مبلغ أو نسبة تراها مناسبة من أرباح مشروعك (مثل 1% أو 5%). الهدف هو الاستمرارية وجعل الصدقة عادة تطمئن قلبك وترتبط بنجاحك.",
    answer_en: "There is no minimum. You can donate any amount or percentage you see fit from your project's earnings (such as 1% or 5%). The aim is consistency and making charity a habit that reassures your heart and is tied to your success.",
    sort_order: 2,
    is_active: true,
  },
  {
    pageCategory: "campaign-arboun-kheir",
    question_ar: "كيف يؤثر التبرع على عملي واستقراري كفريلانسر؟",
    question_en: "How does donating affect my work as a freelancer?",
    answer_ar: "إخراج الصدقات يُعد «زكاة للمهنة»، وهو سبب مباشر في تخفيف ضغوط العمل، وتبديد الخوف من ركود السوق، وتيسير التعامل مع العملاء. قال ﷺ: «ما نقص مال من صدقة».",
    answer_en: "Giving charity is considered 'zakat for the profession,' and is a direct reason for easing work pressure, dispelling fear of market slumps, and making dealing with clients easier. 'Wealth never decreases because of charity.'",
    sort_order: 3,
    is_active: true,
  },
  {
    pageCategory: "campaign-arboun-kheir",
    question_ar: "أين تذهب تبرعات مبادرة عربون خير؟",
    question_en: "Where do Arboun Kheir donations go?",
    answer_ar: "يتم توجيه التبرعات لتنفيذ مشاريع حقيقية تحت مظلة مؤسسة اليسر الخيرية (ترخيص 2665 لسنة 2019)، وتشمل تيسير زواج الفتيات بالأجهزة المعمرة، وكفالة الأيتام، ووصلات المياه وتسقيف المنازل، ودعم تعليم الأطفال.",
    answer_en: "Donations are directed to real projects under the umbrella of Al-Yusr Charity Foundation (licence No. 2665 of 2019), including marriage support for girls, orphan sponsorship, ongoing charity such as water connections and house roofing, and children's education support.",
    sort_order: 4,
    is_active: true,
  },
  {
    pageCategory: "campaign-arboun-kheir",
    question_ar: "هل يمكنني التبرع بعملات أجنبية إذا كنت أعمل مع عملاء من الخارج؟",
    question_en: "Can I donate in foreign currencies if I work with clients abroad?",
    answer_ar: "نعم بالتأكيد. إذا كنت تتلقى أرباحك بالدولار أو الريال السعودي أو أي عملة أخرى، يمكنك تحويل تبرعك بكل سهولة عبر بوابات الدفع الإلكترونية الآمنة المتاحة على موقعنا.",
    answer_en: "Yes, absolutely. If you receive your earnings in dollars, Saudi riyals or any other currency, you can easily transfer your donation through the secure online payment gateways available on our website.",
    sort_order: 5,
    is_active: true,
  },
  {
    pageCategory: "campaign-arboun-kheir",
    question_ar: "ما معنى اسم «عربون خير»؟",
    question_en: "What does 'Arboun Kheir' mean?",
    answer_ar: "«العربون» هو دفعة مقدمة؛ والمقصود أن تُخرج جزءًا من أرباح مشروعك صدقةً اليوم، كأنه دفعة مقدمة تتفاءل بها برزق الغد وبركته وتوسعة أعمالك.",
    answer_en: "'Arboun' means a down payment; the idea is to give a part of your project's earnings as charity today, like an advance payment, hopeful for tomorrow's provision and blessing.",
    sort_order: 6,
    is_active: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all FAQ categories from the backend (/faq-categories)
 * Falls back to FAQ_PAGE_CATEGORIES if empty or offline.
 */
export async function fetchFaqCategories(): Promise<FaqCategory[]> {
  try {
    const res = await apiFetch<{ data: FaqCategory[] }>("/faq-categories", {
      useCache: true,
    });
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn("Using local FAQ categories fallback:", err);
  }

  // Fallback to pre-configured page categories
  return FAQ_PAGE_CATEGORIES.map((c, index) => ({
    id: index + 100,
    name_ar: c.name_ar,
    name_en: c.name_en,
    slug: c.slug,
    sort_order: c.sort_order,
    is_active: true,
    faqs_count: DEFAULT_STATIC_FAQS.filter((f) => f.pageCategory === c.slug).length,
  }));
}

/**
 * Fetch all FAQs from the backend (/faqs).
 * Optionally filters by categorySlug or categoryId or search query.
 */
export async function fetchFaqs(options?: {
  categorySlug?: string;
  categoryId?: number;
  search?: string;
}): Promise<FaqItem[]> {
  const { categorySlug, categoryId, search } = options || {};

  try {
    const params: Record<string, string | number> = {};
    if (categoryId) params.faq_category_id = categoryId;
    // One category: filtered by the server (the client-side filter below stays as a safety net).
    if (categorySlug && categorySlug !== "all") params.category = categorySlug;
    if (search) params.search = search;

    const res = await apiFetch<{ data: FaqItem[] }>("/faqs", {
      params,
      useCache: true,
    });

    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      let items = res.data;

      // Filter by category slug if requested
      if (categorySlug && categorySlug !== "all") {
        const wanted = categorySlug.toLowerCase();
        const filtered = items.filter((f) => f.category?.slug?.toLowerCase() === wanted);

        if (filtered.length > 0) {
          return filtered;
        }
      } else {
        return items;
      }
    }
  } catch (err) {
    console.warn("Using local FAQs fallback for:", categorySlug, err);
  }

  // Graceful Fallback to curated static data
  let result: FaqItem[] = DEFAULT_STATIC_FAQS.map((item, idx) => ({
    id: `static-${idx + 1}`,
    ...item,
  }));

  if (categorySlug && categorySlug !== "all") {
    result = result.filter((item) => item.pageCategory === categorySlug);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.question_ar.toLowerCase().includes(q) ||
        item.answer_ar.toLowerCase().includes(q) ||
        (item.question_en && item.question_en.toLowerCase().includes(q)) ||
        (item.answer_en && item.answer_en.toLowerCase().includes(q))
    );
  }

  return result;
}

/**
 * Admin list: GET /faqs (+ /faq-categories) with NO static fallback.
 * Throws on failure so the admin screen shows a real error instead of uneditable demo rows.
 */
export async function fetchFaqsAdmin(): Promise<FaqItem[]> {
  return fetchList<FaqItem>("/faqs", { per_page: 500 });
}

/** Admin categories: GET /faq-categories, throws on failure (no fake ids). */
export async function fetchFaqCategoriesAdmin(): Promise<FaqCategory[]> {
  return fetchList<FaqCategory>("/faq-categories", { per_page: 200 });
}

/** Create new FAQ item on backend */
export async function createFaq(data: {
  faq_category_id?: number | null;
  question_ar: string;
  question_en?: string;
  answer_ar: string;
  answer_en?: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<FaqItem> {
  const res = await apiFetch<unknown>("/faqs", {
    method: "POST",
    body: data,
  });
  invalidateApiCache("/faqs");
  invalidateApiCache("/faq-categories");
  return unwrapItem<FaqItem>(res);
}

/** Update existing FAQ item on backend */
export async function updateFaq(
  id: number | string,
  data: Partial<{
    faq_category_id: number | null;
    question_ar: string;
    question_en: string;
    answer_ar: string;
    answer_en: string;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<FaqItem> {
  if (String(id).startsWith("static-")) {
    throw new Error("هذا سؤال ثابت من كود الموقع وغير محفوظ في قاعدة البيانات");
  }
  const res = await apiFetch<unknown>(`/faqs/${id}`, {
    method: "PUT",
    body: data,
  });
  invalidateApiCache("/faqs");
  invalidateApiCache("/faq-categories");
  return unwrapItem<FaqItem>(res);
}

/** Delete an FAQ item from backend */
export async function deleteFaq(id: number | string): Promise<boolean> {
  if (String(id).startsWith("static-")) {
    throw new Error("هذا سؤال ثابت من كود الموقع وغير محفوظ في قاعدة البيانات");
  }
  await apiFetch(`/faqs/${id}`, {
    method: "DELETE",
  });
  invalidateApiCache("/faqs");
  invalidateApiCache("/faq-categories");
  return true;
}

/** Create a FAQ category on backend */
export async function createFaqCategory(data: {
  name_ar: string;
  name_en?: string;
  slug?: string;
  sort_order?: number;
  is_active?: boolean;
}): Promise<FaqCategory> {
  const res = await apiFetch<unknown>("/faq-categories", {
    method: "POST",
    body: data,
  });
  invalidateApiCache("/faq-categories");
  return unwrapItem<FaqCategory>(res);
}

/**
 * Seed all default static page categories and questions to the Laravel Backend!
 * Can be triggered from the admin dashboard with one click.
 */
export async function seedDefaultFaqsToBackend(
  onProgress?: (message: string, current: number, total: number) => void
): Promise<{ categoriesCreated: number; faqsCreated: number; failed: number; lastError?: string }> {
  let categoriesCreated = 0;
  let faqsCreated = 0;
  let failed = 0;
  let lastError: string | undefined;

  // 1. Fetch existing categories (a failure aborts: seeding blindly would create duplicates)
  const existingCats: FaqCategory[] = unwrapList<FaqCategory>(
    await apiFetch<unknown>("/faq-categories", { useCache: false, params: { per_page: 200 } }),
  );

  const categoryMap = new Map<string, number>();
  existingCats.forEach((c) => {
    categoryMap.set(c.slug.toLowerCase(), c.id);
  });

  // 2. Create missing categories
  const totalSteps = FAQ_PAGE_CATEGORIES.length + DEFAULT_STATIC_FAQS.length;
  let step = 0;

  for (const pageCat of FAQ_PAGE_CATEGORIES) {
    step++;
    onProgress?.(`فحص تصنيف: ${pageCat.name_ar}`, step, totalSteps);

    if (!categoryMap.has(pageCat.slug.toLowerCase())) {
      try {
        const created = await createFaqCategory({
          name_ar: pageCat.name_ar,
          name_en: pageCat.name_en,
          slug: pageCat.slug,
          sort_order: pageCat.sort_order,
          is_active: true,
        });
        if (created?.id) {
          categoryMap.set(pageCat.slug.toLowerCase(), created.id);
          categoriesCreated++;
        }
      } catch (err) {
        failed++;
        lastError = apiErrorMessage(err);
      }
    }
  }

  // 3. Fetch existing FAQs to avoid exact duplicates (a failure aborts)
  const existingFaqs: FaqItem[] = unwrapList<FaqItem>(
    await apiFetch<unknown>("/faqs", { useCache: false, params: { per_page: 500 } }),
  );

  const existingQuestions = new Set(
    existingFaqs.map((f) => f.question_ar.trim().toLowerCase())
  );

  // 4. Create missing FAQs
  for (const item of DEFAULT_STATIC_FAQS) {
    step++;
    onProgress?.(`إضافة سؤال: ${item.question_ar.slice(0, 30)}...`, step, totalSteps);

    if (existingQuestions.has(item.question_ar.trim().toLowerCase())) {
      continue;
    }

    const catId = item.pageCategory ? categoryMap.get(item.pageCategory.toLowerCase()) : null;

    try {
      await createFaq({
        faq_category_id: catId || null,
        question_ar: item.question_ar,
        question_en: item.question_en || undefined,
        answer_ar: item.answer_ar,
        answer_en: item.answer_en || undefined,
        sort_order: item.sort_order || 1,
        is_active: true,
      });
      faqsCreated++;
    } catch (err) {
      failed++;
      lastError = apiErrorMessage(err);
    }
  }

  invalidateApiCache("/faqs");
  invalidateApiCache("/faq-categories");

  return { categoriesCreated, faqsCreated, failed, lastError };
}

/**
 * Returns the default FAQs for a specific campaign from the official PDF dataset
 */
export function getCampaignDefaultFaqs(slugOrKey: string): Omit<FaqItem, "id">[] {
  if (!slugOrKey) return [];
  const s = slugOrKey.toLowerCase();
  let targetCategory = "";
  if (s.includes("zell") || s.includes("ظل")) targetCategory = "campaign-zell";
  else if (s.includes("sitr") || s.includes("ستر")) targetCategory = "campaign-sitr";
  else if (s.includes("marko") || s.includes("مركون")) targetCategory = "campaign-markoon";
  else if (s.includes("ramadan") || s.includes("رمضان")) targetCategory = "campaign-ramadan";
  else if (s.includes("athar") || s.includes("أثر") || s.includes("اثر")) targetCategory = "campaign-athar";
  else if (s.includes("arboun") || s.includes("عربون")) targetCategory = "campaign-arboun-kheir";

  if (!targetCategory) return [];
  return DEFAULT_STATIC_FAQS.filter((f) => f.pageCategory === targetCategory);
}
