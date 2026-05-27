# 自動基準數據導入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the repository owner to paste benchmark results in a GitHub Issue and have CI automatically merge the data to main without terminal interaction.

**Architecture:** Three-tier system — Issue Form (data collection) → CI Pipeline (parse & apply) → Notifications (feedback). Core logic extracted into a reusable ES module (`app/lib/import.mjs`) shared by browser and CI. GitHub Actions workflows manage the orchestration: auto-trigger on owner Issue creation, validation on PR, notification after merge.

**Tech Stack:** 
- Node.js (script execution, parsing)
- Vite+ (dev server, test runner)
- Vitest (unit & integration tests)
- GitHub Actions (CI/CD)
- YAML (Issue template, workflows)

---

## File Structure Overview

```
.github/
├── ISSUE_TEMPLATE/
│   └── auto-data-import.yml          [CREATE] Issue form template
└── workflows/
    ├── auto-data-import.yml          [CREATE] Main orchestration workflow
    ├── validate-data.yml             [CREATE] Required PR check
    └── post-merge-notify.yml         [CREATE] Post-merge notification

scripts/
└── apply-import.mjs                  [CREATE] CI entry point (Node.js)

app/
├── index.html                        [MODIFY] Load import.mjs module + update saveImport
├── lib/
│   ├── import.mjs                    [CREATE] Parser + merger (extracted from index.html)
│   └── import.test.mjs               [CREATE] Vitest unit tests
└── settings.json                     [READ-ONLY] Device enumeration

project root/
├── package.json                      [CREATE] vite-plus devDep
├── vite.config.ts                    [CREATE] Dev/test config
├── .gitignore                        [MODIFY] Add node_modules/
├── Makefile                          [MODIFY] serve target
├── CLAUDE.md                         [MODIFY] Update serverless note
├── README.md                         [MODIFY] Add Contributing section
└── docs/readme/pages/development.md  [MODIFY] Update dev commands
```

---

## Task 1: Create Vite+ Project Configuration

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "omlx-intelligence-benchmark",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "vp dev",
    "test": "vp test",
    "build": "echo 'Do not run vp build — site is serverless'"
  },
  "devDependencies": {
    "vite-plus": "^1.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  server: {
    port: 8080,
    host: 'localhost'
  },
  test: {
    include: ['lib/**/*.test.mjs'],
    globals: true
  }
});
```

**Note:** `test.include: ['lib/**/*.test.mjs']` is relative to `root: 'app'`, so this matches `app/lib/**/*.test.mjs`.

- [ ] **Step 3: Update `.gitignore`**

Add `node_modules/` to existing .gitignore file. If .gitignore doesn't exist, create it with:

```
node_modules/
```

- [ ] **Step 4: Verify configuration**

Run: `vp --version`
Expected: Shows vite-plus version (e.g., "1.0.0")

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts .gitignore
git commit -m "chore: add Vite+ build config and dev tooling"
```

---

## Task 2: Extract Parser and Merger to `app/lib/import.mjs`

**Files:**
- Create: `app/lib/import.mjs`

**Context:** Extract the parser from `app/index.html` (lines 1160–1184) into a standalone ES module. The parser reads fixed-width benchmark tables with a specific regex. The merger logic follows the pattern in `saveImport` (lines 1055–1086). This module has no DOM dependencies and will be shared by both the browser and CI.

**Parser Details:**
- Input format: fixed-width table with `Model:` line followed by benchmark rows
- Regex: `/^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)/gm`
- Captures: benchmark name, accuracy (%), [skip correct count], samples, time_s, [skip think flag]
- Score object shape (critical): `{ accuracy: number, samples: number, time_s: number }`

**NEW Entry Template (from `saveImport` lines 1069–1076):**
```javascript
{
  model: string,
  date: today (YYYY-MM-DD),
  spec: { parameters_b: null, quantization: '', size_gb: null },
  deprecated: false,
  starred: false,
  scores: { ... }
}
```
**Important:** No `abilities` or `tiers` on NEW import; only `starred: false`. These are added later in Labeling Mode.

**OVERWRITE Behavior:**
Only `scores` is overwritten. All other fields (date, spec, deprecated, starred, abilities, tiers) are preserved from existing entry.

- [ ] **Step 1: Write `app/lib/import.mjs`**

```javascript
/**
 * Parse benchmark stdout to extract model entries.
 * Input: fixed-width table format (see app/index.html lines 1160-1184)
 * 
 * Example input:
 * Model: gpt-oss-20b-RotorQuant-MLX-8bit
 * Benchmark         Accuracy   Correct   Total   Time(s)   Think
 * MMLU                 80.0%        24      30     492.9     Yes
 * TRUTHFULQA           80.0%        24      30     138.8     Yes
 * 
 * @param {string} text - Raw benchmark stdout
 * @returns {Array<{model: string, scores: Object}>} Detected entries with scores
 */
export function parseImportInput(text) {
  const results = []
  const blocks = text.split(/(?=^Model:)/m)
  const scoreRe = /^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)/gm
  
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed.startsWith('Model:')) continue
    
    const modelName = trimmed.split('\n')[0].replace(/^Model:/, '').trim()
    const scores = {}
    scoreRe.lastIndex = 0
    
    let m
    while ((m = scoreRe.exec(block)) !== null) {
      const [, bench, accuracy, samples, time_s] = m
      scores[bench] = {
        accuracy: parseFloat(accuracy),
        samples: parseInt(samples, 10),
        time_s: parseFloat(time_s),
      }
    }
    
    if (Object.keys(scores).length > 0) {
      results.push({ model: modelName, scores })
    }
  }
  
  return results
}

/**
 * Merge detected entries into current data array.
 * NEW entries: pushed with template defaults (see CLAUDE.md).
 * OVERWRITE entries: only scores updated; ALL other fields (date, spec, deprecated, starred, abilities, tiers) preserved.
 * 
 * @param {Array} currentData - Existing data entries
 * @param {Array} detected - Newly detected entries from parseImportInput
 * @param {string} today - Today's date (YYYY-MM-DD)
 * @returns {Array} Merged data array
 */
export function mergeImport(currentData, detected, today) {
  const nextData = currentData.map(e => ({ ...e }))
  const byModel = new Map(nextData.map((e, i) => [e.model, i]))
  
  for (const d of detected) {
    if (byModel.has(d.model)) {
      // OVERWRITE: only update scores
      const idx = byModel.get(d.model)
      nextData[idx] = { ...nextData[idx], scores: d.scores }
    } else {
      // NEW: push with template defaults
      nextData.push({
        model: d.model,
        date: today,
        spec: { parameters_b: null, quantization: '', size_gb: null },
        deprecated: false,
        starred: false,
        scores: d.scores,
      })
    }
  }
  
  return nextData
}
```

- [ ] **Step 2: Verify module loads without errors**

```bash
node -e "
import('./app/lib/import.mjs').then(m => {
  console.log('Exports:', Object.keys(m));
  const parsed = m.parseImportInput('Model: Test\nMMBU: 50');
  console.log('Parse test:', parsed);
  const merged = m.mergeImport([], parsed, '2026-05-28');
  console.log('Merge test:', merged);
}).catch(e => { console.error(e); process.exit(1); });
"
```

Expected: Outputs object keys, parsed array, and merged result without errors.

- [ ] **Step 3: Commit**

```bash
git add app/lib/import.mjs
git commit -m "feat: extract parser and merger to app/lib/import.mjs"
```

---

## Task 3: Create Comprehensive Unit Tests in `app/lib/import.test.mjs`

**Files:**
- Create: `app/lib/import.test.mjs`

**Context:** Vitest suite for parser and merger. Critical: all `scores` values must be objects with `{ accuracy, samples, time_s }`, not numbers.

- [ ] **Step 1: Write test suite header**

```javascript
import { describe, it, expect } from 'vitest';
import { parseImportInput, mergeImport } from './import.mjs';

describe('parseImportInput', () => {
  // Tests follow in next steps
});

describe('mergeImport', () => {
  // Tests follow in next steps
});
```

- [ ] **Step 2: Add parser tests — canonical fixed-width format**

```javascript
describe('parseImportInput', () => {
  it('parses fixed-width table with model and benchmarks', () => {
    const input = `Model: gpt-oss-20b-RotorQuant-MLX-8bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 80.0%        24      30     492.9     Yes
TRUTHFULQA           80.0%        24      30     138.8     Yes`;
    const result = parseImportInput(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('gpt-oss-20b-RotorQuant-MLX-8bit');
    expect(result[0].scores.MMLU).toEqual({
      accuracy: 80.0,
      samples: 30,
      time_s: 492.9,
    });
    expect(result[0].scores.TRUTHFULQA).toEqual({
      accuracy: 80.0,
      samples: 30,
      time_s: 138.8,
    });
  });

  it('parses multiple model blocks', () => {
    const input = `Model: Llama-2-7B
MMLU                 46.2%        14      30     100.0     No
Model: Llama-2-13B
MMLU                 55.8%        17      30     150.0     Yes`;
    const result = parseImportInput(input);
    
    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Llama-2-7B');
    expect(result[0].scores.MMLU.accuracy).toBe(46.2);
    expect(result[1].model).toBe('Llama-2-13B');
    expect(result[1].scores.MMLU.accuracy).toBe(55.8);
  });

  it('skips model blocks with no benchmark rows', () => {
    const input = `Model: NoScores
SomeRandomText
Model: WithScores
MMLU                 50.0%        15      30     200.0     No`;
    const result = parseImportInput(input);
    
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('WithScores');
  });

  it('returns empty array on zero models', () => {
    const input = `Some random text
without any models`;
    const result = parseImportInput(input);
    
    expect(result).toEqual([]);
  });

  it('handles empty input', () => {
    const result = parseImportInput('');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 3: Add merger tests — NEW entries**

```javascript
describe('mergeImport', () => {
  it('pushes NEW entry with template defaults', () => {
    const current = [];
    const detected = [{
      model: 'NewModel',
      scores: {
        MMLU: { accuracy: 50, samples: 30, time_s: 100 }
      }
    }];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      model: 'NewModel',
      date: '2026-05-28',
      spec: { parameters_b: null, quantization: '', size_gb: null },
      deprecated: false,
      starred: false,
      scores: {
        MMLU: { accuracy: 50, samples: 30, time_s: 100 }
      }
    });
  });

  it('handles multiple NEW entries', () => {
    const current = [];
    const detected = [
      {
        model: 'Model-A',
        scores: { MMLU: { accuracy: 50, samples: 30, time_s: 100 } }
      },
      {
        model: 'Model-B',
        scores: { MMLU: { accuracy: 60, samples: 30, time_s: 150 } }
      }
    ];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Model-A');
    expect(result[1].model).toBe('Model-B');
  });
});
```

- [ ] **Step 4: Add merger tests — OVERWRITE behavior**

```javascript
  it('OVERWRITE: updates scores only, preserves all other fields', () => {
    const current = [
      {
        model: 'ExistingModel',
        date: '2026-05-25',
        spec: { parameters_b: 35, quantization: '4bit', size_gb: 18 },
        deprecated: false,
        starred: true,
        abilities: { thinking: true, mtp: false },
        tiers: { opus: true, sonnet: false, haiku: false },
        scores: { MMLU: { accuracy: 40, samples: 30, time_s: 100 } }
      }
    ];
    const detected = [{
      model: 'ExistingModel',
      scores: {
        MMLU: { accuracy: 55, samples: 30, time_s: 120 },
        TRUTHFULQA: { accuracy: 48, samples: 30, time_s: 80 }
      }
    }];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('ExistingModel');
    expect(result[0].date).toBe('2026-05-25'); // preserved
    expect(result[0].spec).toEqual({ parameters_b: 35, quantization: '4bit', size_gb: 18 }); // preserved
    expect(result[0].deprecated).toBe(false); // preserved
    expect(result[0].starred).toBe(true); // preserved
    expect(result[0].abilities).toEqual({ thinking: true, mtp: false }); // preserved
    expect(result[0].tiers).toEqual({ opus: true, sonnet: false, haiku: false }); // preserved
    expect(result[0].scores).toEqual({
      MMLU: { accuracy: 55, samples: 30, time_s: 120 },
      TRUTHFULQA: { accuracy: 48, samples: 30, time_s: 80 }
    }); // updated
  });

  it('handles mixed NEW and OVERWRITE in single batch', () => {
    const current = [
      {
        model: 'Existing',
        date: '2026-05-25',
        spec: { parameters_b: 30, quantization: '8bit', size_gb: 10 },
        deprecated: false,
        starred: false,
        scores: { MMLU: { accuracy: 40, samples: 30, time_s: 100 } }
      }
    ];
    const detected = [
      {
        model: 'Existing',
        scores: { MMLU: { accuracy: 50, samples: 30, time_s: 120 } }
      },
      {
        model: 'New',
        scores: { MMLU: { accuracy: 60, samples: 30, time_s: 150 } }
      }
    ];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Existing');
    expect(result[0].date).toBe('2026-05-25'); // preserved
    expect(result[0].scores.MMLU.accuracy).toBe(50); // updated
    expect(result[1].model).toBe('New');
    expect(result[1].date).toBe('2026-05-28'); // new entry
  });
});
```

- [ ] **Step 5: Run tests**

```bash
vp test app/lib/import.test.mjs
```

Expected: All tests pass (green checkmarks).

- [ ] **Step 6: Commit**

```bash
git add app/lib/import.test.mjs
git commit -m "test: add comprehensive unit tests for parser and merger"
```

---

## Task 4: Update `app/index.html` to Load `import.mjs` and Refactor `saveImport`

**Files:**
- Modify: `app/index.html`

**Context:** Load the extracted `import.mjs` module as an ES module. Replace the inline `parseImportInput` function with the imported version. Refactor `saveImport` to call the extracted `mergeImport` function instead of inlining the merge logic. Keep the modal orchestration and UI updates in `saveImport`.

**Before/After Pattern:**

Before (lines 1055–1086):
```javascript
function saveImport() {
  if (importDetected.length === 0) return

  const today = new Date().toISOString().slice(0, 10)
  const nextData = currentData.map(e => ({ ...e }))
  const byModel = new Map(nextData.map((e, i) => [e.model, i]))

  let newCount = 0, ovrCount = 0
  for (const d of importDetected) {
    if (d.status === 'overwrite') {
      const idx = byModel.get(d.model)
      nextData[idx] = { ...nextData[idx], scores: d.scores }
      ovrCount++
    } else {
      nextData.push({
        model: d.model,
        date: today,
        spec: { parameters_b: null, quantization: '', size_gb: null },
        deprecated: false,
        starred: false,
        scores: d.scores,
      })
      newCount++
    }
  }

  currentData = nextData
  closeImportModal()
  markDataDirty()
  renderTable(currentData)
  showToast(`Applied: ${newCount} new, ${ovrCount} overwrite. Click Export Data to save.`)
}
```

After:
```javascript
function saveImport() {
  if (importDetected.length === 0) return

  const today = new Date().toISOString().slice(0, 10)
  const detected = importDetected.filter(d => d.status === 'new' ? true : true)
    .map(d => ({ model: d.model, scores: d.scores }))
  
  currentData = mergeImport(currentData, detected, today)
  
  const newCount = importDetected.filter(d => d.status === 'new').length
  const ovrCount = importDetected.filter(d => d.status === 'overwrite').length
  
  closeImportModal()
  markDataDirty()
  renderTable(currentData)
  showToast(`Applied: ${newCount} new, ${ovrCount} overwrite. Click Export Data to save.`)
}
```

- [ ] **Step 1: Add module loading at end of HTML `<body>`**

Before the closing `</body>` tag, add:

```html
<script type="module">
  import { parseImportInput, mergeImport } from './lib/import.mjs';
  window.parseImportInput = parseImportInput;
  window.mergeImport = mergeImport;
</script>
```

This makes both functions globally available to existing onclick handlers.

- [ ] **Step 2: Remove old `parseImportInput` function (lines ~1160–1184)**

Replace the entire function with a comment:

```javascript
// parseImportInput is now loaded from ./lib/import.mjs (see <script type="module"> at end of body)
```

- [ ] **Step 3: Refactor `saveImport` to use `mergeImport`**

Replace the inline merge loop (lines 1055–1086) with:

```javascript
function saveImport() {
  if (importDetected.length === 0) return

  const today = new Date().toISOString().slice(0, 10)
  const detected = importDetected.map(d => ({ model: d.model, scores: d.scores }))
  
  currentData = mergeImport(currentData, detected, today)
  
  const newCount = importDetected.filter(d => d.status === 'new').length
  const ovrCount = importDetected.filter(d => d.status === 'overwrite').length
  
  closeImportModal()
  markDataDirty()
  renderTable(currentData)
  showToast(`Applied: ${newCount} new, ${ovrCount} overwrite. Click Export Data to save.`)
}
```

The UI orchestration (modal close, dirty mark, table re-render, toast) remains in `saveImport`.

- [ ] **Step 4: Verify module loads without errors**

In browser console (after serving with `vp dev`), check:
```javascript
console.log(typeof window.parseImportInput); // should be 'function'
console.log(typeof window.mergeImport); // should be 'function'
```

Expected: Both are `'function'`.

- [ ] **Step 5: Test import flow manually**

1. Start `vp dev`
2. Open http://localhost:8080/app/
3. Click `+ Import` button
4. Paste a fixed-width benchmark table (see Task 3 test example)
5. Verify the modal shows detected models
6. Click "Apply" — verify state updates
7. Click "Export Data" — verify JSON shows new/updated entries
8. Verify no JavaScript errors in browser console

Expected: All steps succeed without errors.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "refactor: load import functions from app/lib/import.mjs and refactor saveImport"
```

---

## Task 5: Create Issue Template `.github/ISSUE_TEMPLATE/auto-data-import.yml`

**Files:**
- Create: `.github/ISSUE_TEMPLATE/auto-data-import.yml`

**Context:** Create the GitHub Issue form that prompts users to select a device and paste benchmark stdout. Device dropdown options are statically enumerated from current `app/settings.json` devices.

- [ ] **Step 1: Read `app/settings.json` to enumerate device keys**

```bash
jq '.devices | keys | .[]' app/settings.json
```

Expected: Output device keys (e.g., `m1-max-64GB-32c`).

- [ ] **Step 2: Create `.github/ISSUE_TEMPLATE/auto-data-import.yml`**

Replace `<DEVICE_LIST>` with actual device keys from step 1. Use the exact visible label text from the YAML field (not the field-id):

```yaml
name: Auto Data Import
description: |
  Paste benchmark stdout to trigger automatic data merge to main.
  
  ⚠️ **Owner Only (Auto-Trigger)**  
  When you (repository owner) create this issue, the workflow automatically runs.
  
  **Contributors**: you can create this issue, but auto-trigger requires owner approval.
  To approve, the owner adds the `approved-import` label to manually trigger the workflow.
  
  Edit the issue body to retry; re-add the label.

body:
  - type: dropdown
    id: device
    attributes:
      label: Device
      description: Target device for benchmark data
      options:
        - m1-max-64GB-32c
    validations:
      required: true
      
  - type: textarea
    id: benchmark_stdout
    attributes:
      label: Benchmark stdout
      description: Paste complete benchmark runner output
      placeholder: |
        Model: Llama-2-7B
        MMLU                 46.2%        14      30     100.0     No
        TRUTHFULQA           42.1%        12      30      80.5     Yes
        Model: Llama-2-13B
        MMLU                 55.8%        17      30     150.0     Yes
        TRUTHFULQA           48.3%        14      30     120.0     Yes
      render: text
    validations:
      required: true
```

**Critical:** The body field headings will be extracted by visible label, not field-id. The workflow script looks for `### Device` and `### Benchmark stdout` (the `label` values from YAML).

- [ ] **Step 3: Commit**

```bash
git add .github/ISSUE_TEMPLATE/auto-data-import.yml
git commit -m "feat: add Issue template for auto-data-import"
```

---

## Task 6: Create CI Script `scripts/apply-import.mjs`

**Files:**
- Create: `scripts/apply-import.mjs`

**Context:** This Node.js script is called by GitHub Actions. It reads issue number and body from environment variables (not argv, to avoid shell injection), extracts device and benchmark_stdout fields, uses the shared parser/merger logic, writes the data file, and creates a git commit and branch.

**Field Extraction:**
GitHub Issue Form renders visible heading `### Device` (from YAML `label`) in the body, NOT the field-id. Extract by matching the label text.

- [ ] **Step 1: Create `scripts/apply-import.mjs`**

```javascript
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { parseImportInput, mergeImport } from '../app/lib/import.mjs';

/**
 * Extract a field from GitHub Issue body by visible label heading.
 * GitHub Issue Form renders:
 * ### Device
 * m1-max-64GB-32c
 * ### Benchmark stdout
 * Model: ...
 * 
 * @param {string} body - Raw Issue body
 * @param {string} label - Visible heading label (e.g., 'Device', 'Benchmark stdout')
 * @returns {string|undefined} Field value (trimmed)
 */
function extractField(body, label) {
  const pattern = new RegExp(`### ${label}\\s*\\n([\\s\\S]*?)(?=###|$)`, 'i');
  const match = body.match(pattern);
  return match ? match[1].trim() : undefined;
}

/**
 * Main function: apply benchmark import
 * @param {number} issueNumber - GitHub Issue number
 * @param {string} issueBody - Raw Issue body
 * @param {string} today - Today's date (YYYY-MM-DD)
 * @returns {{success: boolean, device?: string, entriesApplied?: number, error?: string}}
 */
export async function applyImport(issueNumber, issueBody, today = new Date().toISOString().split('T')[0]) {
  try {
    // Extract fields from Issue body
    const device = extractField(issueBody, 'Device');
    const benchmark_stdout = extractField(issueBody, 'Benchmark stdout');
    
    if (!device || !benchmark_stdout) {
      return { success: false, error: 'Missing Device or Benchmark stdout field in Issue' };
    }
    
    // Verify device exists in settings.json
    const settingsPath = path.resolve('app/settings.json');
    const settingsRaw = await fs.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(settingsRaw);
    
    if (!settings.devices || !settings.devices[device]) {
      return { success: false, error: `Unknown device: '${device}'` };
    }
    
    // Parse benchmark stdout
    const detected = parseImportInput(benchmark_stdout);
    if (detected.length === 0) {
      return { success: false, error: 'No models detected in benchmark output' };
    }
    
    // Read current data file (or empty array)
    const dataPath = path.resolve(`app/data/${device}.json`);
    let currentData = [];
    try {
      const dataRaw = await fs.readFile(dataPath, 'utf8');
      currentData = JSON.parse(dataRaw);
    } catch (e) {
      // File doesn't exist or is invalid; start with empty array
      if (e.code !== 'ENOENT') {
        return { success: false, error: `Error reading data file: ${e.message}` };
      }
    }
    
    // Merge
    const newData = mergeImport(currentData, detected, today);
    
    // Write data file
    await fs.writeFile(dataPath, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    
    // Create branch and commit
    const branchName = `import/issue-${issueNumber}`;
    try {
      execSync(`git config user.name github-actions[bot]`, { stdio: 'inherit' });
      execSync(`git config user.email github-actions[bot]@github.com`, { stdio: 'inherit' });
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      execSync(`git add app/data/${device}.json`, { stdio: 'inherit' });
      execSync(`git commit -m "data: auto-import benchmark results for ${device}"`, { stdio: 'inherit' });
      execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
    } catch (e) {
      return { success: false, error: `Git operation failed: ${e.message}` };
    }
    
    return {
      success: true,
      device,
      entriesApplied: detected.length
    };
  } catch (e) {
    return { success: false, error: `Unexpected error: ${e.message}` };
  }
}

// CLI entry point
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueBody = process.env.ISSUE_BODY;
  
  if (!issueNumber || !issueBody) {
    console.error('Usage: ISSUE_NUMBER=<n> ISSUE_BODY=<body> node apply-import.mjs');
    process.exit(1);
  }
  
  applyImport(issueNumber, issueBody).then(result => {
    if (!result.success) {
      console.error(`[ERROR] ${result.error}`);
      process.exit(1);
    }
    console.log(`[SUCCESS] Imported ${result.entriesApplied} entries for device ${result.device}`);
  }).catch(e => {
    console.error(`[FATAL] ${e.message}`);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Test the script locally (dry run)**

Create a test Issue body file:

```bash
cat > /tmp/test-issue.txt <<'EOF'
### Device
m1-max-64GB-32c

### Benchmark stdout
Model: Llama-2-7B
MMLU                 46.2%        14      30     100.0     No
TRUTHFULQA           42.1%        12      30      80.5     Yes
EOF
```

Then run (without actually committing):

```bash
ISSUE_NUMBER=999 ISSUE_BODY="$(cat /tmp/test-issue.txt)" node scripts/apply-import.mjs
```

Expected: Script outputs either `[SUCCESS]` or `[ERROR]` messages and exits with code 0 or 1 accordingly.

- [ ] **Step 3: Commit**

```bash
git add scripts/apply-import.mjs
git commit -m "feat: add CI script for applying benchmark imports"
```

---

## Task 7: Create Main Workflow `.github/workflows/auto-data-import.yml`

**Files:**
- Create: `.github/workflows/auto-data-import.yml`

**Context:** This workflow orchestrates the entire import process. It listens for Issue creation by the owner or for `approved-import` label addition, runs the CI script via environment variables (not argv), and creates a PR with auto-merge enabled.

- [ ] **Step 1: Create `.github/workflows/auto-data-import.yml`**

```yaml
name: Auto Data Import

on:
  issues:
    types: [opened, labeled]

jobs:
  import:
    runs-on: ubuntu-latest
    
    # Only run if:
    # 1. Issue opened by owner, OR
    # 2. approved-import label added (any Issue)
    if: |
      (github.event.action == 'opened' && github.event.issue.user.login == github.repository_owner) ||
      (github.event.action == 'labeled' && github.event.label.name == 'approved-import')
    
    permissions:
      contents: write
      pull-requests: write
      issues: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Run apply-import script
        id: apply
        env:
          ISSUE_NUMBER: ${{ github.event.issue.number }}
          ISSUE_BODY: ${{ github.event.issue.body }}
        run: node scripts/apply-import.mjs
        continue-on-error: true
      
      - name: Comment on failure
        if: steps.apply.outcome == 'failure'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Import failed. Check the workflow logs for details. Edit the issue and re-add the `approved-import` label to retry.'
            });
      
      - name: Exit on failure
        if: steps.apply.outcome == 'failure'
        run: exit 1
      
      - name: Create pull request
        if: success()
        run: |
          gh pr create \
            --title "data: auto-import benchmark results (issue #${{ github.event.issue.number }})" \
            --body "Automated benchmark import from issue #${{ github.event.issue.number }}" \
            --base main \
            --head "import/issue-${{ github.event.issue.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Enable auto-merge
        run: |
          gh pr merge --auto --squash --delete-branch "import/issue-${{ github.event.issue.number }}"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Key Change:** Pass issue body and number via environment variables, not as bash arguments, to avoid shell injection.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/auto-data-import.yml
git commit -m "ci: add auto-data-import workflow (Issue → PR)"
```

---

## Task 8: Create Validation Workflow `.github/workflows/validate-data.yml`

**Files:**
- Create: `.github/workflows/validate-data.yml`

**Context:** This workflow runs on all PRs that modify `app/data/**`. It runs `vp test` to ensure all data files pass schema validation and merge logic tests.

- [ ] **Step 1: Create `.github/workflows/validate-data.yml`**

```yaml
name: Validate Data

on:
  pull_request:
    paths:
      - 'app/data/**'
      - 'app/lib/**'
      - 'package.json'
      - 'vite.config.ts'

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: vp install
      
      - name: Run tests
        run: vp test
      
      - name: Check data files are valid JSON
        run: |
          find app/data -name '*.json' -exec sh -c 'echo "Validating {}..." && node -e "JSON.parse(require(\"fs\").readFileSync(\"{}\", \"utf8\"))"' \;
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/validate-data.yml
git commit -m "ci: add data validation workflow (required check)"
```

---

## Task 9: Create Post-Merge Notification Workflow `.github/workflows/post-merge-notify.yml`

**Files:**
- Create: `.github/workflows/post-merge-notify.yml`

**Context:** After a PR merges, this workflow comments on the original Issue with a merge confirmation and closes the Issue.

- [ ] **Step 1: Create `.github/workflows/post-merge-notify.yml`**

```yaml
name: Post-Merge Notify

on:
  pull_request:
    types: [closed]

jobs:
  notify:
    runs-on: ubuntu-latest
    
    # Only run if PR merged and branch name matches import/issue-*
    if: |
      github.event.pull_request.merged == true &&
      startsWith(github.event.pull_request.head.ref, 'import/issue-')
    
    permissions:
      issues: write
    
    steps:
      - name: Extract issue number
        id: extract
        run: |
          BRANCH="${{ github.event.pull_request.head.ref }}"
          ISSUE_NUMBER=${BRANCH#import/issue-}
          echo "issue_number=$ISSUE_NUMBER" >> $GITHUB_OUTPUT
      
      - name: Comment on issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: ${{ steps.extract.outputs.issue_number }},
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Merged in #${{ github.event.pull_request.number }}'
            });
      
      - name: Close issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.update({
              issue_number: ${{ steps.extract.outputs.issue_number }},
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'closed'
            });
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/post-merge-notify.yml
git commit -m "ci: add post-merge notification workflow"
```

---

## Task 10: Update Project Configuration Files

**Files:**
- Modify: `Makefile`
- Modify: `CLAUDE.md`
- Modify: `docs/readme/pages/development.md`

- [ ] **Step 1: Update `Makefile` serve target**

Find the line `serve: ...` (or add if missing) and replace with:

```makefile
serve:
	vp dev --port ${PORT}
```

(Keep the `PORT` variable override capability.)

- [ ] **Step 2: Update `CLAUDE.md`**

Find the line containing "Keep `app/index.html` serverless: no external JS, no build step, no bundler." and replace with:

```markdown
- Keep `app/index.html` serverless. Dev server via `vp dev`, tests via `vp test`. 
  **Do not run `vp build`** — the site is serverless by design.
```

- [ ] **Step 3: Update `docs/readme/pages/development.md`**

Find or add a "Dev Server" section with:

```markdown
## Dev Server

Start the development server:

```bash
make serve
# or directly:
vp dev --port 8080
```

Open http://localhost:8080/app/

## Testing

Run unit tests:

```bash
make test
# or directly:
vp test
```

Tests are located in `app/lib/**/*.test.mjs`.
```

- [ ] **Step 4: Verify files**

Quick check:

```bash
grep -q "vp dev" Makefile && echo "Makefile OK"
grep -q "serverless by design" CLAUDE.md && echo "CLAUDE.md OK"
```

- [ ] **Step 5: Commit**

```bash
git add Makefile CLAUDE.md docs/readme/pages/development.md
git commit -m "docs: update dev/test commands for Vite+"
```

---

## Task 11: Add Contributing Section to `README.md`

**Files:**
- Modify: `README.md`

**Context:** Add a `## Contributing` section explaining two paths for contributing benchmark data: (a) GitHub Issue with auto-import, (b) direct PR to `app/data/`. Keep it under 200 words.

- [ ] **Step 1: Open `README.md` and locate insertion point**

Find the section "## Why do I need to make this repository?" (currently appears after the website link) and insert the new section before it.

- [ ] **Step 2: Add Contributing section**

Insert after the website link:

```markdown
## Contributing

There are two ways to contribute benchmark results:

**Option A: GitHub Issue (Owner-friendly auto-merge)**
1. Open a new [Auto Data Import](https://github.com/TonyPythoneer/omlx-intelligence-benchmark/issues/new?template=auto-data-import.yml) Issue
2. Select target device from the dropdown
3. Paste your benchmark runner output
4. If you're the owner, the workflow auto-merges; if you're a contributor, ask the owner to add the `approved-import` label to trigger the workflow
5. Validation runs automatically on the PR; checks must pass before merge

**Option B: Direct PR (Manual fork & edit)**
1. Fork this repository
2. Edit `app/data/<device>.json` directly
3. Open a Pull Request with your changes
4. Validation checks run on your PR

The auto-merge workflow validates all data with unit tests before merging to main.
```

- [ ] **Step 3: Verify placement**

Ensure the new section appears after the website link and before "## Why do I need to make this repository?"

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add Contributing section to README"
```

---

## Task 12: Manual Testing & Integration Verification

**Files:**
- None (testing only)

**Context:** Verify the entire flow works end-to-end before considering the implementation complete.

- [ ] **Step 1: Start dev server**

```bash
make serve
```

Expected: Server running on http://localhost:8080

- [ ] **Step 2: Test import in browser**

1. Open http://localhost:8080/app/
2. Click `+ Import`
3. Paste a fixed-width benchmark table:
   ```
   Model: Test-Model
   Benchmark         Accuracy   Correct   Total   Time(s)   Think
   MMLU                 50.0%        15      30     100.0     No
   TRUTHFULQA           45.0%        13      30      80.0     Yes
   ```
4. Click "Apply"
5. Click "Export Data"
6. Verify JSON shows the new entry with correct score object shape: `{ accuracy, samples, time_s }`

Expected: All UI interactions work; no console errors.

- [ ] **Step 3: Test the CI script locally**

```bash
ISSUE_NUMBER=999 ISSUE_BODY="### Device
m1-max-64GB-32c

### Benchmark stdout
Model: LocalTest
Benchmark         Accuracy   Correct   Total   Time(s)   Think
MMLU                 75.0%        22      30     150.0     No" node scripts/apply-import.mjs
```

Expected: Script succeeds, `app/data/m1-max-64GB-32c.json` is updated with correct score object shape.

- [ ] **Step 4: Run full test suite**

```bash
vp test
```

Expected: All tests pass.

- [ ] **Step 5: Verify all workflows exist**

```bash
ls -la .github/workflows/ | grep -E "(auto-data-import|validate-data|post-merge-notify)"
```

Expected: Three files found.

- [ ] **Step 6: Verify Issue template exists**

```bash
ls -la .github/ISSUE_TEMPLATE/auto-data-import.yml
```

Expected: File exists.

- [ ] **Step 7: No further commits needed**

All implementation steps completed.

---

## Summary of Changes

**File Structure:**

```
Created Files:
  package.json
  vite.config.ts
  app/lib/import.mjs
  app/lib/import.test.mjs
  scripts/apply-import.mjs
  .github/ISSUE_TEMPLATE/auto-data-import.yml
  .github/workflows/auto-data-import.yml
  .github/workflows/validate-data.yml
  .github/workflows/post-merge-notify.yml

Modified Files:
  app/index.html
  Makefile
  CLAUDE.md
  README.md
  docs/readme/pages/development.md
  .gitignore
```

**Total Commits:** 12

1. chore: add Vite+ build config and dev tooling
2. feat: extract parser and merger to app/lib/import.mjs
3. test: add comprehensive unit tests for parser and merger
4. refactor: load import functions from app/lib/import.mjs and refactor saveImport
5. feat: add Issue template for auto-data-import
6. feat: add CI script for applying benchmark imports
7. ci: add auto-data-import workflow (Issue → PR)
8. ci: add data validation workflow (required check)
9. ci: add post-merge notification workflow
10. docs: update dev/test commands for Vite+
11. docs: add Contributing section to README
12. [manual testing — no commit]
