"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type AuthState } from "@/lib/auth/actions";
import ResendButton from "./ResendButton";

export default function LoginForm({
  next,
  calloutError,
  confirmNotice,
}: {
  next?: string;
  calloutError?: boolean;
  confirmNotice?: boolean;
}) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("loginTitle")}</h1>
      <p className="auth-lead">{t("loginLead")}</p>

      {confirmNotice && !state && (
        <p className="form-success" role="status">
          {t("confirmNotice")}
        </p>
      )}
      {calloutError && !confirmNotice && !state && (
        <p className="form-error" role="alert">
          {t("errors.callback")}
        </p>
      )}
      {state?.error && (
        <p className="form-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <form action={action}>
        {next && <input type="hidden" name="next" value={next} />}
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
            defaultValue={state?.values?.email}
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            {t("password")}
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <p className="form-hint" style={{ textAlign: "right", marginTop: "0.35rem" }}>
            <Link href="/forgot-password">{t("forgotPassword")}</Link>
          </p>
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t("signingIn") : t("signIn")}
        </button>
      </form>

      {state?.error === "unconfirmed" && state.sentTo && (
        <div style={{ marginTop: "0.8rem" }}>
          <ResendButton email={state.sentTo} />
        </div>
      )}

      <p className="auth-alt">
        {t("noAccount")} <Link href="/register">{t("goRegister")}</Link>
      </p>
    </div>
  );
}
