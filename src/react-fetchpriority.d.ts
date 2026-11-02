// React 18's typings don't know the lowercase `fetchpriority` attribute yet.
import "react";

declare module "react" {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: "high" | "low" | "auto";
  }
}
