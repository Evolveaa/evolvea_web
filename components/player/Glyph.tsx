import { Fragment } from "react";
import { GLYPH_SET } from "./glyph-set";

/**
 * Render a concept as its custom "editorial line" illustration, or gracefully
 * fall back to the raw emoji when it hasn't been drawn yet. The registry values
 * are trusted, static, hand-authored SVG markup (see glyph-set.ts) — never user
 * input — so injecting them as inner SVG is safe.
 *
 * A value may hold MORE THAN ONE emoji — a little "scene" like 🐶🌳⚽ ("say what
 * is happening"). Those are split into their component glyphs and composed into
 * a row, so a describe-the-picture prompt reads as a designed illustration
 * rather than a strip of platform emoji.
 */

// One emoji grapheme cluster: a pictographic base plus any ZWJ-joined parts,
// skin-tone modifiers, variation selectors or keycaps that belong to it.
const CLUSTER_RE =
  /\p{Extended_Pictographic}(?:‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}️⃣])*/gu;

/** Strip variation selectors so "☂️" matches the "☂" registry key. */
function normalize(emoji: string): string {
  return emoji.replace(/️/g, "");
}

/** Split a string into its emoji clusters (["🐶","🌳","⚽"] for "🐶🌳⚽"). */
export function splitEmoji(value: string): string[] {
  return value.match(CLUSTER_RE) ?? [];
}

function lookup(emoji: string): string | undefined {
  return GLYPH_SET[emoji] ?? GLYPH_SET[normalize(emoji)];
}

export function hasGlyph(emoji: string | undefined | null): boolean {
  return !!emoji && !!lookup(emoji);
}

export default function Glyph({
  emoji,
  size = 56,
  className,
  title,
}: {
  emoji: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const parts = splitEmoji(emoji);

  // A composed scene: draw each object as its own glyph, side by side.
  if (parts.length > 1) {
    const partSize = Math.round(
      size * (parts.length === 2 ? 0.86 : parts.length === 3 ? 0.7 : 0.58),
    );
    return (
      <span
        className={["glyph-scene", className].filter(Boolean).join(" ")}
        role="img"
        aria-label={title ?? undefined}
        aria-hidden={title ? undefined : true}
      >
        {parts.map((part, i) => (
          <Glyph key={i} emoji={part} size={partSize} />
        ))}
      </span>
    );
  }

  const art = lookup(emoji);
  if (!art) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.84, lineHeight: 1, display: "inline-block" }}
        role="img"
        aria-label={title}
      >
        {emoji}
      </span>
    );
  }
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: art }}
    />
  );
}

/**
 * Render a run of text that may contain inline emoji (e.g. a counting prompt
 * "🔺🔵🔺 — Koľko je 🔺?"), swapping each emoji for its inline glyph so the
 * sentence stays on the same editorial-line system as the rest of the screen.
 */
export function GlyphText({
  text,
  size = 30,
  className,
}: {
  text: string;
  size?: number;
  className?: string;
}) {
  const tokens: { kind: "text" | "emoji"; value: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(CLUSTER_RE)) {
    if (m.index > last) tokens.push({ kind: "text", value: text.slice(last, m.index) });
    tokens.push({ kind: "emoji", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: "text", value: text.slice(last) });

  return (
    <span className={className}>
      {tokens.map((tk, i) =>
        tk.kind === "text" ? (
          <Fragment key={i}>{tk.value}</Fragment>
        ) : (
          <Glyph key={i} emoji={tk.value} size={size} className="glyph-inline" />
        ),
      )}
    </span>
  );
}
