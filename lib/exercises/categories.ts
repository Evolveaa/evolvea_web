import type { ExerciseDomain } from "@/lib/exercises/types";

/**
 * Purpose-based groupings ("categories") layered over the clinical domains, so a
 * parent or therapist can browse by intent — "pronunciation", "reading
 * readiness", "metacognitive growth" — instead of by the clinical domain name.
 * Derived from the exercise's existing `domain` + age range; no schema change.
 *
 * Pedagogically, articulation (motor speech / dyslalia) and phonemic awareness
 * (a metalinguistic, pre-literacy skill in the Eľkonin-Mikulajová method) are
 * kept in DISTINCT categories — merging them under "pronunciation" would be
 * wrong in both directions.
 */

export type FocusKey =
  | "pronunciation"
  | "literacy"
  | "language"
  | "cognition"
  | "metacognition";

/** domain → category. Typed as a full Record, so adding a domain to the DB enum
 *  without giving it a category fails the typecheck (rather than silently
 *  vanishing from every category filter). */
const DOMAIN_TO_FOCUS: Record<ExerciseDomain, FocusKey> = {
  articulation: "pronunciation",
  phonemic_awareness: "literacy",
  narrative: "language",
  vocabulary: "language",
  working_memory: "cognition",
  attention: "cognition",
  guided: "metacognition",
};

export function focusOf(domain: ExerciseDomain): FocusKey {
  return DOMAIN_TO_FOCUS[domain];
}

export interface FocusCategory {
  key: FocusKey;
  emoji: string;
  /** Maps to a `--hue-*` token for the colored active chip. */
  hue: "coral" | "sky" | "green" | "violet" | "navy";
}

/** Display order of the category chips. */
export const FOCUS_CATEGORIES: readonly FocusCategory[] = [
  { key: "pronunciation", emoji: "👄", hue: "coral" },
  { key: "literacy", emoji: "🔤", hue: "sky" },
  { key: "language", emoji: "💬", hue: "green" },
  { key: "cognition", emoji: "🧠", hue: "violet" },
  { key: "metacognition", emoji: "🤝", hue: "navy" },
];

export type AgeBandKey = "younger" | "older";

export interface AgeBand {
  key: AgeBandKey;
  min: number;
  max: number;
}

export const AGE_BANDS: readonly AgeBand[] = [
  { key: "younger", min: 5, max: 7 },
  { key: "older", min: 8, max: 10 },
] as const;

/**
 * An exercise belongs to an age band when its recommended range overlaps the
 * band — so an exercise for ages 5–9 shows under both "younger" and "older".
 */
export function inAgeBand(band: AgeBandKey, ageMin: number, ageMax: number): boolean {
  const b = AGE_BANDS.find((x) => x.key === band);
  if (!b) return true;
  return ageMin <= b.max && ageMax >= b.min;
}

/** The band a specific age falls in (for defaulting the filter to a child). */
export function ageBandFor(age: number | null | undefined): AgeBandKey | "all" {
  if (age == null) return "all";
  return age <= 7 ? "younger" : "older";
}
