"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTts } from "@/lib/tts";
import type { SpeechItemsContent } from "@/lib/exercises/types";
import type { TaskProps } from "./shared";

type Score = "great" | "almost" | "practice";

/**
 * Speech practice: the child says it aloud, the parent scores it.
 * Nothing is recorded — deliberately (GDPR + parent–child interaction first).
 */
export default function SpeechTask({ content, onProgress, onFinish }: TaskProps<SpeechItemsContent>) {
  const t = useTranslations("player");
  const { supported, speak } = useTts();

  const [index, setIndex] = useState(0);
  const results = useRef<Score[]>([]);
  // double-tap guard: without it a fast second tap scores the next,
  // never-shown item through the same button position
  const lock = useRef(false);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = content.items[index];

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(() => () => {
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
  }, []);

  function score(s: Score) {
    if (lock.current) return;
    lock.current = true;
    results.current.push(s);
    const next = index + 1;
    if (next >= content.items.length) {
      onFinish({
        correct: results.current.filter((r) => r === "great").length,
        total: content.items.length,
        hintsUsed: 0,
        detail: {
          items: results.current.map((r, i) => ({
            text: content.items[i].text,
            score: r,
          })),
        },
      });
      return; // stay locked — task finished
    }
    setIndex(next);
    unlockTimer.current = setTimeout(() => {
      lock.current = false;
    }, 350);
  }

  return (
    <>
      <p className="player-intro">{t("speech.parentHint")}</p>

      <div className="sp-card">
        {item.emoji && (
          <span className="sp-emoji" aria-hidden="true">
            {item.emoji}
          </span>
        )}
        <p className="sp-text">{item.text}</p>
        {supported && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.9rem" }}>
            <button type="button" className="say-btn" onClick={() => speak(item.text, 0.75)}>
              🔊 {t("sayIt")}
            </button>
          </div>
        )}
        {item.tip && <p className="sp-tip">💡 {item.tip}</p>}
      </div>

      <div className="sp-score" role="group" aria-label={t("speech.scoreLabel")}>
        <button type="button" className="sp-score-btn" data-tone="good" onClick={() => score("great")}>
          <i aria-hidden="true">🌟</i>
          {t("speech.great")}
        </button>
        <button type="button" className="sp-score-btn" data-tone="mid" onClick={() => score("almost")}>
          <i aria-hidden="true">🙂</i>
          {t("speech.almost")}
        </button>
        <button type="button" className="sp-score-btn" data-tone="tricky" onClick={() => score("practice")}>
          <i aria-hidden="true">🌱</i>
          {t("speech.practice")}
        </button>
      </div>
    </>
  );
}
