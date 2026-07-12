#!/usr/bin/env node
/**
 * Validates content/exercises/*.json against the exercise content contract
 * (content/exercises/SPEC.md + lib/exercises/types.ts) including Slovak
 * phonemic segmentation for sound_boxes items.
 *
 * Usage: node scripts/validate-exercises.mjs
 * Exit code 1 when any ERROR is found. Fix WARNs too before seeding.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "exercises");

const DOMAINS = {
  phonemic_awareness: "pa",
  working_memory: "wm",
  attention: "at",
  narrative: "na",
  vocabulary: "vo",
  articulation: "ar",
  guided: "gu",
};
const MODALITIES = ["interactive", "speech", "guided"];
const TYPES = [
  "choice",
  "sound_boxes",
  "memory_sequence",
  "pairs",
  "number_track",
  "story_sequence",
  "speech_items",
  "guided_steps",
  "minimal_pairs",
  "sound_hunt",
  "sentence_builder",
  "sorting",
  "scene_directions",
];

/* ---------------- Slovak phoneme segmentation ---------------- */
const DIGRAPHS = ["ch", "dz", "dž"];
const DIPHTHONGS = ["ia", "ie", "iu"];
const LONG_VOWELS = new Set(["á", "é", "í", "ó", "ú", "ý"]);
const SHORT_VOWELS = new Set(["a", "e", "i", "o", "u", "y", "ä"]);
const FORBIDDEN = ["x", "q", "w", "ĺ", "ŕ"];
// word-final voiced obstruents devoice in speech → spelling ≠ sound
const FINAL_DEVOICED = new Set(["b", "d", "ď", "g", "z", "ž", "h", "v", "dz", "dž"]);

function segmentSlovak(word) {
  const w = word.toLowerCase();
  const out = [];
  let i = 0;
  while (i < w.length) {
    const two = w.slice(i, i + 2);
    if (DIGRAPHS.includes(two)) {
      out.push({ sound: two, kind: "consonant" });
      i += 2;
    } else if (DIPHTHONGS.includes(two)) {
      out.push({ sound: two, kind: "diphthong" });
      i += 2;
    } else {
      const ch = w[i];
      const kind = ch === "ô"
        ? "diphthong"
        : LONG_VOWELS.has(ch)
          ? "long_vowel"
          : SHORT_VOWELS.has(ch)
            ? "vowel"
            : "consonant";
      out.push({ sound: ch, kind });
      i += 1;
    }
  }
  return out;
}

/* ---------------- reporting ---------------- */
const problems = [];
function err(where, msg) {
  problems.push({ level: "ERROR", where, msg });
}
function warn(where, msg) {
  problems.push({ level: "WARN", where, msg });
}

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v) => typeof v === "string" && v.length > 0;

/* ---------------- content validators ---------------- */
function checkChoice(c, at) {
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "choice needs items[]");
  if (c.items.length < 5) warn(at, `only ${c.items.length} choice items (spec: 6–10)`);
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}]`;
    if (!isStr(it.prompt)) err(w, "missing prompt");
    if (!Array.isArray(it.options) || it.options.length < 2) return err(w, "needs ≥2 options");
    if (it.options.length < 3 || it.options.length > 4)
      warn(w, `${it.options.length} options (spec: 3–4)`);
    const correct = it.options.filter((o) => o.correct === true).length;
    if (correct !== 1) err(w, `${correct} correct options, need exactly 1`);
    it.options.forEach((o, j) => {
      if (!isStr(o.label)) err(`${w}.options[${j}]`, "missing label");
      if (!isStr(o.emoji)) warn(`${w}.options[${j}]`, "missing emoji");
    });
    if (!isStr(it.hint)) warn(w, "missing hint");
  });
}

function checkSoundBoxes(c, at, difficulty) {
  if (!["count", "colors"].includes(c.mode)) err(at, `bad mode ${c.mode}`);
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 5 || c.items.length > 8)
    warn(at, `${c.items.length} words (spec: 5–8)`);
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}] "${it.word}"`;
    if (!isStr(it.word)) return err(w, "missing word");
    if (!isStr(it.emoji)) warn(w, "missing emoji");
    if (!Array.isArray(it.phonemes) || it.phonemes.length === 0)
      return err(w, "missing phonemes");

    const lower = it.word.toLowerCase();
    for (const bad of FORBIDDEN)
      if (lower.includes(bad)) err(w, `contains forbidden letter "${bad}"`);

    const joined = it.phonemes.map((p) => p.sound).join("");
    if (joined !== lower)
      err(w, `phoneme sounds join to "${joined}", expected "${lower}"`);

    const expected = segmentSlovak(it.word);
    if (expected.length !== it.phonemes.length)
      err(
        w,
        `${it.phonemes.length} phonemes given, segmenter expects ${expected.length} (${expected.map((p) => p.sound).join("-")})`,
      );
    it.phonemes.forEach((p, j) => {
      const exp = expected[j];
      if (exp && p.sound === exp.sound && p.kind !== exp.kind)
        err(`${w}.phonemes[${j}]`, `"${p.sound}" should be kind ${exp.kind}, got ${p.kind}`);
    });

    const last = expected[expected.length - 1];
    if (last && FINAL_DEVOICED.has(last.sound))
      warn(w, `ends with voiced obstruent "${last.sound}" — spoken form devoices, pick another word`);

    const n = expected.length;
    if (difficulty === 1 && (n < 2 || n > 3)) warn(w, `diff 1 wants 2–3 phonemes, has ${n}`);
    if (difficulty === 2 && (n < 3 || n > 4)) warn(w, `diff 2 wants 3–4 phonemes, has ${n}`);
    if (difficulty === 3 && (n < 4 || n > 6)) warn(w, `diff 3 wants 4–6 phonemes, has ${n}`);
  });
}

function checkMemory(c, at, difficulty) {
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 4 || c.items.length > 6) warn(at, `${c.items.length} items (spec: 4–6)`);
  const range = { 1: [2, 3], 2: [3, 4], 3: [4, 6] }[difficulty] ?? [2, 6];
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}]`;
    if (!Array.isArray(it.sequence) || it.sequence.length < 2) return err(w, "sequence too short");
    if (it.sequence.length < range[0] || it.sequence.length > range[1])
      warn(w, `sequence length ${it.sequence.length} outside diff ${difficulty} range ${range[0]}–${range[1]}`);
    if (!Array.isArray(it.distractors) || it.distractors.length < 2)
      warn(w, "wants 2–4 distractors");
    const all = [...it.sequence, ...(it.distractors ?? [])];
    if (new Set(all).size !== all.length) err(w, "emoji repeat between sequence and distractors");
  });
}

function checkPairs(c, at, difficulty) {
  if (!Array.isArray(c.pairs) || c.pairs.length < 3) return err(at, "needs ≥3 pairs");
  if (new Set(c.pairs).size !== c.pairs.length) err(at, "pairs must be unique");
  const [lo, hi] = difficulty === 1 ? [4, 6] : [6, 10];
  if (c.pairs.length < lo || c.pairs.length > hi)
    warn(at, `${c.pairs.length} pairs outside diff ${difficulty} range ${lo}–${hi}`);
}

function checkNumberTrack(c, at) {
  if (!Array.isArray(c.rounds) || c.rounds.length === 0) return err(at, "needs rounds[]");
  if (c.rounds.length < 3 || c.rounds.length > 5) warn(at, `${c.rounds.length} rounds (spec: 3–5)`);
  c.rounds.forEach((r, i) => {
    const w = `${at}.rounds[${i}]`;
    if (typeof r.from !== "number" || typeof r.to !== "number" || r.from >= r.to)
      err(w, "needs numeric from < to");
    if (r.to - r.from > 19) warn(w, "more than 20 numbers on one board");
    (r.distractors ?? []).forEach((d) => {
      if (typeof d !== "number") err(w, "distractors must be numbers");
      else if (d >= r.from && d <= r.to) err(w, `distractor ${d} inside from–to range`);
    });
  });
}

function checkStory(c, at, difficulty) {
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 2 || c.items.length > 4) warn(at, `${c.items.length} stories (spec: 2–4)`);
  const want = { 1: [3, 3], 2: [4, 4], 3: [5, 6] }[difficulty] ?? [3, 6];
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}]`;
    if (!isStr(it.title)) err(w, "missing title");
    if (!isStr(it.retellPrompt)) err(w, "missing retellPrompt");
    if (!Array.isArray(it.cards) || it.cards.length < 3) return err(w, "needs ≥3 cards");
    if (it.cards.length < want[0] || it.cards.length > want[1])
      warn(w, `${it.cards.length} cards outside diff ${difficulty} range ${want[0]}–${want[1]}`);
    it.cards.forEach((card, j) => {
      if (!isStr(card.emoji) || !isStr(card.label)) err(`${w}.cards[${j}]`, "needs emoji + label");
    });
    const labels = it.cards.map((card) => card.label);
    if (new Set(labels).size !== labels.length) err(w, "card labels must differ");
  });
}

function checkSpeech(c, at) {
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 6 || c.items.length > 12) warn(at, `${c.items.length} items (spec: 6–12)`);
  c.items.forEach((it, i) => {
    if (!isStr(it.text)) err(`${at}.items[${i}]`, "missing text");
  });
}

function checkGuided(c, at) {
  if (!Array.isArray(c.steps) || c.steps.length === 0) return err(at, "needs steps[]");
  if (c.steps.length < 4 || c.steps.length > 7) warn(at, `${c.steps.length} steps (spec: 4–7)`);
  let choices = 0;
  let fields = 0;
  c.steps.forEach((s, i) => {
    const w = `${at}.steps[${i}]`;
    if (!isStr(s.title)) err(w, "missing title");
    if (!isStr(s.body)) err(w, "missing body");
    if (Array.isArray(s.choices) && s.choices.length > 0) choices += 1;
    if (Array.isArray(s.fields) && s.fields.length > 0) {
      fields += 1;
      s.fields.forEach((f, j) => {
        if (!isStr(f.label)) err(`${w}.fields[${j}]`, "missing label");
      });
    }
  });
  if (choices < 1) warn(at, "no step with choices (spec: ≥1)");
  if (fields < 2) warn(at, `only ${fields} steps with fields (spec: ≥2)`);
}

function checkMinimalPairs(c, at) {
  if (!["listen", "same_different"].includes(c.mode)) err(at, `bad mode ${c.mode}`);
  if (!isStr(c.contrast)) err(at, "missing contrast (e.g. \"s–š\")");
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 5 || c.items.length > 10)
    warn(at, `${c.items.length} pairs (spec: 5–10)`);
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}]`;
    for (const side of ["a", "b"]) {
      if (!isObj(it[side]) || !isStr(it[side].word) || !isStr(it[side].emoji))
        return err(`${w}.${side}`, "needs word + emoji");
    }
    if (!isObj(it.a) || !isObj(it.b)) return;
    if (it.a.word === it.b.word) err(w, "pair words must differ");
    else {
      // a true minimal pair differs in exactly one phoneme
      const sa = segmentSlovak(it.a.word).map((p) => p.sound);
      const sb = segmentSlovak(it.b.word).map((p) => p.sound);
      if (sa.length === sb.length) {
        const diffs = sa.filter((s, j) => s !== sb[j]).length;
        if (diffs !== 1)
          warn(w, `"${it.a.word}"–"${it.b.word}" differ in ${diffs} phonemes (minimal pair = exactly 1)`);
      } else if (Math.abs(sa.length - sb.length) !== 1) {
        warn(w, `"${it.a.word}"–"${it.b.word}" lengths differ by ${Math.abs(sa.length - sb.length)} phonemes`);
      }
    }
    if (c.mode === "listen" && !["a", "b"].includes(it.say))
      err(w, "listen mode needs say: \"a\" | \"b\"");
    if (c.mode === "same_different" && typeof it.same !== "boolean")
      err(w, "same_different mode needs same: true|false");
    if (!isStr(it.hint)) warn(w, "missing hint");
  });
  if (c.mode === "listen") {
    const says = c.items.map((it) => it.say);
    if (says.length >= 4 && new Set(says).size === 1)
      warn(at, "every item says the same side — child can pattern-match; mix a/b");
  }
  if (c.mode === "same_different") {
    const sames = c.items.filter((it) => it.same === true).length;
    if (sames === 0 || sames === c.items.length)
      warn(at, "mix same:true and same:false items, else the answer is constant");
  }
}

function checkSoundHunt(c, at) {
  if (!["bombardment", "detect"].includes(c.mode)) err(at, `bad mode ${c.mode}`);
  if (!isStr(c.target)) return err(at, "missing target phoneme");
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  const lo = c.mode === "bombardment" ? 8 : 6;
  const hi = c.mode === "bombardment" ? 14 : 12;
  if (c.items.length < lo || c.items.length > hi)
    warn(at, `${c.items.length} words (spec ${c.mode}: ${lo}–${hi})`);
  const target = String(c.target).toLowerCase();
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}] "${it.word}"`;
    if (!isStr(it.word)) return err(w, "missing word");
    if (typeof it.has !== "boolean") err(w, "missing has: true|false");
    const contains = it.word.toLowerCase().includes(target);
    if (it.has === true && !contains) err(w, `has:true but "${target}" not in the word`);
    if (it.has === false && contains) err(w, `has:false but "${target}" IS in the word`);
    if (!isStr(it.emoji)) warn(w, "missing emoji");
  });
  if (c.mode === "bombardment" && c.items.some((it) => it.has === false))
    err(at, "bombardment is pure exposure — every word must contain the target");
  if (c.mode === "detect") {
    const yes = c.items.filter((it) => it.has === true).length;
    const no = c.items.length - yes;
    if (yes === 0 || no === 0) err(at, "detect mode needs both has:true and has:false words");
    else if (yes < 2 || no < 2) warn(at, `unbalanced detect mix (${yes} áno / ${no} nie)`);
  }
}

function checkSentenceBuilder(c, at, difficulty) {
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 4 || c.items.length > 8) warn(at, `${c.items.length} sentences (spec: 4–8)`);
  const range = { 1: [2, 3], 2: [3, 4], 3: [4, 7] }[difficulty] ?? [2, 7];
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}]`;
    if (!Array.isArray(it.words) || it.words.length < 2) return err(w, "needs ≥2 words");
    if (it.words.length < range[0] || it.words.length > range[1])
      warn(w, `${it.words.length} words outside diff ${difficulty} range ${range[0]}–${range[1]}`);
    it.words.forEach((word, j) => {
      if (!isStr(word)) err(`${w}.words[${j}]`, "must be a non-empty string");
    });
    (it.distractors ?? []).forEach((d, j) => {
      if (!isStr(d)) err(`${w}.distractors[${j}]`, "must be a non-empty string");
      else if (it.words.includes(d)) err(`${w}.distractors[${j}]`, `"${d}" repeats a sentence word`);
    });
    if (it.expansion) {
      if (!isStr(it.expansion.prompt)) err(`${w}.expansion`, "missing prompt");
      if (!Array.isArray(it.expansion.options) || it.expansion.options.length < 2)
        err(`${w}.expansion`, "needs ≥2 options");
      const insertAt = it.expansion.insertAt;
      if (typeof insertAt !== "number" || insertAt < 0 || insertAt > it.words.length)
        err(`${w}.expansion`, "insertAt out of range");
    }
    if (!isStr(it.hint)) warn(w, "missing hint");
  });
}

function checkSorting(c, at) {
  if (!Array.isArray(c.categories) || c.categories.length < 2 || c.categories.length > 3)
    return err(at, "needs 2–3 categories");
  c.categories.forEach((cat, i) => {
    if (!isStr(cat.label) || !isStr(cat.emoji)) err(`${at}.categories[${i}]`, "needs label + emoji");
  });
  if (!Array.isArray(c.items) || c.items.length === 0) return err(at, "needs items[]");
  if (c.items.length < 6 || c.items.length > 12) warn(at, `${c.items.length} items (spec: 6–12)`);
  const perCat = c.categories.map(() => 0);
  c.items.forEach((it, i) => {
    const w = `${at}.items[${i}]`;
    if (!isStr(it.label) || !isStr(it.emoji)) err(w, "needs label + emoji");
    if (typeof it.category !== "number" || it.category < 0 || it.category >= c.categories.length)
      err(w, "category index out of range");
    else perCat[it.category] += 1;
    if (!isStr(it.hint)) warn(w, "missing hint");
  });
  perCat.forEach((n, i) => {
    if (n < 2) warn(at, `category ${i} ("${c.categories[i]?.label}") has only ${n} items (want ≥2)`);
  });
  const labels = c.items.map((it) => it.label);
  if (new Set(labels).size !== labels.length) err(at, "item labels must be unique");
}

function checkSceneDirections(c, at, difficulty) {
  if (!isObj(c.board)) return err(at, "needs board");
  const { rows, cols } = c.board;
  if (typeof rows !== "number" || typeof cols !== "number" || rows < 2 || rows > 5 || cols < 2 || cols > 5)
    return err(at, "board needs 2–5 rows/cols");
  if (!Array.isArray(c.board.anchors) || c.board.anchors.length === 0)
    return err(at, "board needs anchors[]");
  const cells = new Set();
  c.board.anchors.forEach((a, i) => {
    const w = `${at}.board.anchors[${i}]`;
    if (!isStr(a.emoji) || !isStr(a.label)) err(w, "needs emoji + label");
    if (typeof a.row !== "number" || typeof a.col !== "number" || a.row < 0 || a.row >= rows || a.col < 0 || a.col >= cols)
      return err(w, "outside the board");
    const key = `${a.row}:${a.col}`;
    if (cells.has(key)) err(w, "two anchors on one cell");
    cells.add(key);
  });
  if (!Array.isArray(c.rounds) || c.rounds.length === 0) return err(at, "needs rounds[]");
  if (c.rounds.length < 3 || c.rounds.length > 6) warn(at, `${c.rounds.length} rounds (spec: 3–6)`);
  const stepRange = { 1: [1, 1], 2: [1, 2], 3: [2, 3] }[difficulty] ?? [1, 3];
  c.rounds.forEach((r, i) => {
    const w = `${at}.rounds[${i}]`;
    if (!isStr(r.instruction)) err(w, "missing instruction");
    if (!Array.isArray(r.tokens) || r.tokens.length === 0) return err(w, "needs tokens[]");
    if (new Set(r.tokens).size !== r.tokens.length) err(w, "tokens must be unique");
    if (!Array.isArray(r.places) || r.places.length !== r.tokens.length)
      return err(w, "places must place every token exactly once");
    const used = new Set();
    const targets = new Set();
    r.places.forEach((p, j) => {
      const pw = `${w}.places[${j}]`;
      if (!r.tokens.includes(p.token)) err(pw, `token "${p.token}" not in tray`);
      if (used.has(p.token)) err(pw, `token "${p.token}" placed twice`);
      used.add(p.token);
      if (typeof p.row !== "number" || typeof p.col !== "number" || p.row < 0 || p.row >= rows || p.col < 0 || p.col >= cols)
        return err(pw, "outside the board");
      const key = `${p.row}:${p.col}`;
      if (cells.has(key)) err(pw, "targets an anchor cell");
      if (targets.has(key)) err(pw, "two tokens on one cell");
      targets.add(key);
    });
    if (r.places.length < stepRange[0] || r.places.length > stepRange[1])
      warn(w, `${r.places.length} placements outside diff ${difficulty} range ${stepRange[0]}–${stepRange[1]}`);
    if (!isStr(r.hint)) warn(w, "missing hint");
  });
}

/* ---------------- record validator ---------------- */
function checkRecord(rec, at, expectedDomain) {
  if (!isObj(rec)) return err(at, "record must be an object");
  const prefix = DOMAINS[rec.domain];
  if (!prefix) err(at, `bad domain ${rec.domain}`);
  if (expectedDomain && rec.domain !== expectedDomain)
    err(at, `domain ${rec.domain} but file is ${expectedDomain}`);
  if (!isStr(rec.slug)) err(at, "missing slug");
  else if (prefix && !rec.slug.startsWith(`${prefix}-`))
    err(at, `slug ${rec.slug} must start with "${prefix}-"`);
  if (!MODALITIES.includes(rec.modality)) err(at, `bad modality ${rec.modality}`);
  for (const f of ["title", "summary", "parent_guide"])
    if (!isStr(rec[f])) err(at, `missing ${f}`);
  if (rec.summary && rec.summary.length > 600) err(at, "summary over 600 chars");
  if (![1, 2, 3].includes(rec.difficulty)) err(at, `bad difficulty ${rec.difficulty}`);
  if (
    typeof rec.age_min !== "number" ||
    typeof rec.age_max !== "number" ||
    rec.age_min > rec.age_max ||
    rec.age_min < 3 ||
    rec.age_max > 15
  )
    err(at, "bad age range");
  if (typeof rec.duration_minutes !== "number" || rec.duration_minutes < 1 || rec.duration_minutes > 60)
    err(at, "bad duration_minutes");
  if (!isObj(rec.content)) return err(at, "missing content");
  const c = rec.content;
  if (!TYPES.includes(c.type)) return err(at, `bad content.type ${c.type}`);

  const modalityFor = {
    choice: "interactive",
    sound_boxes: "interactive",
    memory_sequence: "interactive",
    pairs: "interactive",
    number_track: "interactive",
    story_sequence: "interactive",
    speech_items: "speech",
    guided_steps: "guided",
    minimal_pairs: "interactive",
    sound_hunt: "interactive",
    sentence_builder: "interactive",
    sorting: "interactive",
    scene_directions: "interactive",
  };
  if (rec.modality !== modalityFor[c.type])
    err(at, `content.type ${c.type} implies modality ${modalityFor[c.type]}, got ${rec.modality}`);

  const ctx = `${at}<${c.type}>`;
  if (c.type === "choice") checkChoice(c, ctx);
  if (c.type === "sound_boxes") checkSoundBoxes(c, ctx, rec.difficulty);
  if (c.type === "memory_sequence") checkMemory(c, ctx, rec.difficulty);
  if (c.type === "pairs") checkPairs(c, ctx, rec.difficulty);
  if (c.type === "number_track") checkNumberTrack(c, ctx);
  if (c.type === "story_sequence") checkStory(c, ctx, rec.difficulty);
  if (c.type === "speech_items") checkSpeech(c, ctx);
  if (c.type === "guided_steps") checkGuided(c, ctx);
  if (c.type === "minimal_pairs") checkMinimalPairs(c, ctx);
  if (c.type === "sound_hunt") checkSoundHunt(c, ctx);
  if (c.type === "sentence_builder") checkSentenceBuilder(c, ctx, rec.difficulty);
  if (c.type === "sorting") checkSorting(c, ctx);
  if (c.type === "scene_directions") checkSceneDirections(c, ctx, rec.difficulty);
}

/* ---------------- main ---------------- */
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.log("No JSON files in content/exercises yet.");
  process.exit(0);
}

const slugs = new Map();
const stats = {};

for (const file of files) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(DIR, file), "utf8"));
  } catch (e) {
    err(file, `invalid JSON: ${e.message}`);
    continue;
  }
  if (!Array.isArray(data)) {
    err(file, "file must contain an array of exercise records");
    continue;
  }
  const expectedDomain = Object.keys(DOMAINS).find((d) => file === `${d}.json`);
  data.forEach((rec, i) => {
    const at = `${file}[${i}]${rec?.slug ? ` (${rec.slug})` : ""}`;
    checkRecord(rec, at, expectedDomain);
    if (rec?.slug) {
      if (slugs.has(rec.slug)) err(at, `duplicate slug (also in ${slugs.get(rec.slug)})`);
      slugs.set(rec.slug, file);
    }
    if (rec?.domain && [1, 2, 3].includes(rec?.difficulty)) {
      stats[rec.domain] ??= { total: 0, byDiff: { 1: 0, 2: 0, 3: 0 } };
      stats[rec.domain].total += 1;
      stats[rec.domain].byDiff[rec.difficulty] += 1;
    }
  });
}

for (const [domain, s] of Object.entries(stats)) {
  for (const d of [1, 2, 3])
    if (s.byDiff[d] === 0) warn(domain, `no difficulty-${d} exercise in domain`);
  if (s.total < 5) warn(domain, `only ${s.total} exercises (aim for 6–8)`);
}

console.log("── Library stats ──");
for (const [domain, s] of Object.entries(stats))
  console.log(
    `${domain.padEnd(20)} ${String(s.total).padStart(2)} exercises  (d1:${s.byDiff[1]} d2:${s.byDiff[2]} d3:${s.byDiff[3]})`,
  );
console.log(`${"TOTAL".padEnd(20)} ${Object.values(stats).reduce((a, s) => a + s.total, 0)} exercises\n`);

const errors = problems.filter((p) => p.level === "ERROR");
const warns = problems.filter((p) => p.level === "WARN");
for (const p of problems) console.log(`${p.level.padEnd(5)} ${p.where}: ${p.msg}`);
console.log(`\n${errors.length} errors, ${warns.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
