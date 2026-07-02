"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { saveExerciseAction, type ExerciseFormState } from "@/lib/therapist/actions";
import {
  DOMAINS,
  type ExerciseContent,
  type ExerciseDomain,
  type ExerciseRow,
  tryParseExerciseContent,
} from "@/lib/exercises/types";

type BuilderType = "choice" | "speech_items" | "guided_steps";

interface ChoiceDraft {
  prompt: string;
  hint: string;
  options: { label: string; emoji: string; correct: boolean }[];
}
interface SpeechDraft {
  text: string;
  emoji: string;
  tip: string;
}
interface StepDraft {
  title: string;
  body: string;
  tip: string;
  choices: string;
  fields: { label: string; placeholder: string }[];
}

const EMPTY_CHOICE = (): ChoiceDraft => ({
  prompt: "",
  hint: "",
  options: [
    { label: "", emoji: "", correct: true },
    { label: "", emoji: "", correct: false },
    { label: "", emoji: "", correct: false },
  ],
});
const EMPTY_SPEECH = (): SpeechDraft => ({ text: "", emoji: "", tip: "" });
const EMPTY_STEP = (): StepDraft => ({ title: "", body: "", tip: "", choices: "", fields: [] });

function draftsFromContent(content: ExerciseContent | null): {
  type: BuilderType;
  choice: ChoiceDraft[];
  speech: SpeechDraft[];
  steps: StepDraft[];
  intro: string;
} {
  const base = {
    type: "choice" as BuilderType,
    choice: [EMPTY_CHOICE()],
    speech: [EMPTY_SPEECH()],
    steps: [EMPTY_STEP()],
    intro: "",
  };
  if (!content) return base;
  if (content.type === "choice")
    return {
      ...base,
      type: "choice",
      intro: content.intro ?? "",
      choice: content.items.map((i) => ({
        prompt: i.prompt,
        hint: i.hint ?? "",
        options: i.options.map((o) => ({
          label: o.label,
          emoji: o.emoji ?? "",
          correct: o.correct === true,
        })),
      })),
    };
  if (content.type === "speech_items")
    return {
      ...base,
      type: "speech_items",
      intro: content.intro ?? "",
      speech: content.items.map((i) => ({ text: i.text, emoji: i.emoji ?? "", tip: i.tip ?? "" })),
    };
  if (content.type === "guided_steps")
    return {
      ...base,
      type: "guided_steps",
      intro: content.intro ?? "",
      steps: content.steps.map((s) => ({
        title: s.title,
        body: s.body,
        tip: s.tip ?? "",
        choices: (s.choices ?? []).join(", "),
        fields: (s.fields ?? []).map((f) => ({ label: f.label, placeholder: f.placeholder ?? "" })),
      })),
    };
  return base;
}

/** Form-based authoring for the three most useful task types. */
export default function ExerciseForm({ exercise }: { exercise?: ExerciseRow }) {
  const t = useTranslations("therapist.exerciseForm");
  const td = useTranslations("domains");

  const initial = useMemo(
    () => draftsFromContent(exercise ? tryParseExerciseContent(exercise.content) : null),
    [exercise],
  );

  const [type, setType] = useState<BuilderType>(initial.type);
  const [intro, setIntro] = useState(initial.intro);
  const [choice, setChoice] = useState<ChoiceDraft[]>(initial.choice);
  const [speech, setSpeech] = useState<SpeechDraft[]>(initial.speech);
  const [steps, setSteps] = useState<StepDraft[]>(initial.steps);
  const [state, action, pending] = useActionState<ExerciseFormState, FormData>(
    saveExerciseAction,
    null,
  );

  const content = useMemo(() => {
    const introVal = intro.trim() || undefined;
    if (type === "choice")
      return {
        type,
        intro: introVal,
        items: choice.map((i) => ({
          prompt: i.prompt.trim(),
          hint: i.hint.trim() || undefined,
          options: i.options
            .filter((o) => o.label.trim() !== "")
            .map((o) => ({
              label: o.label.trim(),
              emoji: o.emoji.trim() || undefined,
              correct: o.correct || undefined,
            })),
        })),
      };
    if (type === "speech_items")
      return {
        type,
        intro: introVal,
        items: speech.map((i) => ({
          text: i.text.trim(),
          emoji: i.emoji.trim() || undefined,
          tip: i.tip.trim() || undefined,
        })),
      };
    return {
      type,
      intro: introVal,
      steps: steps.map((s) => ({
        title: s.title.trim(),
        body: s.body.trim(),
        tip: s.tip.trim() || undefined,
        choices: s.choices
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        fields: s.fields
          .filter((f) => f.label.trim() !== "")
          .map((f) => ({ label: f.label.trim(), placeholder: f.placeholder.trim() || undefined })),
      })),
    };
  }, [type, intro, choice, speech, steps]);

  return (
    <form action={action}>
      {exercise && <input type="hidden" name="exercise_id" value={exercise.id} />}
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      {state?.error && (
        <p className="form-error" role="alert">
          {state.error === "content" ? t("contentError") : t(`errors.${state.error}`)}
        </p>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 className="card-title" style={{ marginBottom: "0.8rem" }}>{t("metaSection")}</h2>

        <div className="field">
          <label className="label" htmlFor="ex-title">{t("title")}</label>
          <input className="input" id="ex-title" name="title" defaultValue={exercise?.title ?? ""} maxLength={200} required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.8rem" }}>
          <div className="field">
            <label className="label" htmlFor="ex-domain">{t("domain")}</label>
            <select className="select" id="ex-domain" name="domain" defaultValue={exercise?.domain ?? "vocabulary"}>
              {DOMAINS.map((d: ExerciseDomain) => (
                <option key={d} value={d}>
                  {td(d)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="ex-difficulty">{t("difficulty")}</label>
            <select className="select" id="ex-difficulty" name="difficulty" defaultValue={exercise?.difficulty ?? 1}>
              <option value={1}>★ {t("d1")}</option>
              <option value={2}>★★ {t("d2")}</option>
              <option value={3}>★★★ {t("d3")}</option>
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="ex-agemin">{t("ageMin")}</label>
            <input className="input" id="ex-agemin" name="age_min" type="number" min={3} max={15} defaultValue={exercise?.age_min ?? 5} />
          </div>
          <div className="field">
            <label className="label" htmlFor="ex-agemax">{t("ageMax")}</label>
            <input className="input" id="ex-agemax" name="age_max" type="number" min={3} max={15} defaultValue={exercise?.age_max ?? 10} />
          </div>
          <div className="field">
            <label className="label" htmlFor="ex-duration">{t("duration")}</label>
            <input className="input" id="ex-duration" name="duration_minutes" type="number" min={1} max={60} defaultValue={exercise?.duration_minutes ?? 5} />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="ex-summary">{t("summary")}</label>
          <textarea className="textarea" id="ex-summary" name="summary" rows={2} maxLength={600} defaultValue={exercise?.summary ?? ""} required />
          <p className="form-hint">{t("summaryHint")}</p>
        </div>

        <div className="field">
          <label className="label" htmlFor="ex-guide">{t("parentGuide")}</label>
          <textarea className="textarea" id="ex-guide" name="parent_guide" rows={3} maxLength={2000} defaultValue={exercise?.parent_guide ?? ""} />
          <p className="form-hint">{t("parentGuideHint")}</p>
        </div>

        <div className="field">
          <label className="label" htmlFor="ex-intro">{t("intro")}</label>
          <input className="input" id="ex-intro" value={intro} maxLength={300} onChange={(e) => setIntro(e.target.value)} />
          <p className="form-hint">{t("introHint")}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 className="card-title" style={{ marginBottom: "0.5rem" }}>{t("contentSection")}</h2>

        {!exercise && (
          <div className="role-switch" style={{ gridTemplateColumns: "repeat(3, 1fr)" }} role="group" aria-label={t("typeLabel")}>
            {(["choice", "speech_items", "guided_steps"] as const).map((tt) => (
              <button key={tt} type="button" className="role-opt" aria-pressed={type === tt} onClick={() => setType(tt)}>
                <b>{t(`types.${tt}.name`)}</b>
                <span>{t(`types.${tt}.hint`)}</span>
              </button>
            ))}
          </div>
        )}

        {/* -------- choice editor -------- */}
        {type === "choice" &&
          choice.map((item, i) => (
            <fieldset key={i} style={{ border: "1px solid var(--ink-line)", borderRadius: 12, padding: "0.9rem", marginBottom: "0.8rem" }}>
              <legend style={{ fontSize: "0.8rem", fontWeight: 700, padding: "0 0.4rem" }}>
                {t("itemN", { n: i + 1 })}
              </legend>
              <div className="field">
                <label className="label">{t("choicePrompt")}</label>
                <input
                  className="input"
                  value={item.prompt}
                  maxLength={300}
                  required
                  onChange={(e) =>
                    setChoice((prev) => prev.map((p, j) => (j === i ? { ...p, prompt: e.target.value } : p)))
                  }
                />
              </div>
              {item.options.map((o, k) => (
                <div key={k} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", alignItems: "center" }}>
                  <input
                    className="input"
                    style={{ width: 74, textAlign: "center" }}
                    placeholder="🙂"
                    aria-label={t("optionEmoji")}
                    value={o.emoji}
                    maxLength={4}
                    onChange={(e) =>
                      setChoice((prev) =>
                        prev.map((p, j) =>
                          j === i
                            ? { ...p, options: p.options.map((oo, kk) => (kk === k ? { ...oo, emoji: e.target.value } : oo)) }
                            : p,
                        ),
                      )
                    }
                  />
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder={t("optionLabel")}
                    aria-label={t("optionLabel")}
                    value={o.label}
                    maxLength={60}
                    required={o.correct || k < 2}
                    onChange={(e) =>
                      setChoice((prev) =>
                        prev.map((p, j) =>
                          j === i
                            ? { ...p, options: p.options.map((oo, kk) => (kk === k ? { ...oo, label: e.target.value } : oo)) }
                            : p,
                        ),
                      )
                    }
                  />
                  <label style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", whiteSpace: "nowrap", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name={`correct-${i}`}
                      checked={o.correct}
                      onChange={() =>
                        setChoice((prev) =>
                          prev.map((p, j) =>
                            j === i
                              ? { ...p, options: p.options.map((oo, kk) => ({ ...oo, correct: kk === k })) }
                              : p,
                          ),
                        )
                      }
                      style={{ accentColor: "var(--success-ink)", width: 16, height: 16 }}
                    />
                    {t("correct")}
                  </label>
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {item.options.length < 4 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      setChoice((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, options: [...p.options, { label: "", emoji: "", correct: false }] } : p,
                        ),
                      )
                    }
                  >
                    ＋ {t("addOption")}
                  </button>
                )}
                <input
                  className="input"
                  style={{ flex: 1, minWidth: 180 }}
                  placeholder={t("hintPlaceholder")}
                  aria-label={t("hintPlaceholder")}
                  value={item.hint}
                  maxLength={300}
                  onChange={(e) =>
                    setChoice((prev) => prev.map((p, j) => (j === i ? { ...p, hint: e.target.value } : p)))
                  }
                />
                {choice.length > 1 && (
                  <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setChoice((prev) => prev.filter((_, j) => j !== i))}>
                    {t("removeItem")}
                  </button>
                )}
              </div>
            </fieldset>
          ))}
        {type === "choice" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setChoice((prev) => [...prev, EMPTY_CHOICE()])}>
            ＋ {t("addItem")}
          </button>
        )}

        {/* -------- speech editor -------- */}
        {type === "speech_items" &&
          speech.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              <input
                className="input"
                style={{ width: 74, textAlign: "center" }}
                placeholder="🙂"
                aria-label={t("optionEmoji")}
                value={item.emoji}
                maxLength={4}
                onChange={(e) => setSpeech((prev) => prev.map((p, j) => (j === i ? { ...p, emoji: e.target.value } : p)))}
              />
              <input
                className="input"
                style={{ flex: 2, minWidth: 160 }}
                placeholder={t("speechText")}
                aria-label={t("speechText")}
                value={item.text}
                maxLength={300}
                required
                onChange={(e) => setSpeech((prev) => prev.map((p, j) => (j === i ? { ...p, text: e.target.value } : p)))}
              />
              <input
                className="input"
                style={{ flex: 3, minWidth: 200 }}
                placeholder={t("speechTip")}
                aria-label={t("speechTip")}
                value={item.tip}
                maxLength={300}
                onChange={(e) => setSpeech((prev) => prev.map((p, j) => (j === i ? { ...p, tip: e.target.value } : p)))}
              />
              {speech.length > 1 && (
                <button type="button" className="icon-btn" style={{ color: "var(--danger-ink)" }} aria-label={t("removeItem")} onClick={() => setSpeech((prev) => prev.filter((_, j) => j !== i))}>
                  ✕
                </button>
              )}
            </div>
          ))}
        {type === "speech_items" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSpeech((prev) => [...prev, EMPTY_SPEECH()])}>
            ＋ {t("addItem")}
          </button>
        )}

        {/* -------- guided editor -------- */}
        {type === "guided_steps" &&
          steps.map((step, i) => (
            <fieldset key={i} style={{ border: "1px solid var(--ink-line)", borderRadius: 12, padding: "0.9rem", marginBottom: "0.8rem" }}>
              <legend style={{ fontSize: "0.8rem", fontWeight: 700, padding: "0 0.4rem" }}>
                {t("stepN", { n: i + 1 })}
              </legend>
              <div className="field">
                <label className="label">{t("stepTitle")}</label>
                <input className="input" value={step.title} maxLength={120} required onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, title: e.target.value } : p)))} />
              </div>
              <div className="field">
                <label className="label">{t("stepBody")}</label>
                <textarea className="textarea" rows={3} maxLength={1200} required value={step.body} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, body: e.target.value } : p)))} />
              </div>
              <div className="field">
                <label className="label">{t("stepChoices")}</label>
                <input className="input" placeholder={t("stepChoicesPlaceholder")} value={step.choices} maxLength={300} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, choices: e.target.value } : p)))} />
              </div>
              {step.fields.map((f, k) => (
                <div key={k} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder={t("fieldLabel")}
                    aria-label={t("fieldLabel")}
                    value={f.label}
                    maxLength={200}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, fields: p.fields.map((ff, kk) => (kk === k ? { ...ff, label: e.target.value } : ff)) } : p,
                        ),
                      )
                    }
                  />
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder={t("fieldPlaceholder")}
                    aria-label={t("fieldPlaceholder")}
                    value={f.placeholder}
                    maxLength={200}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((p, j) =>
                          j === i ? { ...p, fields: p.fields.map((ff, kk) => (kk === k ? { ...ff, placeholder: e.target.value } : ff)) } : p,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ color: "var(--danger-ink)" }}
                    aria-label={t("removeItem")}
                    onClick={() =>
                      setSteps((prev) =>
                        prev.map((p, j) => (j === i ? { ...p, fields: p.fields.filter((_, kk) => kk !== k) } : p)),
                      )
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="field">
                <label className="label">{t("stepTip")}</label>
                <input className="input" value={step.tip} maxLength={300} onChange={(e) => setSteps((prev) => prev.map((p, j) => (j === i ? { ...p, tip: e.target.value } : p)))} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() =>
                    setSteps((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, fields: [...p.fields, { label: "", placeholder: "" }] } : p)),
                    )
                  }
                >
                  ＋ {t("addField")}
                </button>
                {steps.length > 1 && (
                  <button type="button" className="btn btn-sm btn-danger-ghost" onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}>
                    {t("removeStep")}
                  </button>
                )}
              </div>
            </fieldset>
          ))}
        {type === "guided_steps" && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setSteps((prev) => [...prev, EMPTY_STEP()])}>
            ＋ {t("addStep")}
          </button>
        )}
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t("saving") : exercise ? t("saveChanges") : t("createExercise")}
      </button>
    </form>
  );
}
