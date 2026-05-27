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
├── index.html                        [MODIFY] Load import.mjs module
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

**Context:** Extract the two parsing functions from `app/index.html` (lines 1160–1184 for `parseImportInput`, lines 1055–1086 for `mergeImport` logic) into a standalone ES module. This module has no DOM dependencies and will be shared by both the browser (via `<script type="module">`) and CI (via Node.js `import()`).

- [ ] **Step 1: Read existing parsing logic from `app/index.html`**

Read lines 1160–1184 and 1055–1086 to understand the current parsing and merge logic.

- [ ] **Step 2: Write `app/lib/import.mjs` with `parseImportInput`**

```javascript
/**
 * Parse benchmark stdout to extract model entries.
 * Scans for lines starting with "Model:" and collects subsequent score lines.
 * @param {string} text - Raw benchmark stdout
 * @returns {Array<{model: string, date?: string, scores: Object}>} Detected entries
 */
export function parseImportInput(text) {
  const entries = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let currentModel = null;
  let currentScores = {};
  
  for (const line of lines) {
    if (line.startsWith('Model:')) {
      // Save previous entry if exists
      if (currentModel) {
        entries.push({ model: currentModel, scores: currentScores });
      }
      // Start new entry
      currentModel = line.replace('Model:', '').trim();
      currentScores = {};
    } else if (currentModel && line.includes(':')) {
      // Parse score line (e.g., "MMLU: 46.2")
      const [benchmarkName, scoreStr] = line.split(':');
      const score = parseFloat(scoreStr.trim());
      if (!isNaN(score)) {
        currentScores[benchmarkName.trim()] = score;
      }
    }
  }
  
  // Save final entry
  if (currentModel) {
    entries.push({ model: currentModel, scores: currentScores });
  }
  
  return entries;
}

/**
 * Merge detected entries into current data array.
 * NEW entries: pushed with template defaults.
 * OVERWRITE entries: only scores updated; spec/abilities/tiers/deprecated preserved.
 * @param {Array} currentData - Existing data entries
 * @param {Array} detected - Newly detected entries from parseImportInput
 * @param {string} today - Today's date (YYYY-MM-DD)
 * @returns {Array} Merged data array
 */
export function mergeImport(currentData, detected, today) {
  const result = [...currentData];
  
  for (const detectedEntry of detected) {
    const existingIndex = result.findIndex(e => e.model === detectedEntry.model);
    
    if (existingIndex === -1) {
      // NEW entry
      result.push({
        model: detectedEntry.model,
        date: today,
        spec: {},
        abilities: {},
        deprecated: false,
        tiers: {},
        scores: detectedEntry.scores
      });
    } else {
      // OVERWRITE: update scores only, preserve other fields
      result[existingIndex].scores = detectedEntry.scores;
    }
  }
  
  return result;
}
```

- [ ] **Step 3: Write a simple unit test to verify exports**

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

- [ ] **Step 4: Commit**

```bash
git add app/lib/import.mjs
git commit -m "feat: extract parser and merger to app/lib/import.mjs"
```

---

## Task 3: Create Comprehensive Unit Tests in `app/lib/import.test.mjs`

**Files:**
- Create: `app/lib/import.test.mjs`

- [ ] **Step 1: Write test suite header and setup**

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

- [ ] **Step 2: Add parser tests — canonical stdout**

```javascript
describe('parseImportInput', () => {
  it('parses single model with multiple benchmarks', () => {
    const input = `Model: Llama-2-7B
MMLU: 46.2
TRUTHFULQA: 42.1`;
    const result = parseImportInput(input);
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('Llama-2-7B');
    expect(result[0].scores.MMLU).toBe(46.2);
    expect(result[0].scores.TRUTHFULQA).toBe(42.1);
  });

  it('parses multiple model blocks', () => {
    const input = `Model: Llama-2-7B
MMLU: 46.2
TRUTHFULQA: 42.1
Model: Llama-2-13B
MMLU: 55.8
TRUTHFULQA: 48.3`;
    const result = parseImportInput(input);
    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Llama-2-7B');
    expect(result[1].model).toBe('Llama-2-13B');
    expect(result[1].scores.MMLU).toBe(55.8);
  });

  it('returns empty array on zero models', () => {
    const input = `Some random text
without any models`;
    const result = parseImportInput(input);
    expect(result).toEqual([]);
  });

  it('handles missing benchmarks gracefully', () => {
    const input = `Model: Test
MMLU: 50`;
    const result = parseImportInput(input);
    expect(result[0].scores).toEqual({ MMLU: 50 });
  });

  it('ignores malformed score lines', () => {
    const input = `Model: Test
MMLU: 50
InvalidLine
Other: 75`;
    const result = parseImportInput(input);
    expect(result[0].scores).toEqual({ MMLU: 50, Other: 75 });
  });

  it('trims whitespace from model names and scores', () => {
    const input = `Model:   Llama-2-7B   
  MMLU  :  46.2  `;
    const result = parseImportInput(input);
    expect(result[0].model).toBe('Llama-2-7B');
    expect(result[0].scores.MMLU).toBe(46.2);
  });
});
```

- [ ] **Step 3: Add parser edge case tests**

```javascript
  it('handles empty input', () => {
    const result = parseImportInput('');
    expect(result).toEqual([]);
  });

  it('handles input with only whitespace', () => {
    const result = parseImportInput('   \n  \n  ');
    expect(result).toEqual([]);
  });

  it('parses non-numeric scores as NaN and skips them', () => {
    const input = `Model: Test
MMLU: not-a-number
OTHER: 75`;
    const result = parseImportInput(input);
    expect(result[0].scores).toEqual({ OTHER: 75 });
    expect(result[0].scores.MMLU).toBeUndefined();
  });
```

- [ ] **Step 4: Add merger tests — NEW entries**

```javascript
describe('mergeImport', () => {
  it('pushes NEW entry with template defaults', () => {
    const current = [];
    const detected = [{ model: 'NewModel', scores: { MMLU: 50 } }];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      model: 'NewModel',
      date: '2026-05-28',
      spec: {},
      abilities: {},
      deprecated: false,
      tiers: {},
      scores: { MMLU: 50 }
    });
  });

  it('handles multiple NEW entries', () => {
    const current = [];
    const detected = [
      { model: 'Model-A', scores: { MMLU: 50 } },
      { model: 'Model-B', scores: { MMLU: 60 } }
    ];
    const result = mergeImport(current, detected, '2026-05-28');
    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Model-A');
    expect(result[1].model).toBe('Model-B');
  });
});
```

- [ ] **Step 5: Add merger tests — OVERWRITE behavior**

```javascript
  it('OVERWRITE: updates scores only, preserves other fields', () => {
    const current = [
      {
        model: 'ExistingModel',
        date: '2026-05-25',
        spec: { parameters_b: 35, quantization: '4bit' },
        abilities: { thinking: true },
        deprecated: false,
        tiers: { opus: true },
        scores: { MMLU: 40 }
      }
    ];
    const detected = [{ model: 'ExistingModel', scores: { MMLU: 55, TRUTHFULQA: 48 } }];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('ExistingModel');
    expect(result[0].date).toBe('2026-05-25'); // preserved
    expect(result[0].spec).toEqual({ parameters_b: 35, quantization: '4bit' }); // preserved
    expect(result[0].abilities).toEqual({ thinking: true }); // preserved
    expect(result[0].deprecated).toBe(false); // preserved
    expect(result[0].tiers).toEqual({ opus: true }); // preserved
    expect(result[0].scores).toEqual({ MMLU: 55, TRUTHFULQA: 48 }); // updated
  });

  it('handles mixed NEW and OVERWRITE in single batch', () => {
    const current = [
      {
        model: 'Existing',
        date: '2026-05-25',
        spec: {},
        abilities: {},
        deprecated: false,
        tiers: {},
        scores: { MMLU: 40 }
      }
    ];
    const detected = [
      { model: 'Existing', scores: { MMLU: 50 } },
      { model: 'New', scores: { MMLU: 60 } }
    ];
    const result = mergeImport(current, detected, '2026-05-28');
    
    expect(result).toHaveLength(2);
    expect(result[0].model).toBe('Existing');
    expect(result[0].scores.MMLU).toBe(50);
    expect(result[1].model).toBe('New');
    expect(result[1].date).toBe('2026-05-28');
  });
});
```

- [ ] **Step 6: Run tests**

```bash
vp test app/lib/import.test.mjs
```

Expected: All tests pass (green checkmarks).

- [ ] **Step 7: Commit**

```bash
git add app/lib/import.test.mjs
git commit -m "test: add comprehensive unit tests for parser and merger"
```

---

## Task 4: Update `app/index.html` to Load `import.mjs`

**Files:**
- Modify: `app/index.html`

**Context:** Modify `index.html` to load `app/lib/import.mjs` as an ES module and assign the exported functions to global variables so existing inline onclick handlers continue to work without refactoring.

- [ ] **Step 1: Read the existing import button handler**

Locate the button or code that currently uses `parseImportInput` and `saveImport` in `app/index.html`. Note the line numbers.

- [ ] **Step 2: Add module loading at end of HTML `<body>`**

Before the closing `</body>` tag, add:

```html
<script type="module">
  import { parseImportInput, mergeImport } from './lib/import.mjs';
  window.parseImportInput = parseImportInput;
  window.mergeImport = mergeImport;
</script>
```

This makes both functions globally available to existing onclick handlers.

- [ ] **Step 3: Verify no duplicate function definitions**

Search `app/index.html` for existing `function parseImportInput` and `function saveImport`. These should remain in the HTML (old code), but when called, the global versions will shadow them (module versions take precedence because they're assigned after page load). Alternatively, delete the old function bodies and keep only the global assignment. Choose: keep old defs for safety, or delete.

**Decision:** Keep old function definitions commented out or deleted. Remove the old `parseImportInput` function body (lines ~1160–1184) and `mergeImport`-related code from `saveImport` (lines ~1055–1086). Replace with comment: `// parseImportInput and mergeImport now loaded from ./lib/import.mjs`.

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
4. Paste the canonical stdout from the test
5. Verify the modal shows detected models
6. Click "Apply" — verify state updates
7. Verify no JavaScript errors in browser console

Expected: All steps succeed without errors.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "refactor: load import functions from app/lib/import.mjs module"
```

---

## Task 5: Create Issue Template `.github/ISSUE_TEMPLATE/auto-data-import.yml`

**Files:**
- Create: `.github/ISSUE_TEMPLATE/auto-data-import.yml`

**Context:** Create the GitHub Issue form that prompts users to select a device and paste benchmark stdout. Device dropdown options are statically enumerated from current `app/settings.json` devices.

- [ ] **Step 1: Read `app/settings.json` to enumerate device keys**

```bash
cat app/settings.json | jq '.devices | keys'
```

Expected: Output is JSON array of device keys (e.g., `["m1-max-64GB-32c"]`).

- [ ] **Step 2: Create `.github/ISSUE_TEMPLATE/auto-data-import.yml`**

Replace `<DEVICE_LIST>` with the actual device keys from step 1:

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
        MMLU: 46.2
        TRUTHFULQA: 42.1
        Model: Llama-2-13B
        MMLU: 55.8
        TRUTHFULQA: 48.3
      render: text
    validations:
      required: true
```

- [ ] **Step 3: Verify YAML syntax**

```bash
python3 -m yaml < .github/ISSUE_TEMPLATE/auto-data-import.yml > /dev/null && echo "Valid"
```

Expected: Output `Valid` (no YAML parse errors).

- [ ] **Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE/auto-data-import.yml
git commit -m "feat: add Issue template for auto-data-import"
```

---

## Task 6: Create CI Script `scripts/apply-import.mjs`

**Files:**
- Create: `scripts/apply-import.mjs`

**Context:** This Node.js script is called by GitHub Actions. It reads the Issue body, parses YAML to extract device and benchmark_stdout fields, uses the shared parser/merger logic, writes the data file, and creates a git commit and branch.

- [ ] **Step 1: Create `scripts/apply-import.mjs`**

```javascript
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { parseImportInput, mergeImport } from '../app/lib/import.mjs';

/**
 * Parse YAML-like GitHub Issue body.
 * Extracts device and benchmark_stdout from the form.
 * @param {string} issueBody - Raw Issue body
 * @returns {{device?: string, benchmark_stdout?: string}}
 */
function parseIssueBody(issueBody) {
  const device = extractField(issueBody, 'device');
  const benchmark_stdout = extractField(issueBody, 'benchmark_stdout');
  return { device, benchmark_stdout };
}

function extractField(body, fieldId) {
  // GitHub Issue form generates YAML-like output:
  // ### device
  // m1-max-64GB-32c
  // ### benchmark_stdout
  // Model: ...
  const pattern = new RegExp(`### ${fieldId}\\s*\\n([\\s\\S]*?)(?=###|$)`);
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
    // Parse Issue body
    const { device, benchmark_stdout } = parseIssueBody(issueBody);
    
    if (!device || !benchmark_stdout) {
      return { success: false, error: 'Missing device or benchmark_stdout field in Issue' };
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
  const issueNumber = process.argv[2];
  const issueBody = process.argv[3];
  
  if (!issueNumber || !issueBody) {
    console.error('Usage: node apply-import.mjs <issueNumber> <issueBody>');
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
### device
m1-max-64GB-32c

### benchmark_stdout
Model: Llama-2-7B
MMLU: 46.2
TRUTHFULQA: 42.1
EOF
```

Then run (without actually committing):

```bash
node scripts/apply-import.mjs 999 "$(cat /tmp/test-issue.txt)"
```

Expected: Script outputs either `[SUCCESS]` or `[ERROR]` messages and exits with code 0 or 1 accordingly.

- [ ] **Step 3: Verify output on success**

If the test succeeds, check that `app/data/m1-max-64GB-32c.json` contains the new entry (or has been created if it didn't exist).

- [ ] **Step 4: Commit**

```bash
git add scripts/apply-import.mjs
git commit -m "feat: add CI script for applying benchmark imports"
```

---

## Task 7: Create Main Workflow `.github/workflows/auto-data-import.yml`

**Files:**
- Create: `.github/workflows/auto-data-import.yml`

**Context:** This workflow orchestrates the entire import process. It listens for Issue creation by the owner or for `approved-import` label addition, runs the CI script, and creates a PR with auto-merge enabled.

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
        run: |
          node scripts/apply-import.mjs "${{ github.event.issue.number }}" "${{ github.event.issue.body }}"
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

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -m yaml < .github/workflows/auto-data-import.yml > /dev/null && echo "Valid"
```

Expected: Output `Valid`.

- [ ] **Step 3: Commit**

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
        run: npm install
      
      - name: Run tests
        run: npm run test
      
      - name: Check data files
        run: |
          # Optional: additional validation beyond unit tests
          find app/data -name '*.json' -exec sh -c 'echo "Validating {}..." && node -e "JSON.parse(require(\"fs\").readFileSync(\"{}\", \"utf8\"))"' \;
```

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -m yaml < .github/workflows/validate-data.yml > /dev/null && echo "Valid"
```

Expected: Output `Valid`.

- [ ] **Step 3: Commit**

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

- [ ] **Step 2: Verify YAML syntax**

```bash
python3 -m yaml < .github/workflows/post-merge-notify.yml > /dev/null && echo "Valid"
```

Expected: Output `Valid`.

- [ ] **Step 3: Commit**

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

Find the line containing "Keep `app/index.html` serverless: no external JS, no build step, no bundler." and replace the full sentence with:

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

## Task 11: Manual Testing & Integration Verification

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
3. Paste:
   ```
   Model: Test-Model
   MMLU: 50
   TRUTHFULQA: 45
   ```
4. Click "Apply"
5. Click "Export Data"
6. Verify JSON shows the new entry

Expected: All UI interactions work; no console errors.

- [ ] **Step 3: Test the CI script locally**

```bash
node scripts/apply-import.mjs 999 "### device
m1-max-64GB-32c

### benchmark_stdout
Model: LocalTest
MMLU: 75"
```

Expected: Script succeeds, `app/data/m1-max-64GB-32c.json` is updated.

- [ ] **Step 4: Run full test suite**

```bash
vp test
```

Expected: All tests pass.

- [ ] **Step 5: Verify all workflows exist**

```bash
ls -la .github/workflows/
```

Expected: Three files: `auto-data-import.yml`, `validate-data.yml`, `post-merge-notify.yml`

- [ ] **Step 6: Verify Issue template exists**

```bash
ls -la .github/ISSUE_TEMPLATE/auto-data-import.yml
```

Expected: File exists.

- [ ] **Step 7: No further commits needed**

All implementation steps completed.

---

## Summary of Changes

**Created Files:**
- `package.json` (dev config)
- `vite.config.ts` (Vite config)
- `app/lib/import.mjs` (parser + merger)
- `app/lib/import.test.mjs` (tests)
- `scripts/apply-import.mjs` (CI entry point)
- `.github/ISSUE_TEMPLATE/auto-data-import.yml` (Issue form)
- `.github/workflows/auto-data-import.yml` (main workflow)
- `.github/workflows/validate-data.yml` (validation workflow)
- `.github/workflows/post-merge-notify.yml` (notification workflow)

**Modified Files:**
- `app/index.html` (load import.mjs)
- `Makefile` (serve → vp dev)
- `CLAUDE.md` (serverless note)
- `docs/readme/pages/development.md` (dev commands)
- `.gitignore` (add node_modules/)

**Total commits:** 11 (one per task)

