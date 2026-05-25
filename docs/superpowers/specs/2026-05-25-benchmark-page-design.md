# Benchmark Page Design

**Date:** 2026-05-25
**Approach:** Static HTML + data.js (no build step, no server required)

---

## Goal

A personal single-page benchmark comparison table for oMLX model results. Open `index.html` directly in the browser — no server, no dependencies. Data is updated by running a Python script or letting Claude edit the data file directly.

---

## File Structure

```
omlx-intelligence-benchmark/
├── index.html              # Main page (HTML + CSS + JS inline)
├── settings.js             # Device config, defines window.SETTINGS
├── data/
│   └── mbp-m1max-64GB-32c.js   # Benchmark results per device
├── add_result.py           # CLI script: parse benchmark output → append to data file
└── docs/
    └── superpowers/specs/
        └── 2026-05-25-benchmark-page-design.md
```

---

## Data Structures

### `settings.js`

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

### `data/mbp-m1max-64GB-32c.js`

```js
window.BENCHMARK_DATA = [
  {
    model: "Qwen3.6-35B-A3B-TurboQuant-MLX-4bit",
    date: "2026-05-25",
    spec: {
      parameters_b: 35,
      quantization: "4bits",
      size_gb: 19.50,        // rounded to 2 decimal places
    },
    abilities: {
      thinking: true,
      mtp: false,
    },
    scores: {
      MMLU:          { accuracy: 83.3, samples: 30, time_s: 835.1 },
      TRUTHFULQA:    { accuracy: 90.0, samples: 30, time_s: 406.5 },
      HUMANEVAL:     { accuracy: 93.3, samples: 30, time_s: 1117.7 },
      MBPP:          { accuracy: 90.0, samples: 30, time_s: 1275.5 },
      LIVECODEBENCH: { accuracy: 60.0, samples: 30, time_s: 5767.2 },
    }
  }
]
```

Missing benchmarks are omitted from `scores`; the table renders them as `—`.

---

## Benchmark Category Config

Defined as a constant inside `index.html`:

```js
const CATEGORIES = {
  "Knowledge":               ["MMLU"],
  "Commonsense & Reasoning": ["TRUTHFULQA"],
  "Coding":                  ["HUMANEVAL", "MBPP", "LIVECODEBENCH"],
}
```

Adding a new benchmark only requires: adding scores to the data entry, and adding the benchmark name under a category here.

---

## Table Layout

Columns (left → right):

| Group | Columns | Display |
|---|---|---|
| Model | Model | Full model name |
| Spec | Params / Quant / Size | 35B · 4bits · 19.50GB |
| Abilities | Thinking / MTP | ✓ / ✗ |
| Knowledge | MMLU | 83.3% (14m) |
| Commonsense & Reasoning | TRUTHFULQA | 90.0% (7m) |
| Coding | HUMANEVAL / MBPP / LIVECODEBENCH | one column each |

Time display: `time_s` converted to minutes, rounded to nearest minute (e.g. 835s → 14m). Values under 60s display as seconds (e.g. 45s).

Missing score cells: display `—`, sorted to the bottom when sorting by that column.

---

## Interactions

- **Sorting:** Click any leaf column header to sort ascending/descending. Active sort column shows an arrow indicator.
- **Device dropdown:** Top-right dropdown lists devices from `SETTINGS.devices`. Selecting a device dynamically loads the corresponding `data/<device-key>.js` via `<script>` injection and re-renders the table.
- **Default device:** On page load, the device from `SETTINGS.defaultDevice` is selected.

---

## Style

- White background, clean sans-serif font
- Monospace for all numeric values
- Thin gray lines separate column groups
- `✓` / `✗` for abilities, styled in green / light gray
- Minimal header: page title + device dropdown
- No external CSS libraries; all styles inline in `index.html`

---

## `add_result.py` Script

Parses the `--- Detail ---` text format printed by the benchmark runner:

```
--- Detail ---

Model: <model-name>
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 83.3%        25      30     399.2     Yes
...
```

Behaviour:
- Accepts input via stdin or a file path argument
- Appends a new entry to the correct `data/<device>.js` file
- `spec` fields (parameters_b, quantization, size_gb) are prompted interactively or passed as CLI flags
- If a model name already exists in the file, the script warns and exits without overwriting

---

## Out of Scope

- No search box
- No pagination
- No charts or sparklines
- No public hosting / GitHub Pages setup
