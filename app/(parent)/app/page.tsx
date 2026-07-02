import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import ChildSwitcher from "@/components/app/ChildSwitcher";
import ExerciseCard from "@/components/app/ExerciseCard";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import SubscriptionBanner from "@/components/app/SubscriptionBanner";
import { accessState, trialDaysLeft } from "@/lib/billing";
import {
  buildWeekOverview,
  computeStreak,
  getActiveChild,
  getActivePlan,
  getRecentSessions,
  getSubscription,
  weekDays,
} from "@/lib/data/parent";

export default async function ParentHomePage() {
  const t = await getTranslations("parent");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const { child, children } = await getActiveChild();

  // Onboarding: no linked child yet.
  if (!child) {
    return (
      <>
        <h1 className="page-h">{t("welcomeTitle")}</h1>
        <p className="page-sub">{t("welcomeLead")}</p>
        <RedeemInviteForm />
      </>
    );
  }

  const [plan, sessions, sub] = await Promise.all([
    getActivePlan(child.id),
    getRecentSessions(child.id),
    getSubscription(child.id),
  ]);
  const subState = accessState(sub);
  const week = buildWeekOverview(plan, sessions);
  const streak = computeStreak(sessions);
  const days = weekDays(sessions);
  const dayLabels = [
    tc("days.mon"),
    tc("days.tue"),
    tc("days.wed"),
    tc("days.thu"),
    tc("days.fri"),
    tc("days.sat"),
    tc("days.sun"),
  ];
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <>
      <ChildSwitcher kids={children} activeId={child.id} />

      <SubscriptionBanner
        state={subState}
        daysLeft={sub && subState === "trial" ? trialDaysLeft(sub) : 0}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 className="page-h">
            {t("homeTitle", { name: child.first_name })}{" "}
            <span aria-hidden="true">{child.avatar}</span>
          </h1>
          <p className="page-sub">
            {format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link href="/app/child" className="icon-btn" aria-label={t("childSettings")}>
          ⚙️
        </Link>
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <b style={{ fontSize: "1.15rem" }}>
            🔥 {t("streak", { count: streak })}
          </b>
          <p className="card-sub">{t("streakHint")}</p>
        </div>
        <div className="streak-row" role="img" aria-label={t("weekDaysLabel")}>
          {days.map((done, i) => (
            <span
              key={i}
              className="streak-day"
              data-done={done ? "" : undefined}
              style={i === todayIdx ? { borderColor: "var(--accent-ink)" } : undefined}
            >
              {dayLabels[i]}
            </span>
          ))}
        </div>
      </div>

      <h2 className="section-label">{t("todaySection")}</h2>

      {!plan ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">🌱</span>
          <b>{t("noPlanTitle")}</b>
          <p>{t("noPlanLead")}</p>
        </div>
      ) : week.today.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">🎉</span>
          <b>{t("allDoneTitle")}</b>
          <p>{t("allDoneLead")}</p>
        </div>
      ) : (
        <ul className="row-list">
          {week.today.map((entry) => (
            <li key={entry.item.id}>
              <ExerciseCard
                exercise={entry.item.exercises}
                href={`/app/exercise/${entry.item.id}`}
                done={entry.doneThisWeek}
                target={entry.target}
              />
            </li>
          ))}
        </ul>
      )}

      {plan && (
        <>
          <h2 className="section-label">{t("weekSection")}</h2>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span className="card-sub">{t("weekProgress", { done: week.doneTotal, target: week.targetTotal })}</span>
              <b>{week.targetTotal > 0 ? Math.round((100 * week.doneTotal) / week.targetTotal) : 0}%</b>
            </div>
            <div className="pbar" role="progressbar" aria-valuemin={0} aria-valuemax={week.targetTotal} aria-valuenow={week.doneTotal}>
              <i style={{ width: `${week.targetTotal > 0 ? (100 * week.doneTotal) / week.targetTotal : 0}%` }} />
            </div>
          </div>

          {plan.note && (
            <>
              <h2 className="section-label">{t("therapistNote")}</h2>
              <div className="card">
                <p className="card-sub" style={{ fontSize: "0.95rem", color: "var(--ink)" }}>
                  „{plan.note}“
                </p>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
