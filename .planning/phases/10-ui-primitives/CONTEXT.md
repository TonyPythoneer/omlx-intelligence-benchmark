# Phase 10 — UI Primitives (Dialog + Select) — CONTEXT

**Milestone:** v1.1 reka-ui Best-Practice Alignment
**Requirements:** UIPRIM-01, UIPRIM-02 (revised), UIPRIM-03
**Status:** Pending → Planning

## Scope decision (autonomous judgment — flagged for user override)

- **Dialog → reka-ui: MIGRATE.** `ui/dialog.vue` is hand-rolled (Teleport + backdrop + Transition) with **no focus-trap, no Escape-to-close, no scroll-lock, no aria**. reka-ui `Dialog*` provides all of these for free. Both consumers (`ImportModal`, `ExportModal`) benefit. **UIPRIM-01.**
- **Select → KEEP NATIVE (revised UIPRIM-02).** `ui/select.vue` wraps a **native `<select>`**, which is already fully accessible (keyboard, type-ahead, screen-reader, native mobile picker) with zero custom code. Replacing it with a reka-ui custom listbox is more code + more risk for one device dropdown, with no real a11y gain. A native HTML control is *using the platform*, not hand-rolling — consistent with the convention's spirit. **Decision: retain native `<select>`; do not migrate.** Amend the CLAUDE.md convention to clarify native HTML controls (`<select>`, `<input>`) are acceptable; the rule targets CUSTOM widgets that would otherwise be hand-rolled from divs (like the broken slider).

## Current dialog implementation

`src/components/ui/dialog.vue` — hand-rolled:
- Props: `open?: boolean`, `title?: string`, `class?: string`. Emit: `close`. Slots: default + `footer`.
- `<Teleport to="body">` + `<Transition name="dialog">`; backdrop `@click="$emit('close')"`; panel with header (title + X close button), scrollable body slot, optional footer slot.
- Missing: focus-trap, Escape-to-close, body-scroll-lock, aria roles/labelling.

**Consumers (public API to preserve byte-for-byte):**
- `ImportModal.vue` and `ExportModal.vue` use `<UiDialog :open=... title=... @close=...>` with default slot content and (Export) a `#footer` slot. Confirm exact prop/slot usage before editing.

## Target dialog implementation (reka-ui)

Rebuild `ui/dialog.vue` on reka-ui `Dialog*` while keeping the SAME public API (`open`/`title`/`class` props, `close` emit, default + `footer` slots) so consumers don't change:

```
DialogRoot (:open="open" @update:open="(v)=>!v && emit('close')")
  DialogPortal
    DialogOverlay (backdrop, cva styling)
    DialogContent (panel; focus-trap + Escape + aria automatic; @escapeKeyDown/@pointerDownOutside → emit close OR rely on update:open)
      DialogTitle ({{ title }})
      DialogClose (X button) — or a plain button emitting close
      <slot />
      <slot name="footer" />
```
- reka-ui `Dialog` is controlled via `open` + `@update:open`. Map `update:open(false)` → `emit('close')` so the existing `@close` contract is preserved. Keep cva/`cn()` styling identical to current (rounded-xl, max-w-2xl, border, shadow, backdrop blur).
- Verify reka-ui exports: `DialogRoot`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogClose` (all present in reka-ui@2.9.9).
- Keep the body-scroll-lock that reka-ui provides; remove the manual Teleport/Transition (reka-ui `DialogPortal` teleports; add a `Transition`/`:forceMount` only if a fade is desired — current fade is 0.15s opacity, optional to preserve).

## Constraints / invariants

- **Consumer APIs unchanged** — `ImportModal`, `ExportModal`, `DeviceSelector`, `FilterBar` must work identically.
- **cva/cn conventions** intact; serverless static SPA; Node ≥24; Vite+ (`vp dev`/`vp test`), do not run `vp build`.
- Existing **Vitest** green; **Playwright** UI-validation zero NEW failures vs baseline (CP script already stale pre-redesign — don't rewrite; flag).
- No data / feature / JSON change.

## Success criteria (observable)

1. `ui/dialog.vue` is backed by reka-ui `Dialog*`; Import and Export modals open and close (X button, backdrop/outside-click, **Escape key**) identically; focus is trapped inside the open modal; body scroll is locked while open.
2. `ui/select.vue` remains the native-`<select>` wrapper (decision documented); `DeviceSelector` selects a device identically.
3. CLAUDE.md convention amended to clarify native HTML controls are acceptable; cva/cn contract intact, no App* shim.
4. Vitest green; Playwright zero new failures vs baseline.

## Out of scope

Slider (Phase 08), labeling (Phase 09), select→reka-ui migration (deliberately retained native), leaf component rewrites, any tooling additions.
