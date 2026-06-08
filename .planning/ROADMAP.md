# ROADMAP: oMLX Intelligence Benchmark

**Architecture:** plain Vue 3 + Vite+ **SPA** (static `vp build`); serverless static site
**Granularity:** Standard — v1.1 deliberately scoped tight (2 phases)
**Last Updated:** 2026-06-08 (milestone v1.1 roadmap)

---

## Milestones

- ✅ **v1.0 — Vue 3 + Vite+ Migration** — Phases 1–7 (shipped 2026-06-06, 28/28 reqs)
- ✅ **v1.1 — reka-ui Best-Practice Alignment** — Phases 8–10 (complete 2026-06-08, 13/13 reqs)

---

## Phases

<!-- v1.0 (shipped) -->
- [x] **Phase 1: Scaffold & Bootstrap (+ keystone spike)** - Vue 3 + Vite+ SPA proven end-to-end; foundational decisions locked
- [x] **Phase 2: Data Loading & Settings** - JSON data and settings load client-side (no SSG)
- [x] **Phase 3: Table Core** - Three-tier benchmark table with sorting and row actions
- [x] **Phase 4: Filters** - Model search, tier, metrics, params, and deprecated filters
- [x] **Phase 5: Import Flow** - Local-only benchmark import modal with parser
- [x] **Phase 6: Labeling & Export** - Inline editing and File System Access save
- [x] **Phase 7: Parity, CI & Swap** - Full Playwright regression, data-validation, atomic swap to the Vue app

<!-- v1.1 (active) -->
- [x] **Phase 8: Slider & Convention** - reka-ui-backed dual-thumb PARAMS slider fixes the visible bug; reka-ui-for-interactive convention documented
- [x] **Phase 9: Labeling Realignment** - edit mode returns to the original column-aligned inline editors (Score columns swapped for Deprecated + Tiers); Abilities editor removed; `abilities` stripped on export
- [x] **Phase 10: UI Primitives (Dialog + Select)** - `dialog` migrated to reka-ui `Dialog*` (focus-trap/Escape/scroll-lock/aria); native `<select>` deliberately retained (documented); consumer APIs preserved

---

## ✅ v1.1 — reka-ui Best-Practice Alignment (Complete 2026-06-08)

**Milestone Goal:** Adopt the genuine Vue 3 / reka-ui best practice the project is missing — use headless reka-ui primitives for interactive widgets instead of hand-rolling them — starting by fixing the visibly broken PARAMS range slider. Keep the already-canonical `cva` + `cn()` + `VariantProps` conventions; add no heavyweight tooling.

**Milestone Definition of Done:** PARAMS slider renders correctly (track + fill + two thumbs) and filters identically to intended v1.0 behaviour; `dialog` and `select` are backed by reka-ui with all four consumers unchanged; existing Vitest suite green; existing Playwright UI-validation checkpoints green; `cva`/`cn` conventions intact, no `App*` shim.

### Phase 8: Slider & Convention
**Goal:** The PARAMS filter renders a correct reka-ui-backed dual-thumb range slider (track + fill + two thumbs) replacing the broken native-input hack, and the "reka-ui for interactive widgets" convention is established and documented as the precedent for the milestone.
**Depends on:** Phase 7 (v1.0 complete)
**Requirements:** SLIDER-01, SLIDER-02, SLIDER-03, SLIDER-04, SLIDER-05, CONV-01, CONV-02
**Success Criteria** (what must be TRUE):
  1. A reusable `ui/slider.vue` exists, built on reka-ui `SliderRoot` / `SliderTrack` / `SliderRange` / `SliderThumb`, taking a two-thumb range `v-model` as `[min, max]` with `min` / `max` / `step` props — no native `input[type=range]` or `::-webkit-*` hacks.
  2. The PARAMS filter in `FilterBar.vue` shows a visible bordered track, a primary-coloured filled range between two draggable thumbs (the previously broken empty circles are gone), matching the intended v1.0 visual design via `cva` + `cn()` styling.
  3. PARAMS filtering behaviour is unchanged: dragging either thumb filters rows by the same index→breakpoint mapping; the min thumb cannot cross above the max; keyboard arrows move the focused thumb (reka-ui a11y for free).
  4. The `0B…Inf` breakpoint labels still flank the slider and the existing `update:paramsMinIdx` / `update:paramsMaxIdx` emit contract is preserved, so `App.vue` filtering is wired identically.
  5. `CLAUDE.md` documents the convention — reka-ui headless primitives for interactive widgets; plain `cva`-styled elements for leaf components (input/textarea/label/card) — and `cva` + `VariantProps` + `cn()` remains the styling contract with no `App*` shim or manual variant maps introduced.
**Plans:** 1 plan
- [x] 08-01-PLAN.md — Build reka-ui `ui/slider.vue`, rewire FilterBar PARAMS (emit contract preserved), document convention
**UI hint:** yes

### Phase 9: Labeling Realignment
**Goal:** The edit (labeling) mode returns to the original `app/index.html` design — column-aligned inline editors that swap the Score columns for `Deprecated` + `Tiers` columns (locked widths/heights), instead of the Vue rewrite's full-width stacked panel — the Abilities (Thinking/MTP) editor is removed, and `abilities` is stripped from exported JSON, matching the original `getExportData`.
**Depends on:** Phase 7 (v1.0 labeling/export shipped); independent of Phase 8
**Requirements:** LABEL-01, LABEL-02, LABEL-03
**Success Criteria** (what must be TRUE):
  1. In labeling mode, `BenchmarkTable.vue` swaps the Score column group for `Model | Spec(Params/Quant/Size) | Deprecated | Tiers(Opus/Sonnet/Haiku)`, with edit controls rendered inline inside those locked-width columns (no full-width `colspan` stacked panel), matching the original `app/index.html` layout (`app/index.html:1242-1324`, CSS `445-446`).
  2. The Abilities (Thinking/MTP) editor is removed from labeling mode, and `useLabeling.ts` no longer carries `thinking`/`mtp` edit state — Abilities is never a field the user fills.
  3. Export strips `abilities` from every entry (matching original `getExportData` → `({ abilities, ...rest }) => rest`), so exported JSON carries no `abilities` key; all other fields (spec/tiers/deprecated/scores/date) are preserved.
  4. Existing Vitest suite green (adjust `useLabeling` tests for the removed Abilities fields); existing Playwright UI-validation checkpoints show zero new failures vs baseline.
**Plans:** 1 plan
- [x] 09-01-PLAN.md — restore column-aligned inline labeling editors (swap Score→Deprecated+Tiers), remove Abilities editor, strip `abilities` on export
**UI hint:** yes

### Phase 10: UI Primitives (Dialog + Select)
**Goal:** The hand-rolled interactive `ui/` components that genuinely benefit from a11y primitives — `dialog` and `select` — are migrated to reka-ui headless primitives following the Phase 8 convention, with current `cva` styling and every consumer's public API preserved.
**Depends on:** Phase 8
**Requirements:** UIPRIM-01, UIPRIM-02, UIPRIM-03
**Success Criteria** (what must be TRUE):
  1. `ui/dialog.vue` is backed by reka-ui `Dialog*` primitives (overlay, focus-trap, `Escape`-to-close, `aria` wiring) while keeping its current `cva` styling and its public slot/prop API (`open` / `title` / `class` props, `close` emit, default + `footer` slots) — so `ImportModal` and `ExportModal` open, close, and render identically.
  2. `ui/select.vue` is intentionally KEPT as a native `<select>` wrapper (a native control is already accessible + mobile-friendly; using the platform is not hand-rolling). `DeviceSelector` selects a device identically; convention amended in CLAUDE.md. (UIPRIM-02 revised — flagged to user.)
  3. All four consumers (`ImportModal`, `ExportModal`, `DeviceSelector`, `FilterBar`) function unchanged after migration, verified by the existing Playwright UI-validation checkpoints staying green and the existing Vitest suite staying green, with no data / feature / JSON-contract change.
**Plans:** 1 plan
- [x] 10-01-PLAN.md — migrate dialog to reka-ui; retain native select; clarify convention
**UI hint:** yes

**Planning note (Phase 10):** `select.vue` currently accepts native `<option>` slot children (see `DeviceSelector.vue`). reka-ui `Select` uses `SelectItem` items rather than native `<option>`, so the consumer-facing item-rendering API must be reconciled during plan-phase — preserve `DeviceSelector`'s `devices` / `modelValue` props and `update:modelValue` emit contract while migrating its internal markup to the reka-ui item API. This is the one consumer-API nuance to resolve when planning UIPRIM-02 / UIPRIM-03.

---

## v1.0 — Vue 3 + Vite+ Migration (Shipped 2026-06-06)

<details>
<summary>✅ v1.0 MVP (Phases 1–7) — SHIPPED 2026-06-06, 28/28 requirements</summary>

### Phase 1: Scaffold & Bootstrap (+ keystone spike)
**Goal:** Vue 3 + Vite+ SPA scaffold proven end-to-end (dev / test / static-build) with a minimal real table row rendering, foundational architecture decisions locked.
**Depends on:** Nothing (first phase)
**Requirements:** SCAF-01, SCAF-02, SCAF-03, SCAF-04
**Plans:** 3/3 complete
- [x] 01-01: Vite scaffold + shell
- [x] 01-02: Types + test integration
- [x] 01-03: Table render + build spike

### Phase 2: Data Loading & Settings
**Goal:** Settings and device benchmark JSON load client-side; device selector populated.
**Depends on:** Phase 1
**Requirements:** DATA-01, DATA-02, DATA-03
**Plans:** 2/2 complete
- [x] 02-01: Vite config + useSettings composable
- [x] 02-02: useBenchmarkData + DeviceSelector + table wiring

### Phase 3: Table Core
**Goal:** Three-tier benchmark table renders with color-coding, sorting, and row actions.
**Depends on:** Phase 2
**Requirements:** TBL-01, TBL-02, TBL-03, TBL-04
**Plans:** 2/2 complete
- [x] 03-01: Three-tier header + color-coding
- [x] 03-02: Sorting + row actions

### Phase 4: Filters
**Goal:** All filter controls (search, tier, metrics, params slider, deprecated toggle) work independently and combined.
**Depends on:** Phase 3
**Requirements:** FLT-01, FLT-02, FLT-03, FLT-04, FLT-05
**Plans:** 2/2 complete
- [x] 04-01: Filter infrastructure + model search + tier/metrics filters
- [x] 04-02: Params slider + show deprecated toggle

### Phase 5: Import Flow
**Goal:** Local-only import modal with stdout parser and merge logic (duplicate model score-only overwrite).
**Depends on:** Phase 4
**Requirements:** IMP-01, IMP-02, IMP-03, IMP-04
**Plans:** 2/2 complete
- [x] 05-01: Modal UI + hostname guard + useImport state setup
- [x] 05-02: Merge logic + unit tests + Playwright checkpoint

### Phase 6: Labeling & Export
**Goal:** Inline editing of entries and JSON export/save via File System Access API.
**Depends on:** Phase 5
**Requirements:** LAB-01, LAB-02, LAB-03, LAB-04, LAB-05
**Plans:** 2/2 complete
- [x] 06-01: Labeling state + inline editors
- [x] 06-02: Export modal + file save

### Phase 7: Parity, CI & Swap
**Goal:** Feature parity verified; full Playwright + data-validation CI green; Vue SPA atomically replaces legacy `app/index.html`.
**Depends on:** Phase 6
**Requirements:** PAR-01, PAR-02, PAR-03
**Plans:** 3/3 complete
- [x] 07-01: Playwright regression test
- [x] 07-02: Data validation CI verification
- [x] 07-03: Build & deploy Vue SPA

</details>

---

## Progress

**Execution order:** Phases execute in numeric order. v1.1 continues at Phase 8.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffold & Bootstrap (+ spike) | v1.0 | 3/3 | Complete | 2026-06-06 |
| 2. Data Loading & Settings | v1.0 | 2/2 | Complete | 2026-06-06 |
| 3. Table Core | v1.0 | 2/2 | Complete | 2026-06-06 |
| 4. Filters | v1.0 | 2/2 | Complete | 2026-06-06 |
| 5. Import Flow | v1.0 | 2/2 | Complete | 2026-06-06 |
| 6. Labeling & Export | v1.0 | 2/2 | Complete | 2026-06-06 |
| 7. Parity, CI & Swap | v1.0 | 3/3 | Complete | 2026-06-06 |
| 8. Slider & Convention | v1.1 | 1/1 | Complete | 2026-06-08 |
| 9. Labeling Realignment | v1.1 | 1/1 | Complete | 2026-06-08 |
| 10. UI Primitives (Dialog + Select) | v1.1 | 1/1 | Complete | 2026-06-08 |

---

*Roadmap created: 2026-06-06 (v1.0) · v1.1 phases added 2026-06-08 (reka-ui best-practice alignment)*
*v1.1 coverage: 13/13 requirements mapped — SLIDER-01..05 + CONV-01/02 → Phase 8; LABEL-01..03 → Phase 9; UIPRIM-01..03 → Phase 10*
*Phase 9 (Labeling Realignment) added 2026-06-08 — realign edit mode to original `app/index.html` design + drop Abilities (user request).*
