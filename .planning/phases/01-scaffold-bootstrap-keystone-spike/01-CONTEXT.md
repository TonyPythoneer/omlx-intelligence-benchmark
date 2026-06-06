# Phase 1: Scaffold & Bootstrap (+ keystone spike) - Context

**Gathered:** 2026-06-06
**Status:** Ready for planning
**Source:** Orchestrator-authored from locked decisions (PROJECT.md Key Decisions + REVIEW-ARCHITECT.md + ROADMAP.md Phase 1). No interactive discuss-phase (autonomous run).

<domain>
## Phase Boundary

Phase 1 stands up and **proves** a Vue 3 + Vite+ **SPA** scaffold end-to-end, and locks the foundational patterns the later phases build on. It is a Walking Skeleton, not a feature port.

**In scope:**
- Vite+ project scaffolding for a Vue 3 SPA: `@vitejs/plugin-vue`, TypeScript, an `index.html` shell + `main.ts` entry mounting a root `App.vue`.
- `vp dev` (localhost:8080, HMR), `vp test` (vitest), and a **`vp build` spike** that must emit a static, serverless `dist/` that runs with no server.
- Port `app/lib/import.mjs` + `import.test.mjs` into the `vp test` run, kept green (current `vite.config.ts` already has `test.include: ['lib/**/*.test.mjs']`).
- `types/benchmark.ts` — the Entry / Spec / Scores / Tiers / Abilities schema.
- A composables skeleton (Composition API) + a `useClientOnly`-style guard for browser-only APIs.
- A **minimal `BenchmarkTable.vue` that renders ONE real row** (from `app/data/m1-max-64GB-32c.json`) to prove the toolchain top-to-bottom.

**Out of scope (later phases):** loading data from files generically (P2), the full three-tier table (P3), filters (P4), import modal (P5), labeling/export (P6), CI selector reconciliation + atomic swap (P7).
</domain>

<decisions>
## Implementation Decisions

### Architecture (LOCKED — see REVIEW-ARCHITECT.md)
- **Plain Vue 3 + Vite+ SPA**, client-rendered, built static via `vp build`. **vite-ssg deferred** — do NOT add vite-ssg/`unplugin-vue-router`/`vite-plugin-vue-layouts` in Phase 1.
- **No SSR/prerender.** Browser-only code (File System Access, clipboard, `location.hostname`) is always runtime; still establish a `useClientOnly`-style guard composable for explicitness.
- **State = Composition API composables** (`app/composables/…`). No Pinia.
- **Styling = scoped SFC `<style>`**. No Tailwind in Phase 1.
- **TypeScript** throughout; `types/benchmark.ts` is the single source of the data shape.

### Branch / migration safety (LOCKED)
- All work on `feat/vue-vite-static-site`. The live `app/index.html` (vanilla) must keep working through its current path until the Phase 7 atomic swap. **Phase 1 must NOT overwrite or break `app/index.html`.**

### Data shape (from CLAUDE.md / sample data) — seed for `types/benchmark.ts`
- `Entry`: `model: string`, `date: string`, `spec: Spec`, `abilities: Abilities`, `deprecated: boolean`, `tiers: Tiers`, `scores: Scores`.
- `Spec`: `parameters_b: number`, `quantization: string`, `size_gb: number`.
- `Abilities`: `thinking: boolean`, `mtp: boolean`.
- `Tiers`: `opus: boolean`, `sonnet: boolean`, `haiku: boolean`.
- `Scores`: `Record<string, ScoreLeaf>` where each leaf carries Acc/Time — confirm exact leaf shape against `app/data/m1-max-64GB-32c.json` + how `app/index.html` renders Acc/Time.

### Claude's Discretion (planner decides, within constraints)
- **Exact directory layout.** Standard Vite is `index.html` + `src/` at repo root; current `vite.config.ts` uses `root: 'app'` (and `app/index.html` is the LIVE app). Choose a layout that (a) does not clobber the live `app/index.html` before Phase 7, and (b) keeps `make serve` usable. Acceptable options: a separate dev root/entry for the Vue app now + swap at P7, or a `src/`-based root. Document the choice and the P7 swap path.
- Whether the existing `vite.config.ts` is edited in place or a Vue-app config is introduced (respecting the "live app keeps working" constraint).
- `tsconfig.json` / `vp` script wiring in `package.json` (keep `vp dev` on :8080, `vp test`, add a build script).
- Keep Phase-1 dependencies MINIMAL — `vue`, `@vitejs/plugin-vue`, TypeScript. Defer all `unplugin-*`, router, layouts, Tailwind.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Plan & decisions
- `.planning/ROADMAP.md` — Phase 1 goal + 6 success criteria (the contract)
- `.planning/PROJECT.md` — constraints + locked Key Decisions
- `.planning/REVIEW-ARCHITECT.md` — why SPA-over-SSG, state, dir-safety, per-phase CI

### Code to preserve / port / mirror
- `app/index.html` — the 1581-line legacy app (behavior + visual source of truth for LATER phases; Phase 1 renders only a minimal table)
- `app/lib/import.mjs` + `app/lib/import.test.mjs` — parser/merge logic + tests to bring under `vp test`
- `vite.config.ts`, `package.json`, `pnpm-workspace.yaml` — current Vite+ (`vp`) wiring (note `root: 'app'`, `test.include`, catalog deps)
- `app/data/m1-max-64GB-32c.json` — real entry data (drives the minimal row + validates `types/benchmark.ts`)
- `app/settings.json` — settings shape (devices, parametersBreakpoints) for later phases

### Do NOT re-survey
- `jen-lab` is the conceptual reference but is OUT OF SCOPE to re-read (user directive). The stack is already decided here.
</canonical_refs>

<specifics>
## Specific Ideas

- The `vp build` spike is the riskiest unknown: confirm what command produces a static SPA `dist/` and that serving `dist/` works with no server. If `vp build` does not behave, capture findings and resolve before Phases 2–7.
- The minimal `BenchmarkTable.vue` should render one real row imported from `app/data/m1-max-64GB-32c.json` (or a trimmed inline copy) — proves SFC + TS + build pipeline together.
- Keep `app/lib/import.test.mjs` passing under `vp test` unchanged (logic port, not rewrite).
- `useClientOnly` composable: a small wrapper so File-System-Access / clipboard / hostname access in later phases has one established, SSR-safe pattern.
</specifics>

<deferred>
## Deferred Ideas

- Generic data-file loading + device switching → Phase 2
- Full three-tier table, color-coding, sort, row actions → Phase 3
- Filters → Phase 4 · Import modal → Phase 5 · Labeling/Export → Phase 6
- CI selector reconciliation + atomic swap of `app/index.html` → Phase 3–7
- vite-ssg, `unplugin-vue-router`, `vite-plugin-vue-layouts`, auto-import, Tailwind → deferred (v2 / only if a concrete need appears)
</deferred>

---

*Phase: 01-scaffold-bootstrap-keystone-spike*
*Context gathered: 2026-06-06 (autonomous, from locked decisions — no discuss-phase)*
