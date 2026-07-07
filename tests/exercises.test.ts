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
