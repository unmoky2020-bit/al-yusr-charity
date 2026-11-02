import { useLang } from "@/i18n/LangContext";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { LazyImage } from "@/components/common/LazyImage";
import p1 from "@/assets/poster-odhya.webp";
import p2 from "@/assets/poster-zakat.png";
import p3 from "@/assets/poster-meat.webp";
import p4 from "@/assets/poster-water.png";
import p5 from "@/assets/poster-box.png";
import p6 from "@/assets/poster-education.png";
import p7 from "@/assets/poster-bride.webp";
import p8 from "@/assets/poster-volunteer.png";

const images = [p1, p2, p3, p4, p5, p6, p7, p8];

export const PostersGallery = () => {
  const { t } = useLang();
  return (
    <section id="campaigns" className="relative overflow-hidden bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {t.posters.cta}
          </span>
          <h2 className="mt-3 text-3xl font-black text-primary md:text-5xl">{t.posters.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.posters.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {t.posters.items.map((item, i) => (
            <article
              key={i}
              className="group relative overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-cta md:rounded-3xl"
            >
              <LazyImage
                src={images[i]}
                alt={item.title}
                width={600}
                height={800}
                aspect="aspect-[3/4]"
                sizes="(max-width: 640px) 50vw, 25vw"
                className="transition-transform duration-700 group-hover:scale-110"
                wrapperClassName="overflow-hidden"
              />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-primary/95 via-primary/70 to-transparent p-3 text-primary-foreground opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 md:p-4">
                <h3 className="text-sm font-extrabold md:text-base">{item.title}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] text-primary-foreground/85 md:text-xs">{item.desc}</p>
              </div>
              <div className="absolute start-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-secondary text-xs font-black text-secondary-foreground shadow-cta md:h-10 md:w-10 md:text-sm">
                {String(i + 1).padStart(2, "0")}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center md:mt-14">
          <Button asChild size="lg" className="bg-orange-grad text-accent-foreground shadow-cta hover:opacity-95">
            <Link to="/#donate"><Heart className="h-5 w-5" />{t.posters.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};