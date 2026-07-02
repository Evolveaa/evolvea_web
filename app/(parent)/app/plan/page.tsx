import { getFormatter, getTranslations } from "next-intl/server";
import PlanDomainGroups from "@/components/app/PlanDomainGroups";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import WeekRhythm from "@/components/app/WeekRhythm";
import {
  appWeekdayIndex,
  buildWeekOverview,
  buildWeeklyRhythm,
  getActiveChild,
  getActivePlan,
  getRecentSessions,
  groupEntriesByDomain,
} from "@/lib/data/parent";

export default async function PlanPage() {
  const t = await getTranslations("parent");
  const format = await getFormatter();
  const { child } = await getActiveChild();

  if (!child) {
    return (
      <>
        <h1 className="page-h">{t("planTitle")}</h1>
        <RedeemInviteForm />
      </>
    );
  }

  const [plan, sessions] = await Promise.all([
    getActivePlan(child.id),
    getRecentSessions(child.id),
  ]);
  const week = buildWeekOverview(plan, sessions);

  if (!plan) {
    return (
      <>
        <h1 className="page-h">{t("planTitle")}</h1>
        <div className="empty" style={{ marginTop: "1rem" }}>
          <span className="empty-emoji" aria-hidden="true">🌱</span>
          <b>{t("noPlanTitle")}</b>
          <p>{t("noPlanLead")}</p>
        </div>
      </>
    );
  }

  const rhythm = buildWeeklyRhythm(week.all);
  const groups = groupEntriesByDomain(week.all);
  const pct = week.targetTotal > 0 ? Math.round((100 * week.doneTotal) / week.targetTotal) : 0;

  return (
    <>
      <h1 className="page-h">{t("planTitle")}</h1>
      <p className="page-sub">
        {t("planMeta", {
          title: plan.title,
          date: format.dateTime(new Date(plan.created_at), {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        })}
      </p>

      {plan.note && (
        <div className="card" style={{ marginBottom: "1.2rem" }}>
          <span className="section-label" style={{ margin: 0 }}>
            {t("therapistNote")}
          </span>
          <p style={{ marginTop: "0.4rem", fontSize: "0.95rem", lineHeight: 1.55 }}>
            „{plan.note}“
          </p>
        </div>
      )}

      {/* week summary */}
      <div className="card" style={{ marginBottom: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span className="card-sub">
            {t("weekProgress", { done: week.doneTotal, target: week.targetTotal })}
          </span>
          <b>{pct}%</b>
        </div>
        <div
          className="pbar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={week.targetTotal}
          aria-valuenow={week.doneTotal}
        >
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h2 className="section-label">{t("planRhythmTitle")}</h2>
      <p className="card-sub" style={{ marginBottom: "0.9rem" }}>
        {t("planRhythmLead")}
      </p>
      <WeekRhythm days={rhythm} todayIndex={appWeekdayIndex()} />

      <h2 className="section-label">{t("planGroupsTitle")}</h2>
      <PlanDomainGroups groups={groups} />
    </>
  );
}
