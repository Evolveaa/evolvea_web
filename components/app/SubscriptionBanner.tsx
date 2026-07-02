import Link from "next/link";
import { useTranslations } from "next-intl";
import type { AccessState } from "@/lib/billing";

/** Trial/expiry callout on the parent home. Renders nothing while active. */
export default function SubscriptionBanner({
  state,
  daysLeft,
}: {
  state: AccessState;
  daysLeft: number;
}) {
  const t = useTranslations("billing");
  if (state === "active" || state === "none") return null;

  if (state === "trial") {
    return (
      <div
        className="card"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.9rem", flexWrap: "wrap", marginBottom: "1.1rem" }}
      >
        <div>
          <b>⏳ {t("trialTitle", { count: daysLeft })}</b>
          <p className="card-sub">{t("trialLead")}</p>
        </div>
        <Link href="/app/checkout" className="btn btn-sm btn-primary">
          {t("activateCta")}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{ borderColor: "rgba(179, 64, 58, 0.35)", marginBottom: "1.1rem" }}
    >
      <b style={{ color: "var(--danger-ink)" }}>
        {state === "expired" ? t("expiredTitle") : t("canceledTitle")}
      </b>
      <p className="card-sub" style={{ margin: "0.3rem 0 0.9rem" }}>
        {t("expiredLead")}
      </p>
      <Link href="/app/checkout" className="btn btn-sm btn-primary">
        {t("activateCta")}
      </Link>
    </div>
  );
}
