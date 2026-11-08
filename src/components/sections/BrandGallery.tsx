import { Camera } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { LazyImage } from "@/components/common/LazyImage";
import truck from "@/assets/brand-truck.jpg";
import van from "@/assets/brand-van.jpg";
import billboard from "@/assets/brand-billboard.jpg";
import volunteerId from "@/assets/poster-volunteer.png";
import stationery from "@/assets/brand-stationery.jpg";
import donationCan from "@/assets/brand-can.png";
import vest from "@/assets/brand-vest.jpg";
import card from "@/assets/brand-card.jpg";
import app from "@/assets/brand-billboard.jpg";

/**
 * Brand-in-the-wild gallery — showcases real-world applications of the
 * Al-Yusr identity (vehicles, ID cards, posters, stationery, app).
 * Source: official brand identity book.
 */
export const BrandGallery = () => {
  const { lang } = useLang();
  const isRTL = lang === "ar";

  const items = [
    { src: truck, span: "md:col-span-2 md:row-span-2", alt: isRTL ? "سيارة توصيل اليسر" : "Al-Yusr delivery truck" },
    { src: volunteerId, span: "md:col-span-1 md:row-span-2", alt: isRTL ? "بطاقة متطوع اليسر" : "Volunteer ID" },
    { src: van, span: "md:col-span-1 md:row-span-1", alt: isRTL ? "سيارة فان اليسر" : "Al-Yusr van" },
    { src: donationCan, span: "md:col-span-1 md:row-span-1", alt: isRTL ? "حصالة تبرعات" : "Donation can" },
    { src: billboard, span: "md:col-span-2 md:row-span-2", alt: isRTL ? "لوحة إعلانية" : "Outdoor billboard" },
    { src: vest, span: "md:col-span-1 md:row-span-1", alt: isRTL ? "زي المتطوعين" : "Volunteer vest" },
    { src: app, span: "md:col-span-1 md:row-span-1", alt: isRTL ? "تطبيق الهاتف" : "Mobile app" },
    { src: stationery, span: "md:col-span-2 md:row-span-1", alt: isRTL ? "مطبوعات اليسر" : "Stationery system" },
    { src: card, span: "md:col-span-2 md:row-span-1", alt: isRTL ? "بطاقة تعريفية" : "Business card" },
  ];

  return (
    <section className="relative overflow-hidden brand-pattern-soft py-16 md:py-24">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/20 px-3 py-1 text-[11px] font-black text-primary">
            <Camera className="h-3.5 w-3.5" />
            {isRTL ? "الهوية على أرض الواقع" : "Identity in the field"}
          </span>
          <h2 className="mt-4 text-3xl font-black text-primary md:text-4xl">
            {isRTL ? "هوية واحدة من المنصورة إلى محافظات مصر" : "One identity — from Mansoura to every governorate in Egypt"}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg">
            {isRTL
              ? "سيارات وبطاقات وأطقم تطوع ولوحات إعلانية وتطبيق للهاتف — كلها بلغة بصرية واحدة تعرف بها اليسر من بعيد."
              : "Vehicles, IDs, volunteer kits, outdoor, app — one consistent visual language you can spot from a distance."}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl auto-rows-[140px] grid-cols-2 gap-3 md:auto-rows-[170px] md:grid-cols-4 md:gap-4">
          {items.map((it, i) => (
            <figure
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card ${it.span}`}
            >
              <LazyImage
                src={it.src}
                alt={it.alt}
                width={800}
                height={800}
                sizes="(max-width: 768px) 50vw, 25vw"
                className="transition duration-500 group-hover:scale-105"
                wrapperClassName="h-full w-full"
              />
              <figcaption className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-primary/90 to-transparent p-3 text-xs font-bold text-primary-foreground transition group-hover:translate-y-0">
                {it.alt}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandGallery;