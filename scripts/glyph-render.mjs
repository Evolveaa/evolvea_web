#!/usr/bin/env node
/**
 * Render a set of custom glyphs to a PNG contact sheet for visual review.
 *
 * Usage: node scripts/glyph-render.mjs <entries.json> <out.png> [cols]
 *   entries.json: [{ "emoji": "🍎", "label": "jablko", "svg": "<g>…</g>" }, …]
 *     "svg" is the inner markup of an <svg viewBox="0 0 64 64">.
 *   Renders each on the app's exercise-card background (light) at ~72px so the
 *   editorial-line style can be judged in context. Lives in scripts/ so
 *   `playwright` resolves from the repo's node_modules.
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const [, , entriesPath, outPath, colsArg] = process.argv;
if (!entriesPath || !outPath) {
  console.error("usage: node scripts/glyph-render.mjs <entries.json> <out.png> [cols]");
  process.exit(1);
}
const entries = JSON.parse(readFileSync(entriesPath, "utf8"));
const cols = Number.parseInt(colsArg ?? "6", 10) || 6;

const cells = entries
  .map(
    (e) => `<figure><div class="card"><svg viewBox="0 0 64 64">${e.svg}</svg></div>
    <figcaption>${(e.label || e.emoji || "").replace(/</g, "&lt;")}</figcaption></figure>`,
  )
  .join("\n");

const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#efe9dc;font:13px -apple-system,Segoe UI,Roboto,sans-serif;color:#5a5348}
  .grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;padding:22px;max-width:${cols * 132}px;margin:0 auto}
  figure{margin:0;text-align:center}
  .card{background:#fbf7ee;border:1px solid #e0d8c8;border-radius:16px;aspect-ratio:1;
    display:grid;place-items:center;box-shadow:0 1px 2px rgba(40,34,26,.05),0 14px 30px -22px rgba(40,34,26,.3)}
  .card svg{width:74%;height:74%}
  figcaption{margin-top:5px;font-size:12px}
</style><div class="grid">${cells}</div>`;

const dir = mkdtempSync(join(tmpdir(), "glyphsheet-"));
const htmlPath = join(dir, "sheet.html");
writeFileSync(htmlPath, html);

const rows = Math.ceil(entries.length / cols);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: cols * 132 + 44, height: rows * 150 + 60 },
  deviceScaleFactor: 2,
});
await page.goto("file://" + htmlPath);
await page.waitForTimeout(300);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`rendered ${entries.length} glyphs → ${outPath}`);
