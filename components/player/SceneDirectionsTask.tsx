"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useTts } from "@/lib/tts";
import type { SceneAnchor, SceneDirectionsContent } from "@/lib/exercises/types";
import { useFeedbackLines, type TaskProps } from "./shared";

interface CellPos {
  row: number;
  col: number;
}

/**
 * Scene directions (Token Test / barrier game) — receptive language.
 * The parent reads a spatial instruction aloud; the child lifts emoji
 * tokens from the tray and places them on a landmark board. Placement is
 * only checked when the child presses "Done!", so self-correction is free.
 * First-try = the round solved with zero wrong placements at check time.
 */
export default function SceneDirectionsTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<SceneDirectionsContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();
  const { supported, speak } = useTts();

  const { board, rounds } = content;

  const [index, setIndex] = useState(0);
  const [placements, setPlacements] = useState<Record<string, CellPos>>({});
  const [lifted, setLifted] = useState<string | null>(null);
  /** Tokens confirmed correct on a failed check — they stay on the board. */
  const [locked, setLocked] = useState<Set<string>>(new Set());
  /** Tokens wobbling back to the tray right now. */
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);
  const [solved, setSolved] = useState(false);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<{ errors: number; hinted: boolean }[]>([]);
  const hinted = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = rounds[index];

  const anchorAt = useMemo(() => {
    const m = new Map<string, SceneAnchor>();
    for (const a of board.anchors) m.set(`${a.row}:${a.col}`, a);
    return m;
  }, [board]);

  const tokenAt = useMemo(() => {
    const m = new Map<string, string>();
    for (const [token, pos] of Object.entries(placements)) m.set(`${pos.row}:${pos.col}`, token);
    return m;
  }, [placements]);

  const allPlaced = round.tokens.every((token) => token in placements);

  useEffect(() => {
    onProgress(index, rounds.length);
  }, [index, rounds.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function liftToken(token: string) {
    if (solved || checking || token in placements) return;
    setLifted((cur) => (cur === token ? null : token));
    setFeedback(null);
  }

  function tapCell(row: number, col: number) {
    if (solved || checking) return;
    const placedToken = tokenAt.get(`${row}:${col}`);
    if (placedToken) {
      // self-correction: bring a placed (unlocked) token back to the tray
      if (locked.has(placedToken)) return;
      setPlacements((prev) => {
        const next = { ...prev };
        delete next[placedToken];
        return next;
      });
      setLifted(null);
      return;
    }
    if (!lifted) return;
    setPlacements((prev) => ({ ...prev, [lifted]: { row, col } }));
    setLifted(null);
  }

  function check() {
    if (!allPlaced || solved || checking) return;
    const wrongSet = new Set<string>();
    for (const p of round.places) {
      const pos = placements[p.token];
      if (!pos || pos.row !== p.row || pos.col !== p.col) wrongSet.add(p.token);
    }
    if (wrongSet.size === 0) {
      setSolved(true);
      setFeedback({ kind: "good", text: praise() });
      results.current.push({ errors, hinted: hinted.current });
      timer.current = setTimeout(advance, 1400);
    } else {
      setChecking(true);
      setWrong(wrongSet);
      setErrors((e) => e + wrongSet.size);
      setFeedback({ kind: "bad", text: encourage() });
      // the correctly placed tokens stay put for the retry
      setLocked(new Set(round.tokens.filter((token) => !wrongSet.has(token))));
      timer.current = setTimeout(() => {
        setPlacements((prev) => {
          const next = { ...prev };
          for (const token of wrongSet) delete next[token];
          return next;
        });
        setWrong(new Set());
        setChecking(false);
      }, 650);
    }
  }

  function advance() {
    const next = index + 1;
    if (next >= rounds.length) {
      onFinish({
        correct: results.current.filter((r) => r.errors === 0).length,
        total: rounds.length,
        hintsUsed: results.current.filter((r) => r.hinted).length,
        detail: {
          items: results.current.map((r, i) => ({
            instruction: rounds[i].instruction,
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
    setPlacements({});
    setLifted(null);
    setLocked(new Set());
    setWrong(new Set());
    setChecking(false);
    setSolved(false);
    setErrors(0);
    setFeedback(null);
    setHintOpen(false);
  }

  const cellPos = (row: number, col: number) =>
    t("sceneDirections.cellPos", { row: row + 1, col: col + 1 });

  return (
    <>
      <p className="player-prompt">{t("sceneDirections.prompt")}</p>

      {/* parent strip — the instruction is read aloud, not shown as child content */}
      <div className="scd-parent">
        <span className="scd-parent-kicker">🗣️ {t("sceneDirections.parentReads")}</span>
        <p className="scd-parent-text">{round.instruction}</p>
        {supported && (
          <button
            type="button"
            className="say-btn"
            onClick={() => speak(round.instruction, 0.8)}
          >
            🔊 {t("sayIt")}
          </button>
        )}
      </div>

      <div
        className="scd-board"
        role="group"
        aria-label={t("sceneDirections.boardLabel")}
        data-lifted={lifted ? "" : undefined}
        style={{ gridTemplateColumns: `repeat(${board.cols}, 1fr)` }}
      >
        {Array.from({ length: board.rows }, (_, row) =>
          Array.from({ length: board.cols }, (_, col) => {
            const key = `${row}:${col}`;
            const anchor = anchorAt.get(key);
            if (anchor) {
              return (
                <div
                  key={key}
                  className="scd-cell scd-anchor"
                  role="img"
                  aria-label={`${anchor.label} — ${cellPos(row, col)}`}
                >
                  <span className="scd-cell-emoji" aria-hidden="true">
                    {anchor.emoji}
                  </span>
                  <span className="scd-anchor-label" aria-hidden="true">
                    {anchor.label}
                  </span>
                </div>
              );
            }
            const token = tokenAt.get(key);
            if (token) {
              const isLocked = locked.has(token);
              const state = solved
                ? "correct"
                : wrong.has(token)
                  ? "wrong"
                  : isLocked
                    ? "locked"
                    : "filled";
              return (
                <button
                  key={key}
                  type="button"
                  className="scd-cell scd-filled"
                  data-state={state}
                  disabled={solved || checking || isLocked}
                  onClick={() => tapCell(row, col)}
                  aria-label={
                    isLocked || solved
                      ? `${token} — ${t("sceneDirections.lockedCell")} — ${cellPos(row, col)}`
                      : `${token} — ${t("sceneDirections.filledCell")} — ${cellPos(row, col)}`
                  }
                >
                  <span className="scd-cell-token" aria-hidden="true">
                    {token}
                  </span>
                </button>
              );
            }
            return (
              <button
                key={key}
                type="button"
                className="scd-cell scd-empty"
                disabled={!lifted || solved || checking}
                onClick={() => tapCell(row, col)}
                aria-label={`${t("sceneDirections.emptyCell")} — ${cellPos(row, col)}`}
              />
            );
          }),
        )}
      </div>

      <div className="scd-tray" role="group" aria-label={t("sceneDirections.trayLabel")}>
        {round.tokens.map((token) => {
          const isPlaced = token in placements;
          return (
            <button
              key={token}
              type="button"
              className="scd-token"
              aria-pressed={lifted === token}
              data-ghost={isPlaced ? "" : undefined}
              disabled={isPlaced || solved || checking}
              onClick={() => liftToken(token)}
              aria-label={t("sceneDirections.tokenAria", { token })}
            >
              <span aria-hidden="true">{token}</span>
            </button>
          );
        })}
      </div>

      <div className="scd-actions">
        {allPlaced && !solved && (
          <button type="button" className="btn btn-primary" onClick={check} disabled={checking}>
            {t("sceneDirections.check")}
          </button>
        )}
      </div>

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>

      {hintsEnabled && round.hint && !solved && (
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
      {hintOpen && round.hint && !solved && <p className="hint-bubble">{round.hint}</p>}
    </>
  );
}
