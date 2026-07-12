"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  updatePasswordAction,
  type UpdatePasswordState,
} from "@/lib/auth/reset-actions";

export default function ResetPasswordForm() {
  const t = useTranslations("auth.reset");
  const [state, action, pending] = useActionState<UpdatePasswordState, FormData>(
    updatePasswordAction,
    null,
  );

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("newTitle")}</h1>
      <p className="auth-lead">{t("newLead")}</p>

      {state?.error && (
        <p className="form-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <form action={action}>
        <div className="field">
          <label className="label" htmlFor="password">
            {t("newPassword")}
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="form-hint">{t("passwordHint")}</p>
        </div>
        <div className="field">
          <label className="label" htmlFor="confirm">
            {t("confirmPassword")}
          </label>
          <input
            className="input"
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t("saving") : t("save")}
        </button>
      </form>
    </div>
  );
}
