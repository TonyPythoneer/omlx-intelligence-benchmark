# ROADMAP: oMLX Intelligence Benchmark — Vue 3 + Vite+ Migration

**Milestone:** Vue 3 + Vite+ Static Site Migration at Feature Parity  
**Mode:** MVP vertical slices (brownfield, serverless)  
**Granularity:** Standard (5-8 phases)  
**Coverage:** 28/28 v1 requirements mapped  
**Last Updated:** 2026-06-06

---

## Phases

- [ ] **Phase 1: Scaffold & Bootstrap** - Vue 3 + Vite+ dev/test/build pipeline ready
- [ ] **Phase 2: Data Loading & Settings** - JSON data and settings load SSG-safely
- [ ] **Phase 3: Table Core** - Three-tier benchmark table with sorting and row actions
- [ ] **Phase 4: Filters** - Model search, tier, metrics, params, and deprecated filters
- [ ] **Phase 5: Import Flow** - Local-only benchmark import modal with parser
- [ ] **Phase 6: Labeling & Export** - Inline editing and File System Access save
- [ ] **Phase 7: Parity & CI** - Playwright + data-validation verified at parity

---

## Phase Details

### Phase 1: Scaffold & Bootstrap

**Goal:** Vue 3 + Vite+ development environment fully configured; dev/test/build pipeline working  
**Mode:** mvp  
**Depends on:** Nothing (first phase)  
**Requirements:** SCAF-01, SCAF-02, SCAF-03, SCAF-04  

**Success Criteria** (what must be TRUE):
1. `vp dev` serves the app on localhost:8080 with hot-reload working  
2. `vp test` runs vitest suite; parser unit tests are green  
3. `vp build` produces a static output directory with index.html + CSS/JS bundles  
4. TypeScript compiles without errors; Vue 3 SFCs are recognized by the IDE and type-checker

**Plans:** TBD  
**UI hint:** yes

---

### Phase 2: Data Loading & Settings

**Goal:** Settings and device benchmark JSON load in an SSG-safe way; device selector is populated  
**Mode:** mvp  
**Depends on:** Phase 1  
**Requirements:** DATA-01, DATA-02, DATA-03  

**Success Criteria** (what must be TRUE):
1. Loading localhost:8080 populates the reactive data store from `app/data/*.json` files  
2. `app/settings.json` (defaultDevice, parametersBreakpoints, devices) loads; device selector works  
3. Pure-JSON data contract is preserved; no schema changes to existing `app/data/*.json` files

**Plans:** TBD  
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

**Plans:** TBD  
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

**Plans:** TBD  
**UI hint:** yes

---

### Phase 5: Import Flow

**Goal:** Local-only import modal with stdout parser and merge logic; duplicate model score-only overwrite  
**Mode:** mvp  
**Depends on:** Phase 4  
**Requirements:** IMP-01, IMP-02, IMP-03, IMP-04  

**Success Criteria** (what must be TRUE):
1. `+ Import` button is visible on localhost/127.0.0.1; hidden on other hosts  
2. Pasting benchmark runner stdout shows parsed NEW / OVERWRITE entry list in modal  
3. Apply merges entries into in-memory state; duplicate model overwrites **scores only** (spec / abilities / tiers / deprecated preserved)  
4. NEW entries require spec fields (params / quant / size) to be filled before Apply is enabled

**Plans:** TBD  
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

**Plans:** TBD  
**UI hint:** yes

---

### Phase 7: Parity & CI

**Goal:** Feature parity verified against original; Playwright UI-validation and data-validation CI passing  
**Mode:** mvp  
**Depends on:** Phase 6  
**Requirements:** PAR-01, PAR-02, PAR-03  

**Success Criteria** (what must be TRUE):
1. Playwright UI-validation test (`outputs/ui-validation/final_script.py`) passes against the migrated app (selectors / flows updated as needed)  
2. Data-validation CI workflow stays green on data/ and lib/ changes  
3. No behavioral regressions vs. current `app/index.html`; all filters, import/export, labeling, and table features work identically

**Plans:** TBD  
**UI hint:** yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold & Bootstrap | 0/3 | Not started | — |
| 2. Data Loading & Settings | 0/2 | Not started | — |
| 3. Table Core | 0/3 | Not started | — |
| 4. Filters | 0/4 | Not started | — |
| 5. Import Flow | 0/3 | Not started | — |
| 6. Labeling & Export | 0/4 | Not started | — |
| 7. Parity & CI | 0/2 | Not started | — |

---

*Roadmap created: 2026-06-06*
