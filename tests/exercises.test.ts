import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseExerciseContent,
  tryParseExerciseContent,
  contentItemCount,
  asSupportLevel,
} from "../lib/exercises/types";
import type { Json } from "../lib/database.types";

test("parseExerciseContent: valid choice", () => {
  const c = parseExerciseContent({
    type: "choice",
    items: [{ prompt: "Q", options: [{ label: "a", correct: true }, { label: "b" }] }],
  } as Json);
  assert.equal(c.type, "choice");
  assert.equal(contentItemCount(c), 1);
});

test("parseExerciseContent: choice with no correct option throws", () => {
  assert.throws(() =>
    parseExerciseContent({ type: "choice", items: [{ prompt: "Q", options: [{ label: "a" }] }] } as Json),
  );
});

test("parseExerciseContent: speech_items with expect (describe mode)", () => {
  const c = parseExerciseContent({
    type: "speech_items",
    items: [
      { text: "opíš", emoji: "🐶", expect: ["pes", "lopta", "strom"], minExpected: 2 },
      { text: "no expect" },
    ],
  } as Json);
  assert.equal(c.type, "speech_items");
  if (c.type !== "speech_items") throw new Error("narrow");
  assert.deepEqual(c.items[0].expect, ["pes", "lopta", "strom"]);
  assert.equal(c.items[0].minExpected, 2);
  // empty/absent expect must normalise to undefined (falls back to manual scoring)
  assert.equal(c.items[1].expect, undefined);
});

test("parseExerciseContent: empty expect array normalises to undefined", () => {
  const c = parseExerciseContent({
    type: "speech_items",
    items: [{ text: "x", expect: [] }],
  } as Json);
  if (c.type !== "speech_items") throw new Error("narrow");
  assert.equal(c.items[0].expect, undefined);
});

test("parseExerciseContent: non-string expect entry throws", () => {
  assert.throws(() =>
    parseExerciseContent({ type: "speech_items", items: [{ text: "x", expect: ["ok", 5] }] } as Json),
  );
});

test("parseExerciseContent: unknown type throws", () => {
  assert.throws(() => parseExerciseContent({ type: "nope" } as Json));
});

test("tryParseExerciseContent returns null on malformed input", () => {
  assert.equal(tryParseExerciseContent({ garbage: true } as Json), null);
  assert.equal(tryParseExerciseContent("not an object" as Json), null);
});

test("contentItemCount: pairs / number_track / guided", () => {
  assert.equal(
    contentItemCount(parseExerciseContent({ type: "pairs", pairs: ["a", "b", "c"] } as Json)),
    3,
  );
  assert.equal(
    contentItemCount(
      parseExerciseContent({ type: "number_track", rounds: [{ from: 1, to: 5 }] } as Json),
    ),
    1,
  );
});

test("asSupportLevel clamps to 1..3", () => {
  assert.equal(asSupportLevel(0), 1);
  assert.equal(asSupportLevel(1), 1);
  assert.equal(asSupportLevel(2), 2);
  assert.equal(asSupportLevel(3), 3);
  assert.equal(asSupportLevel(9), 3);
});

/* ---------------- new task types (wave: minimal_pairs … scene_directions) ---------------- */

test("parseExerciseContent: minimal_pairs listen requires say", () => {
  const c = parseExerciseContent({
    type: "minimal_pairs",
    mode: "listen",
    contrast: "s–š",
    items: [{ a: { word: "kasa", emoji: "💰" }, b: { word: "kaša", emoji: "🥣" }, say: "b" }],
  } as Json);
  if (c.type !== "minimal_pairs") throw new Error("narrow");
  assert.equal(c.items[0].say, "b");
  assert.throws(() =>
    parseExerciseContent({
      type: "minimal_pairs",
      mode: "listen",
      contrast: "s–š",
      items: [{ a: { word: "kasa", emoji: "💰" }, b: { word: "kaša", emoji: "🥣" } }],
    } as Json),
  );
});

test("parseExerciseContent: minimal_pairs identical words throw", () => {
  assert.throws(() =>
    parseExerciseContent({
      type: "minimal_pairs",
      mode: "same_different",
      contrast: "s–š",
      items: [{ a: { word: "sud", emoji: "🛢️" }, b: { word: "sud", emoji: "🛢️" }, same: true }],
    } as Json),
  );
});

test("parseExerciseContent: sound_hunt keeps target + has flags", () => {
  const c = parseExerciseContent({
    type: "sound_hunt",
    target: "š",
    mode: "detect",
    items: [
      { word: "šiška", emoji: "🍩", has: true },
      { word: "mak", emoji: "🌺", has: false },
    ],
  } as Json);
  if (c.type !== "sound_hunt") throw new Error("narrow");
  assert.equal(c.target, "š");
  assert.equal(c.items[1].has, false);
  assert.equal(contentItemCount(c), 2);
});

test("parseExerciseContent: sentence_builder expansion insertAt is range-checked", () => {
  const ok = parseExerciseContent({
    type: "sentence_builder",
    items: [
      {
        words: ["Mama", "varí", "polievku"],
        distractors: ["spí"],
        expansion: { prompt: "Aká je polievka?", options: ["teplú", "dobrú"], insertAt: 2 },
      },
    ],
  } as Json);
  if (ok.type !== "sentence_builder") throw new Error("narrow");
  assert.equal(ok.items[0].expansion?.insertAt, 2);
  assert.throws(() =>
    parseExerciseContent({
      type: "sentence_builder",
      items: [
        { words: ["Pes", "spí"], expansion: { prompt: "x", options: ["a", "b"], insertAt: 7 } },
      ],
    } as Json),
  );
});

test("parseExerciseContent: sorting validates category indexes", () => {
  const c = parseExerciseContent({
    type: "sorting",
    categories: [
      { label: "Ovocie", emoji: "🧺" },
      { label: "Zvieratá", emoji: "🐾" },
    ],
    items: [
      { label: "banán", emoji: "🍌", category: 0 },
      { label: "zajac", emoji: "🐰", category: 1 },
    ],
  } as Json);
  if (c.type !== "sorting") throw new Error("narrow");
  assert.equal(c.items[1].category, 1);
  assert.throws(() =>
    parseExerciseContent({
      type: "sorting",
      categories: [
        { label: "A", emoji: "🅰️" },
        { label: "B", emoji: "🅱️" },
      ],
      items: [{ label: "x", emoji: "❓", category: 5 }],
    } as Json),
  );
});

test("parseExerciseContent: scene_directions enforces board geometry", () => {
  const c = parseExerciseContent({
    type: "scene_directions",
    board: { rows: 3, cols: 3, anchors: [{ emoji: "🏠", label: "dom", row: 2, col: 0 }] },
    rounds: [
      {
        instruction: "Polož jablko nad dom.",
        tokens: ["🍎"],
        places: [{ token: "🍎", row: 1, col: 0 }],
      },
    ],
  } as Json);
  if (c.type !== "scene_directions") throw new Error("narrow");
  assert.equal(contentItemCount(c), 1);
  // placing a token on an anchor cell must throw
  assert.throws(() =>
    parseExerciseContent({
      type: "scene_directions",
      board: { rows: 3, cols: 3, anchors: [{ emoji: "🏠", label: "dom", row: 2, col: 0 }] },
      rounds: [
        { instruction: "x", tokens: ["🍎"], places: [{ token: "🍎", row: 2, col: 0 }] },
      ],
    } as Json),
  );
  // every token must be placed exactly once
  assert.throws(() =>
    parseExerciseContent({
      type: "scene_directions",
      board: { rows: 3, cols: 3, anchors: [{ emoji: "🏠", label: "dom", row: 2, col: 0 }] },
      rounds: [{ instruction: "x", tokens: ["🍎", "⭐"], places: [{ token: "🍎", row: 0, col: 0 }] }],
    } as Json),
  );
});
