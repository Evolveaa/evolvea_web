"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { PairsContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

interface Card {
  id: number;
  motif: string;
}

/** Pexeso — flip two cards, find every pair. */
export default function PairsTask({ content, onProgress, onFinish }: TaskProps<PairsContent>) {
  const t = useTranslations("player");
  const { praise } = useFeedbackLines();

  const cards = useMemo<Card[]>(
    () => shuffle(content.pairs.flatMap((motif, i) => [
      { id: i * 2, motif },
      { id: i * 2 + 1, motif },
    ])),
    [content.pairs],
  );

  const [up, setUp] = useState<number[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const lock = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const columns = content.columns ?? (cards.length > 12 ? 4 : cards.length > 8 ? 4 : 3);

  useEffect(() => {
    onProgress(done.size, content.pairs.length);
  }, [done.size, content.pairs.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function flip(card: Card) {
    if (lock.current || up.includes(card.id) || done.has(card.motif)) return;

    const nextUp = [...up, card.id];
    setUp(nextUp);
    if (nextUp.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = nextUp.map((id) => cards.find((c) => c.id === id)!);
    if (a.motif === b.motif) {
      const nextDone = new Set(done).add(a.motif);
      setDone(nextDone);
      setUp([]);
      setFeedback(praise());
      if (nextDone.size === content.pairs.length) {
        // Honest memory score: efficiency vs. an optimal-memory baseline
        // (~1.6 moves per pair). A flawless-luck run stays 100 %, wandering
        // costs pairs proportionally — never below 1 (effort always counts).
        const pairs = content.pairs.length;
        const finalMoves = moves + 1;
        const ideal = Math.ceil(pairs * 1.6);
        const efficiency = Math.min(1, ideal / finalMoves);
        timer.current = setTimeout(
          () =>
            onFinish({
              correct: Math.max(1, Math.round(pairs * efficiency)),
              total: pairs,
              hintsUsed: 0,
              detail: {
                moves: finalMoves,
                pairs,
                efficiencyPct: Math.round(100 * efficiency),
              },
            }),
          1200,
        );
      }
    } else {
      lock.current = true;
      timer.current = setTimeout(() => {
        setUp([]);
        lock.current = false;
      }, 900);
    }
  }

  return (
    <>
      <p className="player-prompt">{t("pairs.prompt")}</p>
      <p className="player-intro">{t("pairs.moves", { count: moves })}</p>

      <div className="px-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {cards.map((card) => {
          const state = done.has(card.motif) ? "done" : up.includes(card.id) ? "up" : "down";
          return (
            <button
              key={card.id}
              type="button"
              className="px-card"
              data-state={state}
              onClick={() => flip(card)}
              aria-label={state === "down" ? t("pairs.hiddenCard") : card.motif}
            >
              <span aria-hidden="true">{card.motif}</span>
            </button>
          );
        })}
      </div>

      <p className="play-feedback" data-kind="good" role="status">
        {feedback}
      </p>
    </>
  );
}
