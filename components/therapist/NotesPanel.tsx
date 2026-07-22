"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  addNoteAction,
  deleteNoteAction,
  type ClinicalFormState,
} from "@/lib/therapist/clinical-actions";
import type { TherapistNoteRow } from "@/lib/data/clinical";
import TwoStepButton from "@/components/app/TwoStepButton";


export default function NotesPanel({
  childId,
  notes,
  sinceLastNote = null,
}: {
  childId: string;
  notes: TherapistNoteRow[];
  /** Home-practice summary since the newest note — computed by the page. */
  sinceLastNote?: { sessions: number; avgPct: number | null; days: number } | null;
}) {
  const t = useTranslations("therapist.notes");
  const format = useFormatter();

  const [formKey, setFormKey] = useState(0);
  const [rowError, setRowError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const [state, action, pending] = useActionState<ClinicalFormState, FormData>(
    addNoteAction,
    null,
  );

  // successful save → reset the uncontrolled composer for the next note
  // (render-time adjustment instead of an effect, per React guidance)
  const [seenState, setSeenState] = useState<ClinicalFormState>(null);
  if (state !== seenState) {
    setSeenState(state);
    if (state?.ok) setFormKey((k) => k + 1);
  }

  // reverse-chron, grouped by the clinical date (noted_on)
  const groups = useMemo(() => {
    const sorted = [...notes].sort((a, b) =>
      a.noted_on === b.noted_on
        ? a.created_at < b.created_at
          ? 1
          : -1
        : a.noted_on < b.noted_on
          ? 1
          : -1,
    );
    const out: { day: string; notes: TherapistNoteRow[] }[] = [];
    for (const note of sorted) {
      const last = out[out.length - 1];
      if (last && last.day === note.noted_on) last.notes.push(note);
      else out.push({ day: note.noted_on, notes: [note] });
    }
    return out;
  }, [notes]);

  const contextLine =
    sinceLastNote === null
      ? null
      : sinceLastNote.avgPct !== null
        ? t("sinceLast", {
            sessions: sinceLastNote.sessions,
            pct: sinceLastNote.avgPct,
            days: sinceLastNote.days,
          })
        : t("sinceLastNoPct", { sessions: sinceLastNote.sessions, days: sinceLastNote.days });

  // Deň v časovej zóne aplikácie — server (UTC) by okolo polnoci predvyplnil
  // iný dátum než prehliadač logopéda a spôsobil hydration mismatch.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Bratislava" });

  function remove(noteId: string) {
    setRowError(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("note_id", noteId);
      const res = await deleteNoteAction(fd);
      if (res?.error) setRowError(true);
    });
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap" }}>
        <h2 className="section-label" style={{ flex: 1 }}>
          {t("title")}
        </h2>
        <span className="chip" title={t("privateHint")}>
          🔒 {t("privateChip")}
        </span>
      </div>

      {contextLine && (
        <p
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            color: "var(--ink-soft)",
            margin: "0.15rem 0 0.7rem",
          }}
        >
          <span style={{ flex: 1 }}>{contextLine}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(contextLine);
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              } catch {
                /* clipboard unavailable */
              }
            }}
          >
            {copied ? t("copied") : t("copy")}
          </button>
        </p>
      )}

      <form key={formKey} action={action} className="card" style={{ marginBottom: "0.9rem" }}>
        <input type="hidden" name="child_id" value={childId} />

        {state?.error && (
          <p className="form-error" role="alert">
            {t(`errors.${state.error}`)}
          </p>
        )}

        <div className="field">
          <label className="label" htmlFor="note-body">
            {t("composer.label")}
          </label>
          <textarea
            className="textarea"
            id="note-body"
            name="body"
            rows={4}
            maxLength={8000}
            required
            placeholder={t("composer.placeholder")}
          />
        </div>
        <div style={{ display: "flex", gap: "0.7rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="field" style={{ flex: "0 1 170px", marginBottom: 0 }}>
            <label className="label" htmlFor="note-date">
              {t("composer.date")}
            </label>
            <input
              className="input"
              id="note-date"
              name="noted_on"
              type="date"
              defaultValue={today}
              max={today}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: "1 1 auto" }}
            disabled={pending}
          >
            {pending ? t("composer.saving") : t("composer.submit")}
          </button>
        </div>
      </form>

      {rowError && (
        <p className="form-error" role="alert" style={{ marginBottom: "0.7rem" }}>
          {t("errors.unknown")}
        </p>
      )}

      {notes.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">
            📝
          </span>
          <b>{t("empty.title")}</b>
          <p>{t("empty.lead")}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {groups.map((group) => (
            <div key={group.day}>
              <p
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ink-soft)",
                  marginBottom: "0.4rem",
                }}
              >
                {format.dateTime(new Date(`${group.day}T00:00:00`), {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {group.notes.map((note) => (
                  <li key={note.id} className="card" style={{ padding: "0.75rem 0.85rem" }}>
                    <p style={{ whiteSpace: "pre-wrap", fontSize: "0.89rem", lineHeight: 1.55 }}>
                      {note.body}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "0.45rem",
                      }}
                    >
                      <TwoStepButton
                        label={t("delete")}
                        confirmLabel={t("confirmDelete")}
                        onConfirm={() => remove(note.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
