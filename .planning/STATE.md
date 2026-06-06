# STATE: oMLX Intelligence Benchmark — Vue 3 + Vite+ Migration

**Milestone:** Vue 3 + Vite+ Static Site Migration at Feature Parity
**Current Phase:** 1 (Scaffold & Bootstrap + spike)
**Status:** Phase 1 planned (3 plans, checker-verified, blocker fixed); ready to execute
**Last Updated:** 2026-06-06

---

## Project Reference

**Core Value:**
Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

**Current Focus:**
Migrate the 1581-line vanilla-JS `app/index.html` to a component-based **Vue 3 + Vite+ SPA** (static `vp build`, vite-ssg deferred), preserving serverless operation, the pure-JSON data contract, and all in-browser import/label/export workflows.

**Key Constraints:**
- Serverless / static output only (SPA via `vp build`)
- Pure-JSON data contract unchanged
- Browser-only APIs (File System Access, clipboard, hostname guard) run client-side only
- Port `app/lib/import.mjs` parser logic with unit tests green
- Existing CI (Playwright UI-validation + data-validation) must pass — validated per-phase
- Vue 3 + Vite+, no Nuxt, no SSG/prerender

---

## Current Position

**Phase:** 1 — Scaffold & Bootstrap (+ keystone spike)
**Plan:** 01-01 / 01-02 / 01-03 (3 plans, 2 waves) — verified, ready
**Status:** Planned & verified — awaiting execution
**Progress:** 0 / 28 requirements delivered

```
[                                              ]  0%
```

---

## Roadmap Structure

| Phase | Goal | Req Count |
|-------|------|-----------|
| 1 | Vue 3 + Vite+ SPA scaffold + spike + locked decisions | 4 |
| 2 | Data loading & settings (client-side) | 3 |
| 3 | Three-tier table with sorting/actions | 4 |
| 4 | Filters: search, tier, metrics, params | 5 |
| 5 | Import modal with parser/merge | 4 |
| 6 | Labeling & File System Access export | 5 |
| 7 | Playwright + data-validation parity + atomic swap | 3 |

**Total:** 28 v1 requirements, 7 phases

---

## Performance Metrics

| Metric | Baseline | Current | Target |
|--------|----------|---------|--------|
| Requirements Mapped | 0 | 28 | 28 |
| Phases Defined | 0 | 7 | 7 |
| Coverage | 0% | 100% | 100% |

---

## Accumulated Context

### Key Decisions (locked after architect review — see `.planning/REVIEW-ARCHITECT.md`)
- **Plain Vue 3 + Vite+ SPA (static `vp build`), not Nuxt, vite-ssg deferred:** one data-heavy page; SPA is simpler, still serverless, and avoids SSG build-time execution of `window`/`location` (kills 2 critical risks).
- **State = Composition API composables** (no Pinia): single-page scope; lightweight, type-safe.
- **TypeScript types in Phase 1** (`types/benchmark.ts`): Entry / Spec / Scores / Tiers / Abilities.
- **Styling = scoped SFC `<style>`, 1:1 CSS port** (Tailwind → v2).
- **Branch isolation:** all work on `feat/vue-vite-static-site`; live `app/index.html` untouched until the Phase 7 atomic swap.
- **Phase 1 spike** validates `vp build` static SPA + end-to-end render before Phases 2–7 execute.
- **Incremental CI:** Playwright selectors validated per-phase (3–6); full 9-point regression in Phase 7.
- **Strict feature parity first**; enhancements → v2. **Pure-JSON data format preserved**; port `import.mjs` as-is.

### Architecture Notes
- App type: **client-rendered SPA**; entry `app/main.ts` mounted into an `index.html` shell; built via `vp build`.
- Data: `app/data/*.json` (pure arrays) loaded in the browser; settings `app/settings.json` (defaultDevice, parametersBreakpoints, devices).
- State: composables (`useTableState` / `useFilters` / `useImportState` or similar).
- Browser-only APIs gated through a `useClientOnly`-style pattern (moot under pure SPA, but explicit).
- Parser: port `app/lib/import.mjs` + `import.test.mjs` to `vp test` (vitest), green.
- Export: File System Access API (`showSaveFilePicker`) client-side; Safari falls back to download.
- Migration safety: new files alongside the legacy app on the branch; atomic swap of `app/index.html` only at Phase 7.

### Todos
- [x] Plan Phase 1: Scaffold + spike → 3 plans (01-01 scaffold/shell · 01-02 types+tests · 01-03 minimal render + `vp build` spike), checker-verified
- [ ] Plan Phase 2: Data Loading & Settings (client-side JSON/settings load, contract preserved)
- [ ] Plan Phase 3: Table Core (three-tier render, sort, color-code, row actions) + table Playwright CPs
- [ ] Plan Phase 4: Filters (search, tier, metrics, params, deprecated) + filter Playwright CPs
- [ ] Plan Phase 5: Import Flow (modal, parser, merge, validation) + import Playwright CP
- [ ] Plan Phase 6: Labeling & Export (inline edit, File System Access save, dirty state) + labeling/export CPs
- [ ] Plan Phase 7: Parity, CI & Swap (full Playwright regression, data validation, atomic swap, no regressions)

### Blockers
None blocking planning. **Watch:** the Phase 1 spike must confirm `vp build` emits a usable static SPA before Phases 2–7 execute (keystone assumption).

---

## Session Continuity

**Session Start:** 2026-06-06
**Roadmap Created:** 2026-06-06
**Architect Review:** 2026-06-06 — verdict REVISE BEFORE EXECUTION; recommendations incorporated
**Last Phase Completed:** —
**Next Action:** `/gsd-execute-phase 1` (execute 3 plans — Wave 1: 01-01; Wave 2: 01-02 ∥ 01-03; note 01-03 ends in a human-verify build checkpoint)

---

*State initialized: 2026-06-06 · revised after architect review 2026-06-06*
