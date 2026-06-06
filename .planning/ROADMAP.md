# ROADMAP: oMLX Intelligence Benchmark — Vue 3 + Vite+ Migration

**Milestone:** Vue 3 + Vite+ Static Site Migration at Feature Parity
**Mode:** MVP vertical slices (brownfield, serverless)
**Architecture:** plain Vue 3 + Vite+ **SPA** (static `vp build`); vite-ssg deferred — revised per `.planning/REVIEW-ARCHITECT.md`
**Granularity:** Standard (5-8 phases)
**Coverage:** 28/28 v1 requirements mapped
**Last Updated:** 2026-06-06 (revised per opus architect review)

---

## Phases

- [ ] **Phase 1: Scaffold & Bootstrap (+ keystone spike)** - Vue 3 + Vite+ SPA proven end-to-end; foundational decisions locked
- [x] **Phase 2: Data Loading & Settings** - JSON data and settings load client-side (no SSG) (completed 2026-06-06)
- [x] **Phase 3: Table Core** - Three-tier benchmark table with sorting and row actions (completed 2026-06-06)
- [x] **Phase 4: Filters** - Model search, tier, metrics, params, and deprecated filters (completed 2026-06-06)
- [x] **Phase 5: Import Flow** - Local-only benchmark import modal with parser (planned 2026-06-06) (completed 2026-06-06)
- [x] **Phase 6: Labeling & Export** - Inline editing and File System Access save (completed 2026-06-06)
- [ ] **Phase 7: Parity, CI & Swap** - Full Playwright regression, data-validation, atomic swap to the Vue app

---

## Phase Details

### Phase 1: Scaffold & Bootstrap (+ keystone spike)

**Goal:** Vue 3 + Vite+ SPA scaffold proven end-to-end — dev / test / static-build pipeline working AND a minimal real table row renders — with foundational architecture decisions locked
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** SCAF-01, SCAF-02, SCAF-03, SCAF-04

**Spike first (de-risk before Phases 2–7 commit):** prove `vp build` emits a static, serverless SPA bundle, and render one hardcoded benchmark row through a minimal `BenchmarkTable.vue` to validate the whole toolchain end-to-end. If `vp build` cannot emit a usable static SPA, resolve (or reconsider vite-ssg) before proceeding.

**Foundational decisions established here (from architect review):**

- SPA, no SSG/prerender (vite-ssg deferred)
- State = Composition API composables (no Pinia)
- `types/benchmark.ts` — Entry / Spec / Scores / Tiers / Abilities schema
- `useClientOnly`-style guard for browser-only APIs (File System Access / clipboard / hostname)
- All work stays on `feat/vue-vite-static-site`; live `app/index.html` untouched until the Phase 7 swap

**Success Criteria** (what must be TRUE):

1. `vp dev` serves the Vue app on localhost:8080 with hot-reload working
2. `vp test` runs the vitest suite; the ported parser unit tests are green
3. `vp build` produces a static, serverless SPA output (index.html + JS/CSS, data JSON carried through); serving `dist` works with no server
4. A minimal `BenchmarkTable.vue` renders one real row from a hardcoded entry (end-to-end vertical slice proves the toolchain)
5. TypeScript compiles clean; `types/benchmark.ts` defines the entry schema; Vue SFCs type-check
6. Live `app/index.html` is unchanged on disk (migration isolated to new files on the feature branch)

**Plans:** 3 plans in 2 waves

- [ ] 01-01-PLAN.md — Vite scaffold + shell (Wave 1)
- [ ] 01-02-PLAN.md — Types + test integration (Wave 2)
- [ ] 01-03-PLAN.md — Table render + build spike (Wave 2)

**UI hint:** yes

---

### Phase 2: Data Loading & Settings

**Goal:** Settings and device benchmark JSON load client-side; device selector is populated
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** DATA-01, DATA-02, DATA-03

**Success Criteria** (what must be TRUE):

1. Loading localhost:8080 populates the reactive data store from `app/data/*.json` (loaded in the browser, not inlined at build time)
2. `app/settings.json` (defaultDevice, parametersBreakpoints, devices) loads; device selector works
3. Pure-JSON data contract is preserved; no schema changes to existing `app/data/*.json`; `vp build` output carries the JSON through unprocessed

**Plans:** 2/2 plans complete

- [x] 02-01-PLAN.md — Vite config + useSettings composable (Wave 1)
- [x] 02-02-PLAN.md — useBenchmarkData + DeviceSelector + table wiring (Wave 2)

**UI hint:** yes

---

### Phase 3: Table Core

**Goal:** Three-tier benchmark table renders with proper structure, color-coding, sorting, and row actions
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** TBL-01, TBL-02, TBL-03, TBL-04

**Success Criteria** (what must be TRUE):

1. Three-tier table header (category group → benchmark sub-group → Acc/Time leaf) renders from loaded data
2. Score color-coding applies (≥90% green, ≥80% amber, <80% red)
3. Default sort is `date DESC`; other columns are clickable to sort; Model column is non-sortable
4. Each table row has 📋 (copy model name) and 🤗 (open `huggingface.co/models?search=<model>`) buttons
5. **CI (incremental):** Playwright table checkpoints (page-load rows, sort) pass against the new DOM — selectors updated as needed

**Plans:** 2/2 plans complete

- [x] 03-01-PLAN.md — Three-tier header + color-coding (Wave 1)
- [x] 03-02-PLAN.md — Sorting + row actions (Wave 2)

**UI hint:** yes

---

### Phase 4: Filters

**Goal:** All filter controls (search, tier, metrics, params slider, deprecated toggle) work independently and in combination
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** FLT-01, FLT-02, FLT-03, FLT-04, FLT-05

**Success Criteria** (what must be TRUE):

1. Model substring search filters rows live as user types
2. Tier (All / Opus / Sonnet / Haiku) and Metrics (All / Basic / Advanced) segmented filters apply correctly
3. Params dual-handle range slider filters by `parameters_b` using `parametersBreakpoints`
4. Show Deprecated toggle hides deprecated rows by default; can toggle to show
5. All filters combine correctly (AND logic for multi-filter selections)
6. **CI (incremental):** Playwright filter checkpoints (tier, model search, show-deprecated, params) pass against the new DOM

**Plans:** 2/2 plans complete

- [x] 04-01-PLAN.md — Filter infrastructure + model search + tier/metrics filters (Wave 1)
- [x] 04-02-PLAN.md — Params slider + show deprecated toggle (Wave 2)

**UI hint:** yes

---

### Phase 5: Import Flow

**Goal:** Local-only import modal with stdout parser and merge logic; duplicate model score-only overwrite
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** IMP-01, IMP-02, IMP-03, IMP-04

**Success Criteria** (what must be TRUE):

1. `+ Import` button is visible on localhost/127.0.0.1; hidden on other hosts (client-side hostname guard)
2. Pasting benchmark runner stdout shows the parsed NEW / OVERWRITE entry list in the modal
3. Apply merges entries into in-memory state; duplicate model overwrites **scores only** (spec / abilities / tiers / deprecated preserved)
4. NEW entries require spec fields (params / quant / size) to be filled before Apply is enabled
5. **CI (incremental):** Playwright import checkpoint (open modal → paste → apply) passes against the new DOM

**Plans:** 2/2 plans complete

- [x] 05-01-PLAN.md — Modal UI + hostname guard + useImport state setup (Wave 1)
- [x] 05-02-PLAN.md — Merge logic + unit tests + Playwright checkpoint (Wave 2)

**UI hint:** yes

---

### Phase 6: Labeling & Export

**Goal:** Inline editing of entries (spec, abilities, deprecated, tiers) and JSON export/save via File System Access API
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** LAB-01, LAB-02, LAB-03, LAB-04, LAB-05

**Success Criteria** (what must be TRUE):

1. ✏ Label button opens inline editors for spec (params / quant / size), abilities (thinking / mtp), deprecated, and tiers (opus / sonnet / haiku)
2. Validation errors prevent Export Data from being applied until resolved
3. Export Data modal shows the full JSON and copies it to the clipboard
4. Save writes to disk via `showSaveFilePicker`; Safari falls back to a download
5. Export Data button surfaces whenever data is dirty (after Apply or labeling edit) or labeling mode is on
6. **CI (incremental):** Playwright labeling + export checkpoints pass against the new DOM

**Plans:** 2/2 plans complete

- [x] 06-01-PLAN.md — Labeling state + inline editors (Wave 1)
- [x] 06-02-PLAN.md — Export modal + file save (Wave 2)

**UI hint:** yes

---

### Phase 7: Parity, CI & Swap

**Goal:** Feature parity verified against the original; full Playwright + data-validation CI green; the Vue SPA atomically replaces the legacy `app/index.html`
**Mode:** mvp
**Depends on:** Phase 6
**Requirements:** PAR-01, PAR-02, PAR-03

**Success Criteria** (what must be TRUE):

1. The full 9-point Playwright suite (`outputs/ui-validation/final_script.py`) passes as a final regression — per-phase selectors already validated in Phases 3–6
2. Data-validation CI workflow stays green on data/ and lib/ changes
3. No behavioral regressions vs. current `app/index.html`; all filters, import/export, labeling, and table features work identically
4. **Atomic swap:** the Vue SPA build replaces the legacy `app/index.html` as the served/deployed app; deploy (`cd-static.yml`) stays serverless; `make serve` / `vp dev` / `vp test` still work

**Plans:** TBD
**UI hint:** yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold & Bootstrap (+ spike) | 3/3 | In planning | — |
| 2. Data Loading & Settings | 2/2 | Complete   | 2026-06-06 |
| 3. Table Core | 2/2 | Complete   | 2026-06-06 |
| 4. Filters | 2/2 | Complete    | 2026-06-06 |
| 5. Import Flow | 2/2 | Complete    | 2026-06-06 |
| 6. Labeling & Export | 2/2 | Complete    | 2026-06-06 |
| 7. Parity, CI & Swap | 0/3 | Not started | — |

---

*Roadmap created: 2026-06-06 · revised 2026-06-06 per opus architect review (see `.planning/REVIEW-ARCHITECT.md`)*
*Phase 1 plans finalized: 2026-06-06 (3 plans in 2 execution waves)*
*Phase 2 plans finalized: 2026-06-06 (2 plans in 2 execution waves)*
*Phase 3 plans finalized: 2026-06-06 (2 plans in 2 execution waves)*
*Phase 4 plans finalized: 2026-06-06 (2 plans in 2 execution waves)*
*Phase 5 plans finalized: 2026-06-06 (2 plans in 2 execution waves)*
*Phase 6 plans finalized: 2026-06-06 (2 plans in 2 execution waves)*
