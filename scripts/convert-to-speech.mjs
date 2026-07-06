// One-off: convert the speech-natural choice exercises into speech questions.
// Grounded in the methodology (zamer_projektu.md, SPEC.md): these items are
// "menovanie/pomenovanie" (naming) and fonematická syntéza (Eľkonin) tasks —
// the child produces the answer aloud, the parent rates it. The prompts/answers
// are the existing, vetted texts; only the modality changes.
//
// Surgical string-splice: only each target exercise object is rewritten, so the
// rest of every file stays byte-for-byte identical (clean, reviewable diff).
import { readFileSync, writeFileSync } from "node:fs";

const TARGETS = {
  "content/exercises/vocabulary.json": {
    "vo-protiklady-1": {
      summary:
        "Antonymá — dieťa nahlas hovorí protiklad k slovu. Rozširuje slovník prídavných mien a prísloviek a upevňuje chápanie sémantických vzťahov.",
      intro: "Zahráme sa na slová naopak. Poviem ti slovo a ty povieš jeho opak!",
    },
    "vo-hadanky-2": {},
    "vo-nadradene-slova-3": {},
  },
  "content/exercises/phonemic_awareness.json": {
    "pa-skladanie-hlasok-2": {
      intro: "Poviem ti slovo po jednotlivých hláskach. Poskladáš ho a povieš, aké slovo to je?",
    },
  },
};

// Some original hints pointed at the (now absent) on-screen choices — "ktoré
// z týchto", "ktorý obrázok". As spoken parent nudges those dangle, so rewrite
// them into clean clues that reveal nothing. Keyed by the item's answer text.
const TIP_OVERRIDES = {
  "vo-hadanky-2": {
    pes: "Zvieratko, ktoré šteká a stráži dom.",
    mrkva: "Je oranžová, rastie v zemi a zajačik ju rád chrúme.",
    žirafa: "Zviera s najdlhším krkom — vidí ponad stromy.",
    sneh: "Je biely, studený a padá z neba.",
    bicykel: "Má dve kolesá a šliapeš do pedálov.",
    včela: "Bzučí, býva v úli a vyrába med.",
    dáždnik: "Držíš ho nad hlavou, keď prší.",
  },
  "pa-skladanie-hlasok-2": {
    dom: "Povedz hlásky d – o – m rýchlo za sebou. Čo ti vyšlo?",
    ryba: "Povedz hlásky spolu ako jedno slovo. Čo ti vyšlo?",
  },
};

/** Find the [start,end) span of the JSON object that contains `"slug": "<slug>"`. */
function objectSpan(text, slug) {
  const at = text.indexOf(`"slug": "${slug}"`);
  if (at < 0) throw new Error(`slug not found: ${slug}`);
  // walk back to the object's opening brace
  let start = at;
  while (start >= 0 && text[start] !== "{") start--;
  // walk forward, brace-counting, string-aware, to the matching close
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error(`unbalanced object for ${slug}`);
  return [start, end];
}

/** Serialize an object at a given base indent (spaces), compact option leaves. */
function serializeObject(obj, baseIndent) {
  const body = JSON.stringify(obj, null, 2)
    .replace(
      /\{\s*\n\s*"label": (.+?)(?:,\s*\n\s*"emoji": (.+?))?(?:,\s*\n\s*"correct": (.+?))?\s*\n\s*\}/g,
      (m, label, emoji, correct) => {
        const parts = [`"label": ${label}`];
        if (emoji !== undefined) parts.push(`"emoji": ${emoji}`);
        if (correct !== undefined) parts.push(`"correct": ${correct}`);
        return `{ ${parts.join(", ")} }`;
      },
    );
  // re-indent every line after the first by baseIndent
  const pad = " ".repeat(baseIndent);
  return body
    .split("\n")
    .map((line, i) => (i === 0 ? line : pad + line))
    .join("\n");
}

for (const [file, slugs] of Object.entries(TARGETS)) {
  let text = readFileSync(file, "utf8");
  // process last-to-first so earlier spans stay valid after splicing
  const entries = Object.entries(slugs)
    .map(([slug, o]) => ({ slug, o, at: text.indexOf(`"slug": "${slug}"`) }))
    .sort((a, b) => b.at - a.at);

  for (const { slug, o } of entries) {
    const [start, end] = objectSpan(text, slug);
    const ex = JSON.parse(text.slice(start, end));
    if (ex.content.type !== "choice") throw new Error(`${slug} is not choice`);
    const baseIndent = start - text.lastIndexOf("\n", start) - 1;

    const items = ex.content.items.map((it) => {
      const correct = (it.options || []).find((c) => c.correct);
      if (!correct) throw new Error(`${slug}: item has no correct option`);
      const item = { ask: it.prompt, text: correct.label };
      if (correct.emoji) item.emoji = correct.emoji;
      const tip = TIP_OVERRIDES[slug]?.[correct.label] ?? it.hint;
      if (tip) item.tip = tip; // reveal-free clue → parent's nudge
      return item;
    });

    ex.modality = "speech";
    if (o.summary) ex.summary = o.summary;
    ex.content = {
      type: "speech_items",
      ...(o.intro ?? ex.content.intro ? { intro: o.intro ?? ex.content.intro } : {}),
      items,
    };

    text = text.slice(0, start) + serializeObject(ex, baseIndent) + text.slice(end);
    console.log(`✓ ${slug} → speech_items (${items.length} items)`);
  }
  writeFileSync(file, text);
}
console.log("done");
