import { useState } from "react";
import { Check, Copy, Facebook, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { track } from "@/lib/track";

const WhatsAppIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
  </svg>
);

/**
 * Share row for one case: WhatsApp first (where most donors here share), then Facebook, Telegram,
 * copy, and the phone's own share sheet when there is one.
 */
export function CaseShare({
  url,
  title,
  text,
  refCode,
  isRTL,
  compact = false,
  tone = "light",
}: {
  url: string;
  title: string;
  /** The message sent with the link. */
  text: string;
  refCode: string;
  isRTL: boolean;
  compact?: boolean;
  /** "dark" = on a dark background. */
  tone?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = (channel: string) => {
    const u = new URL(url);
    u.searchParams.set("utm_source", channel);
    u.searchParams.set("utm_medium", "share");
    u.searchParams.set("utm_campaign", "case");
    return u.toString();
  };
  const sent = (channel: string) => track("case_share", { payload: { channel, case: refCode }, fbCustom: false });

  const links = [
    { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon, href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl("whatsapp")}`)}`, cls: "bg-[#25D366] text-white hover:brightness-95" },
    { key: "facebook", label: "Facebook", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl("facebook"))}`, cls: "bg-[#1877F2] text-white hover:brightness-95" },
    { key: "telegram", label: "Telegram", Icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl("telegram"))}&text=${encodeURIComponent(text)}`, cls: "bg-[#229ED9] text-white hover:brightness-95" },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl("copy"));
      setCopied(true);
      sent("copy");
      toast.success(isRTL ? "اتنسخ رابط الحالة" : "Case link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRTL ? "مقدرناش ننسخ الرابط، انسخه من شريط العنوان" : "Couldn't copy, use the address bar");
    }
  };
  const native = async () => {
    try {
      await navigator.share({ title, text, url: shareUrl("native") });
      sent("native");
    } catch {
      /* closed */
    }
  };
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const size = compact ? "h-9 w-9" : "h-10 w-10";
  const ghost = tone === "dark" ? "bg-white/15 text-white hover:bg-white/25" : "bg-muted text-primary hover:bg-secondary/20";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map(({ key, label, Icon, href, cls }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sent(key)}
          className={`grid ${size} place-items-center rounded-full transition ${cls}`}
          aria-label={isRTL ? `شارك على ${label}` : `Share on ${label}`}
          title={label}
        >
          <Icon className="h-[18px] w-[18px]" />
        </a>
      ))}
      <button type="button" onClick={copy} className={`grid ${size} place-items-center rounded-full transition ${ghost}`}
        aria-label={isRTL ? "انسخ الرابط" : "Copy link"} title={isRTL ? "انسخ الرابط" : "Copy link"}>
        {copied ? <Check className="h-[18px] w-[18px]" /> : <Copy className="h-[18px] w-[18px]" />}
      </button>
      {canNative && (
        <button type="button" onClick={native} className={`grid ${size} place-items-center rounded-full transition ${ghost}`}
          aria-label={isRTL ? "مشاركة" : "Share"} title={isRTL ? "مشاركة" : "Share"}>
          <Share2 className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}
