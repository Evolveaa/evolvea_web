"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { NumberTrackContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

/** Škola pozornosti — tap the scattered number track in order. */
export default function NumberTrackTask({
  content,
  onProgress,
  onFinish,
}: TaskProps<NumberTrackContent>) {
  const t = useTranslations("player");
  const { praise } = useFeedbackLines();

  const [roundIdx, setRoundIdx] = useState(0);
  const [nextPos, setNextPos] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);

  const results = useRef<{ errors: number }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = content.rounds[roundIdx];
  const sequence = useMemo(() => {
    const seq: number[] = [];
    for (let n = round.from; n <= round.to; n++) seq.push(n);
    return round.reverse ? seq.reverse() : seq;
  }, [round]);

  const board = useMemo(
    () => shuffle([...sequence, ...(round.distractors ?? [])]),
    [sequence, round],
  );

  useEffect(() => {
    onProgress(roundIdx, content.rounds.length);
  }, [roundIdx, content.rounds.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function tap(n: number, cellIdx: number) {
    if (solved) return;
    if (n === sequence[nextPos]) {
      const next = nextPos + 1;
      setNextPos(next);
      setWrongCell(null);
      if (next >= sequence.length) {
        setSolved(true);
        setFeedback({ kind: "good", text: praise() });
        results.current.push({ errors });
        timer.current = setTimeout(advance, 1300);
      }
    } else {
      setErrors((e) => e + 1);
      setWrongCell(cellIdx);
      setFeedback({ kind: "bad", text: t("numberTrack.lookFor", { n: sequence[nextPos] }) });
      timer.current = setTimeout(() => setWrongCell(null), 500);
    }
  }

  function advance() {
    const next = roundIdx + 1;
    if (next >= content.rounds.length) {
      onFinish({
        correct: results.current.filter((r) => r.errors === 0).length,
        total: content.rounds.length,
        hintsUsed: 0,
        detail: { rounds: results.current },
      });
      return;
    }
    setRoundIdx(next);
    setNextPos(0);
    setErrors(0);
    setSolved(false);
    setFeedback(null);
  }

  const columns = board.length > 12 ? 5 : 4;

  return (
    <>
      <p className="player-prompt">
        {round.reverse
          ? t("numberTrack.promptReverse", { from: sequence[0], to: sequence[sequence.length - 1] })
          : t("numberTrack.prompt", { from: round.from, to: round.to })}
      </p>

      <div className="nt-board" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {board.map((n, i) => {
          const posInSeq = sequence.indexOf(n);
          const isDone = posInSeq !== -1 && posInSeq < nextPos;
          return (
            <button
              key={`${n}-${i}`}
              type="button"
              className="nt-cell"
              data-state={isDone ? "done" : wrongCell === i ? "wrong" : undefined}
              disabled={isDone || solved}
              onClick={() => tap(n, i)}
            >
              {n}
            </button>
          );
        })}
      </div>

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>
    </>
  );
}
