"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cancelSubscriptionAction } from "@/lib/parent/actions";
import type { AccessState } from "@/lib/billing";

/** Subscription status + management on the child settings page. */
export default function SubscriptionManage({
  childId,
  state,
  daysLeft,
}: {
  childId: string;
  state: AccessState;
  daysLeft: number;
}) {
  const t = useTranslations("billing");
  if (state === "none") return null;

  return (
    <div className="card">
      <h2 className="card-title">{t("manageTitle")}</h2>
      <p className="card-sub" style={{ marginBottom: "0.9rem" }}>
        {state === "active" && t("stateActive")}
        {state === "trial" && t("stateTrial", { count: daysLeft })}
        {state === "expired" && t("stateExpired")}
        {state === "canceled" && t("stateCanceled")}
      </p>
      {state === "active" ? (
        <form
          action={cancelSubscriptionAction}
          onSubmit={(e) => {
            if (!window.confirm(t("cancelConfirm"))) e.preventDefault();
          }}
        >
          <input type="hidden" name="child_id" value={childId} />
          <button type="submit" className="btn btn-sm btn-danger-ghost">
            {t("cancelBtn")}
          </button>
        </form>
      ) : (
        <Link href="/app/checkout" className="btn btn-sm btn-primary">
          {t("activateCta")}
        </Link>
      )}
    </div>
  );
}
