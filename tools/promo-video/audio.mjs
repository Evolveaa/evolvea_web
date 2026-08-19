#!/usr/bin/env node
/**
 * Evolvea promo video — hudobná stopa (80 s).
 *
 * Postavená na engine.mjs. Dramaturgiu nesie pohyb harmónie
 * Dm → B♭ → Gm → F → B♭ → F → Fmaj9, nie opakované údery.
 * Každý tón je iný; pri stole sú tóny riedke, aby vynikli repliky.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMix, writeWav, NOTE as n } from './engine.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DUR = 80.0;
const m = createMix(DUR);

const CH = {
  Dm9  : ['D2','A2','F3','E4'],
  Bb   : ['Bb1','F2','D3','A3'],
  Gm7  : ['G2','D3','Bb3','F4'],
  F    : ['F2','C3','A3','E4'],
  Bb2  : ['Bb1','F2','D3','G3'],
  F2   : ['F2','C3','A3','D4'],
  Fadd9: ['F2','C3','G3','A3'],
  Fmaj9: ['F2','C3','A3','E4','G4'],
};
const PLAN = [
  ['Dm9',   0.0, 12.4, 0.046, 2.4, 0.031],
  ['Bb',   10.8, 20.2, 0.046, 2.4, 0.026],
  ['Gm7',  19.0, 28.0, 0.048, 2.4, 0.034],
  ['F',    26.4, 37.4, 0.050, 2.4, 0.023],
  ['Bb2',  36.2, 48.6, 0.048, 2.4, 0.029],
  ['F2',   47.4, 57.2, 0.050, 2.6, 0.025],
  ['Fadd9',56.0, 68.4, 0.052, 2.6, 0.021],
  ['Fmaj9',67.0, 80.0, 0.058, 3.0, 0.018],
];
PLAN.forEach(([k, a, b, g, f, mv], i) =>
  m.pad(a, b, CH[k].map(n), g, { fade: f, move: mv, phase: i * 1.3, cut: 0.050, depth: 0.028 }));

/* melódia — každý tón iný, riedka pri replikách */
const NOTES = [
  [0.8,'D4',.084,3.2,.44], [2.4,'A3',.058,2.8,.58], [4.2,'F4',.068,3.0,.40],
  [6.6,'A4',.060,2.4,.56], [7.6,'C5',.048,2.2,.42], [8.6,'D5',.042,2.0,.62],
  [11.6,'A4',.056,2.6,.44],[13.0,'D5',.046,2.4,.60],[15.4,'D4',.064,3.2,.50],
  /* stôl: dieťa sa zosunie */
  [19.0,'G3',.076,3.4,.46],[21.3,'Bb3',.058,3.0,.40],
  /* rodič siahne a stiahne ruku */
  [24.5,'D4',.050,2.6,.58],[26.1,'F3',.062,3.2,.54],
  /* otázka → premýšľanie → odpoveď */
  [29.1,'C4',.070,3.2,.50],[31.3,'D4',.038,1.8,.42],[31.9,'F4',.034,1.6,.58],
  [33.3,'A4',.062,2.8,.44],[35.1,'C5',.044,2.4,.60],
  /* dielik zapadne */
  [37.1,'F5',.058,2.4,.52],[38.0,'A4',.040,2.2,.42],
  [40.1,'D4',.056,2.8,.56],[42.5,'F4',.058,2.8,.44],
  [44.5,'A5',.044,2.2,.58],[45.2,'C5',.038,2.0,.46],
  /* „Zvládnem to krok za krokom." */
  [47.1,'F4',.072,3.4,.50],[47.28,'A4',.052,3.2,.58],
  /* let karty a prejazd do ordinácie */
  [50.7,'C5',.048,2.6,.40],[52.9,'D5',.044,2.6,.62],[54.6,'F5',.038,2.4,.48],
  /* panel */
  [56.4,'C5',.058,3.0,.46],[57.8,'E5',.042,2.4,.60],[59.4,'G4',.048,2.8,.40],
  [61.0,'A4',.044,2.6,.58],[63.1,'D5',.054,3.0,.50],[64.6,'F4',.046,3.0,.44],
  /* záver */
  [67.2,'F4',.070,3.6,.44],[67.34,'A4',.054,3.4,.52],[67.48,'C5',.044,3.2,.60],
  [71.4,'F4',.068,3.8,.46],[71.54,'F5',.038,3.4,.56],
  [73.9,'C5',.040,3.4,.50],[76.2,'A4',.032,3.2,.54],
];
NOTES.forEach(([t, note, g, d, pan]) => m.felt(t, n(note), g, { decay: d, pan, bright: .9 }));

/* dychové prechody */
[[6.0,2.0,.048,1.1],[11.0,1.8,.042,1.3],[18.4,2.2,.052,0.9],
 [26.0,2.2,.056,1.6],[46.6,2.2,.050,1.6],[52.4,2.6,.058,1.4],
 [55.8,2.0,.046,1.7],[66.6,2.2,.046,1.6]]
  .forEach(([t,d,g,tone]) => m.swell(t,d,g,{tone}));

/* mäkké nízke telo */
[[0.35,'D2',.055,2.6],[21.1,'G2',.048,2.4],[26.6,'F2',.050,2.8],
 [47.0,'F2',.046,2.6],[56.2,'F2',.044,2.6],[66.9,'F2',.050,3.0]]
  .forEach(([t,note,g,d]) => m.sub(t,n(note),g,{dur:d}));

/* trblietavý závoj v svetlých miestach */
m.air(46.8, 5.2, ['A5','C6','F5'].map(n), 0.012);
m.air(56.0, 6.0, ['C6','A5','E6'].map(n), 0.011);
m.air(71.0, 6.0, ['F5','A5','C6'].map(n), 0.011);

const out = path.join(DIR, 'out', 'score.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
const mix = m.render({ reverbMix: 0.33, room: 0.83, target: 0.74, tilt: 0.80 });
writeWav(out, mix, { fadeIn: 0.6, fadeOut: 2.6 });
console.log(`✔ ${out}  (${DUR}s, peak ${mix.peak.toFixed(3)})`);
