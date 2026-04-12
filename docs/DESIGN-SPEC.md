# Design Spec: "Clinical Clarity"

> Every pixel earns its place by helping the SLP move faster or see clearer.

## Context

This app is a DAYC-2 developmental assessment score calculator for speech-language pathologists (SLPs). It's used on desktop in a medical setting, likely in a **half-screen window (~800px wide) alongside Epic** for copying skills into reports. Assessments are recorded from paper into the computer. The workflow is linear: dates → reverse lookup → raw scores → skills.

## Design Philosophy

**Hybrid emotional register** — clean, modern, and warm but with authoritative data treatment. Not cold clinical, not bubbly. *Trustworthy.* Inspired by the clarity of Robinhood/Wealthfront with the warmth of Copilot/Headspace.

---

## 1. Layout

### Container & Width
- **Drop the 1400px max container.** Use a fluid layout that works from ~700px to full-screen.
- Reduce `--container-max` to `1080px` — still has breathing room on large screens but doesn't feel empty at half-screen.
- Horizontal padding: `px-4` (16px) instead of `px-6` (24px) — reclaim width.

### Score/Skills Side-by-Side
- **Keep the two-column grid** (scores left, skills right) at `md:` breakpoint and above.
- Reduce `--score-grid-width` from `400px` to `320px` — the size hierarchy means scores can be more compact.
- Stack naturally below `md:` (768px).

### Provenance Panel
- **Overlay, not push.** Remove `lg:mr-(--panel-width)` from the main content wrapper. The panel floats over content with backdrop blur.
- Reduce `--panel-width` from `420px` to `380px`.
- Keep the anchor highlight on the triggering score element.

---

## 2. Header (AppShell)

### Slim Single-Row Header
- Collapse from two rows (brand + tabs) to **one slim bar**.
- Height: `36px` (down from ~84px with brand + tab rows).
- Contents: brand mark left, version badge right. That's it.
- Remove assessment tabs entirely for now. When multiple assessments ship, add a dropdown/selector.

### Brand Treatment
- `slp.scoring` — keep current typography: `text-base font-bold tracking-[-0.01em]`.
- Version badge: keep as-is, subtle and small.

---

## 3. Typography

### Font
- **DM Sans** — keep. Geometric, clean, great tabular number rendering.
- `font-feature-settings: "tnum"` on body — keep. Ensures column-aligned numbers.

### Hierarchy

| Role | Class | Weight | Example |
|------|-------|--------|---------|
| Score hero (SS) | `text-2xl` (24px) | `font-bold` (700) | `102` |
| Score secondary (%ile) | `text-xl` (20px) | `font-bold` (700) | `55th` |
| Score tertiary (Age Eq) | `text-lg` (18px) | `font-medium` (500) | `2y 3m` |
| Raw score input value | `text-lg` (18px) | `font-bold` (700) | `12` |
| Section title | `text-base` (16px) | `font-bold` (700) | `Receptive Language` |
| Body text | `text-sm` (14px) | `font-normal` (400) | Skill descriptions |
| Labels (uppercase) | `text-xs` (12px) | `font-bold` (700) + `tracking-[0.04em]` | `SS`, `%ile`, `RAW` |
| Metadata/faint | `text-xs` (12px) | `font-medium` (500) | Version, age band |

### Key Principle
Computed scores (SS, %ile) use size + semantic color to create visual "slope" — the eye hits SS first, slides to %ile, optionally to Age Eq. Raw input is visually distinct as "what I typed" vs. computed output.

---

## 4. Color

### Palette (unchanged from current)
- **Primary (blue-gray):** `#4b5064` (700) down to `#f5f6f8` (50) — chrome, accents, badges
- **Accent (warm gold):** `#c0a76e` (400) — brand dot only, used sparingly
- **CTA (teal):** `#0d9488` — interactive/clickable actions

### Semantic Theme Variables (`:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--theme-app-bg` | `#fafaf8` | Warm off-white page background |
| `--theme-surface` | `#ffffff` | Card backgrounds |
| `--theme-surface-muted` | `#f8fafc` | Recessed areas, hover states |
| `--theme-surface-recessed` | `rgba(248,250,252,0.6)` | Skills panel background |
| `--theme-text-strong` | `#1e293b` | Headings, score values |
| `--theme-text-default` | `#334155` | Body text |
| `--theme-text-muted` | `#64748b` | Secondary text |
| `--theme-text-faint` | `#94a3b8` | Labels, metadata |
| `--theme-text-placeholder` | `#cbd5e1` | Empty states, disabled |
| `--theme-border-default` | `#e2e8f0` | Card borders, dividers |
| `--theme-border-subtle` | `#f1f5f9` | Inner dividers |
---

## 5. Component Specifications

### ChildBar
- Keep current layout: Birth Date, Test Date, age display, clear button.
- Reduce padding: `p-2 px-4` (from `p-3 px-5`).
- Date inputs: keep `w-[155px]` — sufficient for date format.
- **No changes to functionality.**

### Reverse Lookup
- Keep as a **normal scrollable section** (not sticky, not inline hints).
- Rationale: during the scoring phase (before skills expand the page), the page is short enough that reverse lookup stays visible or is one scroll away. Once skills are being entered, targets are no longer needed.
- Result chips: keep current design — compact, clickable for provenance.

### SubtestRow (Score Section — Left Column)

#### Header
- Subtest label: `text-base font-bold text-text-strong`.
- Abbreviation badge: keep `text-xs` pill in `primary-50`.

#### Score Grid
Each metric in its own vertical cell, label on top, value below:

```
  Raw        SS          %ile        Age Eq.
 [input]    [2xl bold]  [xl bold]   [lg medium]
```

- **Raw:** `text-lg font-bold` inside a `w-14 h-10` input. Visually "recessed" — `bg-input-bg border`. Clearly an input, not a computed value.
- **Standard Score:** `text-2xl font-bold` + semantic color. The visual hero.
- **Percentile:** `text-xl font-bold` + semantic color. Secondary hero.
- **Age Equivalent:** `text-lg font-medium text-text-muted`. Supporting detail, intentionally quieter.
- **Provenance click:** keep on SS and %ile. Cursor pointer + hover opacity.

#### Note
- Keep amber warning for out-of-range raw scores.

### SkillsSection (Right Column)

#### Fix: Replace Hardcoded Colors
- `text-slate-500` → `text-text-muted` (Unable label)
- `bg-slate-100 border-slate-300` → `bg-surface-muted border-border-default` (Unable chips)

#### Copy Button — Make Prominent
- Current: tiny `text-xs text-text-placeholder` "Copy" link — too subtle for a high-value action.
- **New:** Small but visible button with icon. `text-xs font-semibold text-primary-600 hover:text-primary-700` with a copy icon (clipboard SVG). Position: right-aligned in the label row (keep current position).
- Feedback: "Copied!" in `text-score-high` for 1.5s.

#### ChipInput
- Keep current design — functional and clean.
- No changes needed.

### CompositeFooter
- Apply same score hierarchy: Sum at `text-xl`, Standard at `text-2xl` + color, Percentile at `text-xl` + color.
- Keep the `primary-50/50` background band — it visually groups the composite.

### ScoresTable Grouping
- Keep `border-l-[3px] border-l-primary-200` accent on card groups.
- Communication group (RL + EL + Composite) and SE standalone — no structural changes.

### ProvenancePanel
- **Overlay mode:** Remove margin push. Panel floats with `position: fixed` over content.
- Backdrop: keep `bg-black/30 backdrop-blur-sm`.
- Anchor highlight: keep `bg-primary-50 ring-2 ring-primary-400`.
- Reduce width: `--panel-width: 380px`.
- Mobile: keep bottom sheet behavior.
- Keep focus trap and Escape-to-close.

### EmptyState
- No changes — it's a transient state.

### UpdateToast
- No changes — functional and minimal.

---

## 6. Spacing & Density

### Tighter Padding
- Cards: `p-3 px-4` (from `p-4 px-5`) where possible.
- Section gaps: `space-y-3` (from `space-y-4`) between major sections.
- Score grid internal gap: `gap-3` (from `gap-4`).

### Goal
Reduce total page height by ~15-20% in the scoring phase (before skills are entered) so the reverse lookup and at least one subtest row are visible together without scrolling on a typical screen.

---

## 7. Animations

### Keep (subtle, purposeful)
- `animate-value-in` on score changes — confirms the value updated.
- `animate-fade-in` on section entry.
- `sections-enter` slide-up on first render.

### Consider Removing
- `slideInRight` on provenance panel if switching to overlay — `scaleIn` or `fadeIn` may feel more natural for an overlay.

---

## 8. Accessibility Notes

- Score colors (low/high) must not be the *only* indicator — the numerical value itself conveys meaning. Color is supplementary.
- Touch targets: keep `min-height: 44px` on mobile for buttons.
- Provenance panel: keep focus trap and Escape key handler.
- Copy buttons: keep `aria-label` attributes.

---

## 9. Implementation Order

1. **Header slim-down** (AppShell) — quick win, reclaims vertical space.
2. **Score hierarchy** (SubtestRow, CompositeFooter) — the biggest visual impact change.
3. **SkillsSection theming fix** — replace hardcoded slate colors.
4. **Copy button prominence** (SkillsSection) — usability improvement.
5. **Provenance overlay** (Dayc2App, ProvenancePanel) — remove margin push.
6. **Spacing tightening** (all components) — density pass.
7. **Layout token adjustments** (index.css) — container, grid width, panel width.

---

## 10. What This Spec Does NOT Change

- Data logic, scoring calculations, or provenance step generation.
- Skills validation (conflicts, out-of-range).
- Reverse lookup computation or percentile input behavior.
- PWA configuration, service worker, or manifest.
- Test assertions (unless class names in test snapshots need updating).
- The overall component architecture or state management.

---

## 11. Open Questions (Pending SLP Feedback)

- **Score priority:** Confirm that Standard Score > Percentile > Age Equivalent in visual importance.
- **Side-by-side at half-screen:** Does the SLP actually use the app at half-screen width? If always full-screen, the 320px score grid is unnecessarily tight.
- **Copy format:** Confirmed — comma-separated skill descriptions.
