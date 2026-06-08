// Reports the initial download weight of the built app.
//
// Each dist/<page>.html lists the JS and CSS it loads up front (the entry
// script, its modulepreload links, and stylesheets). Summing those files —
// raw and gzipped — gives the real "what does this page cost" number.
// This app is a single-page SPA, so there is normally one row (index.html).
//
// Run after a build: `pnpm bundle:report` (= vp build && node scripts/bundle-report.ts).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = "dist";
const ASSET_RE = /(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g;

const kb = (bytes: number) => (bytes / 1024).toFixed(1) + " KB";

interface Row {
  page: string;
  jsRaw: number;
  cssRaw: number;
  jsGz: number;
  cssGz: number;
  totalGz: number;
}

const rows: Row[] = readdirSync(DIST)
  .filter((f) => f.endsWith(".html"))
  .map((html) => {
    const text = readFileSync(join(DIST, html), "utf8");
    const assets = new Set<string>();
    for (const match of text.matchAll(ASSET_RE)) assets.add(match[1]!);

    let jsRaw = 0;
    let cssRaw = 0;
    let jsGz = 0;
    let cssGz = 0;
    for (const asset of assets) {
      const path = join(DIST, asset);
      let buf: Buffer;
      try {
        buf = readFileSync(path);
      } catch {
        continue; // referenced asset missing — skip rather than crash the report
      }
      const gz = gzipSync(buf).length;
      if (asset.endsWith(".css")) {
        cssRaw += buf.length;
        cssGz += gz;
      } else {
        jsRaw += buf.length;
        jsGz += gz;
      }
    }
    return { page: html, jsRaw, cssRaw, jsGz, cssGz, totalGz: jsGz + cssGz };
  })
  .sort((a, b) => b.totalGz - a.totalGz);

// `--json` emits the raw rows so a later build can be diffed against this one.
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows));
} else {
  const header =
    "Page".padEnd(16) +
    "JS (raw/gz)".padStart(20) +
    "CSS (raw/gz)".padStart(20) +
    "Total gz".padStart(12);
  console.log("\nInitial load weight (gzipped where noted):\n");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const row of rows) {
    console.log(
      row.page.padEnd(16) +
        `${kb(row.jsRaw)} / ${kb(row.jsGz)}`.padStart(20) +
        `${kb(row.cssRaw)} / ${kb(row.cssGz)}`.padStart(20) +
        kb(row.totalGz).padStart(12),
    );
  }
  const totalGz = rows.reduce((s, r) => s + r.totalGz, 0);
  console.log("-".repeat(header.length));
  console.log("TOTAL".padEnd(56) + kb(totalGz).padStart(12) + "\n");
}
