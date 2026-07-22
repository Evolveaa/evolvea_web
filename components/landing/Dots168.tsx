"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 168 hodín týždňa ako mriežka 24 × 7 bodiek (stĺpec = hodina, riadok = deň).
 * Jedna plná bodka = hodina v ambulancii; sedem pulzujúcich = večery
 * s Evolveou o 19:00. Bodky sa po scrollnutí do záberu postupne „rozsvietia".
 */

const HOURS = 24;
const DAYS = 7;
const THERAPY = { day: 2, hour: 15 }; // streda 15:00 — hodina u logopéda
const EVENING_HOUR = 19; // večerné cvičenie s Evolveou

const GAP = 10;
const R = 2.3;
const W = HOURS * GAP;
const H = DAYS * GAP;

export default function Dots168() {
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof window.IntersectionObserver !== "function"
    ) {
      const id = requestAnimationFrame(() => setOn(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const dots = [];
  for (let d = 0; d < DAYS; d++) {
    for (let h = 0; h < HOURS; h++) {
      const i = d * HOURS + h;
      const isTherapy = d === THERAPY.day && h === THERAPY.hour;
      const isEvening = h === EVENING_HOUR;
      dots.push(
        <circle
          key={i}
          cx={h * GAP + GAP / 2}
          cy={d * GAP + GAP / 2}
          r={isTherapy ? R + 1.2 : isEvening ? R + 0.6 : R}
          className={isTherapy ? "d-th" : isEvening ? "d-ev" : "d-b"}
          style={{ ["--i" as string]: i, ["--d" as string]: d }}
        />,
      );
    }
  }

  return (
    <div className={`dots168${on ? " on" : ""}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Týždeň dieťaťa: 168 hodín, z toho 1 hodina u logopéda a 7 večerov s Evolveou"
      >
        {dots}
      </svg>
      <div className="dots168-legend" aria-hidden="true">
        <span>
          <i className="l-th" /> 1 hodina u vás
        </span>
        <span>
          <i className="l-ev" /> 7 večerov s Evolveou
        </span>
        <span>
          <i className="l-b" /> zvyšok týždňa
        </span>
      </div>
    </div>
  );
}
