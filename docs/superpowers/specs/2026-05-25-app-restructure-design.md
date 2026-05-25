# App Restructure Design

**Date:** 2026-05-25
**Status:** Approved

## Goal

Consolidate all static web assets under `app/`, switch data files from JS globals to pure JSON loaded via `fetch()`, simplify `add_data.py` by removing regex-based file I/O, and improve local development ergonomics.

---

## Directory Structure

```
/
├── app/                          ← all web assets (GitHub Pages root)
│   ├── index.html                ← moved from repo root
│   ├── settings.json             ← was settings.js
│   ├── settings.json.template    ← was settings.js.template
│   └── data/
│       ├── m1-max-64GB-32c.json  ← was .js
│       └── device.json.template  ← was device.js.template
├── add_data.py                   ← stays at repo root (dev tool)
├── tests/
│   └── test_add_data.py          ← renamed from test_add_result.py
├── Makefile
└── .github/workflows/static.yml
```

Files **not** deployed to GitHub Pages: `add_data.py`, `tests/`, `Makefile`, `docs/`, `.github/`.

---

## Data Format

### Before (JS)

```js
window.BENCHMARK_DATA = [
  { "model": "...", ... }
]
```

### After (JSON)

```json
[
  { "model": "...", ... }
]
```

### settings.json

```json
{
  "defaultDevice": "m1-max-64GB-32c",
  "devices": {
    "m1-max-64GB-32c": {
      "family": "M1",
      "variant": "Max",
      "memory": "64GB",
      "gpus": 32
    }
  }
}
```

---

## index.html Changes

### Favicon

Replace `favicon.ico` file reference with inline SVG emoji — no image file needed:

```html
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
```

### Data Loading

Replace `<script src="app/settings.js">` and dynamic `<script>` injection with `fetch()`:

```js
// startup
const settings = await fetch('settings.json').then(r => r.json())
const data = await fetch(`data/${settings.defaultDevice}.json`).then(r => r.json())

// device switch
async function loadDevice(deviceKey) {
  const data = await fetch(`data/${deviceKey}.json`).then(r => r.json())
  renderTable(data)
}
```

Paths are relative to `app/` (where `index.html` now lives).

### Export Modal

Output pure JSON instead of JS-wrapped format. Update modal description text accordingly.

---

## add_data.py Changes

### What changes

The `DataFile` class currently uses regex to read/write JS-wrapped data. Switch to standard `json.load` / `json.dump`:

```python
# Before: regex to strip window.BENCHMARK_DATA = wrapper
match = re.search(r'window\.BENCHMARK_DATA\s*=\s*(\[.*\])', content, re.DOTALL)

# After: direct JSON I/O
with open(path) as f:
    data = json.load(f)
```

Reading `defaultDevice` from settings also becomes a direct JSON load — no regex.

Output file extension changes from `.js` to `.json`.

### What stays

`parse_input()` regex logic for parsing benchmark runner stdout is **unchanged** — it parses external input and remains appropriate.

---

## Makefile

```makefile
PORT ?= 8080

.PHONY: setup test serve

setup:
    python3 -m venv .venv
    .venv/bin/pip install pytest

test:
    .venv/bin/pytest tests/ -v

serve:
    python3 -m http.server $(PORT) --directory app
```

Override port: `make serve PORT=3000`.

---

## GitHub Pages Workflow

Single change in `.github/workflows/static.yml`:

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v5
  with:
    path: 'app'   # was '.'
```

---

## README Updates

- **Local development** section: `make serve` → `http://localhost:8080` (port overridable)
- **Deployment** section: merge to `main` → GitHub Actions deploys `app/` → Pages URL
- **Add benchmark results** section: note output files are now `.json`

---

## Tests

- Rename `tests/test_add_result.py` → `tests/test_add_data.py`
- Update fixtures from JS format (`window.BENCHMARK_DATA = [...]`) to pure JSON
- Update any path assertions from `.js` to `.json` extensions
- All existing test cases should remain valid after format change
