# CLAUDE.md — oMLX Intelligence Benchmark

## Project overview

Static benchmark comparison page for oMLX/MLX model results. Single HTML file, no server needed.

## Architecture

```
app/index.html      — single-page benchmark viewer (HTML + CSS + vanilla JS)
app/settings.js     — device config (defaultDevice, device metadata)
app/data/*.json     — device-specific benchmark data
app/data/device.js.template  — empty template for new devices
```

**Data format** — each file is a pure JSON array of entry objects:
```json
[
  {
    "model": "...",
    "date": "2026-05-25",
    "spec": { "parameters_b": 35, "quantization": "4bit", "size_gb": 19.5 },
    "abilities": { "thinking": true, "mtp": false },
    "deprecated": false,
    "tiers": { "opus": true, "sonnet": false, "haiku": false },
    "scores": { "MMLU": {}, "TRUTHFULQA": {}, "...": {} }
  }
]
```

## Key code

- **`index.html`** — vanilla JS, no dependencies. Rendering: three-tier header (category group → benchmark sub-group → leaf Acc/Time), sortable columns, score color-coding (≥90% green, ≥80% amber, <80% red), tier filter dropdown (All/Opus/Sonnet/Haiku), labeling mode with ✏ edit icon and Opus/Sonnet/Haiku toggle switches, deprecated filtering, modal export (copies labeled JS back to clipboard), favicon, footer.
- **`app/settings.js`** — device key → metadata (family, variant, memory, gpus).

## Usage

```bash
make serve   # http://localhost:8080
```

## Rules

- Data files are pure JSON arrays.
- New devices: copy `app/data/device.js.template`, rename with device key, add entry to `app/settings.js`.
- `deprecated: true` entries are filtered by default in the viewer but preserved on export.
- Labeling mode (via "Label Tiers" button) creates `entry.tiers` on the fly.
- Keep `index.html` serverless: no external JS, no build step.
