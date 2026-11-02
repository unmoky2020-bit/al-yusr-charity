import { cn } from "@/lib/utils";

export type MarqueeImage = { src: string; alt: string };

type Rounded = "lg" | "xl" | "2xl" | "3xl" | "full";
type Ring = "none" | "soft" | "gold" | "strong";
type Shadow = "none" | "soft" | "card" | "cta";

const ROUNDED: Record<Rounded, string> = {
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};
const RING: Record<Ring, string> = {
  none: "",
  soft: "ring-1 ring-secondary/20",
  gold: "ring-1 ring-secondary/40",
  strong: "ring-2 ring-secondary/60",
};
const SHADOW: Record<Shadow, string> = {
  none: "",
  soft: "shadow-soft",
  card: "shadow-card",
  cta: "shadow-cta",
};

type SharedProps = {
  /** seconds for one full loop on ≥sm screens */
  duration?: number;
  /** tile size in px on ≥sm screens */
  size?: number;
  /** tile size in px on mobile (defaults to ~78% of `size`) */
  sizeSm?: number;
  /** gap between tiles in px */
  gap?: number;
  rounded?: Rounded;
  ring?: Ring;
  shadow?: Shadow;
  className?: string;
};

/**
 * Seamless infinite image marquee — duplicates the track and translates
 * 0 → -50% so the loop is mathematically gap-free.
 *
 * - Lazy loading + async decoding + low fetch priority for off-LCP imagery.
 * - Customizable rounded / ring / shadow / size / gap / speed.
 * - RTL-safe (track is always dir="ltr"; reverse=true flips direction).
 * - Respects prefers-reduced-motion.
 */
export const ImageMarquee = ({
  images,
  reverse = false,
  duration = 38,
  size = 140,
  sizeSm,
  gap = 12,
  rounded = "2xl",
  ring = "soft",
  shadow = "soft",
  ease = "linear",
  pauseOnHover = false,
  className,
}: {
  images: MarqueeImage[];
  reverse?: boolean;
  ease?: "linear" | "ease-in-out" | string;
  pauseOnHover?: boolean;
} & SharedProps) => {
  if (!images.length) return null;

  const mobileSize = sizeSm ?? Math.round(size * 0.78);
  // Duplicate the source list until we have at least 8 tiles per copy.
  const minTiles = 8;
  const repeats = Math.max(1, Math.ceil(minTiles / images.length));
  const filled = Array.from({ length: repeats }, () => images).flat();

  return (
    <div
      dir="ltr"
      className={cn(
        "marquee-root group relative w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
      style={
        {
          ["--mq-size" as any]: `${mobileSize}px`,
          ["--mq-size-sm" as any]: `${size}px`,
          ["--mq-gap" as any]: `${gap}px`,
          ["--mq-duration" as any]: `${Math.round(duration * 1.15)}s`,
          ["--mq-duration-sm" as any]: `${duration}s`,
        } as React.CSSProperties
      }
    >
      <div
        className="marquee-track flex w-max items-center will-change-transform"
        style={{
          gap: "var(--mq-gap)",
          animation: `image-marquee var(--mq-duration) ${ease} infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
        onMouseEnter={(e) => {
          if (pauseOnHover) e.currentTarget.style.animationPlayState = "paused";
        }}
        onMouseLeave={(e) => {
          if (pauseOnHover) e.currentTarget.style.animationPlayState = "running";
        }}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center"
            style={{ gap: "var(--mq-gap)" }}
          >
            {filled.map((img, i) => (
              <Tile
                key={`${copy}-${i}`}
                img={img}
                rounded={rounded}
                ring={ring}
                shadow={shadow}
              />
            ))}
          </div>
        ))}
      </div>
      <style>{marqueeBaseCss}</style>
    </div>
  );
};

const Tile = ({
  img,
  rounded,
  ring,
  shadow,
}: {
  img: MarqueeImage;
  rounded: Rounded;
  ring: Ring;
  shadow: Shadow;
}) => (
  <div
    className={cn(
      "marquee-tile relative shrink-0 overflow-hidden bg-muted transition-transform duration-300 hover:scale-[1.03]",
      ROUNDED[rounded],
      RING[ring],
      SHADOW[shadow],
    )}
  >
    <img
      src={img.src}
      alt={img.alt}
      loading="lazy"
      decoding="async"
      fetchpriority="low"
      draggable={false}
      className="h-full w-full object-cover"
    />
  </div>
);

const marqueeBaseCss = `
  .marquee-root .marquee-tile {
    width: var(--mq-size);
    height: var(--mq-size);
  }
  @media (min-width: 640px) {
    .marquee-root .marquee-tile {
      width: var(--mq-size-sm);
      height: var(--mq-size-sm);
    }
    .marquee-root .marquee-track {
      animation-duration: var(--mq-duration-sm) !important;
    }
  }
  @keyframes image-marquee {
    from { transform: translate3d(0, 0, 0); }
    to   { transform: translate3d(-50%, 0, 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-root .marquee-track { animation: none !important; }
  }
`;

export default ImageMarquee;
