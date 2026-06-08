# Phase 12 — Structure Alignment — CONTEXT

**Milestone:** v1.2 · **Requirements:** STR-01..05
**Goal:** Move to the `vp project example` layout — `index.html` at root + `/src/main.ts` entry, real `public/` dir holding the data, no `root:'src'` override, legacy `app/` removed. User chose **full alignment**, autonomous.

## Current layout (to change)
- `src/index.html` is the entry; `vite.config.ts` has `root: 'src'`, `publicDir: '../public'`, `build.outDir: '../dist'`.
- `public/` contains **symlinks**: `public/data -> ../app/data`, `public/settings.json -> ../app/settings.json`.
- Real data lives in legacy `app/`: `app/data/*.json` (e.g. `m1-max-64GB-32c.json`), `app/data/device.json.template`, `app/settings.json`. `app/index.html` is the OLD vanilla site (superseded). `app/lib/import.mjs` was already ported to `src/lib/`.
- App fetches data at runtime — CHECK `src/composables/useBenchmarkData.ts` and `useSettings.ts` for the exact fetch URLs (likely `/data/<device>.json` and `/settings.json`). These must keep resolving after the move.

## Target layout (vp example)
- `index.html` at **project root**, referencing `/src/main.ts` (move `src/index.html` → `./index.html`; adjust the `<script src>` to `/src/main.ts` and any asset hrefs).
- `vite.config.ts`: REMOVE `root: 'src'`; set `publicDir: 'public'` (default — can drop the line); `build.outDir: 'dist'` (default — can drop). Keep vue+tailwind plugins, `@`→src alias, server port 8080, the vite-plus staged/fmt/lint blocks from Phase 11.
- `public/` = REAL dir: `public/data/*.json` (move the real files from `app/data/`), `public/data/device.json.template`, `public/settings.json` (real file from `app/settings.json`). Delete the symlinks first.
- Delete the legacy `app/` directory entirely (vanilla `app/index.html`, `app/data`, `app/settings.json`, `app/lib`) — the Vue app + `src/lib` fully supersede it. (Confirm nothing in `src/` imports from `app/` before deleting — it shouldn't.)
- Data still served at `/data/*` and `/settings.json` (public/ root), so the fetch paths in code stay the same. Verify.

## CI + docs (STR-04)
- `.github/workflows/validate-data.yml`: data path `app/data/**` → `public/data/**` (both the path filter/trigger AND the script that validates the JSON). Read it and update precisely.
- `.github/workflows/cd-static.yml`: ensure it builds (`vp build` / `tsc && vp build`) and deploys `dist/`. Now that root isn't `src`, `dist/` is at project root (was already `../dist` = root/dist, so likely unchanged — verify the build command + publish dir).
- `.github/workflows/ci-ui-validation.yml`: path triggers referencing `app/` → `src/`/`public/`; the Playwright `final_script.py` is already stale (pre-redesign) — do NOT try to fix it here, just fix path triggers if they reference `app/`.
- `CLAUDE.md`: the project-overview / Project Directory / Architecture / Usage / Rules sections still describe the OLD `app/index.html` vanilla layout and "navigate to app/data". Update them to the new structure: `index.html` at root, `src/` Vue SPA, `public/data` + `public/settings.json`, data-edit workflow saves into `public/data`. Keep the VITE PLUS block and the UI component conventions section.
- `Makefile` (`make serve`): check it runs `vp dev` — should still work; update if it references `app/` or a path.

## Constraints / invariants
- Data JSON CONTENT/shape unchanged — only file LOCATION moves (app/ → public/).
- App must render + load data identically after the move (`vp dev` :8080 → 5 rows).
- `vp check` clean, `vp test` 36/36 green, app builds.
- Commit INCREMENTALLY (move data; move index.html + vite.config; delete app/; update CI; update docs) so partial progress is saved. Branch feat/vue-vite-static-site — no branch switch. Use `git mv` where possible to preserve history.

## Success criteria
1. `index.html` at root, `/src/main.ts` entry; vite.config has no `root:'src'`.
2. `public/data/*.json` + `public/settings.json` are real files; symlinks gone; legacy `app/` deleted.
3. App renders + loads data at `vp dev` :8080 (5 rows, 0 pageerrors); `vp check` clean; `vp test` 36/36.
4. `validate-data.yml`, `cd-static.yml`, `ci-ui-validation.yml` updated for the new paths; CLAUDE.md docs reflect the new structure.
5. `vp build` produces `dist/` (root) successfully (run it ONCE to confirm the build works end-to-end — this phase legitimately needs it).
