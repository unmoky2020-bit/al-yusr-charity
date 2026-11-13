import { useEffect, useRef, useState } from "react";
import { MoreVertical, Share, Smartphone, SquarePlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
/** Facebook, Instagram, WhatsApp, TikTok… open links in their own browser, which can't add to the home screen. */
const isInApp = () => typeof navigator !== "undefined" && /FBAN|FBAV|Instagram|WhatsApp|TikTok|Snapchat|Line\/|; wv\)/i.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);

/**
 * «ضعها على الشاشة الرئيسية»: a shortcut that opens this misbaha itself. While the room is open the
 * page's manifest and iOS title point at the room, so the phone saves the room and not the site's home.
 */
export function AddToHome({ isAr, slug, name, wide }: { isAr: boolean; slug: string; name: string; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const promptRef = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const title = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    const prevHref = link?.getAttribute("href") ?? null;
    const prevTitle = title?.getAttribute("content") ?? null;
    link?.setAttribute("href", `/misbaha-manifest.php?slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`);
    title?.setAttribute("content", isAr ? `سبحة ${name}` : name);
    const onPrompt = (e: Event) => { e.preventDefault(); promptRef.current = e as InstallEvent; };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (link && prevHref) link.setAttribute("href", prevHref);
      if (title && prevTitle) title.setAttribute("content", prevTitle);
    };
  }, [slug, name, isAr]);

  if (isStandalone()) return null;

  const onClick = async () => {
    const ev = promptRef.current;
    if (!ev) return setOpen(true);
    try {
      await ev.prompt();
      const choice = await ev.userChoice;
      if (choice?.outcome === "accepted") setDone(true);
    } catch {
      setOpen(true);
    }
    promptRef.current = null;
  };

  const ios = isIOS();
  const inApp = isInApp();
  const steps = inApp
    ? [
        { icon: <MoreVertical className="h-4 w-4" />, ar: "اضغط ⋯ فوق، واختر «فتح في المتصفح» (Safari أو Chrome)", en: "Tap ⋯ at the top and choose “Open in browser”" },
        { icon: <SquarePlus className="h-4 w-4" />, ar: "من هناك اضغط «أضِفها للشاشة» تاني", en: "Then tap “Add to home” again there" },
      ]
    : ios
    ? [
        { icon: <Share className="h-4 w-4" />, ar: "اضغط زر المشاركة (المربع والسهم) — في آيفون الجديد هتلاقيه بعد ما تضغط ⋯ أو ☰ جنب العنوان تحت", en: "Tap Share (square with arrow) — on newer iPhones it's under ⋯ next to the address bar" },
        { icon: <SquarePlus className="h-4 w-4" />, ar: "انزل واختر «إضافة إلى الشاشة الرئيسية» (لو مش ظاهرة اضغط «عرض المزيد»)", en: "Scroll and choose “Add to Home Screen” (under “More” if hidden)" },
        { icon: <Smartphone className="h-4 w-4" />, ar: "سيب «فتح كتطبيق ويب» مفعّل، واضغط «إضافة»: هتلاقي السبحة جنب تطبيقاتك وتفتح عليها على طول", en: "Keep “Open as Web App” on and tap “Add” — it opens straight on this misbaha" },
      ]
    : [
        { icon: <MoreVertical className="h-4 w-4" />, ar: "افتح قائمة المتصفح (⋮)", en: "Open the browser menu (⋮)" },
        { icon: <SquarePlus className="h-4 w-4" />, ar: "اختر «إضافة إلى الشاشة الرئيسية»", en: "Choose “Add to Home screen”" },
        { icon: <Smartphone className="h-4 w-4" />, ar: "اضغط «إضافة»، وهتلاقي السبحة جنب تطبيقاتك", en: "Tap “Add” — the misbaha sits beside your apps" },
      ];

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-3 text-sm font-black text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:px-4 ${wide ? "col-span-2 sm:col-span-1" : ""}`}
      >
        <Smartphone className="h-4 w-4 shrink-0" />
        {done ? (isAr ? "اتضافت للشاشة" : "Added") : isAr ? "أضِفها للشاشة" : "Add to home"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={isAr ? "rtl" : "ltr"} className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-start text-lg font-black text-primary">{isAr ? "السبحة على شاشة موبايلك" : "This misbaha on your home screen"}</DialogTitle>
            <DialogDescription className="text-start">
              {inApp
                ? (isAr ? "التطبيق اللي فاتح منه الرابط ما بيسمحش بالإضافة للشاشة. افتحه في المتصفح الأول:" : "This app's browser can't add to the home screen. Open it in your browser first:")
                : ios
                  ? (isAr ? "آيفون ما بيسمحش لأي موقع يضيف نفسه بضغطة واحدة، فهي 3 خطوات بسيطة مرة واحدة بس:" : "iPhone doesn't let any site add itself in one tap, so it's three quick steps, once:")
                  : (isAr ? "ضغطة واحدة تفتح سبحتك على طول." : "One tap opens your misbaha.")}
            </DialogDescription>
          </DialogHeader>
          <ol className="keep-flow space-y-2.5">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3 text-start text-sm font-bold text-foreground">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/25 text-primary">{s.icon}</span>
                <span>{isAr ? s.ar : s.en}</span>
              </li>
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
