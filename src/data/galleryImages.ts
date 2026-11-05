import family from "@/assets/family-hope.webp";
import hands from "@/assets/hands-sprout.jpg";
import hero from "@/assets/hero-child.jpg";
import edu from "@/assets/program-education.jpg";
import orph from "@/assets/program-orphans.jpg";
import food from "@/assets/program-food.jpg";
import health from "@/assets/program-health.webp";
import happy from "@/assets/hero-happy-family-new.png";
import sad from "@/assets/hero-sad.jpg";
import odhya from "@/assets/poster-odhya.webp";
import box from "@/assets/poster-box.png";
import water from "@/assets/poster-water.png";
import bride from "@/assets/poster-bride.webp";
import posterEdu from "@/assets/poster-education.png";
import posterMeat from "@/assets/poster-meat.webp";
import posterVol from "@/assets/poster-volunteer.png";
import posterVolField from "@/assets/poster-volunteer-field.webp";
import posterZakat from "@/assets/poster-zakat.png";
import yusrBride from "@/assets/yusr-bride.png";
import yusrOrphansMeals from "@/assets/yusr-orphans-meals.webp";
import yusrWater from "@/assets/yusr-water.png";
import qurbaniMeat from "@/assets/qurbani-meat-quality.webp";
import qurbaniTrust from "@/assets/qurbani-trusted-source.webp";
import farmHero from "@/assets/farm-hero.jpg";
import classroom from "@/assets/brand-poster-classroom.webp";
import markounFurniture from "@/assets/markoun-poster-furniture.webp";
import posterMedBottle from "@/assets/markoun-poster-medbottle.png";
import posterDelivery from "@/assets/markoun-poster-delivery.png";
import posterClothes from "@/assets/markoun-poster-clothes.webp";
import markounWardrobe from "@/assets/marqqqqqun.jpg";
import markounPuzzle from "@/assets/markoun-poster-furniture.webp";
import fQ24Tray from "@/assets/field/qurbani-2024-meat-tray.jpg";
import fQ24Cattle from "@/assets/field/qurbani-2024-cattle-truck.jpg";
import fQ24Pack from "@/assets/field/qurbani-2024-packing-area.jpg";
import fQ25A from "@/assets/field/qurbani-2025-prep-a.jpg";
import fQ25B from "@/assets/field/qurbani-2025-prep-b.jpg";
import fQ25C from "@/assets/field/qurbani-2025-prep-c.jpg";
import fC26Road from "@/assets/field/convoy-2026-fuwah-road.jpg";
import fC26Pickup from "@/assets/field/convoy-2026-pickup-loaded.jpg";
import fC26Night from "@/assets/field/convoy-2026-night-delivery.jpg";
import fQ24Pen from "@/assets/field/qurbani-2024-cattle-pen.jpg";
import fC26Day from "@/assets/field/convoy-2026-day-distribution.jpg";
import fC26NightHand from "@/assets/field/convoy-2026-night-handover.jpg";
import fC26Elder from "@/assets/field/convoy-2026-elder-handover.jpg";

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  altAr: string;
  category: "families" | "qurbani" | "education" | "health" | "water" | "campaigns";
  programSlug?: string;
  city?: string;
  donateProgram?: string;
};

export const GALLERY_STATIC_IMAGES: GalleryImage[] = [
  { id: "g-038", src: fC26Elder, alt: "Al-Yusr volunteer hands a food box to an elderly woman with dignity — Mansoura 2026", altAr: "متطوع اليسر يسلّم كرتونة العزومة لسيدة كبيرة في السن بكرامة — المنصورة 2026", category: "families", donateProgram: "box", city: "Mansoura" },
  { id: "g-037", src: fC26NightHand, alt: "Night handover of relief bags to an eligible woman from Al-Yusr van — Dakahlia 2026", altAr: "تسليم أكياس المساعدات لسيدة مستحقة من سيارة اليسر ليلًا بقرى الدقهلية 2026", category: "families", donateProgram: "box", city: "Dakahlia" },
  { id: "g-036", src: fC26Day, alt: "Food box daytime distribution to families — Kafr El-Sheikh villages, Al-Yusr convoy 2026", altAr: "توزيع نهاري لكراتين العزومة على الأسر بقرى كفر الشيخ — قافلة اليسر 2026", category: "families", donateProgram: "box", city: "Kafr El-Sheikh" },
  { id: "g-034", src: fC26Night, alt: "Al-Yusr volunteer delivering aid at night — Dakahlia villages", altAr: "متطوع اليسر يسلم المساعدات ليلًا لأسرة بقرى الدقهلية", category: "families", donateProgram: "box", city: "Dakahlia" },
  { id: "g-033", src: fC26Pickup, alt: "Al-Yusr van loaded with food boxes — relief campaign 2026", altAr: "سيارة اليسر محملة بكراتين العزومة وأكياس الإغاثة 2026", category: "families", donateProgram: "box" },
  { id: "g-032", src: fC26Road, alt: "Al-Yusr 2026 convoy — Mansoura to Kafr El-Sheikh & Rasheed", altAr: "قافلة اليسر 2026 — من المنصورة إلى كفر الشيخ ورشيد", category: "families", donateProgram: "box", city: "Kafr El-Sheikh" },
  { id: "g-035", src: fQ24Pen, alt: "Qurbani 2024 livestock inspection pen — Mansoura, vet supervision before slaughter", altAr: "حظيرة معاينة ماشية الأضحية 2024 — المنصورة بإشراف بيطري قبل الذبح", category: "qurbani", donateProgram: "odhya", city: "Mansoura" },
  { id: "g-031", src: fQ25C, alt: "Qurbani 2025 documentation — photo and video proof per donor", altAr: "توثيق صك أضحية 2025 — صور وفيديو لكل متبرع", category: "qurbani", donateProgram: "odhya" },
  { id: "g-030", src: fQ25B, alt: "Qurbani 2025 meat distribution to Dakahlia families on Eid day", altAr: "توزيع لحوم أضحية 2025 على أسر الدقهلية يوم العيد", category: "qurbani", donateProgram: "odhya", city: "Dakahlia" },
  { id: "g-029", src: fQ25A, alt: "Al-Yusr Qurbani 2025 share ready for a Mansoura family", altAr: "صك أضحية 2025 جاهز لأسرة مستحقة بالمنصورة", category: "qurbani", donateProgram: "odhya", city: "Mansoura" },
  { id: "g-028", src: fQ24Pack, alt: "Qurbani 2024 hygienic cutting & packaging under vet supervision", altAr: "تجهيز وتغليف لحوم أضحية 2024 بإشراف بيطري", category: "qurbani", donateProgram: "odhya" },
  { id: "g-027", src: fQ24Cattle, alt: "Vaccinated Qurbani cattle 2024 — Mansoura slaughterhouse", altAr: "ماشية الأضحية 2024 محصنة قبل الذبح بمسلخ المنصورة", category: "qurbani", donateProgram: "odhya", city: "Mansoura" },
  { id: "g-026", src: fQ24Tray, alt: "Al-Yusr Qurbani 2024 — fresh local meat tray, Dakahlia", altAr: "صك أضحية اليسر 2024 — لحم بلدي طازج بالدقهلية", category: "qurbani", donateProgram: "odhya", city: "Mansoura" },
  { id: "markoun-01", src: markounFurniture, alt: "Markoun delivery — donated furniture and repaired home items to a Dakahlia family", altAr: "تسليم حملة مركون — أثاث وتفاصيل منزلية مجددة لأسرة بالدقهلية", category: "campaigns", programSlug: "markoun", donateProgram: "markoun", city: "Mansoura" },
  { id: "markoun-02", src: posterMedBottle, alt: "Markoun — medication poster (replacement)", altAr: "بوستر حملة مركون — علاج شهري (بديل)", category: "campaigns", programSlug: "markoun", donateProgram: "markoun", city: "Mansoura" },
  { id: "markoun-03", src: posterDelivery, alt: "Markoun — delivery poster (replacement)", altAr: "بوستر حملة مركون — استلام وتوصيل (بديل)", category: "campaigns", programSlug: "markoun", donateProgram: "markoun", city: "Mit Ghamr" },
  { id: "markoun-04", src: posterClothes, alt: "Markoun — stipend/poster alternative", altAr: "بوستر حملة مركون — مرتب شهري (بديل)", category: "campaigns", programSlug: "markoun", donateProgram: "markoun", city: "Talkha" },
  { id: "markoun-05", src: markounWardrobe, alt: "Markoun wardrobe setup — clothing and home essentials for a child", altAr: "تجهيز خزانة مركون — ملابس واحتياجات منزلية لطفل", category: "campaigns", programSlug: "markoun", donateProgram: "markoun", city: "Belqas" },
  { id: "markoun-06", src: markounPuzzle, alt: "Markoun campaign — refurbished home essentials and dignity delivery", altAr: "حملة مركون — أثاث مجدّد وكرامة توصل للبيت", category: "campaigns", programSlug: "markoun", donateProgram: "markoun" },
  { id: "g-001", src: family, alt: "Family of beneficiaries — Mansoura, Dakahlia", altAr: "أسرة من المستفيدين — المنصورة، الدقهلية", category: "families", city: "Mansoura", donateProgram: "box" },
  { id: "g-002", src: hands, alt: "Hands holding a sprout — hope grows", altAr: "أيادٍ تحمل برعمًا — الأمل ينمو", category: "campaigns" },
  { id: "g-003", src: hero, alt: "Smiling child after aid — Dakahlia", altAr: "طفل يبتسم بعد وصول المساعدة — الدقهلية", category: "families", city: "Dakahlia", donateProgram: "education" },
  { id: "g-004", src: edu, alt: "Education project — schoolchildren in Mit Ghamr", altAr: "مشروع التعليم — طلاب مدرسة بميت غمر", category: "education", city: "Mit Ghamr", donateProgram: "education" },
  { id: "g-005", src: orph, alt: "Orphan sponsorship — kids in Sinbillawayn", altAr: "كفالة أيتام — أطفال السنبلاوين", category: "families", city: "Sinbillawayn", donateProgram: "education" },
  { id: "g-006", src: food, alt: "Food box distribution — Sherbin", altAr: "توزيع كرتونة عزومة — شربين", category: "families", city: "Sherbin", donateProgram: "box" },
  { id: "g-007", src: health, alt: "Healing & medicine program — Belqas", altAr: "برنامج شفاء ودواء — بلقاس", category: "health", city: "Belqas", donateProgram: "treatment" },
  { id: "g-008", src: happy, alt: "Happy family after Eid Qurbani 2026", altAr: "عائلة سعيدة بعد أضحية العيد 2026", category: "qurbani", donateProgram: "odhya" },
  { id: "g-009", src: sad, alt: "Family before aid arrived — case study", altAr: "عائلة قبل وصول المساعدة — حالة موثّقة", category: "families", donateProgram: "box" },
  { id: "g-010", src: odhya, alt: "Qurbani Eid 2026 campaign poster", altAr: "بوستر حملة أضحية العيد 2026", category: "qurbani", donateProgram: "odhya" },
  { id: "g-011", src: box, alt: "Eid feast box campaign poster", altAr: "بوستر حملة كرتونة عزومة العيد", category: "campaigns", donateProgram: "box" },
  { id: "g-012", src: water, alt: "Water connection campaign poster — Dakahlia villages", altAr: "بوستر حملة وصلات المياه — قرى الدقهلية", category: "water", donateProgram: "water" },
  { id: "g-013", src: bride, alt: "Marriage support for orphan brides — Al-Yusr", altAr: "تيسير زواج اليتيمات — الفرحة صارت فرحتين", category: "campaigns", donateProgram: "bride" },
  { id: "g-014", src: yusrBride, alt: "Bride trousseau handover ceremony", altAr: "تجهيز عروسة يتيمة — تسليم الجهاز", category: "families", donateProgram: "bride" },
  { id: "g-015", src: posterEdu, alt: "Education sponsorship poster — 354 students", altAr: "بوستر كفالة التعليم — 354 طالبًا", category: "education", donateProgram: "education" },
  { id: "g-016", src: classroom, alt: "Classroom of sponsored students — Mansoura", altAr: "فصل دراسي لطلاب الكفالة — المنصورة", category: "education", city: "Mansoura", donateProgram: "education" },
  { id: "g-017", src: yusrOrphansMeals, alt: "Hot meals served to orphans by Al-Yusr kitchen", altAr: "وجبات ساخنة للأيتام من مطبخ اليسر", category: "families", donateProgram: "kitchen" },
  { id: "g-018", src: posterMeat, alt: "Fresh meat distribution poster — Al-Yusr farm", altAr: "بوستر توزيع لحوم بلدي — مزرعة اليسر الوقفية", category: "campaigns", donateProgram: "box" },
  { id: "g-019", src: qurbaniMeat, alt: "Quality cuts from Al-Yusr endowment farm", altAr: "جودة لحوم الأضاحي من مزرعة اليسر الوقفية", category: "qurbani", donateProgram: "odhya" },
  { id: "g-020", src: qurbaniTrust, alt: "Trusted source — livestock from our own farm", altAr: "مصدر موثوق — مواشٍ من مزارعنا", category: "qurbani", donateProgram: "odhya" },
  { id: "g-021", src: yusrWater, alt: "Water connection installed in a village home", altAr: "وصلة مياه مركّبة في منزل بقرية نائية", category: "water", donateProgram: "water" },
  { id: "g-022", src: farmHero, alt: "Al-Yusr endowment farm — livestock & feed", altAr: "مزرعة اليسر الوقفية — المواشي والأعلاف", category: "campaigns", donateProgram: "box" },
  { id: "g-023", src: posterZakat, alt: "Zakat 2026 — calculate and channel", altAr: "زكاة 2026 — احسبها واصرفها", category: "campaigns", donateProgram: "zakat" },
  { id: "g-024", src: posterVol, alt: "Volunteer with Al-Yusr — open call", altAr: "تطوع مع اليسر — دعوة مفتوحة", category: "campaigns" },
  { id: "g-025", src: posterVolField, alt: "Volunteer convoy in the field", altAr: "قافلة تطوع في الميدان", category: "campaigns" },
];

export const GALLERY_IMAGES = GALLERY_STATIC_IMAGES;
