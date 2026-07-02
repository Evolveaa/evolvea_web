"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { activateSubscriptionAction, type CheckoutState } from "@/lib/parent/actions";

/**
 * Mock payment gateway. Clearly labelled as a test: fields are decorative,
 * no card data leaves the browser, nothing is charged.
 */
export default function CheckoutForm({ childId }: { childId: string }) {
  const t = useTranslations("billing");
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    activateSubscriptionAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="card" role="status" style={{ textAlign: "center" }}>
        <span style={{ fontSize: "2.4rem" }} aria-hidden="true">
          🎉
        </span>
        <h2 className="card-title" style={{ marginTop: "0.5rem" }}>
          {t("successTitle")}
        </h2>
        <p className="card-sub" style={{ marginBottom: "1.1rem" }}>
          {t("successLead")}
        </p>
        <Link href="/app" className="btn btn-primary">
          {t("successCta")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="card">
      <input type="hidden" name="child_id" value={childId} />

      <p className="form-success" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)", borderColor: "rgba(138, 97, 22, 0.25)" }}>
        🧪 {t("testNote")}
      </p>

      {state?.error && (
        <p className="form-error" role="alert">
          {t("payError")}
        </p>
      )}

      <div className="field">
        <label className="label" htmlFor="cc-number">
          {t("cardNumber")}
        </label>
        <input
          className="input"
          id="cc-number"
          inputMode="numeric"
          autoComplete="off"
          defaultValue="4242 4242 4242 4242"
          style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
        <div className="field">
          <label className="label" htmlFor="cc-exp">
            {t("cardExpiry")}
          </label>
          <input className="input" id="cc-exp" autoComplete="off" defaultValue="12/29" />
        </div>
        <div className="field">
          <label className="label" htmlFor="cc-cvc">
            CVC
          </label>
          <input className="input" id="cc-cvc" autoComplete="off" defaultValue="123" />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? t("paying") : t("payCta")}
      </button>
      <p className="form-hint" style={{ textAlign: "center", marginTop: "0.6rem" }}>
        {t("cancelAnytime")}
      </p>
    </form>
  );
}
