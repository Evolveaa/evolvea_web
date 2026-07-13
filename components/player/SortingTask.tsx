"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SortingContent } from "@/lib/exercises/types";
import Glyph from "./Glyph";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

interface ItemResult {
  label: string;
  category: string;
  errors: number;
  hinted: boolean;
}

/**
 * Sorting — semantic categorisation: one card at a time, the child taps
 * the bucket where it belongs. Correct → the card flies into the bucket;
 * wrong → gentle shake and another try.
 */
export default function SortingTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<SortingContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();

  // Card order is shuffled once per session.
  const deck = useMemo(() => shuffle(content.items), [content]);

  const [pos, setPos] = useState(0);
  const [counts, setCounts] = useState<number[]>(() => content.categories.map(() => 0));
  const [errors, setErrors] = useState(0);
  const [wrongBucket, setWrongBucket] = useState<number | null>(null);
  const [hitBucket, setHitBucket] = useState<number | null>(null);
  const [flying, setFlying] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<ItemResult[]>([]);
  const hinted = useRef(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = deck[pos];

  useEffect(() => {
    onProgress(pos, deck.length);
  }, [pos, deck.length, onProgress]);

  useEffect(() => () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  function place(bucket: number) {
    if (flying) return;
    if (bucket === card.category) {
      setFlying(true);
      setHitBucket(bucket);
      setWrongBucket(null);
      setFeedback({ kind: "good", text: praise() });
      setCounts((prev) => prev.map((c, i) => (i === bucket ? c + 1 : c)));
      results.current.push({
        label: card.label,
        category: content.categories[card.category].label,
        errors,
        hinted: hinted.current,
      });
      advanceTimer.current = setTimeout(advance, 1000);
    } else {
      setErrors((e) => e + 1);
      setWrongBucket(bucket);
      setFeedback({ kind: "bad", text: encourage() });
      shakeTimer.current = setTimeout(() => setWrongBucket(null), 500);
    }
  }

  function advance() {
    const next = pos + 1;
    if (next >= deck.length) {
      const all = results.current;
      onFinish({
        correct: all.filter((r) => r.errors === 0).length,
        total: deck.length,
        hintsUsed: all.filter((r) => r.hinted).length,
        detail: {
          items: all.map((r) => ({
            label: r.label,
            category: r.category,
            firstTry: r.errors === 0,
            errors: r.errors,
            hinted: r.hinted,
          })),
        },
      });
      return;
    }
    hinted.current = false;
    setPos(next);
    setErrors(0);
    setWrongBucket(null);
    setHitBucket(null);
    setFlying(false);
    setFeedback(null);
    setHintOpen(false);
  }

  return (
    <>
      <p className="player-prompt">{t("sorting.prompt")}</p>

      <div
        className="srt-buckets"
        data-count={content.categories.length}
        role="group"
        aria-label={t("sorting.bucketsLabel")}
      >
        {content.categories.map((cat, i) => (
          <button
            key={i}
            type="button"
            className="srt-bucket"
            data-state={hitBucket === i ? "hit" : wrongBucket === i ? "wrong" : undefined}
            disabled={flying}
            aria-label={`${cat.label} — ${t("sorting.inBucket", { count: counts[i] })}`}
            onClick={() => place(i)}
          >
            <span className="srt-count" aria-hidden="true">
              {counts[i]}
            </span>
            <span className="srt-bucket-emoji" aria-hidden="true">
              <Glyph emoji={cat.emoji} size={42} />
            </span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="srt-stage">
        <div
          className="srt-card"
          data-state={flying ? "fly" : wrongBucket !== null ? "wrong" : undefined}
        >
          <span className="srt-card-emoji" aria-hidden="true">
            <Glyph emoji={card.emoji} size={94} />
          </span>
          <span className="srt-card-label">{card.label}</span>
        </div>
      </div>

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>

      {hintsEnabled && card.hint && !flying && (
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
      {hintOpen && card.hint && !flying && <p className="hint-bubble">{card.hint}</p>}
    </>
  );
}
