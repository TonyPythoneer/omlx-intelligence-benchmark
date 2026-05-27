# UI Data Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `add_data.py` workflow with in-browser data import/edit, and add advanced filters (search, params range, tier/metrics segmented buttons) plus per-row model actions (copy / HuggingFace).

**Architecture:** All changes confined to `app/index.html` (vanilla JS, single file, no build step) and `app/settings.json` (new `parametersBreakpoints` field). File writes use the File System Access API with a Safari fallback to plain download. Hostname check (`localhost` / `127.0.0.1`) gates Import/Settings UI on deploy.

**Tech Stack:** Vanilla JS (no dependencies), HTML, CSS. File System Access API for native Save As. No test framework — manual browser verification per task (the spec deletes the Python test suite).

**Spec reference:** `docs/superpowers/specs/2026-05-26-ui-data-management-design.md`

**Verification approach:** This is a single-page static site with no test runner. Each task ends with manual browser verification at `http://localhost:8080` (`make serve`). For parser logic (Task 7), a quick console-based smoke check is included.

---

### Task 1: Cleanup Python tooling and CI

**Files:**
- Delete: `add_data.py`
- Delete: `tests/test_add_result.py`
- Delete: `tests/` (entire directory if empty after the above)
- Delete: `.github/workflows/ci.yml`
- Modify: `Makefile`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Inspect Makefile and CLAUDE.md to know what to remove**

Run: `cat Makefile && echo '---' && cat CLAUDE.md`

Note the `setup` / `test` targets in Makefile, the "Tests" section in CLAUDE.md, and the `add_data.py` usage block.

- [ ] **Step 2: Delete the Python files and CI**

```bash
rm add_data.py
rm -rf tests/
rm .github/workflows/ci.yml
# remove .github/workflows/ entirely if empty
rmdir .github/workflows 2>/dev/null || true
rmdir .github 2>/dev/null || true
```

- [ ] **Step 3: Edit Makefile — remove `setup` and `test` targets, keep `serve`**

The remaining Makefile should contain only the `serve` target (`python -m http.server 8080` or equivalent). Remove every line referencing pytest, venv, requirements, or test.

- [ ] **Step 4: Edit CLAUDE.md**

Remove these from the current CLAUDE.md:
- The `tests/test_add_result.py` line in the architecture diagram
- The `.github/workflows/ci.yml` line in the architecture diagram
- The `app/data/device.js.template` line if obsolete (kept; the file still exists)
- The entire `add_data.py` paragraph in "Key code"
- The `make setup && make test` / `add_data.py` usage blocks in "Usage"
- The bullet "`add_data.py` skips duplicate models silently (dedup guard)" in "Rules"

Add to "Architecture":
- Note that `app/settings.json` now contains `parametersBreakpoints`
- Note that Import / Labeling / Settings UIs all write back via the File System Access API

- [ ] **Step 5: Verify nothing references removed files**

Run: `grep -rn "add_data\|test_add_result\|workflows/ci" . --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null || echo "clean"`
Expected: `clean` (or only matches inside `docs/superpowers/` historical files — those are fine).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove add_data.py, tests, and CI in favour of in-browser data management"
```

---

### Task 2: Add `parametersBreakpoints` to settings.json

**Files:**
- Modify: `app/settings.json`

- [ ] **Step 1: Read current settings.json to know the structure**

Run: `cat app/settings.json`

- [ ] **Step 2: Add `parametersBreakpoints` field**

Insert into the top-level object (after `defaultDevice`):

```json
"parametersBreakpoints": [0, 12, 24, 60],
```

Final shape:

```json
{
  "defaultDevice": "...",
  "parametersBreakpoints": [0, 12, 24, 60],
  "devices": { ... }
}
```

- [ ] **Step 3: Verify JSON is valid**

Run: `python3 -c "import json; print(json.load(open('app/settings.json'))['parametersBreakpoints'])"`
Expected: `[0, 12, 24, 60]`

- [ ] **Step 4: Browser smoke check**

Run: `make serve` in one terminal. Open `http://localhost:8080/app/`. Verify the page still loads with no console errors. (Field is unused at this point — just confirming we didn't break JSON parsing.)

- [ ] **Step 5: Commit**

```bash
git add app/settings.json
git commit -m "feat: add parametersBreakpoints to settings.json"
```

---

### Task 3: Hostname guard helper

**Files:**
- Modify: `app/index.html`

This task adds a single helper used by future tasks (Import button, Settings button).

- [ ] **Step 1: Add `isLocalEnv()` helper near the top of the `<script>` block**

Locate the `// ── Config ──` section in `app/index.html` (around line 562). Immediately above it, add:

```js
// ── Environment ──────────────────────────────────────────────────────────
function isLocalEnv() {
  const h = window.location.hostname
  return h === 'localhost' || h === '127.0.0.1' || h === ''
}
```

(`h === ''` covers `file://` opens.)

- [ ] **Step 2: Browser smoke check**

Reload `http://localhost:8080/app/`. Open DevTools console. Run: `isLocalEnv()`. Expected: `true`.

- [ ] **Step 3: Commit**

```bash
git add app/index.html
git commit -m "feat: add isLocalEnv() helper"
```

---

### Task 4: Default sort by date DESC + remove Model column sorting

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Initialise sort state to date DESC**

Locate the sort state declarations (around line 655):

```js
let sortCol = null
let sortDir = 1   // 1 = ascending, -1 = descending
```

Replace with:

```js
let sortCol = 'date'
let sortDir = -1   // 1 = ascending, -1 = descending
```

- [ ] **Step 2: Teach `getSortValue` about `date`**

Locate `function getSortValue(entry, col)` (around line 683). Add this as the first branch (right after the function opens):

```js
if (col === 'date') return new Date(entry.date).getTime()
```

- [ ] **Step 3: Stop the Model header from being clickable**

Locate `buildHeaders()`'s leaf row block (around line 803):

```js
addLeaf('Model', 'model', false)
```

Replace the entire `addLeaf` helper invocation for Model with a non-sortable header. Add a helper above the existing `addLeaf`:

```js
const addLeafNoSort = (label, isStart) => {
  const th = document.createElement('th')
  th.textContent = label
  if (isStart) th.classList.add('group-start')
  th.style.cursor = 'default'
  leafRow.appendChild(th)
}
```

Then replace `addLeaf('Model', 'model', false)` with `addLeafNoSort('Model', false)`.

(Apply the same change inside the `if (labelingMode)` branch and the `else` branch — both call `addLeaf('Model', ...)` via the shared line at the top of the leaf row build.)

- [ ] **Step 4: Override the leaf-row hover style for Model**

In the `<style>` block, locate `thead tr.leaf-row th:hover` (around line 223). Add right after:

```css
thead tr.leaf-row th.no-sort,
thead tr.leaf-row th.no-sort:hover {
  cursor: default;
  background: #fff;
  color: #475569;
}
```

Update `addLeafNoSort` to set `th.classList.add('no-sort')`.

- [ ] **Step 5: Browser verification**

Reload page. Verify:
- Table is sorted newest → oldest by date (top row is the most recent `date` field)
- Clicking Model header does nothing visually and no sort arrow appears
- Clicking other headers (Params, MMLU, etc.) still sorts

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: default sort by date desc, remove Model column sorting"
```

---

### Task 5: Search box (substring filter)

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add search input to header**

Locate the `<header>` block (around line 512). Add a new control row below the existing `.header-controls` div. Restructure as follows — replace the entire `<header>` with:

```html
<header>
  <h1>oMLX Intelligence Benchmark</h1>
  <div class="header-controls">
    <input id="model-search" type="search" placeholder="🔍 Search model..." />
    <button id="export-data" class="btn btn-primary" style="display: none;" onclick="openModal()">Export Data</button>
    <button id="toggle-labeling" class="btn btn-secondary" onclick="toggleLabeling()">✏ Label</button>
    <select id="tier-filter" class="btn btn-secondary" onclick="void(0)">
      <option value="all">All Tiers</option>
      <option value="opus">Opus</option>
      <option value="sonnet">Sonnet</option>
      <option value="haiku">Haiku</option>
    </select>
    <label class="checkbox-label">
      <input type="checkbox" id="show-all-cb" onchange="toggleShowAll()">
      Show Deprecated
    </label>
    <select id="device-select"></select>
  </div>
</header>
```

(Tier filter stays as `<select>` for now — Task 8 converts it.)

- [ ] **Step 2: Add search input CSS**

In `<style>`, add after the `#tier-filter` rules:

```css
#model-search {
  font-family: inherit;
  font-size: 0.875rem;
  padding: 8px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #334155;
  width: 240px;
  outline: none;
  transition: all 0.2s ease;
}
#model-search:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}
```

- [ ] **Step 3: Add search state and filter**

Locate the deprecated filter section (around line 615). Add right after:

```js
// ── Search filter ────────────────────────────────────────────────────────
let searchQuery = ''

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('model-search')
  input.addEventListener('input', () => {
    searchQuery = input.value.trim().toLowerCase()
    renderTable(currentData)
  })
})
```

- [ ] **Step 4: Wire into `renderTable`**

Locate `renderTable(data)` (around line 942). Replace its filter chain with:

```js
function renderTable(data) {
  let filtered = showAll ? data : data.filter(e => !e.deprecated)
  if (tierFilterIdx >= 0) {
    filtered = filtered.filter(getTierFilterMatch)
  }
  if (searchQuery) {
    filtered = filtered.filter(e => e.model.toLowerCase().includes(searchQuery))
  }
  const sorted = sortData(filtered)
  updateSortIndicators()
  const tbody = document.querySelector('#benchmark-table tbody')
  tbody.innerHTML = ''
  sorted.forEach(entry => tbody.appendChild(buildRow(entry)))
}
```

- [ ] **Step 5: Browser verification**

Reload. Type substrings into the search box: `"Qwen"`, `"35B"`, `"opus"`. Each should narrow the table immediately. Clear → table restores.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: add substring search for model names"
```

---

### Task 6: Metrics filter (All / Basic / Advanced)

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add Metrics segmented control to header**

We'll standardise on segmented buttons later (Task 8 handles Tier). For now, add Metrics as segmented buttons since we don't have an existing control for it.

In the `<style>` block, add after `.btn-primary` rules:

```css
.segmented {
  display: inline-flex;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.segmented button {
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 7px 14px;
  border: none;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  outline: none;
  border-right: 1px solid #e2e8f0;
}
.segmented button:last-child { border-right: none; }
.segmented button:hover { background: #f8fafc; color: #0f172a; }
.segmented button.active {
  background: #2563eb;
  color: #fff;
}
.segmented-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-right: 8px;
  align-self: center;
}
.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  flex-wrap: wrap;
}
header {
  flex-wrap: wrap;
}
```

- [ ] **Step 2: Add Metrics segmented control HTML**

Locate `</header>` (the closing tag of the existing header). Right before it, insert:

```html
<div class="filter-row">
  <div>
    <span class="segmented-label">Metrics</span>
    <div class="segmented" id="metrics-filter">
      <button data-val="all" class="active">All</button>
      <button data-val="basic">Basic</button>
      <button data-val="advanced">Advanced</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add Metrics state and derived `visibleBenchmarks`**

Locate the `CATEGORIES` constant (around line 564). Add immediately after `ALL_BENCHMARKS`:

```js
const BASIC_CATEGORIES    = ["Knowledge", "Commonsense & Reasoning"]
const ADVANCED_CATEGORIES = ["Coding"]

let metricsFilter = 'all'   // 'all' | 'basic' | 'advanced'

function getVisibleCategories() {
  if (metricsFilter === 'basic')    return BASIC_CATEGORIES
  if (metricsFilter === 'advanced') return ADVANCED_CATEGORIES
  return Object.keys(CATEGORIES)
}

function getVisibleBenchmarks() {
  return getVisibleCategories().flatMap(c => CATEGORIES[c])
}
```

- [ ] **Step 4: Replace `ALL_BENCHMARKS` references in render with `getVisibleBenchmarks()`**

Search the `<script>` for every `ALL_BENCHMARKS.forEach`. There are two — one in `buildHeaders` (sub-group row), one in `buildHeaders` (leaf row), and one in `buildRow`. Replace each with `getVisibleBenchmarks().forEach`.

Also in `buildHeaders` locate:

```js
const scoreCols = ALL_BENCHMARKS.length * 2
```

Change to:

```js
const scoreCols = getVisibleBenchmarks().length * 2
```

Leave the original `ALL_BENCHMARKS` constant declaration in place — it's still used as the source of truth for the parser.

Also update `GROUP_START_BENCHMARKS` to be derived (since metrics filter can hide a category entirely, the first benchmark of the remaining categories should be the new group start). Replace its declaration with:

```js
function getGroupStartBenchmarks() {
  return new Set(getVisibleCategories().map(c => CATEGORIES[c][0]))
}
```

Update all references to `GROUP_START_BENCHMARKS.has(bench)` to `getGroupStartBenchmarks().has(bench)`.

- [ ] **Step 5: Wire the segmented control**

In the `DOMContentLoaded` block, add:

```js
document.querySelectorAll('#metrics-filter button').forEach(btn => {
  btn.addEventListener('click', () => {
    metricsFilter = btn.dataset.val
    document.querySelectorAll('#metrics-filter button').forEach(b => b.classList.toggle('active', b === btn))
    buildHeaders()
    renderTable(currentData)
  })
})
```

- [ ] **Step 6: Update header builder for Score group label**

In `buildHeaders`, the addGroup for Score uses `'Score'` literal. Keep it, but when filtered, the colspan should match `getVisibleBenchmarks().length * 2`. Already handled by the `scoreCols` change in Step 4.

- [ ] **Step 7: Browser verification**

Reload. Click `Basic` → only MMLU + TRUTHFULQA columns show. Click `Advanced` → only HUMANEVAL/MBPP/LIVECODEBENCH columns show. Click `All` → all columns. Confirm group-start borders look correct in each state.

- [ ] **Step 8: Commit**

```bash
git add app/index.html
git commit -m "feat: add Metrics filter (All/Basic/Advanced)"
```

---

### Task 7: Import Modal — UI scaffold + parser

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add Import button to header**

In the `header-controls` div, before the `[✏ Label]` button, insert:

```html
<button id="import-data" class="btn btn-secondary" onclick="openImportModal()">+ Import</button>
```

- [ ] **Step 2: Hide Import button when not local**

In the `boot()` function (around line 991), add at the start:

```js
if (!isLocalEnv()) {
  document.getElementById('import-data').style.display = 'none'
}
```

- [ ] **Step 3: Add Import Modal HTML**

Locate the existing Export Modal (`<div id="export-modal" class="modal-overlay">`, around line 540). Right after its closing `</div>` (the `.modal-overlay` div), insert:

```html
<!-- Import Modal -->
<div id="import-modal" class="modal-overlay">
  <div class="modal-container" style="max-width: 820px;">
    <div class="modal-header">
      <h3 class="modal-title">Import Benchmark Data</h3>
      <button class="modal-close" onclick="closeImportModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p class="modal-desc">Paste benchmark runner stdout below. Multiple models supported.</p>
      <textarea id="import-input" placeholder="Model: ExampleModel-name&#10;MMLU 83.3% 30 30 835.1 yes&#10;..." style="width:100%; height:160px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; resize: vertical;"></textarea>

      <div id="import-detected" style="margin-top: 16px;"></div>

      <div id="import-spec-section" style="margin-top: 16px;">
        <div class="segmented-label" style="margin-bottom: 8px;">Spec for new entries</div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end;">
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: #64748b;">
            Params (B)
            <input id="import-params" type="number" min="1" step="1" placeholder="35" style="padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; width: 100px;">
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: #64748b;">
            Quant
            <input id="import-quant" type="text" placeholder="4bit" style="padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; width: 100px;">
          </label>
          <label style="display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: #64748b;">
            Size (GB)
            <input id="import-size" type="number" min="0.01" step="0.01" placeholder="19.50" style="padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; width: 100px;">
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #475569;">
            <span>MTP</span>
            <label class="switch">
              <input id="import-mtp" type="checkbox">
              <span class="slider"></span>
            </label>
          </label>
        </div>
        <div id="import-spec-error" style="margin-top: 8px; color: #dc2626; font-size: 0.8rem;"></div>
      </div>
    </div>
    <div class="modal-footer">
      <span id="import-target" style="font-size: 0.75rem; color: #64748b; align-self: center; margin-right: auto;"></span>
      <button class="btn btn-secondary" onclick="closeImportModal()">Cancel</button>
      <button id="import-save-btn" class="btn btn-primary" onclick="saveImport()" disabled>Save</button>
    </div>
  </div>
</div>
```

Plus a small CSS addition for invalid input styling (in the `<style>` block):

```css
.import-error  { border-color: #dc2626 !important; }
.import-badge-new      { color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 3px; font-size: 0.7rem; font-weight: 700; }
.import-badge-overwrite { color: #d97706; background: #fffbeb; border: 1px solid #fde68a; padding: 1px 6px; border-radius: 3px; font-size: 0.7rem; font-weight: 700; }
.import-detected-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; font-size: 0.8rem;
  border-bottom: 1px solid #f1f5f9;
}
.import-detected-row:last-child { border-bottom: none; }
.import-detected-name { font-family: 'JetBrains Mono', monospace; color: #0f172a; flex: 1; }
.import-detected-meta { color: #64748b; font-size: 0.75rem; }
```

- [ ] **Step 4: Add parser function**

In the `<script>` block, after the `// ── Helpers` section but before `function buildHeaders()`, add:

```js
// ── Import parser ────────────────────────────────────────────────────────
function parseImportInput(text) {
  const results = []
  const blocks = text.split(/(?=^Model:)/m)
  const scoreRe = /^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)/gm
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed.startsWith('Model:')) continue
    const modelName = trimmed.split('\n')[0].replace(/^Model:/, '').trim()
    const scores = {}
    let thinking = false
    scoreRe.lastIndex = 0
    let m
    while ((m = scoreRe.exec(block)) !== null) {
      const [, bench, accuracy, samples, time_s, think] = m
      scores[bench] = {
        accuracy: parseFloat(accuracy),
        samples: parseInt(samples, 10),
        time_s: parseFloat(time_s),
      }
      if (think.toLowerCase() === 'yes') thinking = true
    }
    if (Object.keys(scores).length > 0) {
      results.push({ model: modelName, thinking, scores })
    }
  }
  return results
}
```

- [ ] **Step 5: Smoke-check the parser in browser console**

Reload page. Open DevTools console. Run:

```js
parseImportInput(`Model: TestModel-A
MMLU 83.3% 30 30 835.1 yes
TRUTHFULQA 90.0% 30 30 406.5 yes

Model: TestModel-B
HUMANEVAL 50.0% 30 30 100.0 no`)
```

Expected output: an array of 2 objects. First has `model: "TestModel-A"`, `thinking: true`, `scores.MMLU.accuracy === 83.3`. Second has `thinking: false`, `scores.HUMANEVAL.accuracy === 50`.

- [ ] **Step 6: Add modal open/close stubs**

In `<script>`, after `closeModal()`:

```js
// ── Import modal ─────────────────────────────────────────────────────────
function openImportModal() {
  const device = document.getElementById('device-select').value
  document.getElementById('import-target').textContent = `Target: app/data/${device}.json`
  document.getElementById('import-input').value = ''
  document.getElementById('import-detected').innerHTML = ''
  document.getElementById('import-spec-error').textContent = ''
  document.getElementById('import-save-btn').disabled = true
  document.getElementById('import-modal').classList.add('show')
}

function closeImportModal() {
  document.getElementById('import-modal').classList.remove('show')
}

function saveImport() {
  // Filled in by Task 9
}
```

- [ ] **Step 7: Browser verification**

Reload. Click `+ Import`. Modal opens with empty textarea, "Target: app/data/<device>.json" visible. Cancel closes it. Modal styling matches Export Modal.

- [ ] **Step 8: Commit**

```bash
git add app/index.html
git commit -m "feat: scaffold Import modal and parser"
```

---

### Task 8: Import Modal — detected list + spec validation

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add state for detected entries**

After the parser function, add:

```js
let importDetected = []   // [{model, thinking, scores, status: 'new' | 'overwrite'}]

function renderImportDetected() {
  const container = document.getElementById('import-detected')
  if (importDetected.length === 0) {
    container.innerHTML = ''
    return
  }
  const newCount = importDetected.filter(d => d.status === 'new').length
  const ovrCount = importDetected.filter(d => d.status === 'overwrite').length
  const header = `<div class="segmented-label">Detected (${importDetected.length}) — ${newCount} new, ${ovrCount} overwrite</div>`
  const rows = importDetected.map(d => {
    const badge = d.status === 'new'
      ? '<span class="import-badge-new">NEW</span>'
      : '<span class="import-badge-overwrite">OVERWRITE</span>'
    return `<div class="import-detected-row">
      ${badge}
      <span class="import-detected-name">${escapeHtml(d.model)}</span>
      <span class="import-detected-meta">thinking: ${d.thinking ? 'yes' : 'no'} · ${Object.keys(d.scores).length} scores</span>
    </div>`
  }).join('')
  container.innerHTML = header + rows

  // Show/hide spec section: only relevant when there is at least one NEW entry
  document.getElementById('import-spec-section').style.display = newCount > 0 ? 'block' : 'none'
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])
}
```

- [ ] **Step 2: Wire textarea parsing on input**

Inside `openImportModal()`, add at the end:

```js
const input = document.getElementById('import-input')
input.oninput = () => {
  const parsed = parseImportInput(input.value)
  const existingNames = new Set(currentData.map(e => e.model))
  importDetected = parsed.map(p => ({
    ...p,
    status: existingNames.has(p.model) ? 'overwrite' : 'new',
  }))
  renderImportDetected()
  validateImportSpec()
}
```

- [ ] **Step 3: Add spec validation**

After `renderImportDetected`, add:

```js
function validateImportSpec() {
  const newCount = importDetected.filter(d => d.status === 'new').length
  const errBox = document.getElementById('import-spec-error')
  const saveBtn = document.getElementById('import-save-btn')

  if (importDetected.length === 0) {
    errBox.textContent = ''
    saveBtn.disabled = true
    return
  }

  // No new entries — spec irrelevant
  if (newCount === 0) {
    errBox.textContent = ''
    saveBtn.disabled = false
    return
  }

  const params  = document.getElementById('import-params')
  const quant   = document.getElementById('import-quant')
  const size    = document.getElementById('import-size')
  const errors = []

  ;[params, quant, size].forEach(el => el.classList.remove('import-error'))

  const pVal = parseFloat(params.value)
  if (!params.value || !Number.isInteger(pVal) || pVal <= 0) {
    errors.push('Params: positive integer required')
    params.classList.add('import-error')
  }
  if (!quant.value.trim()) {
    errors.push('Quant: required')
    quant.classList.add('import-error')
  }
  const sVal = parseFloat(size.value)
  if (!size.value || isNaN(sVal) || sVal <= 0) {
    errors.push('Size: positive number required')
    size.classList.add('import-error')
  }

  errBox.textContent = errors.join(' · ')
  saveBtn.disabled = errors.length > 0
}
```

- [ ] **Step 4: Re-validate on spec input changes**

In `openImportModal()`, add at the end:

```js
['import-params', 'import-quant', 'import-size', 'import-mtp'].forEach(id => {
  document.getElementById(id).oninput = validateImportSpec
  document.getElementById(id).onchange = validateImportSpec
})
```

- [ ] **Step 5: Browser verification**

Reload. Open Import modal. Paste:

```
Model: BrandNewModel-X
MMLU 83.3% 30 30 835.1 yes

Model: Qwen3.6-35B-A3B-TurboQuant-MLX-4bit
MMLU 50.0% 30 30 100.0 yes
```

(The second is an existing model in the default device file.)

Verify:
- 2 rows appear; first labeled `NEW`, second labeled `OVERWRITE`
- Spec section visible (because 1 NEW)
- Save button disabled until all 3 spec fields are valid
- Invalid Params (e.g. `-5` or empty) gives red border + error text

Then clear textarea and paste only the second model alone (only overwrite case). Verify spec section hides and Save becomes enabled.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: Import modal detection list and spec validation"
```

---

### Task 9: Import Modal — Save (apply + write file)

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Implement `saveImport`**

Replace the placeholder `saveImport()` from Task 7 with:

```js
async function saveImport() {
  if (importDetected.length === 0) return

  const today = new Date().toISOString().slice(0, 10)
  const params_b = parseInt(document.getElementById('import-params').value, 10)
  const quant    = document.getElementById('import-quant').value.trim()
  const size_gb  = Math.round(parseFloat(document.getElementById('import-size').value) * 100) / 100
  const mtp      = document.getElementById('import-mtp').checked

  const byModel = new Map(currentData.map(e => [e.model, e]))

  for (const d of importDetected) {
    if (d.status === 'overwrite') {
      const existing = byModel.get(d.model)
      existing.scores = d.scores
    } else {
      currentData.push({
        model: d.model,
        date: today,
        spec: { parameters_b: params_b, quantization: quant, size_gb },
        abilities: { thinking: d.thinking, mtp },
        deprecated: false,
        tiers: { opus: false, sonnet: false, haiku: false },
        scores: d.scores,
      })
    }
  }

  const device = document.getElementById('device-select').value
  try {
    await saveDataFile(`${device}.json`, currentData)
    showToast('Saved successfully!')
    closeImportModal()
    renderTable(currentData)
  } catch (err) {
    if (err.name === 'AbortError') return   // user cancelled save dialog
    console.error(err)
    showToast('Save failed: ' + err.message)
  }
}
```

- [ ] **Step 2: Add `saveDataFile` helper**

After `saveImport`, add:

```js
async function saveDataFile(suggestedName, data) {
  const text = JSON.stringify(data, null, 2) + '\n'
  if ('showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    })
    const writable = await handle.createWritable()
    await writable.write(text)
    await writable.close()
  } else {
    const blob = new Blob([text], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = suggestedName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  }
}
```

- [ ] **Step 3: Browser verification — NEW path**

Reload. `make serve` running. Open Import modal. Paste:

```
Model: TestImport-NEW
MMLU 75.5% 30 30 500.0 yes
TRUTHFULQA 80.0% 30 30 200.0 yes
```

Fill spec: Params `7`, Quant `4bit`, Size `4.5`, MTP off. Click Save. Native Save As dialog appears prefilled `<device>.json`. Navigate to `app/data/`, overwrite, confirm. Toast appears.

Verify in terminal: `cat app/data/<device>.json | python3 -c "import json,sys; d=json.load(sys.stdin); print([e['model'] for e in d if 'TestImport-NEW' in e['model']])"` → shows `['TestImport-NEW']`.

Reload the page (the in-memory state already updated but verify a fresh fetch works). Search "TestImport" — entry visible.

- [ ] **Step 4: Browser verification — OVERWRITE path**

Re-open Import modal. Paste:

```
Model: TestImport-NEW
MMLU 99.9% 30 30 1.0 yes
```

This time the row should be `OVERWRITE`. Save. Reload page. Confirm MMLU score for `TestImport-NEW` is now `99.9` and other fields (spec, abilities, tiers) are unchanged.

- [ ] **Step 5: Cleanup the test entry**

Manually delete the `TestImport-NEW` entry from `app/data/<device>.json` (any editor). Confirm page reload shows it gone.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: Import modal save with showSaveFilePicker fallback"
```

---

### Task 10: Tier filter — dropdown → segmented buttons

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Replace dropdown HTML with segmented buttons**

In the header `header-controls`, remove:

```html
<select id="tier-filter" class="btn btn-secondary" onclick="void(0)">
  <option value="all">All Tiers</option>
  <option value="opus">Opus</option>
  <option value="sonnet">Sonnet</option>
  <option value="haiku">Haiku</option>
</select>
```

Move Tier into the `.filter-row` div (added in Task 6), before the Metrics block:

```html
<div>
  <span class="segmented-label">Tier</span>
  <div class="segmented" id="tier-filter">
    <button data-val="all" class="active">All</button>
    <button data-val="opus">Opus</button>
    <button data-val="sonnet">Sonnet</button>
    <button data-val="haiku">Haiku</button>
  </div>
</div>
```

- [ ] **Step 2: Remove old `#tier-filter` CSS** (the `select` styling)

In `<style>`, delete the `#tier-filter` and `#tier-filter:focus` rules (around line 70-87).

- [ ] **Step 3: Update wiring**

Locate the old tier filter wire-up:

```js
document.addEventListener('DOMContentLoaded', () => {
  const tf = document.getElementById('tier-filter')
  tf.addEventListener('change', () => {
    tierFilterIdx = tf.value === 'all' ? -1 : { opus: 0, sonnet: 1, haiku: 2 }[tf.value]
    renderTable(currentData)
  })
})
```

Replace with:

```js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#tier-filter button').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val
      tierFilterIdx = val === 'all' ? -1 : { opus: 0, sonnet: 1, haiku: 2 }[val]
      document.querySelectorAll('#tier-filter button').forEach(b => b.classList.toggle('active', b === btn))
      renderTable(currentData)
    })
  })
})
```

- [ ] **Step 4: Browser verification**

Reload. Tier control is now segmented buttons in the second filter row. Clicking `Opus` filters to opus-labelled entries. Clicking `All` restores.

- [ ] **Step 5: Commit**

```bash
git add app/index.html
git commit -m "feat: convert tier filter to segmented buttons"
```

---

### Task 11: Params slider (dual-handle with breakpoints)

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add slider HTML to filter row**

Inside `.filter-row` (after the Metrics block), add:

```html
<div>
  <span class="segmented-label">Params</span>
  <div id="params-slider-wrap" style="display:inline-flex; flex-direction:column; gap:4px; min-width: 240px;">
    <div style="display:flex; justify-content:space-between; font-size: 0.7rem; color:#94a3b8;" id="params-ticks"></div>
    <div style="position: relative; height: 28px;">
      <input id="params-min" type="range" />
      <input id="params-max" type="range" />
    </div>
    <div id="params-range-label" style="font-size: 0.75rem; color:#475569; font-weight: 500;"></div>
  </div>
</div>
```

- [ ] **Step 2: Add slider CSS**

In `<style>`, append:

```css
#params-slider-wrap input[type=range] {
  position: absolute;
  left: 0; right: 0; top: 50%; transform: translateY(-50%);
  width: 100%;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  height: 20px;
}
#params-slider-wrap input[type=range]::-webkit-slider-runnable-track {
  height: 4px;
  background: #e2e8f0;
  border-radius: 9999px;
}
#params-slider-wrap input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  pointer-events: auto;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  margin-top: -6px;
}
#params-slider-wrap input[type=range]:focus { outline: none; }
```

- [ ] **Step 3: State, init, and rendering**

In `<script>`, after the metrics filter section, add:

```js
// ── Params filter ────────────────────────────────────────────────────────
let paramsBreakpoints = [0, 12, 24, 60]
let paramsMinIdx = 0
let paramsMaxIdx = 3   // last index

function initParamsSlider(breakpoints) {
  paramsBreakpoints = breakpoints
  paramsMinIdx = 0
  paramsMaxIdx = breakpoints.length - 1

  const minSlider = document.getElementById('params-min')
  const maxSlider = document.getElementById('params-max')
  minSlider.min = 0
  maxSlider.min = 0
  minSlider.max = paramsMaxIdx
  maxSlider.max = paramsMaxIdx
  minSlider.step = 1
  maxSlider.step = 1
  minSlider.value = paramsMinIdx
  maxSlider.value = paramsMaxIdx

  const ticks = document.getElementById('params-ticks')
  ticks.innerHTML = breakpoints.map((b, i) => {
    const isLast = i === breakpoints.length - 1
    return `<span>${b}B${isLast ? '+' : ''}</span>`
  }).join('')

  const onChange = () => {
    let lo = parseInt(minSlider.value, 10)
    let hi = parseInt(maxSlider.value, 10)
    if (lo > hi) [lo, hi] = [hi, lo]
    paramsMinIdx = lo
    paramsMaxIdx = hi
    updateParamsLabel()
    renderTable(currentData)
  }
  minSlider.oninput = onChange
  maxSlider.oninput = onChange
  updateParamsLabel()
}

function updateParamsLabel() {
  const lo = paramsBreakpoints[paramsMinIdx]
  const hiIdx = paramsMaxIdx
  const hi = paramsBreakpoints[hiIdx]
  const isLast = hiIdx === paramsBreakpoints.length - 1
  document.getElementById('params-range-label').textContent =
    `${lo}B – ${hi}B${isLast ? '+' : ''}`
}

function paramsMatch(entry) {
  const p = entry.spec.parameters_b
  const lo = paramsBreakpoints[paramsMinIdx]
  const hiIdx = paramsMaxIdx
  const hi = paramsBreakpoints[hiIdx]
  const isLast = hiIdx === paramsBreakpoints.length - 1
  if (p < lo) return false
  if (!isLast && p > hi) return false
  return true
}
```

- [ ] **Step 4: Wire into `renderTable` and `boot`**

In `renderTable`, add a new filter step after the search filter:

```js
filtered = filtered.filter(paramsMatch)
```

In `boot()`, after `const settings = await fetch('settings.json')...`, add:

```js
const breakpoints = settings.parametersBreakpoints || [0, 12, 24, 60]
initParamsSlider(breakpoints)
```

- [ ] **Step 5: Browser verification**

Reload. Slider appears with tick labels `0B 12B 24B 60B+`. Drag right thumb left → only models with smaller parameter counts remain. Drag left thumb right → only models with larger counts. Label updates live (e.g. `12B – 60B+`).

Edge case: drag handles past each other — the swap logic in `onChange` should keep them ordered.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: add Params range slider with configurable breakpoints"
```

---

### Task 12: Model row — copy + HuggingFace icons, remove model sort affordance polish

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add icon CSS**

In `<style>`, append:

```css
.model-actions {
  display: inline-flex;
  gap: 6px;
  margin-right: 8px;
  vertical-align: middle;
}
.model-action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  color: #cbd5e1;
  padding: 0;
  line-height: 1;
  transition: color 0.15s ease;
}
.model-action-btn:hover { color: #475569; }
```

- [ ] **Step 2: Modify model cell construction**

Locate in `buildRow()` (around line 853):

```js
const modelTd = document.createElement('td')
modelTd.className = 'model-name'
const nameSpan = document.createTextNode(entry.model)
modelTd.appendChild(nameSpan)
```

Replace with:

```js
const modelTd = document.createElement('td')
modelTd.className = 'model-name'

const actions = document.createElement('span')
actions.className = 'model-actions'

const copyBtn = document.createElement('button')
copyBtn.className = 'model-action-btn'
copyBtn.title = 'Copy model name'
copyBtn.textContent = '📋'
copyBtn.onclick = (e) => {
  e.stopPropagation()
  navigator.clipboard.writeText(entry.model).then(() => showToast('Copied!'))
}

const hfBtn = document.createElement('button')
hfBtn.className = 'model-action-btn'
hfBtn.title = 'Search on HuggingFace'
hfBtn.textContent = '🤗'
hfBtn.onclick = (e) => {
  e.stopPropagation()
  window.open(`https://huggingface.co/models?search=${encodeURIComponent(entry.model)}`, '_blank', 'noopener')
}

actions.appendChild(copyBtn)
actions.appendChild(hfBtn)
modelTd.appendChild(actions)
modelTd.appendChild(document.createTextNode(entry.model))
```

- [ ] **Step 3: Browser verification**

Reload. Each row's model cell now shows `📋 🤗 <model name>`. Icons are light grey; hover darkens. Click 📋 → toast `Copied!`. Manually paste somewhere to confirm the model name was copied. Click 🤗 → new tab opens to `https://huggingface.co/models?search=<model>`.

- [ ] **Step 4: Commit**

```bash
git add app/index.html
git commit -m "feat: add per-row copy and HuggingFace search actions"
```

---

### Task 13: Labeling mode — extend with abilities + spec editing

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Update label-mode header builder**

In `buildHeaders()` (the labeling branch around line 740):

```js
addGroup('Deprecated', 1, true)
addGroup('Tiers (Labeling)', 3, true)
```

Replace with:

```js
addGroup('Spec', 3, true)
addGroup('Abilities', 2, true)
addGroup('Deprecated', 1, true)
addGroup('Tiers (Labeling)', 3, true)
```

In the sub-group row's labeling branch:

```js
if (labelingMode) {
  addNonScore('')
  addNonScore('')
  const th = document.createElement('th')
  th.setAttribute('colspan', '3')
  th.textContent = '—'
  th.style.textAlign = 'center'
  th.style.color = '#94a3b8'
  subGroupRow.appendChild(th)
}
```

Replace with:

```js
if (labelingMode) {
  // Model gets a single empty sub-cell
  addNonScore('')
  // Spec (3) + Abilities (2) + Deprecated (1) = 6 empty
  for (let i = 0; i < 6; i++) addNonScore('')
  const th = document.createElement('th')
  th.setAttribute('colspan', '3')
  th.textContent = '—'
  th.style.textAlign = 'center'
  th.style.color = '#94a3b8'
  subGroupRow.appendChild(th)
}
```

In the leaf row's labeling branch:

```js
if (labelingMode) {
  addLeaf('Deprecated', 'deprecated',  true)
  addLeaf('Opus',       'tiers.opus',   false)
  addLeaf('Sonnet',     'tiers.sonnet', false)
  addLeaf('Haiku',      'tiers.haiku',  false)
}
```

Replace with:

```js
if (labelingMode) {
  addLeaf('Params', 'spec.parameters_b',  true)
  addLeaf('Quant',  'spec.quantization',  false)
  addLeaf('Size',   'spec.size_gb',       false)
  addLeaf('Think',  'abilities.thinking', true)
  addLeaf('MTP',    'abilities.mtp',      false)
  addLeaf('Deprecated', 'deprecated',     true)
  addLeaf('Opus',       'tiers.opus',     false)
  addLeaf('Sonnet',     'tiers.sonnet',   false)
  addLeaf('Haiku',      'tiers.haiku',    false)
}
```

- [ ] **Step 2: Update label-mode row builder**

In `buildRow()`, inside `if (labelingMode)`:

Before the existing `createSwitch` / `createDeprecatedSwitch` definitions, add:

```js
const labelingErrors = labelingErrorsByModel.get(entry.model) || new Set()

const createNumInput = (key, parent, placeholder, validate) => {
  const input = document.createElement('input')
  input.type = 'number'
  input.value = parent[key]
  input.placeholder = placeholder
  input.style.cssText = 'width: 70px; padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-family: inherit;'
  if (labelingErrors.has(key)) input.classList.add('import-error')
  input.oninput = () => {
    const v = parseFloat(input.value)
    if (validate(v)) {
      parent[key] = key === 'parameters_b' ? parseInt(input.value, 10) : Math.round(v * 100) / 100
      input.classList.remove('import-error')
      labelingErrors.delete(key)
    } else {
      input.classList.add('import-error')
      labelingErrors.add(key)
    }
    labelingErrorsByModel.set(entry.model, labelingErrors)
    updateLabelingExportState()
  }
  return input
}

const createTextInput = (key, parent, placeholder) => {
  const input = document.createElement('input')
  input.type = 'text'
  input.value = parent[key]
  input.placeholder = placeholder
  input.style.cssText = 'width: 70px; padding: 4px 6px; border: 1px solid #e2e8f0; border-radius: 4px; font-family: inherit;'
  if (labelingErrors.has(key)) input.classList.add('import-error')
  input.oninput = () => {
    if (input.value.trim()) {
      parent[key] = input.value.trim()
      input.classList.remove('import-error')
      labelingErrors.delete(key)
    } else {
      input.classList.add('import-error')
      labelingErrors.add(key)
    }
    labelingErrorsByModel.set(entry.model, labelingErrors)
    updateLabelingExportState()
  }
  return input
}

const createBoolSwitch = (key, parent) => {
  const label = document.createElement('label')
  label.className = 'switch'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = !!parent[key]
  input.addEventListener('change', e => { parent[key] = e.target.checked })
  const slider = document.createElement('span')
  slider.className = 'slider'
  label.appendChild(input)
  label.appendChild(slider)
  return label
}
```

Then replace the cell additions:

```js
addTd(createDeprecatedSwitch(), 'cell-switch', true)
addTd(createSwitch('opus'),     'cell-switch', false)
addTd(createSwitch('sonnet'),   'cell-switch', false)
addTd(createSwitch('haiku'),    'cell-switch', false)
```

With:

```js
addTd(createNumInput('parameters_b', entry.spec, '35',     v => Number.isInteger(v) && v > 0), '', true)
addTd(createTextInput('quantization', entry.spec, '4bit'),                                       '', false)
addTd(createNumInput('size_gb',      entry.spec, '19.50',  v => !isNaN(v) && v > 0),            '', false)
addTd(createBoolSwitch('thinking', entry.abilities), 'cell-switch', true)
addTd(createBoolSwitch('mtp',      entry.abilities), 'cell-switch', false)
addTd(createBoolSwitch('deprecated', entry),         'cell-switch', true)
addTd(createBoolSwitch('opus',   entry.tiers),       'cell-switch', false)
addTd(createBoolSwitch('sonnet', entry.tiers),       'cell-switch', false)
addTd(createBoolSwitch('haiku',  entry.tiers),       'cell-switch', false)
```

(Delete the old `createSwitch` and `createDeprecatedSwitch` definitions — `createBoolSwitch` replaces both.)

Ensure `entry.tiers` is initialised before this block (the existing code at the top of the labelingMode branch does this). Add similar guards if missing:

```js
if (!entry.tiers) entry.tiers = { opus: false, sonnet: false, haiku: false }
```

- [ ] **Step 3: Add labeling error tracking state**

Near the top of the script (next to `let labelingMode = false`):

```js
const labelingErrorsByModel = new Map()   // model -> Set<fieldKey>

function updateLabelingExportState() {
  const hasErr = [...labelingErrorsByModel.values()].some(s => s.size > 0)
  const exportBtn = document.getElementById('export-data')
  if (exportBtn) exportBtn.disabled = hasErr
  exportBtn.style.opacity = hasErr ? '0.5' : '1'
  exportBtn.style.cursor = hasErr ? 'not-allowed' : 'pointer'
}
```

Also reset on labeling mode toggle:

```js
function toggleLabeling() {
  labelingMode = !labelingMode
  labelingErrorsByModel.clear()
  updateLabelingExportState()
  // ... rest unchanged
}
```

- [ ] **Step 4: Switch labeling Export to use the save-to-file flow**

Currently `openModal()` (the Export modal) just shows a JSON preview. Add a "Save to file" button to Export modal that writes back via `saveDataFile`.

In the Export modal footer (around line 549):

```html
<div class="modal-footer">
  <button class="btn btn-secondary" onclick="closeModal()">Close</button>
  <button class="btn btn-primary" onclick="copyFromModal()">Copy to Clipboard</button>
</div>
```

Replace with:

```html
<div class="modal-footer">
  <button class="btn btn-secondary" onclick="closeModal()">Close</button>
  <button class="btn btn-secondary" onclick="copyFromModal()">Copy to Clipboard</button>
  <button id="export-save-btn" class="btn btn-primary" onclick="saveExportToFile()">Save to File</button>
</div>
```

And add the new function:

```js
async function saveExportToFile() {
  const device = document.getElementById('device-select').value
  try {
    await saveDataFile(`${device}.json`, currentData)
    showToast('Saved successfully!')
    closeModal()
    renderTable(currentData)
  } catch (err) {
    if (err.name === 'AbortError') return
    console.error(err)
    showToast('Save failed: ' + err.message)
  }
}
```

- [ ] **Step 5: Browser verification**

Reload. Click `✏ Label`. Verify:
- Header now shows: Model | Params | Quant | Size | Think | MTP | Deprecated | Opus | Sonnet | Haiku
- Each cell has the right control type (inputs for spec, switches for the rest)
- Type `-5` into a Params cell → red border, Export Data button disabled
- Fix to `35` → red border clears, button re-enables
- Toggle Think switch, change Quant from `4bit` → `Q4`
- Click Export Data → modal shows updated JSON
- Click "Save to File" → file save dialog appears, save to `app/data/<device>.json`, page reload shows changes persisted

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: extend labeling mode to edit spec, abilities, and save to file"
```

---

### Task 14: Settings Modal (edit parametersBreakpoints)

**Files:**
- Modify: `app/index.html`

- [ ] **Step 1: Add Settings button to header**

In `.header-controls`, before `<select id="device-select">`:

```html
<button id="open-settings" class="btn btn-secondary" onclick="openSettingsModal()" title="Settings">⚙</button>
```

- [ ] **Step 2: Hide on non-local**

In `boot()`, alongside the Import button hide:

```js
if (!isLocalEnv()) {
  document.getElementById('import-data').style.display = 'none'
  document.getElementById('open-settings').style.display = 'none'
}
```

- [ ] **Step 3: Add Settings Modal HTML**

After the Import Modal (`</div>` of `#import-modal`), add:

```html
<!-- Settings Modal -->
<div id="settings-modal" class="modal-overlay">
  <div class="modal-container" style="max-width: 540px;">
    <div class="modal-header">
      <h3 class="modal-title">Settings</h3>
      <button class="modal-close" onclick="closeSettingsModal()">&times;</button>
    </div>
    <div class="modal-body">
      <p class="modal-desc">Parameters slider breakpoints (strictly increasing):</p>
      <div id="settings-breakpoints" style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;"></div>
      <button class="btn btn-secondary" style="margin-top: 12px;" onclick="addBreakpoint()">+ Add</button>
      <div id="settings-error" style="margin-top: 12px; color: #dc2626; font-size: 0.8rem;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeSettingsModal()">Cancel</button>
      <button id="settings-save-btn" class="btn btn-primary" onclick="saveSettings()">Save</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Add Settings logic**

In `<script>`, near the bottom (before `async function boot()`):

```js
// ── Settings modal ───────────────────────────────────────────────────────
let settingsDraftBreakpoints = []

function openSettingsModal() {
  settingsDraftBreakpoints = [...paramsBreakpoints]
  renderSettingsBreakpoints()
  document.getElementById('settings-modal').classList.add('show')
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('show')
}

function renderSettingsBreakpoints() {
  const container = document.getElementById('settings-breakpoints')
  container.innerHTML = ''
  settingsDraftBreakpoints.forEach((val, i) => {
    const wrap = document.createElement('div')
    wrap.style.cssText = 'display:inline-flex; align-items:center; gap:4px;'
    const input = document.createElement('input')
    input.type = 'number'
    input.min = '0'
    input.step = '1'
    input.value = val
    input.style.cssText = 'width: 70px; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px;'
    input.oninput = () => {
      const n = parseInt(input.value, 10)
      settingsDraftBreakpoints[i] = isNaN(n) ? 0 : n
      validateSettings()
    }
    const remove = document.createElement('button')
    remove.className = 'btn btn-secondary'
    remove.style.cssText = 'padding: 4px 8px; font-size: 0.75rem;'
    remove.textContent = '✕'
    remove.onclick = () => {
      if (settingsDraftBreakpoints.length <= 2) return
      settingsDraftBreakpoints.splice(i, 1)
      renderSettingsBreakpoints()
      validateSettings()
    }
    wrap.appendChild(input)
    wrap.appendChild(remove)
    container.appendChild(wrap)
  })
  validateSettings()
}

function addBreakpoint() {
  const last = settingsDraftBreakpoints[settingsDraftBreakpoints.length - 1] ?? 0
  settingsDraftBreakpoints.push(last + 10)
  renderSettingsBreakpoints()
}

function validateSettings() {
  const errBox = document.getElementById('settings-error')
  const btn = document.getElementById('settings-save-btn')
  for (let i = 1; i < settingsDraftBreakpoints.length; i++) {
    if (settingsDraftBreakpoints[i] <= settingsDraftBreakpoints[i - 1]) {
      errBox.textContent = 'Values must be strictly increasing.'
      btn.disabled = true
      return
    }
  }
  if (settingsDraftBreakpoints.length < 2) {
    errBox.textContent = 'At least 2 breakpoints required.'
    btn.disabled = true
    return
  }
  errBox.textContent = ''
  btn.disabled = false
}

async function saveSettings() {
  const settings = await fetch('settings.json').then(r => r.json())
  settings.parametersBreakpoints = settingsDraftBreakpoints
  try {
    await saveDataFile('settings.json', settings)
    showToast('Settings saved! Reloading...')
    setTimeout(() => location.reload(), 800)
  } catch (err) {
    if (err.name === 'AbortError') return
    showToast('Save failed: ' + err.message)
  }
}
```

- [ ] **Step 5: Browser verification**

Reload. Click ⚙. Modal opens with 4 inputs showing `0, 12, 24, 60`. Add a breakpoint (`70`). Try entering `5` for the second position (less than `0`+1) — wait, edit second box to `0` → error appears, Save disabled. Fix to `8` → Save enabled. Save. File picker appears for `settings.json`; save to `app/`. Page reloads, slider shows new breakpoints `0B 8B 24B 60B 70B+`.

Manually restore `settings.json` to original `[0, 12, 24, 60]` for cleanliness.

- [ ] **Step 6: Commit**

```bash
git add app/index.html
git commit -m "feat: Settings modal for editing parametersBreakpoints"
```

---

### Task 15: CLAUDE.md final update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Re-read CLAUDE.md and update**

Update the file to reflect the new architecture. The final content should describe:
- Single-file `app/index.html` with vanilla JS
- Data import / labeling / settings all in-browser via File System Access API
- `app/settings.json` with `parametersBreakpoints`
- No Python tooling, no tests, no CI
- Hostname-gated UI (Import / Settings only visible on localhost)

Specific edits:
- Remove the `add_data.py` line from Architecture
- Remove `tests/test_add_result.py` and `.github/workflows/ci.yml` lines
- Replace the "Key code" → `add_data.py` paragraph with a description of in-browser import (textarea → parser → showSaveFilePicker)
- Remove the entire Usage section's `add_data.py` example commands and the `make setup && make test` line
- Update Rules: remove the `add_data.py skips duplicate models silently` bullet; add a bullet "Import in UI overwrites scores only on duplicate models; spec/abilities/tiers preserved"
- Add a bullet "Import / Settings UI hidden on non-localhost; file writes via File System Access API (Safari fallback: download)"

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for in-browser data management"
```

---

### Task 16: End-to-end verification

**Files:**
- (none — verification only)

- [ ] **Step 1: Run all 10 acceptance criteria from the spec**

In Chrome/Edge, navigate to `http://localhost:8080/app/`. Walk through each criterion in `docs/superpowers/specs/2026-05-26-ui-data-management-design.md` § "驗收條件":

1. Import → fill spec → Save → file written
2. Re-import same model → tiers & deprecated preserved, scores updated
3. Labeling mode allows editing abilities + spec + tiers + deprecated; validation gates Export
4. Params slider filters correctly
5. Tier / Metrics segmented buttons work
6. Search box substring match
7. 📋 copies, 🤗 opens HF search
8. Model column not sortable, default by date desc
9. Deploy hostname check: open `http://127.0.0.1:8080/app/?` — Import / Settings still visible (since 127.0.0.1 is local). Test the inverse by editing `isLocalEnv()` temporarily to return `false` and confirming the buttons hide. Revert.
10. Test Safari fallback: open the page in Safari, click Save → triggers download instead of native picker. Verify the downloaded file content matches expectations.

- [ ] **Step 2: If any criterion fails, fix in that task's scope and re-commit. Otherwise, declare done.**

```bash
git log --oneline | head -20   # review recent commit chain
```

---

## Self-Review Notes

**Spec coverage:**
- ✓ All 10 acceptance criteria mapped to tasks 7–14 + verification in Task 16
- ✓ File deletions in Task 1
- ✓ `settings.json` schema change in Task 2
- ✓ Hostname guard in Tasks 3, 7, 14
- ✓ Header controls in Tasks 5, 6, 10, 11, 14
- ✓ Import flow split across Tasks 7–9
- ✓ Save mechanism (File System Access API + Safari fallback) in Task 9, reused in Tasks 13–14
- ✓ Labeling extension in Task 13
- ✓ Model row actions in Task 12
- ✓ Default sort in Task 4
- ✓ Settings modal in Task 14
- ✓ CLAUDE.md update in Task 15

**Type / naming consistency check:**
- `saveDataFile(suggestedName, data)` — defined Task 9, used Tasks 9 / 13 / 14 ✓
- `paramsBreakpoints` / `paramsMinIdx` / `paramsMaxIdx` — Task 11 ✓
- `importDetected` shape `{model, thinking, scores, status}` — Task 8, consumed Task 9 ✓
- `labelingErrorsByModel` Map<string, Set<string>> — Task 13 ✓
- `getVisibleBenchmarks()` / `getGroupStartBenchmarks()` — Task 6, used wherever `ALL_BENCHMARKS.forEach` was ✓

**No placeholders:** Verified no "TBD", "TODO", or vague handwaving steps.
