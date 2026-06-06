---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 05
status: executing
last_updated: "2026-06-06T11:12:59.231Z"
progress:
  total_phases: 7
  completed_phases: 4
  total_plans: 11
  completed_plans: 9
  percent: 57
---

# STATE: oMLX Intelligence Benchmark — Vue 3 + Vite+ Migration

**Milestone:** Vue 3 + Vite+ Static Site Migration at Feature Parity
**Current Phase:** 05
**Status:** Executing Phase 05
**Last Updated:** 2026-06-06

---

## Project Reference

**Core Value:**
Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

**Current Focus:**
Phase 05 — import-flow

**Key Constraints:**

- Serverless / static output only (SPA via `vp build`)
- Pure-JSON data contract unchanged
- Browser-only APIs (File System Access, clipboard, hostname guard) run client-side only
- Port `app/lib/import.mjs` parser logic with unit tests green
- Existing CI (Playwright UI-validation + data-validation) must pass — validated per-phase
- Vue 3 + Vite+, no Nuxt, no SSG/prerender

---

## Current Position

Phase: 05 (import-flow) — EXECUTING
Plan: 1 of 2
**Phase 5 Planning:** Complete — 2 plans in 2 waves
**Overall Progress:** 11 / 28 requirements planned (39%)

```
[=====================                             ]  39%
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
| Plans Created | 0 | 11 | 11 |
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

### Phase 5 Planning Notes (2026-06-06)

- **Import UI flow:** Wave 1 = Modal dialog + hostname guard + useImport state setup. Wave 2 = merge logic + unit tests + Playwright checkpoint.
- **useImport composable:** Manages isModalOpen, importText, parsedEntries (computed via parseImportInput), isApplyEnabled (true when all NEW entries have spec filled), applyImport(currentEntries) function.
- **ImportModal component:** Modal dialog with textarea, parsed entries list with NEW/OVERWRITE status badges, spec form for NEW entries (params_b, quantization, size_gb), Apply and Cancel buttons.
- **App.vue wiring:** Mutable entries ref pattern (copy from useBenchmarkData, watch to update), isLocalhost computed (hostname guard), + Import button visible on localhost/127.0.0.1 only.
- **Merge algorithm:** NEW entries get full Entry with user-filled spec + date + default abilities/tiers/deprecated. OVERWRITE updates scores only, preserves spec/abilities/tiers/deprecated.

### Todos

- [x] Plan Phase 1: Scaffold + spike → 3 plans (01-01 scaffold/shell · 01-02 types+tests · 01-03 minimal render + `vp build` spike), checker-verified
- [x] Plan Phase 2: Data Loading & Settings (client-side JSON/settings load, contract preserved) → 2 plans (02-01 vite config + useSettings · 02-02 useBenchmarkData + DeviceSelector + wiring)
- [x] Plan Phase 3: Table Core (three-tier render, sort, color-code, row actions) → 2 plans, checker-verified
- [x] Plan Phase 4: Filters (search, tier, metrics, params, deprecated) → 2 plans, checker-verified
- [x] Plan Phase 5: Import Flow (modal, parser, merge, validation) → 2 plans (05-01 UI setup + hostname guard · 05-02 merge logic + tests + Playwright CP)
- [ ] Execute Phase 1 (Wave 1: 01-01; Wave 2: 01-02 ∥ 01-03)
- [ ] Execute Phase 2 (Wave 1: 02-01; Wave 2: 02-02) — requires Phase 1 complete
- [ ] Execute Phase 3 (Wave 1: 03-01; Wave 2: 03-02) — requires Phase 2 complete
- [ ] Execute Phase 4 (Wave 1: 04-01; Wave 2: 04-02) — requires Phase 3 complete
- [ ] Execute Phase 5 (Wave 1: 05-01; Wave 2: 05-02) — requires Phase 4 complete
- [ ] Plan Phase 6: Labeling & Export (inline edit, File System Access save, dirty state) + labeling/export CPs
- [ ] Plan Phase 7: Parity, CI & Swap (full Playwright regression, data validation, atomic swap, no regressions)

### Blockers

None blocking Phase 5 execution. Phases 1–4 completed; Phase 5 ready to execute.

---

## Session Continuity

**Session Start:** 2026-06-06
**Roadmap Created:** 2026-06-06
**Architect Review:** 2026-06-06 — verdict REVISE BEFORE EXECUTION; recommendations incorporated
**Phase 1 Planning:** 2026-06-06 — 3 plans created, checker-verified
**Phase 2 Planning:** 2026-06-06 — 2 plans created, requirement IDs mapped (DATA-01, DATA-02, DATA-03)
**Phase 3 Planning:** 2026-06-06 — 2 plans created, requirement IDs mapped (TBL-01, TBL-02, TBL-03, TBL-04)
**Phase 4 Planning:** 2026-06-06 — 2 plans created, requirement IDs mapped (FLT-01, FLT-02, FLT-03, FLT-04, FLT-05)
**Phase 5 Planning:** 2026-06-06 — 2 plans created, requirement IDs mapped (IMP-01, IMP-02, IMP-03, IMP-04)
**Last Phase Completed:** —
**Next Action:** `/gsd-execute-phase 5` to start Wave 1 (05-01: Modal UI + hostname guard + useImport state setup). Requires Phase 4 to be complete.

---

*State initialized: 2026-06-06 · revised after architect review 2026-06-06 · Phase 2 planning complete 2026-06-06 · Phase 3/4/5 planning complete 2026-06-06*
