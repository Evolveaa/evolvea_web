#!/usr/bin/env node
/**
 * Evolvea promo video — hudobná stopa (32,5 s).
 *
 * Zámerne minimalistická: jeden súvislý pad, ktorý sa otvára z molu
 * do duru, a PÄŤ jednotlivých tónov za celé video — každý iný.
 * Žiadne perkusívne údery, žiadny rytmus, nič sa neopakuje.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMix, writeWav, NOTE as n } from './engine.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DUR = 32.5;
const m = createMix(DUR);

/* jeden podklad, ktorý sa počas videa preleje z neistoty do istoty */
m.pad(0.0, 13.0, ['D2','A2','F3','E4'].map(n),   0.048, { fade: 3.2, move: 0.028, phase: 0.2 });
m.pad(10.5, 21.5, ['Bb1','F2','D3','A3'].map(n), 0.048, { fade: 3.2, move: 0.024, phase: 1.7 });
m.pad(18.5, 28.0, ['F2','C3','A3','E4'].map(n),  0.050, { fade: 3.0, move: 0.021, phase: 3.1 });
m.pad(25.5, 32.5, ['F2','C3','A3','E4','G4'].map(n), 0.058, { fade: 3.0, move: 0.017, phase: 4.4 });

/* päť tónov za celé video, každý na inej výške */
m.felt(3.0,  n('D4'), 0.080, { decay: 3.4, pan: .44 });   // obraz sa rozdelí
m.felt(9.8,  n('A3'), 0.062, { decay: 3.2, pan: .58 });   // v hlave sa začne skladať
m.felt(14.4, n('F4'), 0.070, { decay: 3.4, pan: .46 });   // dieťa siahne po dielikoch
m.felt(18.6, n('C5'), 0.058, { decay: 3.2, pan: .56 });   // úsmev
m.felt(26.3, n('F4'), 0.072, { decay: 4.0, pan: .46 });   // záverečný akord
m.felt(26.44,n('A4'), 0.050, { decay: 3.8, pan: .56 });

/* dva nádychy namiesto prechodových šumov */
m.swell(2.2, 2.2, 0.046, { tone: 1.2 });
m.swell(23.0, 2.6, 0.052, { tone: 1.6 });

/* teplý závoj v druhej polovici */
m.air(18.2, 6.0, ['A5','C6','F5'].map(n), 0.011);
m.air(25.8, 6.4, ['F5','A5','C6'].map(n), 0.012);

const out = path.join(DIR, 'out', 'score.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
const mix = m.render({ reverbMix: 0.34, room: 0.84, target: 0.74, tilt: 0.80 });
writeWav(out, mix, { fadeIn: 0.8, fadeOut: 2.2 });
console.log(`✔ ${out} (${DUR}s)`);
