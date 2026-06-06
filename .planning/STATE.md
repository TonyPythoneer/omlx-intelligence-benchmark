---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 5
status: planning
last_updated: "2026-06-06T11:08:23.484Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 9
  completed_plans: 9
  percent: 57
---

# STATE: oMLX Intelligence Benchmark — Vue 3 + Vite+ Migration

**Milestone:** Vue 3 + Vite+ Static Site Migration at Feature Parity
**Current Phase:** 5
**Status:** Ready to plan
**Last Updated:** 2026-06-06

---

## Project Reference

**Core Value:**
Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

**Current Focus:**
Phase 04 — filters

**Key Constraints:**

- Serverless / static output only (SPA via `vp build`)
- Pure-JSON data contract unchanged
- Browser-only APIs (File System Access, clipboard, hostname guard) run client-side only
- Port `app/lib/import.mjs` parser logic with unit tests green
- Existing CI (Playwright UI-validation + data-validation) must pass — validated per-phase
- Vue 3 + Vite+, no Nuxt, no SSG/prerender

---

## Current Position

Phase: 04 (filters) — EXECUTING
Plan: 1 of 2
**Phase:** 1 — Scaffold & Bootstrap (+ keystone spike)
**Plan:** Not started
**Phase 2 Status:** 02-01 / 02-02 (2 plans, 2 waves) — planned, ready for Wave 1 after Phase 1 completes
**Overall Progress:** 0 / 28 requirements delivered

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
| 7 | Parity, CI & Swap | 3 |

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

### Phase 2 Planning Notes (2026-06-06)

- **Data serving:** `publicDir: '../public'` with symlinks to app/data and app/settings.json (ensures dev works, files copied to dist on build, pure-JSON contract preserved)
- **useSettings composable:** Fetches /settings.json, returns reactive { settings, defaultDevice, parametersBreakpoints, devices, isLoading, error }
- **useBenchmarkData composable:** Watches selectedDevice ref, fetches /data/{device}.json reactively, returns { entries: Entry[], isLoading, error }
- **DeviceSelector component:** Dropdown bound to selectedDevice via v-model, populated from settings.devices
- **BenchmarkTable update:** Now accepts entries prop, renders v-for loop instead of hardcoded entry
- **MVP vertical slices:** Plan 01 = settings infrastructure (user sees loading state, then selector placeholder). Plan 02 = device selection + data loading + table rendering (user sees selector populated, can select device, table updates).

### Todos

- [x] Plan Phase 1: Scaffold + spike → 3 plans (01-01 scaffold/shell · 01-02 types+tests · 01-03 minimal render + `vp build` spike), checker-verified
- [x] Plan Phase 2: Data Loading & Settings (client-side JSON/settings load, contract preserved) → 2 plans (02-01 vite config + useSettings · 02-02 useBenchmarkData + DeviceSelector + wiring)
- [ ] Execute Phase 1 (Wave 1: 01-01; Wave 2: 01-02 ∥ 01-03)
- [ ] Execute Phase 2 (Wave 1: 02-01; Wave 2: 02-02) — requires Phase 1 complete
- [ ] Plan Phase 3: Table Core (three-tier render, sort, color-code, row actions) + table Playwright CPs
- [ ] Plan Phase 4: Filters (search, tier, metrics, params, deprecated) + filter Playwright CPs
- [ ] Plan Phase 5: Import Flow (modal, parser, merge, validation) + import Playwright CP
- [ ] Plan Phase 6: Labeling & Export (inline edit, File System Access save, dirty state) + labeling/export CPs
- [ ] Plan Phase 7: Parity, CI & Swap (full Playwright regression, data validation, atomic swap, no regressions)

### Blockers

None blocking Phase 1 execution. **Watch:** the Phase 1 spike must confirm `vp build` emits a usable static SPA before Phases 2–7 execute (keystone assumption).

---

## Session Continuity

**Session Start:** 2026-06-06
**Roadmap Created:** 2026-06-06
**Architect Review:** 2026-06-06 — verdict REVISE BEFORE EXECUTION; recommendations incorporated
**Phase 1 Planning:** 2026-06-06 — 3 plans created, checker-verified
**Phase 2 Planning:** 2026-06-06 — 2 plans created, requirement IDs mapped (DATA-01, DATA-02, DATA-03)
**Last Phase Completed:** —
**Next Action:** `/gsd-execute-phase 1` (execute Wave 1: 01-01; then Wave 2: 01-02 ∥ 01-03). After Phase 1 completes and vp build spike confirms static SPA works, execute Phase 2.

---

*State initialized: 2026-06-06 · revised after architect review 2026-06-06 · Phase 2 planning complete 2026-06-06*
