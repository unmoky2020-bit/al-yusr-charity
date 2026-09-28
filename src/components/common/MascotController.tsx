import { Hand, Brain, PartyPopper, Frown, Moon } from "lucide-react";
import type { MascotState } from "./CharacterMascot";
import { useLang } from "@/i18n/LangContext";

const states: { id: MascotState; icon: typeof Hand }[] = [
  { id: "wave", icon: Hand },
  { id: "think", icon: Brain },
  { id: "celebrate", icon: PartyPopper },
  { id: "sad", icon: Frown },
  { id: "sleep", icon: Moon },
];

export const MascotController = ({
  value,
  onChange,
}: {
  value: MascotState;
  onChange: (s: MascotState) => void;
}) => {
  const { t } = useLang();
  return (
    <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 backdrop-blur">
      <div className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-secondary">
        {t.mascot.label}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {states.map(({ id, icon: Icon }) => {
          const active = value === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-pressed={active}
              className={`group flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 text-[11px] font-bold transition ${
                active
                  ? "border-secondary bg-secondary text-secondary-foreground shadow-cta"
                  : "border-primary-foreground/20 bg-primary-foreground/5 text-primary-foreground/80 hover:border-secondary/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.mascot.states[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};