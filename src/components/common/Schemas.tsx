import { Helmet } from "react-helmet-async";

/** Site-wide Organization, LocalBusiness & WebSite schema injection. */
export const SiteSchemas = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["NGO", "Organization"],
          "@id": "https://elyusr.org/#org",
          name: "مؤسسة اليسر الخيرية",
          alternateName: "Al-Yusr Charity Foundation",
          url: "https://elyusr.org/",
          logo: { "@type": "ImageObject", url: "https://elyusr.org/logo.png", width: 512, height: 512 },
          image: "https://elyusr.org/og-image.jpg",
          description: "مؤسسة خيرية مصرية مرخصة (إشهار 2665/2019) — رعاية أيتام، علاج، تعليم، صكوك أضحية، كرتونة عزومة.",
          foundingDate: "2019",
          areaServed: ["المنصورة", "الدقهلية", "EG"],
          sameAs: [
            "https://www.facebook.com/Elyosr.Charity/",
            "https://www.instagram.com/alyusr.charity/",
          ],
        },
        {
          "@type": "LocalBusiness",
          "@id": "https://elyusr.org/#local",
          name: "مؤسسة اليسر الخيرية - المنصورة",
          image: "https://elyusr.org/og-image.jpg",
          telephone: "+201097000137",
          priceRange: "Free",
          address: {
            "@type": "PostalAddress",
            streetAddress: "تقسيم خطاب، بجوار وكالة المنصورة",
            addressLocality: "المنصورة",
            addressRegion: "الدقهلية",
            addressCountry: "EG",
          },
          geo: { "@type": "GeoCoordinates", latitude: 31.0409, longitude: 31.3785 },
          openingHoursSpecification: [{
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday"],
            opens: "09:00", closes: "18:00",
          }],
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1280" },
        },
        {
          "@type": "WebSite",
          "@id": "https://elyusr.org/#website",
          url: "https://elyusr.org/",
          name: "مؤسسة اليسر الخيرية",
          alternateName: "Al-Yusr Charity Foundation",
          inLanguage: ["ar-EG", "en"],
          publisher: { "@id": "https://elyusr.org/#org" },
          potentialAction: [
            {
              "@type": "SearchAction",
              target: "https://elyusr.org/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
            {
              "@type": "DonateAction",
              target: "https://elyusr.org/donate",
              name: "Donate Online to Al-Yusr Charity Foundation",
              description: "Direct online donations for Zakat, Qurbani, Orphans, and Emergency Aid in Egypt."
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

/** Qurbani (Eid 2026) product/offer schema — boosts local "صك أضحية" search. */
export const QurbaniSchema = () => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": "https://elyusr.org/#qurbani-2026",
      name: "صك أضحية العيد 2026 — الدقهلية والمنصورة",
      alternateName: "Qurbani share Eid al-Adha 2026 — Dakahlia",
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
        validThrough: "2026-05-27",
        seller: { "@id": "https://elyusr.org/#org" },
      },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "1280" },
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
    })}</script>
  </Helmet>
);
