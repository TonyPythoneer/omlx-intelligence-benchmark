# Phase 09 — Labeling Realignment — SUMMARY

**Status:** ✅ Complete (self-verified in autonomous mode — tests + live browser + screenshots)
**Plan:** 09-01-PLAN.md
**Requirements:** LABEL-01, LABEL-02, LABEL-03 (+ D-09-1 pre-population fix)
**Date:** 2026-06-08

## What shipped

| Commit | Change |
|--------|--------|
| `ceedd05` | useLabeling: removed `thinking`/`mtp` edit state; updated unit tests |
| `fe98c60` | BenchmarkTable: labeling mode swaps Score column group → `Deprecated` + `Tiers(Opus/Sonnet/Haiku)` with **inline per-column editors**; deleted the full-width `colspan` stacked panel and all Abilities controls |
| `db17f54` | ExportModal: `jsonText` strips `abilities` per entry (`({ abilities, ...rest }) => rest`) |
| `b23be78` | **D-09-1 fix**: pre-populate labeling editors from existing entry values |
| `c9ba07b` | Regression test for D-09-1 (unwrapped-array seed path) |

## Requirements outcome

- **LABEL-01 ✅** — Labeling mode now renders the original column-aligned layout (`Model | Spec(Params/Quant/Size) | Deprecated | Tiers`), Score columns swapped out, edit controls inline in their columns, no stacked panel. Matches `app/index.html:1242-1324`.
- **LABEL-02 ✅** — Abilities (Thinking/MTP) editor removed from UI and from `useLabeling` state/types/apply.
- **LABEL-03 ✅** — Exported JSON carries no `abilities` key (verified live: `export has abilities key: false`).

## D-09-1 root cause (notable)

The labeling editors had **always** rendered empty (since Phase 06) — a silent bug. Root cause: **Vue templates auto-unwrap refs**, so `@click="toggleLabelingMode(mutableEntries)"` passed the unwrapped *array*, not the `Ref`. The seed used `entries ?? mutableEntries`, picked the truthy array (whose `.value` is `undefined`), and iterated nothing. The unit test passed because it called the function with a real `ref` (no template unwrapping), so coverage missed the real-world path.

**Fix:** `toggleLabelingMode` now resolves a `Ref`, an unwrapped array, or the closure `mutableEntries` fallback. A regression test exercises the unwrapped-array path. This restores the original `input.value`/`input.checked` pre-population behaviour.

## Verification evidence

- **Vitest:** 36/36 green (was 35; +1 regression test).
- **Live browser (fresh `vp dev` on :8080, stale servers killed):**
  - Pre-population: `35 / qx86 / 36.8` and `35 / 4bit / 18.19` (opus checked) render in their inputs; empty-spec rows stay empty. `pageerrors: 0`.
  - Export: no `abilities` key in JSON; spec/tiers/deprecated/scores/date preserved.
  - Screenshot: `outputs/ui-validation/final_runs/phase09/labeling_prepopulated.png` — column-aligned layout, populated values, no Abilities.
- **Playwright legacy `final_script.py`:** still aborts at the pre-existing stale `.filter-group` selector (CP2) on both baseline and after — **zero new failures**. Not rewritten. Logged as deferred D-09-2 (refresh CP selectors to the shadcn-redesigned components).

## Deviations / follow-ups

- **D-09-1** — resolved this phase (was deferred by the executor; the user requested it be fixed now).
- **D-09-2** — stale Playwright CP script (pre-redesign selectors); out of scope, backlog.
- Width/height pixel-locking from the original CSS is approximated with compact inputs; no visible reflow observed. Backlog if exactness is wanted.
