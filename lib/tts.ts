"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Slovak text-to-speech via the Web Speech API. A bonus affordance —
 * the parent's own voice is always the primary channel; the button
 * only renders when a Slovak (or Czech fallback) voice exists.
 */
export function useTts() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function pick() {
      const voices = window.speechSynthesis.getVoices();
      const found =
        voices.find((v) => v.lang.toLowerCase().startsWith("sk")) ??
        voices.find((v) => v.lang.toLowerCase().startsWith("cs")) ??
        null;
      setVoice(found);
    }

    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pick);
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.85) => {
      if (!voice) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = rate;
      window.speechSynthesis.speak(u);
    },
    [voice],
  );

  return { supported: voice !== null, speak };
}
