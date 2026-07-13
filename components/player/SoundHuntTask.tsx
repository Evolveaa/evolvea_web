"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SoundHuntContent } from "@/lib/exercises/types";
import Glyph from "./Glyph";
import { useFeedbackLines, type TaskProps } from "./shared";

/** Answer keys in detect mode. */
type DetectKey = "hear" | "not";

const BOMBARD_MS = 5000;

/**
 * Sound hunt (Hodson's cycles, home component).
 *
 * detect       — the parent says the word; the child taps whether the target
 *                phoneme hides inside it (auto-scored, first-try).
 * bombardment  — a calm auto-advancing carousel of words rich in the target;
 *                the child only listens. Exposure counts as completion —
 *                there is no scoring.
 */
export default function SoundHuntTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<SoundHuntContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();

  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [playing, setPlaying] = useState(true); // bombardment auto-advance

  const results = useRef<{ errors: number; hinted: boolean }[]>([]);
  const hinted = useRef(false);
  const finished = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBombard = content.mode === "bombardment";
  const total = content.items.length;
  const item = content.items[index];
  const target = content.target;

  useEffect(() => {
    onProgress(index, total);
  }, [index, total, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  /* ---------- bombardment: calm auto-advance ---------- */
  const bombardNext = useCallback(() => {
    const next = index + 1;
    if (next >= total) {
      if (finished.current) return;
      finished.current = true;
      onFinish({
        correct: total,
        total,
        hintsUsed: 0,
        detail: {
          mode: "bombardment",
          target,
          items: content.items.map((i) => ({ word: i.word })),
        },
      });
      return;
    }
    setIndex(next);
  }, [index, total, target, content.items, onFinish]);

  useEffect(() => {
    if (!isBombard || !playing) return;
    const id = setTimeout(bombardNext, BOMBARD_MS);
    return () => clearTimeout(id);
  }, [isBombard, playing, bombardNext]);

  /* ---------- detect: first-try scored judgement ---------- */
  function answer(key: DetectKey) {
    if (solved || wrong.has(key)) return;
    const correct = (key === "hear") === item.has;
    if (correct) {
      setSolved(true);
      setFeedback({ kind: "good", text: praise() });
      results.current.push({ errors: wrong.size, hinted: hinted.current });
      timer.current = setTimeout(advance, 1600); // a beat longer — the child sees the revealed word
    } else {
      setWrong((prev) => new Set(prev).add(key));
      setFeedback({ kind: "bad", text: encourage() });
    }
  }

  function advance() {
    const next = index + 1;
    if (next >= total) {
      const r = results.current;
      onFinish({
        correct: r.filter((x) => x.errors === 0).length,
        total,
        hintsUsed: r.filter((x) => x.hinted).length,
        detail: {
          mode: "detect",
          target,
          items: r.map((x, i) => ({
            word: content.items[i].word,
            has: content.items[i].has,
            firstTry: x.errors === 0,
            errors: x.errors,
            hinted: x.hinted,
          })),
        },
      });
      return;
    }
    hinted.current = false;
    setIndex(next);
    setWrong(new Set());
    setSolved(false);
    setFeedback(null);
    setHintOpen(false);
  }

  const detectState = (key: DetectKey) => {
    const isCorrectBtn = (key === "hear") === item.has;
    return solved
      ? isCorrectBtn
        ? ("correct" as const)
        : ("dim" as const)
      : wrong.has(key)
        ? ("wrong" as const)
        : undefined;
  };

  return (
    <>
      {/* parent strip — the adult's voice carries the exercise */}
      <aside className="sh-parent">
        <span className="sh-parent-kicker">{t("soundHunt.parentLabel")}</span>
        <p className="sh-parent-text">
          {isBombard
            ? t("soundHunt.parentBombard", { target })
            : t("soundHunt.parentSay", { word: item.word, target })}
        </p>
      </aside>

      {isBombard ? (
        <>
          <p className="player-prompt">{t("soundHunt.bombardPrompt")}</p>

          <div
            key={index}
            className="sh-stage"
            role="status"
            aria-label={t("soundHunt.wordProgress", { current: index + 1, total })}
          >
            <span className="sh-word-emoji" aria-hidden="true">
              <Glyph emoji={item.emoji ?? "🔉"} size={150} />
            </span>
            <span className="sh-word">{item.word}</span>
          </div>

          <div className="sh-dots" aria-hidden="true">
            {content.items.map((_, i) => (
              <span
                key={i}
                className="sh-dot"
                data-state={i < index ? "done" : i === index ? "current" : undefined}
              />
            ))}
          </div>

          <div className="sh-controls">
            <button
              type="button"
              className="btn btn-outline"
              aria-pressed={!playing}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <>⏸ {t("soundHunt.pause")}</> : <>▶️ {t("soundHunt.play")}</>}
            </button>
            <button type="button" className="btn btn-primary" onClick={bombardNext}>
              {t("soundHunt.next")} →
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="sh-target" aria-label={t("soundHunt.targetLabel", { target })}>
            {target.toUpperCase()}
          </span>

          <p className="player-prompt">{t("soundHunt.detectPrompt", { target })}</p>

          <div className="opt-grid">
            {(["hear", "not"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className="opt-card sh-choice"
                data-state={detectState(key)}
                disabled={solved || wrong.has(key)}
                onClick={() => answer(key)}
              >
                <span className="opt-emoji" aria-hidden="true">
                  <Glyph emoji={key === "hear" ? "🔔" : "➖"} size={54} />
                </span>
                <span>
                  {key === "hear" ? t("soundHunt.hear", { target }) : t("soundHunt.notThere")}
                </span>
              </button>
            ))}
          </div>

          {/* the word's picture appears only after the auditory judgement */}
          {solved && (
            <div className="sh-reveal" role="status">
              <span className="sh-reveal-card">
                <span className="sh-reveal-emoji" aria-hidden="true">
                  <Glyph emoji={item.emoji ?? "🔉"} size={52} />
                </span>
                {item.word}
              </span>
            </div>
          )}

          <p className="play-feedback" data-kind={feedback?.kind} role="status">
            {feedback?.text}
          </p>

          {hintsEnabled && item.hint && !solved && (
            <div className="hint-row">
              <button
                type="button"
                className="hint-btn"
                onClick={() => {
                  hinted.current = true;
                  setHintOpen((v) => !v);
                }}
              >
                💡 {t("hint")}
              </button>
            </div>
          )}
          {hintOpen && item.hint && !solved && <p className="hint-bubble">{item.hint}</p>}
        </>
      )}
    </>
  );
}
