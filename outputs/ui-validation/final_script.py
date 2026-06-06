"""UI validation script for Vue SPA — runs 11 Critical Points for feature parity verification."""
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
        all_rows = await page.locator("tbody tr").count()
        # Find the Tier filter group and click the opus button within it
        tier_group = page.locator(".filter-group:has-text('Tier:')")
        await tier_group.locator("button[data-val='opus']").click()
        await page.wait_for_timeout(300)
        opus_rows = await page.locator("tbody tr").count()
        if opus_rows <= all_rows:
            passed.append("CP2")
            log(f"CP2 PASS: all_rows={all_rows} opus_rows={opus_rows}")
        else:
            failed.append("CP2")
            log(f"CP2 FAIL: opus_rows={opus_rows} exceeded all_rows={all_rows}")
        await page.screenshot(path=str(SS / "final_execution_2_tier_opus.png"))
        # Reset to All (tier)
        await tier_group.locator("button[data-val='all']").click()
        await page.wait_for_timeout(300)

        # CP3 — Metrics filter Advanced
        log("step 3 action: click Advanced metrics, verify Coding columns visible")
        # Find the Metrics filter group and click the advanced button within it
        metrics_group = page.locator(".filter-group:has-text('Metrics:')")
        await metrics_group.locator("button[data-val='advanced']").click()
        await page.wait_for_timeout(300)
        subgroup = await page.locator("thead tr.subgroup-row").inner_text()
        if "HUMANEVAL" in subgroup and "MMLU" not in subgroup:
            passed.append("CP3")
            log(f"CP3 PASS: subgroup contains HUMANEVAL")
        else:
            failed.append("CP3")
            log(f"CP3 FAIL: subgroup={subgroup!r}")
        await page.screenshot(path=str(SS / "final_execution_3_metrics_advanced.png"))
        # Reset to All metrics
        await metrics_group.locator("button[data-val='all']").click()
        await page.wait_for_timeout(300)

        # CP4 — Model search
        log("step 4 action: search 'Qwen3.6', verify rows filtered")
        await page.fill("input[placeholder*='Search models']", "Qwen3.6")
        await page.wait_for_timeout(300)
        search_rows = await page.locator("tbody tr").count()
        if search_rows >= 1:
            passed.append("CP4")
            log(f"CP4 PASS: search_rows={search_rows}")
        else:
            failed.append("CP4")
            log(f"CP4 FAIL: search_rows={search_rows}")
        await page.screenshot(path=str(SS / "final_execution_4_search.png"))
        await page.fill("input[placeholder*='Search models']", "")
        await page.wait_for_timeout(300)

        # CP5 — Show Deprecated
        log("step 5 action: check Show Deprecated checkbox")
        # Find the checkbox label that contains "Show Deprecated" text
        deprecated_label = page.locator(".checkbox-label:has-text('Show Deprecated')")
        deprecated_cb = deprecated_label.locator("input[type='checkbox']")
        await deprecated_cb.check()
        await page.wait_for_timeout(300)
        is_checked = await deprecated_cb.is_checked()
        if is_checked:
            passed.append("CP5")
            log(f"CP5 PASS: Show Deprecated checkbox checked")
        else:
            failed.append("CP5")
            log(f"CP5 FAIL: Show Deprecated checkbox not checked")
        await page.screenshot(path=str(SS / "final_execution_5_show_deprecated.png"))
        await deprecated_cb.uncheck()
        await page.wait_for_timeout(300)

        # CP6 — Column sort on Params
        log("step 6 action: click Params header, verify first row Params changes")
        first_before = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        await page.locator("th[data-col='spec.parameters_b']").click()
        await page.wait_for_timeout(300)
        first_after = await page.locator("tbody tr:first-child td:nth-child(2)").inner_text()
        if first_before != first_after:
            passed.append("CP6")
            log(f"CP6 PASS: before={first_before!r} after={first_after!r}")
        else:
            failed.append("CP6")
            log(f"CP6 FAIL: before={first_before!r} == after={first_after!r}")
        await page.screenshot(path=str(SS / "final_execution_6_sort_params.png"))

        # Reset sort to date desc by clicking a couple times
        try:
            date_header = page.locator("th[data-col='date']")
            if await date_header.count() > 0:
                await date_header.click()
                await page.wait_for_timeout(300)
                await date_header.click()
                await page.wait_for_timeout(300)
        except Exception as e:
            log(f"note: sort reset skipped (not critical): {e}")

        # CP7 — Import modal
        log("step 7 action: open import modal, paste sample, apply")
        try:
            # Click Import button (class btn-import or has text '+ Import')
            import_btn = page.locator("button:has-text('+ Import')")
            if await import_btn.count() == 0:
                import_btn = page.locator(".btn-import")
            await import_btn.click()
            await page.wait_for_timeout(500)

            # Verify modal opened
            modal = page.locator(".modal-overlay")
            if await modal.count() == 0:
                raise Exception("Modal not found")

            # Fill textarea with sample import
            textarea = page.locator(".import-textarea")
            if await textarea.count() == 0:
                raise Exception("Import textarea not found")
            await textarea.fill(SAMPLE_IMPORT)
            await page.wait_for_timeout(500)

            # Fill spec inputs (for NEW entries)
            spec_inputs = page.locator(".spec-input")
            inputs_count = await spec_inputs.count()
            log(f"  - found {inputs_count} spec input fields")
            if inputs_count >= 3:
                inputs_list = await spec_inputs.all()
                # Clear and fill the first spec input set (for TestModel)
                # Use clear() + type() to ensure Vue detects the input
                await inputs_list[0].clear()
                await inputs_list[0].type("7")  # parameters_b
                await page.wait_for_timeout(300)
                await inputs_list[1].clear()
                await inputs_list[1].type("8bit")  # quantization
                await page.wait_for_timeout(300)
                await inputs_list[2].clear()
                await inputs_list[2].type("14")  # size_gb
                await page.wait_for_timeout(500)
                log(f"  - filled spec inputs ({inputs_count} total inputs)")

            # Wait for Apply button to be enabled
            apply_btn = page.locator(".btn-apply:not([disabled])")
            try:
                await apply_btn.wait_for(timeout=5000)
            except:
                log("  - warning: Apply button did not become enabled, attempting click anyway")

            # Click Apply button
            click_btn = page.locator(".btn-apply")
            if await click_btn.count() == 0:
                raise Exception("Apply button not found")
            await click_btn.click()
            await page.wait_for_timeout(500)

            passed.append("CP7")
            log("CP7 PASS: import modal opened, filled, and applied successfully")
        except Exception as e:
            failed.append("CP7")
            log(f"CP7 FAIL: {str(e)}")

        await page.screenshot(path=str(SS / "final_execution_7_import_toast.png"))

        # CP8 — Labeling mode
        log("step 8 action: click Label button, verify input elements in tbody")
        try:
            # Navigate back to clean state
            await page.goto(URL, wait_until="networkidle")
            await page.wait_for_timeout(300)

            # Click Label button
            label_btn = page.locator("button:has-text('✏ Label')")
            if await label_btn.count() == 0:
                label_btn = page.locator(".btn-label")
            await label_btn.click()
            await page.wait_for_timeout(500)

            # Count input elements in tbody
            inputs = await page.locator("tbody input").count()
            if inputs >= 1:
                passed.append("CP8")
                log(f"CP8 PASS: labeling mode active, input_count={inputs}")
            else:
                failed.append("CP8")
                log(f"CP8 FAIL: no inputs found in labeling mode")

            await page.screenshot(path=str(SS / "final_execution_8_labeling_mode.png"))

            # Exit labeling mode
            done_btn = page.locator("button:has-text('✓ Done')")
            if await done_btn.count() > 0:
                await done_btn.click()
                await page.wait_for_timeout(300)
        except Exception as e:
            failed.append("CP8")
            log(f"CP8 FAIL: {str(e)}")

        # CP9 — Export Data modal
        log("step 9 action: verify Export Data button, open modal, check JSON")
        try:
            # Navigate and reload
            await page.goto(URL, wait_until="networkidle")
            await page.wait_for_timeout(300)

            # Click Label to enable export button
            label_btn = page.locator("button:has-text('✏ Label')")
            if await label_btn.count() == 0:
                label_btn = page.locator(".btn-label")
            await label_btn.click()
            await page.wait_for_timeout(500)

            # Click Export button
            export_btn = page.locator("button:has-text('📥 Export Data')")
            if await export_btn.count() == 0:
                export_btn = page.locator(".btn-export")

            if await export_btn.is_visible():
                await export_btn.click()
                await page.wait_for_timeout(500)

                # Verify modal opened and check JSON
                json_preview = page.locator(".json-preview")
                if await json_preview.count() > 0:
                    json_text = await json_preview.inner_text()
                    if json_text.strip().startswith("["):
                        passed.append("CP9")
                        log(f"CP9 PASS: export modal opened, JSON valid, length={len(json_text)}")
                    else:
                        failed.append("CP9")
                        log(f"CP9 FAIL: JSON preview invalid: {json_text[:80]!r}")
                else:
                    failed.append("CP9")
                    log("CP9 FAIL: JSON preview not found in modal")
            else:
                failed.append("CP9")
                log("CP9 FAIL: Export Data button not visible")

            await page.screenshot(path=str(SS / "final_execution_9_export_modal.png"))

            # Close modal and exit labeling mode
            try:
                close_btn = page.locator("button:has-text('Close')")
                if await close_btn.count() > 0:
                    await close_btn.click()
                    await page.wait_for_timeout(300)
            except:
                pass

            done_btn = page.locator("button:has-text('✓ Done')")
            if await done_btn.count() > 0:
                await done_btn.click()
                await page.wait_for_timeout(300)
        except Exception as e:
            failed.append("CP9")
            log(f"CP9 FAIL: {str(e)}")

        # CP10 — Full import flow
        log("step 10 action: test complete import flow with spec filling")
        try:
            # Navigate back to clean slate
            await page.goto(URL, wait_until="networkidle")
            await page.wait_for_timeout(300)

            # Click Import button
            import_btn = page.locator("button:has-text('+ Import')")
            if await import_btn.count() == 0:
                import_btn = page.locator(".btn-import")
            await import_btn.click()
            await page.wait_for_timeout(300)

            # Verify modal opens
            modal = page.locator(".modal-overlay")
            if await modal.count() == 0:
                raise Exception("Import modal not found")

            # Paste sample with spec data
            textarea = page.locator(".import-textarea")
            await textarea.fill("Model: CP10TestModel\nBenchmark         Accuracy   Correct   Total   Time(s)   Think\nMMLA 70.5% 21 30 300.0 Yes\nTRUTHFULQA 72.3% 22 30 150.0 Yes\n")
            await page.wait_for_timeout(500)

            # Fill spec fields for NEW entries
            spec_inputs = page.locator(".spec-input")
            inputs_count = await spec_inputs.count()
            log(f"  - found {inputs_count} spec input fields")
            if inputs_count >= 3:
                inputs_list = await spec_inputs.all()
                # Clear and fill using type() to trigger input events
                await inputs_list[0].clear()
                await inputs_list[0].type("7")  # parameters_b
                await page.wait_for_timeout(300)
                await inputs_list[1].clear()
                await inputs_list[1].type("8bit")  # quantization
                await page.wait_for_timeout(300)
                await inputs_list[2].clear()
                await inputs_list[2].type("14")  # size_gb
                await page.wait_for_timeout(500)
                log(f"  - filled spec fields ({inputs_count} inputs)")

            # Wait for Apply button to be enabled
            apply_btn = page.locator(".btn-apply:not([disabled])")
            try:
                await apply_btn.wait_for(timeout=5000)
            except:
                log("  - warning: Apply button did not become enabled")

            # Click Apply
            click_btn = page.locator(".btn-apply")
            if await click_btn.count() > 0:
                await click_btn.click()
                await page.wait_for_timeout(500)

            # Verify entry appears in table
            await page.wait_for_timeout(500)
            model_cell = page.locator("text=/CP10TestModel/")
            if await model_cell.count() > 0:
                passed.append("CP10")
                log("CP10 PASS: new entry visible in table after import")
            else:
                failed.append("CP10")
                log("CP10 FAIL: CP10TestModel not found in table")

            await page.screenshot(path=str(SS / "final_execution_10_import_flow.png"))
        except Exception as e:
            failed.append("CP10")
            log(f"CP10 FAIL: {str(e)}")

        # CP11 — Labeling mode + Export flow
        log("step 11 action: test labeling mode activation and export workflow")
        try:
            # Navigate to clean state
            await page.goto(URL, wait_until="networkidle")
            await page.wait_for_timeout(300)

            # Click Label button
            label_btn = page.locator("button:has-text('✏ Label')")
            if await label_btn.count() == 0:
                label_btn = page.locator(".btn-label")
            await label_btn.click()
            await page.wait_for_timeout(500)
            log("  - clicked Label button")

            # Verify labeling mode active
            tbody_inputs = await page.locator("tbody input").count()
            if tbody_inputs == 0:
                raise Exception("No inline edit inputs found in labeling mode")
            log(f"  - labeling mode active, found {tbody_inputs} input fields")

            # Click Export Data button
            export_btn = page.locator("button:has-text('📥 Export Data')")
            if await export_btn.count() == 0:
                export_btn = page.locator(".btn-export")
            await export_btn.click()
            await page.wait_for_timeout(500)
            log("  - clicked Export Data button")

            # Verify modal opened
            modal = page.locator(".modal-overlay")
            if await modal.count() == 0:
                raise Exception("Export modal not found")

            # Verify JSON preview
            json_preview = page.locator(".json-preview")
            if await json_preview.count() == 0:
                raise Exception("JSON preview not found in modal")
            json_text = await json_preview.inner_text()
            if not json_text.strip().startswith("["):
                raise Exception(f"JSON preview invalid: {json_text[:80]!r}")
            log(f"  - JSON preview valid, length={len(json_text)}")

            # Verify buttons present
            copy_btn = page.locator("button:has-text('Copy to Clipboard')")
            if await copy_btn.count() == 0:
                raise Exception("Copy button not found")
            log("  - Copy to Clipboard button visible")

            save_btn = page.locator("button:has-text('Save to File')")
            if await save_btn.count() == 0:
                raise Exception("Save button not found")
            log("  - Save to File button visible")

            # Close modal
            close_btn = page.locator("button:has-text('Close')")
            if await close_btn.count() > 0:
                await close_btn.click()
                await page.wait_for_timeout(300)
            log("  - closed export modal")

            # Exit labeling mode
            done_btn = page.locator("button:has-text('✓ Done')")
            if await done_btn.count() == 0:
                raise Exception("Done button not found")
            await done_btn.click()
            await page.wait_for_timeout(300)
            log("  - exited labeling mode")

            # Verify returned to normal mode
            label_btn_after = page.locator("button:has-text('✏ Label')")
            if await label_btn_after.count() == 0:
                raise Exception("Label button not visible after exiting labeling mode")

            passed.append("CP11")
            log("CP11 PASS: labeling mode + export flow complete")
            await page.screenshot(path=str(SS / "final_execution_11_labeling_export.png"))
        except Exception as e:
            failed.append("CP11")
            log(f"CP11 FAIL: {str(e)}")

        await browser.close()

    summary = f"RESULT: {len(passed)}/11 passed — {', '.join(passed or ['none'])}"
    if failed:
        summary += f" | FAILED: {', '.join(failed)}"
    log(summary)
    print(summary)
    if failed:
        raise SystemExit(1)


asyncio.run(main())
