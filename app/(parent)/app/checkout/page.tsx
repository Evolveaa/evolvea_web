import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import CheckoutForm from "@/components/app/CheckoutForm";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import { getActiveChild, getSubscription } from "@/lib/data/parent";
import { accessState, MONTHLY_PRICE_EUR, trialDaysLeft } from "@/lib/billing";

export default async function CheckoutPage() {
  const t = await getTranslations("billing");
  const format = await getFormatter();
  const { child } = await getActiveChild();

  if (!child) {
    return (
      <>
        <h1 className="page-h">{t("checkoutTitle")}</h1>
        <RedeemInviteForm />
      </>
    );
  }

  const sub = await getSubscription(child.id);
  const state = accessState(sub);

  if (state === "active") {
    return (
      <>
        <h1 className="page-h">{t("checkoutTitle")}</h1>
        <div className="card" style={{ textAlign: "center" }}>
          <span style={{ fontSize: "2rem" }} aria-hidden="true">✅</span>
          <h2 className="card-title" style={{ marginTop: "0.4rem" }}>{t("alreadyActiveTitle")}</h2>
          <p className="card-sub" style={{ marginBottom: "1rem" }}>{t("alreadyActiveLead")}</p>
          <Link href="/app" className="btn btn-primary">{t("successCta")}</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-h">{t("checkoutTitle")}</h1>
      <p className="page-sub">
        {state === "trial" && sub
          ? t("checkoutLeadTrial", { count: trialDaysLeft(sub) })
          : t("checkoutLeadExpired")}
      </p>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          <div>
            <h2 className="card-title">Evolvea · {t("planName")}</h2>
            <p className="card-sub">{t("planFor", { name: child.first_name })}</p>
          </div>
          <b style={{ fontSize: "1.5rem", whiteSpace: "nowrap" }}>
            {format.number(MONTHLY_PRICE_EUR, { style: "currency", currency: "EUR" })}{" "}
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--ink-soft)" }}>{t("perMonth")}</span>
          </b>
        </div>
        <ul style={{ listStyle: "none", marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.9rem", color: "var(--ink-soft)" }}>
          <li>✓ {t("benefit1")}</li>
          <li>✓ {t("benefit2")}</li>
          <li>✓ {t("benefit3")}</li>
          <li>✓ {t("benefit4")}</li>
        </ul>
      </div>

      <CheckoutForm childId={child.id} />
    </>
  );
}
