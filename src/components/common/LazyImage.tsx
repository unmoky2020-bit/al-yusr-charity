import { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  wrapperClassName?: string;
  aspect?: string; // e.g. "aspect-video"
};

/**
 * Lightweight image with built-in skeleton placeholder, lazy loading and
 * async decoding. Use anywhere we render user/CMS-supplied media.
 *
 * - When `width` and `height` are numeric and no `aspect` class is passed,
 *   the wrapper locks its `aspect-ratio` from those values to prevent CLS
 *   while the image is still loading.
 * - `srcSet` / `sizes` are forwarded through `...rest` for responsive
 *   delivery (see `lib/image-srcset.ts`).
 */
/**
 * Skeleton-free version: the placeholder + opacity fade was causing visible
 * flicker and scroll jank as dozens of card images swapped in. The wrapper
 * still locks aspect-ratio (CLS-safe) and the <img> still ships with
 * `loading="lazy"` + `decoding="async"`, so we get the perf wins without
 * the choppy reveal.
 */
export const LazyImage = ({
  className,
  wrapperClassName,
  aspect,
  alt = "",
  loading = "lazy",
  decoding = "async",
  width,
  height,
  ...rest
}: Props) => {
  const ratioStyle =
    !aspect && typeof width === "number" && typeof height === "number" && width > 0 && height > 0
      ? { aspectRatio: `${width} / ${height}` }
      : undefined;
  return (
    <div
      className={cn("relative overflow-hidden", aspect, wrapperClassName)}
      style={ratioStyle}
    >
      <img
        {...rest}
        width={width}
        height={height}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={cn("h-full w-full object-cover", className)}
      />
    </div>
  );
};

export default LazyImage;
