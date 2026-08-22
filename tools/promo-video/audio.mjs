#!/usr/bin/env node
/**
 * Evolvea promo — hudba (82 s).
 *
 * Bežná príjemná hudba, nie ambient: rozložený akord ako podklad (hracia
 * skrinka), pod ním mäkké sláčiky, nad tým jednoduchá melódia. Celý čas dur:
 * F – C – Dm7 – B♭. Žiadne šumové prechody, žiadne rozladené drony, krátky
 * dozvuk — presne to robilo z ranných verzií strašidelný dojem.
 *
 * Partitúra je zosynchronizovaná so scénou. Najdôležitejšie miesto je finále:
 * pri mriežke 168 hodín (60,2 s) podklad úplne stíchne, ostanú len sláčiky —
 * a šesť večerných bodiek dostane šesť stúpajúcich tónov, každý presne na
 * svoju bodku. Ticho pred tým je to, čo tie tóny urobí počuteľnými.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMix, writeWav, NOTE as n } from './engine.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DUR = 82.0, BPM = 84, BEAT = 60 / BPM, BAR = BEAT * 4;
const m = createMix(DUR);

/* body v scéne, na ktoré sa hudba viaže */
const S = { home: 17.0, solved: 39.0, back: 46.4, dots: 60.2, hour: 63.6, eve: 66.2, line: 69.4, card: 74.2 };

const PROG = [
  ['F',  ['F3','A3','C4','F4']], ['C',  ['C3','E3','G3','C4']],
  ['Dm', ['D3','F3','A3','D4']], ['Bb', ['Bb2','D3','F3','Bb3']],
];
const BASS = { F:'F2', C:'C2', Dm:'D2', Bb:'Bb1' };

/* Hlasitosť podkladu v čase. Nula medzi 60 a 69 s — to je to ticho,
   v ktorom sa mriežka objaví a šesť večerov zaznie samo. */
const lerp = (a, b, x) => a + (b - a) * Math.max(0, Math.min(1, x));
function bed(t) {
  if (t < 2.4)          return lerp(0, 1, t / 2.4);
  if (t < S.dots - 2.6) return 1;
  if (t < S.dots - 0.2) return lerp(1, 0, (t - (S.dots - 2.6)) / 2.4);
  if (t < S.line - 0.4) return 0;
  if (t < S.card)       return lerp(0, 0.92, (t - (S.line - 0.4)) / (S.card - S.line + 0.4));
  if (t < DUR - 4.0)    return 1.14;
  return lerp(1.14, 0.5, (t - (DUR - 4.0)) / 4.0);
}

/* podklad: rozložený akord — osminy, striedavo hore a dole */
let bar = 0;
for (let t = 0; t < DUR - 1.0; t += BAR, bar++) {
  const [name, ch] = PROG[bar % PROG.length];
  const notes = ch.map(n);
  const order = bar % 2 === 0 ? [0, 1, 2, 3, 2, 1, 2, 3] : [0, 2, 1, 3, 2, 1, 0, 2];
  const phrase = 0.74 + 0.26 * Math.sin((bar / PROG.length) * Math.PI * 0.5 + 0.4);
  order.forEach((oi, k) => {
    const tt = t + k * (BEAT / 2);
    const g = 0.030 * phrase * bed(tt) * (k % 4 === 0 ? 1.18 : 0.86);
    if (tt > DUR - 0.8 || g < 0.0015) return;
    m.pluck(tt, notes[oi], g, { decay: 0.95, pan: 0.36 + 0.28 * (oi / 3) });
  });
  /* sláčiky držia akord aj v tichej pasáži — len tichšie */
  const sg = Math.max(0.34, bed(t + BAR / 2));
  if (t < DUR - 1.4) {
    m.strings(t, n(BASS[name]), 0.030 * sg, { dur: BAR * 0.92, atk: 0.5, rel: 0.9, pan: .5 });
    m.strings(t + 0.05, notes[1], 0.016 * sg, { dur: BAR * 0.88, atk: 0.6, rel: 0.9, pan: .42 });
    m.strings(t + 0.10, notes[2], 0.013 * sg, { dur: BAR * 0.86, atk: 0.6, rel: 0.9, pan: .58 });
  }
}

/* melódia — jednoduchá, spevná, vždy z práve znejúceho akordu */
const MEL = [
  /* I. u logopédky */
  [ 2.9,'A4',.062,2.6], [ 5.7,'C5',.052,2.4], [ 8.6,'A4',.048,2.4], [10.8,'F4',.062,3.0],
  [14.0,'C5',.054,2.8],
  /* II. doma — otázka, hľadanie, nápad */
  [S.home + 0.4,'D5',.050,2.6], [20.0,'C5',.054,2.8], [22.9,'A4',.056,2.8],
  [25.7,'F4',.058,3.0], [28.6,'G4',.048,2.6], [31.4,'A4',.054,2.8], [34.3,'C5',.050,2.6],
  [37.1,'D5',.048,2.6],
  [S.solved,'F5',.058,3.0], [S.solved + 0.16,'C5',.038,2.8],   // „pes predsa nevie písať"
  [42.0,'A4',.054,2.8],
  /* III. späť u logopédky */
  [S.back + 0.5,'F4',.058,3.0], [49.7,'C5',.050,2.6], [52.6,'D5',.048,2.6],
  [55.4,'C5',.052,2.8], [57.4,'A4',.050,3.0],
];
MEL.forEach(([t, note, g, d]) => m.felt(t, n(note), g, { decay: d, pan: .5, bright: .85 }));

/* ---- FINÁLE: 168 hodín ---- */
/* mriežka sa objaví do držaného F dur */
['F2','F3','A3','C4'].forEach((note, i) =>
  m.strings(S.dots - 0.6 + i * 0.10, n(note), [.034, .020, .015, .013][i],
    { dur: 9.6, atk: 1.4, rel: 3.0, pan: .5 + (i - 1.5) * 0.06 }));
/* hodina u logopédky — jeden jasný tón */
m.felt(S.hour, n('C5'), .070, { decay: 4.0, pan: .5, bright: .92 });
m.felt(S.hour + 0.02, n('F4'), .040, { decay: 3.6, pan: .5, bright: .82 });
/* šesť večerov — šesť tónov, každý presne na svoju bodku */
['F4','A4','C5','D5','F5','A5'].forEach((note, i) =>
  m.pluck(S.eve + i * 0.24, n(note), .052 - i * 0.003, { decay: 1.5, pan: .42 + i * 0.032 }));
/* akord, do ktorého tých šesť tónov vyústi */
['Bb2','D3','F3','Bb3'].forEach((note, i) =>
  m.strings(S.eve + 1.5 + i * 0.08, n(note), [.030, .017, .014, .012][i],
    { dur: 5.4, atk: 1.0, rel: 2.4, pan: .5 + (i - 1.5) * 0.06 }));
m.felt(S.line, n('F5'), .058, { decay: 3.6, pan: .5, bright: .88 });
m.felt(S.line + 1.4, n('C5'), .050, { decay: 3.2, pan: .5, bright: .84 });
m.felt(S.line + 2.7, n('A4'), .048, { decay: 3.2, pan: .5, bright: .82 });

/* ---- ZÁVER ---- */
m.felt(S.card, n('F4'), .072, { decay: 4.4, pan: .5, bright: .88 });
m.felt(S.card + 0.15, n('A4'), .052, { decay: 4.0, pan: .46, bright: .84 });
m.felt(S.card + 0.30, n('C5'), .042, { decay: 3.8, pan: .54, bright: .84 });
m.felt(S.card + 3.2, n('F5'), .046, { decay: 3.4, pan: .5, bright: .86 });
m.felt(S.card + 5.6, n('C5'), .032, { decay: 3.2, pan: .5, bright: .80 });
['F2','F3','A3','C4','F4'].forEach((note, i) =>
  m.strings(S.card + i * 0.09, n(note), [.036, .022, .016, .014, .012][i],
    { dur: 7.2, atk: 0.8, rel: 3.2, pan: .5 + (i - 2) * 0.05 }));

/* sláčiky zdvojujú vrcholy melódie */
[[10.8,'F4',.026,3.0],[S.solved,'F5',.022,3.0],[S.back+0.5,'F4',.024,3.2],[S.hour,'C5',.026,4.0]]
  .forEach(([t, note, g, d]) => m.strings(t, n(note), g, { dur: d, atk: .6, rel: 1.8, pan: .5 }));

const out = path.join(DIR, 'out', 'score.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
const mix = m.render({ reverbMix: 0.20, room: 0.72, target: 0.76, tilt: 0.84 });
writeWav(out, mix, { fadeIn: 0.8, fadeOut: 2.4 });
console.log(`✔ ${out} (${DUR}s, ${BPM} BPM)`);
