import { useTranslations } from "next-intl";
import type { Json } from "@/lib/database.types";

const isObj = (v: Json | undefined): v is { [k: string]: Json | undefined } =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Whether <SessionDetail> would render anything — so callers can skip offering
 *  an empty expansion for sessions that carry no reviewable detail. */
export function hasSessionDetail(detail: Json | null): boolean {
  if (!isObj(detail)) return false;
  if (isObj(detail.metacognition)) {
    const m = detail.metacognition;
    if (typeof m.strategy === "string" || typeof m.selfEval === "string") return true;
  }
  if (
    Array.isArray(detail.steps) &&
    detail.steps.some(
      (s) =>
        isObj(s) &&
        ((Array.isArray(s.choices) && s.choices.length > 0) ||
          (isObj(s.fields) && Object.keys(s.fields).length > 0)),
    )
  )
    return true;
  if (Array.isArray(detail.items) && detail.items.length > 0) return true;
  if (typeof detail.moves === "number") return true;
  if (Array.isArray(detail.rounds) && detail.rounds.length > 0) return true;
  return false;
}

const SELF_ICON: Record<string, string> = { great: "🌟", ok: "🙂", hard: "🌱" };

/** One per-item status → a tone. "Practice/grow" stays warm, not a failure:
 *  growth framing matters on a screen a parent reads about their kid. */
type Tone = "great" | "ok" | "grow";
function itemTone(it: { [k: string]: Json | undefined }): Tone {
  if (typeof it.score === "string") {
    if (it.score === "great") return "great";
    if (it.score === "almost") return "ok";
    return "grow";
  }
  if (it.firstTry === true) return "great";
  if (it.firstTry === false) return "grow";
  return "ok";
}

/** The child's plan → self-evaluation, plus calibration vs. the real score. */
function Metacognition({
  meta,
  scoreCorrect,
  scoreTotal,
}: {
  meta: { [k: string]: Json | undefined };
  scoreCorrect: number | null;
  scoreTotal: number | null;
}) {
  const t = useTranslations("therapist.session");
  const strategy = typeof meta.strategy === "string" ? meta.strategy : null;
  const selfEval = typeof meta.selfEval === "string" ? meta.selfEval : null;
  const helped = typeof meta.strategyHelped === "string" ? meta.strategyHelped : null;
  if (!strategy && !selfEval) return null;

  let calibration: "ok" | "under" | "over" | null = null;
  if (selfEval && scoreTotal && scoreTotal > 0 && scoreCorrect !== null) {
    const pct = (100 * scoreCorrect) / scoreTotal;
    if (pct >= 80 && selfEval === "hard") calibration = "under";
    else if (pct < 50 && selfEval === "great") calibration = "over";
    else calibration = "ok";
  }

  return (
    <div className="rev-meta">
      <div className="rev-chips">
        {strategy && <span className="rev-chip">🧭 {t("strategyChip", { strategy })}</span>}
        {selfEval && ["great", "ok", "hard"].includes(selfEval) && (
          <span className="rev-chip">
            {SELF_ICON[selfEval]} {t(`selfEval.${selfEval}`)}
          </span>
        )}
        {helped && ["yes", "some", "no"].includes(helped) && (
          <span className="rev-chip">{t(`helped.${helped}`)}</span>
        )}
      </div>
      {calibration && (
        <p className="rev-cal" data-cal={calibration}>
          {t(`calibration.${calibration}`)}
        </p>
      )}
    </div>
  );
}

/**
 * Human rendering of a session's `detail` jsonb — the window into what actually
 * happened at the table, per item, so a parent or therapist can browse mistakes.
 */
export default function SessionDetail({
  detail,
  scoreCorrect = null,
  scoreTotal = null,
}: {
  detail: Json | null;
  scoreCorrect?: number | null;
  scoreTotal?: number | null;
}) {
  const t = useTranslations("therapist.session");
  if (!isObj(detail)) return null;

  const metaBlock = isObj(detail.metacognition) ? (
    <Metacognition
      meta={detail.metacognition}
      scoreCorrect={scoreCorrect}
      scoreTotal={scoreTotal}
    />
  ) : null;

  // recorded "describe the picture" attempts — transcript + LLM concept check
  if (Array.isArray(detail.speech)) {
    return (
      <div className="rev">
        {metaBlock}
        {detail.speech.map((raw, i) => {
          if (!isObj(raw)) return null;
          const prompt = typeof raw.prompt === "string" ? raw.prompt : `${i + 1}.`;
          const status = typeof raw.status === "string" ? raw.status : "pending";
          const transcript = typeof raw.transcript === "string" ? raw.transcript : "";
          const feedback = typeof raw.feedback === "string" ? raw.feedback : "";
          const mentioned = new Set(
            Array.isArray(raw.mentioned) ? raw.mentioned.map(String) : [],
          );
          const expected = Array.isArray(raw.expected) ? raw.expected.map(String) : [];
          return (
            <div className="rev-speech" key={i}>
              <p className="rev-speech-prompt">🖼️ {prompt}</p>
              {status === "done" ? (
                <>
                  {transcript && (
                    <p className="rev-speech-said">
                      <span className="rev-field-k">{t("saidLabel")}</span>„{transcript}“
                    </p>
                  )}
                  {expected.length > 0 && (
                    <>
                      <span className="rev-caption">{t("mentionedLabel")}</span>
                      <ul className="rev-items">
                        {expected.map((c, j) => (
                          <li
                            className="rev-item"
                            data-tone={mentioned.has(c) ? "great" : "grow"}
                            key={j}
                          >
                            <span className="rev-label">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {feedback && <p className="rev-note">💬 {feedback}</p>}
                </>
              ) : status === "failed" ? (
                <p className="rev-note">{t("recFailed")}</p>
              ) : (
                <p className="rev-note">
                  <span className="spinner" /> {t("recPending")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // guided_steps: reflection answers are the payload
  if (Array.isArray(detail.steps)) {
    return (
      <div className="rev">
        {detail.steps.map((step, i) => {
          if (!isObj(step)) return null;
          const choices = Array.isArray(step.choices)
            ? step.choices.filter((c) => typeof c === "string")
            : [];
          const fields = isObj(step.fields) ? Object.entries(step.fields) : [];
          if (choices.length === 0 && fields.length === 0) return null;
          return (
            <div className="rev-step" key={i}>
              <b className="rev-step-title">
                {typeof step.title === "string" ? step.title : `${i + 1}.`}
              </b>
              {choices.length > 0 && (
                <div className="rev-chips">
                  {choices.map((c, j) => (
                    <span key={j} className="rev-chip">
                      {String(c)}
                    </span>
                  ))}
                </div>
              )}
              {fields.map(([label, value]) => (
                <p key={label} className="rev-field">
                  <span className="rev-field-k">{label}</span>
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
      <div className="rev">
        {metaBlock}
        <ul className="rev-items">
          {detail.items.map((item, i) => {
            if (!isObj(item)) return null;
            const label =
              (typeof item.prompt === "string" && item.prompt) ||
              (typeof item.word === "string" && item.word) ||
              (typeof item.text === "string" && item.text) ||
              (typeof item.title === "string" && item.title) ||
              // new task types: sorting / sentence_builder / scene_directions / minimal_pairs
              (typeof item.label === "string" && item.label) ||
              (typeof item.sentence === "string" && item.sentence) ||
              (typeof item.instruction === "string" && item.instruction) ||
              (typeof item.a === "string" && typeof item.b === "string"
                ? `${item.a} – ${item.b}`
                : false) ||
              `${i + 1}.`;
            return (
              <li className="rev-item" data-tone={itemTone(item)} key={i}>
                <span className="rev-label">{label}</span>
                {item.hinted === true && (
                  <span className="rev-hint" title={t("hinted")} aria-label={t("hinted")}>
                    💡
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (typeof detail.moves === "number") {
    return (
      <div className="rev">
        {metaBlock}
        <p className="rev-note">
          {t("pairsMoves", {
            moves: detail.moves,
            pairs: typeof detail.pairs === "number" ? detail.pairs : 0,
          })}
        </p>
      </div>
    );
  }

  if (Array.isArray(detail.rounds)) {
    return (
      <div className="rev">
        {metaBlock}
        <p className="rev-note">
          {detail.rounds
            .map((r, i) =>
              isObj(r) && typeof r.errors === "number"
                ? t("roundErrors", { round: i + 1, errors: r.errors })
                : null,
            )
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    );
  }

  return metaBlock;
}
