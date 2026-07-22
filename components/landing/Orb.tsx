"use client";

import { useEffect, useRef } from "react";

/**
 * Hero „guľa" — rotujúca 3D sféra z bodiek (detská myseľ) so synapsiami.
 * v2: menšia, ale živá —
 *   · kurzor rozžiari a jemne pritiahne blízke body (dotýkate sa myšlienok),
 *   · pohyb kurzora vystreľuje synapsie z najbližšieho bodu,
 *   · po dráhach synapsií putuje svetelný impulz,
 *   · pri výbojoch sa objavujú metakognitívne otázky („Prečo?", „Ako to
 *     vieš?"…) — otázky, ktoré rozsvecujú detské uvažovanie,
 *   · klik/ťuk bez ťahu = malý „záblesk myslenia" (burst).
 * Ťahaním sa sféra otáča ako doteraz. Pozicovanie wrappera je
 * v styles/landing.css (kvôli responzívnemu doladeniu na mobile).
 */
export default function Orb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap || !cv.getContext) return;

    const INK = "#345EAC";
    const WORDS = [
      "Prečo?",
      "Ako to vieš?",
      "Čo skúsiš teraz?",
      "Ako si na to prišiel?",
      "Čo ti pomohlo?",
      "Skús to povedať nahlas.",
    ];
    const WORD_FONT = '500 13.5px "Instrument Sans", ui-sans-serif, system-ui, sans-serif';
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = cv.getContext("2d")!;
    let ready = false; // guard: frame() references state declared below

    // Fibonacciho sféra
    const N = 440;
    const pts: { x: number; y: number; z: number }[] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r0 = Math.sqrt(Math.max(0, 1 - y * y));
      const th = ga * i;
      pts.push({ x: Math.cos(th) * r0, y, z: Math.sin(th) * r0 });
    }
    // 6 najbližších susedov pre každý bod
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
        if (best.length < 6) {
          best.push([d, j]);
          best.sort((a, b) => a[0] - b[0]);
        } else if (d < best[5][0]) {
          best[5] = [d, j];
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
      // Resizing clears the backing store; in reduced-motion nothing redraws it.
      if (reduced && ready) frame(performance.now());
    }
    resize();
    window.addEventListener("resize", resize);

    let rotY = 0.8,
      tiltX = -0.3,
      rotVel = 0.0001,
      running = true,
      dragging = false;
    const baseVel = 0.0001;
    let px = 0,
      py = 0,
      moveVel = 0,
      last = performance.now();
    // kurzor (canvas súradnice) + akumulovaná dráha pre „vystreľovanie" synapsií
    let mx = -1e4,
      my = -1e4,
      mouseIn = false,
      travel = 0,
      nextCursorFire = 0,
      downX = 0,
      downY = 0,
      dragDist = 0;
    const proj: { sx: number; sy: number; z: number }[] = new Array(N);
    type Link = {
      o: number;
      br: number[][];
      t0: number;
      dur: number;
      word: string | null;
    };
    const links: Link[] = [];
    let nextLink = performance.now() + 600;
    let wordIdx = (Math.random() * WORDS.length) | 0;

    const hasActiveWord = () => links.some((l) => l.word);
    // Na malom canvase (mobil) guľa prekrýva nadpis — otázky by rušili text.
    const smallCanvas = () => Math.min(W, H) < 380;

    function spawnLinkFrom(start: number, withWord: boolean) {
      const used: Record<number, number> = {};
      const branches: number[][] = [];
      used[start] = 1;
      const nB = 2 + (Math.random() < 0.6 ? 1 : 0);
      for (let b = 0; b < nB; b++) {
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
      const word =
        withWord && !smallCanvas() && !hasActiveWord() ? WORDS[wordIdx++ % WORDS.length] : null;
      links.push({
        o: start,
        br: branches,
        t0: performance.now(),
        dur: 5200 + Math.random() * 1800,
        word,
      });
    }

    function spawnLink(withWord: boolean) {
      for (let t = 0; t < 20; t++) {
        const c = (Math.random() * N) | 0;
        if (proj[c] && proj[c].z > 0.05) {
          spawnLinkFrom(c, withWord);
          return;
        }
      }
    }

    /** Najbližší predný bod ku kurzoru (na výstrel synapsie / burst). */
    function nearestFrontPoint(maxDist: number): number {
      let best = -1,
        bd = maxDist * maxDist;
      for (let i = 0; i < N; i++) {
        const q = proj[i];
        if (!q || q.z < 0.05) continue;
        const dx = q.sx - mx,
          dy = q.sy - my;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    }

    function frame(now: number) {
      const cx = W / 2;
      const cy = H / 2 + Math.sin(now / 2200) * H * 0.011; // jemné vznášanie
      const R = Math.min(W, H) * 0.46 * (1 + Math.sin(now / 3400) * 0.012); // dýchanie
      const tEff = tiltX + Math.sin(now / 5200) * 0.05; // jemné kývanie osi
      const cosR = Math.cos(rotY),
        sinR = Math.sin(rotY);
      const cosT = Math.cos(tEff),
        sinT = Math.sin(tEff);
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
      const proxR = Math.min(W, H) * 0.17; // dosah „dotyku myšlienok"
      ctx.strokeStyle = INK;
      ctx.fillStyle = INK;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.8;
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
        const O = proj[L.o],
          dO = (O.z + 1) / 2;
        for (let b = 0; b < L.br.length; b++) {
          const P = L.br[b];
          const draw = Math.min(1, Math.max(0, (k - b * 0.05) / 0.5));
          const dE = draw < 0.5 ? 2 * draw * draw : 1 - Math.pow(-2 * draw + 2, 2) / 2;
          const segs = P.length - 1,
            total = dE * segs;
          let depth = 0;
          for (let s0 = 0; s0 <= segs; s0++) depth += (proj[P[s0]].z + 1) / 2;
          const dz2 = depth / (segs + 1);
          ctx.globalAlpha = env * (0.07 + dz2 * 0.3);
          ctx.beginPath();
          ctx.moveTo(proj[P[0]].sx, proj[P[0]].sy);
          let headX = proj[P[0]].sx,
            headY = proj[P[0]].sy;
          for (let s = 0; s < segs; s++) {
            const seg = Math.min(1, Math.max(0, total - s));
            if (seg <= 0) break;
            const A = proj[P[s]],
              B = proj[P[s + 1]];
            const mxx = (A.sx + B.sx) / 2,
              myy = (A.sy + B.sy) / 2;
            const ox = mxx - cx,
              oy = myy - cy,
              ol = Math.sqrt(ox * ox + oy * oy) || 1;
            const bow =
              0.12 * Math.sqrt((B.sx - A.sx) * (B.sx - A.sx) + (B.sy - A.sy) * (B.sy - A.sy));
            const cpx = mxx + (ox / ol) * bow,
              cpy = myy + (oy / ol) * bow;
            if (seg >= 1) {
              ctx.quadraticCurveTo(cpx, cpy, B.sx, B.sy);
              headX = B.sx;
              headY = B.sy;
            } else {
              const u = seg,
                w1 = (1 - u) * (1 - u),
                w2 = 2 * (1 - u) * u,
                w3 = u * u;
              headX = w1 * A.sx + w2 * cpx + w3 * B.sx;
              headY = w1 * A.sy + w2 * cpy + w3 * B.sy;
              ctx.quadraticCurveTo(
                A.sx + u * (cpx - A.sx),
                A.sy + u * (cpy - A.sy),
                headX,
                headY,
              );
            }
          }
          ctx.stroke();
          // putujúci impulz na čele kresliacej sa dráhy — „signál myšlienky"
          if (total > 0.05 && total < segs - 0.02) {
            ctx.globalAlpha = env * 0.14;
            ctx.beginPath();
            ctx.arc(headX, headY, 4.6, 0, 6.2832);
            ctx.fill();
            ctx.globalAlpha = env * 0.75;
            ctx.beginPath();
            ctx.arc(headX, headY, 1.7, 0, 6.2832);
            ctx.fill();
          }
          for (let s2 = 1; s2 < P.length; s2++) {
            const reach = Math.min(1, Math.max(0, total - (s2 - 1)));
            if (reach <= 0) break;
            const qn = proj[P[s2]],
              dq = (qn.z + 1) / 2;
            ctx.globalAlpha = env * reach * (0.1 + dq * 0.3);
            ctx.beginPath();
            ctx.arc(qn.sx, qn.sy, 1.0 + dq * 1.05, 0, 6.2832);
            ctx.fill();
          }
        }
        ctx.globalAlpha = env * (0.06 + dO * 0.11);
        ctx.beginPath();
        ctx.arc(O.sx, O.sy, 6.0 + dO * 2.8, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = env * (0.12 + dO * 0.2);
        ctx.beginPath();
        ctx.arc(O.sx, O.sy, 2.9 + dO * 1.5, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = env * (0.3 + dO * 0.5);
        ctx.beginPath();
        ctx.arc(O.sx, O.sy, 1.4 + dO * 1.1, 0, 6.2832);
        ctx.fill();
        // metakognitívna otázka pri výboji — objaví sa a s ním aj odznie
        if (L.word) {
          const ox = O.sx - cx,
            oy = O.sy - cy,
            ol = Math.sqrt(ox * ox + oy * oy) || 1;
          const wx = O.sx + (ox / ol) * 24;
          const wy = O.sy + (oy / ol) * 24 - k * 10; // jemný vzostup
          ctx.font = WORD_FONT;
          ctx.textBaseline = "middle";
          const wWidth = ctx.measureText(L.word).width;
          const tx = Math.max(8 + wWidth / 2, Math.min(W - 8 - wWidth / 2, wx));
          const ty = Math.max(12, Math.min(H - 12, wy));
          ctx.globalAlpha = env * 0.9;
          ctx.fillStyle = "#23407A";
          ctx.textAlign = "center";
          ctx.fillText(L.word, tx, ty);
          ctx.fillStyle = INK;
        }
      }
      for (let i = 0; i < N; i++) {
        const qd = proj[i],
          dd = (qd.z + 1) / 2;
        let sx = qd.sx,
          sy = qd.sy,
          boost = 0;
        if (mouseIn && qd.z > -0.2) {
          const dx = mx - sx,
            dy = my - sy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < proxR) {
            boost = 1 - d / proxR; // rozžiarenie + jemné pritiahnutie ku kurzoru
            const pull = boost * boost * 6;
            sx += (dx / (d || 1)) * pull;
            sy += (dy / (d || 1)) * pull;
          }
        }
        ctx.globalAlpha = Math.min(1, 0.06 + dd * 0.42 + boost * 0.45);
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6 + dd * 1.28 + boost * 1.5, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (now > nextLink && links.length < 3) {
        spawnLink(Math.random() < 0.55);
        nextLink = now + 1600 + Math.random() * 1400;
      }
    }

    function toLocal(e: PointerEvent) {
      const r = cv!.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    }
    function onDown(e: PointerEvent) {
      dragging = true;
      moveVel = 0;
      px = e.clientX;
      py = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      dragDist = 0;
      cv!.style.cursor = "grabbing";
      try {
        cv!.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    function onMove(e: PointerEvent) {
      toLocal(e);
      mouseIn = true;
      if (!dragging) {
        // pohyb kurzora „vystreľuje" synapsie z najbližšieho bodu
        travel += Math.abs(e.movementX ?? 0) + Math.abs(e.movementY ?? 0);
        const now = performance.now();
        if (!reduced && travel > 34 && now > nextCursorFire && links.length < 4) {
          const idx = nearestFrontPoint(proxRadius());
          if (idx >= 0) {
            spawnLinkFrom(idx, !hasActiveWord() && Math.random() < 0.6);
            nextCursorFire = now + 420;
          }
          travel = 0;
        }
        return;
      }
      const dx = e.clientX - px,
        dy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      rotY += dx * 0.006;
      tiltX = Math.max(-0.85, Math.min(0.3, tiltX - dy * 0.004));
      moveVel = 0.85 * moveVel + (0.15 * (dx * 0.006)) / 16;
      if (reduced) frame(performance.now());
    }
    const proxRadius = () => Math.min(W, H) * 0.2;
    function onUp(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      // klik/ťuk bez ťahu = záblesk myslenia (burst 2 synapsií + otázka)
      const moved = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
      if (!reduced && moved < 6 && dragDist < 6) {
        toLocal(e);
        const idx = nearestFrontPoint(proxRadius() * 1.6);
        if (idx >= 0) {
          spawnLinkFrom(idx, true);
          const nb = nbr[idx];
          spawnLinkFrom(nb[(Math.random() * nb.length) | 0], false);
        }
      }
      rotVel = Math.max(-0.006, Math.min(0.006, moveVel));
      cv!.style.cursor = "grab";
    }
    function onLeave() {
      mouseIn = false;
      mx = -1e4;
      my = -1e4;
    }
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave);

    let rafId = 0;
    let orbIO: IntersectionObserver | null = null;
    const timeouts: number[] = [];
    ready = true; // all state (proj/links/frame) is now defined

    // Prvý frame synchrónne — sféra je viditeľná aj v prostrediach, kde je
    // rAF pozastavený (webview na pozadí, šetriaci režim…).
    frame(performance.now());

    if (reduced) {
      rafId = requestAnimationFrame((t) => frame(t));
    } else {
      wrap.style.opacity = "0";
      wrap.style.transition = "opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s";
      requestAnimationFrame(() => {
        if (wrap) wrap.style.opacity = "1";
      });
      // fallback: keby rAF nebežal, sféru aj tak ukáž
      const showT = window.setTimeout(() => {
        if (wrap) wrap.style.opacity = "1";
      }, 700);
      timeouts.push(showT);

      orbIO = new IntersectionObserver(
        (es) => {
          running = es[es.length - 1].isIntersecting;
        },
        { threshold: 0 },
      );
      orbIO.observe(wrap);

      const loop = (now: number) => {
        rafId = requestAnimationFrame(loop);
        if (!running || document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min(50, now - last);
        last = now;
        if (!dragging) {
          rotVel += (baseVel - rotVel) * 0.01;
          rotY += rotVel * dt;
        }
        frame(now);
      };
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafId);
      timeouts.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", resize);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("pointerleave", onLeave);
      orbIO?.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" data-orb>
      <canvas ref={canvasRef} data-orb-canvas />
    </div>
  );
}
