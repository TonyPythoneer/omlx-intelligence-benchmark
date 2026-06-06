---
phase: 02-data-loading-settings
plan: 01
subsystem: vite-configuration, settings-loader
tags: [settings-loading, vite-config, composable, reactive-state]
dependency_graph:
  requires: [phase-01-complete]
  provides: [settings-loading-foundation, useSettings-composable, public-static-serving]
  affects: [phase-02-plan-02-device-selector]
tech_stack:
  added: [useSettings composable]
  patterns: [Vue 3 Composition API, reactive refs, computed properties, onMounted hook, fetch API]
key_files:
  created:
    - src/composables/useSettings.ts
    - public/data (symlink)
    - public/settings.json (symlink)
  modified:
    - vite.config.ts
    - src/App.vue
decisions:
  - "Used computed() for derived state (defaultDevice, parametersBreakpoints, devices) to keep them in sync with settings ref"
  - "Used watch() on defaultDevice to initialize selectedDevice, following Vue 3 patterns"
  - "Placed DeviceSelector placeholder comment in App.vue template; actual component to be created in 02-02"
  - "Guard SSR context with 'typeof window !== undefined' defensive check in useSettings()"
metrics:
  phase: 02-data-loading-settings
  plan: 01
  status: complete
  completed_date: 2026-06-06
  duration_minutes: 15
  tasks_completed: 3
  files_created: 3
  files_modified: 2
  commits: 3
---

# Phase 02 Plan 01: Vite Configuration and Settings Loading Summary

**Vite configuration and composable infrastructure to load settings.json client-side.**

## Overview

Established the foundation for client-side settings loading in the Vue 3 + Vite SPA. The app can now:
- Fetch `/settings.json` on component mount via the `useSettings()` composable
- Display reactive loading and error states to the user
- Initialize the device selector with the default device from settings
- Serve static JSON files through Vite's publicDir mechanism

## Completed Tasks

### Task 1: Configure vite.config.ts and create public/ directory
**Status:** ✓ Complete | **Commit:** `143df2f`

- Added `publicDir: '../public'` to vite.config.ts
- Created public/ directory at repo root
- Created symlink `public/data` → `../app/data`
- Created symlink `public/settings.json` → `../app/settings.json`

This enables fetch('/settings.json') and fetch('/data/{device}.json') to work during dev and build, while keeping the source of truth in app/.

### Task 2: Create useSettings composable
**Status:** ✓ Complete | **Commit:** `0c3c96f`

Created `src/composables/useSettings.ts` with:
- **DeviceMeta interface**: family, variant, memory, gpus
- **Settings interface**: defaultDevice, parametersBreakpoints, devices
- **useSettings() function**: 
  - Fetches '/settings.json' on mount
  - Returns reactive refs: settings, defaultDevice, parametersBreakpoints, devices, isLoading, error
  - Handles fetch errors gracefully with console logging
  - Guards against SSR context

### Task 3: Update App.vue to load settings and display state
**Status:** ✓ Complete | **Commit:** `4f09c1c`

Updated `src/App.vue` to:
- Import and call useSettings() composable
- Create selectedDevice ref initialized to null
- Watch defaultDevice and update selectedDevice when settings load
- Update template with conditional rendering:
  - Show "Loading settings..." while isLoading is true
  - Show error message with red background if fetch fails
  - Show DeviceSelector placeholder + BenchmarkTable when loaded
- Add CSS for loading (.loading-state) and error (.error-state) states

## Verification Checklist

✓ vite.config.ts contains `publicDir: '../public'`
✓ public/data exists as symlink to ../app/data
✓ public/settings.json exists as symlink to ../app/settings.json
✓ src/composables/useSettings.ts exports useSettings() function
✓ useSettings() returns reactive refs: settings, defaultDevice, parametersBreakpoints, devices, isLoading, error
✓ src/App.vue imports and calls useSettings()
✓ App.vue displays "Loading settings..." while isLoading is true
✓ App.vue displays error message if fetch fails
✓ App.vue displays placeholder for DeviceSelector + BenchmarkTable when settings load
✓ selectedDevice ref is initialized from settings.defaultDevice via watch()
✓ pnpm exec tsc --noEmit passes clean

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **DATA-02**: Settings infrastructure for device selection
  - ✓ settings.json loads successfully
  - ✓ defaultDevice drives selectedDevice initialization
  - ✓ App displays loading/error states during fetch

- **DATA-03**: No schema changes to JSON files
  - ✓ Only fetching existing JSON as-is
  - ✓ No modifications to data structure

## Next Steps

Plan 02-02 will create the DeviceSelector component and bind it to the selectedDevice ref. The placeholder comment in App.vue marks the location where the component will be integrated.

## Tech Stack Notes

- Vue 3 Composition API with ref(), computed(), watch(), onMounted()
- Fetch API for HTTP GET requests
- TypeScript interfaces for type safety
- Vite's publicDir mechanism for static asset serving
- Symlinks to prevent data duplication between src/ and app/

## Notes

The composable uses computed() properties for derived state (defaultDevice, parametersBreakpoints, devices) rather than separate refs. This ensures they stay in sync with the main settings ref and recompute automatically when settings changes. The watch() on defaultDevice provides a clean pattern for responding to settings load completion without tight coupling to the composable's internal state.
