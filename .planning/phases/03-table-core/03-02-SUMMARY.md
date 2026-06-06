---
phase: 03-table-core
plan: 02
subsystem: sorting, row-actions
tags: [sort-indicators, clipboard-copy, huggingface-search, date-desc-default]
dependency_graph:
  requires: [03-01-complete]
  provides: [sorting-with-indicators, model-copy-button, huggingface-search-button]
  affects: [03-03-filtering, 03-04-labeling]
tech_stack:
  added: [Vue 3 computed properties for sorting, navigator.clipboard API, window.open with noopener]
  patterns: [Multi-type sort comparisons (strings, numbers, dates), Sort state management with refs]
key_files:
  created: []
  modified:
    - src/components/BenchmarkTable.vue
decisions:
  - "Default sort: date DESC (sortDir = -1) to show newest entries first"
  - "getSortValue() helper extracts sortable values for dates (as timestamps), spec fields, and nested score paths"
  - "Null values always sort to end of list (handles missing scores gracefully)"
  - "Sort toggle: clicking same column header toggles direction; clicking different column resets to ASC"
  - "Model column: marked with no-sort class and has no click handler (not sortable per plan)"
  - "Sort indicators: visual arrows (↑ ↓) in header with blue highlight (#2563eb) and light blue background (#eff6ff)"
  - "Action buttons: 📋 (copy) and 🤗 (HuggingFace search) placed in model cell alongside model name"
  - "HuggingFace URL: encodeURIComponent sanitizes model name; window.open uses _blank + noopener for security"
  - "Copy button: uses navigator.clipboard.writeText() for modern browsers"
  - "Sortable columns: Params, Quant, Size, and all benchmark accuracy/time columns"
metrics:
  phase: 03-table-core
  plan: 02
  status: complete
  completed_date: 2026-06-06
  duration_minutes: 15
  tasks_completed: 2
  files_created: 0
  files_modified: 1
  commits: 1
---

# Phase 03 Plan 02: Table Core — Sorting and Row Actions Summary

**Enable sorting and row actions in the benchmark table, allowing users to find and interact with models.**

## Overview

Implemented sorting functionality with default date DESC ordering and visual sort indicators. Added row action buttons for clipboard copy and HuggingFace model search. Users can now sort by any column (except Model), see the active sort column highlighted, and quickly access model information.

## Completed Tasks

### Task 1: Implement sorting with default date DESC
**Status:** ✓ Complete | **Commit:** `2104a0f`

**Sorting State Management:**
- Added `sortCol` ref initialized to 'date' (default sort column)
- Added `sortDir` ref initialized to -1 (DESC for newest first)

**getSortValue() Helper Function:**
- Extracts sortable values for all column types
- 'date': converts to timestamp via `new Date(entry.date).getTime()`
- 'spec.*': returns spec field directly (handles null)
- 'scores.BENCHMARK.metric': nested path extraction with null safety
- Returns null for missing values

**sortedEntries Computed Property:**
- Returns sorted copy of entries (uses spread operator: `[...entries].sort(...)`)
- Handles three value types: strings (via localeCompare), numbers (via subtraction), and null (always last)
- Applies sortDir multiplier to comparison results
- Stable sort for secondary ordering

**onSort() Handler:**
- Early return if column is 'model' (non-sortable)
- Toggle sort direction if clicking current column
- Reset to ASC (sortDir = 1) when changing columns
- Triggers sortedEntries recompute automatically

**sortIndicator() Computed Property:**
- Returns 'asc' if sortCol matches and sortDir === 1
- Returns 'desc' if sortCol matches and sortDir === -1
- Returns empty string otherwise

**Visual Sort Indicators:**
- Applied to leaf-row headers (Row 3) via `:class` binding
- Classes: `sort-asc` / `sort-desc` toggle based on sortIndicator()
- CSS styling: blue text (#2563eb) + light blue background (#eff6ff) + arrows (↑ ↓)
- Model column: `no-sort` class prevents click and indicator display

**Template Changes:**
- Updated all sortable `<th>` in leaf-row with `@click="onSort(col)"` handlers
- Added `:class` bindings for sort-asc/sort-desc
- Changed tbody v-for from `entries` to `sortedEntries`

### Task 2: Add row action buttons (copy model, HuggingFace search)
**Status:** ✓ Complete | **Commit:** `2104a0f`

**Model Cell Layout:**
- Replaced `<td>{{ entry.model }}</td>` with three-part structure:
  - `<span class="model-actions">`: container for buttons
  - Two action buttons: 📋 (copy) and 🤗 (HuggingFace)
  - `<span class="model-name-text">{{ entry.model }}</span>`: model name text

**copyModelName() Function:**
- Calls `navigator.clipboard.writeText(modelName)`
- Copies model name to user's clipboard
- No toast/notification (simple MVP approach)

**searchHuggingFace() Function:**
- Constructs URL: `https://huggingface.co/models?search={encodeURIComponent(modelName)}`
- Opens in new tab via `window.open(..., '_blank', 'noopener')`
- noopener prevents access to window object from new tab (security)

**CSS Styling:**
- `.model-name`: flex layout with gap for buttons and text
- `.model-actions`: inline-flex with gap between buttons
- `.model-action-btn`: transparent background, no border, emoji font-size
  - Color: #cbd5e1 (subtle gray)
  - Hover color: #475569 (darker gray)
  - Transition: smooth color change (0.15s ease)
- `.model-name-text`: word-break for long model names

**Button Interaction:**
- Buttons visible on all rows
- Subtle appearance in normal state
- Darkens on hover
- Row hover background unaffected by button styling

## Verification Checklist

- ✓ sortCol and sortDir refs initialized correctly
- ✓ getSortValue() handles dates as timestamps, spec fields, nested scores
- ✓ Null values always sort to end
- ✓ sortedEntries computed property returns correctly sorted array
- ✓ String comparisons use localeCompare
- ✓ Number comparisons use subtraction
- ✓ onSort() toggles direction on same column click
- ✓ onSort() resets to ASC on different column click
- ✓ Model column non-sortable (no handler, no indicator)
- ✓ sortIndicator() returns correct values ('asc', 'desc', '')
- ✓ Visual indicators (↑ ↓) appear with blue styling
- ✓ Default load shows date DESC (newest entries first)
- ✓ copyModelName() uses navigator.clipboard.writeText()
- ✓ searchHuggingFace() uses encodeURIComponent and window.open
- ✓ Action buttons in model cell with correct emojis (📋 🤗)
- ✓ Buttons styled with subtle gray (#cbd5e1) and hover darkening
- ✓ TypeScript compilation clean (no type errors)
- ✓ All sorting and action click handlers functional
- ✓ No console errors on page load or interactions

## Data Flow

```
User interactions:
1. Page loads
   → sortCol = 'date', sortDir = -1
   → sortedEntries computes sorted array (newest first)
   → Table renders with sortedEntries

2. User clicks column header (e.g., "Params")
   → onSort('spec.parameters_b') called
   → sortCol changes, sortDir resets to 1 (ASC)
   → sortIndicator() returns 'asc'
   → Row 3 header gets sort-asc class + ↑ indicator
   → sortedEntries recomputes with new sort
   → Table rerenders in new order

3. User clicks same header again
   → onSort('spec.parameters_b') called
   → sortDir toggles to -1 (DESC)
   → sortIndicator() returns 'desc'
   → Row 3 header gets sort-desc class + ↓ indicator
   → sortedEntries recomputes DESC
   → Table rerenders reversed

4. User clicks 📋 button on row
   → copyModelName() called
   → navigator.clipboard.writeText() copies to clipboard
   → User can paste model name

5. User clicks 🤗 button on row
   → searchHuggingFace() called
   → window.open() opens HF search in new tab
   → Browser tab opens with results
```

## HTML Structure Example

```html
<thead>
  <!-- Row 3: Leaf headers with sort indicators -->
  <tr class="leaf-row">
    <th class="no-sort">Model</th>
    <th data-col="spec.parameters_b" class="group-start sort-asc">Params ↑</th>
    <th data-col="spec.quantization">Quant</th>
    ...
  </tr>
</thead>
<tbody>
  <tr v-for="entry in sortedEntries">
    <td class="model-name">
      <span class="model-actions">
        <button @click="copyModelName(entry.model)">📋</button>
        <button @click="searchHuggingFace(entry.model)">🤗</button>
      </span>
      <span class="model-name-text">{{ entry.model }}</span>
    </td>
    ...
  </tr>
</tbody>
```

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **TBL-03**: Default sort on load is date DESC
  - ✓ sortCol initialized to 'date', sortDir to -1
  - ✓ Newest entries appear first
  - ✓ Oldest entries at bottom

- **TBL-04**: Row action buttons functional
  - ✓ 📋 button copies model name to clipboard via navigator.clipboard
  - ✓ 🤗 button opens HuggingFace search in new tab
  - ✓ URL properly sanitized with encodeURIComponent
  - ✓ Window opened with _blank + noopener for security

## Sorting Behavior Verification

- ✓ Click "Params" → sorts by parameters_b ASC, ↑ indicator visible, blue highlight
- ✓ Click "Params" again → sorts DESC, ↓ indicator visible
- ✓ Click "MMLU 🎯" → sorts by MMLU accuracy, indicator changes, sort resets to ASC
- ✓ Click "Model" column → no sort (non-sortable), no indicator
- ✓ All other columns (Quant, Size, time columns) sortable with indicators

## Row Action Verification

- ✓ 📋 button visible on every row, copies model name on click
- ✓ 🤗 button visible on every row, opens HF search on click
- ✓ Buttons styled: subtle gray (#cbd5e1) in normal state
- ✓ Buttons darken on hover (#475569)
- ✓ Buttons not interfering with row hover background

## Known Stubs

None - all required features implemented.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| sanitized_url_construction | src/components/BenchmarkTable.vue | HuggingFace URL constructed with encodeURIComponent (mitigates T-03-03 injection) |
| secure_window_open | src/components/BenchmarkTable.vue | window.open uses _blank + noopener to prevent new tab from accessing parent window |

## Self-Check

- ✓ BenchmarkTable.vue exists and contains sorting logic
- ✓ sortCol ref exists
- ✓ sortDir ref exists
- ✓ getSortValue() helper implemented
- ✓ sortedEntries computed property implemented
- ✓ sortIndicator() function implemented
- ✓ onSort() handler implemented
- ✓ copyModelName() function implemented
- ✓ searchHuggingFace() function implemented
- ✓ Header row includes @click and :class bindings
- ✓ Model cell includes action buttons
- ✓ CSS includes sort indicators
- ✓ CSS includes action button styling
- ✓ Commit 2104a0f exists and contains all changes
- ✓ TypeScript compilation passes
