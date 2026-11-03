import * as SelectPrimitive from "@radix-ui/react-select";
import { Check } from "lucide-react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type NiceOption = { value: string; label: string; hint?: string; disabled?: boolean };

/**
 * The site's dropdown (Radix under the hood): rounded, branded, RTL-aware, keyboard friendly.
 * Use it instead of a native <select>, whose open list is drawn by the OS and ignores the design.
 */
export function NiceSelect({
  value,
  onChange,
  options,
  ariaLabel,
  id,
  className = "",
  size = "md",
  dir,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: NiceOption[];
  ariaLabel: string;
  id?: string;
  className?: string;
  size?: "sm" | "md";
  dir?: "rtl" | "ltr";
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} dir={dir} disabled={disabled}>
      <SelectTrigger
        id={id}
        dir={dir}
        aria-label={ariaLabel}
        className={cn(
          "w-full rounded-xl border-border bg-background font-bold text-primary shadow-none focus:ring-2 focus:ring-secondary/50 focus:ring-offset-0 data-[state=open]:border-secondary",
          size === "sm" ? "h-9 text-xs" : "h-12 text-sm",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        dir={dir}
        position="popper"
        sideOffset={6}
        className="z-[160] max-h-80 rounded-2xl border-border/80 p-1 shadow-card"
      >
        {options.map((o) => (
          <SelectPrimitive.Item
            key={o.value || "__empty"}
            value={o.value || "__empty"}
            disabled={o.disabled}
            className="relative flex w-full cursor-pointer select-none flex-col rounded-xl py-2.5 pe-3 ps-8 text-start text-sm font-bold text-primary outline-none focus:bg-secondary/15 data-[state=checked]:bg-secondary/20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <span className="absolute start-2.5 top-3 flex h-3.5 w-3.5 items-center justify-center">
              <SelectPrimitive.ItemIndicator><Check className="h-4 w-4 text-primary" /></SelectPrimitive.ItemIndicator>
            </span>
            {/* only the label shows in the closed field */}
            <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
            {o.hint && <span className="block text-[11px] font-semibold text-muted-foreground">{o.hint}</span>}
          </SelectPrimitive.Item>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Radix forbids an empty value; map "" ⇄ "__empty" at the edges. */
export const fromNice = (v: string) => (v === "__empty" ? "" : v);
export const toNice = (v: string) => v || "__empty";
