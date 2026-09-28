import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset={16}
      duration={2600}
      dir="rtl"
      visibleToasts={3}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        info: <Info className="h-5 w-5 md:h-6 md:w-6 text-sky-600 dark:text-sky-400 shrink-0" />,
        warning: <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-amber-500 shrink-0" />,
        error: <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-rose-600 dark:text-rose-400 shrink-0" />,
      }}
      className="toaster group z-[99999] pointer-events-none"
      toastOptions={{
        duration: 2600,
        style: {
          zIndex: 99999,
          pointerEvents: "auto",
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/80 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5 sm:group-[.toaster]:p-4 md:group-[.toaster]:px-6 md:group-[.toaster]:py-4 md:group-[.toaster]:min-w-[420px] font-['Droid_Arabic_Kufi',_'DIN_Next_Arabic',_sans-serif] pointer-events-auto",
          title: "group-[.toast]:font-extrabold group-[.toast]:text-xs sm:group-[.toast]:text-sm md:group-[.toast]:text-[15px] group-[.toast]:leading-snug",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs sm:group-[.toast]:text-sm font-semibold group-[.toast]:mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-bold rounded-xl",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-bold rounded-xl",
          success: "group-[.toaster]:border-emerald-500/35 group-[.toaster]:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_0_24px_rgba(16,185,129,0.12)]",
          error: "group-[.toaster]:border-rose-500/35 group-[.toaster]:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_0_24px_rgba(244,63,94,0.12)]",
          warning: "group-[.toaster]:border-amber-500/35",
          info: "group-[.toaster]:border-sky-500/35",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

