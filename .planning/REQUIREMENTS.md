# Requirements: oMLX Intelligence Benchmark — v1.1 reka-ui Best-Practice Alignment

**Defined:** 2026-06-08
**Core Value:** Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

**Milestone driver:** `reka-ui` is a dependency but entirely unused; every `ui/` component is hand-rolled and the PARAMS slider renders broken. Adopt the one genuine best practice the project lacks — **headless reka-ui primitives for interactive widgets** — without changing the already-canonical `cva` + `cn()` conventions, and without expanding scope (no Storybook/Velite/auto-import/`App*` rename).

> v1.0 parity requirements are recorded as **Validated** in PROJECT.md; this file scopes v1.1 only.

## v1.1 Requirements

### Slider (the visible bug — P0)

- [x] **SLIDER-01**: A reusable `ui/slider.vue` exists, built on reka-ui `SliderRoot` / `SliderTrack` / `SliderRange` / `SliderThumb`, supporting a two-thumb range value (`v-model` as `[min, max]`), with `min` / `max` / `step` props.
- [x] **SLIDER-02**: `ui/slider.vue` renders a visible track, a filled range between the two thumbs, and two draggable thumbs (no native `input[type=range]` / `::-webkit-*` hacks).
- [x] **SLIDER-03**: The PARAMS filter in `FilterBar.vue` uses `ui/slider.vue` instead of the two overlapping native range inputs; the `0B…Inf` breakpoint labels and the existing `update:paramsMinIdx` / `update:paramsMaxIdx` emit contract are preserved.
- [x] **SLIDER-04**: PARAMS filtering behaviour is unchanged — dragging either thumb filters rows by the same index→breakpoint mapping; min cannot cross above max; keyboard arrows move the focused thumb (reka-ui a11y, gained for free).
- [x] **SLIDER-05**: The slider matches the existing visual design (primary-coloured fill/thumbs, border track) via cva/`cn()` styling on the reka-ui parts — no regression versus the intended v1.0 look.

### UI Primitives (best-practice alignment — P1)

- [ ] **UIPRIM-01**: `ui/dialog.vue` is migrated to reka-ui `Dialog*` primitives (overlay, content, focus-trap, `Escape`-to-close, `aria` wiring) while preserving its current cva styling and the public slot/prop API used by `ImportModal` / `ExportModal`.
- [ ] **UIPRIM-02**: `ui/select.vue` is migrated to reka-ui `Select*` primitives (keyboard navigation, `aria`, typeahead) while preserving its current styling and the API used by `DeviceSelector`.
- [ ] **UIPRIM-03**: All existing consumers (`ImportModal`, `ExportModal`, `DeviceSelector`, `FilterBar`) work unchanged after migration — verified by the existing Playwright UI-validation checkpoints.

### Labeling (realign to original design — user request)

- [x] **LABEL-01**: In labeling mode, `BenchmarkTable.vue` swaps the Score column group for the original layout — `Model | Spec(Params/Quant/Size) | Deprecated | Tiers(Opus/Sonnet/Haiku)` — with edit controls rendered **inline inside those locked-width columns**, not a full-width `colspan` stacked panel (matches `app/index.html:1242-1324`).
- [x] **LABEL-02**: The Abilities (Thinking/MTP) editor is removed from labeling mode, and `useLabeling.ts` no longer carries `thinking`/`mtp` edit state — Abilities is never a field the user is asked to fill.
- [x] **LABEL-03**: Export strips `abilities` from every entry before producing the JSON (matching the original `getExportData` → `({ abilities, ...rest }) => rest`); all other fields (spec/tiers/deprecated/scores/date) preserved.

### Conventions (P2)

- [x] **CONV-01**: The convention "reka-ui headless primitives for interactive widgets; plain cva-styled elements for leaf components (input/textarea/label/card)" is documented in `CLAUDE.md` so future components follow it.
- [x] **CONV-02**: cva + `VariantProps` + `cn()` remain the styling contract for every `ui/` component (no `App*` shim pattern, no manual variant maps introduced).

## Definition of Done

- The PARAMS slider renders correctly (track + fill + two thumbs) and filters identically to the intended v1.0 behaviour.
- `dialog` and `select` are backed by reka-ui; all four consumers function unchanged.
- Existing Vitest suite green; existing Playwright UI-validation checkpoints green.
- No new heavyweight tooling added; `cva`/`cn` conventions intact.

## v2 / Deferred

Tracked, not in this milestone.

- **DEFER-01**: Migrate leaf components (`input`, `textarea`, `label`, `card`) — only if a concrete a11y/behaviour need appears (plain styled elements are valid shadcn-vue).
- **DEFER-02**: Storybook per-component preview (jen-lab parity) — not justified for this app's size.
- **DEFER-03**: unplugin auto-imports / vue-components — convenience only, not load-bearing.

## Out of Scope

| Feature | Reason |
|---------|--------|
| `App*` component renaming (jen-lab style) | jen-lab's `App*` is a Nuxt-UI-compat shim; this project's canonical shadcn-vue cva is already best practice |
| Storybook / Velite / auto-imports | Out of milestone scope; not load-bearing for a single-page static viewer |
| Any data / feature / JSON-contract change | This is a UI-internals alignment, not a feature milestone |
| Rewriting leaf components | Plain styled elements are valid; no a11y benefit from headless primitives there |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SLIDER-01 | Phase 8 | Done |
| SLIDER-02 | Phase 8 | Done |
| SLIDER-03 | Phase 8 | Done |
| SLIDER-04 | Phase 8 | Done |
| SLIDER-05 | Phase 8 | Done |
| LABEL-01 | Phase 9 | Done |
| LABEL-02 | Phase 9 | Done |
| LABEL-03 | Phase 9 | Done |
| UIPRIM-01 | Phase 10 | Pending |
| UIPRIM-02 | Phase 10 | Pending |
| UIPRIM-03 | Phase 10 | Pending |
| CONV-01 | Phase 8 | Done |
| CONV-02 | Phase 8 | Done |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 13 ✓ (Phase 8: SLIDER-01..05 + CONV-01/02; Phase 9: LABEL-01..03; Phase 10: UIPRIM-01..03)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 — milestone v1.1 roadmapped (phases 8–9)*
