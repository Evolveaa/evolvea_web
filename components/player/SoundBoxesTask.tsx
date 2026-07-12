"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTts } from "@/lib/tts";
import type { PhonemePiece, SoundBoxesContent } from "@/lib/exercises/types";
import { useFeedbackLines, type TaskProps } from "./shared";

const KINDS: PhonemePiece["kind"][] = ["vowel", "long_vowel", "diphthong", "consonant"];

/**
 * Eľkonin sound boxes.
 * count  — child taps one token per heard phoneme, then checks the count.
 * colors — child classifies each phoneme in order with coloured tokens.
 */
export default function SoundBoxesTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<SoundBoxesContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();
  const { supported, speak } = useTts();

  const [index, setIndex] = useState(0);
  const [tokens, setTokens] = useState(0); // count mode
  const [pos, setPos] = useState(0); // colors mode: current phoneme
  const [errors, setErrors] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<{ firstTry: boolean; hinted: boolean }[]>([]);
  const hinted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = content.items[index];
  const phonemes = item.phonemes;

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function finishItem(firstTry: boolean) {
    setSolved(true);
    setRevealed(true);
    setFeedback({ kind: "good", text: praise() });
    results.current.push({ firstTry, hinted: hinted.current });
    timer.current = setTimeout(advance, 1600);
  }

  function advance() {
    const next = index + 1;
    if (next >= content.items.length) {
      onFinish({
        correct: results.current.filter((r) => r.firstTry).length,
        total: content.items.length,
        hintsUsed: results.current.filter((r) => r.hinted).length,
        detail: {
          mode: content.mode,
          items: results.current.map((r, i) => ({
            word: content.items[i].word,
            firstTry: r.firstTry,
            hinted: r.hinted,
          })),
        },
      });
      return;
    }
    hinted.current = false;
    setIndex(next);
    setTokens(0);
    setPos(0);
    setErrors(0);
    setAttempts(0);
    setRevealed(false);
    setSolved(false);
    setFeedback(null);
    setHintOpen(false);
  }

  /* ---------- count mode ---------- */
  function checkCount() {
    if (tokens === phonemes.length) {
      finishItem(attempts === 0);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 2) {
        // show the real structure as a teaching moment
        setFeedback({ kind: "bad", text: t("soundBoxes.showSolution", { count: phonemes.length }) });
        setTokens(phonemes.length);
        setSolved(true);
        setRevealed(true);
        results.current.push({ firstTry: false, hinted: hinted.current });
        timer.current = setTimeout(advance, 2600);
      } else {
        setFeedback({ kind: "bad", text: t("soundBoxes.tryAgain") });
        setTokens(0);
      }
    }
  }

  /* ---------- colors mode ---------- */
  function pickKind(kind: PhonemePiece["kind"]) {
    if (solved) return;
    if (kind === phonemes[pos].kind) {
      const next = pos + 1;
      setPos(next);
      setFeedback(null);
      if (next >= phonemes.length) finishItem(errors === 0);
    } else {
      setErrors((e) => e + 1);
      setFeedback({ kind: "bad", text: encourage() });
    }
  }

  const kindLabel = (k: PhonemePiece["kind"]) => t(`soundBoxes.kinds.${k}`);

  return (
    <>
      <p className="player-prompt">
        {content.mode === "count" ? t("soundBoxes.countPrompt") : t("soundBoxes.colorsPrompt")}
      </p>

      {item.emoji && (
        <span className="sbx-emoji" aria-hidden="true">
          {item.emoji}
        </span>
      )}

      {/* In count mode the written word stays hidden until solved — children
          must count sounds, not letters. */}
      {(content.mode === "colors" || revealed) && (
        <p style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.9rem" }}>
          {item.word.toUpperCase()}
        </p>
      )}

      {supported && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.2rem" }}>
          <button type="button" className="say-btn" onClick={() => speak(item.word, 0.7)}>
            🔊 {t("soundBoxes.sayWord")}
          </button>
        </div>
      )}

      {content.mode === "count" ? (
        <>
          <div className="sbx-word" role="status" aria-label={t("soundBoxes.tokensSoFar", { count: tokens })}>
            {revealed
              ? phonemes.map((p, i) => (
                  <span key={i} className="sbx-box" data-filled={p.kind}>
                    {p.sound}
                  </span>
                ))
              : Array.from({ length: Math.max(tokens, 1) }, (_, i) => (
                  <span
                    key={i}
                    className="sbx-box"
                    data-filled={i < tokens ? "neutral" : undefined}
                  />
                ))}
          </div>
          {!solved && (
            <div className="sbx-chips">
              <button
                type="button"
                className="sbx-chip"
                data-kind="neutral"
                onClick={() => setTokens((n) => Math.min(n + 1, 9))}
              >
                <span style={{ fontSize: "1.4rem" }}>＋</span>
                {t("soundBoxes.addToken")}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setTokens((n) => Math.max(n - 1, 0))}
                disabled={tokens === 0}
              >
                {t("soundBoxes.removeToken")}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={checkCount}
                disabled={tokens === 0}
              >
                {t("soundBoxes.check")}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="sbx-word">
            {phonemes.map((p, i) => (
              <span
                key={i}
                className="sbx-box"
                data-filled={i < pos || solved ? p.kind : undefined}
                style={i === pos && !solved ? { borderColor: "var(--accent-ink)" } : undefined}
              >
                {p.sound}
              </span>
            ))}
          </div>
          {!solved && (
            <div className="sbx-chips" role="group" aria-label={t("soundBoxes.paletteLabel")}>
              {KINDS.map((k) => (
                <button key={k} type="button" className="sbx-chip" data-kind={k} onClick={() => pickKind(k)}>
                  {kindLabel(k)}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>

      {hintsEnabled && !solved && (
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
      {hintOpen && !solved && (
        <p className="hint-bubble">
          {content.mode === "count"
            ? (item.hint ?? t("soundBoxes.countHint"))
            : (item.hint ??
              // guide the decision procedure — never reveal the kind itself
              t("soundBoxes.colorsHintAsk", { sound: phonemes[pos].sound }))}
        </p>
      )}
    </>
  );
}
