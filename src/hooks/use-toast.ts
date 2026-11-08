import type { ReactNode } from "react";
import { toast as sonner } from "sonner";

/**
 * The site has ONE toast system: Sonner (src/components/ui/sonner.tsx). This module keeps the older
 * `toast({ title, description, variant })` call shape used across the code, and sends it to Sonner,
 * so every toast shares one look, one position, one RTL close button and one queue.
 */
export type ToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  /** "destructive" = an error; anything else is a confirmation. */
  variant?: "default" | "destructive" | null;
  duration?: number;
};

export function toast({ title, description, variant, duration }: ToastInput) {
  const opts = { description, duration };
  const id = variant === "destructive" ? sonner.error(title ?? "", opts) : sonner.success(title ?? "", opts);
  return { id, dismiss: () => sonner.dismiss(id) };
}

/** Same shape as before (`const { toast } = useToast()`); there is no toast list to read any more. */
export function useToast() {
  return { toast, dismiss: (id?: string | number) => sonner.dismiss(id) };
}
