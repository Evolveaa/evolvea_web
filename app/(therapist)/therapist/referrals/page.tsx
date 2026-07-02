import { getFormatter, getTranslations } from "next-intl/server";
import { getSessionProfile } from "@/lib/data/user";
import { getFamilies } from "@/lib/data/therapist";
import {
  accessState,
  COMMISSION_PER_FAMILY_EUR,
  COMMISSION_RATE,
  MONTHLY_PRICE_EUR,
} from "@/lib/billing";

export default async function ReferralsPage() {
  const t = await getTranslations("therapist.referrals");
  const format = await getFormatter();
  const eur = (n: number) => format.number(n, { style: "currency", currency: "EUR" });
  const session = await getSessionProfile();
  if (!session) return null;

  const families = await getFamilies(session.profile.id);
  const byState = {
    active: families.filter((f) => accessState(f.subscription) === "active"),
    trial: families.filter((f) => accessState(f.subscription) === "trial"),
    other: families.filter(
      (f) => !["active", "trial"].includes(accessState(f.subscription)),
    ),
  };
  const monthly = byState.active.length * COMMISSION_PER_FAMILY_EUR;
  const potential = (byState.active.length + byState.trial.length) * COMMISSION_PER_FAMILY_EUR;

  return (
    <>
      <h1 className="page-h">{t("pageTitle")}</h1>
      <p className="page-sub">
        {t("pageLead", {
          price: eur(MONTHLY_PRICE_EUR),
          rate: Math.round(COMMISSION_RATE * 100),
          share: eur(COMMISSION_PER_FAMILY_EUR),
        })}
      </p>

      <div className="stat-grid" style={{ marginBottom: "1.4rem" }}>
        <div className="stat">
          <b>{eur(monthly)}</b>
          <span>{t("statMonthly")}</span>
        </div>
        <div className="stat">
          <b>{byState.active.length}</b>
          <span>{t("statActive")}</span>
        </div>
        <div className="stat">
          <b>{byState.trial.length}</b>
          <span>{t("statTrial")}</span>
        </div>
        <div className="stat">
          <b>{eur(potential)}</b>
          <span>{t("statPotential")}</span>
        </div>
      </div>

      {families.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">🤝</span>
          <b>{t("emptyTitle")}</b>
          <p>{t("emptyLead")}</p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto", padding: "0.4rem 0.6rem" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">{t("colFamily")}</th>
                <th scope="col">{t("colStatus")}</th>
                <th scope="col">{t("colEngagement")}</th>
                <th scope="col" style={{ textAlign: "right" }}>{t("colCommission")}</th>
              </tr>
            </thead>
            <tbody>
              {families.map((f) => {
                const state = accessState(f.subscription);
                return (
                  <tr key={f.child.id}>
                    <td>
                      <span aria-hidden="true">{f.child.avatar}</span> {f.child.first_name}
                      <span style={{ color: "var(--ink-soft)" }}> · {f.parentName}</span>
                    </td>
                    <td>{t(`state.${state}`)}</td>
                    <td>{t("weekSessions", { count: f.sessionsWeek })}</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      <b>{state === "active" ? eur(COMMISSION_PER_FAMILY_EUR) : "—"}</b>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="form-hint" style={{ marginTop: "1rem", maxWidth: "62ch" }}>
        {t("disclaimer")}
      </p>
    </>
  );
}
