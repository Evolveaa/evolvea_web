import type { Database, Json } from "@/lib/database.types";

/**
 * Data-driven exercise content.
 *
 * An exercise row in the DB carries metadata (domain, difficulty, guides…)
 * plus a `content` jsonb column typed here as a discriminated union. The
 * player renders purely from this data — no exercise is hard-coded in JSX.
 */

export type ExerciseDomain = Database["public"]["Enums"]["exercise_domain"];
export type ExerciseModality = Database["public"]["Enums"]["exercise_modality"];
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];

/* ---------------------------------------------------------------- *
 * Content union
 * ---------------------------------------------------------------- */

/** Multiple choice — first-sound hunts, rhymes, categories, comprehension. */
export interface ChoiceContent {
  type: "choice";
  /** Child-facing line the parent reads before starting. */
  intro?: string;
  items: ChoiceItem[];
}

export interface ChoiceItem {
  /** Question the parent reads aloud (may include the target word). */
  prompt: string;
  /** Text the in-app speaker button reads (defaults to prompt). */
  say?: string;
  options: ChoiceOption[];
  hint?: string;
}

export interface ChoiceOption {
  /** Word or short label shown under the emoji. */
  label: string;
  /** Big friendly visual; keeps the library asset-free. */
  emoji?: string;
  correct?: boolean;
}

/** Eľkonin sound boxes — the word's sound structure made visible. */
export interface SoundBoxesContent {
  type: "sound_boxes";
  intro?: string;
  /**
   * count  — child taps one neutral chip per heard phoneme
   * colors — child also classifies each phoneme (vowel/consonant…)
   */
  mode: "count" | "colors";
  items: SoundBoxesItem[];
}

export interface SoundBoxesItem {
  word: string;
  emoji?: string;
  phonemes: PhonemePiece[];
  hint?: string;
}

export interface PhonemePiece {
  /** The phoneme as written, e.g. "š", "ia", "ch", "dz". */
  sound: string;
  /** Eľkonin token colour class. */
  kind: "vowel" | "long_vowel" | "diphthong" | "consonant";
}

/** Working memory — watch a sequence, then rebuild it from memory. */
export interface MemorySequenceContent {
  type: "memory_sequence";
  intro?: string;
  /** How long the sequence stays visible, per element (ms). */
  revealMsPerItem?: number;
  items: MemorySequenceItem[];
}

export interface MemorySequenceItem {
  /** Emoji shown in order, e.g. ["🐶","🌞","🍎"]. */
  sequence: string[];
  /** Extra emoji mixed into the answer palette. */
  distractors: string[];
  hint?: string;
}

/** Pexeso — find the matching pairs (attention + working memory). */
export interface PairsContent {
  type: "pairs";
  intro?: string;
  /** Each string is one motif appearing on two cards. */
  pairs: string[];
  columns?: number;
}

/** Škola pozornosti — tap the number track in order. */
export interface NumberTrackContent {
  type: "number_track";
  intro?: string;
  rounds: NumberTrackRound[];
}

export interface NumberTrackRound {
  from: number;
  to: number;
  /** Descending run when true (from > to still expressed via reverse). */
  reverse?: boolean;
  /** Extra numbers scattered on the board that must be ignored. */
  distractors?: number[];
}

/** Narrative — order the picture cards so the story makes sense, then retell it. */
export interface StorySequenceContent {
  type: "story_sequence";
  intro?: string;
  items: StorySequenceItem[];
}

export interface StorySequenceItem {
  title: string;
  /** Cards in the CORRECT order; the player shuffles them for play. */
  cards: StoryCard[];
  /** Question the parent asks after ordering (retelling prompt). */
  retellPrompt: string;
  hint?: string;
}

export interface StoryCard {
  emoji: string;
  label: string;
}

/** Speech — the child says it aloud, the parent scores each attempt. */
export interface SpeechItemsContent {
  type: "speech_items";
  intro?: string;
  items: SpeechItem[];
}

export interface SpeechItem {
  /** What the child should say (word, phrase, tongue-twister, answer…). */
  text: string;
  emoji?: string;
  /**
   * Optional spoken question the parent asks aloud; the child answers by
   * speaking. When set, this is a "speech question" — the prompt is read to the
   * child and `text` is the expected answer (shown to the parent as a
   * reference, not revealed as a label to the child).
   */
  ask?: string;
  /** Articulation or coaching tip shown to the parent. */
  tip?: string;
}

/** Guided parent–child activity — scripted off-screen work with reflection. */
export interface GuidedStepsContent {
  type: "guided_steps";
  intro?: string;
  steps: GuidedStep[];
}

export interface GuidedStep {
  /** Small uppercase kicker, e.g. "Krok 2 · Plánovanie". */
  kicker?: string;
  title: string;
  /** What happens / what the parent says. */
  body: string;
  /** Tappable statements (feelings, strategies) — multi-select. */
  choices?: string[];
  /** Free-text prompts answered during the step; stored in the session. */
  fields?: GuidedField[];
  /** Parent-only nudge (what NOT to do, when to stay silent…). */
  tip?: string;
}

export interface GuidedField {
  label: string;
  placeholder?: string;
}

export type ExerciseContent =
  | ChoiceContent
  | SoundBoxesContent
  | MemorySequenceContent
  | PairsContent
  | NumberTrackContent
  | StorySequenceContent
  | SpeechItemsContent
  | GuidedStepsContent;

export type ExerciseContentType = ExerciseContent["type"];

/* ---------------------------------------------------------------- *
 * Runtime validation — content comes from jsonb, never trust it blindly.
 * ---------------------------------------------------------------- */

class ContentError extends Error {}

function fail(msg: string): never {
  throw new ContentError(msg);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, what: string): string {
  if (typeof v !== "string" || v.length === 0) fail(`${what} must be a non-empty string`);
  return v;
}

function optStr(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function arr(v: unknown, what: string): unknown[] {
  if (!Array.isArray(v) || v.length === 0) fail(`${what} must be a non-empty array`);
  return v;
}

const PHONEME_KINDS = new Set(["vowel", "long_vowel", "diphthong", "consonant"]);

/**
 * Parse and structurally validate jsonb exercise content.
 * Throws with a readable message when the payload is malformed.
 */
export function parseExerciseContent(json: Json): ExerciseContent {
  if (!isRecord(json)) fail("content must be an object");

  switch (json.type) {
    case "choice": {
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const options = arr(raw.options, `items[${i}].options`).map((o, j) => {
          if (!isRecord(o)) fail(`items[${i}].options[${j}] must be an object`);
          return {
            label: str(o.label, `items[${i}].options[${j}].label`),
            emoji: optStr(o.emoji),
            correct: o.correct === true,
          } satisfies ChoiceOption;
        });
        if (!options.some((o) => o.correct)) fail(`items[${i}] has no correct option`);
        return {
          prompt: str(raw.prompt, `items[${i}].prompt`),
          say: optStr(raw.say),
          options,
          hint: optStr(raw.hint),
        } satisfies ChoiceItem;
      });
      return { type: "choice", intro: optStr(json.intro), items };
    }

    case "sound_boxes": {
      const mode = json.mode === "colors" ? "colors" : "count";
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const phonemes = arr(raw.phonemes, `items[${i}].phonemes`).map((p, j) => {
          if (!isRecord(p)) fail(`items[${i}].phonemes[${j}] must be an object`);
          const kind = p.kind;
          if (typeof kind !== "string" || !PHONEME_KINDS.has(kind))
            fail(`items[${i}].phonemes[${j}].kind is invalid`);
          return {
            sound: str(p.sound, `items[${i}].phonemes[${j}].sound`),
            kind: kind as PhonemePiece["kind"],
          } satisfies PhonemePiece;
        });
        return {
          word: str(raw.word, `items[${i}].word`),
          emoji: optStr(raw.emoji),
          phonemes,
          hint: optStr(raw.hint),
        } satisfies SoundBoxesItem;
      });
      return { type: "sound_boxes", intro: optStr(json.intro), mode, items };
    }

    case "memory_sequence": {
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const sequence = arr(raw.sequence, `items[${i}].sequence`).map((s, j) =>
          str(s, `items[${i}].sequence[${j}]`),
        );
        const distractors = Array.isArray(raw.distractors)
          ? raw.distractors.map((s, j) => str(s, `items[${i}].distractors[${j}]`))
          : [];
        if (new Set([...sequence, ...distractors]).size !== sequence.length + distractors.length)
          fail(`items[${i}] repeats an emoji between sequence and distractors`);
        return { sequence, distractors, hint: optStr(raw.hint) } satisfies MemorySequenceItem;
      });
      return {
        type: "memory_sequence",
        intro: optStr(json.intro),
        revealMsPerItem:
          typeof json.revealMsPerItem === "number" ? json.revealMsPerItem : undefined,
        items,
      };
    }

    case "pairs": {
      const pairs = arr(json.pairs, "pairs").map((p, i) => str(p, `pairs[${i}]`));
      if (new Set(pairs).size !== pairs.length) fail("pairs must be unique");
      return {
        type: "pairs",
        intro: optStr(json.intro),
        pairs,
        columns: typeof json.columns === "number" ? json.columns : undefined,
      };
    }

    case "number_track": {
      const rounds = arr(json.rounds, "rounds").map((raw, i) => {
        if (!isRecord(raw)) fail(`rounds[${i}] must be an object`);
        const from = raw.from;
        const to = raw.to;
        if (typeof from !== "number" || typeof to !== "number" || from >= to)
          fail(`rounds[${i}] needs numeric from < to`);
        return {
          from,
          to,
          reverse: raw.reverse === true,
          distractors: Array.isArray(raw.distractors)
            ? raw.distractors.filter((d): d is number => typeof d === "number")
            : undefined,
        } satisfies NumberTrackRound;
      });
      return { type: "number_track", intro: optStr(json.intro), rounds };
    }

    case "story_sequence": {
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const cards = arr(raw.cards, `items[${i}].cards`).map((c, j) => {
          if (!isRecord(c)) fail(`items[${i}].cards[${j}] must be an object`);
          return {
            emoji: str(c.emoji, `items[${i}].cards[${j}].emoji`),
            label: str(c.label, `items[${i}].cards[${j}].label`),
          } satisfies StoryCard;
        });
        if (cards.length < 3) fail(`items[${i}] needs at least 3 cards`);
        return {
          title: str(raw.title, `items[${i}].title`),
          cards,
          retellPrompt: str(raw.retellPrompt, `items[${i}].retellPrompt`),
          hint: optStr(raw.hint),
        } satisfies StorySequenceItem;
      });
      return { type: "story_sequence", intro: optStr(json.intro), items };
    }

    case "speech_items": {
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        return {
          text: str(raw.text, `items[${i}].text`),
          emoji: optStr(raw.emoji),
          ask: optStr(raw.ask),
          tip: optStr(raw.tip),
        } satisfies SpeechItem;
      });
      return { type: "speech_items", intro: optStr(json.intro), items };
    }

    case "guided_steps": {
      const steps = arr(json.steps, "steps").map((raw, i) => {
        if (!isRecord(raw)) fail(`steps[${i}] must be an object`);
        const fields = Array.isArray(raw.fields)
          ? raw.fields.map((f, j) => {
              if (!isRecord(f)) fail(`steps[${i}].fields[${j}] must be an object`);
              return {
                label: str(f.label, `steps[${i}].fields[${j}].label`),
                placeholder: optStr(f.placeholder),
              } satisfies GuidedField;
            })
          : undefined;
        return {
          kicker: optStr(raw.kicker),
          title: str(raw.title, `steps[${i}].title`),
          body: str(raw.body, `steps[${i}].body`),
          choices: Array.isArray(raw.choices)
            ? raw.choices.map((c, j) => str(c, `steps[${i}].choices[${j}]`))
            : undefined,
          fields,
          tip: optStr(raw.tip),
        } satisfies GuidedStep;
      });
      return { type: "guided_steps", intro: optStr(json.intro), steps };
    }

    default:
      fail(`unknown content type ${String(json.type)}`);
  }
}

/** Safe variant for rendering paths that must never throw. */
export function tryParseExerciseContent(json: Json): ExerciseContent | null {
  try {
    return parseExerciseContent(json);
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- *
 * Domain + scaffolding metadata (visuals; labels live in i18n)
 * ---------------------------------------------------------------- */

export const DOMAINS: readonly ExerciseDomain[] = [
  "phonemic_awareness",
  "working_memory",
  "attention",
  "narrative",
  "vocabulary",
  "articulation",
  "guided",
] as const;

export const DOMAIN_META: Record<ExerciseDomain, { emoji: string; hue: string }> = {
  phonemic_awareness: { emoji: "🔤", hue: "sky" },
  working_memory: { emoji: "🧠", hue: "violet" },
  attention: { emoji: "🎯", hue: "amber" },
  narrative: { emoji: "📖", hue: "rose" },
  vocabulary: { emoji: "💬", hue: "green" },
  articulation: { emoji: "👄", hue: "coral" },
  guided: { emoji: "🤝", hue: "navy" },
};

/** Vygotskian support levels — 3 leads, 1 steps back. */
export const SUPPORT_LEVELS = [3, 2, 1] as const;
export type SupportLevel = (typeof SUPPORT_LEVELS)[number];

export function asSupportLevel(n: number): SupportLevel {
  return n <= 1 ? 1 : n >= 3 ? 3 : 2;
}

/** How many items the given content plays through (score denominator). */
export function contentItemCount(content: ExerciseContent): number {
  switch (content.type) {
    case "choice":
    case "sound_boxes":
    case "memory_sequence":
    case "story_sequence":
    case "speech_items":
      return content.items.length;
    case "pairs":
      return content.pairs.length;
    case "number_track":
      return content.rounds.length;
    case "guided_steps":
      return content.steps.length;
  }
}
