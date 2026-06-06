# Requirements: oMLX Intelligence Benchmark — Vue + Vite+ Migration

**Defined:** 2026-06-06
**Core Value:** Browse and compare MLX benchmark results in a fast static page — and import, label, and export that data entirely in the browser, with no server.

## v1 Requirements

Migration to Vue 3 + Vite+ (vite-ssg) at **feature parity** with the current `app/index.html`. Each maps to a roadmap phase.

### Scaffold

- [ ] **SCAF-01**: `vp dev` serves the Vue app on localhost:8080 (parity with `make serve`)
- [ ] **SCAF-02**: A vite-ssg build emits fully static, serverless output (the exact `vp build` vs `vite-ssg build` mechanism is resolved during phase planning)
- [ ] **SCAF-03**: `vp test` runs the ported parser unit tests under vitest, green
- [ ] **SCAF-04**: Vue 3 + `@vitejs/plugin-vue` + TypeScript configured, with the DX unplugin set scoped to actual need (no Nuxt)

### Data

- [ ] **DATA-01**: Device benchmark JSON (`app/data/*.json`) is loaded into the app in an SSG-safe way
- [ ] **DATA-02**: `settings.json` (defaultDevice, parametersBreakpoints, devices) is loaded and drives the UI (device switch, slider breakpoints)
- [ ] **DATA-03**: The pure-JSON data contract is preserved unchanged (no schema edits to data files)

### Table (Viewer Core)

- [ ] **TBL-01**: Three-tier header (category group → benchmark sub-group → Acc/Time leaf) renders from the data
- [ ] **TBL-02**: Score color-coding applies (≥90% green, ≥80% amber, <80% red)
- [ ] **TBL-03**: Default sort is `date DESC`; columns are sortable; the Model column is non-sortable
- [ ] **TBL-04**: Each row offers 📋 (copy model name) and 🤗 (open `huggingface.co/models?search=<model>`)

### Filters

- [x] **FLT-01**: Model substring search filters rows live
- [x] **FLT-02**: Tier segmented filter (All / Opus / Sonnet / Haiku)
- [x] **FLT-03**: Metrics segmented filter (All / Basic / Advanced)
- [x] **FLT-04**: Params dual-handle range slider filters by `parameters_b` using `parametersBreakpoints`
- [x] **FLT-05**: Show Deprecated toggle (deprecated rows hidden by default, preserved on save)

### Import (local only)

- [x] **IMP-01**: `+ Import` opens the import modal and is hidden when not on localhost/127.0.0.1 (hostname guard)
- [x] **IMP-02**: Pasting benchmark stdout runs the ported `import.mjs` parser and produces a NEW / OVERWRITE entry list
- [x] **IMP-03**: Apply merges entries into in-memory state; a duplicate model overwrites **scores only** (spec / abilities / tiers / deprecated preserved)
- [x] **IMP-04**: NEW entries collect required spec fields (params / quant / size) before Apply

### Labeling & Export

- [x] **LAB-01**: Labeling mode inline-edits spec (params / quant / size), abilities (thinking / mtp), deprecated, and tiers (opus / sonnet / haiku)
- [x] **LAB-02**: Validation errors disable Export Data until resolved
- [x] **LAB-03**: Export Data opens a modal with the full JSON and copies it to the clipboard
- [x] **LAB-04**: Save writes to disk via File System Access API (`showSaveFilePicker`); Safari falls back to a download
- [x] **LAB-05**: Export Data surfaces whenever data is dirty (after Apply or a labeling edit) or labeling mode is on

### Parity & CI

- [x] **PAR-01**: The existing Playwright UI-validation (`outputs/ui-validation/final_script.py`) passes against the migrated app (selectors/flows updated as needed)
- [x] **PAR-02**: The existing data-JSON validation CI stays green
- [x] **PAR-03**: Feature parity is verified against the current `index.html` — no behavioral regressions

## v2 Requirements

Deferred to a future milestone. Tracked, not in this roadmap.

### Enhancements

- **ENH-01**: New benchmark/metric features beyond current parity
- **ENH-02**: Design-system polish beyond a faithful visual port (typography, motion, theming)
- **ENH-03**: Multi-device comparison UX improvements
- **ENH-04**: Component/Storybook coverage and visual regression testing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nuxt | User specified "vue and vite plus"; keep a lightweight SSG, avoid SSR runtime |
| Backend / server / database | Site is serverless by design; data lives in JSON + browser memory |
| Changing the JSON data format | CI data-validation, `apply-import.mjs`, and device files depend on it |
| Server-side persistence / replacing FS Access save | Keep the user-confirmed Save-As write model |
| New features beyond parity | This is a migration; expansion is v2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | 1 | Pending |
| SCAF-02 | 1 | Pending |
| SCAF-03 | 1 | Pending |
| SCAF-04 | 1 | Pending |
| DATA-01 | 2 | Pending |
| DATA-02 | 2 | Pending |
| DATA-03 | 2 | Pending |
| TBL-01 | 3 | Pending |
| TBL-02 | 3 | Pending |
| TBL-03 | 3 | Pending |
| TBL-04 | 3 | Pending |
| FLT-01 | 4 | Complete |
| FLT-02 | 4 | Complete |
| FLT-03 | 4 | Complete |
| FLT-04 | 4 | Complete |
| FLT-05 | 4 | Complete |
| IMP-01 | 5 | Complete |
| IMP-02 | 5 | Complete |
| IMP-03 | 5 | Complete |
| IMP-04 | 5 | Complete |
| LAB-01 | 6 | Complete |
| LAB-02 | 6 | Complete |
| LAB-03 | 6 | Complete |
| LAB-04 | 6 | Complete |
| LAB-05 | 6 | Complete |
| PAR-01 | 7 | Complete |
| PAR-02 | 7 | Complete |
| PAR-03 | 7 | Complete |

**Coverage:**

- v1 requirements: 28 total
- Mapped to phases: 28 ✓
- Unmapped: 0 ✓

---

*Requirements defined: 2026-06-06*
*Traceability updated: 2026-06-06 (roadmap created)*
