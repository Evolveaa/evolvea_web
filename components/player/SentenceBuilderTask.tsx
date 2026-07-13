"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { SentenceBuilderContent } from "@/lib/exercises/types";
import { shuffle, useFeedbackLines, type TaskProps } from "./shared";

type Phase = "build" | "done";

interface Tile {
  word: string;
  id: number;
}

interface ItemResult {
  sentence: string;
  errors: number;
  hinted: boolean;
  expansion: string | null;
}

/**
 * Sentence builder — the child taps shuffled word tiles in order to build
 * the sentence, hears it, and (optionally) expands it with a developing
 * word before saying the longer sentence aloud.
 */
export default function SentenceBuilderTask({
  content,
  hintsEnabled,
  onProgress,
  onFinish,
}: TaskProps<SentenceBuilderContent>) {
  const t = useTranslations("player");
  const { praise, encourage } = useFeedbackLines();

  const [index, setIndex] = useState(0);
  const [filled, setFilled] = useState(0);
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const [errors, setErrors] = useState(0);
  const [phase, setPhase] = useState<Phase>("build");
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "good" | "bad"; text: string } | null>(null);
  const [hintOpen, setHintOpen] = useState(false);

  const results = useRef<ItemResult[]>([]);
  const hinted = useRef(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const item = content.items[index];

  const tiles = useMemo<Tile[]>(
    () => shuffle([...item.words, ...(item.distractors ?? [])].map((word, id) => ({ word, id }))),
    [item],
  );

  useEffect(() => {
    onProgress(index, content.items.length);
  }, [index, content.items.length, onProgress]);

  useEffect(() => () => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  /** Sentence words with the picked expansion word slid into place. */
  const finalWords = useMemo(() => {
    if (!item.expansion || picked === null) return item.words;
    const at = item.expansion.insertAt;
    return [...item.words.slice(0, at), picked, ...item.words.slice(at)];
  }, [item, picked]);

  const expansionPending = phase === "done" && !!item.expansion && picked === null;

  function tapTile(tile: Tile) {
    // filled >= words.length: sentence already complete — a leftover distractor
    // tapped in the 1s celebration pause must not count as an error
    if (phase !== "build" || filled >= item.words.length || used.has(tile.id)) return;
    // Compare by word, not tile index — duplicate words are interchangeable.
    if (tile.word === item.words[filled]) {
      const nextFilled = filled + 1;
      setUsed((prev) => new Set(prev).add(tile.id));
      setFilled(nextFilled);
      setWrongTile(null);
      setFeedback(null);
      if (nextFilled >= item.words.length) {
        setFeedback({ kind: "good", text: praise() });
        advanceTimer.current = setTimeout(() => {
          setPhase("done");
          setFeedback(null);
        }, 1000);
      }
    } else {
      setErrors((e) => e + 1);
      setWrongTile(tile.id);
      setFeedback({ kind: "bad", text: encourage() });
      shakeTimer.current = setTimeout(() => setWrongTile(null), 500);
    }
  }

  function pickExpansion(word: string) {
    if (picked !== null) return;
    // Every expansion option is valid — enrichment, never an error.
    setPicked(word);
    setFeedback({ kind: "good", text: praise() });
  }

  function advance() {
    results.current.push({
      sentence: item.words.join(" "),
      errors,
      hinted: hinted.current,
      expansion: picked,
    });
    const next = index + 1;
    if (next >= content.items.length) {
      const all = results.current;
      onFinish({
        correct: all.filter((r) => r.errors === 0).length,
        total: content.items.length,
        hintsUsed: all.filter((r) => r.hinted).length,
        detail: {
          items: all.map((r) => ({
            sentence: r.sentence,
            firstTry: r.errors === 0,
            errors: r.errors,
            hinted: r.hinted,
            expansion: r.expansion,
          })),
        },
      });
      return;
    }
    hinted.current = false;
    setIndex(next);
    setFilled(0);
    setUsed(new Set());
    setWrongTile(null);
    setErrors(0);
    setPhase("build");
    setPicked(null);
    setFeedback(null);
    setHintOpen(false);
  }

  return (
    <>
      <p className="player-prompt">
        {phase === "build"
          ? t("sentenceBuilder.buildPrompt")
          : expansionPending
            ? t("sentenceBuilder.pickWord")
            : t("sentenceBuilder.readAloud")}
      </p>

      {phase === "build" ? (
        <>
          <div className="snt-slots" aria-label={t("sentenceBuilder.slotsLabel")}>
            {item.words.map((word, i) => (
              <span
                key={i}
                className="snt-slot"
                data-filled={i < filled ? "" : undefined}
                style={i < filled ? undefined : { minWidth: `${Math.max(word.length + 1, 3)}ch` }}
              >
                {i < filled ? word : ""}
              </span>
            ))}
          </div>

          <div className="snt-tray" role="group" aria-label={t("sentenceBuilder.trayLabel")}>
            {tiles.map((tile) => {
              const isUsed = used.has(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  className="snt-tile"
                  data-state={isUsed ? "used" : wrongTile === tile.id ? "wrong" : undefined}
                  disabled={isUsed}
                  onClick={() => tapTile(tile)}
                >
                  {tile.word}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="snt-sentence">
            {finalWords.map((word, i) => (
              <span
                key={i}
                className="snt-word"
                data-new={picked !== null && item.expansion?.insertAt === i ? "" : undefined}
              >
                {word}
              </span>
            ))}
          </p>

          {expansionPending && item.expansion ? (
            <>
              <p className="snt-parent">
                <span className="snt-parent-k" aria-hidden="true">🗣️</span>
                <span>
                  <b>{t("sentenceBuilder.parentReads")}</b> {item.expansion.prompt}
                </span>
              </p>
              <div className="snt-tray" role="group" aria-label={t("sentenceBuilder.trayLabel")}>
                {item.expansion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="snt-tile"
                    onClick={() => pickExpansion(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button type="button" className="btn btn-primary" onClick={advance}>
                {t("sentenceBuilder.saidIt")}
              </button>
            </div>
          )}
        </>
      )}

      <p className="play-feedback" data-kind={feedback?.kind} role="status">
        {feedback?.text}
      </p>

      {hintsEnabled && item.hint && phase === "build" && (
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
      {hintOpen && item.hint && phase === "build" && <p className="hint-bubble">{item.hint}</p>}
    </>
  );
}
