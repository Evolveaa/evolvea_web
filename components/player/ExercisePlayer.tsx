"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { completeSessionAction } from "@/lib/parent/actions";
import { DOMAIN_META, type ExerciseContent, type ExerciseRow, type SupportLevel } from "@/lib/exercises/types";
import type { FinishSummary } from "./shared";
import ChoiceTask from "./ChoiceTask";
import SoundBoxesTask from "./SoundBoxesTask";
import MemorySequenceTask from "./MemorySequenceTask";
import PairsTask from "./PairsTask";
import NumberTrackTask from "./NumberTrackTask";
import StorySequenceTask from "./StorySequenceTask";
import SpeechTask from "./SpeechTask";
import GuidedTask from "./GuidedTask";

type Phase = "intro" | "play" | "done" | "saved";

export default function ExercisePlayer({
  exercise,
  content,
  supportLevel,
  childId,
  planItemId,
  mode,
  closeHref,
}: {
  exercise: ExerciseRow;
  content: ExerciseContent;
  supportLevel: SupportLevel;
  childId?: string;
  planItemId?: string | null;
  mode: "live" | "preview";
  closeHref: string;
}) {
  const t = useTranslations("player");
  const td = useTranslations("domains");
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState({ current: 0, total: 1 });
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const startedAt = useRef<string>("");

  const meta = DOMAIN_META[exercise.domain];
  const hintsEnabled = supportLevel >= 2;
  const guided = content.type === "guided_steps";
  const scored = !guided;

  const onProgress = useCallback(
    (current: number, total: number) => setProgress({ current, total }),
    [],
  );
  const onFinish = useCallback((s: FinishSummary) => {
    setSummary(s);
    setPhase("done");
  }, []);

  function start() {
    startedAt.current = new Date().toISOString();
    setPhase("play");
  }

  function quit() {
    if (phase === "play" && !window.confirm(t("quitConfirm"))) return;
    router.push(closeHref);
  }

  async function save() {
    if (!summary || !childId) return;
    setSaving(true);
    setSaveError(false);
    const { ok } = await completeSessionAction({
      childId,
      exerciseId: exercise.id,
      planItemId: planItemId ?? null,
      supportLevel,
      startedAt: startedAt.current || new Date().toISOString(),
      durationSeconds: startedAt.current
        ? Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000)
        : 0,
      scoreCorrect: scored ? summary.correct : null,
      scoreTotal: scored ? summary.total : null,
      hintsUsed: summary.hintsUsed,
      detail: summary.detail,
      parentNote: note,
    });
    setSaving(false);
    if (ok) setPhase("saved");
    else setSaveError(true);
  }

  /* ---------------- intro ---------------- */
  if (phase === "intro") {
    return (
      <div className="player-wrap">
        <div className="player-top">
          <button type="button" className="player-quit" onClick={quit} aria-label={t("close")}>
            ✕
          </button>
        </div>
        <div className="player-main" style={{ justifyContent: "center" }}>
          <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
            <span className={`row-ico hue-${meta.hue}`} style={{ width: 64, height: 64, fontSize: "2rem", background: "var(--chip-bg)", margin: "0 auto 0.9rem", display: "grid" }} aria-hidden="true">
              {meta.emoji}
            </span>
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

          <button type="button" className="btn btn-primary btn-block" onClick={start}>
            {t("start")}
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- completion ---------------- */
  if (phase === "done" || phase === "saved") {
    const pct =
      summary && scored && summary.total > 0
        ? Math.round((100 * summary.correct) / summary.total)
        : null;
    return (
      <div className="player-wrap">
        <div className="done-wrap">
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

          {summary && (
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
              <button type="button" className="btn btn-primary btn-block" onClick={save} disabled={saving}>
                {saving ? t("saving") : t("saveAndSend")}
              </button>
            </div>
          )}

          {(phase === "saved" || mode === "preview") && (
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "center" }}>
              <Link href={closeHref} className="btn btn-primary">
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
    <div className="player-wrap">
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
          <SpeechTask content={content} hintsEnabled={hintsEnabled} onProgress={onProgress} onFinish={onFinish} />
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
