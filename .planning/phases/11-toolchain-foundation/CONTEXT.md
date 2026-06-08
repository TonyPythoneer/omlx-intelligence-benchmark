# Phase 11 — Toolchain Foundation Alignment — CONTEXT

**Milestone:** v1.2 · **Requirements:** FND-01..05
**Reference (target foundation):** `/Users/tonyyang/git/personal/my-vp-app-project` (the canonical `vp project example`).

## Goal
Make this project's toolchain config/foundation match the vp example — while keeping the Vue SPA additions (vue + tailwind plugins, `@` alias) the starter doesn't have. **Structure moves (index.html→root, data→public, delete app/) are Phase 12 — NOT this phase. Keep `root: 'src'` for now.**

## Target vs current (the delta)

### vite.config.ts
- **Target import:** `import { defineConfig } from "vite-plus"` (NOT `"vite"`).
- **Add the vp blocks** from the example: `staged: { "*": "vp check --fix" }`, `fmt: {}`, `lint: { jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }], rules: { "vite-plus/prefer-vite-plus-imports": "error" }, options: { typeAware: true, typeCheck: true } }`.
- **KEEP (app needs these):** `plugins: [tailwindcss(), vue()]`, `resolve.alias` `@`→src, `server: { port: 8080, host: 'localhost' }`, `build: { outDir: '../dist', emptyOutDir: true }`, `root: 'src'`, `publicDir: '../public'`, `test: { include: [...], globals: true }`. vite-plus `defineConfig` is a superset of vite config, so plugins/resolve/server/build/test all still apply. If vite-plus typing rejects a field, keep functionality (it's a wrapper around vite).
- Drop the `/// <reference types="vitest" />` if `vite-plus/client` types cover it.

### tsconfig.json — adopt the example's options, adapted for Vue
Example uses: target es2023, module esnext, lib ["ES2023","DOM"], `types: ["vite-plus/client"]`, skipLibCheck, moduleResolution bundler, allowImportingTsExtensions, verbatimModuleSyntax, moduleDetection force, noEmit, noUnusedLocals, noUnusedParameters, erasableSyntaxOnly, noFallthroughCasesInSwitch, include ["src"].
- **Adapt for Vue:** add `"DOM.Iterable"` to lib if used; keep `resolveJsonModule` (settings.json import? check), keep the Vue SFC shim working — `types` should be `["vite-plus/client"]`; KEEP `src/vite-env.d.ts` `declare module '*.vue'`. Keep `jsx: preserve` only if something needs it (likely not — Vue SFCs don't). include must cover `.vue` → use `"include": ["src"]` (covers .vue).
- `tsconfig.node.json`: the example has none. Our `vite.config.ts` needs typing. Simplest: fold vite config typing in or keep a minimal `tsconfig.node.json` if `tsc` (used by `build: tsc && vp build`) needs it. Prefer matching the example (single tsconfig) if `vp check`/`tsc` stays green.

### package.json scripts
- `dev: vp dev`, `build: tsc && vp build`, `preview: vp preview`, `prepare: vp config`, `test: vp test` (keep). (Current `build` is just `vp build` — add the `tsc &&` prefix like the example.)

### Foundation files
- Run `vp config` (the `prepare` script) to generate `.vite-hooks/` git hooks (the example has `.vite-hooks/pre-commit` + `.vite-hooks/_/…`).
- Add `.zed/settings.json` matching the example's (read `/Users/tonyyang/git/personal/my-vp-app-project/.zed/settings.json`).
- Ensure `CLAUDE.md` has the `<!--VITE PLUS START-->…<!--VITE PLUS END-->` block (read the example's; prepend/merge it into the existing CLAUDE.md without losing the project-specific content).

## FND-05 — the fallout (expect real work)
Switching to `vite-plus` defineConfig activates **oxlint typeAware + typeCheck + `prefer-vite-plus-imports`**, and the strict tsconfig adds **verbatimModuleSyntax / erasableSyntaxOnly / noUnusedLocals / noUnusedParameters**. The existing Vue/TS source will throw lint+type errors:
- `verbatimModuleSyntax` → type-only imports must use `import type`.
- `prefer-vite-plus-imports` → imports from `vite`/`vitest` should come from `vite-plus`/the vp test pkg.
- `noUnusedLocals/Parameters` → remove unused.
Run `vp check --fix` first (auto-fixes format + some lint), then fix the rest by hand until `vp check` is clean. Then `vp test` must still be green (36/36) and `vp dev` must still render the app.

## Constraints / invariants
- Do NOT move structure (Phase 12). Keep `root:'src'`, `public/` symlinks, `app/` — untouched this phase.
- App must still run (`vp dev` :8080) and tests green (`vp test` 36/36) at phase end.
- Atomic commits. Branch `feat/vue-vite-static-site` — do not switch branches.

## Success criteria
1. `vite.config.ts` imports `defineConfig` from `vite-plus` with staged/fmt/lint blocks; vue+tailwind+alias retained.
2. `tsconfig.json` matches the example's compiler options (vp client types, strict bundler options) adapted for Vue; SFC shim intact.
3. `package.json` scripts match the example (`build: tsc && vp build`, `prepare: vp config`).
4. `.vite-hooks/` generated, `.zed/settings.json` added, CLAUDE.md has the VITE PLUS block.
5. `vp check` clean (0 errors); `vp test` 36/36 green; `vp dev` renders the app + loads data.
