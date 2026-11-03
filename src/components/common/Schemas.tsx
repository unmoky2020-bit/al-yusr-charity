import { Helmet } from "react-helmet-async";
import { QURBANI_SEASON } from "@/data/qurbaniSeason";

/** Site-wide Organization, LocalBusiness & WebSite schema injection.
 * Targets the keyword "اليسر" for Egyptian search dominance.
 * Distinct from a local electronics brand also called "اليسر".
 */
export const SiteSchemas = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["NGO", "Organization"],
          "@id": "https://elyusr.org/#org",
          name: "مؤسسة اليسر الخيرية",
          alternateName: [
            "اليسر",
            "مؤسسة اليسر",
            "جمعية اليسر",
            "اليسر الخيرية",
            "جمعية اليسر الخيرية",
            "مؤسسة اليسر المنصورة",
            "مؤسسة اليسر بالمنصورة",
            "اليسر المنصورة",
            "جمعية اليسر الخيرية المنصورة",
            "Al-Yusr",
            "Al-Yusr Charity",
            "Al-Yusr Charity Foundation",
            "Al-Yusr Foundation Mansoura",
            "Al-Yusr NGO Egypt",
            "Al-Yusr Mansoura"
          ],
          url: "https://elyusr.org/",
          logo: { "@type": "ImageObject", url: "https://elyusr.org/logo.png", width: 512, height: 512 },
          image: "https://elyusr.org/og-image.jpg",
          description: "مؤسسة اليسر الخيرية — مؤسسة خيرية مصرية مشهرة (رقم 2665) بالمنصورة، الدقهلية. تعمل في رعاية الأيتام والأرامل وتوزيع الصدقات والزكاة وصكوك الأضحية والمساعدات الشهرية للأسر المستحقة. مؤسسة اليسر هي المرجع الخيري الموثوق في المنصورة والدقهلية.",
          foundingDate: "2019",
          nonprofitStatus: "NonprofitType",
          taxID: "2665/2019",
          legalName: "مؤسسة اليسر الخيرية المشهرة برقم 2665 لسنة 2019",
          telephone: "+201097000137",
          email: "info@elyusr.org",
          address: {
            "@type": "PostalAddress",
            streetAddress: "تقسيم خطاب، بجوار وكالة المنصورة",
            addressLocality: "المنصورة",
            addressRegion: "الدقهلية",
            postalCode: "35511",
            addressCountry: "EG",
          },
          sameAs: [
            "https://facebook.com/Elyosr.Charity",
            "https://instagram.com/elyosr.charity",
            "https://wa.me/201097000137",
          ],
          areaServed: [
            { "@type": "AdministrativeArea", name: "محافظة الدقهلية" },
            { "@type": "City", name: "المنصورة" },
            { "@type": "Country", name: "مصر" },
          ],
          knowsAbout: [
            "اليسر", "مؤسسة اليسر", "مؤسسة خيرية بالمنصورة",
            "صدقة جارية", "زكاة المال", "كفالة أيتام", "صك أضحية",
            "كرتونة عيد", "توزيع لحوم", "إيواء أسر", "علاج مرضى",
            "تيسير زواج", "سقيا الماء", "تعليم وكفالة طلاب",
            "Zakat Egypt", "Qurbani Egypt", "Orphan Sponsorship Egypt",
          ],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "برامج مؤسسة اليسر الخيرية",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "صدقة جارية عبر الإنترنت", url: "https://elyusr.org/donate" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "صك أضحية الدقهلية", url: "https://elyusr.org/donate?program=odhya" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "كفالة يتيم شهرية", url: "https://elyusr.org/donate?program=orphans" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "زكاة المال", url: "https://elyusr.org/zakat" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "كرتونة عزومة العيد", url: "https://elyusr.org/donate?program=box" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "علاج وعمليات جراحية", url: "https://elyusr.org/donate?program=treatment" } },
            ]
          },
          potentialAction: [
            {
              "@type": "DonateAction",
              target: "https://elyusr.org/donate",
              name: "تبرع لمؤسسة اليسر الخيرية",
              description: "تبرع آمن عبر الإنترنت بكل طرق الدفع: فيزا، إنستاباي، فودافون كاش."
            }
          ]
        },
        {
          "@type": "LocalBusiness",
          "@id": "https://elyusr.org/#local",
          name: "مؤسسة اليسر الخيرية",
          alternateName: ["اليسر", "مؤسسة اليسر", "جمعية اليسر", "اليسر المنصورة", "مؤسسة اليسر المنصورة", "جمعية اليسر الخيرية بالمنصورة", "Al-Yusr Charity Mansoura"],
          parentOrganization: { "@id": "https://elyusr.org/#org" },
          description: "مؤسسة اليسر الخيرية — توزيع الصدقات والزكاة وصكوك الأضحية وكفالة الأيتام في المنصورة والدقهلية. رقم التسجيل 2665.",
          image: "https://elyusr.org/og-image.jpg",
          url: "https://elyusr.org/",
          telephone: "+201097000137",
          priceRange: "Free",
          address: {
            "@type": "PostalAddress",
            streetAddress: "تقسيم خطاب، بجوار وكالة المنصورة",
            addressLocality: "المنصورة",
            addressRegion: "الدقهلية",
            postalCode: "35511",
            addressCountry: "EG",
          },
          geo: { "@type": "GeoCoordinates", latitude: 31.0298521, longitude: 31.3655258 },
          hasMap: "https://maps.app.goo.gl/VYc3KdxrU1DQWwFf6",
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday"],
              opens: "09:00", closes: "17:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Friday"],
              opens: "00:00", closes: "00:00",
              description: "طوارئ ومتابعة هاتفية فقط"
            }
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://elyusr.org/#website",
          url: "https://elyusr.org/",
          name: "مؤسسة اليسر الخيرية",
          alternateName: "Al-Yusr Charity Foundation",
          description: "الموقع الرسمي لمؤسسة اليسر الخيرية — تبرع، زكاة، صك أضحية، كفالة أيتام، علاج، مياه.",
          inLanguage: ["ar-EG", "en"],
          publisher: { "@id": "https://elyusr.org/#org" },
          potentialAction: [
            {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://elyusr.org/search?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
            {
              "@type": "DonateAction",
              target: "https://elyusr.org/donate",
              name: "تبرع لمؤسسة اليسر الخيرية الآن",
              description: "تبرع آمن وموثق عبر الإنترنت لمؤسسة اليسر الخيرية في المنصورة."
            }
          ],
        },
      ],
    })}</script>
  </Helmet>
);

interface BreadcrumbProps { items: { name: string; url: string }[]; }
export const BreadcrumbSchema = ({ items }: BreadcrumbProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: it.url,
      })),
    })}</script>
  </Helmet>
);

/** Qurbani product/offer schema. Render only while booking is open (see qurbaniSeason.ts). */
export const QurbaniSchema = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `https://elyusr.org/#qurbani-${QURBANI_SEASON.year}`,
      name: `صك أضحية العيد ${QURBANI_SEASON.year} — الدقهلية والمنصورة`,
      alternateName: `Qurbani share Eid al-Adha ${QURBANI_SEASON.year} — Dakahlia`,
      description: "صك أضحية مضمون مع معاينة قبل الذبح وتوثيق بالصور والفيديو، يُوزَّع على الأسر المستحقة في الدقهلية: المنصورة، ميت غمر، بلقاس، دكرنس، شربين، أجا، السنبلاوين، المطرية.",
      image: "https://elyusr.org/og-image.jpg",
      brand: { "@type": "Organization", name: "مؤسسة اليسر الخيرية" },
      category: "Charity / Qurbani",
      areaServed: [
        { "@type": "AdministrativeArea", name: "محافظة الدقهلية" },
        { "@type": "City", name: "المنصورة" },
        { "@type": "City", name: "ميت غمر" },
        { "@type": "City", name: "بلقاس" },
        { "@type": "City", name: "دكرنس" },
        { "@type": "City", name: "شربين" },
        { "@type": "City", name: "أجا" },
        { "@type": "City", name: "السنبلاوين" },
        { "@type": "City", name: "المطرية" },
      ],
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EGP",
        lowPrice: "1400",
        highPrice: "32000",
        offerCount: 3,
        availability: "https://schema.org/InStock",
        url: "https://elyusr.org/donate?program=odhya",
        validThrough: QURBANI_SEASON.eidDate.slice(0, 10),
        seller: { "@id": "https://elyusr.org/#org" },
      },
    })}</script>
  </Helmet>
);

/** Service-area list schema — every Dakahlia city we cover, for local-pack SEO. */
const DAKAHLIA_CITIES: { name: string; lat: number; lon: number; slug: string }[] = [
  { name: "المنصورة",   lat: 31.038, lon: 31.381, slug: "mansoura" },
  { name: "ميت غمر",    lat: 30.717, lon: 31.262, slug: "mit-ghamr" },
  { name: "بلقاس",     lat: 31.213, lon: 31.358, slug: "belqas" },
  { name: "دكرنس",     lat: 31.092, lon: 31.589, slug: "dikirnis" },
  { name: "شربين",     lat: 31.181, lon: 31.524, slug: "sherbin" },
  { name: "أجا",       lat: 30.940, lon: 31.237, slug: "aga" },
  { name: "السنبلاوين", lat: 30.881, lon: 31.456, slug: "sinbillawayn" },
  { name: "المطرية",   lat: 31.183, lon: 32.033, slug: "matareya" },
  { name: "طلخا",      lat: 31.054, lon: 31.378, slug: "talkha" },
  { name: "ميت سلسيل", lat: 31.241, lon: 31.668, slug: "mit-salsil" },
  { name: "الجمالية",  lat: 31.180, lon: 31.870, slug: "gamalia" },
  { name: "نبروه",     lat: 31.107, lon: 31.330, slug: "nabaroh" },
  { name: "بني عبيد",  lat: 30.920, lon: 31.555, slug: "bani-ubaid" },
  { name: "المنزلة",   lat: 31.165, lon: 31.940, slug: "manzala" },
];

export const DakahliaServiceSchema = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "https://elyusr.org/#dakahlia-services",
      serviceType: "Charitable distribution & Qurbani in Dakahlia",
      provider: { "@id": "https://elyusr.org/#org" },
      areaServed: DAKAHLIA_CITIES.map((c) => ({
        "@type": "City",
        name: c.name,
        geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lon },
        containedInPlace: { "@type": "AdministrativeArea", name: "محافظة الدقهلية" },
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "برامج اليسر في الدقهلية",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "صك أضحية" }, url: "https://elyusr.org/donate?program=odhya" },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "كرتونة عزومة العيد" }, url: "https://elyusr.org/donate?program=box" },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "كيلو لحمة للأسر" }, url: "https://elyusr.org/donate?program=meat" },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "كفالة يتيم وتعليم" }, url: "https://elyusr.org/donate?program=education" },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "وصلات مياه نظيفة" }, url: "https://elyusr.org/donate?program=water" },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "زكاة المال" }, url: "https://elyusr.org/donate?program=zakat" },
        ],
      },
    })}</script>
  </Helmet>
);

/** FAQPage schema — pass an array of {q, a}. Safe text only (no <a>/<script>). */
export const FAQSchema = ({ items }: { items: { q: string; a: string }[] }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: { "@type": "Answer", text: it.a },
      })),
    })}</script>
  </Helmet>
);

/** Article schema — full BlogPosting markup for /blog/:slug. */
interface ArticleSchemaProps {
  url: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  section?: string;
  keywords?: string[];
  wordCount?: number;
  timeRequiredMinutes?: number;
  inLanguage?: "ar" | "en";
}
export const ArticleSchema = ({
  url, headline, description, image, datePublished, dateModified,
  authorName = "مؤسسة اليسر الخيرية", section, keywords, wordCount,
  timeRequiredMinutes, inLanguage = "ar",
}: ArticleSchemaProps) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline,
      description,
      image: [image],
      datePublished,
      dateModified: dateModified || datePublished,
      author: { "@type": "Organization", name: authorName, url: "https://elyusr.org/" },
      publisher: { "@id": "https://elyusr.org/#org" },
      inLanguage,
      ...(section ? { articleSection: section } : {}),
      ...(keywords && keywords.length ? { keywords: keywords.join(", ") } : {}),
      ...(wordCount ? { wordCount } : {}),
      ...(timeRequiredMinutes ? { timeRequired: `PT${timeRequiredMinutes}M` } : {}),
      // what voice assistants / AI answers should read first: the title and the short answer box
      speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#quick-answer"] },
    })}</script>
  </Helmet>
);
