"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { MemorySequenceContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";
import Glyph from "./Glyph";

type Phase = "watch" | "recall";

/** Watch the emoji sequence, then rebuild it from the palette. */
export default function MemorySequenceTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<MemorySequenceContent>) {
  const t = useTranslations("player");
  const { praise } = useFeedbackLines();

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("watch");
  const [picked, setPicked] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<{ firstTry: boolean; hinted: boolean }[]>([]);
  const hinted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = content.items[index];
  const revealMs = Math.max(2500, (content.revealMsPerItem ?? 1200) * item.sequence.length);
  const palette = useMemo(
    () => shuffle([...item.sequence, ...item.distractors]),
    [item],
  );

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  // auto-hide after the watch window
  useEffect(() => {
    if (phase !== "watch" || solved) return;
    const id = setTimeout(() => setPhase("recall"), revealMs);
    return () => clearTimeout(id);
  }, [phase, revealMs, solved, index, attempts]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function advance() {
    const next = index + 1;
    if (next >= content.items.length) {
      onFinish({
        correct: results.current.filter((r) => r.firstTry).length,
        total: content.items.length,
        hintsUsed: results.current.filter((r) => r.hinted).length,
        detail: {
          items: results.current.map((r, i) => ({
            length: content.items[i].sequence.length,
            firstTry: r.firstTry,
            hinted: r.hinted,
          })),
        },
      });
      return;
    }
    hinted.current = false;
    setIndex(next);
    setPhase("watch");
    setPicked([]);
    setAttempts(0);
    setSolved(false);
    setFailed(false);
    setFeedback(null);
    setHintOpen(false);
  }

  function pick(emoji: string) {
    if (solved || failed || phase !== "recall") return;
    const expected = item.sequence[picked.length];
    if (emoji === expected) {
      const next = [...picked, emoji];
      setPicked(next);
      setFeedback(null);
      if (next.length === item.sequence.length) {
        setSolved(true);
        setFeedback({ kind: "good", text: praise() });
        results.current.push({ firstTry: attempts === 0, hinted: hinted.current });
        timer.current = setTimeout(advance, 1300);
      }
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setPicked([]);
      if (nextAttempts >= 2) {
        setFailed(true);
        setPicked([...item.sequence]);
        setFeedback({ kind: "bad", text: t("memory.solution") });
        results.current.push({ firstTry: false, hinted: hinted.current });
        timer.current = setTimeout(advance, 2600);
      } else {
        setFeedback({ kind: "bad", text: t("memory.again") });
        setPhase("watch");
      }
    }
  }

  return (
    <>
      <p className="player-prompt">
        {phase === "watch" ? t("memory.watchPrompt") : t("memory.recallPrompt")}
      </p>

      <div className="mem-stage" aria-live="polite">
        {phase === "watch" ? (
          item.sequence.map((e, i) => (
            <span key={i} className="mem-tile">
              <Glyph emoji={e} size={54} />
            </span>
          ))
        ) : (
          item.sequence.map((_, i) => (
            <span
              key={i}
              className="mem-tile mem-slot"
              data-filled={i < picked.length ? "" : undefined}
            >
              {i < picked.length ? <Glyph emoji={picked[i]} size={54} /> : i + 1}
            </span>
          ))
        )}
      </div>

      {phase === "watch" && !solved && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <button type="button" className="btn btn-primary" onClick={() => setPhase("recall")}>
            {t("memory.hideNow")}
          </button>
        </div>
      )}

      {phase === "recall" && !solved && !failed && (
        <div className="sbx-chips" role="group" aria-label={t("memory.paletteLabel")}>
          {palette.map((e, i) => (
            <button
              key={`${e}-${i}`}
              type="button"
              className="mem-tile"
              style={{ cursor: "pointer" }}
              onClick={() => pick(e)}
            >
              <Glyph emoji={e} size={54} />
            </button>
          ))}
        </div>
      )}

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>

      {hintsEnabled && item.hint && phase === "recall" && !solved && !failed && (
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
      {hintOpen && item.hint && phase === "recall" && !solved && !failed && (
        <p className="hint-bubble">{item.hint}</p>
      )}
    </>
  );
}
