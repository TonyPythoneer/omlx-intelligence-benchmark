# Architect Review — Vue + Vite+ Migration Roadmap

**Reviewer:** opus architect subagent (`Plan` agent, model=opus)
**Date:** 2026-06-06
**Scope:** PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md + the real `app/index.html`, `import.mjs`, Vite+ config, CI.
**Verdict:** `REVISE BEFORE EXECUTION`

## Orchestrator resolution (applied to the plan)

| Architect recommendation | Decision |
|---|---|
| Use plain Vue + Vite+ **SPA** (static `vp build`), vite-ssg overkill for one page | **Adopted** — SPA is the locked default; vite-ssg deferred to v2/optional. Still fully "Vue + Vite+ + serverless static". Eliminates risks #1 and #2. |
| De-risk build mechanism with a **Phase 1 spike** | **Adopted** — Phase 1 now includes a build + minimal end-to-end render spike. |
| Browser-only APIs client-only / SSR-safe | **Adopted** — moot under SPA (no prerender), but a `useClientOnly`-style guard pattern is locked in Phase 1. |
| **State = Composition API composables** (not Pinia) | **Adopted** — locked in Phase 1. |
| Define **TypeScript types** (`types/benchmark.ts`) in Phase 1 | **Adopted.** |
| **Scoped SFC styles**, 1:1 CSS port (Tailwind → v2) | **Adopted.** |
| **Per-phase Playwright** selector validation (not all in Phase 7) | **Adopted** — Phases 3–6 each validate their own CPs; Phase 7 = final full-suite regression. |
| **Branch isolation** so live `app/index.html` isn't clobbered | **Adopted** — all work on `feat/vue-vite-static-site`; atomic swap at Phase 7. |

---

## Full review (verbatim)

### VERDICT: `REVISE BEFORE EXECUTION`

The roadmap has sound phase structure and clear requirements mapping, but three load-bearing assumptions are unvalidated: (1) vite-ssg integration with `vp`, (2) SSG-safe browser-only APIs, and (3) horizontal vs. vertical phase sequencing. Committing to 6 phases without proving these in Phase 1 will surface blockers late. Phases 3–7 also lack decisions (state architecture, CI selector strategy, directory safety) that should be locked now.

### TOP RISKS

1. **[CRITICAL] vite-ssg ↔ vite-plus integration unvalidated** → SCAF-02 defers "the exact mechanism" to planning, but 6 phases are already committed to a specific tool. A Phase 1 spike must prove `vp build` + vite-ssg plugins don't conflict with `vp test`/hot-reload and emit serverless output. If they do, pivoting to plain Vue SPA mid-project is costly.
2. **[CRITICAL] SSG build-time execution of hostname guard** → The import button is hidden via `window.location.hostname`. Under vite-ssg this evaluates at build time (server-side), not in the browser — the button would be permanently hidden in the built site. Needs `<ClientOnly>`/composable guard; affects Phases 1–5, not a Phase 6 detail.
3. **[HIGH] Horizontal phase sequencing; no vertical slice until Phase 3** → Phase 1 ends with `vp dev` but no visual app; Phase 2 loads data but no table. If toolchain discovery breaks, 2 phases are wasted. MVP slices should render a minimal real table in Phase 1.
4. **[HIGH] State architecture not decided** → Filters, labeling, dirty tracking, import staging, validation — no named approach. Composables (Composition API) are the right fit; lock in Phase 1, not Phase 3.
5. **[MEDIUM-HIGH] CI selector breakage deferred to Phase 7** → Playwright asserts on vanilla-DOM selectors; Vue changes the DOM. Phase 7 would discover 5+ breakages at once. Validate per-phase.
6. **[MEDIUM] Directory collision** → `vite.config root:'app'` and the live `app/index.html`; the Vue app also wants `app/` + `index.html` + `app/main.ts`. No parallel/swap plan — risk of clobbering the working app during Phases 1–6.

### DECISIONS TO LOCK NOW

1. **vite-ssg vs SPA → plain Vue SPA** (built via `vp build`). vite-ssg adds router/layouts plugins without benefit for one page; prerender buys nothing when the page is 100% client-hydrated. SPA is simpler, lighter, same serverless static output.
2. **State → Composition API + composables** (`useTableState`, `useFilters`, `useImportState`). No Pinia.
3. **Directory → feature branch**; keep `app/index.html` on main untouched; merge atomically after Phase 7.
4. **TypeScript types** → `types/benchmark.ts` (Entry, Spec, Scores, Tiers, Abilities) in Phase 1.
5. **Styling → scoped SFC `<style>`**, 1:1 port of inline CSS; Tailwind is a v2 enhancement.
6. **CI → incremental per-phase** Playwright validation; full 9-point suite in Phase 7.

### WHAT'S GOOD

- Clear requirements mapping (28 → 7 phases, 100% coverage); solid traceability.
- Feature parity as the north star; enhancements deferred to v2.
- Data-contract immutability (JSON format, parser logic, CI) — right constraint.
- Phase granularity is right — refine sequencing, not the phases.
- Import/export logic already unit-tested (`import.test.mjs`) — port as-is, low risk.
