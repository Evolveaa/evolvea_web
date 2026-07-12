import { getFormatter, getTranslations } from "next-intl/server";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import {
  DomainTile,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconFlame,
  IconPlay,
  ProgressRing,
  Sparkline,
  TrendPill,
} from "@/components/icons";
import {
  buildWeekOverview,
  computeStreak,
  domainStats,
  getActiveChild,
  getActivePlan,
  getExercisesByIds,
  getRecentSessions,
  groupSessionsByDay,
  trickyByExercise,
} from "@/lib/data/parent";
import SessionDetail, { hasSessionDetail } from "@/components/therapist/SessionDetail";
import { getGoals } from "@/lib/data/clinical";
import Link from "next/link";

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

  const [sessions, plan, goals] = await Promise.all([
    getRecentSessions(child.id, 90),
    getActivePlan(child.id),
    getGoals(child.id),
  ]);
  const activeGoals = goals.filter((g) => g.status === "active");
  const exercises = await getExercisesByIds(sessions.map((s) => s.exercise_id));
  const stats = domainStats(sessions, exercises).sort((a, b) => b.sessions - a.sessions);
  const tricky = trickyByExercise(sessions, exercises, 6);
  const planItemByExercise = new Map(
    (plan?.plan_items ?? []).map((pi) => [pi.exercise_id, pi.id]),
  );
  const HISTORY_LIMIT = 15;
  const dayGroups = groupSessionsByDay(sessions.slice(0, HISTORY_LIMIT));
  const moreCount = Math.max(0, sessions.length - HISTORY_LIMIT);
  const streak = computeStreak(sessions);
  const week = buildWeekOverview(plan, sessions);
  const totalMinutes = Math.round(
    sessions.reduce((n, s) => n + (s.duration_seconds ?? 0), 0) / 60,
  );
  const weekPct =
    week.targetTotal > 0 ? Math.round((100 * week.doneTotal) / week.targetTotal) : 0;
  const weekDone = week.targetTotal > 0 && week.doneTotal >= week.targetTotal;
  const weekMsg = weekDone ? t("weekComplete") : week.doneTotal === 0 ? t("weekFresh") : null;

  return (
    <>
      <h1 className="page-h">{t("progressTitle")}</h1>
      <p className="page-sub">{t("progressLead", { name: child.first_name })}</p>

      {/* week hero: ring + key numbers */}
      <section className="hero-day hero-progress" aria-label={t("weekSection")}>
        <ProgressRing
          value={week.doneTotal}
          max={week.targetTotal}
          size={104}
          stroke={10}
          label={week.targetTotal > 0 ? `${weekPct}%` : "—"}
          sub={t("weekRingSub")}
          tone={weekDone ? "good" : "brand"}
        />
        <div className="hero-day-body">
          <p className="hero-day-title">
            {t("weekProgress", { done: week.doneTotal, target: week.targetTotal })}
          </p>
          {weekMsg && <p className="hero-day-sub">{weekMsg}</p>}
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <i className="mini-stat-ico ico-sky" aria-hidden="true">
              <IconPlay size={15} />
            </i>
            <b>{sessions.length}</b>
            <span>{t("statSessions")}</span>
          </div>
          <div className="hero-stat">
            <i className="mini-stat-ico ico-violet" aria-hidden="true">
              <IconClock size={15} />
            </i>
            <b>{totalMinutes}</b>
            <span>{t("statMinutes")}</span>
          </div>
          <div className="hero-stat">
            <i className="mini-stat-ico ico-coral" aria-hidden="true">
              <IconFlame size={15} />
            </i>
            <b>{streak}</b>
            <span>{t("statStreak")}</span>
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
            {activeGoals.length > 0 && (
              <div className="info-card" style={{ marginBottom: "1rem" }}>
                <span className="section-label" style={{ margin: "0 0 0.6rem" }}>
                  {t("goalsSection")}
                </span>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {activeGoals.map((g) => (
                    <li key={g.id} style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: "0.88rem" }}>
                      <DomainTile domain={g.domain} size={26} />
                      <span style={{ flex: 1, minWidth: 0 }}>{g.title}</span>
                    </li>
                  ))}
                </ul>
                <p className="form-hint" style={{ marginTop: "0.6rem" }}>
                  {t("goalsHint")}
                </p>
              </div>
            )}
            {stats.length > 0 && (
              <div>
                <h2 className="section-label">{t("domainsSection")}</h2>
                <ul className="dstat-list">
                  {stats.map((s) => (
                    <li key={s.domain} className="dcard">
                      <div className="dcard-head">
                        <DomainTile domain={s.domain} size={38} />
                        <span className="dcard-id">
                          <span className="dcard-name">{td(s.domain)}</span>
                          <span className="dcard-meta">
                            {t("domainMeta", { count: s.sessions })}
                          </span>
                        </span>
                        <span className="dcard-score">
                          <span
                            className="dcard-pct"
                            data-none={s.avgPct === null ? "" : undefined}
                          >
                            {s.avgPct !== null ? `${s.avgPct}%` : "—"}
                          </span>
                          <TrendPill delta={s.delta} />
                        </span>
                      </div>
                      <span className={`pbar bar-${s.domain}`} aria-hidden="true">
                        {s.avgPct !== null && <i style={{ width: `${s.avgPct}%` }} />}
                      </span>
                      {s.trend.length >= 3 && (
                        <div className="dcard-spark">
                          <span className="dcard-spark-label">{t("trendCaption")}</span>
                          <Sparkline domain={s.domain} values={s.trend} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </aside>

          <div className="dash-main">
            {tricky.length > 0 && (
              <>
                <h2 className="section-label">{t("trickyTitle")}</h2>
                <p className="tricky-lead">{t("trickyLead")}</p>
                <ul className="tx-list">
                  {tricky.map((te) => {
                    const ex = exercises.get(te.exerciseId);
                    if (!ex) return null;
                    const planItemId = planItemByExercise.get(te.exerciseId);
                    const words = te.labels.filter((l) => l.length <= 16).slice(0, 5);
                    return (
                      <li key={te.exerciseId} className="tx-card">
                        <DomainTile domain={ex.domain} size={44} />
                        <div className="tx-body">
                          <div className="tx-title">{ex.title}</div>
                          {words.length > 0 ? (
                            <div className="tx-words">
                              {words.map((w) => (
                                <span key={w} className="tx-word">
                                  {w}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="tx-meta">
                              {td(ex.domain)} · {t("trickyHardCount", { count: te.misses })}
                            </div>
                          )}
                        </div>
                        {planItemId && (
                          <Link href={`/app/exercise/${planItemId}`} className="btn btn-primary btn-sm tx-cta">
                            {t("trickyPractise")}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            <h2 className="section-label">{t("historySection")}</h2>
            <div className="hist-groups">
              {dayGroups.map((g) => (
                <div key={g.dayKey} className="hist-group">
                  <div className="hist-day-label">
                    {g.isToday
                      ? t("histToday")
                      : g.isYesterday
                        ? t("histYesterday")
                        : format.dateTime(new Date(g.sessions[0].started_at), {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                    <span className="n">{t("histCount", { count: g.sessions.length })}</span>
                  </div>
                  <ul className="hist-list">
                    {g.sessions.map((s) => {
                      const ex = exercises.get(s.exercise_id);
                      const scored =
                        !!s.score_total && s.score_total > 0 && s.score_correct !== null;
                      const shared = ex?.modality === "guided";
                      const pct = scored
                        ? Math.round((100 * (s.score_correct ?? 0)) / (s.score_total ?? 1))
                        : null;
                      const expandable = hasSessionDetail(s.detail) || !!s.parent_note;
                      const head = (
                        <>
                          {ex ? (
                            <DomainTile domain={ex.domain} size={30} />
                          ) : (
                            <span className="row-ico" aria-hidden="true" style={{ width: 30, height: 30 }}>
                              <IconCheck size={16} />
                            </span>
                          )}
                          <span className="hist-main">
                            <span className="hist-title">{ex?.title ?? "—"}</span>
                            {shared && <span className="hist-note">{t("histSharedActivity")}</span>}
                          </span>
                          {scored ? (
                            <span className="score-pill" data-tone={scoreTone(pct)}>
                              {s.score_correct}/{s.score_total}
                            </span>
                          ) : (
                            <span className="hist-done">
                              <IconCheck size={13} /> {t("pathDone")}
                            </span>
                          )}
                          {expandable && (
                            <span className="hist-chev" aria-hidden="true">
                              <IconChevronDown size={16} />
                            </span>
                          )}
                        </>
                      );
                      return (
                        <li key={s.id}>
                          {expandable ? (
                            <details className="hist-item" data-shared={shared ? "" : undefined}>
                              <summary>{head}</summary>
                              <div className="hist-detail">
                                {s.parent_note && (
                                  <p className="hist-parent-note">„{s.parent_note}“</p>
                                )}
                                <SessionDetail
                                  detail={s.detail}
                                  scoreCorrect={s.score_correct}
                                  scoreTotal={s.score_total}
                                />
                              </div>
                            </details>
                          ) : (
                            <div className="hist-item" data-shared={shared ? "" : undefined}>
                              <div className="hist-row">{head}</div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {moreCount > 0 && (
              <p className="hist-more">{t("histMore", { count: moreCount })}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
