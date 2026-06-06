---
phase: 02-data-loading-settings
plan: 02
subsystem: data-loading, device-selection, composables
tags: [data-fetching, reactive-state, device-selector, vue-composition-api]
dependency_graph:
  requires: [02-01-complete]
  provides: [device-selection-component, benchmark-data-composable, prop-driven-table, complete-data-flow]
  affects: [phase-03-filtering-sorting, phase-04-export-import]
tech_stack:
  added: [useBenchmarkData composable, DeviceSelector component]
  patterns: [Vue 3 Composition API, reactive refs, watch with immediate, template v-for loops]
key_files:
  created:
    - src/composables/useBenchmarkData.ts
    - src/components/DeviceSelector.vue
  modified:
    - src/components/BenchmarkTable.vue
    - src/App.vue
decisions:
  - "useBenchmarkData watches device ref and fetches /data/{device}.json reactively on change"
  - "DeviceSelector emits update:modelValue pattern for two-way binding compatibility"
  - "BenchmarkTable uses v-for with :key='entry.model' for proper Vue reconciliation"
  - "App.vue orchestrates flow: settings load → defaultDevice → selectedDevice → data fetch → table render"
  - "Combined loading/error states for both settings and data for clear user feedback"
metrics:
  phase: 02-data-loading-settings
  plan: 02
  status: complete
  completed_date: 2026-06-06
  duration_minutes: 20
  tasks_completed: 3
  files_created: 2
  files_modified: 2
  commits: 3
---

# Phase 02 Plan 02: Data Loading and Device Selection Summary

**Complete data loading infrastructure with device selector dropdown and reactive benchmark table rendering.**

## Overview

Built the core data loading and device selection features for the Vue 3 + Vite SPA. Users can now:
- Select a device from a dropdown populated from settings
- See "Loading data..." while benchmark data is fetched
- View benchmark entries in a dynamically rendered table
- Change device selection and automatically see new data

## Completed Tasks

### Task 1: Create useBenchmarkData composable and DeviceSelector component
**Status:** ✓ Complete | **Commit:** `399f33b`

**useBenchmarkData composable** (`src/composables/useBenchmarkData.ts`):
- Accepts a device Ref and watches it for changes
- Fetches `/data/{device}.json` reactively when device changes
- Returns reactive state: `entries`, `isLoading`, `error`
- Validates response is an array before assignment
- Gracefully handles fetch errors without re-throwing
- Guards against SSR context with `typeof window !== 'undefined'` check

**DeviceSelector component** (`src/components/DeviceSelector.vue`):
- Accepts `devices: Record<string, DeviceMeta>` and `modelValue: string` props
- Renders HTML `<select>` element with options for each device
- Option labels show device key, family, variant, memory, and GPU count
- Emits `update:modelValue` on selection change for v-model binding
- Simple scoped styling with border, padding, and focus states

### Task 2: Update BenchmarkTable to accept entries prop and render dynamically
**Status:** ✓ Complete | **Commit:** `92a49ae`

Updated `src/components/BenchmarkTable.vue`:
- Removed hardcoded entry constant entirely
- Added `defineProps<{ entries: Entry[] }>()` to accept entries as prop
- Changed template from single hardcoded `<tr>` to `v-for="entry in entries"`
- Added empty state: shows "No entries loaded" when entries array is empty
- Kept all existing column bindings unchanged, now inside v-for loop
- All column headers and styling preserved exactly

### Task 3: Update App.vue to wire device selector, data fetching, and table rendering
**Status:** ✓ Complete | **Commit:** `d83e4a6`

Updated `src/App.vue`:
- Added imports: `DeviceSelector` component and `useBenchmarkData` composable
- Destructured `devices` from `useSettings()` return
- Created `selectedDevice` ref and passed to `useBenchmarkData()`
- Renamed settings state refs: `isLoading` → `settingsLoading`, `error` → `settingsError`
- Added data loading state refs: `dataLoading`, `dataError`
- Updated template:
  - Added device selector section with label
  - Connected DeviceSelector with `:devices` prop and `v-model:modelValue` binding
  - Show "Loading data..." during data fetch
  - Show data error message if fetch fails
  - Pass `:entries` prop to BenchmarkTable
- Added CSS for `.device-section` with flexbox layout
- Complete data flow: Settings load → Device selector → Data fetch → Table update

## Verification Checklist

✓ `export function useBenchmarkData` in composable
✓ `watch(device)` triggers on device changes
✓ `fetch(\`/data/` in composable with proper template literal
✓ `defineProps<{ entries: Entry[] }>()` in BenchmarkTable
✓ `v-for="entry in entries"` with `:key="entry.model"` in BenchmarkTable
✓ Empty state message when `entries.length === 0`
✓ `import DeviceSelector` and `import useBenchmarkData` in App.vue
✓ `useBenchmarkData(selectedDevice)` called in App.vue
✓ `<DeviceSelector>` rendered in template
✓ `v-model:modelValue="selectedDevice"` binding present
✓ `:entries="entries"` passed to BenchmarkTable
✓ Data loading state displayed during fetch
✓ Data error state displayed on fetch failure
✓ `pnpm exec tsc --noEmit` exits with 0 (clean TypeScript compilation)

## Deviations from Plan

None - plan executed exactly as written.

## Requirements Satisfied

- **DATA-01**: Benchmark JSON data loaded client-side reactively
  - ✓ useBenchmarkData fetches /data/{device}.json
  - ✓ Fetch triggered reactively by watch on device ref
  - ✓ Entries loaded and passed to BenchmarkTable via prop

- **DATA-02**: Settings load and device selector populated
  - ✓ DeviceSelector renders dropdown with devices from settings
  - ✓ Default device from settings initializes selectedDevice
  - ✓ User can select device and trigger data fetch

- **DATA-03**: Pure JSON data contract preserved
  - ✓ No schema changes to app/data/*.json files
  - ✓ Data fetched and rendered as-is
  - ✓ Only reading JSON, no modifications

## Data Flow Diagram

```
useSettings()
  ├─ fetch /settings.json
  ├─ provides: defaultDevice, devices
  └─> watch triggers selectedDevice update

selectedDevice (ref)
  └─> useBenchmarkData(selectedDevice)
       ├─ watch on device ref (immediate: true)
       ├─ fetch /data/{device}.json
       ├─ parse response as Entry[]
       └─> provides: entries, isLoading, error

Template:
  ├─ DeviceSelector (receives devices, emits update:modelValue)
  ├─ Data loading state (shows while isLoading)
  ├─ Data error message (shows if error)
  └─ BenchmarkTable (receives entries, renders v-for loop)
```

## User Experience

1. **Page Load**: Settings load automatically, device selector appears
2. **Default Device**: Dropdown shows selected device from settings.defaultDevice
3. **Data Fetch**: Selecting a device triggers fetch of /data/{device}.json
4. **Loading Feedback**: "Loading data..." displays during fetch
5. **Table Render**: Entries display in table as soon as fetch completes
6. **Error Handling**: If fetch fails, error message displayed; table shows empty state
7. **Re-selection**: Changing device selection immediately fetches new data and re-renders

## Tech Stack Notes

- **Vue 3 Composition API**: ref(), watch(), computed(), onMounted() patterns
- **Fetch API**: No external HTTP library; using native browser fetch
- **TypeScript**: Full type safety with Entry, DeviceMeta, Settings interfaces
- **Reactive State Management**: Watch reactions handle auto-fetching without external state library
- **Component Patterns**: Props + emit for two-way binding (v-model:modelValue in DeviceSelector)

## Browser Network Sequence

```
1. GET /settings.json         → Settings load
2. GET /data/m1-max-64GB-32c.json  → Default device data (immediate: true in watch)
3. GET /data/{selected-device}.json  → (each time user changes device)
```

## Next Steps

Plan 02-03 will add:
- Filtering by tier (Opus/Sonnet/Haiku)
- Filtering by parameters range
- Searching by model name
- Sorting by columns
- Show/hide deprecated entries
- Additional benchmark metrics display

## Known Stubs

None - all features implemented without placeholders.

## Threat Flags

None - no new security surface introduced:
- DeviceSelector only accepts values from settings.devices (no injection)
- BenchmarkTable data is typed Entry[] (TypeScript enforces schema)
- /data/*.json files are public (consistent with current app/index.html)
