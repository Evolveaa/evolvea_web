#!/usr/bin/env node
/**
 * Evolvea promo video — renderer.
 *
 * scene.html je deterministická animácia: window.__seek(t) nastaví celú scénu
 * do stavu pre sekundu t. Tento skript otvorí scénu v headless Chromiu,
 * odfotí každú snímku a poskladá z nich MP4 cez ffmpeg.
 *
 *   node tools/promo-video/render.mjs                       # plné 1080p60
 *   node tools/promo-video/render.mjs --fps=12 --scale=.5    # rýchly náhľad
 *   node tools/promo-video/render.mjs --stills=1.5,9,21,30   # kontrolné snímky
 *   node tools/promo-video/render.mjs --from=18 --to=28      # len úsek
 *   node tools/promo-video/render.mjs --scene=scene-simple.html  # iná verzia
 *   node tools/promo-video/render.mjs --blur=3               # pohybové rozostrenie
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const MIME = { '.html':'text/html; charset=utf-8', '.ttf':'font/ttf', '.css':'text/css', '.js':'text/javascript' };

const argv = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));

const FPS    = Number(argv.fps ?? 60);
const WORKERS = Math.max(1, Number(argv.workers ?? Math.min(8, Math.max(1, os.cpus().length - 2))));
const SCALE  = Number(argv.scale ?? 1);
const OUT    = argv.out ?? path.join(DIR, 'out', 'evolvea-demo.mp4');
const STILLS = argv.stills ? String(argv.stills).split(',').map(Number) : null;
const KEEP   = !!argv.keep;
const SCENE  = String(argv.scene ?? 'scene.html');   // ktorá verzia sa renderuje
/* Pohybové rozostrenie: renderujeme SUB medzisnímok na každú výslednú snímku
   a ffmpeg ich spriemeruje (tmix). To je presne to, čo robí uzávierka kamery —
   bez toho pôsobí rýchly pohyb trhane. SUB=3 je dobrý kompromis. */
const SUB = Math.max(1, Math.round(Number(argv.blur ?? 1)));

function serve(root) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'scene.html';
      const file = path.join(root, rel);
      if (!file.startsWith(root) || !fs.existsSync(file)) { res.statusCode = 404; return res.end('nope'); }
      res.setHeader('content-type', MIME[path.extname(file)] ?? 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

const run = (cmd, args) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('close', c => (c === 0 ? res() : rej(new Error(`${cmd} skončil s kódom ${c}`))));
});

const { srv, port } = await serve(DIR);
const LAUNCH = {
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--hide-scrollbars', '--font-render-hinting=none'],
};

/** Jeden pracovník = VLASTNÁ inštancia prehliadača. Jedna inštancia snímkovanie
 *  serializuje (screenshot ide cez browser proces), takže viac stránok v jednom
 *  prehliadači nezrýchli nič — merané 2,4 → 2,8 fps. Samostatné procesy áno.
 *  Scéna je čistá funkcia času, takže sa dá renderovať po nesúvislých úsekoch
 *  a výsledok je bitovo rovnaký. */
async function newWorker() {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
  await page.goto(`http://127.0.0.1:${port}/${SCENE}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30_000 });
  return { browser, page };
}

const probeW = await newWorker();
const probe = probeW.page;
const workers = [probeW];
const DURATION = await probe.evaluate(() => window.__duration);
const FROM = Number(argv.from ?? 0);
const TO   = Number(argv.to ?? DURATION);

const shoot = async (page, t, file) => {
  await page.evaluate(x => window.__seek(x), t);
  await page.screenshot({ path: file, type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
};

if (STILLS) {
  const dir = path.join(DIR, 'out', 'stills');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const t of STILLS) await shoot(probe, t, path.join(dir, `t${String(t).replace('.', '_')}s.png`));
  console.log(`✔ ${STILLS.length} kontrolných snímok → ${dir}`);
} else {
  const frames = path.join(DIR, 'out', 'frames');
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });

  const total = Math.round((TO - FROM) * FPS * SUB);
  while (workers.length < WORKERS) workers.push(await newWorker());
  console.log(`  ${total} snímok${SUB>1?` (${SUB}× pohybové rozostrenie)`:''}, ${workers.length} paralelných prehliadačov`);

  let next = 0, done = 0;
  const t0 = Date.now();
  await Promise.all(workers.map(async ({ page }) => {
    for (;;) {
      const i = next++;
      if (i >= total) return;
      await shoot(page, FROM + i / (FPS * SUB), path.join(frames, String(i).padStart(6, '0') + '.png'));
      done++;
      if (done % 60 === 0 || done === total) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\r  snímka ${done}/${total}  (${(done / el).toFixed(1)} fps, zostáva ~${Math.round(el / done * (total - done))} s)   `);
      }
    }
  }));
  console.log('');

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const vf = SUB > 1 ? ['-vf', `tmix=frames=${SUB}:weights='${Array(SUB).fill(1).join(' ')}',fps=${FPS}`] : [];
  await run('ffmpeg', [
    '-y', '-loglevel', 'error', '-stats',
    '-framerate', String(FPS * SUB), '-i', path.join(frames, '%06d.png'),
    ...vf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-movflags', '+faststart', OUT,
  ]);
  if (!KEEP) fs.rmSync(frames, { recursive: true, force: true });
  const mb = (fs.statSync(OUT).size / 1e6).toFixed(1);
  console.log(`✔ ${OUT}  (${(TO - FROM).toFixed(1)} s, ${FPS} fps, ${mb} MB)`);
}

await Promise.all(workers.map(w => w.browser.close()));
srv.close();
