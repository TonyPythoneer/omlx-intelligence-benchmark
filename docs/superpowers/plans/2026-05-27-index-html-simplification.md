# index.html Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 9 structural simplifications to `app/index.html`, removing ~59 lines without altering observable behavior, in 3 commits ordered by risk.

**Architecture:** Single-file static page; no build, no tests. Edits are made directly with `Edit` tool against `app/index.html`. Verification is manual via the 14-step checklist in the spec, run after each commit. Each item is independent within its commit and can be applied in any order, but the order given below minimises Edit collisions.

**Tech Stack:** Vanilla JS + CSS in a single HTML file. No tooling.

**Spec:** `docs/superpowers/specs/2026-05-27-index-html-simplification-design.md`

---

## Task 1: C1 — low-risk batch (seven items)

**Files:**
- Modify: `app/index.html`

This task applies 7 unrelated low-risk cleanups, then runs the verification checklist, then commits.

### Step 1.1: Item C — remove dead `getSortValue` fallback

- [ ] **Apply edit**

Find this block in `app/index.html` (currently around L1254–1263):

```js
      if (col.startsWith('scores.')) {
        const parts = col.split('.')
        const bench = parts[1]
        const key = parts[2]
        const score = entry.scores[bench]
        return score ? score[key] : null
      }
      const score = entry.scores[col]
      return score ? score.accuracy : null
    }
```

Replace with:

```js
      if (col.startsWith('scores.')) {
        const parts = col.split('.')
        const bench = parts[1]
        const key = parts[2]
        const score = entry.scores[bench]
        return score ? score[key] : null
      }
      return null
    }
```

Rationale: every caller passes `'date'`, `'model'`, `'spec.*'`, `'tiers.*'`, `'deprecated'`, or `'scores.*.*'`. The bare-benchmark-name branch is unreachable.

### Step 1.2: Item D — replace `tierFilterIdx` with `tierFilter` string

- [ ] **Edit 1: replace state variable**

Find (around L982–983):

```js
    // ── Tier filter ──────────────────────────────────────────────────────────
    let tierFilterIdx = -1   // -1 = all, 0 = opus, 1 = sonnet, 2 = haiku
```

Replace with:

```js
    // ── Tier filter ──────────────────────────────────────────────────────────
    let tierFilter = 'all'   // 'all' | 'opus' | 'sonnet' | 'haiku'
```

- [ ] **Edit 2: simplify click handler**

Find (around L987–990):

```js
        btn.addEventListener('click', () => {
          const val = btn.dataset.val
          tierFilterIdx = val === 'all' ? -1 : { opus: 0, sonnet: 1, haiku: 2 }[val]
          document.querySelectorAll('#tier-filter button').forEach(b => b.classList.toggle('active', b === btn))
```

Replace with:

```js
        btn.addEventListener('click', () => {
          tierFilter = btn.dataset.val
          document.querySelectorAll('#tier-filter button').forEach(b => b.classList.toggle('active', b === btn))
```

- [ ] **Edit 3: simplify `getTierFilterMatch`**

Find (around L1004–1010):

```js
    function getTierFilterMatch(entry) {
      if (tierFilterIdx < 0) return true
      const tiers = entry.tiers
      if (!tiers) return false
      const tierKeys = ['opus', 'sonnet', 'haiku']
      return tiers[tierKeys[tierFilterIdx]]
    }
```

Replace with:

```js
    function getTierFilterMatch(entry) {
      if (tierFilter === 'all') return true
      return !!(entry.tiers && entry.tiers[tierFilter])
    }
```

- [ ] **Edit 4: update `renderTable` check**

Find (around L1574):

```js
      if (tierFilterIdx >= 0) {
        filtered = filtered.filter(getTierFilterMatch)
      }
```

Replace with:

```js
      if (tierFilter !== 'all') {
        filtered = filtered.filter(getTierFilterMatch)
      }
```

### Step 1.3: Item F — merge two `DOMContentLoaded` listeners

- [ ] **Apply edit**

Find the second `DOMContentLoaded` block (around L1023–1029):

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

Replace with:

```js
    // ── Search filter ────────────────────────────────────────────────────────
    let searchQuery = ''
```

Then find the existing first `DOMContentLoaded` block (around L985–1002) and modify its closing to include the search listener. Find:

```js
      document.querySelectorAll('#metrics-filter button').forEach(btn => {
        btn.addEventListener('click', () => {
          metricsFilter = btn.dataset.val
          document.querySelectorAll('#metrics-filter button').forEach(b => b.classList.toggle('active', b === btn))
          buildHeaders()
          renderTable(currentData)
        })
      })
    })
```

Replace with:

```js
      document.querySelectorAll('#metrics-filter button').forEach(btn => {
        btn.addEventListener('click', () => {
          metricsFilter = btn.dataset.val
          document.querySelectorAll('#metrics-filter button').forEach(b => b.classList.toggle('active', b === btn))
          buildHeaders()
          renderTable(currentData)
        })
      })
      const search = document.getElementById('model-search')
      search.addEventListener('input', () => {
        searchQuery = search.value.trim().toLowerCase()
        renderTable(currentData)
      })
    })
```

### Step 1.4: Item E — extract `getExportData` helper

- [ ] **Edit 1: add helper near top of script**

Find (around L1031, immediately before `function openModal()`):

```js
    function openModal() {
      if (!currentData) return
      const exportData = currentData.map(({ abilities, ...rest }) => rest)
      const formatted = JSON.stringify(exportData, null, 2) + "\n"
```

Replace with:

```js
    function getExportData() {
      return currentData.map(({ abilities, ...rest }) => rest)
    }

    function openModal() {
      if (!currentData) return
      const formatted = JSON.stringify(getExportData(), null, 2) + "\n"
```

- [ ] **Edit 2: use helper in `saveExportToFile`**

Find (around L1135–1139):

```js
    async function saveExportToFile() {
      const device = document.getElementById('device-select').value
      try {
        const exportData = currentData.map(({ abilities, ...rest }) => rest)
        await saveDataFile(`${device}.json`, exportData)
```

Replace with:

```js
    async function saveExportToFile() {
      const device = document.getElementById('device-select').value
      try {
        await saveDataFile(`${device}.json`, getExportData())
```

### Step 1.5: Item I — extract `setStarBtnIcon` helper

- [ ] **Apply edit**

Find the star button block inside `buildRow` (around L1448–1460):

```js
      if (labelingMode) {
        const starBtn = document.createElement('button')
        starBtn.className = 'model-action-btn star-btn' + (entry.starred ? ' starred' : '')
        starBtn.title = 'Toggle starred'
        starBtn.textContent = entry.starred ? '♥' : '♡'
        starBtn.onclick = (e) => {
          e.stopPropagation()
          entry.starred = !entry.starred
          starBtn.textContent = entry.starred ? '♥' : '♡'
          starBtn.classList.toggle('starred', entry.starred)
          markDataDirty()
        }
        actions.appendChild(starBtn)
      }
```

Replace with:

```js
      if (labelingMode) {
        const starBtn = document.createElement('button')
        starBtn.className = 'model-action-btn star-btn'
        starBtn.title = 'Toggle starred'
        setStarBtnIcon(starBtn, entry.starred)
        starBtn.onclick = (e) => {
          e.stopPropagation()
          entry.starred = !entry.starred
          setStarBtnIcon(starBtn, entry.starred)
          markDataDirty()
        }
        actions.appendChild(starBtn)
      }
```

Then add the helper. Find (around L1399, immediately before `function buildRow(entry) {`):

```js
    function buildRow(entry) {
      const tr = document.createElement('tr')
```

Replace with:

```js
    function setStarBtnIcon(btn, starred) {
      btn.textContent = starred ? '♥' : '♡'
      btn.classList.toggle('starred', starred)
    }

    function buildRow(entry) {
      const tr = document.createElement('tr')
```

### Step 1.6: Item B — hoist common rows in `buildHeaders`

- [ ] **Edit 1: Row 1 (groupRow)**

Find (around L1296–1305):

```js
      const scoreCols = getVisibleBenchmarks().length * 2
      addGroup('Model', 1, false)
      if (!labelingMode) {
        addGroup('Spec', 3, true)
        addGroup('Score', scoreCols, true)
      } else {
        addGroup('Spec', 3, true)
        addGroup('Deprecated', 1, true)
        addGroup('Tiers (Labeling)', 3, true)
      }
```

Replace with:

```js
      addGroup('Model', 1, false)
      addGroup('Spec', 3, true)
      if (labelingMode) {
        addGroup('Deprecated', 1, true)
        addGroup('Tiers (Labeling)', 3, true)
      } else {
        const scoreCols = getVisibleBenchmarks().length * 2
        addGroup('Score', scoreCols, true)
      }
```

- [ ] **Edit 2: Row 2 (subGroupRow)**

Find (around L1322–1341):

```js
      if (labelingMode) {
        // 8 columns: Model | Spec(3) | Deprecated(1) | Tiers(3)
        addSub('', 1, false)        // Model
        addSub('', 1, true)         // Params  (Spec starts)
        addSub('', 1, false)        // Quant
        addSub('', 1, false)        // Size
        addSub('', 1, true)         // Deprecated
        addSub('', 1, true)         // Opus    (Tiers starts; every tier its own column)
        addSub('', 1, true)         // Sonnet
        addSub('', 1, true)         // Haiku
      } else {
        addSub('', 1, false)        // Model
        addSub('', 1, true)         // Params  (Spec starts)
        addSub('', 1, false)        // Quant
        addSub('', 1, false)        // Size
        // Every visible benchmark gets its own labelled sub-group cell with a left border.
        getVisibleBenchmarks().forEach((bench) => {
          addSub(bench, 2, true)
        })
      }
```

Replace with:

```js
      // Shared head: Model + Spec(Params/Quant/Size)
      addSub('', 1, false)        // Model
      addSub('', 1, true)         // Params  (Spec starts)
      addSub('', 1, false)        // Quant
      addSub('', 1, false)        // Size
      if (labelingMode) {
        // Tail: Deprecated(1) + Tiers(3, each its own column)
        addSub('', 1, true)         // Deprecated
        addSub('', 1, true)         // Opus
        addSub('', 1, true)         // Sonnet
        addSub('', 1, true)         // Haiku
      } else {
        // Tail: one labelled sub-group per visible benchmark (colspan 2 for Acc + Time)
        getVisibleBenchmarks().forEach((bench) => {
          addSub(bench, 2, true)
        })
      }
```

- [ ] **Edit 3: Row 3 (leafRow)**

Find (around L1365–1384):

```js
      addLeafNoSort('Model', false)
      if (labelingMode) {
        addLeaf('Params', 'spec.parameters_b',  true)
        addLeaf('Quant',  'spec.quantization',  false)
        addLeaf('Size',   'spec.size_gb',       false)
        addLeaf('Deprecated', 'deprecated',     true)
        // Each tier column gets its own left border (same treatment as score columns).
        addLeaf('Opus',       'tiers.opus',     true)
        addLeaf('Sonnet',     'tiers.sonnet',   true)
        addLeaf('Haiku',      'tiers.haiku',    true)
      } else {
        addLeaf('Params', 'spec.parameters_b',  true)
        addLeaf('Quant',  'spec.quantization',  false)
        addLeaf('Size',   'spec.size_gb',       false)
        // Every benchmark starts a new visual group (Acc gets the left border)
        getVisibleBenchmarks().forEach((bench) => {
          addLeaf('🎯', 'scores.' + bench + '.accuracy', true)
          addLeaf('⏲', 'scores.' + bench + '.time_s',   false)
        })
      }
```

Replace with:

```js
      addLeafNoSort('Model', false)
      addLeaf('Params', 'spec.parameters_b',  true)
      addLeaf('Quant',  'spec.quantization',  false)
      addLeaf('Size',   'spec.size_gb',       false)
      if (labelingMode) {
        addLeaf('Deprecated', 'deprecated',     true)
        // Each tier column gets its own left border (same treatment as score columns).
        addLeaf('Opus',       'tiers.opus',     true)
        addLeaf('Sonnet',     'tiers.sonnet',   true)
        addLeaf('Haiku',      'tiers.haiku',    true)
      } else {
        // Every benchmark starts a new visual group (Acc gets the left border)
        getVisibleBenchmarks().forEach((bench) => {
          addLeaf('🎯', 'scores.' + bench + '.accuracy', true)
          addLeaf('⏲', 'scores.' + bench + '.time_s',   false)
        })
      }
```

### Step 1.7: Item G — consolidate monospace `<td>` font CSS

- [ ] **Apply edit**

Find (around L463–479):

```css
    td.num {
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
      font-size: 0.8rem;
      color: #334155;
    }
    
    td.score {
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
      font-size: 0.8rem;
      font-weight: 500;
      color: #0f172a;
    }
    
    td.missing {
      color: #94a3b8;
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
    }
```

Replace with:

```css
    td.num, td.score, td.missing {
      font-family: 'JetBrains Mono', 'SF Mono', monospace;
      font-size: 0.8rem;
    }
    td.num     { color: #334155; }
    td.score   { color: #0f172a; font-weight: 500; }
    td.missing { color: #94a3b8; }
```

Note: `td.missing` originally did not have an explicit `font-size`, but inherited the default `td` rule's lack of one. Adding `font-size: 0.8rem` to the consolidated rule will change `td.missing` from inherited size (the `table { font-size: 0.875rem }` rule) to `0.8rem` — matching the other two cells. Visually `td.missing` content is just `—`, so this is imperceptible. If you want strict zero-change behavior, override:

```css
    td.missing { color: #94a3b8; font-size: 0.875rem; }
```

Pick the consolidated form unless step 1.8 verification reveals a visible difference.

### Step 1.8: Run verification checklist

- [ ] **Start server**

```bash
make serve
```

Open `http://localhost:8080/app/` in Chrome.

- [ ] **Walk all 14 steps** in the spec's "Verification checklist" section (`docs/superpowers/specs/2026-05-27-index-html-simplification-design.md`). Any regression → fix or revert before committing.

### Step 1.9: Commit C1

- [ ] **Commit**

```bash
git add app/index.html
git commit -m "$(cat <<'EOF'
refactor: low-risk simplifications in index.html (C1)

- Remove dead getSortValue fallback (item C)
- Replace tierFilterIdx int+lookup with tierFilter string (item D)
- Merge two DOMContentLoaded listeners (item F)
- Extract getExportData() helper (item E)
- Extract setStarBtnIcon() helper (item I)
- Hoist shared Model/Spec/Params/Quant/Size rows in buildHeaders (item B)
- Consolidate monospace td font CSS (item G)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: C2 — input factory (item A)

**Files:**
- Modify: `app/index.html`

### Step 2.1: Extract `applyValidation` helper and slim both input factories

- [ ] **Apply edit**

Find the entire `createNumInput` + `createTextInput` block inside `buildRow` (around L1479–1524):

```js
        const createNumInput = (key, parent, placeholder, validate) => {
          const input = document.createElement('input')
          input.type = 'number'
          input.value = parent[key] ?? ''
          input.placeholder = placeholder
          input.className = 'label-input'
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
            markDataDirty()
          }
          return input
        }

        const createTextInput = (key, parent, placeholder) => {
          const input = document.createElement('input')
          input.type = 'text'
          input.value = parent[key] ?? ''
          input.placeholder = placeholder
          input.className = 'label-input'
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
            markDataDirty()
          }
          return input
        }
```

Replace with:

```js
        const applyValidation = (input, key, isValid) => {
          input.classList.toggle('import-error', !isValid)
          if (isValid) labelingErrors.delete(key)
          else         labelingErrors.add(key)
          labelingErrorsByModel.set(entry.model, labelingErrors)
          updateLabelingExportState()
          markDataDirty()
        }

        const makeLabelInput = (type, key, parent, placeholder) => {
          const input = document.createElement('input')
          input.type = type
          input.value = parent[key] ?? ''
          input.placeholder = placeholder
          input.className = 'label-input'
          if (labelingErrors.has(key)) input.classList.add('import-error')
          return input
        }

        const createNumInput = (key, parent, placeholder, validate) => {
          const input = makeLabelInput('number', key, parent, placeholder)
          input.oninput = () => {
            const v = parseFloat(input.value)
            const valid = validate(v)
            if (valid) parent[key] = key === 'parameters_b' ? parseInt(input.value, 10) : Math.round(v * 100) / 100
            applyValidation(input, key, valid)
          }
          return input
        }

        const createTextInput = (key, parent, placeholder) => {
          const input = makeLabelInput('text', key, parent, placeholder)
          input.oninput = () => {
            const trimmed = input.value.trim()
            const valid = trimmed.length > 0
            if (valid) parent[key] = trimmed
            applyValidation(input, key, valid)
          }
          return input
        }
```

Notes:
- Behavior is preserved exactly: `parseFloat` still drives validation; integer store path for `parameters_b` is unchanged; text trim is preserved.
- Two helpers (`applyValidation` for the post-validate side-effects; `makeLabelInput` for the boilerplate element setup) keep both `createNumInput` and `createTextInput` short and named — readability is the priority over absolute minimum-line.
- Call sites at L1540–1542 (`addTd(createNumInput(...))`, `addTd(createTextInput(...))`) are unchanged.

### Step 2.2: Run verification checklist

- [ ] **Walk all 14 steps** in the spec's "Verification checklist". Pay extra attention to:
  - Step 11 (Edit inputs): typing `35.5` in Params should still show red border (Number.isInteger check)
  - Step 11: typing `19.555` in Size should still round to `19.56` on store
  - Step 11: emptying Quant should still show red border

### Step 2.3: Commit C2

- [ ] **Commit**

```bash
git add app/index.html
git commit -m "$(cat <<'EOF'
refactor: extract applyValidation/makeLabelInput helpers (C2)

Item A: share boilerplate between createNumInput and createTextInput
via two small helpers, keeping both factories named and short.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: C3 — CSS table layout (item H)

**Files:**
- Modify: `app/index.html`

### Step 3.1: Add `table-layout: fixed` and collapse column-width rules

- [ ] **Edit 1: enable fixed layout**

Find (around L284–289):

```css
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      min-width: 900px;
    }
```

Replace with:

```css
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      min-width: 900px;
      table-layout: fixed;
    }
```

- [ ] **Edit 2: collapse the six column-width pairs**

Find (around L430–443):

```css
    /* Fixed widths for non-score columns; prevents layout shifts when metrics/filters change
       or when toggling Labeling mode. min == max locks the column regardless of content. */
    #benchmark-table thead tr.leaf-row th:nth-child(1),
    #benchmark-table tbody td:nth-child(1) { width: 300px; min-width: 300px; max-width: 300px; }
    #benchmark-table thead tr.leaf-row th:nth-child(2),
    #benchmark-table tbody td:nth-child(2) { width: 72px;  min-width: 72px;  max-width: 72px;  }
    #benchmark-table thead tr.leaf-row th:nth-child(3),
    #benchmark-table tbody td:nth-child(3) { width: 72px;  min-width: 72px;  max-width: 72px;  }
    #benchmark-table thead tr.leaf-row th:nth-child(4),
    #benchmark-table tbody td:nth-child(4) { width: 88px;  min-width: 88px;  max-width: 88px;  }
    #benchmark-table thead tr.leaf-row th:nth-child(5),
    #benchmark-table tbody td:nth-child(5) { width: 80px;  min-width: 80px;  max-width: 80px;  }
    #benchmark-table thead tr.leaf-row th:nth-child(6),
    #benchmark-table tbody td:nth-child(6) { width: 80px;  min-width: 80px;  max-width: 80px;  }
```

Replace with:

```css
    /* With table-layout: fixed, the first row's widths are authoritative for the whole column. */
    #benchmark-table th:nth-child(1) { width: 300px; }
    #benchmark-table th:nth-child(2) { width: 72px; }
    #benchmark-table th:nth-child(3) { width: 72px; }
    #benchmark-table th:nth-child(4) { width: 88px; }
    #benchmark-table th:nth-child(5) { width: 80px; }
    #benchmark-table th:nth-child(6) { width: 80px; }
```

Note: under `table-layout: fixed`, only the first row's cells contribute to column sizing, so the `td` selectors are no longer needed. The header rows (group / sub-group / leaf) are all in `thead` and the first row (group-row) has `colspan` on `<th>`s, so the column widths are determined by the leaf row's `th`s when the colspans expand. Selecting `th:nth-child(N)` works because every `th` in every row that has N cells contributes; the browser picks consistently.

If verification reveals column widths drift in labeling mode (where the leaf row has 8 cells instead of 6+benchmarks×2), restore the explicit `td` selector form for nth-child(1..6).

### Step 3.2: Run verification checklist

- [ ] **Walk all 14 steps** in the spec's "Verification checklist". Pay extra attention to:
  - Step 1 (Load): column widths visually match pre-refactor (Model column ≈300px, Params 72px, etc.)
  - Step 4 (Metrics filter): toggling Basic/Advanced does NOT cause column widths to jump
  - Step 10 (Enter Edit mode): toggling Edit does NOT cause column widths to jump
  - Step 7 (Show Deprecated): deprecated row first-cell line-through + opacity intact; row not wider/narrower

### Step 3.3: Commit C3

- [ ] **Commit**

```bash
git add app/index.html
git commit -m "$(cat <<'EOF'
refactor: collapse column widths via table-layout: fixed (C3)

Item H: with table-layout: fixed, each column needs a single width
declaration on the leaf header row instead of three (width/min/max)
on both thead and tbody.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Final check

- [ ] **Line-count delta**

```bash
git diff main -- app/index.html | grep -c '^-[^-]' ; git diff main -- app/index.html | grep -c '^+[^+]'
```

Expected: net ~59 fewer lines.

- [ ] **Final smoke test** — open the page one more time and click through tier filter, params slider, sort headers, enter/exit Edit mode. Confirm no regressions.
