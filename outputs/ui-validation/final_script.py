"""UI validation for the Vue 3 + shadcn-vue + reka-ui SPA.

Runs a handful of ROBUST critical points against the CURRENT app using stable
selectors (ARIA roles, visible text, `tbody tr`) rather than brittle class names.
Serve the built static site on http://localhost:8080/ first (e.g.
`python3 -m http.server 8080 --directory dist`), then run this script.

Prints `RESULT: N/N` and exits non-zero on any failure so CI fails loudly.
Screenshots of failures land in outputs/ui-validation/final_runs/.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, Page

RUN_DIR = Path(__file__).parent / "final_runs"
URL = "http://localhost:8080/"


def log(msg: str) -> None:
    print(msg, flush=True)


async def snap(page: Page, name: str) -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    try:
        await page.screenshot(path=str(RUN_DIR / name))
    except Exception as e:  # pragma: no cover - best effort
        log(f"  (screenshot {name} failed: {e})")


async def main() -> None:
    passed: list[str] = []
    failed: list[str] = []

    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 1600})
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(600)

        # CP1 — page loads, title present
        log("CP1: page loads, title 'oMLX Intelligence Benchmark' present")
        try:
            title = await page.title()
            h1 = (await page.locator("h1").first.inner_text()).strip()
            assert title == "oMLX Intelligence Benchmark", f"title={title!r}"
            assert "oMLX Intelligence Benchmark" in h1, f"h1={h1!r}"
            passed.append("CP1")
            log(f"  PASS: title={title!r}")
        except Exception as e:
            failed.append("CP1")
            log(f"  FAIL: {e}")
            await snap(page, "cp1_page_load.png")

        # CP2 — table renders >=1 data row + three-tier header (Model/Spec/Score)
        log("CP2: >=1 tbody data row + three-tier header (Model/Spec/Score)")
        try:
            rows = await page.locator("tbody tr").count()
            assert rows >= 1, f"tbody rows={rows}"
            # Not the empty-state placeholder
            empty = await page.locator("tbody tr", has_text="No entries loaded").count()
            assert empty == 0, "table shows empty-state placeholder"
            header_row1 = await page.locator("thead tr").first.inner_text()
            for label in ("Model", "Spec", "Score"):
                assert label in header_row1, f"header missing {label!r}: {header_row1!r}"
            passed.append("CP2")
            log(f"  PASS: rows={rows} header={header_row1!r}")
        except Exception as e:
            failed.append("CP2")
            log(f"  FAIL: {e}")
            await snap(page, "cp2_table.png")

        # CP3 — filter controls present (Tier segmented, Show Deprecated checkbox)
        log("CP3: filter controls — Tier segmented buttons, Show Deprecated checkbox")
        try:
            for label in ("All", "Opus", "Sonnet", "Haiku"):
                assert await page.get_by_role("button", name=label, exact=True).count() >= 1, \
                    f"tier button {label!r} missing"
            assert await page.locator("#show-deprecated").count() == 1, "Show Deprecated checkbox missing"
            assert await page.get_by_text("Show Deprecated").count() >= 1, "Show Deprecated label missing"
            passed.append("CP3")
            log("  PASS: tier buttons + checkbox present")
        except Exception as e:
            failed.append("CP3")
            log(f"  FAIL: {e}")
            await snap(page, "cp3_filters.png")

        # CP4 — device selector is a reka-ui combobox (not native <select>); opens options
        log("CP4: device selector is reka-ui combobox (role=combobox, no native <select>); opens >=1 option")
        try:
            assert await page.locator("select").count() == 0, "native <select> present (should be reka-ui)"
            combo = page.get_by_role("combobox")
            assert await combo.count() >= 1, "no role=combobox device selector"
            await combo.first.click()
            await page.wait_for_timeout(400)
            opts = await page.get_by_role("option").count()
            assert opts >= 1, f"combobox opened {opts} options"
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)
            passed.append("CP4")
            log(f"  PASS: combobox options={opts}")
        except Exception as e:
            failed.append("CP4")
            log(f"  FAIL: {e}")
            await snap(page, "cp4_combobox.png")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(200)

        # CP5 — '+ Import' opens reka-ui dialog (role=dialog); Escape closes it
        log("CP5: '+ Import' opens reka-ui dialog (role=dialog); Escape closes")
        try:
            assert await page.get_by_role("button", name="+ Import").count() >= 1, "+ Import button missing"
            await page.get_by_role("button", name="+ Import").click()
            await page.wait_for_timeout(500)
            assert await page.get_by_role("dialog").count() >= 1, "import dialog did not open"
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(400)
            assert await page.get_by_role("dialog").count() == 0, "import dialog did not close on Escape"
            passed.append("CP5")
            log("  PASS: dialog opened and closed via Escape")
        except Exception as e:
            failed.append("CP5")
            log(f"  FAIL: {e}")
            await snap(page, "cp5_dialog.png")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(200)

        # CP6 — '✏ Label' toggles edit mode (header -> Deprecated/Tiers + inline inputs); toggle back
        log("CP6: '✏ Label' toggles edit mode (header swaps to Deprecated/Tiers, inline inputs appear) and back")
        try:
            assert await page.locator("tbody input").count() == 0, "inline inputs present before labeling"
            await page.get_by_role("button", name="✏ Label").click()
            await page.wait_for_timeout(500)
            header_row1 = await page.locator("thead tr").first.inner_text()
            assert "Deprecated" in header_row1 and "Tiers" in header_row1, \
                f"header did not swap to Deprecated/Tiers: {header_row1!r}"
            inputs = await page.locator("tbody input").count()
            assert inputs >= 1, "no inline edit inputs in labeling mode"
            # toggle back
            await page.get_by_role("button", name="✓ Done").click()
            await page.wait_for_timeout(500)
            header_back = await page.locator("thead tr").first.inner_text()
            assert "Score" in header_back, f"header did not restore to Score: {header_back!r}"
            assert await page.locator("tbody input").count() == 0, "inline inputs remained after exiting labeling"
            passed.append("CP6")
            log(f"  PASS: labeling inputs={inputs}, toggled back cleanly")
        except Exception as e:
            failed.append("CP6")
            log(f"  FAIL: {e}")
            await snap(page, "cp6_labeling.png")

        await browser.close()

    total = len(passed) + len(failed)
    summary = f"RESULT: {len(passed)}/{total}"
    if failed:
        summary += f" | FAILED: {', '.join(failed)}"
    log(summary)
    if failed:
        raise SystemExit(1)


asyncio.run(main())
