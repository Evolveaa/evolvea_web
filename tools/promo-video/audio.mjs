#!/usr/bin/env node
/**
 * Evolvea promo — hudba (78,5 s).
 *
 * Bežná príjemná hudba, nie ambient: plynulý rozložený akord ako podklad
 * (hracia skrinka), pod ním mäkké sláčiky a nad tým jednoduchá melódia.
 * Žiadne šumové prechody, žiadne rozladené drony, žiadne mollové plochy —
 * presne to robilo z predchádzajúcej verzie strašidelný dojem.
 * Harmónia je celý čas durová: F – C – Dm7 – B♭.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMix, writeWav, NOTE as n } from './engine.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DUR = 78.5, BPM = 84, BEAT = 60 / BPM, BAR = BEAT * 4;
const m = createMix(DUR);

/* akordy po dvoch taktoch; posledný je jasný záver */
const PROG = [
  ['F',  ['F3','A3','C4','F4']], ['C',  ['C3','E3','G3','C4']],
  ['Dm', ['D3','F3','A3','D4']], ['Bb', ['Bb2','D3','F3','Bb3']],
];
const BASS = { F:'F2', C:'C2', Dm:'D2', Bb:'Bb1' };

/* podklad: rozložený akord — osminy, striedavo hore a dole */
let bar = 0;
for (let t = 0; t < DUR - 1.0; t += BAR, bar++) {
  const [name, ch] = PROG[bar % PROG.length];
  const notes = ch.map(n);
  const up = bar % 2 === 0;
  const order = up ? [0, 1, 2, 3, 2, 1, 2, 3] : [0, 2, 1, 3, 2, 1, 0, 2];
  /* hlasitosť dýcha po frázach, aby to nebolo mechanické */
  const swellPhase = 0.72 + 0.28 * Math.sin((bar / PROG.length) * Math.PI * 0.5 + 0.4);
  order.forEach((oi, k) => {
    const tt = t + k * (BEAT / 2);
    if (tt > DUR - 0.8) return;
    const g = 0.030 * swellPhase * (k % 4 === 0 ? 1.18 : 0.86);
    m.pluck(tt, notes[oi], g, { decay: 0.95, pan: 0.36 + 0.28 * (oi / 3) });
  });
  /* mäkké sláčiky držia akord */
  m.strings(t, n(BASS[name]), 0.030, { dur: BAR * 0.92, atk: 0.5, rel: 0.9, pan: .5 });
  m.strings(t + 0.05, notes[1], 0.016, { dur: BAR * 0.88, atk: 0.6, rel: 0.9, pan: .42 });
  m.strings(t + 0.10, notes[2], 0.013, { dur: BAR * 0.86, atk: 0.6, rel: 0.9, pan: .58 });
}

/* melódia — jednoduchá, spevná, vždy z práve znejúceho akordu */
const MEL = [
  [ 2.9,'A4',.062,2.6], [ 5.7,'C5',.052,2.4], [ 8.6,'A4',.048,2.4], [10.0,'F4',.062,3.0],
  [14.3,'C5',.054,2.6], [17.1,'D5',.048,2.4], [20.0,'C5',.056,2.8],
  [22.9,'A4',.058,2.8], [25.7,'F4',.060,3.0], [28.6,'G4',.050,2.6], [31.4,'A4',.056,2.8],
  [34.3,'C5',.052,2.6], [37.1,'D5',.050,2.6], [40.0,'F5',.046,2.6], [42.9,'C5',.054,2.8],
  [45.7,'A4',.056,2.8], [48.6,'F4',.062,3.2],
  [54.3,'C5',.052,2.6], [57.1,'A4',.054,2.8], [60.0,'D5',.050,2.6], [62.9,'C5',.052,2.8],
  [65.7,'A4',.056,3.0], [68.6,'F4',.064,3.4],
  [71.4,'F4',.070,4.0], [71.55,'A4',.052,3.8], [71.7,'C5',.042,3.6],
  [74.3,'F5',.044,3.4], [77.0,'C5',.030,3.0],
];
MEL.forEach(([t, note, g, d]) => m.felt(t, n(note), g, { decay: d, pan: .5, bright: .85 }));

/* sláčiky zdvojujú štyri vrcholy */
[[10.0,'F4',.026,3.0],[40.0,'F5',.020,2.8],[48.6,'F4',.026,3.2],[71.4,'F4',.034,4.4]]
  .forEach(([t, note, g, d]) => m.strings(t, n(note), g, { dur: d, atk: .6, rel: 1.8, pan: .5 }));

const out = path.join(DIR, 'out', 'score.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
const mix = m.render({ reverbMix: 0.20, room: 0.72, target: 0.76, tilt: 0.84 });
writeWav(out, mix, { fadeIn: 0.8, fadeOut: 2.2 });
console.log(`✔ ${out} (${DUR}s, ${BPM} BPM)`);
