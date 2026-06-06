---
phase: 07-parity-ci-swap
plan: 03
status: completed
wave: 2
---

## Summary

All three tasks completed successfully. Vue SPA build verified, CI/CD updated, dev workflow confirmed.

## Task 1: Build Vue SPA locally

- Build command: `node_modules/.bin/vp build` (vite-plus wraps vite; `pnpm exec vite` binary not exposed directly)
- Output: `dist/index.html` (0.83 kB gzip 0.49 kB), `dist/assets/index-*.css` (12 kB), `dist/assets/index-*.js` (91 kB gzip 33 kB)
- 34 modules transformed in 149ms
- `public/data → ../app/data` and `public/settings.json → ../app/settings.json` symlinks were already set up; data files correctly copied to `dist/data/`

## Task 2: Update cd-static.yml

Added 4 new steps between Setup Pages and Upload artifact:
- `Set up Node.js` (actions/setup-node@v4, node 24)
- `Install pnpm` (pnpm/action-setup@v3, version 11)
- `Install packages` (pnpm install --frozen-lockfile)
- `Build Vue SPA` (pnpm exec vp build)

Changed artifact path from `'app'` to `'dist'`. Step renamed to "Upload Vue SPA artifact".

## Task 3: Dev workflow verification

- `pnpm test`: 35/35 tests pass (3 test files)
- `make serve` (vp dev): starts Vue SPA on localhost:8080 ✅
- `ci-ui-validation.yml` paths updated from `app/**/*.{html,js,mjs}` to `src/**`, `app/lib/**`, `app/data/**`
- Playwright 11/11 CPs pass (verified in separate 07-01 fix session)

## Atomic swap status

Vue SPA is the production version. `dist/` is the GitHub Pages deployment source.
