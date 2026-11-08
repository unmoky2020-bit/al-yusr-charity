import { LoaderCircle } from "lucide-react";
import { useLang } from "@/i18n/LangContext";

/** Compact, consistent loading state for a route that cannot render its content yet. */
export function PageLoadingState() {
  const { lang } = useLang();

  return (
    <div className="grid min-h-[30vh] place-items-center px-4" role="status">
      <span className="sr-only">{lang === "ar" ? "جاري التحميل" : "Loading"}</span>
      <LoaderCircle className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
    </div>
  );
}
