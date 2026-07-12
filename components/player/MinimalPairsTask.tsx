"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTts } from "@/lib/tts";
import type { MinimalPairsContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

type Side = "a" | "b";
/** Answer keys in same_different mode. */
type SdKey = "same" | "different";

/**
 * Minimal pairs (Barlow & Gierut) — perception of a one-phoneme contrast.
 *
 * listen          — the parent (or TTS) says one word of the pair; the child
 *                   taps the matching picture out of two large cards.
 * same_different  — the parent reads two words aloud; the child judges purely
 *                   by ear whether they sounded the same. Pictures are
 *                   revealed only AFTER the answer.
 */
export default function MinimalPairsTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<MinimalPairsContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();
  const { supported, speak } = useTts();

  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<{ errors: number; hinted: boolean }[]>([]);
  const hinted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isListen = content.mode === "listen";
  const item = content.items[index];

  /** listen mode: which side the parent says this round (validator enforces it). */
  const saidSide: Side = item.say ?? "a";
  /** listen mode: the two picture cards, order randomized per item. */
  const cards = useMemo(
    () =>
      shuffle([
        { ...item.a, side: "a" as Side },
        { ...item.b, side: "b" as Side },
      ]),
    [item],
  );

  /** same_different mode: the two words the parent reads aloud. */
  const spokenFirst = item.a.word;
  const spokenSecond = item.same ? item.a.word : item.b.word;

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function solve(pauseMs: number) {
    setSolved(true);
    setFeedback({ kind: "good", text: praise() });
    results.current.push({ errors: wrong.size, hinted: hinted.current });
    timer.current = setTimeout(advance, pauseMs);
  }

  function miss(key: string) {
    setWrong((prev) => new Set(prev).add(key));
    setFeedback({ kind: "bad", text: encourage() });
  }

  function pickCard(side: Side) {
    if (solved || wrong.has(side)) return;
    if (side === saidSide) solve(1000);
    else miss(side);
  }

  function answerSd(key: SdKey) {
    if (solved || wrong.has(key)) return;
    const correct = (key === "same") === (item.same === true);
    if (correct) solve(1600); // a beat longer — the child sees the revealed pictures
    else miss(key);
  }

  function advance() {
    const next = index + 1;
    if (next >= content.items.length) {
      const r = results.current;
      onFinish({
        correct: r.filter((x) => x.errors === 0).length,
        total: content.items.length,
        hintsUsed: r.filter((x) => x.hinted).length,
        detail: {
          mode: content.mode,
          contrast: content.contrast,
          items: r.map((x, i) => {
            const it = content.items[i];
            return {
              a: it.a.word,
              b: it.b.word,
              ...(content.mode === "listen"
                ? { said: it.say ?? "a" }
                : { same: it.same === true }),
              firstTry: x.errors === 0,
              errors: x.errors,
              hinted: x.hinted,
            };
          }),
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

  const sdState = (key: SdKey) => {
    const isCorrectBtn = (key === "same") === (item.same === true);
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
      {/* parent strip — the adult speaks; the child only listens */}
      <aside className="mp-parent">
        <span className="mp-parent-kicker">{t("minimalPairs.parentLabel")}</span>
        <p className="mp-parent-text">
          {isListen
            ? t("minimalPairs.parentSay", { word: item[saidSide].word })
            : t("minimalPairs.parentPair", { first: spokenFirst, second: spokenSecond })}
        </p>
        <div className="mp-parent-row">
          {supported && (
            <button
              type="button"
              className="say-btn"
              onClick={() =>
                isListen
                  ? speak(item[saidSide].word, 0.75)
                  : speak(`${spokenFirst}. ${spokenSecond}.`, 0.7)
              }
            >
              🔊 {isListen ? t("minimalPairs.playWord") : t("minimalPairs.playPair")}
            </button>
          )}
          <span className="mp-contrast">
            {t("minimalPairs.contrast", { contrast: content.contrast })}
          </span>
        </div>
      </aside>

      <p className="player-prompt">
        {isListen ? t("minimalPairs.listenPrompt") : t("minimalPairs.sdPrompt")}
      </p>

      {isListen ? (
        <div className="opt-grid">
          {cards.map((c) => {
            const state = solved
              ? c.side === saidSide
                ? "correct"
                : "dim"
              : wrong.has(c.side)
                ? "wrong"
                : undefined;
            return (
              <button
                key={c.side}
                type="button"
                className="opt-card mp-card"
                data-state={state}
                disabled={solved || wrong.has(c.side)}
                onClick={() => pickCard(c.side)}
              >
                <span className="opt-emoji" aria-hidden="true">
                  {c.emoji}
                </span>
                <span>{c.word}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="opt-grid">
            {(["same", "different"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className="opt-card mp-card"
                data-state={sdState(key)}
                disabled={solved || wrong.has(key)}
                onClick={() => answerSd(key)}
              >
                <span className="opt-emoji" aria-hidden="true">
                  {key === "same" ? "🟰" : "❗"}
                </span>
                <span>{key === "same" ? t("minimalPairs.same") : t("minimalPairs.different")}</span>
              </button>
            ))}
          </div>

          {/* the pictures appear only after the (purely auditory) judgement */}
          {solved && (
            <div className="mp-reveal" role="status">
              <span className="mp-reveal-caption">
                {item.same ? t("minimalPairs.revealSame") : t("minimalPairs.revealDifferent")}
              </span>
              <div className="mp-reveal-cards">
                <span className="mp-reveal-card">
                  <span className="mp-reveal-emoji" aria-hidden="true">
                    {item.a.emoji}
                  </span>
                  {item.a.word}
                </span>
                {!item.same && (
                  <span className="mp-reveal-card">
                    <span className="mp-reveal-emoji" aria-hidden="true">
                      {item.b.emoji}
                    </span>
                    {item.b.word}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
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
  );
}
