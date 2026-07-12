"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createInviteAction, type InviteState } from "@/lib/therapist/actions";

export function CopyButton({ text, label, copied }: { text: string; label: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {done ? copied : label}
    </button>
  );
}

export default function InviteForm() {
  const t = useTranslations("therapist.invites");
  const [state, action, pending] = useActionState<InviteState, FormData>(
    createInviteAction,
    null,
  );
  // lets the therapist mint several codes in a row without a page reload
  const [dismissedCode, setDismissedCode] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 13 }, (_, i) => currentYear - 3 - i);

  if (state?.code && state.code !== dismissedCode) {
    return (
      <div className="card" role="status">
        <h2 className="card-title">{t("createdTitle")}</h2>
        <p className="card-sub">{t("createdLead")}</p>
        <p
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "0.3em",
            textAlign: "center",
            margin: "1.1rem 0",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {state.code}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
          <CopyButton text={state.code} label={t("copy")} copied={t("copied")} />
          <a
            className="btn btn-sm btn-outline"
            href={`mailto:?subject=${encodeURIComponent(t("mailSubject"))}&body=${encodeURIComponent(t("mailBody", { code: state.code }))}`}
          >
            ✉️ {t("sendByMail")}
          </a>
        </div>
        <p className="form-hint" style={{ textAlign: "center", marginTop: "0.9rem" }}>
          {t("createdHint")}
        </p>
        <button
          type="button"
          className="btn btn-outline btn-block"
          style={{ marginTop: "0.6rem" }}
          onClick={() => setDismissedCode(state.code ?? null)}
        >
          ＋ {t("createAnother")}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="card">
      <h2 className="card-title">{t("formTitle")}</h2>
      <p className="card-sub" style={{ marginBottom: "1rem" }}>
        {t("formLead")}
      </p>

      {state?.error && (
        <p className="form-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <div className="field">
        <label className="label" htmlFor="inv-name">
          {t("childName")}
        </label>
        <input className="input" id="inv-name" name="child_first_name" maxLength={60} required />
        <p className="form-hint">{t("childNameHint")}</p>
      </div>
      <div className="field">
        <label className="label" htmlFor="inv-year">
          {t("birthYear")}
        </label>
        <select className="select" id="inv-year" name="child_birth_year" defaultValue="">
          <option value="">{t("birthYearUnset")}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="label" htmlFor="inv-note">
          {t("note")}
        </label>
        <input className="input" id="inv-note" name="note" maxLength={500} placeholder={t("notePlaceholder")} />
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t("creating") : t("create")}
      </button>
    </form>
  );
}
