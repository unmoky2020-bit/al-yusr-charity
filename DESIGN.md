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
- **Decorative motion rule:** continuous decoration (rain, lanterns) is never infinite and never starts during load. It mounts via `useAfterLoad()` (window load + 1.5s, skipped under reduced-motion), runs a few seconds, and settles. Measured: an infinite background-position rain kept the main thread at ~99% forever; finite transform drops return to baseline (~26%) after ~6s.
- **Motion:** `--ease-out-soft` (cubic-bezier(.22,1,.36,1)); 240–420ms for state, ≤900ms for one-off draw-ins; transform/opacity only; every animation has a `prefers-reduced-motion` fallback.

## Signature moves
- **Home → About bridge (`AboutTeaser`):** dark green band with a 3-stop timeline (2000 → 2019 → 2025) whose lime line draws once on view.
- **About "Why trust us" (`TrustJourney`):** the donation's path as a vertical rail that fills with scroll; each guarantee station lights up when reached; the official 2665/2019 seal stamps when the path completes.

## Campaign landings (bespoke identities on the shared shell)
`CampaignLandingShell` keeps SEO, FAQ, related links, closing CTA and sticky bar; each campaign passes its own `hero` and `main`.
- **Dhill (shade):** sun disc + green canopy; tabs (roof/water/air); share grid (500 EGP squares → full unit).
- **Athar (education):** ruled notebook paper, highlighter headline, taped photo; student-kit builder with live total.
- **Ramadan (Season of Giving):** night sky, crescent, swaying lanterns, gold 8-point-star band (`--gold: 43 85% 62%`); iftar-menu price list with gold dot leaders; moon-phase timeline; last-Ramadan achievements grid. No year/Hijri dates in copy.
- **Setr (winter):** cold night gradient with rain; "warm a home" builder where windows glow and a thermometer rises as items are picked; three layers of covering; Oct–Feb season bars.

## Facts (keep consistent everywhere)
- License: **2665 / 2019**, Ministry of Social Solidarity (unified 2026-10-28; 2655 was a typo).
- CIB account: 100043605733.

## Slop audit (new components, 2026-10-28)
- Pass: no gradient text, no side-tab borders, no icon-tile-above-heading, accent outside indigo band, single primary per section, tabular numerals, 44px targets on links, visible focus rings, reduced-motion handled.
- Known debt in older sections: heavy reuse of pill eyebrow + icon tile + 24px+ radius cards; `animate-bounce` usage elsewhere; border + shadow stacked on most cards.

## Changelog
- 2026-10-28: Campaign hadith blocks; Setr/Athar/Dhill/Ramadan content added; decorative animations made finite and deferred until after load.
- 2026-10-28: Bespoke designs for Dhill, Athar, Ramadan and Setr campaign pages.
- 2026-10-28: Created. Added AboutTeaser (home) and TrustJourney (about). Unified license number to 2665.
