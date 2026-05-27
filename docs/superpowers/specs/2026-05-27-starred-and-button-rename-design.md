# Starred (Favorites) + Button Rename — Design Spec

**Date:** 2026-05-27  
**Scope:** `app/index.html` only — no build step, no external dependencies

---

## 1. Button Rename

| State | Before | After |
|-------|--------|-------|
| Idle (display mode) | `✏ Label` | `✏ Edit` |
| Active (edit mode) | `✏ Editing` | `Display` |

The active label reads "Display" (no pencil) to communicate "click here to return to display mode" — the button label indicates the destination, not the current state.

**Changes:**
- HTML: `<button id="toggle-labeling">` initial text → `✏ Edit`
- `toggleLabeling()`: set `btn.textContent = '✏ Edit'` (inactive) / `'Display'` (active)

---

## 2. Starred / Favorites

### 2.1 Data format

Add a `starred` boolean field to every entry object. Defaults to `false` for new entries created via Import.

```json
{
  "model": "...",
  "date": "2026-05-25",
  "starred": false,
  "spec": { ... },
  ...
}
```

`starred` is always included in exported JSON, including `false` values, to keep the format consistent.

### 2.2 Edit mode — heart toggle

A heart button is added as the **3rd action button** inside the `.model-actions` span (after 📋 and 🤗), visible **only in edit mode**.

- Unstarred: `♡` in default muted colour
- Starred: `♥` in accent colour (e.g. `#f43f5e`)
- Click: toggles `entry.starred`, updates button appearance, calls `markDataDirty()`
- The button is only appended when `labelingMode === true`

### 2.3 Display mode — pinned to top

In display mode the heart button is not rendered. Starred rows are silently pinned to the top of the table.

`renderTable` after `sortData`:

```js
const pinned   = sorted.filter(e => e.starred)
const unpinned = sorted.filter(e => !e.starred)
;[...pinned, ...unpinned].forEach(entry => tbody.appendChild(buildRow(entry)))
```

Both groups maintain their internal sort order. No sort indicator or visual separator is added between the two groups.

### 2.4 Export

`openModal` and `saveExportToFile` already strip `abilities` via destructuring. `starred` is **not** stripped — it is exported as-is. Existing data files that lack the `starred` field remain valid; the display code treats a missing field as `false` (`!!entry.starred`).

### 2.5 Import

`saveImport` sets `starred: false` for newly created entries. Overwrite entries preserve their existing `starred` value (already the case since overwrites only touch `scores`).

---

## 3. Out of scope

- No sort column for `starred`
- No filter by starred
- No visual indicator in display mode (pinning is the only affordance)
- No separator row between pinned and unpinned groups
