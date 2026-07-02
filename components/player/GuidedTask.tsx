"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { GuidedStepsContent } from "@/lib/exercises/types";
import type { TaskProps } from "./shared";

interface StepAnswer {
  choices: string[];
  fields: Record<string, string>;
}

/**
 * Guided parent–child activity: scripted steps with feeling/strategy chips
 * and reflection fields. Answers travel to the therapist in the session.
 */
export default function GuidedTask({ content, onProgress, onFinish }: TaskProps<GuidedStepsContent>) {
  const t = useTranslations("player");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<StepAnswer[]>(
    content.steps.map(() => ({ choices: [], fields: {} })),
  );

  const step = content.steps[index];
  const answer = answers[index];
  const last = index === content.steps.length - 1;

  useEffect(() => {
    onProgress(index, content.steps.length);
  }, [index, content.steps.length, onProgress]);

  function toggleChoice(choice: string) {
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === index
          ? {
              ...a,
              choices: a.choices.includes(choice)
                ? a.choices.filter((c) => c !== choice)
                : [...a.choices, choice],
            }
          : a,
      ),
    );
  }

  function setField(label: string, value: string) {
    setAnswers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, fields: { ...a.fields, [label]: value } } : a)),
    );
  }

  function next() {
    if (!last) {
      setIndex(index + 1);
      return;
    }
    onFinish({
      correct: content.steps.length,
      total: content.steps.length,
      hintsUsed: 0,
      detail: {
        steps: content.steps.map((s, i) => ({
          title: s.title,
          choices: answers[i].choices,
          fields: answers[i].fields,
        })),
      },
    });
  }

  return (
    <>
      <div className="gd-step">
        {step.kicker && <span className="gd-kicker">{step.kicker}</span>}
        <h2 className="gd-title">{step.title}</h2>
        <p className="gd-body">{step.body}</p>

        {step.choices && step.choices.length > 0 && (
          <div className="gd-choices" role="group" aria-label={t("guided.choicesLabel")}>
            {step.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className="gd-choice"
                aria-pressed={answer.choices.includes(choice)}
                onClick={() => toggleChoice(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {step.fields && step.fields.length > 0 && (
          <div className="gd-fields">
            {step.fields.map((field) => (
              <div key={field.label}>
                <label className="label" htmlFor={`gd-${index}-${field.label}`}>
                  {field.label}
                </label>
                <textarea
                  className="textarea"
                  id={`gd-${index}-${field.label}`}
                  rows={2}
                  maxLength={600}
                  placeholder={field.placeholder ?? t("guided.fieldPlaceholder")}
                  value={answer.fields[field.label] ?? ""}
                  onChange={(e) => setField(field.label, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {step.tip && (
          <p className="gd-tip">
            <b>{t("guided.tipLabel")}:</b> {step.tip}
          </p>
        )}
      </div>

      <div className="player-foot">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          {t("back")}
        </button>
        <button type="button" className="btn btn-primary" onClick={next}>
          {last ? t("guided.finish") : t("next")}
        </button>
      </div>
    </>
  );
}
