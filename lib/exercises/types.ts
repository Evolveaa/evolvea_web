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
  /**
   * "Describe the picture" mode. When present, the item becomes a recorded,
   * open-ended task: the child describes the scene aloud, the app records it,
   * and STT + an LLM judge which of these concepts the child mentioned. Enables
   * the recording UI only when the parent has given voice consent — otherwise
   * the item gracefully falls back to manual parent scoring.
   */
  expect?: string[];
  /** How many `expect` concepts count as success (default: ~60% of the list). */
  minExpected?: number;
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

/**
 * Minimal pairs (Barlow & Gierut) — hear the one-phoneme contrast that
 * changes meaning. The parent (or TTS) speaks; the child listens and taps.
 */
export interface MinimalPairsContent {
  type: "minimal_pairs";
  intro?: string;
  /**
   * listen         — the parent says one word of the pair, the child taps
   *                  the matching picture (perception, auto-scored)
   * same_different — the parent reads two words aloud (the pair, or one word
   *                  twice), the child judges whether they sounded the same
   */
  mode: "listen" | "same_different";
  /** The trained contrast, e.g. "s–š" (shown to the parent, not the child). */
  contrast: string;
  items: MinimalPairItem[];
}

export interface MinimalPairWord {
  word: string;
  emoji: string;
}

export interface MinimalPairItem {
  a: MinimalPairWord;
  b: MinimalPairWord;
  /** listen mode: which word the parent says aloud this round. */
  say?: "a" | "b";
  /** same_different mode: true → the parent reads the SAME word twice. */
  same?: boolean;
  hint?: string;
}

/**
 * Sound hunt — auditory bombardment & phoneme detection (Hodson's cycles
 * home component): the child only listens, or taps whether the target
 * phoneme hides in the word.
 */
export interface SoundHuntContent {
  type: "sound_hunt";
  intro?: string;
  /** Target phoneme as written, e.g. "š". */
  target: string;
  /**
   * bombardment — a slow carousel of words rich in the target; the child
   *               ONLY listens (no scoring — exposure counts as completion)
   * detect      — the parent reads the word aloud, the child taps whether
   *               the target phoneme is in it (auto-scored)
   */
  mode: "bombardment" | "detect";
  items: SoundHuntItem[];
}

export interface SoundHuntItem {
  word: string;
  emoji?: string;
  /** Whether the word contains the target phoneme. */
  has: boolean;
  hint?: string;
}

/** Sentence builder — arrange word tiles into a correct Slovak sentence. */
export interface SentenceBuilderContent {
  type: "sentence_builder";
  intro?: string;
  items: SentenceBuilderItem[];
}

export interface SentenceBuilderItem {
  /** Scene emojis that ground the sentence, e.g. ["👧","🥛"]. */
  scene?: string[];
  /** Words in the CORRECT order; the player shuffles them into tiles. */
  words: string[];
  /** Extra word tiles that do not belong in the sentence. */
  distractors?: string[];
  /**
   * Optional expansion round: after building the base sentence the child
   * picks a developing word, it slides into the sentence at insertAt, and
   * the child reads the longer sentence aloud.
   */
  expansion?: SentenceExpansion;
  hint?: string;
}

export interface SentenceExpansion {
  /** Question the parent asks, e.g. "Aké je mlieko? Povedz dlhšiu vetu." */
  prompt: string;
  /** Candidate expanding words (all are valid — this is enrichment). */
  options: string[];
  /** Word index in `words` before which the picked option is inserted. */
  insertAt: number;
}

/** Sorting — build the semantic network by placing items into buckets. */
export interface SortingContent {
  type: "sorting";
  intro?: string;
  /** 2–3 labelled buckets. */
  categories: SortingCategory[];
  items: SortingItem[];
}

export interface SortingCategory {
  label: string;
  emoji: string;
}

export interface SortingItem {
  label: string;
  emoji: string;
  /** Index into `categories`. */
  category: number;
  hint?: string;
}

/**
 * Scene directions (Token Test / barrier game) — receptive language:
 * the parent reads a spatial instruction, the child places tokens on a board.
 */
export interface SceneDirectionsContent {
  type: "scene_directions";
  intro?: string;
  board: SceneBoard;
  rounds: SceneRound[];
}

export interface SceneBoard {
  rows: number;
  cols: number;
  /** Fixed landmarks the instructions refer to ("nad dom", "vedľa stromu"). */
  anchors: SceneAnchor[];
}

export interface SceneAnchor {
  emoji: string;
  label: string;
  row: number;
  col: number;
}

export interface SceneRound {
  /** Instruction the parent reads aloud (not revealed to the child). */
  instruction: string;
  /** Token tray for this round — every token must be placed. */
  tokens: string[];
  /** Required placement per token, checked when the tray is empty. */
  places: ScenePlacement[];
  hint?: string;
}

export interface ScenePlacement {
  token: string;
  row: number;
  col: number;
}

export type ExerciseContent =
  | ChoiceContent
  | SoundBoxesContent
  | MemorySequenceContent
  | PairsContent
  | NumberTrackContent
  | StorySequenceContent
  | SpeechItemsContent
  | GuidedStepsContent
  | MinimalPairsContent
  | SoundHuntContent
  | SentenceBuilderContent
  | SortingContent
  | SceneDirectionsContent;

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
        const expect = Array.isArray(raw.expect)
          ? raw.expect.map((e, j) => str(e, `items[${i}].expect[${j}]`))
          : undefined;
        const minExpected =
          typeof raw.minExpected === "number" ? raw.minExpected : undefined;
        return {
          text: str(raw.text, `items[${i}].text`),
          emoji: optStr(raw.emoji),
          ask: optStr(raw.ask),
          tip: optStr(raw.tip),
          expect: expect && expect.length > 0 ? expect : undefined,
          minExpected,
        } satisfies SpeechItem;
      });
      return { type: "speech_items", intro: optStr(json.intro), items };
    }

    case "minimal_pairs": {
      const mode = json.mode === "same_different" ? "same_different" : "listen";
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const side = (v: unknown, what: string): MinimalPairWord => {
          if (!isRecord(v)) fail(`${what} must be an object`);
          return { word: str(v.word, `${what}.word`), emoji: str(v.emoji, `${what}.emoji`) };
        };
        const a = side(raw.a, `items[${i}].a`);
        const b = side(raw.b, `items[${i}].b`);
        if (a.word === b.word) fail(`items[${i}] pair words must differ`);
        const say = raw.say === "a" || raw.say === "b" ? raw.say : undefined;
        if (mode === "listen" && !say) fail(`items[${i}].say is required in listen mode`);
        return {
          a,
          b,
          say,
          same: raw.same === true,
          hint: optStr(raw.hint),
        } satisfies MinimalPairItem;
      });
      return {
        type: "minimal_pairs",
        intro: optStr(json.intro),
        mode,
        contrast: str(json.contrast, "contrast"),
        items,
      };
    }

    case "sound_hunt": {
      const mode = json.mode === "bombardment" ? "bombardment" : "detect";
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        return {
          word: str(raw.word, `items[${i}].word`),
          emoji: optStr(raw.emoji),
          has: raw.has === true,
          hint: optStr(raw.hint),
        } satisfies SoundHuntItem;
      });
      return {
        type: "sound_hunt",
        intro: optStr(json.intro),
        target: str(json.target, "target"),
        mode,
        items,
      };
    }

    case "sentence_builder": {
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const words = arr(raw.words, `items[${i}].words`).map((w, j) =>
          str(w, `items[${i}].words[${j}]`),
        );
        if (words.length < 2) fail(`items[${i}] needs at least 2 words`);
        let expansion: SentenceExpansion | undefined;
        if (isRecord(raw.expansion)) {
          const e = raw.expansion;
          const insertAt = typeof e.insertAt === "number" ? e.insertAt : -1;
          if (insertAt < 0 || insertAt > words.length)
            fail(`items[${i}].expansion.insertAt out of range`);
          expansion = {
            prompt: str(e.prompt, `items[${i}].expansion.prompt`),
            options: arr(e.options, `items[${i}].expansion.options`).map((o, j) =>
              str(o, `items[${i}].expansion.options[${j}]`),
            ),
            insertAt,
          };
        }
        return {
          scene: Array.isArray(raw.scene)
            ? raw.scene.map((s, j) => str(s, `items[${i}].scene[${j}]`))
            : undefined,
          words,
          distractors: Array.isArray(raw.distractors)
            ? raw.distractors.map((d, j) => str(d, `items[${i}].distractors[${j}]`))
            : undefined,
          expansion,
          hint: optStr(raw.hint),
        } satisfies SentenceBuilderItem;
      });
      return { type: "sentence_builder", intro: optStr(json.intro), items };
    }

    case "sorting": {
      const categories = arr(json.categories, "categories").map((raw, i) => {
        if (!isRecord(raw)) fail(`categories[${i}] must be an object`);
        return {
          label: str(raw.label, `categories[${i}].label`),
          emoji: str(raw.emoji, `categories[${i}].emoji`),
        } satisfies SortingCategory;
      });
      if (categories.length < 2 || categories.length > 3)
        fail("sorting needs 2–3 categories");
      const items = arr(json.items, "items").map((raw, i) => {
        if (!isRecord(raw)) fail(`items[${i}] must be an object`);
        const category = typeof raw.category === "number" ? raw.category : -1;
        if (category < 0 || category >= categories.length)
          fail(`items[${i}].category out of range`);
        return {
          label: str(raw.label, `items[${i}].label`),
          emoji: str(raw.emoji, `items[${i}].emoji`),
          category,
          hint: optStr(raw.hint),
        } satisfies SortingItem;
      });
      return { type: "sorting", intro: optStr(json.intro), categories, items };
    }

    case "scene_directions": {
      if (!isRecord(json.board)) fail("board must be an object");
      const rows = typeof json.board.rows === "number" ? json.board.rows : 0;
      const cols = typeof json.board.cols === "number" ? json.board.cols : 0;
      if (rows < 2 || rows > 5 || cols < 2 || cols > 5)
        fail("board needs 2–5 rows and 2–5 cols");
      const inBoard = (r: unknown, c: unknown): r is number =>
        typeof r === "number" && typeof c === "number" &&
        r >= 0 && r < rows && c >= 0 && c < cols;
      const anchors = arr(json.board.anchors, "board.anchors").map((raw, i) => {
        if (!isRecord(raw)) fail(`board.anchors[${i}] must be an object`);
        if (!inBoard(raw.row, raw.col)) fail(`board.anchors[${i}] outside the board`);
        return {
          emoji: str(raw.emoji, `board.anchors[${i}].emoji`),
          label: str(raw.label, `board.anchors[${i}].label`),
          row: raw.row as number,
          col: raw.col as number,
        } satisfies SceneAnchor;
      });
      const anchorCells = new Set(anchors.map((a) => `${a.row}:${a.col}`));
      if (anchorCells.size !== anchors.length) fail("anchors overlap on the board");
      const rounds = arr(json.rounds, "rounds").map((raw, i) => {
        if (!isRecord(raw)) fail(`rounds[${i}] must be an object`);
        const tokens = arr(raw.tokens, `rounds[${i}].tokens`).map((t, j) =>
          str(t, `rounds[${i}].tokens[${j}]`),
        );
        if (new Set(tokens).size !== tokens.length) fail(`rounds[${i}] tokens must be unique`);
        const places = arr(raw.places, `rounds[${i}].places`).map((p, j) => {
          if (!isRecord(p)) fail(`rounds[${i}].places[${j}] must be an object`);
          const token = str(p.token, `rounds[${i}].places[${j}].token`);
          if (!tokens.includes(token))
            fail(`rounds[${i}].places[${j}].token is not in the tray`);
          if (!inBoard(p.row, p.col)) fail(`rounds[${i}].places[${j}] outside the board`);
          if (anchorCells.has(`${p.row}:${p.col}`))
            fail(`rounds[${i}].places[${j}] targets an anchor cell`);
          return { token, row: p.row as number, col: p.col as number } satisfies ScenePlacement;
        });
        if (places.length !== tokens.length)
          fail(`rounds[${i}] must place every token exactly once`);
        if (new Set(places.map((p) => p.token)).size !== places.length)
          fail(`rounds[${i}] places a token twice`);
        if (new Set(places.map((p) => `${p.row}:${p.col}`)).size !== places.length)
          fail(`rounds[${i}] places two tokens on one cell`);
        return {
          instruction: str(raw.instruction, `rounds[${i}].instruction`),
          tokens,
          places,
          hint: optStr(raw.hint),
        } satisfies SceneRound;
      });
      return {
        type: "scene_directions",
        intro: optStr(json.intro),
        board: { rows, cols, anchors },
        rounds,
      };
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
    case "minimal_pairs":
    case "sound_hunt":
    case "sentence_builder":
    case "sorting":
      return content.items.length;
    case "pairs":
      return content.pairs.length;
    case "number_track":
    case "scene_directions":
      return content.rounds.length;
    case "guided_steps":
      return content.steps.length;
  }
}

/** Modality implied by a content type (kept in sync with the DB enum). */
export function modalityForContent(type: ExerciseContentType): ExerciseModality {
  switch (type) {
    case "speech_items":
      return "speech";
    case "guided_steps":
      return "guided";
    default:
      return "interactive";
  }
}
