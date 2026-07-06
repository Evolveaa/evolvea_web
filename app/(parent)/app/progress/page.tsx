import { getFormatter, getTranslations } from "next-intl/server";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import {
  DomainTile,
  IconCheck,
  IconClock,
  IconFlame,
  IconPlay,
  ProgressRing,
} from "@/components/icons";
import {
  buildWeekOverview,
  computeStreak,
  domainStats,
  getActiveChild,
  getActivePlan,
  getExercisesByIds,
  getRecentSessions,
} from "@/lib/data/parent";

function scoreTone(pct: number | null): "good" | "mid" | "low" | "none" {
  if (pct === null) return "none";
  if (pct >= 80) return "good";
  if (pct >= 50) return "mid";
  return "low";
}

export default async function ProgressPage() {
  const t = await getTranslations("parent");
  const td = await getTranslations("domains");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const { child } = await getActiveChild();

  if (!child) {
    return (
      <>
        <h1 className="page-h">{t("progressTitle")}</h1>
        <RedeemInviteForm />
      </>
    );
  }

  const [sessions, plan] = await Promise.all([
    getRecentSessions(child.id, 90),
    getActivePlan(child.id),
  ]);
  const exercises = await getExercisesByIds(sessions.map((s) => s.exercise_id));
  const stats = domainStats(sessions, exercises).sort((a, b) => b.sessions - a.sessions);
  const streak = computeStreak(sessions);
  const week = buildWeekOverview(plan, sessions);
  const totalMinutes = Math.round(
    sessions.reduce((n, s) => n + (s.duration_seconds ?? 0), 0) / 60,
  );

  return (
    <>
      <h1 className="page-h">{t("progressTitle")}</h1>
      <p className="page-sub">{t("progressLead", { name: child.first_name })}</p>

      {/* week hero: ring + key numbers */}
      <section className="hero-day" aria-label={t("weekSection")}>
        <ProgressRing
          value={week.doneTotal}
          max={week.targetTotal}
          label={
            week.targetTotal > 0
              ? `${Math.round((100 * week.doneTotal) / week.targetTotal)}%`
              : "—"
          }
          sub={t("weekRingSub")}
        />
        <div className="hero-day-body">
          <p className="hero-day-title">
            {t("weekProgress", { done: week.doneTotal, target: week.targetTotal })}
          </p>
          <div className="mini-stats">
            <span className="mini-stat">
              <i className="mini-stat-ico ico-sky" aria-hidden="true">
                <IconPlay size={14} />
              </i>
              <b>{sessions.length}</b> {t("statSessions")}
            </span>
            <span className="mini-stat">
              <i className="mini-stat-ico ico-violet" aria-hidden="true">
                <IconClock size={14} />
              </i>
              <b>{totalMinutes}</b> {t("statMinutes")}
            </span>
            <span className="mini-stat">
              <i className="mini-stat-ico ico-coral" aria-hidden="true">
                <IconFlame size={14} />
              </i>
              <b>{streak}</b> {t("statStreak")}
            </span>
          </div>
        </div>
      </section>

      <div className="dash">
        {stats.length > 0 && (
          <aside className="dash-side">
            <h2 className="section-label">{t("domainsSection")}</h2>
            <div className="card">
              <ul className="dstat-list">
                {stats.map((s) => (
                  <li key={s.domain} className="dstat">
                    <DomainTile domain={s.domain} size={40} />
                    <span className="dstat-body">
                      <span className="dstat-top">
                        <span className="dstat-name">{td(s.domain)}</span>
                        <span className="card-sub">
                          {t("domainMeta", { count: s.sessions })}
                          {s.avgPct !== null ? ` · ${s.avgPct} %` : ""}
                        </span>
                      </span>
                      <span className={`pbar bar-${s.domain}`} aria-hidden="true">
                        <i style={{ width: `${s.avgPct ?? 12}%` }} />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        <div className="dash-main">
          <h2 className="section-label">{t("historySection")}</h2>
          {sessions.length === 0 ? (
            <div className="empty">
              <b>{t("noSessionsTitle")}</b>
              <p>{t("noSessionsLead")}</p>
            </div>
          ) : (
            <ul className="row-list">
              {sessions.slice(0, 25).map((s) => {
                const ex = exercises.get(s.exercise_id);
                const pct =
                  s.score_total && s.score_total > 0 && s.score_correct !== null
                    ? Math.round((100 * s.score_correct) / s.score_total)
                    : null;
                return (
                  <li key={s.id} className="row-item">
                    {ex ? (
                      <DomainTile domain={ex.domain} size={44} />
                    ) : (
                      <span className="row-ico" aria-hidden="true">
                        <IconCheck size={18} />
                      </span>
                    )}
                    <span className="row-body">
                      <span className="row-title">{ex?.title ?? "—"}</span>
                      <span className="row-sub">
                        {format.dateTime(new Date(s.started_at), {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {s.duration_seconds
                          ? ` · ${tc("minutes", { count: Math.max(1, Math.round(s.duration_seconds / 60)) })}`
                          : ""}
                        {s.parent_note ? ` · „${s.parent_note}“` : ""}
                      </span>
                    </span>
                    <span className="score-pill" data-tone={scoreTone(pct)}>
                      {pct !== null ? (
                        `${s.score_correct}/${s.score_total}`
                      ) : (
                        <>
                          <IconCheck size={12} /> {t("pathDone")}
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
