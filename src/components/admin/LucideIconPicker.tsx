import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllLucideIconNames, getLucideIcon } from "@/lib/lucide-icon";
import { Search, X } from "lucide-react";

/** Searchable icon picker over the entire lucide-react library with live preview. */
export function LucideIconPicker({
  value,
  onChange,
  isAr = false,
}: {
  value?: string | null;
  onChange: (name: string) => void;
  isAr?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const allNames = useMemo(() => getAllLucideIconNames(), []);
  const Selected = getLucideIcon(value);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return allNames.slice(0, 180);
    return allNames.filter((n) => n.toLowerCase().includes(needle)).slice(0, 180);
  }, [q, allNames]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="h-10 w-full justify-start gap-2">
          <Selected className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate text-xs font-medium">{value || (isAr ? "اختر أيقونة" : "Pick an icon")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-3" align="start" sideOffset={4}>
        {/* Search */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isAr ? "ابحث (مثال: heart, users)…" : "Search (e.g. heart, users)…"}
            className="h-9 ps-8 pe-8 text-xs rounded-xl"
            autoFocus
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-0.5 hover:bg-muted"
              aria-label="clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Currently selected */}
        {value && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary/8 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary">
            <Selected className="h-4 w-4 shrink-0" />
            <span>{isAr ? "المحدد:" : "Selected:"} {value}</span>
          </div>
        )}

        {/* Icon grid — 6 columns, bigger icons */}
        <div className="grid max-h-60 grid-cols-6 gap-1.5 overflow-y-auto pr-0.5">
          {filtered.map((n) => {
            const I = getLucideIcon(n);
            const active = n === value;
            return (
              <button
                key={n}
                type="button"
                title={n}
                onClick={() => { onChange(n); setOpen(false); }}
                className={`flex flex-col items-center justify-center rounded-xl p-2 transition-all hover:bg-primary/10 hover:scale-105 active:scale-95 ${
                  active ? "bg-primary/15 ring-2 ring-primary shadow-sm" : ""
                }`}
              >
                <I className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-foreground/70 hover:text-primary"}`} />
              </button>
            );
          })}
          {!filtered.length && (
            <div className="col-span-6 py-8 text-center text-xs text-muted-foreground">
              {isAr ? "لا توجد نتائج" : "No matches found"}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
          <span>{filtered.length}{!q ? "+" : ""} {isAr ? "أيقونة" : "icons"}</span>
          {value && <span className="font-mono text-primary/80 truncate max-w-[180px]">{value}</span>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
