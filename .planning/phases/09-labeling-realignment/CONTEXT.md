# Phase 09 — Labeling Realignment — CONTEXT

**Milestone:** v1.1 reka-ui Best-Practice Alignment
**Requirements:** LABEL-01, LABEL-02, LABEL-03
**Status:** Pending → Planning
**User request:** "為什麼編輯模式長成這樣？感覺跟某個版本不一致，而且我不再要求填寫 Abilities" → realign to original `app/index.html` design + drop Abilities.

## Why this phase

The v1.0 Vue migration (Phase 06) **redesigned the labeling/edit mode away from the original `app/index.html` design** and **added an Abilities editor the original never had**. The user wants the original behaviour back.

### What the ORIGINAL `app/index.html` did (the target)

1. **Column-aligned, in-grid inline editing.** Entering labeling mode **swaps the Score column group for labeling columns**. The header rebuilds to: `Model | Spec(Params/Quant/Size) | Deprecated | Tiers(Opus/Sonnet/Haiku)` (`app/index.html:1242-1248` for the group/sub-group rows, `1305-1324` for the leaf headers). Edit controls render **inline inside those exact table columns**, with column widths and row heights **locked** so toggling labeling doesn't reflow the table (CSS `app/index.html:310-311, 431, 445-446`).
2. **No Abilities editor at all.** Original labeling shows only Spec + Deprecated + Tiers. There is no Thinking/MTP control.
3. **Abilities stripped on export.** `getExportData()` returns `currentData.map(({ abilities, ...rest }) => rest)` (`app/index.html:1015`) — exported JSON carries **no `abilities` key**.

### What the current Vue version does (the divergence to fix)

- `src/components/BenchmarkTable.vue:85-163` — labeling renders as a **full-width `colspan` stacked panel** below each row (`<tr v-if="isLabelingMode">`), laid out as four flex sections `SPEC / ABILITIES / OTHER / TIERS`. The Score columns/headers stay visible. This is the tall, grid-misaligned panel the user is asking about. The header (`BenchmarkTable.vue:1-40`) is static — it does NOT swap Score→labeling columns in labeling mode.
- `src/composables/useLabeling.ts` — carries `thinking`/`mtp` edit state (`LabelEdit` type lines 11-12; init 226-227; apply 161-165). Booleans always validate (line 58); not "required", but the editor exists.
- `src/components/ExportModal.vue:34` — `jsonText = JSON.stringify(props.entries, null, 2)` — exports entries **as-is, INCLUDING `abilities`**. Diverges from original.

## Target implementation

**LABEL-01 — Column-aligned inline editing (BenchmarkTable.vue).**
- In labeling mode, render the table header so the Score column group is replaced by `Deprecated` (1 col) + `Tiers` (3 cols: Opus/Sonnet/Haiku); keep `Model` + `Spec(Params/Quant/Size)`. (The existing view-mode header keeps Score.)
- Render the per-row edit controls **inline inside those columns** (Params/Quant/Size inputs under the Spec columns; Deprecated checkbox in the Deprecated column; each Tier checkbox in its own Opus/Sonnet/Haiku column) — NOT a `colspan` stacked panel. Keep column widths/row height stable.
- Remove the `<tr v-if="isLabelingMode">` stacked-panel block entirely.

**LABEL-02 — Remove Abilities editor.**
- Delete the ABILITIES (Thinking/MTP) controls from labeling UI.
- Remove `thinking`/`mtp` from `useLabeling.ts`: the `LabelEdit` type, the edit-state initialization (226-227), and the apply branch (161-165). Update the `useLabeling` unit tests that reference thinking/mtp.

**LABEL-03 — Strip abilities on export.**
- Strip `abilities` from every entry before producing export JSON, matching the original. Cleanest single spot: `ExportModal.vue` `jsonText` computed → `JSON.stringify(props.entries.map(({ abilities, ...rest }) => rest), null, 2)`. (`jsonText` feeds both the clipboard copy and the file-save path, so one change covers both.)

## Constraints / invariants

- **Data contract** — entries stay pure JSON; only the export view drops `abilities`. In-memory `mutableEntries` may keep abilities (irrelevant once stripped on export); the original also kept abilities in memory and dropped only on export.
- **Do not change** import behaviour, scores, sorting, filters, or the device/JSON file format.
- **Validation gating** — `hasValidationErrors` still disables Export when spec fields are invalid (keep the existing param/size validation; only Abilities is removed).
- **cva/cn conventions** intact; serverless static SPA; Node ≥24; Vite+ (`vp dev`/`vp test`), do not run `vp build`.
- Existing **Vitest** suite green (adjust `useLabeling.test.ts` for removed Abilities fields); existing **Playwright** UI-validation: zero NEW failures vs baseline (the CP script is already stale/red pre-redesign — do not silently rewrite; flag drift).

## Success criteria (observable)

1. Toggle ✏ Label → the table shows `Model | Spec | Deprecated | Tiers` with edit controls inline in their columns; no tall full-width stacked panel; row heights/column widths stable. Matches the original layout.
2. No Abilities/Thinking/MTP control anywhere in labeling mode.
3. Open Export Data → the JSON contains **no `abilities` key** on any entry; spec/tiers/deprecated/scores/date all present.
4. Spec validation still gates Export (invalid params/size disables Export Data).
5. Vitest green (useLabeling tests updated); Playwright zero new failures vs baseline.

## Out of scope (this phase)

Slider (Phase 08), dialog/select reka-ui migration (Phase 10), any new feature, JSON-format change.
