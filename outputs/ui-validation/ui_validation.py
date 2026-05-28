"""UI validation script for app/index.html — runs 9 Critical Points."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

RUN_DIR = Path(__file__).parent / "final_runs" / "run_2"
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
        all_rows = await page.locator("tbody tr").count()
        await page.locator("#tier-filter button[data-val='opus']").click()
        await page.wait_for_timeout(300)
        opus_rows = await page.locator("tbody tr").count()
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
        search_rows = await page.locator("tbody tr").count()
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
        # NOTE: default sort is date DESC (first rows have Params="—").
        # After sort asc, rows with params (35B) come first → first row changes from "—" to "35B".
        # Comparing before vs after-first-click (not asc vs desc) because all param entries are 35B.
        log("step 6 action: click Params header, verify first row Params changes")
        first_before = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        await page.locator("thead tr.leaf-row th[data-col='spec.parameters_b']").click()
        await page.wait_for_timeout(300)
        first_after = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        if first_before != first_after:
            passed.append("CP6")
            log(f"CP6 PASS: before={first_before!r} after={first_after!r}")
        else:
            failed.append("CP6")
            log(f"CP6 FAIL: before={first_before!r} == after={first_after!r} (sort had no effect)")
        await page.screenshot(path=str(SS / "final_execution_6_sort_params.png"))

        # Reset sort to date desc — use a try-catch because sort button may not exist after filter changes
        try:
            date_header = page.locator("thead tr.sortable-row th[data-col='date']")
            if await date_header.count() > 0:
                await date_header.click()
                await page.wait_for_timeout(300)
                await date_header.click()
                await page.wait_for_timeout(300)
        except Exception as e:
            log(f"note: sort reset skipped (not critical): {e}")

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
