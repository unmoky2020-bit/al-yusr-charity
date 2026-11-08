import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useLang } from "@/i18n/LangContext";
import { cn } from "@/lib/utils";
import { COUNTRIES, PINNED, countryName, countryOf, fromValue, isValidPhone, toValue, type PhoneCountry } from "@/lib/phone";

export type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Country used when the value is empty or local (default Egypt). */
  defaultCountry?: string;
  /** Only Egyptian numbers (forms whose API accepts 01XXXXXXXXX only). */
  egyptOnly?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  inputClassName?: string;
  /** Called with the validity whenever the number changes (empty = not valid). */
  onValidityChange?: (valid: boolean) => void;
  "aria-describedby"?: string;
};

const Flag = ({ code, className }: { code: string; className?: string }) => (
  <img src={`/flags/${code}.svg`} alt="" width={24} height={16} loading="lazy" className={cn("h-4 w-6 shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]", className)} />
);

/**
 * The phone field of the whole site: a country picker (flag, name, calling code; search in Arabic
 * or English) next to the number. Egyptian numbers are stored as 01XXXXXXXXX (what the API and the
 * donor matching already use); any other country as +<code><number>.
 */
export function PhoneInput({
  value, onChange, defaultCountry = "EG", egyptOnly, id, name, required, disabled, placeholder, invalid,
  className, inputClassName, onValidityChange, ...aria
}: PhoneInputProps) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const parsed = useMemo(() => fromValue(value, defaultCountry), [value, defaultCountry]);
  const [country, setCountry] = useState<PhoneCountry>(parsed.country);
  const [open, setOpen] = useState(false);
  // A stored international number decides the country; otherwise the picker's choice stays.
  const active = value.trim().startsWith("+") ? parsed.country : country;
  const national = parsed.national;

  const emit = (c: PhoneCountry, n: string) => {
    const next = toValue(c, n);
    onChange(next);
    onValidityChange?.(isValidPhone(c, n));
  };

  const options = useMemo(() => {
    const named = COUNTRIES.map((c) => ({ c, name: countryName(c.code, ar ? "ar" : "en") }));
    const pinned = PINNED.map((code) => named.find((x) => x.c.code === code)).filter(Boolean) as typeof named;
    const rest = named.filter((x) => !PINNED.includes(x.c.code)).sort((a, b) => a.name.localeCompare(b.name, ar ? "ar" : "en"));
    return { pinned, rest };
  }, [ar]);

  const showInvalid = invalid ?? (national.length > 3 && !isValidPhone(active, national));

  const item = ({ c, name: label }: { c: PhoneCountry; name: string }) => (
    <CommandItem
      key={c.code}
      value={`${label} ${c.code} +${c.dial}`}
      onSelect={() => {
        setCountry(c);
        setOpen(false);
        emit(c, national);
      }}
      className="flex items-center gap-3 rounded-xl px-2.5 py-2"
    >
      <Flag code={c.code} />
      <span className="flex-1 truncate text-sm font-semibold">{label}</span>
      {/* LRI…PDI keeps "+20" in reading order inside the Arabic list */}
      <span className="font-mono text-xs text-muted-foreground">{`\u2066+${c.dial}\u2069`}</span>
      {c.code === active.code && <Check className="h-4 w-4 text-primary" aria-hidden />}
    </CommandItem>
  );

  return (
    <div
      dir="ltr"
      className={cn(
        "flex h-12 w-full items-stretch overflow-hidden rounded-xl border bg-background transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/40",
        showInvalid ? "border-destructive" : "border-input",
        disabled && "opacity-60",
        className,
      )}
    >
      {egyptOnly ? (
        <span className="flex shrink-0 items-center gap-2 border-e border-input bg-muted/40 px-3 text-sm font-bold text-foreground/80">
          <Flag code="EG" /> +20
        </span>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={ar ? `الدولة: ${countryName(active.code, "ar")}` : `Country: ${countryName(active.code, "en")}`}
              className="flex shrink-0 items-center gap-2 border-e border-input bg-muted/40 px-3 text-sm font-bold text-foreground/80 transition hover:bg-muted"
            >
              <Flag code={active.code} />
              <span className="font-mono">+{active.dial}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[320px] rounded-2xl border-border/80 p-0 shadow-2xl" dir={ar ? "rtl" : "ltr"}>
            <Command>
              <CommandInput placeholder={ar ? "ابحث عن دولة أو كود…" : "Search country or code…"} className="h-11" />
              <CommandList className="max-h-72 p-1.5">
                <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{ar ? "لا توجد نتائج" : "No results"}</CommandEmpty>
                <CommandGroup heading={ar ? "الأكثر استخدامًا" : "Most used"}>{options.pinned.map(item)}</CommandGroup>
                <CommandGroup heading={ar ? "كل الدول" : "All countries"}>{options.rest.map(item)}</CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        aria-invalid={showInvalid || undefined}
        aria-describedby={aria["aria-describedby"]}
        placeholder={placeholder ?? (active.code === "EG" ? "01XXXXXXXXX" : "")}
        value={national}
        onChange={(e) => emit(egyptOnly ? countryOf("EG") : active, e.target.value)}
        className={cn("min-w-0 flex-1 bg-transparent px-3 text-base font-semibold tracking-wide text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/70", inputClassName)}
      />
    </div>
  );
}
