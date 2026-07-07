import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import CheckoutForm from "@/components/app/CheckoutForm";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import { IconCheck } from "@/components/icons";
import { getActiveChild, getSubscription } from "@/lib/data/parent";
import { accessState, MONTHLY_PRICE_EUR, trialDaysLeft } from "@/lib/billing";

function Benefits({ t }: { t: (k: string) => string }) {
  return (
    <div className="info-card">
      <span className="section-label" style={{ margin: "0 0 0.85rem" }}>
        {t("benefitsTitle")}
      </span>
      <ul className="benefits">
        {["benefit1", "benefit2", "benefit3", "benefit4"].map((k) => (
          <li key={k} className="benefit">
            <span className="benefit-ico" aria-hidden="true">
              <IconCheck size={15} />
            </span>
            {t(k)}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        <div className="pane">
          <div className="card checkout-done">
            <span className="checkout-done-ico" aria-hidden="true">
              <IconCheck size={30} />
            </span>
            <h2 className="card-title" style={{ marginTop: "0.6rem" }}>
              {t("alreadyActiveTitle")}
            </h2>
            <p className="card-sub" style={{ marginBottom: "1.1rem" }}>{t("alreadyActiveLead")}</p>
            <Link href="/app" className="btn btn-primary">
              {t("successCta")}
            </Link>
          </div>
          <aside className="pane-rail">
            <Benefits t={t} />
          </aside>
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

      <div className="pane">
        <div className="col-stack">
          <div className="order-card">
            <div className="order-top">
              <div>
                <h2 className="card-title">Evolvea · {t("planName")}</h2>
                <p className="card-sub">{t("planFor", { name: child.first_name })}</p>
              </div>
              <b className="order-price">
                {format.number(MONTHLY_PRICE_EUR, { style: "currency", currency: "EUR" })}
                <span>{t("perMonth")}</span>
              </b>
            </div>
          </div>
          <CheckoutForm childId={child.id} />
        </div>

        <aside className="pane-rail">
          <Benefits t={t} />
        </aside>
      </div>
    </>
  );
}
