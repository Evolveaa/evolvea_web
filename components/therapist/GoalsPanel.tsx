"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { DomainTile } from "@/components/icons";
import { DOMAINS, type ExerciseDomain } from "@/lib/exercises/types";
import {
  createGoalAction,
  deleteGoalAction,
  setGoalStatusAction,
  type ClinicalFormState,
} from "@/lib/therapist/clinical-actions";
import type { GoalRow } from "@/lib/data/clinical";
import TwoStepButton from "@/components/app/TwoStepButton";


const TARGET_OPTIONS = [60, 70, 80, 90];
const SUGGESTION_KEYS = ["s1", "s2"] as const;

export default function GoalsPanel({
  childId,
  goals,
  domainPct,
}: {
  childId: string;
  goals: GoalRow[];
  /** Current 14-day mean success % per domain — computed by the page. */
  domainPct: Partial<Record<ExerciseDomain, number>>;
}) {
  const t = useTranslations("therapist.goals");
  const td = useTranslations("domains");
  const format = useFormatter();

  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<ExerciseDomain>("phonemic_awareness");
  const [title, setTitle] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [rowError, setRowError] = useState(false);
  const [, startTransition] = useTransition();

  const [state, action, pending] = useActionState<ClinicalFormState, FormData>(
    createGoalAction,
    null,
  );

  // successful create → collapse and reset the form for the next goal
  // (render-time adjustment instead of an effect, per React guidance)
  const [seenState, setSeenState] = useState<ClinicalFormState>(null);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) {
      setOpen(false);
      setTitle("");
      setFormKey((k) => k + 1);
    }
  }

  const active = goals.filter((g) => g.status === "active");
  const done = goals.filter((g) => g.status !== "active");

  function runRowAction(build: (fd: FormData) => void, act: typeof deleteGoalAction) {
    setRowError(false);
    startTransition(async () => {
      const fd = new FormData();
      build(fd);
      const res = await act(fd);
      if (res?.error) setRowError(true);
    });
  }

  function setStatus(goalId: string, status: "active" | "achieved" | "archived") {
    runRowAction((fd) => {
      fd.set("goal_id", goalId);
      fd.set("status", status);
    }, setGoalStatusAction);
  }

  function remove(goalId: string) {
    runRowAction((fd) => fd.set("goal_id", goalId), deleteGoalAction);
  }

  function goalMeta(goal: GoalRow): string {
    const current = domainPct[goal.domain];
    const parts: string[] = [];
    if (current !== undefined && goal.target_pct !== null)
      parts.push(t("metaProgress", { current, target: goal.target_pct }));
    else if (current !== undefined) parts.push(t("metaCurrent", { current }));
    else parts.push(t("metaNoData"));
    if (goal.baseline_pct !== null) parts.push(t("metaBaseline", { baseline: goal.baseline_pct }));
    if (goal.target_date)
      parts.push(
        t("metaDate", {
          date: format.dateTime(new Date(`${goal.target_date}T00:00:00`), {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }),
      );
    return parts.join(" · ");
  }

  function GoalBar({ goal }: { goal: GoalRow }) {
    const current = domainPct[goal.domain];
    const base = goal.baseline_pct ?? 0;
    const target = goal.target_pct ?? 100;
    const span = Math.max(1, target - base);
    const progress =
      current === undefined ? 0 : Math.max(0, Math.min(1, (current - base) / span));
    return (
      <span className={`goal-bar bar-${goal.domain}`} aria-hidden="true">
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
        {current !== undefined && <b style={{ left: `${Math.round(progress * 100)}%` }} />}
      </span>
    );
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem" }}>
        <h2 className="section-label" style={{ flex: 1 }}>
          {t("title")}
        </h2>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? t("cancel") : `＋ ${t("add")}`}
        </button>
      </div>

      {rowError && (
        <p className="form-error" role="alert" style={{ marginBottom: "0.7rem" }}>
          {t("errors.unknown")}
        </p>
      )}

      {open && (
        <form key={formKey} action={action} className="card" style={{ marginBottom: "0.9rem" }}>
          <input type="hidden" name="child_id" value={childId} />

          {state?.error && (
            <p className="form-error" role="alert">
              {t(`errors.${state.error}`)}
            </p>
          )}

          <div className="field">
            <label className="label" htmlFor="goal-domain">
              {t("form.domain")}
            </label>
            <select
              className="select"
              id="goal-domain"
              name="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value as ExerciseDomain)}
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {td(d)}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="goal-title">
              {t("form.title")}
            </label>
            <input
              className="input"
              id="goal-title"
              name="title"
              maxLength={300}
              required
              value={title}
              placeholder={t("form.titlePlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.45rem" }}>
              {SUGGESTION_KEYS.map((k) => {
                const text = t(`suggestions.${domain}.${k}`);
                return (
                  <button
                    key={k}
                    type="button"
                    className="chip"
                    aria-pressed={title === text}
                    onClick={() => setTitle(text)}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <div className="field" style={{ flex: "1 1 120px" }}>
              <label className="label" htmlFor="goal-target">
                {t("form.target")}
              </label>
              <select className="select" id="goal-target" name="target_pct" defaultValue="80">
                <option value="">{t("form.targetNone")}</option>
                {TARGET_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} %
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: "1 1 140px" }}>
              <label className="label" htmlFor="goal-date">
                {t("form.targetDate")}
              </label>
              <input className="input" id="goal-date" name="target_date" type="date" />
            </div>
            <div className="field" style={{ flex: "1 1 120px" }}>
              <label className="label" htmlFor="goal-baseline">
                {t("form.baseline")}
              </label>
              <input
                className="input"
                id="goal-baseline"
                name="baseline_pct"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                placeholder="%"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
            {pending ? t("form.saving") : t("form.submit")}
          </button>
        </form>
      )}

      {goals.length === 0 && !open ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            🎯
          </span>
          <b>{t("empty.title")}</b>
          <p>{t("empty.lead")}</p>
        </div>
      ) : (
        <>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {active.map((goal) => (
              <li key={goal.id} className="card" style={{ padding: "0.8rem 0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <DomainTile domain={goal.domain} size={28} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ display: "block", fontSize: "0.9rem" }}>{goal.title}</b>
                    <span style={{ fontSize: "0.76rem", color: "var(--ink-soft)" }}>
                      {goalMeta(goal)}
                    </span>
                  </span>
                </div>
                <div style={{ margin: "0.6rem 0 0.55rem" }}>
                  <GoalBar goal={goal} />
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setStatus(goal.id, "achieved")}
                  >
                    ✓ {t("achieve")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => setStatus(goal.id, "archived")}
                  >
                    {t("archive")}
                  </button>
                  <TwoStepButton
                    label={t("delete")}
                    confirmLabel={t("confirmDelete")}
                    onConfirm={() => remove(goal.id)}
                  />
                </div>
              </li>
            ))}
          </ul>

          {active.length === 0 && goals.length > 0 && (
            <p className="card-sub" style={{ margin: "0.3rem 0 0.6rem" }}>
              {t("noActive")}
            </p>
          )}

          {done.length > 0 && (
            <details style={{ marginTop: "0.7rem" }}>
              <summary
                style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, color: "var(--ink-soft)" }}
              >
                {t("doneGroup", { count: done.length })}
              </summary>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                  marginTop: "0.6rem",
                }}
              >
                {done.map((goal) => (
                  <li
                    key={goal.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      border: "1px solid var(--ink-line)",
                      borderRadius: 12,
                      padding: "0.55rem 0.7rem",
                    }}
                  >
                    <DomainTile domain={goal.domain} size={24} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: "0.86rem" }}>
                      {goal.title}
                      {goal.status === "achieved" && goal.achieved_at && (
                        <span style={{ display: "block", fontSize: "0.72rem", color: "var(--ink-soft)" }}>
                          {t("achievedOn", {
                            date: format.dateTime(new Date(goal.achieved_at), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      )}
                    </span>
                    <span className={`chip chip-hue ${goal.status === "achieved" ? "hue-green" : "hue-navy"}`}>
                      {t(`status.${goal.status === "achieved" ? "achieved" : "archived"}`)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => setStatus(goal.id, "active")}
                    >
                      {t("reactivate")}
                    </button>
                    <TwoStepButton
                      label={t("delete")}
                      confirmLabel={t("confirmDelete")}
                      onConfirm={() => remove(goal.id)}
                    />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}
