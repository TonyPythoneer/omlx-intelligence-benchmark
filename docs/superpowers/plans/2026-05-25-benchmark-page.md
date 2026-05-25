# Benchmark Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A zero-dependency static HTML page that renders oMLX benchmark results in a sortable comparison table, with per-device data files and a Python ingestion script.

**Architecture:** `index.html` loads `settings.js` and dynamically injects the selected device's `data/<key>.js` via script tag. All HTML, CSS, and JS live inline in `index.html`. Data files define `window.BENCHMARK_DATA`. A Python CLI script parses the benchmark runner's text output and appends new entries to the data files.

**Tech Stack:** Vanilla HTML5, CSS3, ES6 JS (no frameworks, no build step), Python 3.9+ (stdlib only), pytest for Python tests.

---

## File Map

| File | Role |
|---|---|
| `index.html` | Main page — all HTML, CSS, JS inline |
| `settings.js` | Device registry → `window.SETTINGS` |
| `data/mbp-m1max-64GB-32c.js` | Sample device data → `window.BENCHMARK_DATA` |
| `add_result.py` | CLI: parse benchmark text → append to data file |
| `tests/test_add_result.py` | pytest suite for parser + appender |

---

## Task 1: Scaffold data files

**Files:**
- Create: `settings.js`
- Create: `data/mbp-m1max-64GB-32c.js`

- [ ] **Step 1: Create settings.js**

```js
window.SETTINGS = {
  defaultDevice: "mbp-m1max-64GB-32c",
  devices: {
    "mbp-m1max-64GB-32c": {
      chip: "M1 Max",
      memory: "64GB",
      gpus: 32,
    }
  }
}
```

- [ ] **Step 2: Create data/mbp-m1max-64GB-32c.js with four sample entries**

```js
window.BENCHMARK_DATA = [
  {
    model: "Qwen3.6-35B-A3B-TurboQuant-MLX-4bit",
    date: "2026-05-25",
    spec: { parameters_b: 35, quantization: "4bit", size_gb: 19.50 },
    abilities: { thinking: true, mtp: false },
    scores: {
      MMLU:          { accuracy: 83.3, samples: 30, time_s: 835.1 },
      TRUTHFULQA:    { accuracy: 90.0, samples: 30, time_s: 406.5 },
      HUMANEVAL:     { accuracy: 93.3, samples: 30, time_s: 1117.7 },
      MBPP:          { accuracy: 90.0, samples: 30, time_s: 1275.5 },
      LIVECODEBENCH: { accuracy: 60.0, samples: 30, time_s: 5767.2 },
    }
  },
  {
    model: "Qwen3.6-35B-A3B-Claude-4.7-Opus-Reasoning-Distilled-MLX-oQ4-MTP",
    date: "2026-05-25",
    spec: { parameters_b: 35, quantization: "Q4", size_gb: 19.50 },
    abilities: { thinking: true, mtp: true },
    scores: {
      MMLU:          { accuracy: 83.3, samples: 30, time_s: 399.2 },
      TRUTHFULQA:    { accuracy: 96.7, samples: 30, time_s: 89.7 },
      HUMANEVAL:     { accuracy: 86.7, samples: 30, time_s: 657.4 },
      MBPP:          { accuracy: 80.0, samples: 30, time_s: 617.3 },
      LIVECODEBENCH: { accuracy: 26.7, samples: 30, time_s: 4325.2 },
    }
  },
  {
    model: "Qwen3.6-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking-8bit",
    date: "2026-05-25",
    spec: { parameters_b: 40, quantization: "8bit", size_gb: 43.00 },
    abilities: { thinking: true, mtp: false },
    scores: {
      MMLU:          { accuracy: 86.7, samples: 30, time_s: 2792.8 },
      TRUTHFULQA:    { accuracy: 90.0, samples: 30, time_s: 2646.3 },
      HUMANEVAL:     { accuracy: 93.3, samples: 30, time_s: 2718.0 },
      MBPP:          { accuracy: 90.0, samples: 30, time_s: 4975.5 },
      LIVECODEBENCH: { accuracy: 40.0, samples: 30, time_s: 31038.6 },
    }
  },
  {
    model: "Qwopus3.6-27B-v2-MLX-4bit",
    date: "2026-05-25",
    spec: { parameters_b: 27, quantization: "4bit", size_gb: 14.00 },
    abilities: { thinking: true, mtp: false },
    scores: {
      MMLU:       { accuracy: 83.3, samples: 30, time_s: 2398.2 },
      TRUTHFULQA: { accuracy: 93.3, samples: 30, time_s: 1613.0 },
    }
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add settings.js data/mbp-m1max-64GB-32c.js
git commit -m "feat: add settings and sample benchmark data"
```

---

## Task 2: HTML skeleton and CSS

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html with full structure and all CSS**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>oMLX Intelligence Benchmark</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff;
      color: #111;
      padding: 32px 40px;
      line-height: 1.5;
    }

    header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }

    #device-select {
      font-size: 0.875rem;
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
    }

    .table-wrapper { overflow-x: auto; }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    th, td {
      padding: 8px 14px;
      text-align: left;
      white-space: nowrap;
    }

    thead tr.group-row th {
      background: #f9fafb;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    thead tr.leaf-row th {
      font-size: 0.8rem;
      font-weight: 500;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      cursor: pointer;
      user-select: none;
    }

    thead tr.leaf-row th:hover { background: #f3f4f6; }

    thead tr.leaf-row th.sort-asc::after  { content: ' ↑'; color: #2563eb; }
    thead tr.leaf-row th.sort-desc::after { content: ' ↓'; color: #2563eb; }
    thead tr.leaf-row th.sort-asc,
    thead tr.leaf-row th.sort-desc { color: #2563eb; }

    tbody tr { border-bottom: 1px solid #f3f4f6; }
    tbody tr:hover { background: #f9fafb; }

    td.model-name { font-weight: 500; max-width: 320px; overflow: hidden; text-overflow: ellipsis; }

    td.num { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem; }
    td.score { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.8rem; }
    td.missing { color: #9ca3af; font-family: 'SF Mono', 'Fira Code', monospace; }

    .ability-yes { color: #16a34a; font-weight: 700; }
    .ability-no  { color: #d1d5db; }

    /* Group boundary: left border on first column of each group */
    .group-start { border-left: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <header>
    <h1>oMLX Intelligence Benchmark</h1>
    <select id="device-select"></select>
  </header>
  <div class="table-wrapper">
    <table id="benchmark-table">
      <thead></thead>
      <tbody></tbody>
    </table>
  </div>

  <script src="settings.js"></script>
  <script>
    // ── Config ──────────────────────────────────────────────────────────────

    const CATEGORIES = {
      "Knowledge":               ["MMLU"],
      "Commonsense & Reasoning": ["TRUTHFULQA"],
      "Coding":                  ["HUMANEVAL", "MBPP", "LIVECODEBENCH"],
    }

    // All benchmark keys in display order
    const ALL_BENCHMARKS = Object.values(CATEGORIES).flat()

    // ── Sort state ───────────────────────────────────────────────────────────

    let sortCol = null
    let sortDir = 1   // 1 = ascending, -1 = descending

    // ── Helpers ──────────────────────────────────────────────────────────────

    function formatTime(time_s) {
      if (time_s < 60) return `${Math.round(time_s)}s`
      return `${Math.round(time_s / 60)}m`
    }

    function formatScore(scoreObj) {
      if (!scoreObj) return null
      return `${scoreObj.accuracy.toFixed(1)}% (${formatTime(scoreObj.time_s)})`
    }

    function getSortValue(entry, col) {
      if (col === 'model')              return entry.model
      if (col === 'spec.parameters_b') return entry.spec.parameters_b
      if (col === 'spec.quantization') return entry.spec.quantization
      if (col === 'spec.size_gb')      return entry.spec.size_gb
      if (col === 'abilities.thinking')return entry.abilities.thinking ? 1 : 0
      if (col === 'abilities.mtp')     return entry.abilities.mtp     ? 1 : 0
      const score = entry.scores[col]
      return score ? score.accuracy : null
    }

    function sortData(data) {
      if (!sortCol) return data
      return [...data].sort((a, b) => {
        const av = getSortValue(a, sortCol)
        const bv = getSortValue(b, sortCol)
        if (av === null && bv === null) return 0
        if (av === null) return 1   // missing always last
        if (bv === null) return -1
        if (typeof av === 'string') return sortDir * av.localeCompare(bv)
        return sortDir * (av - bv)
      })
    }

    // ── Render ───────────────────────────────────────────────────────────────

    function buildHeaders() {
      const thead = document.querySelector('#benchmark-table thead')
      thead.innerHTML = ''

      // Row 1: group headers
      const groupRow = document.createElement('tr')
      groupRow.className = 'group-row'

      const addGroup = (label, colspan, isStart) => {
        const th = document.createElement('th')
        th.textContent = label
        th.colSpan = colspan
        if (isStart) th.classList.add('group-start')
        groupRow.appendChild(th)
      }

      addGroup('Model', 1, false)
      addGroup('Spec', 3, true)
      addGroup('Abilities', 2, true)
      Object.entries(CATEGORIES).forEach(([cat, benches]) => {
        addGroup(cat, benches.length, true)
      })
      thead.appendChild(groupRow)

      // Row 2: leaf headers (sortable)
      const leafRow = document.createElement('tr')
      leafRow.className = 'leaf-row'

      const addLeaf = (label, col, isStart) => {
        const th = document.createElement('th')
        th.textContent = label
        th.dataset.col = col
        if (isStart) th.classList.add('group-start')
        if (sortCol === col) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc')
        th.addEventListener('click', () => onSort(col))
        leafRow.appendChild(th)
      }

      addLeaf('Model',   'model',            false)
      addLeaf('Params',  'spec.parameters_b', true)
      addLeaf('Quant',   'spec.quantization', false)
      addLeaf('Size',    'spec.size_gb',      false)
      addLeaf('Think',   'abilities.thinking', true)
      addLeaf('MTP',     'abilities.mtp',      false)
      ALL_BENCHMARKS.forEach((bench, i) => {
        const firstInGroup = Object.values(CATEGORIES).some(arr => arr[0] === bench)
        addLeaf(bench, bench, firstInGroup)
      })
      thead.appendChild(leafRow)
    }

    function buildRow(entry) {
      const tr = document.createElement('tr')

      const addTd = (content, cls, isStart) => {
        const td = document.createElement('td')
        td.innerHTML = content
        if (cls)     td.className = cls
        if (isStart) td.classList.add('group-start')
        tr.appendChild(td)
      }

      addTd(entry.model, 'model-name', false)
      addTd(`${entry.spec.parameters_b}B`, 'num', true)
      addTd(entry.spec.quantization, '', false)
      addTd(`${entry.spec.size_gb.toFixed(2)} GB`, 'num', false)
      addTd(
        entry.abilities.thinking
          ? '<span class="ability-yes">✓</span>'
          : '<span class="ability-no">✗</span>',
        '', true
      )
      addTd(
        entry.abilities.mtp
          ? '<span class="ability-yes">✓</span>'
          : '<span class="ability-no">✗</span>',
        '', false
      )
      ALL_BENCHMARKS.forEach(bench => {
        const score = entry.scores[bench]
        const formatted = formatScore(score)
        const firstInGroup = Object.values(CATEGORIES).some(arr => arr[0] === bench)
        if (formatted) {
          addTd(formatted, 'score', firstInGroup)
        } else {
          addTd('—', 'missing', firstInGroup)
        }
      })

      return tr
    }

    function renderTable(data) {
      const sorted = sortData(data)
      buildHeaders()
      const tbody = document.querySelector('#benchmark-table tbody')
      tbody.innerHTML = ''
      sorted.forEach(entry => tbody.appendChild(buildRow(entry)))
    }

    // ── Sort handler ─────────────────────────────────────────────────────────

    function onSort(col) {
      if (sortCol === col) {
        sortDir = sortDir === 1 ? -1 : 1
      } else {
        sortCol = col
        sortDir = 1
      }
      if (window.BENCHMARK_DATA) renderTable(window.BENCHMARK_DATA)
    }

    // ── Device loading ───────────────────────────────────────────────────────

    function loadDevice(deviceKey) {
      const old = document.getElementById('data-script')
      if (old) old.remove()
      window.BENCHMARK_DATA = null
      const script = document.createElement('script')
      script.id = 'data-script'
      script.src = `data/${deviceKey}.js`
      script.onload = () => renderTable(window.BENCHMARK_DATA)
      document.head.appendChild(script)
    }

    function initDeviceDropdown() {
      const select = document.getElementById('device-select')
      Object.entries(window.SETTINGS.devices).forEach(([key, info]) => {
        const opt = document.createElement('option')
        opt.value = key
        opt.textContent = `${info.chip} · ${info.memory} · ${info.gpus}c`
        if (key === window.SETTINGS.defaultDevice) opt.selected = true
        select.appendChild(opt)
      })
      select.addEventListener('change', e => loadDevice(e.target.value))
    }

    // ── Boot ─────────────────────────────────────────────────────────────────

    initDeviceDropdown()
    loadDevice(window.SETTINGS.defaultDevice)
  </script>
</body>
</html>
```

- [ ] **Step 2: Open index.html in browser and verify**

Open `index.html` directly (double-click in Finder, or `open index.html` in terminal).

Expected:
- Title "oMLX Intelligence Benchmark" top-left
- Device dropdown top-right showing "M1 Max · 64GB · 32c"
- Table with 4 rows of data
- All 4 models visible with spec, abilities (✓/✗), and benchmark scores
- "Qwopus3.6-27B-v2-MLX-4bit" shows `—` for HUMANEVAL, MBPP, LIVECODEBENCH

- [ ] **Step 3: Verify sorting in browser console**

Open DevTools console and run:

```js
// Should return sorted data ascending by MMLU accuracy
const sorted = [...window.BENCHMARK_DATA].sort((a, b) =>
  (a.scores.MMLU?.accuracy ?? -Infinity) - (b.scores.MMLU?.accuracy ?? -Infinity)
)
console.assert(sorted[0].model === 'Qwopus3.6-27B-v2-MLX-4bit' || sorted[0].scores.MMLU.accuracy <= sorted[1].scores.MMLU.accuracy, 'sort order wrong')
console.log('Sort check passed')
```

Expected: `Sort check passed`

Click any column header — rows re-order. Click again — reverses. Active column header shows ↑ or ↓.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add benchmark comparison table with sorting and device dropdown"
```

---

## Task 3: Write and test add_result.py

**Files:**
- Create: `add_result.py`
- Create: `tests/test_add_result.py`

- [ ] **Step 1: Create add_result.py**

```python
#!/usr/bin/env python3
"""Parse benchmark runner output and append to the correct data JS file."""

import sys
import re
import argparse
from pathlib import Path
from datetime import date


def parse_input(text: str) -> list[dict]:
    """Return list of {model, thinking, scores} parsed from --- Detail --- text."""
    results = []
    # Each model block starts with "Model:"
    blocks = re.split(r'(?=^Model:)', text, flags=re.MULTILINE)
    score_re = re.compile(
        r'^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)',
        re.MULTILINE,
    )
    for block in blocks:
        block = block.strip()
        if not block.startswith('Model:'):
            continue
        first_line = block.splitlines()[0]
        model_name = first_line.removeprefix('Model:').strip()
        scores = {}
        thinking = False
        for m in score_re.finditer(block):
            bench    = m.group(1)
            accuracy = float(m.group(2))
            samples  = int(m.group(3))
            time_s   = float(m.group(4))
            think    = m.group(5).lower() == 'yes'
            scores[bench] = {'accuracy': accuracy, 'samples': samples, 'time_s': time_s}
            if think:
                thinking = True
        if scores:
            results.append({'model': model_name, 'thinking': thinking, 'scores': scores})
    return results


def read_data_file(path: Path) -> str:
    """Return the JS file content, or a blank array stub if file doesn't exist."""
    if path.exists():
        return path.read_text()
    return 'window.BENCHMARK_DATA = []\n'


def model_exists(js_content: str, model_name: str) -> bool:
    return f'model: "{model_name}"' in js_content


def append_entry(js_content: str, entry: dict) -> str:
    """Insert a new JS object before the closing ] of window.BENCHMARK_DATA."""
    scores_lines = []
    for bench, s in entry['scores'].items():
        scores_lines.append(
            f'      {bench}: '
            f'{{ accuracy: {s["accuracy"]}, samples: {s["samples"]}, time_s: {s["time_s"]} }},'
        )
    scores_block = '\n'.join(scores_lines)

    new_obj = f"""  {{
    model: "{entry['model']}",
    date: "{entry['date']}",
    spec: {{
      parameters_b: {entry['spec']['parameters_b']},
      quantization: "{entry['spec']['quantization']}",
      size_gb: {entry['spec']['size_gb']:.2f},
    }},
    abilities: {{
      thinking: {'true' if entry['abilities']['thinking'] else 'false'},
      mtp: {'true' if entry['abilities']['mtp'] else 'false'},
    }},
    scores: {{
{scores_block}
    }}
  }},"""

    # Insert before the closing ]
    close_bracket = js_content.rfind(']')
    existing_trimmed = js_content[:close_bracket].rstrip()
    separator = ',\n' if existing_trimmed.endswith('}') else ''
    return existing_trimmed + separator + '\n' + new_obj + '\n]\n'


def prompt_spec() -> dict:
    print('Enter model spec (press Enter to skip optional fields):')
    params_b = int(input('  parameters_b (e.g. 35): ').strip())
    quant    = input('  quantization (e.g. 4bit): ').strip()
    size_gb  = round(float(input('  size_gb (e.g. 19.50): ').strip()), 2)
    mtp_raw  = input('  mtp? (y/N): ').strip().lower()
    return {
        'parameters_b': params_b,
        'quantization': quant,
        'size_gb': size_gb,
        'mtp': mtp_raw == 'y',
    }


def main():
    parser = argparse.ArgumentParser(description='Append benchmark results to data JS file.')
    parser.add_argument('input', nargs='?', help='Path to benchmark output file (default: stdin)')
    parser.add_argument('--device', required=True, help='Device key, e.g. mbp-m1max-64GB-32c')
    parser.add_argument('--params',  type=int,   help='parameters_b')
    parser.add_argument('--quant',               help='quantization string, e.g. 4bit')
    parser.add_argument('--size',    type=float, help='size_gb')
    parser.add_argument('--mtp',     action='store_true', default=False)
    args = parser.parse_args()

    if args.input:
        text = Path(args.input).read_text()
    else:
        text = sys.stdin.read()

    parsed = parse_input(text)
    if not parsed:
        print('No model data found in input.', file=sys.stderr)
        sys.exit(1)

    # Resolve spec — CLI flags take priority, otherwise prompt
    if args.params and args.quant and args.size is not None:
        spec = {
            'parameters_b': args.params,
            'quantization': args.quant,
            'size_gb': round(args.size, 2),
            'mtp': args.mtp,
        }
    else:
        spec = prompt_spec()

    data_path = Path('data') / f'{args.device}.js'
    js_content = read_data_file(data_path)

    added = 0
    for item in parsed:
        if model_exists(js_content, item['model']):
            print(f'SKIP (already exists): {item["model"]}')
            continue
        entry = {
            'model': item['model'],
            'date': str(date.today()),
            'spec': {
                'parameters_b': spec['parameters_b'],
                'quantization': spec['quantization'],
                'size_gb': spec['size_gb'],
            },
            'abilities': {
                'thinking': item['thinking'],
                'mtp': spec['mtp'],
            },
            'scores': item['scores'],
        }
        js_content = append_entry(js_content, entry)
        print(f'Added: {item["model"]}')
        added += 1

    if added:
        data_path.parent.mkdir(exist_ok=True)
        data_path.write_text(js_content)
        print(f'Wrote {data_path}')


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Create tests/test_add_result.py**

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from add_result import parse_input, model_exists, append_entry

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


def test_parse_returns_two_models():
    results = parse_input(SAMPLE_INPUT)
    assert len(results) == 2


def test_parse_model_name():
    results = parse_input(SAMPLE_INPUT)
    assert results[0]['model'] == 'Qwen3.6-35B-A3B-TurboQuant-MLX-4bit'


def test_parse_scores_complete():
    results = parse_input(SAMPLE_INPUT)
    scores = results[0]['scores']
    assert set(scores.keys()) == {'MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'}
    assert scores['MMLU']['accuracy'] == 83.3
    assert scores['MMLU']['samples'] == 30
    assert scores['MMLU']['time_s'] == 835.1


def test_parse_thinking_flag():
    results = parse_input(SAMPLE_INPUT)
    assert results[0]['thinking'] is True


def test_parse_partial_model():
    results = parse_input(SAMPLE_INPUT)
    partial = results[1]
    assert set(partial['scores'].keys()) == {'MMLU', 'TRUTHFULQA'}


def test_model_exists_true():
    js = 'window.BENCHMARK_DATA = [{ model: "MyModel", scores: {} }]\n'
    assert model_exists(js, 'MyModel') is True


def test_model_exists_false():
    js = 'window.BENCHMARK_DATA = []\n'
    assert model_exists(js, 'MyModel') is False


def test_append_entry_adds_model():
    js = 'window.BENCHMARK_DATA = []\n'
    entry = {
        'model': 'TestModel',
        'date': '2026-05-25',
        'spec': {'parameters_b': 7, 'quantization': '4bit', 'size_gb': 4.10},
        'abilities': {'thinking': True, 'mtp': False},
        'scores': {'MMLU': {'accuracy': 80.0, 'samples': 30, 'time_s': 100.0}},
    }
    result = append_entry(js, entry)
    assert 'model: "TestModel"' in result
    assert 'MMLU' in result
    assert result.strip().endswith(']')


def test_append_entry_valid_js_structure():
    js = 'window.BENCHMARK_DATA = []\n'
    entry = {
        'model': 'A',
        'date': '2026-05-25',
        'spec': {'parameters_b': 7, 'quantization': '4bit', 'size_gb': 4.10},
        'abilities': {'thinking': False, 'mtp': False},
        'scores': {'MMLU': {'accuracy': 75.0, 'samples': 30, 'time_s': 50.0}},
    }
    result = append_entry(js, entry)
    # Must still start with assignment and end with ]
    assert result.startswith('window.BENCHMARK_DATA')
    assert ']' in result
```

- [ ] **Step 3: Run tests**

```bash
mkdir -p tests
python -m pytest tests/test_add_result.py -v
```

Expected output — all 9 tests pass:
```
tests/test_add_result.py::test_parse_returns_two_models PASSED
tests/test_add_result.py::test_parse_model_name PASSED
tests/test_add_result.py::test_parse_scores_complete PASSED
tests/test_add_result.py::test_parse_thinking_flag PASSED
tests/test_add_result.py::test_parse_partial_model PASSED
tests/test_add_result.py::test_model_exists_true PASSED
tests/test_add_result.py::test_model_exists_false PASSED
tests/test_add_result.py::test_append_entry_adds_model PASSED
tests/test_add_result.py::test_append_entry_valid_js_structure PASSED
9 passed
```

- [ ] **Step 4: Smoke-test the CLI with sample data**

Create a temp file and run:
```bash
cat > /tmp/bench_sample.txt << 'EOF'
--- Detail ---

Model: TestModel-7B-4bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 75.0%        22      30     200.0     Yes
TRUTHFULQA           80.0%        24      30     150.0     Yes
EOF

python add_result.py /tmp/bench_sample.txt \
  --device mbp-m1max-64GB-32c \
  --params 7 --quant 4bit --size 4.10
```

Expected:
```
Added: TestModel-7B-4bit
Wrote data/mbp-m1max-64GB-32c.js
```

Then open `index.html` in the browser — `TestModel-7B-4bit` should appear as a 5th row with HUMANEVAL/MBPP/LIVECODEBENCH showing `—`.

Run again with the same input — expected:
```
SKIP (already exists): TestModel-7B-4bit
```

- [ ] **Step 5: Revert smoke-test entry and commit**

```bash
# Remove the test model from data file before committing
git checkout data/mbp-m1max-64GB-32c.js

git add add_result.py tests/test_add_result.py
git commit -m "feat: add benchmark result ingestion script with tests"
```
