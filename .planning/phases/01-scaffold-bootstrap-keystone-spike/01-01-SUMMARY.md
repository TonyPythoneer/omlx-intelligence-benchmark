---
phase: 01-scaffold-bootstrap-keystone-spike
plan: 01
subsystem: vite-scaffold
tags: [scaffold, vue3, vite+, typescript, walking-skeleton]
dependency_graph:
  requires: []
  provides: [vue-3-spa-foundation, vite-root-src, typescript-sfc-support, dev-server]
  affects: [phase-02, phase-03, phase-04]
tech_stack:
  added: [vue@3.5.35, @vitejs/plugin-vue@5.2.4, typescript, vite-plus]
  patterns: [composition-api, sfc-vue3, vite-server-8080]
key_files:
  created:
    - src/index.html
    - src/main.ts
    - src/App.vue
    - src/vite-env.d.ts
    - tsconfig.json
    - tsconfig.node.json
  modified:
    - vite.config.ts
    - package.json
execution_date: 2026-06-06
duration_minutes: 8
completed_date: 2026-06-06
---

# Phase 01 Plan 01: Vue 3 + Vite+ SPA Scaffold Summary

**Goal:** Establish the foundational Vite+ config and Vue 3 SPA shell with TypeScript, demonstrating `vp dev` works with hot-reload before moving to components and features.

## Completion Status

✓ All tasks completed successfully
✓ All automated verifications passed
✓ TypeScript compiles clean
✓ Dev server (vp dev) running on localhost:8080
✓ Both SCAF-01 and SCAF-04 requirements satisfied

## Work Summary

### Task 1: Update vite.config.ts for Vue 3 SPA + configure package.json

**Commits:**
- `a0db4c5`: feat(01): vite+vue SPA config with root:src and build output

**Changes:**
- Updated `vite.config.ts`:
  - Set `root: 'src'` to isolate Vue app from legacy `app/index.html`
  - Imported and registered `@vitejs/plugin-vue` plugin
  - Configured `build.outDir: '../dist'` for static SPA deployment
  - Preserved existing `server.port: 8080`, `server.host: 'localhost'`, and test config
  
- Updated `package.json`:
  - Added `"vue": "^3.5.0"` → installed as 3.5.35
  - Added `"@vitejs/plugin-vue": "^5.0.0"` → installed as 5.2.4
  - Preserved existing scripts and engine requirements

**Verification:**
- ✓ `root: 'src'` in vite.config.ts
- ✓ `@vitejs/plugin-vue` import and plugin registration
- ✓ `outDir: '../dist'` configured
- ✓ `vue` and `@vitejs/plugin-vue` in devDependencies

### Task 2: Create src/ shell — index.html, main.ts, App.vue, tsconfig.json

**Commits:**
- `85aadc9`: feat(01): src shell and TypeScript config for Vue 3 SPA
- `c1dbc73`: fix(01): add Vue SFC type declarations for TypeScript (auto-fix)

**Files Created:**

1. **src/index.html** — Vite SPA entry point
   - Standard HTML5 doctype with charset and viewport meta
   - Favicon (SVG ⚡ emoji)
   - Google Fonts links (Inter, JetBrains Mono)
   - Mount target: `<div id="app"></div>`
   - Module script entry: `<script type="module" src="/main.ts"></script>`

2. **src/main.ts** — TypeScript application entry
   - Imports `createApp` from 'vue'
   - Imports root `App` component from './App.vue'
   - Creates and mounts Vue app to `#app`

3. **src/App.vue** — Root Vue component
   - Template: heading "oMLX Intelligence Benchmark" + loading indicator
   - Script setup (empty for now, ready for future composables)
   - Scoped styles with CSS reset (box-sizing, margin, padding)

4. **tsconfig.json** — TypeScript configuration for Vue 3 + SFC
   - Target: ES2020
   - Module: ESNext with bundler moduleResolution
   - Strict mode enabled (all strict flags)
   - Type includes: `vite/client`, `vue`
   - JSX preserved (for Vue templates)
   - Includes src/**/*.ts|tsx|vue
   - References tsconfig.node.json for build-time config

5. **tsconfig.node.json** — TypeScript config for vite.config.ts
   - Composite type configuration
   - Bundler module resolution for Vite config

6. **src/vite-env.d.ts** — Vue SFC module declaration (auto-fix)
   - Declares `.vue` modules as DefineComponent types
   - Enables TypeScript to resolve Vue SFC imports

**Verification:**
- ✓ All six files exist and are syntactically valid
- ✓ `id="app"` mount point in src/index.html
- ✓ `createApp` and mount call in src/main.ts
- ✓ `<template>` block in src/App.vue
- ✓ `vue` type declarations in tsconfig.json

## Verification Results

### Automated Checks

**Task 1 Verification Script:**
```bash
grep -q "root: 'src'" vite.config.ts && \
grep -q "@vitejs/plugin-vue" vite.config.ts && \
grep -q "outDir" vite.config.ts && \
grep -q '"vue"' package.json && \
grep -q '"@vitejs/plugin-vue"' package.json
```
✓ **PASSED**

**Task 2 Verification Script:**
```bash
test -f src/index.html && \
test -f src/main.ts && \
test -f src/App.vue && \
test -f tsconfig.json && \
grep -q 'id="app"' src/index.html && \
grep -q 'createApp' src/main.ts && \
grep -q '<template>' src/App.vue
```
✓ **PASSED**

### TypeScript Compilation

```bash
pnpm exec tsc --noEmit
```
✓ **PASSED** — No errors or warnings

### Dev Server Verification

```bash
pnpm exec vp dev
```
✓ **PASSED** — Server running on localhost:8080
✓ **PASSED** — HTML response contains:
  - Correct page title: "oMLX Intelligence Benchmark"
  - Mount point: `id="app"`
  - Module script entry: `src="/main.ts"`
  - Vite HMR client injected for hot-reload

### Dependencies

```
pnpm install
```
✓ **PASSED** — Installation successful
- vue@3.5.35
- @vitejs/plugin-vue@5.2.4

## Deviations from Plan

### Auto-Fixed Issues

**[Rule 2 - Auto-add missing critical functionality]** Vue SFC Type Declarations
- **Found during:** Task 2 verification (TypeScript compilation)
- **Issue:** TypeScript could not resolve `.vue` modules, failing `tsc --noEmit`
- **Root cause:** Vue SFC modules require explicit type declaration for TypeScript module resolution
- **Fix applied:** Created `src/vite-env.d.ts` with `declare module '*.vue'` type definition
- **Impact:** Critical — enables TypeScript compilation and IDE support for .vue imports
- **Commit:** c1dbc73

## Architecture Notes

### Directory Structure
```
repo-root/
├── vite.config.ts          (root: 'src', build.outDir: '../dist')
├── src/
│   ├── index.html          (Vite entry point)
│   ├── main.ts             (TypeScript app entry)
│   ├── App.vue             (root component)
│   └── vite-env.d.ts       (Vue SFC type declarations)
├── app/                    (legacy vanilla app — UNCHANGED)
│   └── index.html          (stays intact until Phase 7)
├── tsconfig.json           (TypeScript config)
└── tsconfig.node.json      (build-time config)
```

### Design Decisions Implemented

1. **`root: 'src'`** — Vite dev server and build use `src/` as root, isolating the Vue SPA from legacy `app/index.html` until Phase 7 atomic swap
2. **`build.outDir: '../dist'`** — `vp build` outputs static SPA to repo-root `dist/` (serverless, ready for CDN)
3. **TypeScript strict mode** — All strict compiler flags enabled for type safety
4. **Vue 3.5 + Composition API** — Modern Vue with script setup syntax (SFC)
5. **Vite+ toolchain** — Uses `vp dev`, `vp test`, `vp build` (vite-plus wrapper)

## Requirements Coverage

- **SCAF-01** (SPA scaffold setup): ✓ SATISFIED
  - Vite+ config for Vue 3 SPA established
  - TypeScript support fully configured
  - Dev server running with HMR
  
- **SCAF-04** (TypeScript + SFC support): ✓ SATISFIED
  - tsconfig.json with Vue 3 and SFC support
  - TypeScript compilation clean
  - .vue module resolution working

## Next Steps (Phase 02)

- Port `app/lib/import.mjs` and `app/lib/import.test.mjs` into the Vite test pipeline
- Create `types/benchmark.ts` schema based on `app/data/m1-max-64GB-32c.json`
- Build minimal `BenchmarkTable.vue` rendering one real row
- Establish composables skeleton + `useClientOnly` guard

## Self-Check

✓ src/index.html exists
✓ src/main.ts exists
✓ src/App.vue exists
✓ tsconfig.json exists
✓ src/vite-env.d.ts exists
✓ vite.config.ts updated with root: 'src' and vue plugin
✓ package.json updated with vue and @vitejs/plugin-vue
✓ Commit a0db4c5 verified (vite+vue config)
✓ Commit 85aadc9 verified (src shell)
✓ Commit c1dbc73 verified (vite-env.d.ts)
✓ pnpm install succeeded
✓ tsc --noEmit passed
✓ vp dev serving on localhost:8080
✓ HTML response correct with mount point and script entry
✓ All automated verifications passed

## Self-Check: PASSED

All files exist, all commits recorded, all verifications passed.
