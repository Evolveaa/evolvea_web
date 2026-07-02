#!/usr/bin/env node
/**
 * Verifies that en.json and de.json mirror sk.json key-for-key
 * (sk is the source of truth) and that ICU placeholders match.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "messages");
const load = (l) => JSON.parse(readFileSync(join(DIR, `${l}.json`), "utf8"));

function flat(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) flat(v, key, out);
    else out.set(key, String(v));
  }
  return out;
}

// Real ICU arguments only: `{name}` or `{name, plural…}` — not branch bodies
// like `{Začnite dnes}` where the word is followed by more text.
const placeholders = (s) =>
  [...s.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]).sort().join(",");

const sk = flat(load("sk"));
let failed = false;

for (const locale of ["en", "de"]) {
  const other = flat(load(locale));
  const missing = [...sk.keys()].filter((k) => !other.has(k));
  const extra = [...other.keys()].filter((k) => !sk.has(k));
  const phMismatch = [...sk.keys()].filter(
    (k) => other.has(k) && placeholders(sk.get(k)) !== placeholders(other.get(k)),
  );
  const untranslated = [...sk.keys()].filter(
    (k) => other.has(k) && other.get(k) === sk.get(k) && sk.get(k).length > 25,
  );

  console.log(`── ${locale}.json ──`);
  console.log(`keys: ${other.size} (sk: ${sk.size})`);
  if (missing.length) {
    failed = true;
    console.log(`MISSING (${missing.length}):\n  ${missing.join("\n  ")}`);
  }
  if (extra.length) {
    failed = true;
    console.log(`EXTRA (${extra.length}):\n  ${extra.join("\n  ")}`);
  }
  if (phMismatch.length) {
    failed = true;
    console.log(`PLACEHOLDER MISMATCH (${phMismatch.length}):\n  ${phMismatch.join("\n  ")}`);
  }
  if (untranslated.length)
    console.log(`suspiciously identical to sk (check):\n  ${untranslated.join("\n  ")}`);
  console.log();
}

process.exit(failed ? 1 : 0);
