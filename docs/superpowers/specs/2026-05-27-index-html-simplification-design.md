# index.html simplification — design

**Date:** 2026-05-27
**Status:** Approved, pending implementation
**Scope:** Structural cleanup of `app/index.html` (single file, 1640 lines)

## Goal

Reduce code volume in `app/index.html` without changing observable behavior, while preserving — and where possible improving — readability for future human edits.

Estimated reduction: ~59 lines (1640 → ~1581).

## Non-goals

- Changing data schema, `settings.json` format, or any `app/data/*.json` content
- Touching HTML structure (`<header>`, `<table>`, modal markup)
- Renaming any function referenced by inline `onclick` handlers
- Modifying existing visual styles (dashed underline, tooltip pseudo-element, deprecated badge)
- Adding tests, build steps, or external dependencies

## Items

Nine independent simplifications, each preserving observable behavior.

### C1 — low-risk batch (one commit)

| # | Item | Location | Action | Est. lines |
|---|------|----------|--------|-----------|
| B | Hoist common header rows | `buildHeaders` ~L1297–1384 | The shared cells (Model leaf, Spec group, Params/Quant/Size leaves) appear in both `labelingMode` branches. Emit them once before the branch; the branches only emit the divergent tail (Score columns vs. Deprecated/Tiers columns). | ~12 |
| C | Remove dead `getSortValue` fallback | ~L1261–1262 | The trailing `entry.scores[col]` fallback is unreachable because every caller (`addLeaf`) passes one of: `'date'`, `'model'`, `'spec.*'`, `'tiers.*'`, `'deprecated'`, or `'scores.*.*'`. No bare benchmark name is ever passed. | 2 |
| D | `tierFilterIdx` → `tierFilter` string | ~L983 + L1004–1010 | Replace the int index + `tierKeys` lookup table with a direct string state (`'all'\|'opus'\|'sonnet'\|'haiku'`); `getTierFilterMatch` becomes `entry.tiers && entry.tiers[tierFilter]`. | ~5 |
| E | Extract `getExportData()` helper | ~L1033, L1138 | Two call sites duplicate `currentData.map(({ abilities, ...rest }) => rest)`. Single helper. | ~2 |
| F | Combine two `DOMContentLoaded` listeners | ~L985 + L1023 | Merge the tier-filter / metrics-filter binding with the search-input binding into one listener. | ~2 |
| G | Consolidate monospace `<td>` font CSS | ~L463–479 | `td.num`, `td.score`, `td.missing` each repeat the same `font-family` + `font-size`. Combine the shared declaration; each selector keeps only its colour/weight overrides. | ~6 |
| I | Extract `setStarBtnIcon(btn, starred)` helper | ~L1449–1457 | The icon-text + class-toggle pattern (`♥`/`♡`, `starred` class) is written twice in `buildRow`: at construction and inside `onclick`. One helper. | ~3 |

**C1 estimated reduction: ~32 lines.**

### C2 — input factory (one commit)

| # | Item | Location | Action | Est. lines |
|---|------|----------|--------|-----------|
| A | Share boilerplate between `createNumInput` / `createTextInput` | ~L1479–1524 | Introduce `bindLabelInput(input, key, parent, parse, validate)` carrying the common `oninput` boilerplate (error class toggle, `labelingErrors` map mutation, `updateLabelingExportState`, `markDataDirty`). Keep both wrapper functions with their original names and signatures so call sites at L1540–1542 do not change. The text variant calls `bindLabelInput` with `parse: v => v.trim()` and `validate: v => v.length > 0`; the number variant passes its own parse/validate. | ~15 |

**C2 estimated reduction: ~15 lines.**

### C3 — CSS table layout (one commit)

| # | Item | Location | Action | Est. lines |
|---|------|----------|--------|-----------|
| H | `table-layout: fixed` + single-line column widths | ~L432–443 | Add `#benchmark-table { table-layout: fixed; }`. Six column-width rule pairs each collapse from three declarations (`width`/`min-width`/`max-width`) to one (`width`), since `table-layout: fixed` makes `width` authoritative. HTML untouched. | ~12 |

**C3 estimated reduction: ~12 lines.**

## Commit order and rationale

Three commits, fixed order, lowest risk first:

1. **C1** — seven unrelated low-risk cleanups. Any regression is easy to bisect because the items don't overlap each other.
2. **C2** — touches labeling input behavior; isolated commit so a behavior regression in editor inputs maps to one diff.
3. **C3** — touches table layout; isolated so any column-width or row-height regression is one diff away from revert.

Run the verification checklist (next section) after **each** commit, not only the final state.

## Verification checklist

Manual, in Chrome at `http://localhost:8080/app/` after `make serve`. The same checklist runs after each of C1/C2/C3.

1. **Load** — default device loads; rows render.
2. **Sort** — click every sortable header twice; asc/desc indicator (`↑`/`↓`) and order both correct.
3. **Tier filter** — All/Opus/Sonnet/Haiku each filter correctly; active button highlighted.
4. **Metrics filter** — All/Basic/Advanced — header structure and score columns update correctly.
5. **Params slider** — drag each handle to extremes; cross handles (verify swap); bounds text (`0B` / `Inf`) updates.
6. **Search** — substring input filters live.
7. **Show Deprecated** — toggle reveals/hides deprecated rows; their styling (strike-through, 0.5 opacity, badge) intact.
8. **Model hover** — ellipsis correct; dashed underline appears; dark tooltip appears immediately (no delay); last-row tooltip flips above the row.
9. **Row actions** — 📋 copies model name (toast shown); 🤗 opens HuggingFace search in new tab.
10. **Enter Edit mode** — `✏ Edit` → button becomes active + text becomes `Display`; header restructures to Spec/Deprecated/Tiers.
11. **Edit inputs** — params/quant/size inputs accept valid values, reject invalid (red border); deprecated/opus/sonnet/haiku toggles flip cleanly.
12. **Star toggle** — heart toggles ♡↔♥, colour turns red, row pins to top of table; Export button appears.
13. **Import** — paste runner stdout → NEW/OVERWRITE detection correct → Apply merges into table; toast shown.
14. **Export** — `Export Data` → modal shows JSON; Copy to Clipboard works; Save to File invokes native picker (Chrome) or downloads (Safari).

A regression in any step blocks the commit; fix or revert before proceeding to the next commit.

## Explicit non-changes (boundaries)

These touch points must remain byte-equivalent or behaviorally identical:

- Public functions called from inline `onclick`: `openModal`, `closeModal`, `toggleLabeling`, `toggleShowAll`, `openImportModal`, `closeImportModal`, `saveImport`, `copyFromModal`, `saveExportToFile`.
- `currentData` shape and mutation contract.
- `labelingErrorsByModel` Map structure and key conventions (model name → Set of field keys).
- The 14 checklist behaviors above.
