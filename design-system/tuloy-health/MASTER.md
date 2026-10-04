# Tuloy Health — Design System (Master)

Global source of truth for UI decisions. Page-specific overrides go in `pages/<page>.md`.
Implementation lives in `apps/mobile/src/shared/theme.ts` (tokens), `fonts.ts`, and the
shared components in `apps/mobile/src/shared/components/`. Never hard-code colours,
sizes or shadows in screens; add a token instead.

Derived from ui-ux-pro-max (`--design-system`, "public healthcare community health worker
patient care coordination", variance 3 · motion 2 · density 6), with recommendations
verified against this product before adoption.

## Direction

**Minimalism & Swiss**: clean, functional, high contrast, grid-based. Users are patients
with varied literacy, barangay health workers in the field (often offline, on low-end
phones), and RHU coordinators/clinicians at desks. Clarity beats decoration.

| Recommendation | Decision | Why |
|---|---|---|
| Style: Minimalism & Swiss | Adopted | Fits professional tools; low accessibility risk |
| Palette: cyan `#0891B2` primary | **Rejected** | White text on it is ~3.7:1 (fails AA). Kept brand teal `#0F766E` (5.5:1), same calm cyan–green family |
| Type: Figtree + Noto Sans | **Figtree only** | Noto Sans is ~629 KB per weight (≈2.5 MB); Figtree ~40 KB per weight covers Latin incl. Filipino. Offline precache size wins (Performance > Typography in priority) |
| Pattern: Hero + Testimonials | Rejected | Landing-page pattern; this is an app |
| Motion: scroll reveal (GSAP) | Rejected | Decorative; adds a dependency |

## Colour tokens (`colors`)

| Token | Value | Use |
|---|---|---|
| primary / primaryStrong / primaryBg | `#0F766E` / `#0B5D57` / `#ECF7F5` | Main actions, selection, active nav |
| text / muted | `#102A43` / `#52606D` | Body (14.6:1) / secondary text (6.5:1) |
| bg / surface / surfaceAlt / mutedBg | `#F4F6F9` / `#FFFFFF` / `#F8FAFC` / `#F0F3F7` | Page / cards / panels in cards / chips & icon wells |
| border / borderStrong | `#E3E8EE` / `#7B8794` | Hairlines / input outlines (3.7:1) |
| pending, error, success, info (+ `…Bg`) | `#B45309`, `#B91C1C`, `#166534`, `#1D69C7` | Status; every pair ≥ 4.5:1 on its tint |
| offlineBg | `#102A43` | Offline banner (calm navy, never red) |
| roleColors | admin `#5B3FB8`, bhw `#0E7C66`, patient `#1D69C7` | Workspace identity only |

All text/surface pairs are checked at ≥ 4.5:1 and UI boundaries at ≥ 3:1.

## Typography (`text`, Figtree)

display 30/36 800 · heading 24/30 700 · title 18/24 700 · body 16/24 · bodyStrong 16/24 600 ·
small 14/20 · label 14/20 600 · caption 13/18 · overline 12/16 700 uppercase.
Body text is 16 px; nothing below 12 px. Numbers in tiles use tabular figures.
Always render text through `shared/components/Text` (it picks the Figtree file per weight).

## Space, shape, elevation

- Spacing (4/8 rhythm): xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32.
- Radius: sm 6 · md 10 (controls) · lg 14 (cards, +2) · xl 18 (dialogs) · pill (chips, badges).
- Shadows (`shadow`): card · raised (hover/next step) · overlay (dialogs) · button · highlight · focusRing · errorRing.

## Icons

Feather only (`shared/components/Icon`): one outline family, uniform stroke, 56 KB, works offline.
Sizes: 14 inline · 18 default · 22 prominent. Icons are decorative (hidden from screen
readers); the adjacent text carries meaning. No emoji as icons.

## Components (all in `shared/components`)

Button (primary · secondary · danger · ghost; compact keeps a 44 px target) · TextField
(label, hint, inline error, focus ring, autocomplete off unless sign-in) · ChipGroup (check
mark + tint for selection) · Card · Notice (info/success/warning/error with icon) · StatusChip
(icon + words from `status.ts`) · Sheet (bottom sheet on phones, dialog ≥ 768 px; Escape,
backdrop, focus, reduced motion) · ConfirmSheet (all destructive actions) · EmptyState ·
LoadingSpinner · TileGrid (equal tiles, no stretched orphans) · StatTile · MetricTile ·
MeasurementCard · SectionHeader · Disclosure · Screen (main landmark, back link) · SideNav ·
AppHeader · SkipLink · ErrorScreen (route error boundary with recovery).

## Layout & breakpoints (`layout`)

- < 400 px: header sign-out becomes an icon button.
- < 768 px: tables become stacked label/value cards; dialogs are bottom sheets.
- 768–1023 px: header + bottom tabs, wider gutters, tables, centred dialogs.
- ≥ 1024 px: sidebar navigation (workspace, menu, language, clinician mode, account).
- Content max width 1000 px; sheets 560 px.

## Accessibility rules

Visible keyboard focus (`:focus-visible`), skip link, one `main` landmark per screen, status
never by colour alone, 44 px touch targets, reduced motion honoured (web CSS + native
dialogs), errors announced (`alert` / live regions) next to the field, light colour scheme
declared.
