---
phase: 07-parity-ci-swap
plan: 02
subsystem: testing
tags: [ci, data-validation, vitest, github-actions, vue-spa-migration]

requires:
  - phase: 07-01
    provides: "Vue SPA migration infrastructure and initial parity verification"
  - phase: 05-02
    provides: "Import parser tests ported to vitest in src/lib/"

provides:
  - "Data validation CI workflow compatible with Vue SPA structure (src/lib/**)"
  - "Verified 35-test parser test suite all passing locally"
  - "CI workflow triggers on both app/data/** and src/lib/** changes"
  - "JSON validation for benchmark data files confirmed working"

affects: ["07-03", "deployment", "ci-cd"]

tech-stack:
  added: []
  patterns:
    - "GitHub Actions workflow path triggers map to Vue SPA file structure"
    - "Vitest runs tests from src/ root with lib/**/*.test.mjs and composables/**/*.test.ts glob"

key-files:
  created: []
  modified: 
    - ".github/workflows/validate-data.yml"

key-decisions:
  - "Updated CI trigger from app/lib/** to src/lib/** to match Vue SPA parser location"
  - "Maintained app/data/** trigger for data changes"
  - "Kept pnpm test as single validation entrypoint"

requirements-completed: ["PAR-02"]

duration: 5min
completed: 2026-06-06
---

# Phase 7 Plan 2: Data Validation CI Parity Summary

**Data validation CI workflow updated for Vue SPA structure; 35 parser tests passing locally; CI triggers on both app/data/** and src/lib/** changes**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-06 21:50:06 UTC
- **Completed:** 2026-06-06 21:56:00 UTC
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Verified all 35 data validation and parser tests pass locally with Vitest
- Updated CI workflow to trigger on src/lib/** changes (parser location in Vue SPA)
- Confirmed JSON validation step correctly validates app/data/*.json files
- Verified workflow compatibility with Vue SPA file structure

## Task Commits

Each task was committed atomically:

1. **Task 1: Run pnpm test locally and verify parser tests pass** - (no explicit commit, verification step)
2. **Task 2: Verify and update validate-data.yml workflow** - `d588b79` (fix)

**Plan metadata:** (to be committed in final commit)

## Files Created/Modified

- `.github/workflows/validate-data.yml` - Updated path triggers from 'app/lib/**' to 'src/lib/**'

## Decisions Made

- **CI trigger path migration:** Switched from `app/lib/**` to `src/lib/**` to match the new Vue SPA project structure where the import parser was ported to `src/lib/import.mjs` (with tests at `src/lib/import.test.mjs`)
- **Single test entrypoint:** Maintained `pnpm test` as the sole validation command, which runs Vitest against the src/ root
- **JSON validation integration:** Preserved the JSON file validation step which uses `find app/data -name '*.json'` to validate benchmark data integrity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## Test Results

```
Test Files  3 passed (3)
     Tests  35 passed (35)
  Start at  21:50:06
  Duration  177ms (transform 94ms, setup 0ms, import 173ms, tests 17ms, environment 1ms)
```

All parser tests passing:
- parseImportInput function tests ✓
- Entry validation (spec, abilities, tiers) tests ✓
- Merge logic (NEW vs OVERWRITE) tests ✓
- Data file format compatibility tests ✓

## CI Workflow Verification

- **Trigger paths updated:** ✓
  - Before: `app/data/**`, `app/lib/**`, `package.json`, `vite.config.ts`
  - After: `app/data/**`, `src/lib/**`, `package.json`, `vite.config.ts`
- **Test step verified:** `pnpm test` correctly runs Vitest
- **JSON validation verified:** `find app/data` correctly locates and validates all JSON files
- **Node/pnpm versions:** 24 / 11 compatible with Vue SPA Vite config

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data validation CI is production-ready and compatible with Vue SPA structure
- All tests pass locally and CI workflow is correctly configured
- Ready to proceed with deployment verification (Phase 7 Plan 3)

---
*Phase: 07-parity-ci-swap*
*Plan: 02*
*Completed: 2026-06-06*
