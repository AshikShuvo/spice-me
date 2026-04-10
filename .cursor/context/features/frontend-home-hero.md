# Feature: Frontend home hero

## Summary

The public **home** route (`/{locale}` under the `(app)` layout) is a single full-viewport **hero** (below the sticky header): WebGL lava gradient, dark scrim, headline copy, and a primary CTA to **`/menu`**. Motion respects **`prefers-reduced-motion`**.

## Status

**complete**

## Scope

- **App(s):** `apps/web`
- **Entry points:**
  - `apps/web/app/[locale]/(app)/page.tsx` — renders `HomeHero` only (full-height breakout from `main` padding)
  - `apps/web/components/home/home-hero.tsx` — client hero shell, i18n, CTA
  - `apps/web/components/home/fire-hero-background.tsx` — Spell UI WebGL lava gradient wrapper + reduced-motion (`speed: 0`)
  - `apps/web/components/animated-gradient.tsx` — shadcn-installed [Spell Animated Gradient](https://spell.sh/docs/animated-gradient)

## Key Files

| File | Role |
|------|------|
| `apps/web/app/[locale]/(app)/page.tsx` | RSC: `HomeHero` only |
| `apps/web/components/home/home-hero.tsx` | Full-bleed section, scrim, copy, menu `Button` + `Link` |
| `apps/web/components/home/fire-hero-background.tsx` | `AnimatedGradient` preset **Lava**, `prefers-reduced-motion` → frozen shader |
| `apps/web/components/animated-gradient.tsx` | WebGL2 shader (Spell UI registry via `shadcn add @spell/animated-gradient`) |
| `apps/web/messages/en.json` / `no.json` | `home.hero_*`, `home.cta_menu` |

## API Contract

None (static marketing shell).

## Data Flow

```
page.tsx (RSC)
  → HomeHero (client): useTranslations("home") + Link to /menu
  → FireHeroBackground (client, decorative)
```

## Environment Variables

None.

## Dependencies on Other Features

- i18n (`next-intl`) for `home.*` strings
- Shared header/footer from `(app)/layout.tsx`

## Key Decisions & Gotchas

- **Full bleed:** Hero uses `w-screen max-w-[100vw] left-1/2 -translate-x-1/2` to escape `main` horizontal centering.
- **Performance:** WebGL canvas; requires WebGL2 — falls back to empty if context creation fails (see component).
- **Reduced motion:** `FireHeroBackground` sets gradient `speed: 0` when `prefers-reduced-motion: reduce`.
- **Spell “Lava” preset:** Amber / red / black swirl tuned for flame-like motion; swap to `preset: "custom"` with brand hex values if needed.

## TODOs / Open Questions

- None.
