/**
 * Evolvea promo video — zvukový engine.
 *
 * Cieľ: jemný, moderný, teplý ambient, ktorý sa NEOPAKUJE. Preto:
 *  - `felt()`  — plstený klavír/mallet: neharmonické alikvóty, mäkký nábeh 30 ms,
 *                vyššie alikvóty doznievajú rýchlejšie (to robí zvuk prirodzeným),
 *                plus mikroskopický „úder kladivka" namiesto cvaknutia.
 *  - `pad()`   — akord z rozladených hlasov cez POMALY SA HÝBUCI filter; timbre sa
 *                stále mení, takže drone nezovšednie.
 *  - `swell()` — dychový prechod (šum cez pásmovú priepusť s pomalým nábehom),
 *                nie „whoosh".
 *  - `air()`   — vysoký trblietavý závoj pre svetlé miesta.
 *  - master    — hustý dozvuk, jemné zhladenie výšok, mäkký limiter.
 *
 * Všetko je deterministické (vlastný LCG), takže render je opakovateľný.
 */

import fs from 'node:fs';

export const SR = 48000;

export function createMix(durationSeconds) {
  const N = Math.round(SR * durationSeconds);
  const L = new Float64Array(N), R = new Float64Array(N);

  let seed = 0x9E3779B9;
  const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };

  const put = (i, l, r) => { if (i >= 0 && i < N) { L[i] += l; R[i] += r; } };
  const panL = p => Math.cos(p * Math.PI / 2);
  const panR = p => Math.sin(p * Math.PI / 2);

  /* ---- plstený klavír / mallet ------------------------------------- */
  function felt(t0, f, gain, o = {}) {
    const decay = o.decay ?? 2.6, pan = o.pan ?? .5, bright = o.bright ?? 1;
    const attack = o.attack ?? 0.030;
    const dur = Math.min(decay * 3.2 + attack, 9);
    const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
    const B = 0.00022;                       // neharmonicita — reálne struny nie sú presné násobky
    const P = 8;
    const pf = [], pa = [], pd = [], pp = [];
    for (let k = 1; k <= P; k++) {
      pf.push(f * k * Math.sqrt(1 + B * k * k));
      pa.push(Math.pow(k, -1.72) * (k === 1 ? 1 : bright));
      pd.push(decay / (1 + (k - 1) * 0.62)); // vyššie alikvóty doznievajú rýchlejšie
      pp.push((k * 2.399) % (Math.PI * 2));
    }
    const gl = gain * panL(pan), gr = gain * panR(pan);
    for (let i = 0; i < n; i++) {
      const x = i / SR;
      // mäkký nábeh (smoothstep), nie ostrá hrana
      const a = x < attack ? (x / attack) * (x / attack) * (3 - 2 * (x / attack)) : 1;
      let s = 0;
      for (let k = 0; k < P; k++) {
        if (pf[k] > 17000) continue;
        s += pa[k] * Math.sin(2 * Math.PI * pf[k] * x + pp[k]) * Math.exp(-x / pd[k]);
      }
      s *= a * 0.42;
      if (x < 0.020) s += noise() * 0.05 * (1 - x / 0.020) * (1 - x / 0.020) * a;  // telo úderu
      put(i0 + i, s * gl, s * gr);
    }
  }

  /* ---- „hracia skrinka": krátky, jasný, mäkký tón ------------------
     Toto nesie hudbu namiesto dronového padu. Rozložený akord z týchto
     tónov znie ako bežná príjemná hudba, nie ako hučanie. */
  function pluck(t0, f, gain, o = {}) {
    const decay = o.decay ?? 0.85, pan = o.pan ?? .5;
    const dur = decay * 3.0, atk = 0.006;
    const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
    const gl = gain * panL(pan), gr = gain * panR(pan);
    const P = [[1, 1], [2, .38], [3, .13], [4, .05], [5.4, .02]];
    for (let i = 0; i < n; i++) {
      const idx = i0 + i; if (idx < 0 || idx >= N) break;
      const x = i / SR;
      const a = x < atk ? x / atk : 1;
      let s = 0;
      for (const [k, amp] of P) {
        if (f * k > 15000) break;
        s += amp * Math.sin(2 * Math.PI * f * k * x) * Math.exp(-x / (decay / (1 + (k - 1) * 0.5)));
      }
      s *= a * 0.4;
      put(idx, s * gl, s * gr);
    }
  }

  /* ---- sláčiky: pomalý nábeh, vibráto, dlhý dozvuk ------------------
     Vrstvia sa pod plstený klavír — tá istá nota znie plnšie a teplejšie,
     bez toho, aby pribudol ďalší úder. */
  function strings(t0, f, gain, o = {}) {
    const dur = o.dur ?? 3.4, atk = o.atk ?? 0.55, rel = o.rel ?? 1.6, pan = o.pan ?? .5;
    const i0 = Math.round(t0 * SR), n = Math.round((dur + rel) * SR);
    const gl = gain * panL(pan), gr = gain * panR(pan);
    let lp = 0, lp2 = 0;
    for (let i = 0; i < n; i++) {
      const idx = i0 + i; if (idx < 0 || idx >= N) break;
      const x = i / SR;
      const a = x < atk ? (x / atk) * (x / atk) * (3 - 2 * (x / atk)) : 1;
      const r = x > dur ? Math.max(0, 1 - (x - dur) / rel) : 1;
      const env = a * r * r;
      const vib = 1 + 0.0035 * Math.sin(2 * Math.PI * 4.6 * x + f);   // jemné vibráto
      let sig = 0;
      for (let k = 1; k <= 6; k++) {
        const ff = f * k * vib;
        if (ff > 15000) break;
        sig += Math.sin(2 * Math.PI * ff * x + k * 0.9) / Math.pow(k, 1.45);
      }
      lp += 0.09 * (sig - lp); lp2 += 0.09 * (lp - lp2);          // zjemnenie výšok
      const v = lp2 * env * 0.5;
      put(idx, v * gl, v * gr);
    }
  }

  /* ---- akordový pad s pomaly sa hýbucim filtrom --------------------- */
  function pad(t0, t1, freqs, gain, o = {}) {
    const fade = o.fade ?? 3.0, move = o.move ?? 0.031, ph = o.phase ?? 0;
    const base = o.cut ?? 0.052, depth = o.depth ?? 0.030;
    const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(N, Math.round(t1 * SR));
    const span = t1 - t0;
    let l1 = 0, l2 = 0, r1 = 0, r2 = 0;
    for (let i = i0; i < i1; i++) {
      const x = (i - i0) / SR;
      let sl = 0, sr = 0;
      for (let k = 0; k < freqs.length; k++) {
        const f = freqs[k], w = 1 / (k + 1.6);
        for (let d = -1; d <= 1; d++) {                     // tri rozladené hlasy = šírka
          const ff = f * (1 + d * 0.0017);
          const p1 = 2 * Math.PI * ff * x + k * 1.73 + d * 0.9;
          const v = Math.sin(p1) + 0.26 * Math.sin(2 * p1 + k) + 0.11 * Math.sin(3 * p1 + k * 2.1);
          if (d <= 0) sl += v * w;
          if (d >= 0) sr += v * w;
        }
      }
      sl /= 2.4; sr /= 2.4;
      const cut = base + depth * Math.sin(2 * Math.PI * move * x + ph);
      l1 += cut * (sl - l1); l2 += cut * (l1 - l2);
      r1 += cut * (sr - r1); r2 += cut * (r1 - r2);
      const env = Math.min(1, x / fade) * Math.min(1, (span - x) / fade);
      const e = env * env * (3 - 2 * env) * gain;            // smoothstep aj na obálke
      put(i, l2 * e, r2 * e);
    }
  }

  /* ---- dychový prechod (namiesto ostrého „whoosh") ------------------ */
  function swell(t0, dur, gain, o = {}) {
    const tone = o.tone ?? 1;                               // 1 = tmavý, 3 = svetlý
    const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
    let lp = 0, lp2 = 0, hp = 0;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const env = Math.pow(Math.sin(Math.PI * u), 2.2);      // pomalý nádych aj výdych
      const cut = (0.010 + 0.055 * Math.sin(Math.PI * u)) * tone;
      const x = noise();
      lp += cut * (x - lp); lp2 += cut * (lp - lp2);
      hp = lp2 - lp * 0.55;                                  // odstráni dunenie
      const s = hp * env * gain * 3.2;
      put(i0 + i, s, s * 0.9);
    }
  }

  /* ---- vysoký trblietavý závoj -------------------------------------- */
  function air(t0, dur, freqs, gain) {
    const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
    for (let i = 0; i < n; i++) {
      const x = i / SR, u = i / n;
      const env = Math.pow(Math.sin(Math.PI * u), 1.6);
      let s = 0;
      freqs.forEach((f, k) => {
        const trem = 0.6 + 0.4 * Math.sin(2 * Math.PI * (0.19 + k * 0.07) * x + k);
        s += Math.sin(2 * Math.PI * f * x + k * 2.2) * trem / (k + 2.2);
      });
      const g = s * env * gain;
      put(i0 + i, g * 0.9, g);
    }
  }

  /* ---- mäkké nízke telo (žiadny úder, len nádych) -------------------- */
  function sub(t0, f, gain, o = {}) {
    const dur = o.dur ?? 2.2, attack = o.attack ?? 0.09;
    const i0 = Math.round(t0 * SR), n = Math.round(dur * SR);
    for (let i = 0; i < n; i++) {
      const x = i / SR;
      const a = x < attack ? (x / attack) * (x / attack) * (3 - 2 * (x / attack)) : 1;
      const env = a * Math.exp(-x / (dur * 0.34));
      const s = (Math.sin(2 * Math.PI * f * x) + 0.22 * Math.sin(2 * Math.PI * f * 2 * x + 1)) * env * gain;
      put(i0 + i, s, s);
    }
  }

  /* ---- dozvuk: 8 hrebeňov + 3 allpass, s low-cutom na sende --------- */
  function reverb(buf, mix, room) {
    const sc = SR / 44100;
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
      .map(d => ({ b: new Float64Array(Math.round(d * sc)), i: 0, g: room, damp: 0.28, s: 0 }));
    const alls = [556, 441, 341].map(d => ({ b: new Float64Array(Math.round(d * sc)), i: 0, g: 0.5 }));
    const out = new Float64Array(buf.length);
    let hp = 0, hpS = 0;
    for (let n = 0; n < buf.length; n++) {
      hp += 0.010 * (buf[n] - hp); hpS = buf[n] - hp;        // dozvuk bez basov = čisto
      let y = 0;
      for (const c of combs) {
        const v = c.b[c.i];
        y += v;
        c.s += c.damp * (v - c.s);                           // tlmenie výšok v chvoste
        c.b[c.i] = hpS + c.s * c.g;
        c.i = (c.i + 1) % c.b.length;
      }
      y *= 0.125;
      for (const a of alls) {
        const v = a.b[a.i]; const o = -a.g * y + v;
        a.b[a.i] = y + a.g * o; a.i = (a.i + 1) % a.b.length; y = o;
      }
      out[n] = buf[n] * (1 - mix) + y * mix;
    }
    return out;
  }

  function render({ reverbMix = 0.30, room = 0.80, target = 0.70, tilt = 0.78 } = {}) {
    let Lw = reverb(L, reverbMix, room), Rw = reverb(R, reverbMix, room);
    // jemné zhladenie výšok + odstránenie jednosmernej zložky
    let la = 0, ra = 0, ld = 0, rd = 0;
    for (let i = 0; i < N; i++) {
      la += tilt * (Lw[i] - la); ra += tilt * (Rw[i] - ra);
      ld += 0.0006 * (la - ld); rd += 0.0006 * (ra - rd);
      Lw[i] = la - ld; Rw[i] = ra - rd;
    }
    let peak = 0;
    for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(Lw[i]), Math.abs(Rw[i]));
    const g = target / (peak || 1);
    return { L: Lw, R: Rw, gain: g, peak, N };
  }

  return { felt, pluck, strings, pad, swell, air, sub, render, N, noise };
}

/* ---- zápis WAV ------------------------------------------------------ */
export function writeWav(file, { L, R, gain, N }, { fadeIn = 0.5, fadeOut = 2.2 } = {}) {
  const buf = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const f = Math.min(1, i / (SR * fadeIn)) * Math.min(1, (N - i) / (SR * fadeOut));
    const l = Math.tanh(L[i] * gain * f * 1.12), r = Math.tanh(R[i] * gain * f * 1.12);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(l * 32767))), i * 4);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(r * 32767))), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(buf.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, buf]));
}

/* ---- noty ----------------------------------------------------------- */
export const NOTE = (name) => {
  const M = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const m = /^([A-G])(b|s)?(-?\d)$/.exec(name);
  const semi = M[m[1]] + (m[2] === 's' ? 1 : m[2] === 'b' ? -1 : 0);
  const oct = parseInt(m[3], 10);
  return 440 * Math.pow(2, (semi - 9) / 12 + (oct - 4));
};
