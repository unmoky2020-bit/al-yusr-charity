/**
 * The foundation's name, address, phone and hours in one place (NAP). Local search ranks a place
 * higher when these are identical everywhere: this site, Google Business Profile, Facebook and
 * directories. Change them here only, and copy the same text to the Google profile.
 */
export const ORG = {
  nameAr: "مؤسسة اليسر الخيرية",
  nameEn: "Al-Yusr Charity Foundation",
  registrationAr: "مشهرة برقم 2665 لسنة 2019 — وزارة التضامن الاجتماعي",
  registrationEn: "Registered NGO No. 2665 of 2019 — Ministry of Social Solidarity",
  addressAr: "المنصورة، تقسيم خطاب، بجوار وكالة المنصورة",
  addressEn: "Mansoura, Khattab District, next to Mansoura Agency",
  cityAr: "المنصورة",
  governorateAr: "الدقهلية",
  postalCode: "35511",
  phoneE164: "+201097000137",
  phoneDisplay: "0109 700 0137",
  whatsapp: "201097000137",
  email: "info@elyusr.org",
  geo: { lat: 31.0298521, lng: 31.3655258 },
  mapsUrl: "https://maps.app.goo.gl/VYc3KdxrU1DQWwFf6",
  mapsEmbed:
    "https://maps.google.com/maps?q=31.0298521,31.3655258+(%D9%85%D8%A4%D8%B3%D8%B3%D8%A9%20%D8%A7%D9%84%D9%8A%D8%B3%D8%B1%20%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%D9%8A%D8%A9)&t=&z=16&ie=UTF8&iwloc=B&output=embed",
  /** Landmark from the Google Business Profile address. */
  landmarkAr: "أمام المصرية الكندية للمطابخ",
  landmarkEn: "opposite Egyptian Canadian Kitchens",
  /** Google Maps plus code of the office. */
  plusCode: "29H8+W6 المنصورة",
  /**
   * Same hours as the Google Business Profile (confirmed 2026-11-03): Saturday to Thursday 10:00–21:00,
   * Friday closed (no opening hours are published for it).
   */
  hours: {
    days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const,
    opens: "10:00",
    closes: "21:00",
    labelAr: "السبت – الخميس: 10 ص – 9 م (الجمعة إجازة)",
    labelEn: "Sat – Thu: 10am – 9pm (closed Friday)",
  },
  /**
   * The «write a review» link from the Google Business Profile (Reviews ← Get more reviews ← copy link).
   * Until it is filled in, the review buttons open the Maps profile, which has a «Write a review» button.
   */
  reviewUrl: "",
} as const;

/** Where «قيّمنا على جوجل» goes. */
export const googleReviewLink = () => ORG.reviewUrl || ORG.mapsUrl;

export const whatsappLink = (text: string) => `https://wa.me/${ORG.whatsapp}?text=${encodeURIComponent(text)}`;
