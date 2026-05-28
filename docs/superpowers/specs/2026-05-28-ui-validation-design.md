# UI Validation — Design Spec

**Date:** 2026-05-28  
**Tool:** `/webwright:run`  
**Target:** `http://localhost:8080/app/` (requires `make serve`)

## Goal

Produce a Playwright script `ui_validation.py` that verifies all critical UI interactions of `app/index.html` in a single end-to-end run.

## Workspace Layout

```
outputs/ui-validation/
  plan.md
  ui_validation.py
  final_runs/run_<id>/
    ui_validation.py
    screenshots/
    final_script_log.txt
```

## Critical Points

| CP  | Description |
|-----|-------------|
| CP1 | Page loads at `http://localhost:8080/app/` — `<tbody>` has ≥1 data rows |
| CP2 | Tier filter → click "Opus" — only rows with `tiers.opus=true` remain visible |
| CP3 | Metrics filter → click "Advanced" — only Coding benchmark columns visible |
| CP4 | Model search → type keyword — visible row count decreases |
| CP5 | Show Deprecated checkbox → check — `.deprecated-row` elements appear |
| CP6 | Column sort → click Params header — first row's Params value changes |
| CP7 | Import modal → open, paste sample stdout → Apply → toast appears |
| CP8 | Labeling mode → click "✏ Edit" — `<tbody>` contains `<input>` elements |
| CP9 | Export Data button → visible after import, click → modal shows JSON content |

## Script Contract

- Browser: Firefox headless, `viewport={"width": 1280, "height": 1800}`
- Log: one `step <n> action: <desc>` line per CP interaction; final datum printed at end
- Screenshots: `final_execution_<step>_<action>.png` per CP
- Each CP verified from screenshot evidence before marking passed

## CI Integration

A GitHub Actions workflow `.github/workflows/ci-ui-validation.yml` wraps the script:

- **Trigger:** `push` / `pull_request` on paths `app/**/*.html` and `app/**/*.js` only — no other changes trigger it
- **Steps:** install Node + Python deps → `make serve` (background) → wait for port 8080 → `python ui_validation.py` → upload `final_runs/` as artifact on failure
- Workflow name: `ci-ui-validation`

## Prerequisite

`make serve` must be running on port 8080 before executing the script.
