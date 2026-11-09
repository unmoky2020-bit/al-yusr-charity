import { useState, type SyntheticEvent } from "react";
import { ImageIcon } from "lucide-react";

export type FrameShape = "portrait" | "square" | "landscape";

/** Frame size per photo shape: a tall photo gets a narrower frame, a wide one a wider frame. On phones a
 *  tall photo stays well under the screen height, so the title and the buttons are never pushed away. */
const FRAME: Record<FrameShape, string> = {
  portrait: "aspect-[4/5] max-w-[280px] sm:max-w-[340px] lg:max-w-[400px]",
  square: "aspect-square max-w-[320px] sm:max-w-[400px] lg:max-w-[440px]",
  landscape: "aspect-[4/3] max-w-[560px]",
};

function shapeOf(img: HTMLImageElement): FrameShape {
  const r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 4 / 3;
  if (r < 0.9) return "portrait";
  if (r > 1.12) return "landscape";
  return "square";
}

type Props = {
  src: string;
  alt: string;
  /** Hero photos load first; section photos load lazily. */
  priority?: boolean;
  /** Shape to reserve before the photo arrives (pass "portrait" when you know it is tall). */
  initialShape?: FrameShape;
  className?: string;
};

/**
 * A photo in the site's rounded, glowing frame whose shape follows the photo. A portrait photo no
 * longer fills a whole column (huge), and a wide one no longer floats between empty bands (object-
 * contain). The photo covers its frame, weighted to the upper part where faces usually are.
 */
export function AdaptiveImageFrame({ src, alt, priority = false, initialShape = "landscape", className = "" }: Props) {
  const [shape, setShape] = useState<FrameShape>(initialShape);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    setShape(shapeOf(e.currentTarget));
    setLoaded(true);
  };

  return (
    <div className={`relative mx-auto w-full ${FRAME[shape]} ${className}`}>
      <div aria-hidden className="absolute -inset-4 rounded-[2.5rem] bg-secondary/20 blur-3xl" />
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-primary/30 shadow-card ring-1 ring-secondary/30 md:rounded-[2.5rem]">
        {!failed && (
          <img
            src={src}
            alt={alt}
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onLoad={onLoad}
            onError={() => setFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover object-[50%_22%] transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center text-primary-foreground/50">
            <ImageIcon className="h-8 w-8" aria-hidden="true" />
            {failed && <span className="sr-only">تعذر تحميل الصورة</span>}
          </div>
        )}
      </div>
    </div>
  );
}
