# Phase 08 — Slider & Convention — CONTEXT

**Milestone:** v1.1 reka-ui Best-Practice Alignment
**Requirements:** SLIDER-01..05, CONV-01, CONV-02
**Status:** Pending → Planning

## Why this phase

The PARAMS filter slider is visibly broken (two disconnected empty circles, no track/fill — see user screenshot). It is the project's first and worst symptom of a deeper gap: `reka-ui` is a dependency but **entirely unused** — every interactive `ui/` widget is hand-rolled. This phase fixes the slider with the correct headless primitive and establishes "reka-ui for interactive widgets" as the project convention.

## Current broken implementation (the thing being replaced)

`src/components/FilterBar.vue` (~lines 47–74, script ~127–153): the PARAMS control is **two overlapping native `<input type="range">`** elements absolutely-positioned on top of each other, styled ONLY with `::-webkit-slider-*` pseudo-elements. Failure mode: no connected track, no filled range between thumbs, thumbs render as empty circles on WebKit. This is the hand-rolled anti-pattern.

Relevant existing contract that MUST be preserved:
- Props in: `paramsMinIdx: number`, `paramsMaxIdx: number`, `parametersBreakpoints: number[]`.
- Emits out: `update:paramsMinIdx`, `update:paramsMaxIdx` (both `number`).
- Local mirror refs `paramsMinIdxLocal` / `paramsMaxIdxLocal`, `immediate` watchers sync props→local, and a swap watcher prevents min>max (emits swapped values).
- Label helper `paramsLabelAt(idx)`: returns `Inf` when `idx >= breakpoints.length`, else `${breakpoints[idx]}B`. The slider domain is index-based: `0 … breakpoints.length` (inclusive upper = "Inf").

## Target implementation

Create `src/components/ui/slider.vue` — a reusable component built on reka-ui:

```vue
<SliderRoot v-model="model" :min :max :step :min-steps-between-thumbs>
  <SliderTrack class="…track…">
    <SliderRange class="…filled range…" />
  </SliderTrack>
  <SliderThumb v-for="(_, i) in model" :key="i" class="…thumb…" />
</SliderRoot>
```

reka-ui Slider facts (verified — all four exports present in `reka-ui@2.9.9`):
- `v-model` / `modelValue` is `number[]`. Array length = thumb count. Two-thumb range = `[min, max]`.
- Props: `min`, `max`, `step`, `minStepsBetweenThumbs`, `orientation`, `dir`, `disabled`, `inverted`.
- `SliderRange` is the filled segment between thumbs; `SliderTrack` is the rail; one `SliderThumb` per model entry.
- Keyboard a11y (arrow keys move focused thumb, Home/End) and aria come for free — no extra code.

Component API (keep it minimal, cva-styled, matching shadcn-vue conventions already in `ui/button.vue`/`ui/badge.vue`):
- Props: `modelValue: number[]`, `min?: number`, `max?: number`, `step?: number`, `minStepsBetweenThumbs?: number`, `class?: string`.
- Emit: `update:modelValue` (number[]) for `v-model`.
- Use `cn()` from `@/lib/utils` for class merging; primary-coloured range + thumbs, bordered track, to match the intended v1.0 design.

Then rewire `FilterBar.vue`'s PARAMS block to use `<UiSlider v-model="paramsRange" :min="0" :max="parametersBreakpoints.length" :step="1" />` where `paramsRange` is a computed `[paramsMinIdxLocal, paramsMaxIdxLocal]` that, on update, emits `update:paramsMinIdx`/`update:paramsMaxIdx` (lower value → min, higher → max, preserving the existing swap-guard behaviour). Keep the `0B … Inf` labels on either side.

## Constraints / invariants

- **Preserve the emit contract** — `App.vue`/`useFilters` consume `update:paramsMinIdx`/`update:paramsMaxIdx`; do not change FilterBar's public props/emits.
- **Filtering behaviour unchanged** — same index→breakpoint mapping; min cannot exceed max.
- **cva + `cn()` + `VariantProps`** stay the styling contract. Do NOT introduce jen-lab's `App*` shim / manual variant maps.
- **Serverless static SPA** — no SSR concerns for slider (client interactive); Node ≥24, Vite+ (`vp dev`/`vp test`).
- Existing **Vitest** suite + **Playwright UI-validation** checkpoints must stay green.

## Convention deliverable (CONV-01/02)

Document in `CLAUDE.md`: "**reka-ui headless primitives for interactive widgets** (slider, dialog, select, …); **plain cva-styled elements for leaf components** (input/textarea/label/card). Styling contract is `cva` + `VariantProps` + `cn()` — no `App*` shim, no manual variant maps." The slider is the first instance setting this precedent; Phase 09 follows it for dialog/select.

## Success criteria (observable)

1. PARAMS slider renders a visible rail, a filled range between two thumbs, and two draggable thumbs — no native `input[type=range]`/`::-webkit-*` left in FilterBar.
2. Dragging either thumb filters rows identically to before; min cannot cross above max; `0B … Inf` labels track the thumbs.
3. Keyboard: focus a thumb, arrow keys move it (reka-ui a11y).
4. `cva`/`cn` conventions intact; no `App*` pattern introduced.
5. `CLAUDE.md` documents the interactive-vs-leaf convention.
6. Existing Vitest + Playwright UI-validation green.

## Out of scope (this phase)

Dialog/Select migration (Phase 09), leaf-component rewrites, Storybook/Velite/auto-imports, any data/feature change.
