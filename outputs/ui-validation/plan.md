# Critical Points

- [ ] CP1: Page loads at http://localhost:8080/ — <tbody> has ≥1 data rows
- [ ] CP2: Tier filter → click "Opus" — visible non-deprecated rows ≤ initial count
- [ ] CP3: Metrics filter → click "Advanced" — subgroup-row contains "HUMANEVAL", not "MMLU"
- [ ] CP4: Model search "Qwen3.6" → visible row count ≥ 1
- [ ] CP5: Show Deprecated checkbox checked → tbody tr.deprecated-row count ≥ 1
- [ ] CP6: Click Params header → first row Params text changes from initial value
- [ ] CP7: Import modal → paste sample stdout → Apply → #toast.show contains "Applied"
- [ ] CP8: Click ✏ Edit (labeling mode) → tbody contains <input> elements
- [ ] CP9: #export-data visible after import → click → #export-modal.show → JSON starts with "["
