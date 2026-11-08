import { Inbox } from "lucide-react";

/** The empty state of every notification list (bell, dashboard page, donor account). */
export function NotificationsEmpty({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center text-sm text-muted-foreground ${compact ? "p-8" : "p-12"}`}>
      <Inbox className={`${compact ? "h-8 w-8" : "h-10 w-10"} opacity-50`} aria-hidden />
      {text}
    </div>
  );
}
