import { getFormatter, getTranslations } from "next-intl/server";
import PlanDomainGroups from "@/components/app/PlanDomainGroups";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import WeekRhythm from "@/components/app/WeekRhythm";
import { IconCalendar, IconChevronDown } from "@/components/icons";
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
      <p className="page-sub" style={{ marginBottom: "1rem" }}>
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
        <div className="note-quote">
          <span className="note-quote-label">{t("therapistNote")}</span>
          <p>„{plan.note}“</p>
        </div>
      )}

      {/* compact week status */}
      <div className="plan-week">
        <span className="plan-week-top">
          <b>{t("weekProgress", { done: week.doneTotal, target: week.targetTotal })}</b>
          <span className="plan-week-pct">{pct}%</span>
        </span>
        <span className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={week.targetTotal} aria-valuenow={week.doneTotal}>
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>

      {/* recommended rhythm — tucked away, one tap to open */}
      <details className="section-fold">
        <summary>
          <span className="fold-ico" aria-hidden="true">
            <IconCalendar size={18} />
          </span>
          <span className="fold-body">
            <span className="fold-title">{t("planRhythmTitle")}</span>
            <span className="fold-sub">{t("planRhythmFoldHint")}</span>
          </span>
          <span className="fold-chev" aria-hidden="true">
            <IconChevronDown size={18} />
          </span>
        </summary>
        <div className="fold-content">
          <WeekRhythm days={rhythm} todayIndex={appWeekdayIndex()} />
        </div>
      </details>

      <h2 className="section-label">{t("planGroupsTitle")}</h2>
      <PlanDomainGroups groups={groups} />
    </>
  );
}
