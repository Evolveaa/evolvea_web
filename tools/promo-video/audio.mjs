#!/usr/bin/env node
/**
 * Evolvea promo — hudba (55,5 s).
 *
 * Bežná príjemná hudba, nie ambient: rozložený akord ako podklad (hracia
 * skrinka), pod ním mäkké sláčiky, nad tým jednoduchá melódia. Celý čas dur:
 * F – C – Dm7 – B♭, 84 BPM. Žiadne šumové prechody, žiadne rozladené drony,
 * krátky dozvuk — presne to robilo z ranných verzií strašidelný dojem.
 *
 * Partitúra je zviazaná so scénou dvoma spôsobmi:
 *
 *  1. ČASOVO — dvanásť hárkov padá presne na doby, šesť večerných bodiek
 *     dostane šesť stúpajúcich tónov. Pri mriežke 168 hodín podklad úplne
 *     stíchne; ticho pred tým je to, čo tie tóny urobí počuteľnými.
 *
 *  2. PRIESTOROVO — film je split screen, tak je aj zvuk. Čo sa deje v ľavom
 *     paneli (papiere) znie vľavo, čo v pravom (záznamy) znie vpravo. Keď sa
 *     panely v 28,2 s zlejú, zlejú sa aj hlasy do stredu.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMix, writeWav, NOTE as n } from './engine.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DUR = 55.5, BPM = 84, BEAT = 60 / BPM, BAR = BEAT * 4;
const m = createMix(DUR);

/* body v scéne */
const S = {
  split: 0.75, sheet: 3.571, lost: 12.9, read: 14.6, clear: 18.6,
  mark: 19.8, path: 21.8, merge: 28.2, sum: 29.1, loop: 33.6,
  dots: 39.2, hour: 41.6, eve: 43.2, line: 45.4, card: 49.2,
};
const SHEET_N = 12;
const L = 0.22, R = 0.78, MID = 0.5;      /* panorámy oboch panelov (≈ 9 dB odstup) */

const PROG = [
  ['F',  ['F3','A3','C4','F4']], ['C',  ['C3','E3','G3','C4']],
  ['Dm', ['D3','F3','A3','D4']], ['Bb', ['Bb2','D3','F3','Bb3']],
];
const BASS = { F:'F2', C:'C2', Dm:'D2', Bb:'Bb1' };
const lerp = (a, b, x) => a + (b - a) * Math.max(0, Math.min(1, x));

/* Hlasitosť podkladu v čase. Pod porovnaním „výsledok vs. úvaha" sa stenčí,
   aby bolo počuť jednotlivé tóny; pri mriežke 168 hodín zmizne úplne. */
function bed(t) {
  if (t < S.split)          return 0;
  if (t < S.split + 1.2)    return lerp(0, 1, (t - S.split) / 1.2);
  if (t < S.mark - 0.6)     return 1;
  if (t < S.mark + 0.6)     return lerp(1, 0.30, (t - (S.mark - 0.6)) / 1.2);
  if (t < S.merge - 0.8)    return 0.30;
  if (t < S.merge + 0.8)    return lerp(0.30, 1, (t - (S.merge - 0.8)) / 1.6);
  if (t < S.dots - 2.4)     return 1;
  if (t < S.dots - 0.2)     return lerp(1, 0, (t - (S.dots - 2.4)) / 2.2);
  if (t < S.line - 0.4)     return 0;
  if (t < S.card)           return lerp(0, 0.92, (t - (S.line - 0.4)) / (S.card - S.line + 0.4));
  if (t < DUR - 3.4)        return 1.14;
  return lerp(1.14, 0.5, (t - (DUR - 3.4)) / 3.4);
}

/* podklad: rozložený akord — osminy, striedavo hore a dole */
let bar = 0;
for (let t = 0; t < DUR - 1.0; t += BAR, bar++) {
  const [name, ch] = PROG[bar % PROG.length];
  const notes = ch.map(n);
  const order = bar % 2 === 0 ? [0, 1, 2, 3, 2, 1, 2, 3] : [0, 2, 1, 3, 2, 1, 0, 2];
  const phrase = 0.76 + 0.24 * Math.sin((bar / PROG.length) * Math.PI * 0.5 + 0.4);
  order.forEach((oi, k) => {
    const tt = t + k * (BEAT / 2);
    const g = 0.029 * phrase * bed(tt) * (k % 4 === 0 ? 1.18 : 0.86);
    if (tt > DUR - 0.8 || g < 0.0015) return;
    m.pluck(tt, notes[oi], g, { decay: 0.92, pan: 0.38 + 0.24 * (oi / 3) });
  });
  const sg = Math.max(0.32, bed(t + BAR / 2));
  if (t < DUR - 1.4) {
    m.strings(t, n(BASS[name]), 0.030 * sg, { dur: BAR * 0.92, atk: 0.5, rel: 0.9, pan: MID });
    m.strings(t + 0.05, notes[1], 0.016 * sg, { dur: BAR * 0.88, atk: 0.6, rel: 0.9, pan: 0.42 });
    m.strings(t + 0.10, notes[2], 0.013 * sg, { dur: BAR * 0.86, atk: 0.6, rel: 0.9, pan: 0.58 });
  }
}

/* ---- I. OTVORENIE: bodka, potom sa z nej stane čiara ---- */
m.felt(0.12, n('F4'), .062, { decay: 3.4, pan: MID, bright: .86 });
m.strings(S.split - 0.1, n('F3'), .026, { dur: 2.6, atk: .5, rel: 1.4, pan: MID });
m.pluck(S.split + 0.05, n('C5'), .034, { decay: 1.1, pan: MID });

/* ---- II. DVANÁSŤ VEČEROV ----
   Ten istý večer znie na oboch stranách naraz: vľavo hárok, vpravo záznam.
   Rovnaký vstup, iný výsledok — to je celý argument tohto úseku. */
const PAPER = ['F3','A3','C4','A3','F3','C4','A3','F3','G3','Bb3','A3','F3'];
const REC   = ['C5','A4','F5','C5','A4','D5','C5','F5','A4','D5','C5','F5'];
for (let i = 0; i < SHEET_N; i++) {
  const t = S.sheet + i * BEAT;
  m.pluck(t, n(PAPER[i]), 0.041, { decay: 1.25, pan: L });            /* hárok dopadne */
  m.pluck(t + 0.02, n(REC[i]), 0.036, { decay: 1.05, pan: R });        /* záznam dokuje */
}
/* jeden hárok vypadne z kopy — tón klesne a ostane vľavo */
m.felt(S.lost, n('F3'), .056, { decay: 3.2, pan: L, bright: .72 });
m.felt(S.lost + 0.22, n('C3'), .044, { decay: 3.4, pan: L, bright: .66 });
/* vpravo sa celý týždeň zloží do jedného čitateľného zoznamu */
['F4','A4','C5','F5'].forEach((note, i) =>
  m.pluck(S.read + i * 0.09, n(note), .054 - i * 0.005, { decay: 1.7, pan: 0.84 }));
m.strings(S.read, n('F3'), .030, { dur: 3.4, atk: .5, rel: 1.6, pan: 0.82 });

/* ---- III. VÝSLEDOK VS. ÚVAHA ----
   Vľavo tri odseknuté tóny (✓ ✗ ✓), vpravo tri stúpajúce. */
['C5','A4','C5'].forEach((note, i) =>
  m.felt(S.mark + i * 0.42, n(note), .064, { decay: 1.9, pan: L, bright: .80 }));
['F4','A4','C5'].forEach((note, i) =>
  m.felt(S.path + 0.18 + i * 0.62, n(note), .068, { decay: 3.2, pan: R, bright: .90 }));
m.strings(S.path + 0.18, n('F3'), .024, { dur: 5.4, atk: .8, rel: 2.2, pan: R });

/* ---- IV. ZLÚČENIE A ZHRNUTIE ---- */
m.felt(S.merge, n('F4'), .062, { decay: 3.6, pan: MID, bright: .86 });
m.felt(S.merge + 0.12, n('C5'), .040, { decay: 3.2, pan: MID, bright: .82 });
['A4','C5','F5'].forEach((note, i) =>
  m.felt(S.sum - 0.32 + i * 1.1, n(note), .052 - i * 0.003, { decay: 2.8, pan: MID, bright: .86 }));
/* slučka: figúra, ktorá sa vráti tam, kde začala */
['F4','A4','C5','A4','F4'].forEach((note, i) =>
  m.pluck(S.loop + i * 0.24, n(note), .034, { decay: 1.4, pan: 0.44 + i * 0.03 }));

/* ---- V. 168 HODÍN ---- */
['F2','F3','A3','C4'].forEach((note, i) =>
  m.strings(S.dots - 0.6 + i * 0.10, n(note), [.034, .020, .015, .013][i],
    { dur: 8.4, atk: 1.4, rel: 2.8, pan: MID + (i - 1.5) * 0.06 }));
m.felt(S.hour, n('C5'), .070, { decay: 4.0, pan: MID, bright: .92 });
m.felt(S.hour + 0.02, n('F4'), .040, { decay: 3.6, pan: MID, bright: .82 });
m.strings(S.hour, n('C5'), .026, { dur: 4.0, atk: .6, rel: 1.8, pan: MID });
/* šesť večerov — šesť tónov, každý presne na svoju bodku */
['F4','A4','C5','D5','F5','A5'].forEach((note, i) =>
  m.pluck(S.eve + i * 0.20, n(note), .052 - i * 0.003, { decay: 1.5, pan: 0.42 + i * 0.032 }));
['Bb2','D3','F3','Bb3'].forEach((note, i) =>
  m.strings(S.eve + 1.3 + i * 0.08, n(note), [.030, .017, .014, .012][i],
    { dur: 4.6, atk: 1.0, rel: 2.2, pan: MID + (i - 1.5) * 0.06 }));
m.felt(S.line, n('F5'), .058, { decay: 3.4, pan: MID, bright: .88 });
m.felt(S.line + 1.3, n('C5'), .050, { decay: 3.0, pan: MID, bright: .84 });
m.felt(S.line + 2.4, n('A4'), .046, { decay: 3.0, pan: MID, bright: .82 });

/* ---- VI. ZÁVER ---- */
m.felt(S.card, n('F4'), .072, { decay: 4.4, pan: MID, bright: .88 });
m.felt(S.card + 0.15, n('A4'), .052, { decay: 4.0, pan: 0.46, bright: .84 });
m.felt(S.card + 0.30, n('C5'), .042, { decay: 3.8, pan: 0.54, bright: .84 });
m.felt(S.card + 2.8, n('F5'), .046, { decay: 3.4, pan: MID, bright: .86 });
m.felt(S.card + 4.8, n('C5'), .030, { decay: 3.0, pan: MID, bright: .80 });
['F2','F3','A3','C4','F4'].forEach((note, i) =>
  m.strings(S.card + i * 0.09, n(note), [.036, .022, .016, .014, .012][i],
    { dur: 6.0, atk: 0.8, rel: 3.0, pan: MID + (i - 2) * 0.05 }));

const out = path.join(DIR, 'out', 'score.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
const mix = m.render({ reverbMix: 0.20, room: 0.72, target: 0.76, tilt: 0.84 });
writeWav(out, mix, { fadeIn: 0.5, fadeOut: 2.2 });
console.log(`✔ ${out} (${DUR}s, ${BPM} BPM)`);
