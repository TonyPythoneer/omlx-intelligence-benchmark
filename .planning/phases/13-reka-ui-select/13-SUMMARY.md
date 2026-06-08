# Phase 13 — reka-ui Select — SUMMARY

**Status:** ✅ Complete · **Reqs:** SEL-01..03 done
**Commits:** 067d0cc (ui/select reka-ui), 23fa820 (DeviceSelector→SelectItems), c566ff4 (convention), bc3ca6c (verify script)

- **SEL-01** `ui/select.vue` rebuilt on reka-ui `Select*` (+ new `ui/select-item.vue`), cva/cn styled; no native `<select>`.
- **SEL-02** DeviceSelector uses UiSelect/UiSelectItem; public API (`devices`/`modelValue`/`update:modelValue`) unchanged; App.vue untouched.
- **SEL-03** CLAUDE.md convention updated — slider+dialog+select all on reka-ui; native-select carve-out removed.
- Verified: `vp check` clean (31 files), `vp test` 36/36, headless — 0 native selects, role=combobox, dropdown opens/selects, 5 rows, 0 pageerrors. Screenshot: final_runs/phase13/dropdown_open.png.
