# Thinking / No-Thinking Score Display

**Date:** 2026-06-16
**Status:** Approved

## Overview

Add visual distinction between thinking-mode and no-thinking-mode benchmark scores in the table. Each benchmark score cell will display two rows: top for thinking (💡), bottom for no-thinking (🪫). A legend column is inserted to the left of MMLU.

## Data Schema

Add one optional field to `Entry` in `src/types/benchmark.ts`:

```typescript
export interface Entry {
  // ...existing fields...
  scores: Scores;               // thinking mode (existing data qualifies as-is)
  scores_no_thinking?: Scores;  // no-thinking mode; absent = show "–" in bottom row
}
```

**No migration of existing JSON files.** Existing `scores` are already thinking-mode runs. The `scores_no_thinking` field is optional, so old entries render a `–` in the bottom row automatically.

The `abilities` field is not used for this purpose (per project rules, `abilities` is stripped on export and has no editor).

## Import Parser

`src/lib/import.mjs` already captures the Think column (Yes/No) from benchmark stdout via the score regex, but discards it. Change:

- Think=Yes → row goes into `scores`
- Think=No → row goes into `scores_no_thinking`

`mergeImport` already does a whole-`scores` replacement on OVERWRITE. Extend it to also replace `scores_no_thinking` independently — only overwrite the field that appeared in this run's stdout. This allows two separate paste operations (one thinking run, one no-thinking run) to accumulate without clobbering each other.

## Table UI

### Header (3 rows, unchanged structure)

A narrow legend column is inserted between Spec and MMLU:

```
Row 1: Model | Spec | Score (colspan = len*2 + 1)
Row 2:        |      | 💡    | MMLU (colspan=2) | TRUTHFULQA (colspan=2) | …
Row 3: Model  | Size | 💡/🪫  | 🎯 ⏲ | 🎯 ⏲ | …
```

- Row 1 `Score` colspan changes from `len*2` → `len*2 + 1`.
- Row 2 legend cell: `💡` with tooltip "上排 thinking／下排 no thinking".
- Row 3 legend cell: two stacked lines `💡` / `🪫` (aligns with the two rows in each score cell).

### Score Cells (body)

Each score `<td>` becomes `flex flex-col gap-0.5`:

- **Top row (thinking):** existing colored badge (`bg-green-100`, `bg-amber-100`, `bg-red-100`) + time. Shows `–` if absent.
- **Bottom row (no-thinking):** same badge classes but with reduced opacity / muted tone (e.g. `opacity-60` or a gray override) + time. Shows `–` if `scores_no_thinking` is absent or the benchmark key is missing.

### Legend Column (body)

Each row's legend `<td>` shows `flex flex-col`:

```
💡
🪫
```

Vertically aligned with the two rows in adjacent score cells.

### Labeling Mode

Labeling mode swaps the entire Score group for Deprecated + Tiers editors. The legend column lives inside the Score group (colspan), so it disappears in labeling mode automatically — no additional changes needed.

## Sorting

Sorting always uses `scores` (thinking) values. The existing `getSortValue` dotted-path logic is unchanged for the `scores.*` path. A new branch handles `scores_no_thinking.*` if needed in future, but no UI exposes it initially.

Null handling (entries missing a thinking score sort last) is already implemented and continues to work.

## Export

`ExportModal` / export logic: include `scores_no_thinking` when present, continue stripping `abilities`. No other changes.

## Files Changed

| File | Change |
|---|---|
| `src/types/benchmark.ts` | Add `scores_no_thinking?: Scores` to `Entry` |
| `src/lib/import.mjs` | Route Think=No rows to `scores_no_thinking`; update mergeImport |
| `src/lib/import.test.mjs` | Add test cases for Think=No routing |
| `src/composables/useImport.test.ts` | Update if import composable tests cover merge |
| `src/components/BenchmarkTable.vue` | Add legend column; make score cells 2-row flex |

No changes to `public/data/*.json`, `public/settings.json`, or GitHub Actions workflows.
