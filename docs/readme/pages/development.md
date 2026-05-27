# Development

Usually, there is no need to run this repository because the important thing is the data, not the website.
The following guide is therefore for my own personal development.

## Dev server

```bash
make serve            # vp dev on http://localhost:8080
make serve PORT=3000  # custom port
```

Open `http://localhost:8080/app/` in your browser.

## Testing

```bash
make test             # runs vp test (Vitest)
```

Tests live in `app/lib/**/*.test.mjs`.

## Notes

- Do **not** run `vp build` — the site is serverless and ships `app/` directly via GitHub Pages.
- The full toolchain (Vite+, Vitest, pnpm) is only needed for tests. Browsing the site only needs `make serve`.
