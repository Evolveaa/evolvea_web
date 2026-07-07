"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DomainTile, IconCheck } from "@/components/icons";
import { completeSessionAction } from "@/lib/parent/actions";
import {
  contentItemCount,
  DOMAIN_META,
  type ExerciseContent,
  type ExerciseRow,
  type SupportLevel,
} from "@/lib/exercises/types";
import type { FinishSummary } from "./shared";
import ChoiceTask from "./ChoiceTask";
import SoundBoxesTask from "./SoundBoxesTask";
import MemorySequenceTask from "./MemorySequenceTask";
import PairsTask from "./PairsTask";
import NumberTrackTask from "./NumberTrackTask";
import StorySequenceTask from "./StorySequenceTask";
import SpeechTask from "./SpeechTask";
import GuidedTask from "./GuidedTask";

/**
 * Every exercise runs inside Mikulajová's metacognitive cycle:
 *   plan (pick a strategy) → monitor (strategy stays visible, hints ask
 *   questions) → evaluate (child self-assesses) → anchor (say one sentence).
 * Guided activities skip the wrapper — they carry their own arc.
 * The child's strategy + self-assessment travel to the therapist, enabling
 * calibration (self-view vs. actual performance).
 */
type Phase = "intro" | "strategy" | "play" | "selfEval" | "done" | "saved";

type SelfEval = "great" | "ok" | "hard";
type Helped = "yes" | "some" | "no";


const SELF_EVAL: { key: SelfEval; emoji: string }[] = [
  { key: "great", emoji: "🌟" },
  { key: "ok", emoji: "🙂" },
  { key: "hard", emoji: "🌱" },
];

const HELPED: { key: Helped; emoji: string }[] = [
  { key: "yes", emoji: "✅" },
  { key: "some", emoji: "🤏" },
  { key: "no", emoji: "❌" },
];

const ANCHOR_COUNT = 5;
const BURST = ["🎉", "⭐", "✨", "🎈", "🌟", "🎊"];

export default function ExercisePlayer({
  exercise,
  content,
  supportLevel,
  childId,
  planItemId,
  mode,
  closeHref,
  speechConsent = false,
}: {
  exercise: ExerciseRow;
  content: ExerciseContent;
  supportLevel: SupportLevel;
  childId?: string;
  planItemId?: string | null;
  mode: "live" | "preview";
  closeHref: string;
  speechConsent?: boolean;
}) {
  const t = useTranslations("player");
  const td = useTranslations("domains");
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState({ current: 0, total: contentItemCount(content) });
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [strategyIdx, setStrategyIdx] = useState<number | null>(null);
  const [selfEval, setSelfEval] = useState<SelfEval | null>(null);
  const [helped, setHelped] = useState<Helped | null>(null);
  const [note, setNote] = useState("");
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const startedAt = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // stable per exercise, varied across the library — and pure (React compiler)
  const anchorIdx =
    (exercise.id.charCodeAt(0) + exercise.id.charCodeAt(6)) % ANCHOR_COUNT;

  const meta = DOMAIN_META[exercise.domain];
  const hintsEnabled = supportLevel >= 2;
  const guided = content.type === "guided_steps";
  const scored = !guided;
  const strategyLabel =
    strategyIdx !== null ? t(`strategy.${content.type}.${strategyIdx}`) : null;

  const onProgress = useCallback(
    (current: number, total: number) => setProgress({ current, total }),
    [],
  );
  const onFinish = useCallback(
    (s: FinishSummary) => {
      setSummary(s);
      setPhase(content.type === "guided_steps" ? "done" : "selfEval");
    },
    [content.type],
  );

  function start() {
    if (guided) {
      startedAt.current = new Date().toISOString();
      setPhase("play");
    } else {
      setPhase("strategy");
    }
  }

  function pickStrategy(i: number) {
    if (strategyIdx !== null) return;
    setStrategyIdx(i);
    timer.current = setTimeout(() => {
      startedAt.current = new Date().toISOString();
      setPhase("play");
    }, 550);
  }

  function pickHelped(h: Helped) {
    if (helped !== null) return;
    setHelped(h);
    timer.current = setTimeout(() => setPhase("done"), 550);
  }

  function quit() {
    if (phase === "play" || phase === "strategy" || phase === "selfEval") {
      setConfirmQuit(true);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    router.push(closeHref);
  }

  function doQuit() {
    setConfirmQuit(false);
    if (timer.current) clearTimeout(timer.current);
    router.push(closeHref);
  }

  const quitModal = confirmQuit ? (
    <div className="pl-modal-overlay" role="dialog" aria-modal="true">
      <div className="pl-modal">
        <p className="pl-modal-title">{t("quitConfirm")}</p>
        <div className="pl-modal-actions">
          <button type="button" className="btn btn-outline btn-block" onClick={() => setConfirmQuit(false)}>
            {t("quitStay")}
          </button>
          <button type="button" className="btn btn-primary btn-block" onClick={doQuit}>
            {t("quitLeave")}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  async function save() {
    if (!summary || !childId) return;
    setSaving(true);
    setSaveError(false);
    const baseDetail =
      summary.detail && typeof summary.detail === "object" && !Array.isArray(summary.detail)
        ? summary.detail
        : {};
    const detail = guided
      ? summary.detail
      : {
          ...baseDetail,
          metacognition: {
            strategy: strategyLabel,
            selfEval,
            strategyHelped: helped,
          },
        };
    const { ok } = await completeSessionAction({
      childId,
      exerciseId: exercise.id,
      planItemId: planItemId ?? null,
      supportLevel,
      startedAt: startedAt.current || new Date().toISOString(),
      scoreCorrect: scored ? summary.correct : null,
      scoreTotal: scored ? summary.total : null,
      hintsUsed: summary.hintsUsed,
      detail,
      parentNote: note,
      speechAttemptIds: summary.speechAttemptIds,
    });
    setSaving(false);
    if (ok) setPhase("saved");
    else setSaveError(true);
  }

  const wrapProps = { className: "player-wrap", "data-hue": meta.hue } as const;

  /* ---------------- intro ---------------- */
  if (phase === "intro") {
    return (
      <div {...wrapProps}>
        <div className="player-top">
          <button type="button" className="player-quit" onClick={quit} aria-label={t("close")}>
            ✕
          </button>
        </div>
        <div className="player-main" style={{ justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
            <DomainTile
              domain={exercise.domain}
              size={72}
              className="intro-tile"
            />
            <span className={`chip chip-hue hue-${meta.hue}`}>{td(exercise.domain)}</span>
            <h1 className="page-h" style={{ marginTop: "0.7rem" }}>
              {exercise.title}
            </h1>
            <p className="page-sub" style={{ marginBottom: 0 }}>
              {"★".repeat(exercise.difficulty)} · {t("aboutMinutes", { count: exercise.duration_minutes })}
            </p>
          </div>

          {content.intro && <p className="player-intro">{content.intro}</p>}

          <div className="card" style={{ marginBottom: "1rem" }}>
            <span className="section-label" style={{ margin: 0 }}>
              {t(`support.${supportLevel}.label`)}
            </span>
            <p className="card-sub" style={{ marginTop: "0.35rem" }}>
              {t(`support.${supportLevel}.hint`)}
            </p>
          </div>

          {supportLevel >= 2 && exercise.parent_guide && (
            <details className="guide-panel" open={supportLevel === 3} style={{ marginTop: 0, marginBottom: "1.4rem" }}>
              <summary>
                🧭 {t("parentGuide")}
                <span className="support-chip">{t(`support.${supportLevel}.label`)}</span>
              </summary>
              <p>{exercise.parent_guide}</p>
            </details>
          )}

          <button type="button" className="btn btn-play btn-block" onClick={start}>
            {t("start")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- strategy (plan) ---------------- */
  if (phase === "strategy") {
    return (
      <div {...wrapProps}>
        <div className="player-top">
          <button type="button" className="player-quit" onClick={quit} aria-label={t("close")}>
            ✕
          </button>
        </div>
        {quitModal}
        <div className="player-main" style={{ justifyContent: "center" }}>
          <p className="player-kicker">{t("strategyKicker")}</p>
          <p className="player-prompt">{t("strategyTitle")}</p>
          <p className="player-intro">{t("strategyLead")}</p>
          <div className="strategy-grid">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                className="opt-card opt-strategy"
                data-state={strategyIdx === i ? "correct" : strategyIdx !== null ? "dim" : undefined}
                onClick={() => pickStrategy(i)}
              >
                <span className="opt-radio" aria-hidden="true">
                  {strategyIdx === i ? <IconCheck size={14} /> : null}
                </span>
                <span>{t(`strategy.${content.type}.${i}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- self-evaluation ---------------- */
  if (phase === "selfEval") {
    return (
      <div {...wrapProps}>
        <div className="player-main" style={{ justifyContent: "center" }}>
          <p className="player-kicker">{t("selfEvalKicker")}</p>
          <p className="player-prompt">{t("selfEvalTitle")}</p>
          <div className="strategy-grid">
            {SELF_EVAL.map((o) => (
              <button
                key={o.key}
                type="button"
                className="opt-card opt-strategy"
                data-state={selfEval === o.key ? "correct" : selfEval !== null ? "dim" : undefined}
                onClick={() => setSelfEval((prev) => prev ?? o.key)}
              >
                <span className="opt-emoji" aria-hidden="true">
                  {o.emoji}
                </span>
                <span>{t(`selfEval.${o.key}`)}</span>
              </button>
            ))}
          </div>

          {selfEval !== null && strategyLabel && (
            <div className="selfeval-followup">
              <p className="player-prompt" style={{ fontSize: "1.15rem", marginTop: "1.6rem" }}>
                {t("helpedTitle", { strategy: strategyLabel })}
              </p>
              <div className="helped-row">
                {HELPED.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className="gd-choice"
                    aria-pressed={helped === o.key}
                    onClick={() => pickHelped(o.key)}
                  >
                    {o.emoji} {t(`helped.${o.key}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- completion ---------------- */
  if (phase === "done" || phase === "saved") {
    // recorded "describe" sessions are scored asynchronously — don't show a
    // provisional 0/N; surface a "sent for assessment" message instead
    const speechPending = !!summary?.speechAttemptIds?.length;
    const pct =
      summary && scored && !speechPending && summary.total > 0
        ? Math.round((100 * summary.correct) / summary.total)
        : null;
    return (
      <div {...wrapProps}>
        <div className="done-wrap">
          <div className="done-burst" aria-hidden="true">
            {BURST.map((b, i) => (
              <span key={i} style={{ ["--i" as string]: i }}>
                {b}
              </span>
            ))}
          </div>
          <span className="done-check" aria-hidden="true">
            ✓
          </span>
          <h1 className="done-h">
            {phase === "saved" ? t("savedTitle") : t("doneTitle")}
          </h1>
          <p className="done-sub">
            {phase === "saved"
              ? t("savedLead")
              : mode === "preview"
                ? t("previewDoneLead")
                : t("doneLead")}
          </p>

          {summary && speechPending && (
            <div className="anchor-box" style={{ marginTop: 0 }}>
              <span className="anchor-label">🎙️ {t("recPendingStat")}</span>
              <p className="anchor-text" style={{ fontStyle: "normal" }}>
                {t("recPendingSub")}
              </p>
            </div>
          )}

          {summary && !speechPending && (
            <div className="done-stats">
              {scored ? (
                <div className="stat">
                  <b>
                    {summary.correct}/{summary.total}
                  </b>
                  <span>{t("statFirstTry")}</span>
                </div>
              ) : (
                <div className="stat">
                  <b>{summary.total}</b>
                  <span>{t("statSteps")}</span>
                </div>
              )}
              {pct !== null && (
                <div className="stat">
                  <b>{pct} %</b>
                  <span>{t("statSuccess")}</span>
                </div>
              )}
              {summary.hintsUsed > 0 && (
                <div className="stat">
                  <b>{summary.hintsUsed}</b>
                  <span>{t("statHints")}</span>
                </div>
              )}
            </div>
          )}

          {phase === "done" && !guided && (
            <div className="anchor-box">
              <span className="anchor-label">{t("anchorLabel")}</span>
              <p className="anchor-text">„{t(`anchors.${anchorIdx}`)}“</p>
            </div>
          )}

          {phase === "done" && mode === "live" && (
            <div style={{ width: "100%", maxWidth: 430 }}>
              <label className="label" htmlFor="parent-note" style={{ textAlign: "left" }}>
                {t("noteLabel")}
              </label>
              <textarea
                className="textarea"
                id="parent-note"
                rows={3}
                maxLength={2000}
                placeholder={t("notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ marginBottom: "0.9rem" }}
              />
              {saveError && <p className="form-error">{t("saveError")}</p>}
              <button type="button" className="btn btn-play btn-block" onClick={save} disabled={saving}>
                {saving ? t("saving") : t("saveAndSend")}
              </button>
            </div>
          )}

          {(phase === "saved" || mode === "preview") && (
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "center" }}>
              <Link href={closeHref} className="btn btn-play">
                {mode === "preview" ? t("closePreview") : t("backHome")}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- play ---------------- */
  const pctBar = progress.total > 0 ? (100 * progress.current) / progress.total : 0;

  return (
    <div {...wrapProps}>
      {quitModal}
      <div className="player-top">
        <button type="button" className="player-quit" onClick={quit} aria-label={t("close")}>
          ✕
        </button>
        <div className="player-progress">
          <div
            className="pbar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.current}
            aria-label={t("progressLabel")}
          >
            <i style={{ width: `${pctBar}%` }} />
          </div>
        </div>
        <span className="player-count">
          {Math.min(progress.current + 1, progress.total)}/{progress.total}
        </span>
      </div>

      {strategyLabel && (
        <p className="myplan-chip">
          {t("myPlan")}: <b>{strategyLabel}</b>
        </p>
      )}

      <div className="player-main">
        {content.type === "choice" && (
          <ChoiceTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}
        {content.type === "sound_boxes" && (
          <SoundBoxesTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}
        {content.type === "memory_sequence" && (
          <MemorySequenceTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}
        {content.type === "pairs" && (
          <PairsTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}
        {content.type === "number_track" && (
          <NumberTrackTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}
        {content.type === "story_sequence" && (
          <StorySequenceTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}
        {content.type === "speech_items" && (
          <SpeechTask
            content={content}
            hintsEnabled={hintsEnabled}
            onProgress={onProgress}
            onFinish={onFinish}
            childId={childId}
            exerciseId={exercise.id}
            speechConsent={speechConsent}
            recordingLive={mode === "live"}
          />
        )}
        {content.type === "guided_steps" && (
          <GuidedTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
        )}

        {supportLevel >= 2 && exercise.parent_guide && !guided && (
          <details className="guide-panel" open={false} style={{ marginTop: "1.6rem" }}>
            <summary>
              🧭 {t("parentGuide")}
              <span className="support-chip">{t(`support.${supportLevel}.label`)}</span>
            </summary>
            <p>{exercise.parent_guide}</p>
          </details>
        )}
      </div>
    </div>
  );
}
