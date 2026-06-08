# Phase 12 — Structure Alignment — SUMMARY

**Status:** ✅ Complete (executor + main-session spot-check) · **Reqs:** STR-01..05 done
**Commits:** 6220ae2 (data→public), dcd849c (index.html→root + vite.config), 1a93edd (delete app/), 8365e63 (CI paths), 8f56eed (CLAUDE.md docs)

- **STR-01** `index.html` at root, `/src/main.ts` entry; `root:'src'` removed from vite.config (publicDir/outDir defaults).
- **STR-02** data → real `public/data/*.json` + `public/settings.json` (git mv, history preserved); fetch paths `/data/*`,`/settings.json` still resolve.
- **STR-03** legacy vanilla `app/` deleted; symlinks gone; no duplicate data.
- **STR-04** validate-data.yml + ci-ui-validation.yml paths updated (app/→public//src/); cd-static.yml verified still valid; CLAUDE.md project docs rewritten for new layout.
- **STR-05** `vp dev` 5 rows/0 errors; `vp check` clean; `vp test` 36/36; `vp build` → `dist/` (index.html+assets+data+settings) OK.

**Side-effect:** `test.include` rebased `lib/**`→`src/lib/**`, `composables/**`→`src/composables/**` (needed after dropping root:'src'); verified 36/36.
**Flag (deferred):** stale doc comment in `src/lib/import.mjs:3` references deleted `app/index.html` — harmless, future cleanup.
