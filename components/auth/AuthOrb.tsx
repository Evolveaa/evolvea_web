"use client";

import { useEffect, useRef } from "react";

/**
 * Mini „neurónová" sféra — tichšia ozvena hero gule (biele bodky na tmavom
 * pozadí, pomalé otáčanie, občasná synapsia). Bez interakcie, čisto
 * ambientná. Používa ju auth brand panel aj tmavá kontakt sekcia landingu
 * (cez className). Rešpektuje prefers-reduced-motion aj document.hidden.
 */
export default function AuthOrb({ className = "auth-brand-orb" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap || !cv.getContext) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Brand panel je na mobile display:none — nekresli do neviditeľného canvasu.
    const desktop = window.matchMedia("(min-width: 900px)");
    const ctx = cv.getContext("2d")!;
    let ready = false; // guard: resize() môže bežať skôr než je frame() definovaný

    const N = 260;
    const pts: { x: number; y: number; z: number }[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r0 = Math.sqrt(Math.max(0, 1 - y * y));
      const th = ga * i;
      pts.push({ x: Math.cos(th) * r0, y, z: Math.sin(th) * r0 });
    }
    const nbr: number[][] = [];
    for (let i = 0; i < N; i++) {
      const p = pts[i];
      const best: [number, number][] = [];
      for (let j = 0; j < N; j++) {
        if (j === i) continue;
        const q = pts[j];
        const d =
          (q.x - p.x) * (q.x - p.x) +
          (q.y - p.y) * (q.y - p.y) +
          (q.z - p.z) * (q.z - p.z);
        if (best.length < 4) {
          best.push([d, j]);
          best.sort((a, b) => a[0] - b[0]);
        } else if (d < best[3][0]) {
          best[3] = [d, j];
          best.sort((a, b) => a[0] - b[0]);
        }
      }
      nbr.push(best.map((b) => b[1]));
    }

    let W = 0,
      H = 0,
      DPR = 1;
    function resize() {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      const b = wrap!.getBoundingClientRect();
      W = b.width;
      H = b.height;
      cv!.width = Math.max(1, Math.round(W * DPR));
      cv!.height = Math.max(1, Math.round(H * DPR));
      // zmena veľkosti canvas vymaže — pri reduced-motion nič iné neprekreslí
      if (reduced && ready) frame(performance.now());
    }
    resize();
    window.addEventListener("resize", resize);

    let rotY = 0.6;
    const tiltX = -0.32;
    const proj: { sx: number; sy: number; z: number }[] = new Array(N);
    const links: { o: number; br: number[][]; t0: number; dur: number }[] = [];
    let nextLink = performance.now() + 900;

    function spawnLink() {
      let start = -1;
      for (let t = 0; t < 16; t++) {
        const c = (Math.random() * N) | 0;
        if (proj[c] && proj[c].z > 0.05) {
          start = c;
          break;
        }
      }
      if (start < 0) return;
      const used: Record<number, number> = { [start]: 1 };
      const branches: number[][] = [];
      for (let b = 0; b < 2; b++) {
        const path = [start];
        const len = 2 + ((Math.random() * 2) | 0);
        for (let s = 0; s < len; s++) {
          const nb = nbr[path[path.length - 1]];
          let pick = -1;
          for (let m = 0; m < nb.length; m++) {
            const cand = nb[(Math.random() * nb.length) | 0];
            if (!used[cand]) {
              pick = cand;
              break;
            }
          }
          if (pick < 0) break;
          used[pick] = 1;
          path.push(pick);
        }
        if (path.length >= 2) branches.push(path);
      }
      if (!branches.length) return;
      links.push({ o: start, br: branches, t0: performance.now(), dur: 6000 + Math.random() * 2000 });
    }

    function frame(now: number) {
      const cx = W / 2,
        cy = H / 2;
      const R = Math.min(W, H) * 0.47;
      const cosR = Math.cos(rotY),
        sinR = Math.sin(rotY);
      const cosT = Math.cos(tiltX),
        sinT = Math.sin(tiltX);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const x = p.x * cosR + p.z * sinR,
          z = -p.x * sinR + p.z * cosR;
        const y2 = p.y * cosT - z * sinT,
          z2 = p.y * sinT + z * cosT;
        proj[i] = { sx: cx + x * R, sy: cy + y2 * R, z: z2 };
      }
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      ctx.lineCap = "round";
      ctx.lineWidth = 0.7;
      for (let mL = links.length - 1; mL >= 0; mL--) {
        const L = links[mL],
          k = (now - L.t0) / L.dur;
        if (k >= 1) {
          links.splice(mL, 1);
          continue;
        }
        const env =
          k < 0.3
            ? (k / 0.3) * (k / 0.3) * (3 - 2 * (k / 0.3))
            : k > 0.6
              ? 1 - ((k - 0.6) / 0.4) * ((k - 0.6) / 0.4) * (3 - 2 * ((k - 0.6) / 0.4))
              : 1;
        for (let b = 0; b < L.br.length; b++) {
          const P = L.br[b];
          const draw = Math.min(1, Math.max(0, (k - b * 0.06) / 0.5));
          const dE = draw < 0.5 ? 2 * draw * draw : 1 - Math.pow(-2 * draw + 2, 2) / 2;
          const segs = P.length - 1,
            total = dE * segs;
          ctx.globalAlpha = env * 0.22;
          ctx.beginPath();
          ctx.moveTo(proj[P[0]].sx, proj[P[0]].sy);
          for (let s = 0; s < segs; s++) {
            const seg = Math.min(1, Math.max(0, total - s));
            if (seg <= 0) break;
            const A = proj[P[s]],
              B = proj[P[s + 1]];
            if (seg >= 1) {
              ctx.lineTo(B.sx, B.sy);
            } else {
              ctx.lineTo(A.sx + (B.sx - A.sx) * seg, A.sy + (B.sy - A.sy) * seg);
            }
          }
          ctx.stroke();
        }
        const O = proj[L.o],
          dO = (O.z + 1) / 2;
        ctx.globalAlpha = env * (0.25 + dO * 0.3);
        ctx.beginPath();
        ctx.arc(O.sx, O.sy, 1.6 + dO, 0, 6.2832);
        ctx.fill();
      }
      for (let i = 0; i < N; i++) {
        const q = proj[i],
          dd = (q.z + 1) / 2;
        ctx.globalAlpha = 0.05 + dd * 0.3;
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, 0.5 + dd * 1.1, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (now > nextLink && links.length < 2) {
        spawnLink();
        nextLink = now + 2400 + Math.random() * 1800;
      }
    }

    let rafId = 0;
    ready = true;
    // prvý frame synchrónne — viditeľné aj pri pozastavenom rAF
    frame(performance.now());
    if (reduced) {
      rafId = requestAnimationFrame((t) => frame(t));
    } else {
      let lastT = performance.now();
      const loop = (now: number) => {
        rafId = requestAnimationFrame(loop);
        // panel skrytý (mobil) alebo tab na pozadí → nepáľ CPU
        if (document.hidden || !desktop.matches) {
          lastT = now;
          return;
        }
        const dt = Math.min(50, now - lastT);
        lastT = now;
        rotY += 0.00008 * dt;
        frame(now);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
