# App Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all web assets under `app/`, switch data files from JS globals to pure JSON loaded via `fetch()`, and simplify `add_data.py` by removing regex-based file I/O.

**Architecture:** Static files live in `app/` (GitHub Pages root). `index.html` boots with `fetch('settings.json')` then `fetch('data/{device}.json')`. `add_data.py` reads/writes `.json` files directly with `json.load`/`json.dump`; the JS-wrapper regex is removed entirely.

**Tech Stack:** Vanilla HTML/CSS/JS (no build step), Python 3 stdlib only, pytest.

---

## File Map

| Action | Path |
|--------|------|
| Create | `app/settings.json` |
| Create | `app/data/m1-max-64GB-32c.json` |
| Create | `app/data/device.json.template` |
| Create | `app/settings.json.template` |
| Move + Modify | `index.html` → `app/index.html` |
| Modify | `add_data.py` |
| Rename + Modify | `tests/test_add_result.py` → `tests/test_add_data.py` |
| Modify | `Makefile` |
| Modify | `.github/workflows/static.yml` |
| Modify | `README.md` |
| Modify | `CLAUDE.md` |
| Delete | `app/settings.js` |
| Delete | `app/settings.js.template` |
| Delete | `app/data/m1-max-64GB-32c.js` |
| Delete | `app/data/device.js.template` |
| Delete | `favicon.ico` |

---

## Task 1: Create JSON data files

**Files:**
- Create: `app/settings.json`
- Create: `app/data/m1-max-64GB-32c.json`
- Create: `app/data/device.json.template`
- Create: `app/settings.json.template`

- [ ] **Step 1: Create `app/settings.json`**

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

- [ ] **Step 2: Create `app/data/m1-max-64GB-32c.json`**

Convert from JS to valid JSON (quote all keys, remove trailing commas, remove `window.BENCHMARK_DATA =` wrapper):

```json
[
  {
    "model": "Qwen3.6-35B-A3B-TurboQuant-MLX-4bit",
    "date": "2026-05-25",
    "spec": { "parameters_b": 35, "quantization": "4bit", "size_gb": 19.5 },
    "abilities": { "thinking": true, "mtp": false },
    "deprecated": false,
    "labelling": {
      "tiers": {
        "opus": false,
        "sonnet": false,
        "haiku": false
      }
    },
    "scores": {
      "MMLU": { "accuracy": 83.3, "samples": 30, "time_s": 835.1 },
      "TRUTHFULQA": { "accuracy": 90.0, "samples": 30, "time_s": 406.5 },
      "HUMANEVAL": { "accuracy": 93.3, "samples": 30, "time_s": 1117.7 },
      "MBPP": { "accuracy": 90.0, "samples": 30, "time_s": 1275.5 },
      "LIVECODEBENCH": { "accuracy": 60.0, "samples": 30, "time_s": 5767.2 }
    }
  },
  {
    "model": "Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-MLX-oQ4-MTP",
    "date": "2026-05-25",
    "spec": { "parameters_b": 35, "quantization": "Q4", "size_gb": 19.5 },
    "abilities": { "thinking": true, "mtp": true },
    "deprecated": false,
    "tiers": { "opus": true, "sonnet": false, "haiku": false },
    "scores": {
      "MMLU": { "accuracy": 83.3, "samples": 30, "time_s": 399.2 },
      "TRUTHFULQA": { "accuracy": 96.7, "samples": 30, "time_s": 89.7 },
      "HUMANEVAL": { "accuracy": 86.7, "samples": 30, "time_s": 657.4 },
      "MBPP": { "accuracy": 80.0, "samples": 30, "time_s": 617.3 },
      "LIVECODEBENCH": { "accuracy": 26.7, "samples": 30, "time_s": 4325.2 }
    }
  },
  {
    "model": "Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-8bit",
    "date": "2026-05-25",
    "spec": { "parameters_b": 40, "quantization": "8bit", "size_gb": 43.0 },
    "abilities": { "thinking": true, "mtp": false },
    "deprecated": false,
    "tiers": { "opus": true, "sonnet": false, "haiku": false },
    "scores": {
      "MMLU": { "accuracy": 86.7, "samples": 30, "time_s": 2792.8 },
      "TRUTHFULQA": { "accuracy": 90.0, "samples": 30, "time_s": 2646.3 },
      "HUMANEVAL": { "accuracy": 93.3, "samples": 30, "time_s": 2718.0 },
      "MBPP": { "accuracy": 90.0, "samples": 30, "time_s": 4975.5 },
      "LIVECODEBENCH": { "accuracy": 40.0, "samples": 30, "time_s": 31038.6 }
    }
  },
  {
    "model": "Qwopus3.6-27B-v2-MLX-4bit",
    "date": "2026-05-25",
    "spec": { "parameters_b": 27, "quantization": "4bit", "size_gb": 14.0 },
    "abilities": { "thinking": true, "mtp": false },
    "deprecated": false,
    "tiers": { "opus": true, "sonnet": false, "haiku": false },
    "scores": {
      "MMLU": { "accuracy": 83.3, "samples": 30, "time_s": 2398.2 },
      "TRUTHFULQA": { "accuracy": 93.3, "samples": 30, "time_s": 1613.0 }
    }
  }
]
```

- [ ] **Step 3: Create `app/data/device.json.template`**

```json
[]
```

- [ ] **Step 4: Create `app/settings.json.template`**

```json
{
  "defaultDevice": "",
  "devices": {}
}
```

- [ ] **Step 5: Verify JSON files are valid**

```bash
python3 -c "import json; json.load(open('app/settings.json')); print('settings OK')"
python3 -c "import json; json.load(open('app/data/m1-max-64GB-32c.json')); print('data OK')"
```

Expected: both print OK with no errors.

- [ ] **Step 6: Commit**

```bash
git add app/settings.json app/data/m1-max-64GB-32c.json app/data/device.json.template app/settings.json.template
git commit -m "data: add JSON format data and settings files"
```

---

## Task 2: Refactor add_data.py + tests (TDD)

**Files:**
- Rename + Modify: `tests/test_add_result.py` → `tests/test_add_data.py`
- Modify: `add_data.py`

- [ ] **Step 1: Rename test file**

```bash
git mv tests/test_add_result.py tests/test_add_data.py
```

- [ ] **Step 2: Replace test file content**

Full replacement of `tests/test_add_data.py`:

```python
import sys
import json
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from add_data import DataFile, parse_input

TMPL_PATH = Path(__file__).parent.parent / 'app' / 'data' / 'device.json.template'

SAMPLE_INPUT = """
--- Detail ---

Model: Qwen3.6-35B-A3B-TurboQuant-MLX-4bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 83.3%        25      30     835.1     Yes
TRUTHFULQA           90.0%        27      30     406.5     Yes
HUMANEVAL            93.3%        28      30    1117.7     Yes
MBPP                 90.0%        27      30    1275.5     Yes
LIVECODEBENCH        60.0%        18      30    5767.2     Yes

Model: Qwopus3.6-27B-v2-MLX-4bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 83.3%        25      30    2398.2     Yes
TRUTHFULQA           93.3%        28      30    1613.0     Yes
"""

NO_THINK_INPUT = """
--- Detail ---

Model: SomeModel-NoThink
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 70.0%        21      30     500.0     No
"""

SAMPLE_ENTRY = {
    "model": "TestModel",
    "date": "2026-05-25",
    "spec": {"parameters_b": 7, "quantization": "4bit", "size_gb": 4.10},
    "abilities": {"thinking": True, "mtp": False},
    "scores": {"MMLU": {"accuracy": 80.0, "samples": 30, "time_s": 100.0}},
}


@pytest.fixture
def make_data_file():
    tmpl_data = json.loads(TMPL_PATH.read_text())

    def _factory(entries=None) -> DataFile:
        df = DataFile.__new__(DataFile)
        df.path = None
        df._data = list(entries) if entries is not None else list(tmpl_data)
        return df

    return _factory


# ── parse_input ──────────────────────────────────────────────────────────────


def test_parse_returns_two_models():
    assert len(parse_input(SAMPLE_INPUT)) == 2


def test_parse_model_name():
    assert (
        parse_input(SAMPLE_INPUT)[0]["model"] == "Qwen3.6-35B-A3B-TurboQuant-MLX-4bit"
    )


def test_parse_scores_complete():
    scores = parse_input(SAMPLE_INPUT)[0]["scores"]
    assert set(scores.keys()) == {
        "MMLU",
        "TRUTHFULQA",
        "HUMANEVAL",
        "MBPP",
        "LIVECODEBENCH",
    }
    assert scores["MMLU"] == {"accuracy": 83.3, "samples": 30, "time_s": 835.1}


@pytest.mark.parametrize(
    "text,expected",
    [
        (SAMPLE_INPUT, True),
        (NO_THINK_INPUT, False),
    ],
    ids=["thinking", "no_thinking"],
)
def test_parse_thinking_flag(text, expected):
    assert parse_input(text)[0]["thinking"] is expected


def test_parse_partial_model():
    assert set(parse_input(SAMPLE_INPUT)[1]["scores"].keys()) == {"MMLU", "TRUTHFULQA"}


# ── DataFile ─────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "entries,name,expected",
    [
        ([{"model": "MyModel"}], "MyModel", True),
        ([], "MyModel", False),
    ],
    ids=["model_present", "model_absent"],
)
def test_model_exists(make_data_file, entries, name, expected):
    assert make_data_file(entries).model_exists(name) is expected


def test_append_adds_model(make_data_file):
    df = make_data_file()
    df.append(SAMPLE_ENTRY)
    assert any(e["model"] == "TestModel" for e in df._data)
    assert "MMLU" in df._data[0]["scores"]


def test_append_valid_json_structure(tmp_path, make_data_file):
    df = make_data_file()
    df.path = tmp_path / "test.json"
    df.append(SAMPLE_ENTRY)
    df.save()
    loaded = json.loads(df.path.read_text())
    assert isinstance(loaded, list)
    assert loaded[-1]["model"] == "TestModel"


def test_append_two_models(make_data_file):
    df = make_data_file()
    df.append(SAMPLE_ENTRY)
    df.append({**SAMPLE_ENTRY, "model": "ModelB"})
    models = [e["model"] for e in df._data]
    assert "TestModel" in models
    assert "ModelB" in models


# ── read_default_device ──────────────────────────────────────────────────────


def test_read_default_device_from_settings(tmp_path, monkeypatch):
    (tmp_path / "app").mkdir()
    (tmp_path / "app" / "settings.json").write_text(
        '{"defaultDevice": "mbp-m1max-64GB-32c", "devices": {}}'
    )
    monkeypatch.chdir(tmp_path)
    assert DataFile.read_default_device() == "mbp-m1max-64GB-32c"


def test_read_default_device_missing(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert DataFile.read_default_device() is None


# ── deprecated field ─────────────────────────────────────────────────────────


def test_append_no_deprecated_field(make_data_file):
    """New entries appended via Python do not get a deprecated field."""
    df = make_data_file()
    df.append(SAMPLE_ENTRY)
    assert "deprecated" not in df._data[-1]


@pytest.mark.parametrize(
    "entries,expected_kept",
    [
        ([SAMPLE_ENTRY], 1),
        ([{**SAMPLE_ENTRY, "deprecated": True}], 0),
        ([{**SAMPLE_ENTRY, "deprecated": False}], 1),
    ],
    ids=["no_deprecated", "deprecated_true", "deprecated_false"],
)
def test_filter_deprecated(make_data_file, entries, expected_kept):
    """Verifies that entries with deprecated=True are correctly filtered."""
    df = make_data_file(entries)
    kept = [e for e in df._data if not e.get("deprecated")]
    assert len(kept) == expected_kept


def test_load_preserves_deprecated_field(tmp_path, make_data_file):
    """Deprecated field survives a save+reload cycle."""
    entry = {**SAMPLE_ENTRY, "deprecated": True}
    df = make_data_file([entry])
    df.path = tmp_path / "test.json"
    df.save()
    loaded = json.loads(df.path.read_text())
    assert loaded[-1].get("deprecated") is True
```

- [ ] **Step 3: Run tests — expect failures**

```bash
.venv/bin/pytest tests/test_add_data.py -v
```

Expected: multiple FAILURES — `DataFile` still reads `.js` format and references old paths.

- [ ] **Step 4: Update `add_data.py` — DataFile class**

Replace the `DataFile` class (lines 41–70) with:

```python
class DataFile:
    """Manages reading, appending, and saving a device's benchmark JSON data file."""

    APP_DIR       = Path('app')
    SETTINGS_FILE = APP_DIR / 'settings.json'
    DATA_DIR      = APP_DIR / 'data'
    TMPL_FILE     = DATA_DIR / 'device.json.template'

    def __init__(self, device_key: str):
        self.path = self.DATA_DIR / f'{device_key}.json'
        src = self.path if self.path.exists() else self.TMPL_FILE
        with open(src) as f:
            self._data: list[dict] = json.load(f)

    def model_exists(self, model_name: str) -> bool:
        return any(e['model'] == model_name for e in self._data)

    def append(self, entry: dict) -> None:
        self._data.append(entry)

    def save(self) -> None:
        self.path.parent.mkdir(exist_ok=True)
        with open(self.path, 'w') as f:
            json.dump(self._data, f, indent=2)
            f.write('\n')

    @staticmethod
    def read_default_device() -> str | None:
        if not DataFile.SETTINGS_FILE.exists():
            return None
        with open(DataFile.SETTINGS_FILE) as f:
            return json.load(f).get('defaultDevice')
```

Also update the module docstring on line 2:

```python
"""Parse benchmark runner output and append to the correct device JSON data file."""
```

Remove `import re` from the imports if no longer used. Check: `parse_input()` still uses `re`, so keep it.

- [ ] **Step 5: Run tests — expect all pass**

```bash
.venv/bin/pytest tests/test_add_data.py -v
```

Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/test_add_data.py add_data.py
git commit -m "refactor: convert DataFile to JSON I/O, rename test file"
```

---

## Task 3: Move index.html to app/ and update

**Files:**
- Move + Modify: `index.html` → `app/index.html`

- [ ] **Step 1: Move the file**

```bash
git mv index.html app/index.html
```

- [ ] **Step 2: Update favicon line (line 7)**

Replace:
```html
  <link rel="icon" type="image/x-icon" href="favicon.ico">
```
With:
```html
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
```

- [ ] **Step 3: Add module-level data variable after the `<script>` opening tag**

Find the line:
```js
    // ── Config ──────────────────────────────────────────────────────────────
```

Add before it (and remove `<script src="app/settings.js"></script>` on the preceding line):

The line `<script src="app/settings.js"></script>` becomes just `<script>` (merge into the existing script block — there's already a bare `<script>` tag immediately after it). So:

Remove:
```html
  <script src="app/settings.js"></script>
  <script>
```
Replace with:
```html
  <script>
    let currentData = null
```

- [ ] **Step 4: Replace all `window.BENCHMARK_DATA` references with `currentData`**

There are 8 occurrences. Replace all:
- `window.BENCHMARK_DATA` → `currentData`

This covers: `toggleLabeling`, tier filter `change` listener, `toggleShowAll`, `openModal` (×2), sort click handler (×2), and `loadDevice`.

- [ ] **Step 5: Update `openModal` export format**

Find:
```js
      const formatted = "window.BENCHMARK_DATA = " + JSON.stringify(data, null, 2) + ";\n"
```
Replace with:
```js
      const formatted = JSON.stringify(data, null, 2) + "\n"
```

Update the modal description text. Find (line 546 in original `index.html`, now in `app/index.html`):
```html
        <p class="modal-desc">Copy this JavaScript code and paste it into your device...
```
Replace with:
```html
        <p class="modal-desc">Copy this JSON and paste it into your device data file (<code>app/data/{device}.json</code>).
```

- [ ] **Step 6: Replace `loadDevice` function**

Find and replace the entire `loadDevice` function (lines 949–960):

```js
    async function loadDevice(deviceKey) {
      currentData = null
      buildHeaders()
      currentData = await fetch(`data/${deviceKey}.json`).then(r => r.json())
      renderTable(currentData)
    }
```

- [ ] **Step 7: Replace `initDeviceDropdown` and boot section**

Find:
```js
    function initDeviceDropdown() {
      const select = document.getElementById('device-select')
      Object.entries(window.SETTINGS.devices).forEach(([key, info]) => {
        const opt = document.createElement('option')
        opt.value = key
        opt.textContent = `${info.family} ${info.variant} · ${info.memory} · ${info.gpus}c`
        if (key === window.SETTINGS.defaultDevice) opt.selected = true
        select.appendChild(opt)
      })
      select.addEventListener('change', e => loadDevice(e.target.value))
    }

    // ── Boot ─────────────────────────────────────────────────────────────────

    initDeviceDropdown()
    loadDevice(window.SETTINGS.defaultDevice)
```

Replace with:
```js
    function initDeviceDropdown(settings) {
      const select = document.getElementById('device-select')
      Object.entries(settings.devices).forEach(([key, info]) => {
        const opt = document.createElement('option')
        opt.value = key
        opt.textContent = `${info.family} ${info.variant} · ${info.memory} · ${info.gpus}c`
        if (key === settings.defaultDevice) opt.selected = true
        select.appendChild(opt)
      })
      select.addEventListener('change', e => loadDevice(e.target.value))
    }

    // ── Boot ─────────────────────────────────────────────────────────────────

    async function boot() {
      const settings = await fetch('settings.json').then(r => r.json())
      initDeviceDropdown(settings)
      await loadDevice(settings.defaultDevice)
    }
    boot()
```

- [ ] **Step 8: Verify the page works locally**

```bash
make serve
```

Open `http://localhost:8080` in browser. Confirm:
- Table renders with benchmark data
- Device dropdown works
- Tier filter works
- Label Tiers / Export modal works
- Deprecated checkbox works

- [ ] **Step 9: Commit**

```bash
git add app/index.html
git commit -m "feat: move index.html to app/, switch to fetch-based data loading"
```

---

## Task 4: Infrastructure updates

**Files:**
- Modify: `Makefile`
- Modify: `.github/workflows/static.yml`
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update Makefile**

Replace entire `Makefile` content:

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

(Ensure indentation uses tabs, not spaces — Makefile requires tabs.)

- [ ] **Step 2: Update `.github/workflows/static.yml`**

Change `path: '.'` to `path: 'app'`:

```yaml
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v5
        with:
          path: 'app'
```

- [ ] **Step 3: Rewrite `README.md`**

```markdown
# oMLX Intelligence Benchmark

Personal benchmark comparison page for oMLX model results.

## Local development

```bash
make serve          # serves app/ at http://localhost:8080
make serve PORT=3000  # custom port
```

Open `http://localhost:8080` in your browser.

## Deployment

Merging to `main` triggers GitHub Actions, which deploys the `app/` directory to GitHub Pages automatically.

Live URL: `https://tonyyang.github.io/omlx-intelligence-benchmark/`

## Add benchmark results

```bash
# From a file
python add_data.py /path/to/output.txt \
  --device m1-max-64GB-32c \
  --params 35 --quant 4bit --size 19.50

# From stdin
cat output.txt | python add_data.py \
  --device m1-max-64GB-32c \
  --params 35 --quant 4bit --size 19.50

# With MTP flag
python add_data.py output.txt \
  --device m1-max-64GB-32c \
  --params 35 --quant 4bit --size 19.50 --mtp
```

Output is written to `app/data/{device}.json`.

## Run tests

```bash
make setup   # first time only
make test
```
```

- [ ] **Step 4: Update `CLAUDE.md` — Usage section**

In the `## Usage` section, update the commands to reflect `.json` output and add `make serve`:

```bash
# Local development
make serve   # http://localhost:8080

# Add benchmark results (from file or stdin)
python add_data.py output.txt --device m1-max-64GB-32c --params 35 --quant 4bit --size 19.5

# With MTP flag
python add_data.py output.txt --device m1-max-64GB-32c --params 35 --quant 4bit --size 19.5 --mtp

# Tests (first time)
make setup && make test
```

Also update the Architecture section to reflect `.json` file extensions and `app/index.html`.

- [ ] **Step 5: Commit**

```bash
git add Makefile .github/workflows/static.yml README.md CLAUDE.md
git commit -m "chore: update Makefile, workflow, README, CLAUDE.md for app/ restructure"
```

---

## Task 5: Remove old files

**Files:**
- Delete: `app/settings.js`
- Delete: `app/settings.js.template`
- Delete: `app/data/m1-max-64GB-32c.js`
- Delete: `app/data/device.js.template`
- Delete: `favicon.ico`

- [ ] **Step 1: Remove old JS data files**

```bash
git rm app/settings.js app/settings.js.template app/data/m1-max-64GB-32c.js app/data/device.js.template
```

- [ ] **Step 2: Remove old favicon**

```bash
git rm favicon.ico
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
.venv/bin/pytest tests/ -v
```

Expected: all tests PASS.

- [ ] **Step 4: Verify local serve still works**

```bash
make serve
```

Open `http://localhost:8080` — confirm table renders correctly.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old JS data files and favicon.ico"
```
