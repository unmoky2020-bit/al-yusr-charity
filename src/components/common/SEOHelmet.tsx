import { Helmet } from "react-helmet-async";
import { useLang } from "@/i18n/LangContext";
import { absoluteSiteUrl } from "@/lib/site-runtime";

interface Props {
  title: string;
  description: string;
  path?: string;
  image?: string;
  ogType?: "website" | "article";
  keywords?: string;
  /** Account/auth pages: keep them out of search results. */
  noindex?: boolean;
}

const HIGH_VOLUME_KEYWORDS = [
  // هوية المؤسسة
  "اليسر", "مؤسسة اليسر", "مؤسسة اليسر الخيرية", "جمعية اليسر", "جمعية اليسر الخيرية", "اليسر الخيرية",
  // النطاق: مصر كلها، والمقر في المنصورة
  "مؤسسة خيرية في مصر", "تبرع في مصر", "مؤسسة خيرية في المنصورة", "جمعية خيرية في المنصورة", "تبرع في الدقهلية", "المنصورة", "الدقهلية",
  // الخدمات
  "تبرع", "زكاة المال", "صدقة جارية", "كفالة أيتام", "صك أضحية", "أضحية", "توصيل مياه", "وصلة مياه", "كرتونة رمضان", "تجهيز عرائس", "علاج المرضى", "إطعام", "التبرع بالملابس المستعملة",
  // English
  "Al-Yusr Charity Foundation", "Charity in Egypt", "Charity in Mansoura", "Donate Egypt", "Zakat Egypt", "Orphan sponsorship Egypt",
].join(", ");

export const SEOHelmet = ({ title, description, path = "/", image, ogType = "website", keywords, noindex = false }: Props) => {
  const { lang } = useLang();
  // Arabic is the default URL; English is the same path with ?lang=en (LangContext reads it).
  const arUrl = absoluteSiteUrl(path);
  const enUrl = `${arUrl}${arUrl.includes("?") ? "&" : "?"}lang=en`;
  const url = lang === "en" ? enUrl : arUrl;

  // Clamp to Google's preferred limits to avoid SEO warnings.
  const clamp = (s: string, max: number) => {
    const v = (s || "").replace(/\s+/g, " ").trim();
    if (v.length <= max) return v;
    const cut = v.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
  };

  const safeTitle = clamp(title, 60);
  const safeDescription = clamp(description, 160);
  const safeKeywords = keywords ? `${keywords}, ${HIGH_VOLUME_KEYWORDS}` : HIGH_VOLUME_KEYWORDS;

  // Default lang-specific OG image if caller didn't pass one.
  const toAbsolute = (v?: string) => {
    if (!v) return absoluteSiteUrl(`/og-${lang}.jpg`);
    if (/^https?:\/\//.test(v)) return v;
    if (v.startsWith("/")) return absoluteSiteUrl(v);
    return absoluteSiteUrl(`/og-${lang}.jpg`);
  };

  const ogImage = toAbsolute(image);
  const brandIcon = absoluteSiteUrl("/icons/icon-512.png");

  return (
    <Helmet>
      <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} />
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta name="keywords" content={safeKeywords} />
      <meta name="robots" content={noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="ar-EG" href={arUrl} />
      <link rel="alternate" hrefLang="ar" href={arUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={arUrl} />

      {/* OpenGraph Meta Tags */}
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={lang === "ar" ? "اليسر" : "Al-Yusr Charity Foundation"} />
      <meta property="og:locale" content={lang === "ar" ? "ar_EG" : "en_US"} />
      <meta property="og:locale:alternate" content={lang === "ar" ? "en_US" : "ar_EG"} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:alt" content={safeTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:logo" content={brandIcon} />

      {/* Twitter Cards Meta */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@elyusrcharity" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={safeTitle} />

      {/* 2026 Technical & Generative AI Overview JSON-LD Schema */}
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": ["NGO", "EmergencyService"],
            "@id": "https://elyusr.org/#ngo",
            name: lang === "ar" ? "مؤسسة اليسر الخيرية" : "Al-Yusr Charity Foundation",
            alternateName: [
              "اليسر",
              "مؤسسة اليسر",
              "جمعية اليسر",
              "جمعية اليسر الخيرية",
              "اليسر الخيرية",
              "مؤسسة اليسر المنصورة",
              "مؤسسة اليسر بالمنصورة",
              "اليسر المنصورة",
              "Al-Yusr",
              "Al-Yusr Charity",
              "Al-Yusr Charity Foundation",
              "Al-Yusr Foundation Mansoura"
            ],
            url: "https://elyusr.org/",
            logo: brandIcon,
            image: ogImage,
            description: safeDescription,
            taxID: "2665/2019",
            foundingDate: "2019",
            knowsAbout: [
              "Zakat Calculation",
              "Qurbani Share Distribution Eid 2026",
              "Orphan Care & Sponsorship",
              "Food Security & Boxes",
              "Clean Water Supply Stations",
              "Orphan Bride Trousseau",
              "Corporate Social Responsibility CSR Egypt"
            ],
            address: {
              "@type": "PostalAddress",
              streetAddress: "تقسيم خطاب، بجوار وكالة المنصورة",
              addressLocality: "المنصورة",
              addressRegion: "الدقهلية",
              addressCountry: "EG"
            },
            telephone: "+201097000137",
            areaServed: [
              { "@type": "Country", name: "مصر" },
              { "@type": "AdministrativeArea", name: "محافظة الدقهلية" },
              { "@type": "City", name: "المنصورة" }
            ],
            sameAs: [
              "https://facebook.com/Elyosr.Charity",
              "https://instagram.com/elyosr.charity",
              "https://wa.me/201097000137"
            ]
          },
          {
            "@type": "WebPage",
            "@id": `${url}#webpage`,
            url,
            name: safeTitle,
            description: safeDescription,
            inLanguage: lang === "ar" ? "ar-EG" : "en",
            isPartOf: { "@id": "https://elyusr.org/#website" },
            about: { "@id": "https://elyusr.org/#ngo" },
            speakable: {
              "@type": "SpeakableSpecification",
              cssSelector: ["h1", "h2", "blockquote"]
            }
          }
        ]
      })}</script>
    </Helmet>
  );
};
