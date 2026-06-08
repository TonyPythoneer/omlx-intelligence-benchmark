# Requirements: oMLX Intelligence Benchmark — v1.2 vp-example Foundation Alignment + reka-ui Select

**Defined:** 2026-06-08
**Core Value:** Browse and compare MLX benchmark results in a fast, fully static page — and import, label, and export that data entirely in the browser, with no server ever required.

**Milestone driver:** Align the project's setup / configuration / foundation to the canonical **`vp project example`** (reference: `/Users/tonyyang/git/personal/my-vp-app-project`), and finish the reka-ui adoption by migrating `select` (user overrode the earlier "keep native" decision: "ui 都用 reka-ui"). User chose **full structural alignment** ("go 1") and granted full autonomy ("don't ask me anymore").

> v1.0 + v1.1 requirements are recorded as Validated in PROJECT.md; this file scopes v1.2 only.

## v1.2 Requirements

### Toolchain foundation (FND)

- [x] **FND-01**: `vite.config.ts` uses `defineConfig` from **`vite-plus`** (not `vite`), with the example's `staged` (`"*": "vp check --fix"`), `fmt: {}`, and `lint` block (`jsPlugins` vite-plus oxlint-plugin, `rules: { "vite-plus/prefer-vite-plus-imports": "error" }`, `options: { typeAware: true, typeCheck: true }`). Vue + Tailwind plugins and the `@` alias are retained (the app is a Vue SPA, the starter is vanilla — keep what the app legitimately needs).
- [x] **FND-02**: `tsconfig.json` matches the example's compiler options (target es2023, lib ES2023+DOM, `types: ["vite-plus/client"]` plus the Vue SFC shim, bundler mode, `verbatimModuleSyntax`, `moduleDetection: force`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noEmit`), adapted minimally for Vue (keep `.vue` module declarations / `jsx: preserve` only if required to compile).
- [x] **FND-03**: `package.json` scripts match the example shape: `dev: vp dev`, `build: tsc && vp build`, `preview: vp preview`, `prepare: vp config` (test stays `vp test`).
- [x] **FND-04**: Vite+ git hooks (`.vite-hooks/`) and editor config (`.zed/settings.json`) are generated/added as in the example; the `<!--VITE PLUS START/END-->` block is present in `CLAUDE.md`.
- [x] **FND-05**: `vp check` passes clean (format + lint + typecheck) after the strict config is active — all `prefer-vite-plus-imports` / typeAware / unused-locals fallout fixed across the existing source.

### Structure alignment (STR)

- [x] **STR-01**: `index.html` lives at the project **root** with `/src/main.ts` as entry; `vite.config` no longer overrides `root: 'src'` (uses default root + default `public/`).
- [x] **STR-02**: Benchmark data is moved to a real `public/` dir — `public/data/*.json` and `public/settings.json` (real files, not symlinks to `app/`); the data-loading fetch paths in code still resolve (served at `/data/*`, `/settings.json`).
- [x] **STR-03**: The legacy vanilla `app/` directory (and the `public/` symlinks into it) is removed; no duplicate data sources remain.
- [x] **STR-04**: CI is updated for the new layout — `validate-data.yml` (data path), `cd-static.yml` (build/deploy `dist/`), `ci-ui-validation.yml` — and `CLAUDE.md` project docs reflect the new structure and data-edit workflow.
- [x] **STR-05**: `make serve` / `vp dev` / `vp build` / `vp test` all work against the new structure; the app renders and loads data identically; build output in `dist/` deploys.

### reka-ui Select (SEL)

- [ ] **SEL-01**: `ui/select.vue` is rebuilt on reka-ui `Select*` primitives (`SelectRoot`/`SelectTrigger`/`SelectValue`/`SelectPortal`/`SelectContent`/`SelectItem`…), cva/`cn()` styled, replacing the native `<select>`.
- [ ] **SEL-02**: `DeviceSelector.vue` migrates its `<option>` children to `SelectItem`s while preserving its public API (`devices` / `modelValue` props, `update:modelValue` emit); device selection works identically (keyboard, aria).
- [ ] **SEL-03**: The CLAUDE.md convention is updated — all interactive widgets (slider, dialog, select) on reka-ui; remove the "native select retained" carve-out.

## Definition of Done

- `vp check` and `vp test` green; app builds (`vp build`) and runs (`vp dev`) identically; data loads from real `public/`.
- Foundation files (vite.config, tsconfig, package.json scripts, `.vite-hooks`, `.zed`, CLAUDE.md vp block) match the `vp project example`.
- Legacy `app/` removed; CI updated and green.
- `ui/select.vue` on reka-ui; DeviceSelector unchanged in behaviour.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Changing the JSON data contract | Only the file *location* moves (app/ → public/); shape unchanged |
| Adding Storybook / Velite / unplugin auto-imports | Not part of the vp-example foundation |
| Feature changes to the viewer | This is a foundation/structure alignment |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01..05 | Phase 11 | Done |
| STR-01..05 | Phase 12 | Done |
| SEL-01..03 | Phase 13 | Pending |

**Coverage:** 13 requirements → 3 phases (11 Foundation, 12 Structure, 13 Select). 0 unmapped.

---
*Requirements defined: 2026-06-08 — milestone v1.2*
