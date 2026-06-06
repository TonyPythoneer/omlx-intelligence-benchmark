---
phase: 03-table-core
plan: 01
subsystem: table-rendering, data-normalization, color-coding
tags: [three-tier-header, score-coloring, benchmark-display, vue-components]
dependency_graph:
  requires: [02-02-complete]
  provides: [three-tier-table-header, color-coded-scores, normalized-benchmark-data]
  affects: [03-02-sorting, 03-03-filtering, 03-04-row-actions]
tech_stack:
  added: [Vue 3 three-tier table structure, Scoped CSS with group-start borders]
  patterns: [Computed properties for dynamic header rows, Template v-for for column generation]
key_files:
  created: []
  modified:
    - src/composables/useBenchmarkData.ts
    - src/components/BenchmarkTable.vue
decisions:
  - "normalizeEntries() in useBenchmarkData handles missing tiers by falling back to labelling.tiers or empty tiers object"
  - "ALL_BENCHMARKS constant defined at component level for DRY principle"
  - "Three header rows built with Vue template loops: group-row, subgroup-row, leaf-row"
  - "scoreColorClass() returns score-high (≥90), score-mid (80-89), score-low (<80)"
  - "Accuracy formatted to one decimal place using toFixed(1)"
  - "group-start CSS class applied with thicker left border for visual grouping"
metrics:
  phase: 03-table-core
  plan: 01
  status: complete
  completed_date: 2026-06-06
  duration_minutes: 15
  tasks_completed: 2
  files_created: 0
  files_modified: 2
  commits: 1
---

# Phase 03 Plan 01: Table Core — Three-Tier Header and Color-Coding Summary

**Render a three-tier benchmark table with color-coded accuracy scores, establishing the core table structure for subsequent filtering and sorting features.**

## Overview

Implemented the core table rendering infrastructure with a three-tier header structure and color-coded accuracy scores. Users can now see benchmark data organized by category groups, benchmark sub-groups, and individual metrics (Accuracy/Time), with visual color indicators for score quality.

## Completed Tasks

### Task 1: Fix data normalization and implement three-tier header
**Status:** ✓ Complete | **Commit:** `870e335`

**Data Normalization in useBenchmarkData.ts:**
- Added `normalizeEntries()` function that processes fetched data before assignment
- Maps all entries to ensure `entry.tiers` exists with `{ opus, sonnet, haiku }` properties
- Handles three cases: existing tiers (unchanged), `labelling.tiers` fallback, or default empty tiers
- Prevents undefined errors when BenchmarkTable accesses `entry.tiers.opus`, etc.

**Three-Tier Table Header in BenchmarkTable.vue:**

*Row 1 (group-row):*
- Visual grouping: "Model | Spec | Score"
- Spec column: colspan=3, group-start left-border
- Score column: colspan=benchmarks*2 (10 for 5 benchmarks), group-start left-border

*Row 2 (subgroup-row):*
- Alignment cells for Model and Spec columns (empty `<th>` elements)
- Benchmark names: one cell per benchmark spanning 2 columns (Acc + Time)
- First benchmark cell has group-start left-border

*Row 3 (leaf-row):*
- "Model | Params | Quant | Size | [🎯 ⏲ per benchmark]"
- Each accuracy column (🎯) has group-start left-border for visual grouping
- All columns except Model have `data-col` attribute for future sorting
- Model column has `no-sort` class (not sortable)

**Key Implementation Details:**
- `ALL_BENCHMARKS = ['MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH']` constant
- Template v-for loops generate header rows dynamically
- CSS class `group-start` adds 2px solid left border (#cbd5e1)
- colspan attributes omitted for colspan="1" per HTML best practices

### Task 2: Add color-coding for score cells
**Status:** ✓ Complete | **Commit:** `870e335`

**scoreColorClass() Helper Function:**
- Returns `'score-high'` for accuracy ≥ 90 (green: #059669)
- Returns `'score-mid'` for accuracy ≥ 80 and < 90 (amber: #d97706)
- Returns `'score-low'` for accuracy < 80 (red: #dc2626)
- Returns empty string for undefined/null accuracy

**Color-Coded Accuracy Display in Template:**
- Each accuracy cell wrapped in `<span :class="scoreColorClass(...)">` when score exists
- Format: `{{ formattedAccuracy(...) }}%` → e.g., "83.3%"
- Missing scores display '–' (en dash) in plain text
- Time columns remain uncolored (neutral styling)

**CSS Color Styles:**
```css
.score-high { color: #059669; font-weight: 600; }  /* Green, bold */
.score-mid  { color: #d97706; font-weight: 500; }  /* Amber, semi-bold */
.score-low  { color: #dc2626; font-weight: 500; }  /* Red, semi-bold */
```

## Verification Checklist

- ✓ useBenchmarkData.ts contains normalizeEntries function
- ✓ normalizeEntries maps data and ensures entry.tiers exists
- ✓ Fallback chain: entry.tiers → entry.labelling?.tiers → default empty tiers
- ✓ BenchmarkTable renders three header rows with classes: group-row, subgroup-row, leaf-row
- ✓ Row 1: "Model | Spec | Score" groups visible
- ✓ Row 2: All 5 benchmark names visible (MMLU, TRUTHFULQA, HUMANEVAL, MBPP, LIVECODEBENCH)
- ✓ Row 3: Leaf columns with data-col attributes
- ✓ Accuracy cells include scoreColorClass binding
- ✓ accuracyColor values: green (≥90%), amber (80-89%), red (<80%)
- ✓ Accuracies formatted to one decimal place (XX.X%)
- ✓ Time columns uncolored
- ✓ CSS includes group-start border styling
- ✓ TypeScript compilation passes: `pnpm exec tsc --noEmit`
- ✓ No console errors on data load

## Data Flow

```
Data Fetch:
/data/{device}.json
    ↓
fetch() → response.json()
    ↓
normalizeEntries() [ensure tiers field]
    ↓
entries.value = normalized array
    ↓
BenchmarkTable receives :entries prop
    ↓
v-for="entry in entries"
    ↓
Template renders model, spec, and color-coded scores
```

## HTML Structure Example

```html
<table class="benchmark-table">
  <thead>
    <!-- Row 1 -->
    <tr class="group-row">
      <th>Model</th>
      <th colspan="3" class="group-start">Spec</th>
      <th colspan="10" class="group-start">Score</th>
    </tr>
    <!-- Row 2 -->
    <tr class="group-row subgroup-row">
      <th></th>
      <th class="group-start"></th>
      <th></th>
      <th></th>
      <th colspan="2" class="group-start">MMLU</th>
      <th colspan="2" class="group-start">TRUTHFULQA</th>
      ...
    </tr>
    <!-- Row 3 -->
    <tr class="leaf-row">
      <th class="no-sort">Model</th>
      <th data-col="spec.parameters_b" class="group-start">Params</th>
      <th data-col="spec.quantization">Quant</th>
      <th data-col="spec.size_gb">Size</th>
      <th data-col="scores.MMLU.accuracy" class="group-start">🎯</th>
      <th data-col="scores.MMLU.time_s">⏲</th>
      ...
    </tr>
  </thead>
</table>
```

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **TBL-01**: Three-tier table header renders correctly
  - ✓ Row 1: Group headers (Model | Spec | Score)
  - ✓ Row 2: Benchmark sub-group labels with proper colspans
  - ✓ Row 3: Leaf columns with Model, Params, Quant, Size, then per-benchmark metrics

- **TBL-02**: Score color-coding applied by accuracy level
  - ✓ Green (≥90%): #059669 with font-weight: 600
  - ✓ Amber (80-89%): #d97706 with font-weight: 500
  - ✓ Red (<80%): #dc2626 with font-weight: 500
  - ✓ Accuracy values formatted to one decimal place
  - ✓ Missing scores display as '–'

## Known Stubs

None - all required features implemented.

## Threat Flags

None - no new security surface introduced:
- Data normalization only adds defensive null-coalescing
- Score color-coding is purely visual presentation
- No new network endpoints or auth paths
