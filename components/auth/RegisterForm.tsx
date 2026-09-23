"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { registerAction, type AuthState } from "@/lib/auth/actions";
import ResendButton from "./ResendButton";

type Role = "parent" | "therapist";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const [role, setRole] = useState<Role>("parent");
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, null);

  if (state?.sentTo && !state.error) {
    return (
      <div className="auth-card" role="status">
        <h1 className="auth-title">{t("checkEmailTitle")}</h1>
        <p className="auth-lead">{t("checkEmailLead", { email: state.sentTo })}</p>
        <ResendButton email={state.sentTo} />
        <p className="auth-alt">
          <Link href="/login">{t("backToLogin")}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("registerTitle")}</h1>
      <p className="auth-lead">{t("registerLead")}</p>

      {state?.error && (
        <p className="form-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}

      <form action={action}>
        <input type="hidden" name="role" value={role} />
        <div className="role-switch" role="group" aria-label={t("roleLabel")}>
          <button
            type="button"
            className="role-opt"
            aria-pressed={role === "parent"}
            onClick={() => setRole("parent")}
          >
            <b>{t("roleParent")}</b>
            <span>{t("roleParentHint")}</span>
          </button>
          <button
            type="button"
            className="role-opt"
            aria-pressed={role === "therapist"}
            onClick={() => setRole("therapist")}
          >
            <b>{t("roleTherapist")}</b>
            <span>{t("roleTherapistHint")}</span>
          </button>
        </div>

        <div className="field">
          <label className="label" htmlFor="full_name">
            {t("fullName")}
          </label>
          <input
            className="input"
            id="full_name"
            name="full_name"
            autoComplete="name"
            maxLength={120}
            required
          />
        </div>
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
        <div className="field">
          <label className="label" htmlFor="password">
            {t("password")}
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
          <label
            style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              name="consent"
              required
              style={{ width: 18, height: 18, marginTop: 3, accentColor: "var(--accent-ink)" }}
            />
            <span style={{ fontSize: "0.84rem", color: "var(--ink-soft)", lineHeight: 1.5 }}>
              {t("consent")}
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? t("creating") : t("createAccount")}
        </button>
      </form>

      <p className="auth-alt">
        {t("haveAccount")} <Link href="/login">{t("goLogin")}</Link>
      </p>
    </div>
  );
}
