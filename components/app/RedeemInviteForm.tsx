"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { redeemInviteAction, type RedeemState } from "@/lib/parent/actions";

/** Parent enters the code from their therapist to link a child. */
export default function RedeemInviteForm({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("parent.redeem");
  const [state, action, pending] = useActionState<RedeemState, FormData>(
    redeemInviteAction,
    null,
  );

  return (
    <form action={action} className={compact ? undefined : "card"}>
      {!compact && (
        <>
          <h2 className="card-title">{t("title")}</h2>
          <p className="card-sub" style={{ marginBottom: "1rem" }}>
            {t("lead")}
          </p>
        </>
      )}
      {state?.error && (
        <p className="form-error" role="alert">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <div className="field">
        <label className="label" htmlFor="invite-code">
          {t("codeLabel")}
        </label>
        <input
          className="input"
          id="invite-code"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCD2345"
          maxLength={12}
          style={{ textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 700 }}
          required
        />
        <p className="form-hint">{t("codeHint")}</p>
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t("linking") : t("link")}
      </button>
    </form>
  );
}
