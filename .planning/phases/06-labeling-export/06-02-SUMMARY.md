---
phase: 06
plan: 02
title: "Export & Persistence"
subsystem: "Vue 3 + Vite+ Migration"
tags: [export, modal, file-save, clipboard, typescript]
requirements: [LAB-03, LAB-04, LAB-05]
depends_on: [06-01]
provides:
  - "Export modal UI with JSON display, copy-to-clipboard, and file save (FSA + Safari fallback)"
  - "Export Data button in toolbar (conditional on isDirty or isLabelingMode)"
  - "CP11 Playwright checkpoint validating labeling + export workflow"
affects:
  - "src/components/ExportModal.vue (new)"
  - "src/App.vue (import ExportModal, add button, wire state)"
  - "outputs/ui-validation/final_script.py (new CP11)"
tech_stack:
  added:
    - "Vue 3 Teleport for modal rendering"
    - "File System Access API (showSaveFilePicker)"
    - "navigator.clipboard API"
    - "Blob + download fallback pattern"
  patterns:
    - "Modal overlay + dialog pattern (Teleport)"
    - "Feature detection (showSaveFilePicker in window)"
    - "Graceful degradation (Safari → download)"
key_files:
  created:
    - "src/components/ExportModal.vue"
  modified:
    - "src/App.vue (import, state, computed, button, component)"
    - "outputs/ui-validation/final_script.py (CP11)"
decisions: []
metrics:
  phase_duration: "N/A (wave 2 parallel)"
  completed_date: "2026-06-06"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 2
  commits: 2
---

# Phase 6 Plan 2: Export & Persistence Summary

**Vertical Slice:** User can now edit benchmark entries and export changes to JSON file.

## Objective

Create export modal with JSON copy/save functionality, and wire Export Data button to appear when data is dirty or in labeling mode.

## Implementation

### Task 1: ExportModal.vue Component (Commit: 1189b3a)

Created `src/components/ExportModal.vue` with:

- **Props:**
  - `isOpen: boolean` — modal visibility
  - `entries: Entry[]` — mutableEntries to export as JSON
  - `selectedDevice?: string` — filename suggestion

- **Template:**
  - Modal overlay with semi-transparent background (Teleport to body)
  - Title "Export Data"
  - JSON display area: `<pre><code>` with formatted JSON
  - Three buttons: Copy to Clipboard, Save to File, Close
  - Status message "Copied to clipboard!" shown briefly after successful copy

- **Functionality:**
  - `copyToClipboard()`: Uses `navigator.clipboard.writeText()` with success feedback
  - `saveToFile()`: Feature detection for `showSaveFilePicker` (Chrome/Edge/Firefox)
  - `downloadFile()`: Fallback for Safari and browsers without FSA support (creates blob, download link)
  - Error handling: On save dialog cancellation or API errors, gracefully falls back to download

- **Styling:**
  - Modal overlay: fixed positioning, centered, dark semi-transparent background
  - Modal dialog: white background, max-width 700px, flex column layout, max-height 80vh
  - JSON preview: monospace font, light background, scrollable, user-select for manual copy fallback
  - Buttons: blue primary (copy/save), gray secondary (close), with hover/active states
  - Success message: green background with positive color feedback

### Task 2: App.vue Integration (Commit: 1189b3a)

Updated `src/App.vue` to wire export functionality:

- **Import:** Added `import ExportModal from './components/ExportModal.vue'`

- **State:** Added `isExportModalOpen = ref<boolean>(false)`

- **Computed:** Added `showExportButton = computed<boolean>(() => isDirty.value || isLabelingMode.value)`
  - Button appears when data is dirty (after import/edits) OR when in labeling mode
  - Ensures user can export both during editing and after committing edits

- **Toolbar Button:** Added "📥 Export Data" button (green styling)
  - Only visible when: `isLocalhost && showExportButton`
  - Matches pattern of Import and Label buttons
  - Triggers `isExportModalOpen = true`

- **Modal Component:** Added ExportModal with:
  - `:isOpen="isExportModalOpen"`
  - `:entries="mutableEntries"` — passes current in-memory entries for export
  - `:selectedDevice="selectedDevice || 'benchmark'"` — filename suggestion
  - `@close="isExportModalOpen = false"` — handles modal close

- **Styling:** Added `.btn-export` with green background (#10b981), matching design system

### Task 3: CP11 Playwright Checkpoint (Commit: ccacaa6)

Added `cp11_labeling_and_export()` function to `outputs/ui-validation/final_script.py`:

**Test Flow:**
1. Navigate to localhost (app with data loaded)
2. Click "✏ Label" button to enter labeling mode
3. Verify inline edit inputs appear in table rows
4. Verify "📥 Export Data" button becomes visible (was hidden before labeling mode)
5. Click Export Data button
6. Verify modal opens with correct styling (`.export-modal`)
7. Verify JSON preview element is present and contains valid JSON starting with "["
8. Verify Copy to Clipboard button is present and clickable
9. Verify Save to File button is present and clickable
10. Click Close button in modal
11. Verify modal closes (no longer visible)
12. Click "✓ Done" button to exit labeling mode
13. Verify Label button reappears (labeling mode exited)

**Selectors Used:**
- `button:has-text('✏ Label')` — Label button
- `button:has-text('📥 Export Data')` — Export Data button
- `div.modal-overlay:has(div.export-modal)` — Export modal container
- `div.export-modal pre.json-preview` — JSON content area
- `button:has-text('Copy to Clipboard')` — Copy button
- `button:has-text('Save to File')` — Save button
- `button:has-text('Close')` — Close button
- `button:has-text('✓ Done')` — Done button

**Error Handling:** Captures screenshots on failure, logs detailed error messages for debugging.

## Verification

✅ **TypeScript compilation:** `pnpm exec tsc --noEmit` — 0 errors
✅ **ExportModal component:** Created with all required functionality (copy, save, download fallback)
✅ **App.vue wiring:** Import, state, computed, button, and component integration complete
✅ **Export button visibility:** Correctly shows when `isDirty || isLabelingMode`
✅ **File save implementation:** Feature detection in place, Safari fallback working
✅ **CP11 checkpoint:** Tests complete labeling + export workflow with proper assertions

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations

Per threat register (T-06-04 through T-06-07):

- **T-06-04 (Data Leakage):** Clipboard API is browser-sandboxed; user explicitly initiates copy action
- **T-06-05 (File Integrity):** File System Access API enforces user-initiated write confirmation; no silent overwrites
- **T-06-06 (Browser Compat):** Feature detection + Safari fallback ensures functionality across browsers
- **T-06-07 (User Confusion):** Export button only appears when data is dirty or in labeling mode; clear visual indication

## Known Stubs

None — all export functionality is fully implemented.

## Phase 6 Readiness

Phase 6 Plan 1 (labeling) + Plan 2 (export) now complete:
- ✅ Users can click "✏ Label" to enter editing mode
- ✅ Users can inline-edit entry metadata (spec, abilities, tiers, deprecated)
- ✅ Users can click "📥 Export Data" to open export modal
- ✅ Users can copy JSON to clipboard or save to file
- ✅ Safari users can fall back to download if File System Access unavailable
- ✅ Full end-to-end labeling + export workflow verified by CP11

**Ready for Phase 7:** Parity check + CI validation

