import type { CampaignDoc, MailBlock } from "@/data/api/newsletterCampaignsApi";

/** Email images the site serves at /email/ (sized 1200×600 for mail apps). */
export const EMAIL_HEROES: { url: string; label: string }[] = [
  { url: "/email/hero-food.jpg", label: "كرتونة الخير" },
  { url: "/email/hero-water.jpg", label: "سقيا الماء" },
  { url: "/email/hero-orphans.jpg", label: "الأيتام" },
  { url: "/email/hero-sprout.jpg", label: "صدقة جارية" },
  { url: "/email/hero-misbaha.jpg", label: "السبحة" },
  { url: "/email/hero-volunteers.jpg", label: "المتطوعين" },
  { url: "/email/hero-farm.jpg", label: "المزرعة" },
];

export const BLOCK_LABELS: Record<MailBlock["type"], string> = {
  heading: "عنوان فرعي",
  text: "فقرة",
  list: "قائمة نقاط",
  image: "صورة",
  button: "زرار",
  note: "ملحوظة",
  quote: "آية / دعاء / اقتباس",
  divider: "خط فاصل",
  spacer: "مسافة",
  stats: "أرقام",
  card: "بطاقة",
  cards: "بطاقتين جنب بعض",
  html: "HTML قديم",
};

export function newBlock(type: MailBlock["type"]): MailBlock {
  switch (type) {
    case "heading": return { type, text: "عنوان فرعي" };
    case "text": return { type, text: "" };
    case "list": return { type, items: ["", ""] };
    case "image": return { type, url: "", alt: "" };
    case "button": return { type, label: "تبرع الآن", url: "https://elyusr.org/donate" };
    case "note": return { type, text: "" };
    case "quote": return { type, text: "«ما نقصت صدقة من مال»", by: "رواه مسلم" };
    case "divider": return { type };
    case "spacer": return { type, size: 16 };
    case "stats": return { type, items: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }] };
    case "card": return { type, title: "", text: "", url: "", cta: "تبرع الآن" };
    case "cards": return { type, items: [{ title: "", url: "", cta: "ساهم" }, { title: "", url: "", cta: "ساهم" }] };
    case "html": return { type, html: "" };
  }
}

/** Ready layouts to start a newsletter from. */
export const STARTERS: { id: string; name: string; hint: string; subject: string; doc: CampaignDoc }[] = [
  {
    id: "impact",
    name: "أخبار الأثر",
    hint: "اللي حصل الشهر ده بالأرقام والصور",
    subject: "أثرك الشهر ده: أسر اتخدمت وآبار اتحفرت 🌿",
    doc: {
      title: "أثرك الشهر ده",
      eyebrow: "نشرة اليسر · أخبار الأثر",
      hero: { image: "/email/hero-food.jpg", alt: "توزيع كراتين الخير" },
      items: [
        { type: "text", text: "**أهلًا بيك،**" },
        { type: "text", text: "اكتب هنا ملخص الشهر. الأرقام تحت اكتبها من تقارير التوزيع الحقيقية:" },
        { type: "stats", items: [{ value: "", label: "كرتونة خير" }, { value: "", label: "بئر مياه" }, { value: "", label: "يتيم مكفول" }] },
        { type: "heading", text: "قصة من الميدان" },
        { type: "text", text: "اكتب هنا قصة قصيرة لأسرة أو طفل، وإيه اللي اتغير في حياتهم." },
        { type: "button", label: "اقرأ القصص كلها", url: "https://elyusr.org/stories" },
        { type: "divider" },
        { type: "heading", text: "كمّل الأثر" },
        { type: "cards", items: [
          { title: "سقيا الماء", text: "كوب مياه نضيفة لبيت في قرية.", image: "/email/hero-water.jpg", url: "https://elyusr.org/water", cta: "اسقِ عطشان", badge: "صدقة جارية" },
          { title: "كفالة يتيم", text: "مصاريف شهرية ورعاية لطفل.", image: "/email/hero-orphans.jpg", url: "https://elyusr.org/programs/orphans", cta: "اكفل يتيم" },
        ] },
      ],
    },
  },
  {
    id: "urgent",
    name: "حملة عاجلة",
    hint: "حالة أو حملة محتاجة دعم دلوقتي",
    subject: "محتاجين دعمك النهارده",
    doc: {
      title: "محتاجين دعمك النهارده",
      eyebrow: "حملة عاجلة",
      hero: { image: "/email/hero-sprout.jpg", alt: "" },
      items: [
        { type: "text", text: "**أهلًا بيك،**" },
        { type: "text", text: "اكتب هنا الاحتياج باختصار: مين، وإيه المطلوب، وليه دلوقتي." },
        { type: "card", title: "اسم الحملة", text: "سطرين عن الحملة.", image: "/email/hero-water.jpg", url: "https://elyusr.org/campaigns", cta: "ساهم الآن", badge: "عاجل" },
        { type: "button", label: "تبرع الآن", url: "https://elyusr.org/donate", align: "center" },
        { type: "note", text: "كل جنيه بيوصل، وهنبعتلك صور التسليم." },
      ],
    },
  },
  {
    id: "thanks",
    name: "شكر وتقرير",
    hint: "بعد حملة أو موسم: شكر وأرقام وصور",
    subject: "شكرًا ليك: ده اللي عملناه سوا",
    doc: {
      title: "شكرًا، ده اللي عملناه سوا",
      eyebrow: "تقرير الحملة",
      hero: { image: "/email/hero-volunteers.jpg", alt: "فريق اليسر" },
      items: [
        { type: "text", text: "**جزاك الله خيرًا،**" },
        { type: "text", text: "الحملة خلصت، وده ملخص اللي وصل لأصحابه بفضل الله ثم بفضلك." },
        { type: "stats", items: [{ value: "", label: "أسرة" }, { value: "", label: "متطوع" }, { value: "", label: "قرية" }] },
        { type: "image", url: "/email/hero-food.jpg", alt: "من التوزيع", caption: "من يوم التوزيع" },
        { type: "quote", text: "اللهم تقبّل منا ومن كل من شارك." },
        { type: "button", label: "شوف صور التوزيع", url: "https://elyusr.org/gallery", variant: "secondary" },
      ],
    },
  },
  {
    id: "blank",
    name: "صفحة فاضية",
    hint: "ابدأ من الصفر",
    subject: "",
    doc: { title: "", eyebrow: "نشرة اليسر", hero: null, items: [{ type: "text", text: "" }] },
  },
];
