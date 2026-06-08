# Phase 09 — Deferred / Out-of-Scope Items

## D-09-1 (PRE-EXISTING, not introduced by Phase 09) — Labeling inputs do not pre-populate from entry data

**Discovered during:** Task 2 visual verification (Playwright capture).

**Symptom:** When entering labeling mode, the Params / Quant / Size inputs render
empty and the Deprecated/Opus/Sonnet/Haiku checkboxes render unchecked, even for
rows whose underlying data has values (e.g. `Qwen3.6-35B-A3B-TurboQuant-MLX-4bit`
has `parameters_b: 35`, `quantization: "4bit"`, `tiers.opus: true`).

**Causation confirmed PRE-EXISTING:** Reproduced identically on the baseline commit
`a312fca` (pre-Phase-09) in a throwaway worktree — the v1.0 stacked-panel labeling
UI showed the same empty inputs/unchecked boxes for the same model. `useLabeling.toggleLabelingMode`
builds `labelEdits[model] = { parameters_b: '35', tier_opus: true, ... }`, but those
initialized values are not reaching the bound inputs. The Phase-09 rework reused the
exact `labelEdits?.[entry.model]?.<field>` binding the plan instructed
("reuse the existing number input bound to labelEdits?.[entry.model]?.parameters_b"),
so behavior is unchanged — this is a latent v1.0 regression vs the original
`app/index.html` (which set `input.value = parent[key] ?? ''` directly from `entry.spec`).

**Impact:** Editing still works end-to-end — typing into a field populates `labelEdits`,
validation gates Export, commit applies edits, and export reflects them. The only gap is
that the *current* value isn't shown as a starting point, so a user editing one field of a
row with existing data would not see the other fields pre-filled.

**Out of scope for Phase 09** (per plan scope: "UI-internals realignment — no data/feature
change"; the plan explicitly told the executor to reuse the existing binding). Candidate
follow-up for the v1.1 backlog: wire `labelEdits` initialization through to the inputs
(likely a reactivity/prop-passing fix in `App.vue` `:labelEdits` or `useLabeling` init),
restoring the original pre-fill behavior.

## D-09-2 — Stale Playwright CP script (`outputs/ui-validation/final_script.py`)

Pre-dates the `e1ea66a` shadcn/Tailwind-v4 redesign. It aborts at CP2 on the removed
`.filter-group` selector (and CP1–CP6 are not wrapped in try/except, so the first stale
selector kills the whole run). Baseline and after both reach only CP1 PASS. The labeling
(CP8) and export (CP9/CP11) CPs are never exercised. Not a Phase-09 regression. Follow-up:
refresh all CP selectors to the current shadcn DOM (`outputs/ui-validation/phase09_labeling_capture.py`
added this phase already validates labeling + export with current selectors).
