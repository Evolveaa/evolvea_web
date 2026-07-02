"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTts } from "@/lib/tts";
import type { ChoiceContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

/** Multiple choice with big tappable emoji cards. */
export default function ChoiceTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<ChoiceContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();
  const { supported, speak } = useTts();

  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<{ errors: number; hinted: boolean }[]>([]);
  const hinted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = content.items[index];
  const options = useMemo(() => shuffle(item.options.map((o, i) => ({ ...o, key: i }))), [item]);

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function choose(key: number, correct: boolean | undefined) {
    if (solved || wrong.has(key)) return;
    if (correct) {
      setSolved(true);
      setFeedback({ kind: "good", text: praise() });
      results.current.push({ errors: wrong.size, hinted: hinted.current });
      timer.current = setTimeout(advance, 1000);
    } else {
      setWrong((prev) => new Set(prev).add(key));
      setFeedback({ kind: "bad", text: encourage() });
    }
  }

  function advance() {
    const next = index + 1;
    if (next >= content.items.length) {
      const errors = results.current;
      onFinish({
        correct: errors.filter((r) => r.errors === 0).length,
        total: content.items.length,
        hintsUsed: errors.filter((r) => r.hinted).length,
        detail: {
          items: errors.map((r, i) => ({
            prompt: content.items[i].prompt,
            firstTry: r.errors === 0,
            errors: r.errors,
            hinted: r.hinted,
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

  return (
    <>
      <p className="player-prompt">{item.prompt}</p>

      {supported && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.2rem" }}>
          <button type="button" className="say-btn" onClick={() => speak(item.say ?? item.prompt)}>
            🔊 {t("sayIt")}
          </button>
        </div>
      )}

      <div className="opt-grid">
        {options.map((o) => {
          const state = solved
            ? o.correct
              ? "correct"
              : "dim"
            : wrong.has(o.key)
              ? "wrong"
              : undefined;
          return (
            <button
              key={o.key}
              type="button"
              className="opt-card"
              data-state={state}
              disabled={solved || wrong.has(o.key)}
              onClick={() => choose(o.key, o.correct)}
            >
              {o.emoji && (
                <span className="opt-emoji" aria-hidden="true">
                  {o.emoji}
                </span>
              )}
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>

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
      {hintOpen && item.hint && <p className="hint-bubble">{item.hint}</p>}
    </>
  );
}
