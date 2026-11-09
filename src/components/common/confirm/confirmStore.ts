import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * The site's own "are you sure?" box, asked from anywhere with `await confirmAction({...})` or, for a
 * plain sentence, `await askConfirm("حذف الحالة؟")`. It replaces the browser's `confirm()`, which looks
 * foreign and which a browser silently answers "no" once someone ticks "don't let this page ask again"
 * (the dashboard's delete buttons then did nothing). <ConfirmHost /> (mounted once in App) draws it.
 */
export type ConfirmTone = "danger" | "warning" | "default";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  /** Name of the thing affected, shown in a chip under the title. */
  subject?: string;
  /** Photo of the thing affected (shown as a small tilted print instead of the icon). */
  image?: string | null;
  tone?: ConfirmTone;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  /** One quiet line under the description, e.g. "you can't undo this". */
  note?: string;
  /**
   * Runs while the box stays open (its button shows progress). Throwing keeps the box open with the
   * error written inside it, so a failed delete never looks like a done one.
   */
  onConfirm?: () => unknown;
}

export interface PendingConfirm {
  id: number;
  opts: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

let queue: PendingConfirm[] = [];
let seq = 0;
let hosts = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const confirmStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  snapshot: (): PendingConfirm[] => queue,
  /** Called by <ConfirmHost /> while mounted; without a host the browser box is used instead. */
  attachHost() {
    hosts += 1;
    return () => {
      hosts -= 1;
    };
  },
  settle(id: number, ok: boolean) {
    const item = queue.find((q) => q.id === id);
    queue = queue.filter((q) => q.id !== id);
    emit();
    item?.resolve(ok);
  },
};

export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  if (hosts === 0 || typeof window === "undefined") {
    const ok = typeof window !== "undefined" && typeof window.confirm === "function" ? window.confirm(opts.title) : false;
    return (async () => {
      if (ok && opts.onConfirm) await opts.onConfirm();
      return ok;
    })();
  }
  return new Promise<boolean>((resolve) => {
    seq += 1;
    queue = [...queue, { id: seq, opts, resolve }];
    emit();
  });
}

const DANGER = /(حذف|احذف|امسح|مسح|تشيل|شيل|إزالة|ازالة|\bdelete\b|\bremove\b)/i;
const WARNING = /(إلغاء|الغاء|ترجيع|استعادة|إرجاع|ارجاع|تجاهل|تعديلات غير محفوظة|\breset\b|\bcancel\b|unsubscribe|discard)/i;

/** Tone a plain sentence would get (exported for tests). */
export function toneOf(text: string): ConfirmTone {
  if (DANGER.test(text)) return "danger";
  if (WARNING.test(text)) return "warning";
  return "default";
}

/** Splits "Question? More detail." into a title and a description. */
export function splitMessage(text: string): { title: string; description?: string } {
  const t = text.trim();
  const m = t.match(/^([\s\S]+?[؟?!])\s+([\s\S]+)$/);
  if (m) return { title: m[1].trim(), description: m[2].trim() };
  const dot = t.match(/^([^.\n]{8,}?\.)\s+([\s\S]+)$/);
  if (dot) return { title: dot[1].trim(), description: dot[2].trim() };
  return { title: t };
}

/** Drop-in for `confirm(message)`: same sentence, the site's own box. */
export function askConfirm(message: string, extra: Partial<ConfirmOptions> = {}): Promise<boolean> {
  const { title, description } = splitMessage(message);
  return confirmAction({ title, description, tone: toneOf(message), ...extra });
}
