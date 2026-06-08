"""Phase 09 ad-hoc capture: verify labeling realignment + screenshot for human checkpoint.

Uses CURRENT (post-redesign) selectors — NOT the stale final_script.py CPs.
Drives: load -> click Label -> assert header swap (Score gone, Deprecated+Tiers shown)
-> assert tbody inputs -> open Export -> assert no `abilities` key.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).parent / "final_runs" / "phase09"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"


async def main() -> None:
    results = []
    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 1000})
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(400)

        # Enter labeling mode
        await page.locator("button:has-text('✏ Label')").click()
        await page.wait_for_timeout(500)

        thead = await page.locator("thead").inner_text()
        has_dep = "Deprecated" in thead
        has_tiers = all(t in thead for t in ("Tiers", "Opus", "Sonnet", "Haiku"))
        # Score group header should be gone in labeling mode (group row label "Score")
        score_gone = "Score" not in thead
        results.append(("header swap: Deprecated present", has_dep))
        results.append(("header swap: Tiers/Opus/Sonnet/Haiku present", has_tiers))
        results.append(("header swap: Score group gone", score_gone))

        tbody_inputs = await page.locator("tbody input").count()
        tbody_checkboxes = await page.locator("tbody input[type='checkbox']").count()
        results.append(("tbody has inline inputs", tbody_inputs >= 1))
        results.append(("tbody has tier/deprecated checkboxes", tbody_checkboxes >= 1))

        # No stacked full-width panel: every labeling tr should have multiple td cells
        first_row_tds = await page.locator("tbody tr:first-child td").count()
        results.append(("labeling row is multi-column (no colspan panel)", first_row_tds >= 8))

        # No Abilities/Thinking/MTP anywhere in the table
        no_abilities = not any(w in thead for w in ("Thinking", "MTP", "Abilities"))
        tbody_text = await page.locator("tbody").inner_text()
        no_abilities = no_abilities and not any(w in tbody_text for w in ("Thinking", "MTP", "Abilities"))
        results.append(("no Abilities/Thinking/MTP control", no_abilities))

        await page.screenshot(path=str(OUT / "labeling_mode.png"), full_page=True)

        # Open Export Data and verify no abilities key
        export_btn = page.locator("button:has-text('Export Data')")
        export_ok = False
        no_abilities_key = False
        if await export_btn.count() > 0 and await export_btn.first.is_visible():
            await export_btn.first.click()
            await page.wait_for_timeout(500)
            pre = page.locator("pre")
            if await pre.count() > 0:
                txt = await pre.first.inner_text()
                try:
                    data = json.loads(txt)
                    export_ok = isinstance(data, list) and len(data) >= 1
                    no_abilities_key = all("abilities" not in e for e in data)
                except Exception as e:
                    results.append(("export JSON parse", f"ERROR {e}"))
            await page.screenshot(path=str(OUT / "export_no_abilities.png"))
        results.append(("Export Data opens with JSON array", export_ok))
        results.append(("exported JSON has NO abilities key", no_abilities_key))

        await browser.close()

    print("=== Phase 09 capture results ===")
    ok = True
    for name, val in results:
        status = "PASS" if val is True else ("FAIL" if val is False else val)
        if val is not True:
            ok = False
        print(f"  [{status}] {name}")
    print("ALL PASS" if ok else "SOME CHECKS FAILED")
    print(f"screenshots: {OUT}")


asyncio.run(main())
