<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# CLAUDE.md — oMLX Intelligence Benchmark

## Project overview

Benchmark comparison page for oMLX/MLX model results, built as a Vue 3 + TypeScript SPA on the Vite+ (`vp`) toolchain and deployed to GitHub Pages as static files (built to `dist/`). All data management (import, edit, export) happens in-browser; no Python or CLI tooling is needed to use the app.

## Project Directory

```
index.html                  — Vite entry at project root; loads /src/main.ts
src/                        — Vue 3 + TypeScript SPA
  main.ts                   — app bootstrap (mounts App.vue, imports index.css)
  App.vue                   — root component (benchmark viewer + data editor)
  index.css                 — Tailwind v4 entry + global styles
  components/               — Vue components (incl. ui/ = shadcn-vue + reka-ui primitives)
  composables/              — useBenchmarkData, useSettings, useImport, useLabeling (+ tests)
  lib/                      — import.mjs (benchmark stdout parser + merge logic) + import.test.mjs
  types/                    — TypeScript types (benchmark.ts)
public/                     — static assets served at the site root
  settings.json             — defaultDevice, parametersBreakpoints, device metadata
  data/*.json               — device-specific benchmark data (pure JSON arrays)
  data/device.json.template — empty template for new devices
vite.config.ts              — Vite+ config (vue + tailwind plugins, @->src, port 8080, build->dist)

scripts/                    — local dev utilities (not imported by the app)
  apply-import.mjs          — CLI to apply benchmark stdout directly to a data file
  screenshot.mjs            — headless screenshot helper
  explore.js                — ad-hoc browser exploration scratch script

docs/
  readme/                   — assets and pages for project documentation
  superpowers/
    specs/                  — brainstorming output: design documents
    plans/                  — implementation plans (produced by writing-plans skill)

outputs/                    — webwright workspaces; machine-generated, machine-verified with context/scenario from human
  ui-validation/            — Playwright UI validation workspace
    plan.md                 — critical points checklist
    final_script.py         — validated Playwright script (9 CPs, runs against localhost:8080)
    final_runs/             — execution artifacts: screenshots + logs (gitignored)

.github/workflows/          — CI/CD
  ci-ui-validation.yml      — runs final_script.py on src/ + public/data changes
  validate-data.yml         — validates data JSON on public/data + src/lib changes
  cd-static.yml             — builds the SPA (vp build) and deploys dist/ to Pages
  auto-data-import.yml      — automates benchmark data import
  post-merge-notify.yml     — post-merge notifications
```

## Architecture

```
index.html                  — Vite entry at project root; <script src="/src/main.ts">
src/                        — Vue 3 + TypeScript SPA (viewer + import/label/export editor)
public/settings.json        — defaultDevice, parametersBreakpoints, device metadata
public/data/*.json          — device-specific benchmark data (pure JSON arrays), served at /data/*
public/data/device.json.template  — empty template for new devices
```

Data is fetched at runtime: `useSettings` fetches `/settings.json`, `useBenchmarkData` fetches `/data/{device}.json`. Files in `public/` are served at the site root in dev and copied verbatim into `dist/` on build.

**Data format** — each file is a pure JSON array of entry objects:

```json
[
  {
    "model": "...",
    "date": "2026-05-25",
    "spec": { "parameters_b": 35, "quantization": "4bit", "size_gb": 19.5 },
    "abilities": { "thinking": true, "mtp": false },
    "deprecated": false,
    "tiers": { "opus": true, "sonnet": false, "haiku": false },
    "scores": { "MMLU": {}, "TRUTHFULQA": {}, "...": {} }
  }
]
```

## Key code

- **`src/` Vue SPA** (entry `index.html` → `/src/main.ts` → `App.vue`). Components:
  - Three-tier header (category group → benchmark sub-group → leaf Acc/Time), score color-coding (≥90% green, ≥80% amber, <80% red).
  - Filters: model substring search, Tier (All/Opus/Sonnet/Haiku) and Metrics (All/Basic/Advanced) segmented buttons, Params dual-handle range slider, Show Deprecated checkbox.
  - Default sort by `date DESC`; Model column non-sortable; other columns clickable.
  - Per-row 📋 (copy model name) and 🤗 (open `huggingface.co/models?search=<model>`).
  - **Import Modal** (`+ Import`): paste benchmark stdout → `src/lib/import.mjs` parser → list of NEW/OVERWRITE entries → `Apply` merges into in-memory state (does not write to disk).
  - **Labeling Mode** (`✏ Label`): inline editors for spec (params/quant/size), abilities (thinking/mtp), deprecated, and tiers (opus/sonnet/haiku). Validation errors disable Export Data.
  - **Export Data**: appears whenever data is dirty (after Apply or labeling edits) or labeling mode is on. Opens a modal with the full JSON; user copies to clipboard or saves to file via `showSaveFilePicker()` (Safari falls back to download).
  - **Params slider breakpoints:** edit `parametersBreakpoints` in `public/settings.json` directly; no UI for this (rarely changes).
  - **Hostname guard:** `+ Import` button is hidden when not on `localhost` / `127.0.0.1`.

- **`public/settings.json`** — `defaultDevice`, `parametersBreakpoints` (Params slider tick array), and `devices` (key → family/variant/memory/gpus metadata).

## UI component conventions

For the Vue SPA (`src/components/ui/`):

- **Custom interactive widgets** (slider, dialog, select, …) are built on **reka-ui headless primitives** — never hand-rolled from divs. `ui/slider.vue` (reka-ui `Slider*` dual-thumb range), `ui/dialog.vue` (reka-ui `Dialog*`: focus-trap, Escape-to-close, scroll-lock, ARIA), and `ui/select.vue` + `ui/select-item.vue` (reka-ui `Select*`: combobox/listbox ARIA, keyboard + type-ahead, portalled popper) are the instances. Headless primitives give keyboard a11y and ARIA for free and avoid hacks like the old `::-webkit-slider-*` range inputs (the anti-pattern this convention replaces).
- **Native HTML controls remain valid for genuinely leaf inputs** (`<input>`, `<textarea>`, checkboxes) — _using the platform_ over hand-rolling. But **`select` is now reka-ui**: `ui/select.vue` was migrated off the native `<select>` so all interactive widgets (slider, dialog, select) share the reka-ui contract. Do not reintroduce a native `<select>` wrapper.
- **Leaf components** (input/textarea/label/card/badge/button) stay **plain `cva`-styled elements** — no headless primitive needed, no a11y benefit, and that is also standard shadcn-vue.
- The styling contract for every `ui/` component is **`cva` + `VariantProps` + `cn()` (from `@/lib/utils`)** — explicitly **no `App*` shim** and **no manual variant maps**.

## Usage

```bash
make serve   # vp dev on http://localhost:8080
make test    # vp test
```

**Importing benchmark results** (local only):

1. Open the page in Chrome/Edge at `http://localhost:8080/`.
2. Click `+ Import`, paste benchmark runner stdout, fill spec fields for NEW entries.
3. Click Save → native Save As dialog → navigate to `public/data/`, overwrite the device file.

Safari users can use Import but Save will trigger a download instead of overwriting.

## Rules

- Data files are pure JSON arrays.
- New devices: copy `public/data/device.json.template`, rename to `<device-key>.json`, add entry to `public/settings.json`.
- `deprecated: true` entries are filtered by default in the viewer but preserved on save.
- Import on a duplicate model **only overwrites `scores`**; spec / abilities / tiers / deprecated are preserved.
- Labeling Mode is the only place to edit spec / abilities / tiers / deprecated post-import.
- File writes require the File System Access API; only the user's Save As confirmation actually writes to disk.
- Dev server via `vp dev` (`make serve`), tests via `vp test` (`make test`). The site ships as a static build: `vp build` outputs `dist/` (root), which `cd-static.yml` deploys to GitHub Pages. There is no runtime server — all data lives in `public/` and is fetched client-side.
