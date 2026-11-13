import type { AboutTeaserBlock } from "@/data/siteBlocks";

/** Built-in copy of the home page's «من نحن» section (used until the dashboard saves its own). */
export const ABOUT_TEASER_DEFAULT: Required<Omit<AboutTeaserBlock, "stops">> & { stops: NonNullable<AboutTeaserBlock["stops"]> } = {
  title_ar: "بدأنا فريقًا للخير، ثم أصبحنا مؤسسة مشهرة",
  title_en: "We began as a team for good and grew into a registered foundation",
  text_ar: "بدأت اليسر فريقًا اجتمع على عمل الخير وخدمة الأسر المستحقة. ومع اتساع العمل تأسست مؤسسة مشهرة رسميًا بوزارة التضامن الاجتماعي برقم 2665 لسنة 2019، لكي ينمو الخير بنظام وحوكمة وشفافية. وما زالت المسيرة مستمرة.",
  text_en: "Al-Yusr began as a team that came together to do good and serve families in need. As the work grew, it became a foundation officially registered with the Ministry of Social Solidarity (No. 2665, 2019), so the good could grow with order, governance and transparency. The journey continues.",
  stops: [
    { year: "2019", title_ar: "الإشهار الرسمي", title_en: "Official registration", text_ar: "مؤسسة مشهرة في أكتوبر 2019 برقم 2665 بوزارة التضامن الاجتماعي.", text_en: "Registered in October 2019 as foundation No. 2665 with the Ministry of Social Solidarity." },
    { year: "2020", title_ar: "منظومة متكاملة للعطاء", title_en: "A complete system of giving", text_ar: "بداية العمل على محاور الغذاء والتعليم والصحة لخدمة الأسر المستحقة.", text_en: "Work began on the food, education and health pillars for families in need." },
    { title_ar: "والمسيرة مستمرة", title_en: "And the journey continues", text_ar: "تتوسع المؤسسة ويستمر عطاؤها بانضمامك إلينا أو بتبرعك.", text_en: "The foundation grows and lasts as you join us or give." },
  ],
};
