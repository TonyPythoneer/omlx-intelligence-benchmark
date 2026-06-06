# STATE: oMLX Intelligence Benchmark — Vue 3 + Vite+ Migration

**Milestone:** Vue 3 + Vite+ Static Site Migration at Feature Parity  
**Current Phase:** 1 (Scaffold & Bootstrap)  
**Status:** Roadmap created, awaiting phase planning  
**Last Updated:** 2026-06-06

---

## Project Reference

**Core Value:**  
Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

**Current Focus:**  
Migrate the 1581-line vanilla-JS `app/index.html` to a component-based Vue 3 + Vite+ (vite-ssg) static site, preserving serverless operation, the pure-JSON data contract, and all in-browser data import/label/export workflows.

**Key Constraints:**
- Serverless / static output only
- Pure-JSON data contract unchanged
- Browser-only APIs (File System Access, clipboard, hostname guard) client-side, SSG-safe
- Port `app/lib/import.mjs` parser logic with unit tests green
- Existing CI (Playwright UI-validation + data-validation) must pass
- Vue 3 + Vite+ (vite-ssg), no Nuxt

---

## Current Position

**Phase:** 1 — Scaffold & Bootstrap  
**Plan:** Pending  
**Status:** Not started  
**Progress:** 0 / 28 requirements delivered

```
[                                              ]  0%
```

---

## Roadmap Structure

| Phase | Goal | Req Count |
|-------|------|-----------|
| 1 | Vue 3 + Vite+ dev/test/build pipeline | 4 |
| 2 | Data loading & settings SSG-safe | 3 |
| 3 | Three-tier table with sorting/actions | 4 |
| 4 | Filters: search, tier, metrics, params | 5 |
| 5 | Import modal with parser/merge | 4 |
| 6 | Labeling & File System Access export | 5 |
| 7 | Playwright + data-validation parity | 3 |

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

### Key Decisions
- **Vue 3 + Vite+ (vite-ssg), not Nuxt:** Preserve lightweight serverless ethos; avoid SSR runtime. Follow jen-lab vite.config.ts plugin set as reference.
- **Strict feature parity first:** De-risk rewrite; keep verifiable target. Enhancements defer to v2.
- **Pure-JSON data format preserved:** CI, `apply-import.mjs`, and device files depend on it.
- **Supersede "do not run `vp build`" rule:** The new app legitimately needs vite-ssg static build step.

### Architecture Notes
- Entry point: `app/main.ts` → `index.html` shell (vite-ssg pattern)
- Data: `app/data/*.json` (pure arrays, SSG-safe load)
- Settings: `app/settings.json` (defaultDevice, parametersBreakpoints, devices)
- Parser: Port `app/lib/import.mjs` with vitest tests green
- Export: File System Access API (`showSaveFilePicker`) client-side, safari fallback to download
- CI: Playwright + data-validation must stay green

### Todos
- [ ] Plan Phase 1: Scaffold & Bootstrap (Vite+ config, Vue SFC setup, vitest wiring)
- [ ] Plan Phase 2: Data Loading & Settings (SSG-safe JSON/settings load)
- [ ] Plan Phase 3: Table Core (three-tier render, sort, color-code, row actions)
- [ ] Plan Phase 4: Filters (search, tier, metrics, params, deprecated)
- [ ] Plan Phase 5: Import Flow (modal, parser, merge, validation)
- [ ] Plan Phase 6: Labeling & Export (inline edit, File System Access save, dirty state)
- [ ] Plan Phase 7: Parity & CI (Playwright updated, data validation green, no regressions)

### Blockers
None at roadmap stage.

---

## Session Continuity

**Session Start:** 2026-06-06  
**Roadmap Created:** 2026-06-06  
**Last Phase Completed:** —  
**Next Action:** `/gsd-plan-phase 1` (Scaffold & Bootstrap)

---

*State initialized: 2026-06-06*
