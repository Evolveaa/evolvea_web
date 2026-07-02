import { getFormatter, getTranslations } from "next-intl/server";
import ExerciseCard from "@/components/app/ExerciseCard";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import {
  buildWeekOverview,
  getActiveChild,
  getActivePlan,
  getRecentSessions,
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

  return (
    <>
      <h1 className="page-h">{t("planTitle")}</h1>
      {!plan ? (
        <div className="empty" style={{ marginTop: "1rem" }}>
          <span className="empty-emoji" aria-hidden="true">🌱</span>
          <b>{t("noPlanTitle")}</b>
          <p>{t("noPlanLead")}</p>
        </div>
      ) : (
        <>
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

          <ul className="row-list">
            {week.all.map((entry) => (
              <li key={entry.item.id}>
                <ExerciseCard
                  exercise={entry.item.exercises}
                  href={`/app/exercise/${entry.item.id}`}
                  done={entry.doneThisWeek}
                  target={entry.target}
                  doneToday={entry.doneToday}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
