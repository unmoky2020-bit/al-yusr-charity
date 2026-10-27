# DESIGN.md — Al-Yusr Charity Foundation (elyusr.org)

> Source of truth for visual decisions. Tokens live in `src/index.css` (`:root`) and `tailwind.config.ts`.

## Context
- **Artifact:** Bilingual (AR-first, RTL) nonprofit marketing site with a donation flow, plus an admin CMS.
- **Audience:** Egyptian donors (Dakahlia/Mansoura first), zakat and sadaqa givers, volunteers.
- **Primary action:** Donate. Secondary: build trust (About, /trust, donation tracking).
- **Adjectives:** trustworthy, rooted, warm, accountable, grounded.
- **Essence:** "Documented doorstep giving."

## System (existing brand, keep)
- **Type:** DIN Next Arabic (display + UI weights 700–900), Droid Arabic Kufi fallback, TWK Lausanne for Latin. Numerals in `font-mono` + `tabular-nums` for years/figures.
- **Color roles:** `--primary` deep green 152 65% 18% (dominant), `--secondary` lime 75 85% 60% (brand highlight, progress, active state), `--accent` orange 22 88% 58% (**reserved for Donate CTAs**), cream/white surfaces, `pattern-why` dark green bands.
- **Button ranking:** orange gradient = Donate only. Lime filled = primary non-donation action in a section. Underlined text link = tertiary.
- **Radius:** 16px (`rounded-2xl`) cards, 12px (`rounded-xl`) buttons. Avoid 24px+ on new components.
- **Shadows:** pick a defined border **or** soft shadow per element, not both, on new components.
- **Motion:** `--ease-out-soft` (cubic-bezier(.22,1,.36,1)); 240–420ms for state, ≤900ms for one-off draw-ins; transform/opacity only; every animation has a `prefers-reduced-motion` fallback.

## Signature moves
- **Home → About bridge (`AboutTeaser`):** dark green band with a 3-stop timeline (2000 → 2019 → 2025) whose lime line draws once on view.
- **About "Why trust us" (`TrustJourney`):** the donation's path as a vertical rail that fills with scroll; each guarantee station lights up when reached; the official 2665/2019 seal stamps when the path completes.

## Facts (keep consistent everywhere)
- License: **2665 / 2019**, Ministry of Social Solidarity (unified 2026-10-28; 2655 was a typo).
- CIB account: 100043605733.

## Slop audit (new components, 2026-10-28)
- Pass: no gradient text, no side-tab borders, no icon-tile-above-heading, accent outside indigo band, single primary per section, tabular numerals, 44px targets on links, visible focus rings, reduced-motion handled.
- Known debt in older sections: heavy reuse of pill eyebrow + icon tile + 24px+ radius cards; `animate-bounce` usage elsewhere; border + shadow stacked on most cards.

## Changelog
- 2026-10-28: Created. Added AboutTeaser (home) and TrustJourney (about). Unified license number to 2665.
