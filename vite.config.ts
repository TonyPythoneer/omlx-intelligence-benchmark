import { defineConfig } from "vite-plus";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    // Scope to the Vue SPA + root config; the legacy static site (app/),
    // generated output (dist/), and project docs/planning are out of scope
    // for this toolchain (structure migration is a later phase).
    ignorePatterns: [
      "app/**",
      "dist/**",
      "docs/**",
      "scripts/**",
      "outputs/**",
      ".planning/**",
      ".agents/**",
      ".claude/**",
      ".superpowers/**",
      ".venv/**",
      ".github/**",
    ],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [
      "app/**",
      "dist/**",
      "docs/**",
      "scripts/**",
      "outputs/**",
      ".planning/**",
      ".agents/**",
      ".claude/**",
      ".superpowers/**",
      ".venv/**",
      ".github/**",
    ],
  },
  root: "src",
  publicDir: "../public",
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  server: {
    port: 8080,
    host: "localhost",
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    include: ["lib/**/*.test.mjs", "composables/**/*.test.ts"],
    globals: true,
  },
});
