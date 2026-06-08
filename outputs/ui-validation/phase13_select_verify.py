"""Phase 13 — verify DeviceSelector is a reka-ui Select (combobox), not native <select>."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

RUN_DIR = Path(__file__).parent / "final_runs" / "phase13"
URL = "http://localhost:8080/"


async def main() -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    pageerrors: list[str] = []
    results: list[str] = []

    async with async_playwright() as p:
        browser = await p.firefox.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("pageerror", lambda e: pageerrors.append(str(e)))

        await page.goto(URL, wait_until="networkidle")
        rows_before = await page.locator("tbody tr").count()
        results.append(f"rows on load: {rows_before}")

        # No native <select> anywhere
        native = await page.locator("select").count()
        results.append(f"native <select> count: {native} (expect 0)")

        # The trigger is a reka-ui combobox/button (role=combobox)
        trigger = page.get_by_role("combobox")
        tcount = await trigger.count()
        results.append(f"role=combobox count: {tcount} (expect >=1)")
        trigger_label_before = (await trigger.first.inner_text()).strip()
        results.append(f"trigger label before: {trigger_label_before!r}")

        # Open dropdown
        await trigger.first.click()
        await page.wait_for_timeout(400)
        options = page.get_by_role("option")
        opt_count = await options.count()
        results.append(f"options visible after open: {opt_count} (expect >=1)")
        opt_labels = [(await options.nth(i).inner_text()).strip() for i in range(opt_count)]
        results.append(f"option labels: {opt_labels}")

        # Screenshot of open dropdown
        ss_path = RUN_DIR / "dropdown_open.png"
        await page.screenshot(path=str(ss_path))
        results.append(f"screenshot: {ss_path}")

        # Pick a DIFFERENT option than current selection if possible
        target_idx = 0
        for i in range(opt_count):
            lbl = (await options.nth(i).inner_text()).strip()
            if lbl != trigger_label_before:
                target_idx = i
                break
        chosen_label = (await options.nth(target_idx).inner_text()).strip()
        await options.nth(target_idx).click()
        await page.wait_for_timeout(800)

        trigger_label_after = (await trigger.first.inner_text()).strip()
        results.append(f"chose: {chosen_label!r}")
        results.append(f"trigger label after: {trigger_label_after!r}")

        rows_after = await page.locator("tbody tr").count()
        results.append(f"rows after select: {rows_after} (expect >=1)")

        results.append(f"pageerrors: {pageerrors}")

        await browser.close()

    print("\n".join(results))
    # verdict
    ok = (native == 0 and tcount >= 1 and opt_count >= 1
          and chosen_label in trigger_label_after and rows_after >= 1
          and not pageerrors)
    print("VERDICT:", "PASS" if ok else "FAIL")


asyncio.run(main())
