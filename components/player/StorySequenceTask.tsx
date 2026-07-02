"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { StorySequenceContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

type Phase = "order" | "retell";

/** Order the story cards, then the child retells the story aloud. */
export default function StorySequenceTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<StorySequenceContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();

  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState(0);
  const [errors, setErrors] = useState(0);
  const [wrongCard, setWrongCard] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("order");
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<{ errors: number }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = content.items[index];
  const shuffled = useMemo(
    () => shuffle(item.cards.map((card, orig) => ({ ...card, orig }))),
    [item],
  );

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function pick(orig: number, shuffledIdx: number) {
    if (phase !== "order") return;
    if (orig === placed) {
      const next = placed + 1;
      setPlaced(next);
      setWrongCard(null);
      setFeedback(null);
      if (next >= item.cards.length) {
        setFeedback({ kind: "good", text: praise() });
        timer.current = setTimeout(() => {
          setPhase("retell");
          setFeedback(null);
        }, 1100);
      }
    } else {
      setErrors((e) => e + 1);
      setWrongCard(shuffledIdx);
      setFeedback({ kind: "bad", text: encourage() });
      timer.current = setTimeout(() => setWrongCard(null), 500);
    }
  }

  function nextStory() {
    results.current.push({ errors });
    const next = index + 1;
    if (next >= content.items.length) {
      onFinish({
        correct: results.current.filter((r) => r.errors === 0).length,
        total: content.items.length,
        hintsUsed: 0,
        detail: {
          items: results.current.map((r, i) => ({
            title: content.items[i].title,
            errors: r.errors,
          })),
        },
      });
      return;
    }
    setIndex(next);
    setPlaced(0);
    setErrors(0);
    setPhase("order");
    setFeedback(null);
    setHintOpen(false);
  }

  return (
    <>
      <p className="player-prompt">
        {phase === "order" ? t("story.orderPrompt", { title: item.title }) : item.retellPrompt}
      </p>

      <div className="story-slots">
        {item.cards.map((card, i) => (
          <span key={i} className="story-slot" data-filled={i < placed ? "" : undefined}>
            <span className="slot-no">{i + 1}</span>
            {i < placed && (
              <>
                <span className="story-emoji" aria-hidden="true">
                  {card.emoji}
                </span>
                <span className="story-label">{card.label}</span>
              </>
            )}
          </span>
        ))}
      </div>

      {phase === "order" ? (
        <div className="story-cards">
          {shuffled.map((card, i) => {
            const used = card.orig < placed;
            return (
              <button
                key={i}
                type="button"
                className="story-card"
                data-state={wrongCard === i ? "wrong" : undefined}
                disabled={used}
                onClick={() => pick(card.orig, i)}
              >
                <span className="story-emoji" aria-hidden="true">
                  {card.emoji}
                </span>
                <span className="story-label">{card.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <p className="player-intro">{t("story.retellHelp")}</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button type="button" className="btn btn-primary" onClick={nextStory}>
              {t("story.retold")}
            </button>
          </div>
        </>
      )}

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>

      {hintsEnabled && item.hint && phase === "order" && (
        <div className="hint-row">
          <button type="button" className="hint-btn" onClick={() => setHintOpen((v) => !v)}>
            💡 {t("hint")}
          </button>
        </div>
      )}
      {hintOpen && item.hint && phase === "order" && <p className="hint-bubble">{item.hint}</p>}
    </>
  );
}
