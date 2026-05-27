# Starred Favorites + Button Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a starred/favorites heart toggle (edit mode only, pins rows to top) and rename the toggle button from "✏ Label / ✏ Editing" to "✏ Edit / Display".

**Architecture:** All changes are in `app/index.html`. No build step, no external dependencies. The `starred` boolean field is persisted in the JSON data files via the existing export flow. Pinning is applied in `renderTable` after sorting.

**Tech Stack:** Vanilla JS, HTML, CSS — no frameworks, no bundler.

---

## Task 1: Rename toggle button

**Files:**
- Modify: `app/index.html:714` (HTML button initial text)
- Modify: `app/index.html:942-945` (`toggleLabeling()` text assignments)

- [ ] **Step 1: Update HTML initial label**

In `app/index.html` line 714, change the button text from `✏ Label` to `✏ Edit`:

```html
<button id="toggle-labeling" class="btn btn-secondary" onclick="toggleLabeling()">✏ Edit</button>
```

- [ ] **Step 2: Update `toggleLabeling()` text assignments**

In `app/index.html` around line 940–946, the `if/else` block sets `btn.textContent`. Change it so active state reads `Display` and inactive state reads `✏ Edit`:

```js
if (labelingMode) {
  btn.classList.add('active')
  btn.textContent = 'Display'
} else {
  btn.classList.remove('active')
  btn.textContent = '✏ Edit'
}
```

- [ ] **Step 3: Verify manually**

Open `http://localhost:8080/app/`. Confirm:
- Button initially reads `✏ Edit`
- After clicking once, button reads `Display` and is highlighted (active class)
- After clicking again, button reads `✏ Edit` and highlight is gone

- [ ] **Step 4: Commit**

```bash
git add app/index.html
git commit -m "feat: rename Label/Editing button to Edit/Display"
```

---

## Task 2: Heart toggle in edit mode

**Files:**
- Modify: `app/index.html` — CSS section (add `.star-btn` colour rule)
- Modify: `app/index.html:1420-1421` (`actions.appendChild` calls in `buildRow`)
- Modify: `app/index.html:1052-1058` (`nextData.push` in `saveImport`)

- [ ] **Step 1: Add CSS for the starred heart colour**

Find the `.model-action-btn:hover` rule (around line 705) and add immediately after it:

```css
.model-action-btn.star-btn.starred { color: #f43f5e; }
```

- [ ] **Step 2: Add heart button in `buildRow`**

In `buildRow`, the two action buttons are appended to `actions` at around lines 1420–1421:

```js
actions.appendChild(copyBtn)
actions.appendChild(hfBtn)
```

Replace with:

```js
actions.appendChild(copyBtn)
actions.appendChild(hfBtn)
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

- [ ] **Step 3: Default `starred: false` for new import entries**

In `saveImport`, the `nextData.push(...)` block (around line 1052) currently is:

```js
nextData.push({
  model: d.model,
  date: today,
  spec: { parameters_b: null, quantization: '', size_gb: null },
  deprecated: false,
  scores: d.scores,
})
```

Add `starred: false`:

```js
nextData.push({
  model: d.model,
  date: today,
  spec: { parameters_b: null, quantization: '', size_gb: null },
  deprecated: false,
  starred: false,
  scores: d.scores,
})
```

- [ ] **Step 4: Verify manually**

1. Open `http://localhost:8080/app/` and click `✏ Edit` to enter edit mode.
2. Confirm a `♡` heart button appears after 🤗 in each model row.
3. Click a heart — it should turn `♥` and go red (`#f43f5e`).
4. Click again — it should revert to `♡` and grey.
5. Click `Export Data` → confirm the JSON preview shows `"starred": true` for the starred row and `"starred": false` for others.
6. Confirm heart button is absent in display mode (click `Display` to return).

- [ ] **Step 5: Commit**

```bash
git add app/index.html
git commit -m "feat: add starred heart toggle in edit mode"
```

---

## Task 3: Pin starred rows to top in display

**Files:**
- Modify: `app/index.html:1541-1545` (`renderTable` — replace `sorted.forEach` with pinned/unpinned split)

- [ ] **Step 1: Split sorted rows into pinned + unpinned in `renderTable`**

Currently `renderTable` ends with:

```js
const sorted = sortData(filtered)
updateSortIndicators()
const tbody = document.querySelector('#benchmark-table tbody')
tbody.innerHTML = ''
sorted.forEach(entry => tbody.appendChild(buildRow(entry)))
```

Replace the last two lines with:

```js
const sorted = sortData(filtered)
updateSortIndicators()
const tbody = document.querySelector('#benchmark-table tbody')
tbody.innerHTML = ''
const pinned   = sorted.filter(e => e.starred)
const unpinned = sorted.filter(e => !e.starred)
;[...pinned, ...unpinned].forEach(entry => tbody.appendChild(buildRow(entry)))
```

- [ ] **Step 2: Verify manually**

1. In edit mode, star two models that are not currently first by date sort.
2. Click `Display` to return to display mode.
3. Confirm the two starred models appear at the very top of the table, above all unstarred rows.
4. Confirm the remaining unstarred rows still sort by date descending (or whatever sort column is active).
5. Change the sort column — confirm starred rows remain pinned to top while the two groups independently re-sort.
6. Apply a search filter — confirm starred rows matching the filter remain at top, and starred rows not matching are correctly hidden.

- [ ] **Step 3: Commit**

```bash
git add app/index.html
git commit -m "feat: pin starred rows to top of table"
```
