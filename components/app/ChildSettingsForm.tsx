"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  deleteChildAction,
  updateChildAction,
  type ChildUpdateState,
} from "@/lib/parent/actions";
import type { Child } from "@/lib/data/parent";

const AVATARS = ["🦊", "🐻", "🐰", "🦁", "🐸", "🐼", "🦄", "🐯", "🐙", "🦉"];

export default function ChildSettingsForm({ child }: { child: Child }) {
  const t = useTranslations("parent.childForm");
  const [avatar, setAvatar] = useState(child.avatar);
  const [state, action, pending] = useActionState<ChildUpdateState, FormData>(
    updateChildAction,
    null,
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 13 }, (_, i) => currentYear - 3 - i);

  return (
    <>
      <form action={action} className="card">
        <input type="hidden" name="child_id" value={child.id} />
        <input type="hidden" name="avatar" value={avatar} />

        {state?.ok && <p className="form-success">{t("saved")}</p>}
        {state?.error && (
          <p className="form-error" role="alert">
            {t("saveError")}
          </p>
        )}

        <div className="field">
          <span className="label">{t("avatar")}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }} role="group" aria-label={t("avatar")}>
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                aria-pressed={a === avatar}
                style={{
                  width: 48,
                  height: 48,
                  fontSize: "1.5rem",
                  borderRadius: 14,
                  border: a === avatar ? "2px solid var(--accent-ink)" : "2px solid var(--ink-line)",
                  background: a === avatar ? "var(--accent-soft)" : "#fff",
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="first_name">
            {t("firstName")}
          </label>
          <input
            className="input"
            id="first_name"
            name="first_name"
            defaultValue={child.first_name}
            maxLength={60}
            required
          />
          <p className="form-hint">{t("firstNameHint")}</p>
        </div>

        <div className="field">
          <label className="label" htmlFor="birth_year">
            {t("birthYear")}
          </label>
          <select
            className="select"
            id="birth_year"
            name="birth_year"
            defaultValue={child.birth_year ?? ""}
          >
            <option value="">{t("birthYearUnset")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </button>
      </form>

      <form
        action={deleteChildAction}
        onSubmit={(e) => {
          if (!window.confirm(t("deleteConfirm", { name: child.first_name }))) e.preventDefault();
        }}
        className="card"
        style={{ borderColor: "rgba(179, 64, 58, 0.35)" }}
      >
        <input type="hidden" name="child_id" value={child.id} />
        <h2 className="card-title" style={{ color: "var(--danger-ink)" }}>
          {t("dangerTitle")}
        </h2>
        <p className="card-sub" style={{ marginBottom: "0.9rem" }}>
          {t("dangerLead")}
        </p>
        <button type="submit" className="btn btn-sm btn-danger-ghost">
          {t("deleteBtn")}
        </button>
      </form>
    </>
  );
}
