#!/usr/bin/env node
/**
 * Render composed "scenes" (multi-emoji illustration strings like 🐶🌳⚽) the
 * same way components/player/Glyph.tsx composes them, so the ground-line
 * alignment and sizing can be reviewed. Usage:
 *   node scripts/scene-render.mjs <scenes.json> <out.png> [cols]
 *   scenes.json: [{ "emoji": "🐶🌳⚽", "label": "opíš obrázok" }, …]
 */
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const gsSrc = readFileSync(join(here, "../components/player/glyph-set.ts"), "utf8");
const GLYPH = {};
for (const m of gsSrc.matchAll(/\n\s*"([^"]+)":\s*`([\s\S]*?)`,/g)) GLYPH[m[1]] = m[2];

const CLUSTER_RE =
  /\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}️⃣])*/gu;
const norm = (e) => e.replace(/️/g, "");
const lookup = (e) => GLYPH[e] ?? GLYPH[norm(e)];
const split = (s) => s.match(CLUSTER_RE) ?? [];

const [, , scenesPath, outPath, colsArg] = process.argv;
const scenes = JSON.parse(readFileSync(scenesPath, "utf8"));
const cols = Number.parseInt(colsArg ?? "4", 10) || 4;
const base = 132;

const cells = scenes
  .map((s) => {
    const parts = split(s.emoji);
    const partSize = Math.round(base * (parts.length === 2 ? 0.82 : 0.66));
    const glyphs = parts
      .map((p) => {
        const art = lookup(p);
        return art
          ? `<svg viewBox="0 0 64 64" width="${partSize}" height="${partSize}">${art}</svg>`
          : `<span style="font-size:${partSize * 0.84}px">${p}</span>`;
      })
      .join("");
    return `<figure><div class="card"><span class="scene">${glyphs}</span></div>
      <figcaption>${(s.label || s.emoji).replace(/</g, "&lt;")}</figcaption></figure>`;
  })
  .join("\n");

const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#efe9dc;font:13px -apple-system,Segoe UI,Roboto,sans-serif;color:#5a5348}
  .grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;padding:24px;max-width:${cols * 230}px;margin:0 auto}
  figure{margin:0;text-align:center}
  .card{background:#fbf7ee;border:1px solid #e0d8c8;border-radius:18px;min-height:180px;padding:18px;
    display:grid;place-items:center;box-shadow:0 1px 2px rgba(40,34,26,.05),0 16px 34px -24px rgba(40,34,26,.3)}
  .scene{display:inline-flex;align-items:flex-end;justify-content:center;gap:8px;flex-wrap:wrap}
  figcaption{margin-top:7px;font-size:13px;font-weight:600}
</style><div class="grid">${cells}</div>`;

const dir = mkdtempSync(join(tmpdir(), "scenesheet-"));
const htmlPath = join(dir, "sheet.html");
writeFileSync(htmlPath, html);
const rows = Math.ceil(scenes.length / cols);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: cols * 230 + 48, height: rows * 230 + 60 },
  deviceScaleFactor: 2,
});
await page.goto("file://" + htmlPath);
await page.waitForTimeout(300);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`rendered ${scenes.length} scenes → ${outPath}`);
