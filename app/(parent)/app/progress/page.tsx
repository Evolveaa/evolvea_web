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
  summarizeByExercise,
  trickyItems,
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
  const tricky = trickyItems(sessions, exercises, 6);
  const summaries = summarizeByExercise(sessions);
  const exSummaries = summaries.filter((s) => exercises.get(s.exerciseId)?.modality !== "guided");
  const sharedSummaries = summaries.filter((s) => exercises.get(s.exerciseId)?.modality === "guided");
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

      {sessions.length === 0 ? (
        <div className="empty">
          <b>{t("noSessionsTitle")}</b>
          <p>{t("noSessionsLead")}</p>
        </div>
      ) : (
        <div className="dash">
          <aside className="dash-side">
            {stats.length > 0 && (
              <div>
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
              </div>
            )}

            {tricky.length > 0 && (
              <div>
                <h2 className="section-label">{t("trickyTitle")}</h2>
                <div className="card">
                  <p className="card-sub" style={{ marginBottom: "0.85rem" }}>{t("trickyLead")}</p>
                  <ul className="tricky-list">
                    {tricky.map((it) => (
                      <li key={`${it.kind}:${it.label}`} className="tricky-row">
                        {it.domain ? (
                          <DomainTile domain={it.domain} size={26} />
                        ) : (
                          <span style={{ width: 26 }} aria-hidden="true" />
                        )}
                        <span className="tricky-label" title={it.label}>
                          {it.label}
                        </span>
                        <span className="tricky-count">{t("trickyMisses", { count: it.misses })}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </aside>

          <div className="dash-main">
            {exSummaries.length > 0 && (
              <>
                <h2 className="section-label">{t("exercisesSection")}</h2>
                <ul className="hist-list">
                  {exSummaries.map((sm) => {
                    const ex = exercises.get(sm.exerciseId);
                    const scored =
                      !!sm.latestTotal && sm.latestTotal > 0 && sm.latestCorrect !== null;
                    const pct = scored
                      ? Math.round((100 * (sm.latestCorrect ?? 0)) / (sm.latestTotal ?? 1))
                      : null;
                    return (
                      <li key={sm.exerciseId} className="hist-row">
                        {ex ? (
                          <DomainTile domain={ex.domain} size={34} />
                        ) : (
                          <span className="row-ico" aria-hidden="true" style={{ width: 34, height: 34 }}>
                            <IconCheck size={16} />
                          </span>
                        )}
                        <span className="hist-main">
                          <span className="hist-title">{ex?.title ?? "—"}</span>
                          <span className="hist-note">
                            {t("exMeta", {
                              count: sm.count,
                              date: format.dateTime(new Date(sm.lastAt), { day: "numeric", month: "long" }),
                            })}
                          </span>
                        </span>
                        {sm.trend === "up" && (
                          <span className="ex-trend" title={t("exImproving")} aria-label={t("exImproving")}>
                            ↑
                          </span>
                        )}
                        {scored ? (
                          <span className="score-pill" data-tone={scoreTone(pct)}>
                            {sm.latestCorrect}/{sm.latestTotal}
                          </span>
                        ) : (
                          <span className="hist-done">
                            <IconCheck size={13} /> {t("pathDone")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {sharedSummaries.length > 0 && (
              <>
                <h2 className="section-label">{t("sharedSection")}</h2>
                <ul className="hist-list">
                  {sharedSummaries.map((sm) => {
                    const ex = exercises.get(sm.exerciseId);
                    return (
                      <li key={sm.exerciseId} className="hist-row" data-shared="">
                        {ex ? (
                          <DomainTile domain={ex.domain} size={34} />
                        ) : (
                          <span className="row-ico" aria-hidden="true" style={{ width: 34, height: 34 }}>
                            <IconCheck size={16} />
                          </span>
                        )}
                        <span className="hist-main">
                          <span className="hist-title">{ex?.title ?? "—"}</span>
                          <span className="hist-note">
                            {t("exMeta", {
                              count: sm.count,
                              date: format.dateTime(new Date(sm.lastAt), { day: "numeric", month: "long" }),
                            })}
                          </span>
                        </span>
                        <span className="hist-done">
                          <IconCheck size={13} /> {t("pathDone")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
