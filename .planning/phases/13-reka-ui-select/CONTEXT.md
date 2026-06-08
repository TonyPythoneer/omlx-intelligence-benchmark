# Phase 13 — reka-ui Select — CONTEXT

**Milestone:** v1.2 · **Requirements:** SEL-01..03
**Goal:** Migrate `ui/select.vue` from native `<select>` to reka-ui `Select*` primitives (user: "ui 都用 reka-ui" — overrides the earlier keep-native decision). Preserve `DeviceSelector`'s public API and behaviour.

## Current state
- `src/components/ui/select.vue`: wraps a native `<select>`. Props `modelValue?: string`, `class?`, `disabled?`. Emit `update:modelValue`. Default slot = `<option>` children. ChevronDown icon overlay.
- `src/components/DeviceSelector.vue`: uses `<UiSelect :modelValue @update:modelValue>` with children `<option value="">— Select Device —</option>` + `<option v-for="(meta,key) in devices" :value="key">{{ key }}: {{ meta.family }} {{ meta.variant }} ({{ meta.memory }}, {{ meta.gpus }} GPUs)</option>`. Public props: `devices: Record<string,DeviceMeta>`, `modelValue: string`. Emit `update:modelValue`.
- App.vue: `<DeviceSelector :devices :modelValue @update:modelValue>` selects the active device → drives data fetch. Must keep working identically.

## reka-ui Select anatomy (all exported by reka-ui@2.9.9)
```
SelectRoot (v-model / :modelValue + @update:modelValue, :disabled)
  SelectTrigger (the button; cva-styled like the old trigger, with ChevronDown via SelectIcon)
    SelectValue (placeholder="— Select Device —"; shows selected label)
  SelectPortal
    SelectContent (popover; position="popper")
      SelectViewport
        SelectItem (:value=key) > SelectItemText {{ label }} ; SelectItemIndicator (check)
```
Notes: reka-ui Select shows the SELECTED ITEM'S text in the trigger via `SelectValue`. With an `<option value="">` placeholder pattern, model `''` should show the placeholder — reka-ui uses `SelectValue placeholder` when no value; an empty-string item is awkward, so represent "no device" via placeholder (don't render an empty-value item, or handle it). Preserve current behaviour: App sets a default device, so a value is usually present.

## Design approach (keep cva conventions, no App* shim)
- Rebuild `ui/select.vue` as the Root+Trigger+Value+Content shell: props `modelValue`, `disabled`, `placeholder?`, `class?`; emit `update:modelValue`; default slot for items. cva/`cn()` styling matching the old trigger (h-9, border-input, rounded-md, focus ring, ChevronDown).
- Add `src/components/ui/select-item.vue` wrapping `SelectItem` + `SelectItemText` + indicator; prop `value`, default slot for label.
- `DeviceSelector.vue`: replace `<option>`s with `<UiSelect :modelValue :placeholder="'— Select Device —'" @update:modelValue>` + `<UiSelectItem v-for="(meta,key) in devices" :value="key">{{ key }}: … </UiSelectItem>`. Keep its public props/emit unchanged.

## Constraints / invariants
- DeviceSelector public API (`devices`, `modelValue` props; `update:modelValue` emit) UNCHANGED — App.vue untouched.
- Device selection works identically (selecting a device updates the table data); keyboard + aria via reka-ui.
- cva + `cn()` styling contract; no App* shim. `vp check` clean (the strict vite-plus lint is active now — use `import type`, no unused). `vp test` 36/36. `vp dev` renders + device dropdown works.
- SEL-03: update CLAUDE.md "UI component conventions" — remove the "native select retained" carve-out; state all interactive widgets (slider, dialog, select) are on reka-ui. Keep the note that native HTML controls remain valid for genuinely leaf inputs, but select is now reka-ui.
- Branch feat/vue-vite-static-site; no branch switch. Atomic commits.

## Success criteria
1. `ui/select.vue` (+ `ui/select-item.vue`) built on reka-ui `Select*`, cva-styled; no native `<select>`.
2. `DeviceSelector` uses them with `SelectItem`s; public API preserved; selecting a device updates the table (verify headless: open dropdown, pick a device, data/rows respond; or at least the trigger reflects selection and `update:modelValue` fires).
3. CLAUDE.md convention updated (SEL-03).
4. `vp check` clean; `vp test` 36/36; `vp dev` :8080 works, 0 pageerrors.
