---
phase: 01-scaffold-bootstrap-keystone-spike
plan: 02
subsystem: types-and-parser-port
tags: [types, parser, vitest, typescript, walking-skeleton]
dependency_graph:
  requires: [01-01]
  provides: [benchmark-types, import-parser-vitest, data-schema]
  affects: [phase-02, phase-03, phase-04, phase-05]
tech_stack:
  added: [vitest, typescript-interfaces]
  patterns: [typescript-strict-types, vitest-mjs-tests]
key_files:
  created:
    - src/types/benchmark.ts
    - src/lib/import.mjs
    - src/lib/import.test.mjs
  modified: []
execution_date: 2026-06-06
duration_minutes: 4
completed_date: 2026-06-06
---

# Phase 01 Plan 02: TypeScript Types + Import Parser Port Summary

**Goal:** Define the benchmark data schema in TypeScript and port the import parser/tests to the Vite+ test pipeline, establishing the single source of truth for data structure.

## Completion Status

✓ All tasks completed successfully
✓ All 9 import parser tests passing green
✓ TypeScript compiles clean with no errors
✓ Both SCAF-03 and SCAF-04 requirements satisfied

## Work Summary

### Task 1: Create src/types/benchmark.ts with Entry schema

**Commit:** `3f35b37`

**Changes:**
- Created `src/types/benchmark.ts` with complete TypeScript schema for benchmark data
- Defined all required interfaces:
  - `ScoreLeaf`: accuracy (number), samples (number), time_s (number)
  - `Scores`: Record<string, ScoreLeaf> for flexible benchmark names
  - `Spec`: parameters_b (number | null), quantization (string), size_gb (number | null)
  - `Tiers`: opus, sonnet, haiku (all boolean)
  - `Abilities`: thinking, mtp (both boolean)
  - `Entry`: Complete entry with model, date, spec, deprecated, tiers, scores, plus optional labelling, abilities, starred

**Schema derived from:** Real data in `app/data/m1-max-64GB-32c.json`, verified against existing test expectations

**Verification:**
- ✓ File exists and is syntactically valid TypeScript
- ✓ All six exports present (Entry, Spec, Tiers, Abilities, ScoreLeaf, Scores)
- ✓ Matches real data structure exactly

### Task 2: Port import.mjs + import.test.mjs to src/lib with vitest

**Commit:** `7d931af`

**Changes:**
- Copied `app/lib/import.mjs` → `src/lib/import.mjs` (exact byte-for-byte port, zero logic changes)
- Copied `app/lib/import.test.mjs` → `src/lib/import.test.mjs` (exact port, vitest compatible)
- Verified vite.config.ts already has correct `test.include: ['lib/**/*.test.mjs']` pattern (relative to root: 'src')

**Functions Ported:**
1. `parseImportInput(text: string)` — Parses fixed-width benchmark stdout table format
   - Extracts model names and benchmark results (accuracy, samples, time_s)
   - Returns array of {model, scores} objects
   
2. `mergeImport(currentData, detected, today)` — Merges detected entries into current data
   - NEW entries: pushed with template defaults
   - OVERWRITE entries: scores updated, all other fields preserved

**Tests Ported (9 total):**
- parseImportInput suite (5 tests):
  - Single model with multiple benchmarks
  - Multiple model blocks
  - Skips blocks with no results
  - Empty array on no models
  - Handles empty input

- mergeImport suite (4 tests):
  - NEW entry with template defaults
  - Multiple NEW entries
  - OVERWRITE preserves all fields except scores
  - Mixed NEW and OVERWRITE in single batch

**Verification:**
```bash
pnpm exec vp test run
 Test Files  1 passed (1)
      Tests  9 passed (9)
```
✓ **ALL 9 TESTS PASSING GREEN**

## TypeScript Verification

```bash
pnpm exec tsc --noEmit
```
✓ **PASSED** — No errors or warnings
✓ Vue SFC imports resolve correctly
✓ All type exports accessible

## Architecture Notes

### Directory Structure
```
src/
├── types/
│   └── benchmark.ts          (Entry, Spec, Scores schema)
├── lib/
│   ├── import.mjs            (parseImportInput, mergeImport)
│   └── import.test.mjs       (vitest suite with 9 tests)
├── index.html
├── main.ts
├── App.vue
└── vite-env.d.ts
```

### Design Decisions Implemented

1. **Single Source of Truth** — `src/types/benchmark.ts` defines all data structures used across the Vue SPA
2. **Exact Parser Port** — Parser logic preserved byte-for-byte to ensure no behavioral regressions during migration
3. **Vitest Integration** — Tests run under `vp test` with `test.include: ['lib/**/*.test.mjs']` pattern (relative to root: 'src')
4. **TypeScript Strict Mode** — All types exported, enabling strict type-checking in downstream components
5. **Optional Fields for Compatibility** — labelling, abilities, starred fields support current and future use cases

## Resolved Dependencies

- **From Plan 01-01:** Vite scaffold with root: 'src', vue@3.5.35, @vitejs/plugin-vue@5.2.4
- **For Phase 02:** Types now available for data loading composable
- **For Phase 03:** Types available for BenchmarkTable and component implementations

## Requirements Coverage

- **SCAF-03** (Parser tests under vitest): ✓ SATISFIED
  - Parser ported to src/lib/import.mjs
  - All 9 original tests passing green
  - Tests validate parseImportInput and mergeImport logic
  
- **SCAF-04** (Data schema in TypeScript): ✓ SATISFIED
  - Entry schema defined in src/types/benchmark.ts
  - All required fields (model, date, spec, tiers, scores) included
  - Matches real data from m1-max-64GB-32c.json exactly

## Deviations from Plan

None — plan executed exactly as written. No auto-fixes needed.

## Self-Check

✓ src/types/benchmark.ts exists with all required exports
✓ src/lib/import.mjs exists (exact port from app/lib/import.mjs)
✓ src/lib/import.test.mjs exists (exact port from app/lib/import.test.mjs)
✓ vite.config.ts already has correct test.include pattern
✓ Commit 3f35b37 verified (types created)
✓ Commit 7d931af verified (parser + tests ported)
✓ pnpm exec vp test run shows 9 tests passing green
✓ pnpm exec tsc --noEmit shows no errors
✓ TypeScript strict mode enabled and clean

## Self-Check: PASSED

All files exist, all tests passing, TypeScript clean, both commits recorded and verified.
