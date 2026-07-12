"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  requestPasswordResetAction,
  type ResetRequestState,
} from "@/lib/auth/reset-actions";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.reset");
  const [state, action, pending] = useActionState<ResetRequestState, FormData>(
    requestPasswordResetAction,
    null,
  );

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("forgotTitle")}</h1>
      <p className="auth-lead">{t("forgotLead")}</p>

      {state?.sent && (
        <p className="form-success" role="status">
          {t("sentNotice")}
        </p>
      )}
      {state?.error && (
        <p className="form-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <form action={action}>
        <div className="field">
          <label className="label" htmlFor="email">
            {t("email")}
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t("sending") : t("sendLink")}
        </button>
      </form>

      <p className="auth-alt">
        <Link href="/login">{t("backToLogin")}</Link>
      </p>
    </div>
  );
}
