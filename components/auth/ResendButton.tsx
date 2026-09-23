"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { resendConfirmationAction, type AuthState } from "@/lib/auth/actions";

/** Small standalone form that re-sends the confirmation e-mail. */
export default function ResendButton({ email }: { email: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resendConfirmationAction,
    null,
  );

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      {state?.resent && <p className="form-success">{t("resent")}</p>}
      {state?.error && (
        <p className="form-error">{t(`errors.${state.error}`)}</p>
      )}
      <button type="submit" className="btn btn-outline btn-block" disabled={pending}>
        {pending ? t("sending") : t("resend")}
      </button>
    </form>
  );
}
