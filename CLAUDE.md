# CLAUDE.md — oMLX Intelligence Benchmark

## Project overview

Static benchmark comparison page for oMLX/MLX model results. Single HTML file, no server needed. All data management (import, edit, export) happens in-browser; no Python or CLI tooling.

## Project Directory

```
app/                        — static site (served by make serve, no build step)
  index.html                — single-page benchmark viewer + data editor (HTML + CSS + vanilla JS)
  settings.json             — defaultDevice, parametersBreakpoints, device metadata
  data/*.json               — device-specific benchmark data (pure JSON arrays)
  data/device.json.template — empty template for new devices
  lib/                      — JS modules (import.mjs: benchmark stdout parser + merge logic)

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
  ci-ui-validation.yml      — runs final_script.py on app HTML/JS changes
  validate-data.yml         — validates data JSON on data/lib changes
  cd-static.yml             — deploys static site
  auto-data-import.yml      — automates benchmark data import
  post-merge-notify.yml     — post-merge notifications
```

## Architecture

```
app/index.html              — single-page benchmark viewer + data editor (HTML + CSS + vanilla JS)
app/settings.json           — defaultDevice, parametersBreakpoints, device metadata
app/data/*.json             — device-specific benchmark data (pure JSON arrays)
app/data/device.json.template  — empty template for new devices
```

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

- **`app/index.html`** — vanilla JS, no dependencies, no build step. Components:
  - Three-tier header (category group → benchmark sub-group → leaf Acc/Time), score color-coding (≥90% green, ≥80% amber, <80% red).
  - Filters: model substring search, Tier (All/Opus/Sonnet/Haiku) and Metrics (All/Basic/Advanced) segmented buttons, Params dual-handle range slider, Show Deprecated checkbox.
  - Default sort by `date DESC`; Model column non-sortable; other columns clickable.
  - Per-row 📋 (copy model name) and 🤗 (open `huggingface.co/models?search=<model>`).
  - **Import Modal** (`+ Import`): paste benchmark stdout → JS parser → list of NEW/OVERWRITE entries → `Apply` merges into in-memory state (does not write to disk).
  - **Labeling Mode** (`✏ Label`): inline editors for spec (params/quant/size), abilities (thinking/mtp), deprecated, and tiers (opus/sonnet/haiku). Validation errors disable Export Data.
  - **Export Data**: appears whenever data is dirty (after Apply or labeling edits) or labeling mode is on. Opens a modal with the full JSON; user copies to clipboard or saves to file via `showSaveFilePicker()` (Safari falls back to download).
  - **Params slider breakpoints:** edit `parametersBreakpoints` in `app/settings.json` directly; no UI for this (rarely changes).
  - **Hostname guard:** `+ Import` button is hidden when not on `localhost` / `127.0.0.1`.

- **`app/settings.json`** — `defaultDevice`, `parametersBreakpoints` (Params slider tick array), and `devices` (key → family/variant/memory/gpus metadata).

## UI component conventions

For the Vue SPA (`src/components/ui/`):

- **Interactive widgets** (slider, dialog, select, …) are built on **reka-ui headless primitives** — never hand-rolled. `ui/slider.vue` (a reka-ui `SliderRoot`/`SliderTrack`/`SliderRange`/`SliderThumb` dual-thumb range) is the first instance and sets the precedent; Phase 09 follows it for dialog/select. Headless primitives give us keyboard a11y and ARIA for free and avoid WebKit-specific styling hacks (the old `::-webkit-slider-*` range inputs were the anti-pattern this convention replaces).
- **Leaf components** (input/textarea/label/card/badge/button) stay **plain `cva`-styled elements** — no headless primitive needed, no a11y benefit, and that is also standard shadcn-vue.
- The styling contract for every `ui/` component is **`cva` + `VariantProps` + `cn()` (from `@/lib/utils`)** — explicitly **no `App*` shim** and **no manual variant maps**.

## Usage

```bash
make serve   # http://localhost:8080
```

**Importing benchmark results** (local only):
1. Open the page in Chrome/Edge at `http://localhost:8080/app/`.
2. Click `+ Import`, paste benchmark runner stdout, fill spec fields for NEW entries.
3. Click Save → native Save As dialog → navigate to `app/data/`, overwrite the device file.

Safari users can use Import but Save will trigger a download instead of overwriting.

## Rules

- Data files are pure JSON arrays.
- New devices: copy `app/data/device.json.template`, rename to `<device-key>.json`, add entry to `app/settings.json`.
- `deprecated: true` entries are filtered by default in the viewer but preserved on save.
- Import on a duplicate model **only overwrites `scores`**; spec / abilities / tiers / deprecated are preserved.
- Labeling Mode is the only place to edit spec / abilities / tiers / deprecated post-import.
- File writes require the File System Access API; only the user's Save As confirmation actually writes to disk.
- Keep `app/index.html` serverless. Dev server via `vp dev` (`make serve`), tests via `vp test` (`make test`). **Do not run `vp build`** — the site is serverless by design.
