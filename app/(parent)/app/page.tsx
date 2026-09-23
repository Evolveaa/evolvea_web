import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import ChildSwitcher from "@/components/app/ChildSwitcher";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import SubscriptionBanner from "@/components/app/SubscriptionBanner";
import TodayPath from "@/components/app/TodayPath";
import { IconCheck, IconFlame, IconSettings, ProgressRing } from "@/components/icons";
import { accessState, trialDaysLeft } from "@/lib/billing";
import {
  appWeekdayIndex,
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
  const todayIdx = appWeekdayIndex();

  const doneToday = week.all.filter((e) => e.doneToday);
  const todayTotal = doneToday.length + week.today.length;
  const remainingMin = week.today.reduce(
    (n, e) => n + e.item.exercises.duration_minutes,
    0,
  );
  const weekPct =
    week.targetTotal > 0 ? Math.round((100 * week.doneTotal) / week.targetTotal) : 0;

  return (
    <>
      <ChildSwitcher kids={children} activeId={child.id} />

      <SubscriptionBanner
        state={subState}
        daysLeft={sub && subState === "trial" ? trialDaysLeft(sub) : 0}
      />

      <div className="page-head" style={{ marginBottom: "var(--sp-4)" }}>
        <div>
          <h1 className="page-h">
            {t("homeTitle", { name: child.first_name })}{" "}
            <span aria-hidden="true">{child.avatar}</span>
          </h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link href="/app/child" className="icon-btn" aria-label={t("childSettings")}>
          <IconSettings size={20} />
        </Link>
      </div>

      {!plan ? (
        <div className="empty">
          <b>{t("noPlanTitle")}</b>
          <p>{t("noPlanLead")}</p>
        </div>
      ) : (
        <div className="dash">
          <div className="dash-main">
            {todayTotal > 0 && (
              <section className="hero-day" aria-label={t("heroTitle")}>
                <ProgressRing
                  value={doneToday.length}
                  max={todayTotal}
                  label={`${doneToday.length}/${todayTotal}`}
                  sub={t("todayRingSub")}
                />
                <div className="hero-day-body">
                  <p className="hero-day-title">{t("heroTitle")}</p>
                  <p className="hero-day-sub">
                    {week.today.length === 0
                      ? t("heroAllDone")
                      : t("heroLeft", { count: week.today.length, min: remainingMin })}
                  </p>
                  <span className="streak-chip">
                    <IconFlame size={14} />
                    {t("streak", { count: streak })}
                  </span>
                </div>
              </section>
            )}

            <h2 className="section-label">{t("todaySection")}</h2>
            {/* a plan whose items are all hidden (deactivated custom exercises)
                must not celebrate a "completed week" */}
            {week.all.length > 0 && <TodayPath done={doneToday} queue={week.today} />}
          </div>

          <aside className="dash-side">
            <div className="info-card">
              <span className="section-label" style={{ margin: "0 0 0.75rem" }}>
                {t("weekSection")}
              </span>
              <div className="plan-week">
                <span className="plan-week-top">
                  <b>{t("weekProgress", { done: week.doneTotal, target: week.targetTotal })}</b>
                  <span className="plan-week-pct">{weekPct}%</span>
                </span>
                <span className="pbar" aria-hidden="true">
                  <i style={{ width: `${Math.max(weekPct, 2)}%` }} />
                </span>
              </div>
              <div className="week-pills" role="img" aria-label={t("weekDaysLabel")} style={{ marginTop: "0.9rem" }}>
                {days.map((done, i) => (
                  <span
                    key={i}
                    className="week-pill"
                    data-done={done ? "" : undefined}
                    data-today={i === todayIdx ? "" : undefined}
                  >
                    <IconCheck size={12} />
                    {dayLabels[i]}
                  </span>
                ))}
              </div>
            </div>

            {plan.note && (
              <div>
                <h2 className="section-label">{t("therapistNote")}</h2>
                <div className="note-quote">
                  <p>„{plan.note}“</p>
                </div>
              </div>
            )}
            <Link href="/app/plan" className="center-link">
              {t("seeWholePlan")} →
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
