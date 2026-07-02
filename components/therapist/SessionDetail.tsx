import { useTranslations } from "next-intl";
import type { Json } from "@/lib/database.types";

const isObj = (v: Json | undefined): v is { [k: string]: Json | undefined } =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const SCORE_ICON: Record<string, string> = { great: "🌟", almost: "🙂", practice: "🌱" };

/**
 * Human rendering of a session's `detail` jsonb — the therapist's window
 * into what actually happened at the table.
 */
export default function SessionDetail({ detail }: { detail: Json | null }) {
  const t = useTranslations("therapist.session");
  if (!isObj(detail)) return null;

  // guided_steps: reflection answers are the payload
  if (Array.isArray(detail.steps)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
        {detail.steps.map((step, i) => {
          if (!isObj(step)) return null;
          const choices = Array.isArray(step.choices) ? step.choices.filter((c) => typeof c === "string") : [];
          const fields = isObj(step.fields) ? Object.entries(step.fields) : [];
          if (choices.length === 0 && fields.length === 0) return null;
          return (
            <div key={i}>
              <b style={{ fontSize: "0.82rem" }}>{typeof step.title === "string" ? step.title : `${i + 1}.`}</b>
              {choices.length > 0 && (
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                  {choices.map((c, j) => (
                    <span key={j} className="chip" style={{ fontSize: "0.72rem" }}>
                      {String(c)}
                    </span>
                  ))}
                </div>
              )}
              {fields.map(([label, value]) => (
                <p key={label} style={{ fontSize: "0.84rem", marginTop: "0.3rem", color: "var(--ink-soft)" }}>
                  <span style={{ fontWeight: 600 }}>{label}:</span>{" "}
                  {typeof value === "string" && value.trim() ? value : "—"}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // per-item lists (choice / sound_boxes / memory / story / speech)
  if (Array.isArray(detail.items)) {
    return (
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {detail.items.map((item, i) => {
          if (!isObj(item)) return null;
          const label =
            (typeof item.prompt === "string" && item.prompt) ||
            (typeof item.word === "string" && item.word) ||
            (typeof item.text === "string" && item.text) ||
            (typeof item.title === "string" && item.title) ||
            `${i + 1}.`;
          const icon =
            typeof item.score === "string"
              ? (SCORE_ICON[item.score] ?? "•")
              : item.firstTry === true
                ? "✅"
                : item.firstTry === false
                  ? "🔁"
                  : "•";
          return (
            <li key={i} style={{ fontSize: "0.84rem", color: "var(--ink-soft)" }}>
              {icon} {label}
              {item.hinted === true ? ` · 💡 ${t("hinted")}` : ""}
            </li>
          );
        })}
      </ul>
    );
  }

  if (typeof detail.moves === "number") {
    return (
      <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)" }}>
        {t("pairsMoves", { moves: detail.moves, pairs: typeof detail.pairs === "number" ? detail.pairs : 0 })}
      </p>
    );
  }

  if (Array.isArray(detail.rounds)) {
    return (
      <p style={{ fontSize: "0.84rem", color: "var(--ink-soft)" }}>
        {detail.rounds
          .map((r, i) =>
            isObj(r) && typeof r.errors === "number"
              ? t("roundErrors", { round: i + 1, errors: r.errors })
              : null,
          )
          .filter(Boolean)
          .join(" · ")}
      </p>
    );
  }

  return null;
}
