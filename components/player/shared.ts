"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Json } from "@/lib/database.types";

/** Aggregate outcome one task component reports when its content is finished. */
export interface FinishSummary {
  correct: number;
  total: number;
  hintsUsed: number;
  detail: Json;
}

export interface TaskProps<C> {
  content: C;
  /** Scaffolding: hints render only when true (support level ≥ 2). */
  hintsEnabled: boolean;
  onProgress: (current: number, total: number) => void;
  onFinish: (summary: FinishSummary) => void;
}

const PRAISE_COUNT = 6;
const ENCOURAGE_COUNT = 4;

/** Rotating praise / encouragement lines (child-facing, i18n). */
export function useFeedbackLines() {
  const t = useTranslations("player");
  const lastPraise = useRef(-1);
  const lastNudge = useRef(-1);

  const praise = useCallback(() => {
    let i = Math.floor(Math.random() * PRAISE_COUNT);
    if (i === lastPraise.current) i = (i + 1) % PRAISE_COUNT;
    lastPraise.current = i;
    return t(`praise.${i}`);
  }, [t]);

  const encourage = useCallback(() => {
    let i = Math.floor(Math.random() * ENCOURAGE_COUNT);
    if (i === lastNudge.current) i = (i + 1) % ENCOURAGE_COUNT;
    lastNudge.current = i;
    return t(`encourage.${i}`);
  }, [t]);

  return { praise, encourage };
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
