# oMLX Intelligence Benchmark — Vue + Vite+ Static Site

## What This Is

A static, serverless benchmark comparison site for oMLX / MLX model results. Today it is a single 1581-line vanilla-JS `app/index.html` (viewer + in-browser data editor). This milestone migrates it into a component-based **Vue 3 + Vite+ (`vp`) static site** — built as a client-rendered SPA via `vp build` (vite-ssg deferred per architect review; see Key Decisions), borrowing the `jen-lab` toolchain family — while preserving the serverless, in-browser data-import/label/export model and the pure-JSON data contract.

## Core Value

Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

## Requirements

### Validated

<!-- Inferred from the existing app/index.html — shipped and relied upon. Must survive the migration at parity. -->

- ✓ Three-tier benchmark table (category group → benchmark sub-group → Acc/Time leaf) with score color-coding (≥90 green, ≥80 amber, <80 red) — existing
- ✓ Filters: model substring search, Tier (All/Opus/Sonnet/Haiku), Metrics (All/Basic/Advanced), Params dual-handle range slider, Show Deprecated — existing
- ✓ Default sort by `date DESC`; sortable columns; Model column non-sortable — existing
- ✓ Per-row 📋 copy-model-name and 🤗 open-HuggingFace-search actions — existing
- ✓ Import modal: paste benchmark stdout → JS parser → NEW/OVERWRITE list → in-memory merge (overwrite **scores only** on duplicate model) — existing
- ✓ Labeling mode: inline edit of spec (params/quant/size), abilities (thinking/mtp), deprecated, tiers (opus/sonnet/haiku) with validation gating Export — existing
- ✓ Export Data: full JSON via clipboard or File System Access API (`showSaveFilePicker`, Safari falls back to download) — existing
- ✓ Pure-JSON data files per device (`app/data/*.json`) + `app/settings.json` (defaultDevice, parametersBreakpoints, devices) — existing
- ✓ Hostname guard: `+ Import` hidden when not on localhost/127.0.0.1 — existing
- ✓ Vite+ dev/test wiring (`vp dev` / `vp test`, `make serve` on :8080) — existing
- ✓ CI: UI-validation (Playwright `final_script.py`) + data-JSON validation — existing

### Active

<!-- This migration. Hypotheses until shipped. -->

- [ ] Rebuild the viewer UI as Vue 3 single-file components on Vite+ (vite-ssg), at **feature parity** with the current index.html
- [ ] Adopt the `jen-lab` toolchain pattern as appropriate: `@vitejs/plugin-vue`, file-based structure (`app/` source root, `app/main.ts` entry, `index.html` shell), and the unplugin DX set (vue-router/layouts/auto-import/components) scoped to actual need
- [ ] Port the stdout parser + merge logic from `app/lib/import.mjs` into the Vue app, keeping its unit tests green
- [ ] Preserve the pure-JSON data contract and the in-browser save path (File System Access API) under SSG
- [ ] Produce a static build (`vp build` / vite-ssg) that deploys with no server, keeping `make serve` / `vp dev` / `vp test`
- [ ] Keep the existing CI green (UI-validation + data-validation) against the migrated app

### Out of Scope

- **Nuxt** — user specified "vue and vite plus"; avoid Nuxt's heavier SSR/runtime. Borrow jen-lab's *tooling* (Vite+, plugins, conventions), not its Nuxt core — keep this a lightweight SSG.
- **Any backend / server / database** — the site is serverless by design; all data lives in JSON files and browser memory.
- **Changing the JSON data format** — downstream tooling (`scripts/apply-import.mjs`, CI data-validation) and the device files depend on it.
- **New benchmark features beyond parity** — this is a migration, not a feature expansion. New capabilities defer to v2.
- **Replacing the File System Access save model** — keep the user-confirmed Save-As write path; do not add server-side persistence.

## Context

- The repo is **already wired to Vite+** (`@voidzero-dev/vite-plus-core`, `vp dev`/`vp test`) but the app itself is vanilla `app/index.html` — no Vue, no build step today.
- **Reference project:** `/Users/tonyyang/git/personal/jen-lab` — a Vue 3 site whose core is Nuxt 4 + Nuxt UI + Nuxt Content, but which also carries a full **vite-ssg** `vite.config.ts` (unplugin-vue-router on `app/pages`, vite-plugin-vue-layouts, unplugin-auto-import, unplugin-vue-components, velite, Tailwind v4, unplugin-fonts; entry `index.html → /app/main.ts`). That vite-ssg config is the concrete template for "Vue + Vite+ static site."
- Data lives in `app/data/*.json` (e.g. `m1-max-64GB-32c.json`) + `app/data/device.json.template`; settings in `app/settings.json`. The parser/merge logic lives in `app/lib/import.mjs` with `import.test.mjs` tests.
- CI workflows depend on app HTML/JS changes (`ci-ui-validation.yml`) and data/lib changes (`validate-data.yml`), plus `cd-static.yml`, `auto-data-import.yml`, `post-merge-notify.yml`.
- Known constraints from `CLAUDE.md`: keep `app/index.html` serverless; **do not run `vp build`** historically because the site was serverless-by-hand — that rule will be *superseded* for the migrated app, which legitimately needs a vite-ssg build step producing static output.

## Constraints

- **Tech stack**: Vue 3 + Vite+ (`@voidzero-dev/vite-plus-core`, `vp`), static **SPA** build (vite-ssg deferred) — Why: single-page scope; SPA is simpler, stays fully serverless, and avoids build-time execution of browser-only code; runs on the existing `vp` wiring.
- **Serverless**: the built site must be fully static; no runtime server — Why: core product property and deploy model (`cd-static.yml`).
- **Data contract**: `app/data/*.json` stay pure JSON arrays; import "overwrite scores only on duplicate" rule preserved — Why: CI + downstream tooling depend on it.
- **Browser-only APIs**: File System Access (`showSaveFilePicker`), clipboard, hostname guard must run client-side and be SSG-safe (no SSR access) — Why: the import/label/export flow is the differentiator.
- **Compatibility**: keep `make serve`, `vp dev`, `vp test`; existing CI (UI-validation, data-validation) must keep passing — Why: don't break the dev loop or release gates.
- **Runtime**: Node `>=24` (existing `engines`) — Why: matches Vite+/pnpm catalog setup.

## Key Decisions

| Decision | Rationale | Outcome |
| **Plain Vue 3 + Vite+ SPA** (static `vp build`), **not** Nuxt, **vite-ssg deferred** | One data-heavy page; SPA is simpler, still fully serverless static, and avoids SSG build-time execution of `window`/`location` (kills 2 critical risks) | ✓ Locked (architect review) |
| **No SSR/prerender of browser-only code** — File System Access / clipboard / hostname guard run client-side only | SPA renders in the browser; a `useClientOnly`-style guard pattern is established in Phase 1 | ✓ Locked |
| **State via Composition API composables** (no Pinia) | Single-page scope; lightweight and type-safe; Pinia boilerplate unwarranted | ✓ Locked |
| **TypeScript data-model types in Phase 1** (`types/benchmark.ts`) | Phases 3–6 build on a typed schema; prevents late refactor | ✓ Locked |
| **Styling: scoped SFC `<style>`, 1:1 CSS port** (Tailwind → v2) | Faithful parity migration; preserve current design exactly | ✓ Locked |
| **Migration isolated on `feat/vue-vite-static-site`; main's `app/index.html` untouched until parity** | `vite.config root:'app'` collides with the live app; atomic swap at Phase 7 | ✓ Locked |
| **Phase 1 build/render spike before Phases 2–7 execute** | Validate `vp build` static output + end-to-end render early (keystone assumption) | ✓ Locked |
| Preserve JSON data format + port `import.mjs` logic as-is | CI, `apply-import.mjs`, and device files depend on it | ✓ Locked |
| Strict feature parity first; new features → v2 | De-risk the rewrite; keep a verifiable target | ✓ Locked |
| Supersede the "do not run `vp build`" rule for the new app | The migrated SPA legitimately needs a static build; output stays serverless | ✓ Locked |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-06 after initialization*
