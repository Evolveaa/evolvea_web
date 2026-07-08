"use client";

import { useTranslations } from "next-intl";
import {
  FOCUS_CATEGORIES,
  AGE_BANDS,
  type FocusKey,
  type AgeBandKey,
} from "@/lib/exercises/categories";

const activeAllStyle = {
  background: "var(--accent-soft)",
  color: "var(--accent-ink)",
  borderColor: "transparent",
};

/** Inline styles win over `.chip[aria-pressed]` in every theme, so the per-
 *  category hue always shows without fighting CSS specificity. */
function hueStyle(hue: string) {
  return {
    background: `var(--hue-${hue})`,
    color: `var(--hue-${hue}-ink)`,
    borderColor: "transparent" as const,
  };
}

/**
 * The two purpose/age chip rows, shared by the library and the plan builder so
 * both screens stay in lockstep. Controlled by the parent.
 */
export default function CategoryFilter({
  focus,
  setFocus,
  ageBand,
  setAgeBand,
  showAge = true,
}: {
  focus: FocusKey | "all";
  setFocus: (f: FocusKey | "all") => void;
  ageBand: AgeBandKey | "all";
  setAgeBand: (a: AgeBandKey | "all") => void;
  showAge?: boolean;
}) {
  const t = useTranslations("therapist.library");
  const tcat = useTranslations("categories");
  const tc = useTranslations("common");

  return (
    <>
      <div className="lib-filter-row" role="group" aria-label={t("focusLabel")}>
        <span className="lib-filter-label" aria-hidden="true">
          {t("focusLabel")}
        </span>
        <button
          type="button"
          className="chip"
          aria-pressed={focus === "all"}
          style={focus === "all" ? activeAllStyle : undefined}
          onClick={() => setFocus("all")}
        >
          {t("all")}
        </button>
        {FOCUS_CATEGORIES.map((c) => {
          const active = focus === c.key;
          return (
            <button
              key={c.key}
              type="button"
              className="chip"
              aria-pressed={active}
              style={active ? hueStyle(c.hue) : undefined}
              onClick={() => setFocus(active ? "all" : c.key)}
            >
              <span aria-hidden="true">{c.emoji}</span> {tcat(c.key)}
            </button>
          );
        })}
      </div>

      {showAge && (
        <div className="lib-filter-row" role="group" aria-label={t("ageLabel")}>
          <span className="lib-filter-label" aria-hidden="true">
            {t("ageLabel")}
          </span>
          <button
            type="button"
            className="chip"
            aria-pressed={ageBand === "all"}
            style={ageBand === "all" ? activeAllStyle : undefined}
            onClick={() => setAgeBand("all")}
          >
            {t("allAges")}
          </button>
          {AGE_BANDS.map((b) => {
            const active = ageBand === b.key;
            return (
              <button
                key={b.key}
                type="button"
                className="chip"
                aria-pressed={active}
                style={active ? hueStyle("sky") : undefined}
                onClick={() => setAgeBand(active ? "all" : b.key)}
              >
                {tcat(b.key)} · {tc("ageRange", { min: b.min, max: b.max })}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
