"use client";

import { useEffect } from "react";

/**
 * Entrance & count-up animácie pre landing. Port of script.js:
 *   [data-line]  — riadky hero nadpisu, ktoré sa vysunú zdola pri načítaní
 *   [data-r]     — bloky, ktoré sa objavia (fade + rise)
 *   [data-count] — čísla, ktoré napočítajú od 0
 * Rešpektuje prefers-reduced-motion.
 *
 * Robustnosť: obsah, ktorý je pri načítaní vo viewporte (hero), sa odhalí
 * DETERMINISTICKY (nezávisle od IntersectionObservera), takže hero nikdy
 * nezostane prázdny, ak by observer/rAF zlyhal. Obsah pod záhybom sa odhaľuje
 * pri scrollovaní cez observer (ako v origináli).
 */
export default function LandingFx() {
  useEffect(() => {
    const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeouts: number[] = [];

    const lines = Array.from(document.querySelectorAll<HTMLElement>("[data-line]"));
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-r]"));
    const nums = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));

    function runCount(el: HTMLElement) {
      const target = parseInt(el.getAttribute("data-count") || "0", 10) || 0;
      if (target === 0) {
        el.textContent = "0";
        return;
      }
      const dur = 1000;
      const t0 = performance.now();
      let done = false;
      function step(t: number) {
        const p = Math.min(1, (t - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = String(Math.round(e * target));
        if (p < 1) requestAnimationFrame(step);
        else done = true;
      }
      requestAnimationFrame(step);
      // fallback: keby rAF nebežal, po čase ukáž finálnu hodnotu
      timeouts.push(
        window.setTimeout(() => {
          if (!done) el.textContent = String(target);
        }, dur + 400),
      );
    }

    // Reduced motion / no IntersectionObserver: show final values, never hide.
    if (reduced || typeof window.IntersectionObserver !== "function") {
      nums.forEach((el) => {
        el.textContent = el.getAttribute("data-count");
      });
      return;
    }

    const inView = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    const revealItem = (el: HTMLElement) => {
      const delay = (parseInt(el.getAttribute("data-r") || "0", 10) || 0) * 75;
      el.style.transition =
        "opacity 0.65s " + EASE + " " + delay + "ms, transform 0.65s " + EASE + " " + delay + "ms";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    };

    // Pre-animation state.
    nums.forEach((el) => {
      el.textContent = "0";
    });
    lines.forEach((el) => {
      el.style.transform = "translateY(115%)";
    });
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
    });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealObserver.unobserve(entry.target);
          revealItem(entry.target as HTMLElement);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          runCount(entry.target as HTMLElement);
        });
      },
      { threshold: 0.35 },
    );

    // Reveal je idempotentný a spúšťa sa cez dvojitý rAF AJ cez timeout —
    // keby bol rAF pozastavený (webview na pozadí, šetriaci režim), obsah
    // sa aj tak odhalí.
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      lines.forEach((el, i) => {
        el.style.transition = "transform 0.85s " + EASE + " " + (120 + i * 110) + "ms";
        el.style.transform = "translateY(0)";
      });
      // Items in view → reveal now (no observer dependency); the rest → observe.
      items.forEach((el) => {
        if (inView(el)) revealItem(el);
        else revealObserver.observe(el);
      });
    };
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(reveal);
    });
    timeouts.push(window.setTimeout(reveal, 600));

    // Counts in view → run now; the rest → observe.
    nums.forEach((el) => {
      if (inView(el)) runCount(el);
      else countObserver.observe(el);
    });

    return () => {
      cancelAnimationFrame(raf1);
      timeouts.forEach((t) => window.clearTimeout(t));
      revealObserver.disconnect();
      countObserver.disconnect();
    };
  }, []);

  return null;
}
