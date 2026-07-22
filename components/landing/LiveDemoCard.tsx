"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Živá ukážka večerného cvičenia — malá karta v hero, v ktorej sa v reálnom
 * čase „píše" odpoveď dieťaťa na otázku rodiča a vzápätí sa uloží logopédovi.
 * Jediný pohľad a každý pochopí, čo Evolvea robí.
 * Rešpektuje prefers-reduced-motion (statická prvá výmena, bez cyklenia).
 */

const EXCHANGES = [
  {
    child: "Leo · 7 r.",
    program: "Zaseknutá skladačka",
    q: "Prečo si dal veľkú kocku úplne dole?",
    a: "Lebo keď sú veľké hore, veža spadne… veľké musia ísť prvé.",
  },
  {
    child: "Ema · 6 r.",
    program: "Sluchové rozlišovanie",
    q: "Ako si vedela, že tam patrí Š?",
    a: "Poviem si to nahlas a počujem, ako to šumí — šššš.",
  },
  {
    child: "Adam · 8 r.",
    program: "Pracovná pamäť",
    q: "Čo skúsiš, keď sa zasekneš?",
    a: "Nadýchnem sa a rozdelím si to na menšie kúsky.",
  },
] as const;

const TYPE_MS = 30; // rýchlosť písania odpovede
const HOLD_MS = 3000; // pauza po uložení, kým sa preklopí ďalšia výmena
const Q_MS = 1100; // ako dlho „znie" otázka, kým dieťa začne odpovedať

export default function LiveDemoCard() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState(0); // počet napísaných znakov odpovede
  const [saved, setSaved] = useState(false);
  const [staticMode, setStaticMode] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStaticMode(true);
      setTyped(EXCHANGES[0].a.length);
      setSaved(true);
      return;
    }
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, []);

  // Jedna výmena: otázka → písanie odpovede → uložené → ďalšia výmena.
  useEffect(() => {
    if (staticMode) return;
    const ex = EXCHANGES[idx];
    const push = (t: number) => timers.current.push(t);
    setTyped(0);
    setSaved(false);
    let ch = 0;
    push(
      window.setTimeout(function type() {
        ch += 1;
        setTyped(ch);
        if (ch < ex.a.length) {
          push(window.setTimeout(type, TYPE_MS + (ex.a[ch - 1] === " " ? 14 : 0)));
        } else {
          push(window.setTimeout(() => setSaved(true), 420));
          push(
            window.setTimeout(() => setIdx((i) => (i + 1) % EXCHANGES.length), 420 + HOLD_MS),
          );
        }
      }, Q_MS),
    );
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [idx, staticMode]);

  const ex = EXCHANGES[idx];
  const answer = ex.a.slice(0, typed);

  return (
    <aside className="demo-card" aria-label="Ukážka večerného cvičenia">
      <header className="demo-head">
        <span className="demo-live" aria-hidden="true" />
        <span className="demo-title">Dnešný večer · {ex.child}</span>
        <span className="demo-min">10 min</span>
      </header>

      <p className="demo-kicker">Rodič sa pýta</p>
      <p className="demo-q" key={`q${idx}`}>
        „{ex.q}“
      </p>

      <p className="demo-kicker">Dieťa odpovedá</p>
      <p className="demo-a" key={`a${idx}`}>
        {answer}
        {!staticMode && typed < ex.a.length && <span className="demo-caret" aria-hidden="true" />}
      </p>

      <footer className={`demo-foot${saved ? " on" : ""}`}>
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path
            d="M3 8.5 6.4 12 13 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Odpoveď uložená pre logopéda
        <span className="demo-dots" aria-hidden="true">
          {EXCHANGES.map((_, i) => (
            <i key={i} className={i === idx ? "on" : undefined} />
          ))}
        </span>
      </footer>
    </aside>
  );
}
