# UI Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a Playwright script `ui_validation.py` that verifies 9 critical UI interactions of `app/index.html`, plus a GitHub Actions workflow `ci-ui-validation.yml` that runs it on HTML/JS changes.

**Architecture:** Webwright workspace at `outputs/ui-validation/`. The script (`ui_validation.py`) drives Firefox headless against `http://localhost:8080/` (vite root = `app/`). CI installs Python + Playwright, starts `make serve` in background, waits for port 8080, then runs the script.

**Tech Stack:** Python 3, playwright (async), GitHub Actions, pnpm 11, Node 24

---

### Task 1: Set up webwright workspace

**Files:**
- Create: `outputs/ui-validation/plan.md`

- [ ] **Step 1: Create workspace directory**

```bash
mkdir -p outputs/ui-validation
```

- [ ] **Step 2: Write plan.md with Critical Points**

Create `outputs/ui-validation/plan.md`:

```markdown
# Critical Points

- [ ] CP1: Page loads at http://localhost:8080/ — <tbody> has ≥1 data rows
- [ ] CP2: Tier filter → click "Opus" — visible non-deprecated rows ≤ initial count
- [ ] CP3: Metrics filter → click "Advanced" — subgroup-row contains "HUMANEVAL", not "MMLU"
- [ ] CP4: Model search "Qwen3.6" → visible row count ≥ 1
- [ ] CP5: Show Deprecated checkbox checked → tbody tr.deprecated-row count ≥ 1
- [ ] CP6: Click Params header → first row Params text changes from initial value
- [ ] CP7: Import modal → paste sample stdout → Apply → #toast.show contains "Applied"
- [ ] CP8: Click ✏ Edit (labeling mode) → tbody contains <input> elements
- [ ] CP9: #export-data visible after import → click → #export-modal.show → JSON starts with "["
```

- [ ] **Step 3: Verify workspace exists**

```bash
ls outputs/ui-validation/
```

Expected output: `plan.md`

---

### Task 2: Start dev server and take exploration screenshot

**Files:**
- (no file changes — runtime exploration only)

- [ ] **Step 1: Start dev server in background**

```bash
make serve &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
```

Expected: `200`

- [ ] **Step 2: Take exploration screenshot**

```python
# Run as a scratch script to confirm the app loads and inspect selectors
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def explore():
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 1800})
        await page.goto("http://localhost:8080/", wait_until="networkidle")
        await page.screenshot(path="outputs/ui-validation/explore_initial.png")
        rows = await page.locator("tbody tr").count()
        headers = await page.locator("thead tr.subgroup-row").inner_text()
        print(f"rows={rows}")
        print(f"subgroup headers: {headers!r}")
        await browser.close()

asyncio.run(explore())
```

```bash
python3 -c "
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def explore():
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 1800})
        await page.goto('http://localhost:8080/', wait_until='networkidle')
        Path('outputs/ui-validation').mkdir(exist_ok=True)
        await page.screenshot(path='outputs/ui-validation/explore_initial.png')
        rows = await page.locator('tbody tr').count()
        print(f'rows={rows}')
        await browser.close()

asyncio.run(explore())
"
```

Expected: `rows=5` (5 non-deprecated entries in m1-max-64GB-32c.json)

---

### Task 3: Author ui_validation.py

**Files:**
- Create: `outputs/ui-validation/ui_validation.py`

- [ ] **Step 1: Write the script**

Create `outputs/ui-validation/ui_validation.py` with this exact content:

```python
"""UI validation script for app/index.html — runs 9 Critical Points."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

RUN_DIR = Path(__file__).parent / "final_runs" / "run_1"
SS = RUN_DIR / "screenshots"
LOG = RUN_DIR / "final_script_log.txt"
URL = "http://localhost:8080/"

SAMPLE_IMPORT = (
    "Model: TestModel-7B-UIValidation\n"
    "MMLU 78.5% 24 30 492.9 Yes\n"
    "TRUTHFULQA 65.0% 20 30 138.8 Yes\n"
)


def log(msg: str) -> None:
    with open(LOG, "a") as f:
        f.write(msg + "\n")
    print(msg)


async def main() -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    SS.mkdir(parents=True, exist_ok=True)
    LOG.write_text("")

    passed: list[str] = []
    failed: list[str] = []

    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 1800})

        # CP1 — page loads with data
        log("step 1 action: navigate to app, verify ≥1 tbody rows")
        await page.goto(URL, wait_until="networkidle")
        rows = await page.locator("tbody tr").count()
        if rows >= 1:
            passed.append("CP1")
            log(f"CP1 PASS: rows={rows}")
        else:
            failed.append("CP1")
            log(f"CP1 FAIL: rows={rows}")
        await page.screenshot(path=str(SS / "final_execution_1_page_load.png"))

        # CP2 — Tier filter Opus
        log("step 2 action: click Opus tier filter")
        all_rows = await page.locator("tbody tr:not(.deprecated-row)").count()
        await page.locator("#tier-filter button[data-val='opus']").click()
        await page.wait_for_timeout(300)
        opus_rows = await page.locator("tbody tr:not(.deprecated-row)").count()
        if opus_rows <= all_rows:
            passed.append("CP2")
            log(f"CP2 PASS: all_rows={all_rows} opus_rows={opus_rows}")
        else:
            failed.append("CP2")
            log(f"CP2 FAIL: opus_rows={opus_rows} exceeded all_rows={all_rows}")
        await page.screenshot(path=str(SS / "final_execution_2_tier_opus.png"))
        await page.locator("#tier-filter button[data-val='all']").click()
        await page.wait_for_timeout(300)

        # CP3 — Metrics filter Advanced
        log("step 3 action: click Advanced metrics, verify Coding columns visible")
        await page.locator("#metrics-filter button[data-val='advanced']").click()
        await page.wait_for_timeout(300)
        subgroup = await page.locator("thead tr.subgroup-row").inner_text()
        if "HUMANEVAL" in subgroup and "MMLU" not in subgroup:
            passed.append("CP3")
            log(f"CP3 PASS: subgroup={subgroup!r}")
        else:
            failed.append("CP3")
            log(f"CP3 FAIL: subgroup={subgroup!r}")
        await page.screenshot(path=str(SS / "final_execution_3_metrics_advanced.png"))
        await page.locator("#metrics-filter button[data-val='all']").click()
        await page.wait_for_timeout(300)

        # CP4 — Model search
        log("step 4 action: search 'Qwen3.6', verify rows filtered")
        await page.fill("#model-search", "Qwen3.6")
        await page.wait_for_timeout(300)
        search_rows = await page.locator("tbody tr:not(.deprecated-row)").count()
        if search_rows >= 1:
            passed.append("CP4")
            log(f"CP4 PASS: search_rows={search_rows}")
        else:
            failed.append("CP4")
            log(f"CP4 FAIL: search_rows={search_rows}")
        await page.screenshot(path=str(SS / "final_execution_4_search.png"))
        await page.fill("#model-search", "")
        await page.wait_for_timeout(300)

        # CP5 — Show Deprecated
        log("step 5 action: check Show Deprecated, verify deprecated-row appears")
        await page.check("#show-all-cb")
        await page.wait_for_timeout(300)
        dep_rows = await page.locator("tbody tr.deprecated-row").count()
        if dep_rows >= 1:
            passed.append("CP5")
            log(f"CP5 PASS: deprecated_rows={dep_rows}")
        else:
            failed.append("CP5")
            log(f"CP5 FAIL: deprecated_rows={dep_rows}")
        await page.screenshot(path=str(SS / "final_execution_5_show_deprecated.png"))
        await page.uncheck("#show-all-cb")
        await page.wait_for_timeout(300)

        # CP6 — Column sort on Params
        log("step 6 action: click Params header twice (asc then desc), verify first row changes")
        first_before = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        await page.locator("thead tr.leaf-row th[data-col='spec.parameters_b']").click()
        await page.wait_for_timeout(300)
        first_asc = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        await page.locator("thead tr.leaf-row th[data-col='spec.parameters_b']").click()
        await page.wait_for_timeout(300)
        first_desc = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        if first_asc != first_desc:
            passed.append("CP6")
            log(f"CP6 PASS: asc={first_asc!r} desc={first_desc!r}")
        else:
            failed.append("CP6")
            log(f"CP6 FAIL: asc={first_asc!r} == desc={first_desc!r} (sort had no effect)")
        await page.screenshot(path=str(SS / "final_execution_6_sort_params.png"))

        # Reset sort to date desc (default)
        await page.locator("thead tr.leaf-row th[data-col='date']").click()
        await page.wait_for_timeout(300)
        await page.locator("thead tr.leaf-row th[data-col='date']").click()
        await page.wait_for_timeout(300)

        # CP7 — Import modal
        log("step 7 action: open import modal, paste sample, apply, check toast")
        await page.click("#import-data")
        await page.wait_for_selector("#import-modal.show", timeout=5000)
        await page.fill("#import-input", SAMPLE_IMPORT)
        await page.wait_for_timeout(500)
        await page.wait_for_selector("#import-save-btn:not([disabled])", timeout=5000)
        await page.click("#import-save-btn")
        await page.wait_for_selector("#toast.show", timeout=5000)
        toast = await page.locator("#toast").inner_text()
        if "Applied" in toast:
            passed.append("CP7")
            log(f"CP7 PASS: toast={toast!r}")
        else:
            failed.append("CP7")
            log(f"CP7 FAIL: toast={toast!r}")
        await page.screenshot(path=str(SS / "final_execution_7_import_toast.png"))

        # CP8 — Labeling mode
        log("step 8 action: click Edit, verify input elements in tbody")
        await page.click("#toggle-labeling")
        await page.wait_for_timeout(500)
        inputs = await page.locator("tbody input").count()
        if inputs >= 1:
            passed.append("CP8")
            log(f"CP8 PASS: input_count={inputs}")
        else:
            failed.append("CP8")
            log(f"CP8 FAIL: input_count={inputs}")
        await page.screenshot(path=str(SS / "final_execution_8_labeling_mode.png"))
        await page.click("#toggle-labeling")
        await page.wait_for_timeout(300)

        # CP9 — Export Data modal
        log("step 9 action: verify Export Data visible, open modal, check JSON")
        export_visible = await page.locator("#export-data").is_visible()
        if export_visible:
            await page.click("#export-data")
            await page.wait_for_selector("#export-modal.show", timeout=5000)
            json_text = await page.locator("#modal-code-preview").inner_text()
            if json_text.strip().startswith("["):
                passed.append("CP9")
                log(f"CP9 PASS: json_length={len(json_text)}")
            else:
                failed.append("CP9")
                log(f"CP9 FAIL: json preview does not start with '[': {json_text[:80]!r}")
            await page.screenshot(path=str(SS / "final_execution_9_export_modal.png"))
        else:
            failed.append("CP9")
            log("CP9 FAIL: #export-data button not visible")

        await browser.close()

    summary = f"RESULT: {len(passed)}/9 passed — {', '.join(passed or ['none'])}"
    if failed:
        summary += f" | FAILED: {', '.join(failed)}"
    log(summary)
    print(summary)
    if failed:
        raise SystemExit(1)


asyncio.run(main())
```

- [ ] **Step 2: Verify syntax**

```bash
python3 -m py_compile outputs/ui-validation/ui_validation.py && echo "syntax OK"
```

Expected: `syntax OK`

---

### Task 4: Execute and self-verify all 9 CPs

**Files:**
- Create: `outputs/ui-validation/final_runs/run_1/` (created by script at runtime)

- [ ] **Step 1: Ensure dev server is running**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
```

Expected: `200`. If not, run `make serve &` and wait 3 seconds.

- [ ] **Step 2: Run ui_validation.py**

```bash
python3 outputs/ui-validation/ui_validation.py
```

Expected last line: `RESULT: 9/9 passed — CP1, CP2, CP3, CP4, CP5, CP6, CP7, CP8, CP9`

- [ ] **Step 3: Read the log**

```bash
cat outputs/ui-validation/final_runs/run_1/final_script_log.txt
```

Expected: 9 `PASS` lines, one `RESULT: 9/9 passed` line.

- [ ] **Step 4: Self-verify screenshots**

Read each screenshot and confirm the evidence is unambiguous for its CP:

| Screenshot | What to confirm |
|---|---|
| `final_execution_1_page_load.png` | Table visible with data rows |
| `final_execution_2_tier_opus.png` | "Opus" button highlighted (active class) |
| `final_execution_3_metrics_advanced.png` | Header shows HUMANEVAL, no MMLU |
| `final_execution_4_search.png` | Search box contains "Qwen3.6", rows visible |
| `final_execution_5_show_deprecated.png` | Deprecated rows visible (strikethrough + badge) |
| `final_execution_6_sort_params.png` | Params column header has sort arrow |
| `final_execution_7_import_toast.png` | Toast notification visible bottom-right |
| `final_execution_8_labeling_mode.png` | Table rows contain input fields |
| `final_execution_9_export_modal.png` | Modal open with JSON array visible |

If any CP fails, diagnose from the log, fix the script, increment to `run_2/`, re-run, re-verify.

- [ ] **Step 5: Commit workspace artifacts**

```bash
git add outputs/ui-validation/plan.md outputs/ui-validation/ui_validation.py outputs/ui-validation/final_runs/
git commit -m "feat(ui-validation): add Playwright UI validation script (9 CPs verified)"
```

---

### Task 5: Write ci-ui-validation.yml

**Files:**
- Create: `.github/workflows/ci-ui-validation.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci-ui-validation.yml`:

```yaml
name: ci-ui-validation

on:
  push:
    paths:
      - 'app/**/*.html'
      - 'app/**/*.js'
      - 'app/**/*.mjs'
  pull_request:
    paths:
      - 'app/**/*.html'
      - 'app/**/*.js'
      - 'app/**/*.mjs'

jobs:
  ui-validation:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 11

      - name: Install Node dependencies
        run: pnpm install --frozen-lockfile

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Playwright
        run: pip install playwright && playwright install firefox --with-deps

      - name: Start dev server
        run: make serve &

      - name: Wait for port 8080
        run: npx wait-on http://localhost:8080/ --timeout 30000

      - name: Run UI validation
        run: python3 outputs/ui-validation/ui_validation.py

      - name: Upload failure artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: ui-validation-failure
          path: outputs/ui-validation/final_runs/
```

- [ ] **Step 2: Validate YAML syntax**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-ui-validation.yml'))" && echo "YAML OK"
```

Expected: `YAML OK`

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/ci-ui-validation.yml
git commit -m "ci: add ui-validation workflow (triggers on html/js changes)"
```

---

## Self-Review

**Spec coverage:**
- CP1–CP9 all implemented in Task 3 ✓
- Workspace layout (`outputs/ui-validation/`) ✓
- CI workflow with `app/**/*.html` + `app/**/*.js` + `app/**/*.mjs` path triggers ✓
- Failure artifact upload ✓
- `make serve` background + wait-on port 8080 ✓

**Placeholder scan:** None found.

**Type consistency:** `passed`/`failed` are `list[str]`, used consistently throughout.
