import logo from "@/assets/logo-circle.png";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "@/i18n/LangContext";

export const Logo = ({
  className = "",
  stackedOnMobile = false,
  size = "default",
}: {
  className?: string;
  stackedOnMobile?: boolean;
  size?: "default" | "lg" | "xl";
}) => {
  const { lang } = useLang();
  const location = useLocation();
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const imgSizeClass =
    size === "xl"
      ? "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
      : size === "lg"
      ? "h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28"
      : "h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14";

  const subTextClass =
    size === "xl" || size === "lg"
      ? "text-xs font-extrabold sm:text-sm md:text-base tracking-wide"
      : "text-[11px] font-extrabold tracking-wide sm:text-[13px]";

  const mainTextClass =
    size === "xl"
      ? "text-2xl font-black sm:text-3xl md:text-4xl"
      : size === "lg"
      ? "text-xl font-black sm:text-2xl md:text-3xl"
      : "text-base font-black sm:text-lg";

  return (
    <Link
      to="/"
      onClick={handleClick}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={`group flex items-center gap-2.5 sm:gap-3 shrink-0 ${
        stackedOnMobile ? "max-sm:flex-col max-sm:items-center max-sm:gap-2 max-sm:text-center" : ""
      } ${className}`}
      aria-label="Al-Yusr home"
    >
      <span className={`relative grid shrink-0 place-items-center rounded-full transition-transform group-hover:scale-105 ${imgSizeClass}`}>
        <img
          decoding="async"
          src={logo}
          alt="مؤسسة اليسر الخيرية"
          width={128}
          height={128}
          className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
        />
      </span>
      <div className={`flex flex-col leading-[1.15] text-start ${stackedOnMobile ? "max-sm:items-center max-sm:text-center" : ""}`}>
        {lang === "ar" ? (
          <>
            <span className={subTextClass}>مؤسسة</span>
            <span className={mainTextClass}>اليسر الخيرية</span>
          </>
        ) : (
          <>
            <span className={subTextClass}>Al-Yusr</span>
            <span className={mainTextClass}>Charity Foundation</span>
          </>
        )}
      </div>
    </Link>
  );
};
