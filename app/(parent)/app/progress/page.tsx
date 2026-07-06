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
  trickyItems,
} from "@/lib/data/parent";
import SessionDetail from "@/components/therapist/SessionDetail";

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
  const HISTORY_LIMIT = 15;
  const dayGroups = groupSessionsByDay(sessions.slice(0, HISTORY_LIMIT));
  const moreCount = Math.max(0, sessions.length - HISTORY_LIMIT);
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
                        <DomainTile domain={s.domain} size={38} />
                        <span className="dstat-body">
                          <span className="dstat-top">
                            <span className="dstat-name">{td(s.domain)}</span>
                            <span className="dstat-pct" data-none={s.avgPct === null ? "" : undefined}>
                              {s.avgPct !== null ? `${s.avgPct}%` : "—"}
                            </span>
                          </span>
                          <span className={`pbar bar-${s.domain}`} aria-hidden="true">
                            <i style={{ width: `${s.avgPct ?? 6}%` }} />
                          </span>
                          <span className="dstat-sub">{t("domainMeta", { count: s.sessions })}</span>
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
            <h2 className="section-label">{t("historySection")}</h2>
            <div className="hist-groups">
              {dayGroups.map((g) => (
                <div key={g.dayKey}>
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
                      return (
                        <li key={s.id}>
                          <details className="hist-item" data-shared={shared ? "" : undefined}>
                            <summary>
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
                              <span className="hist-chev" aria-hidden="true">
                                <IconChevronDown size={16} />
                              </span>
                            </summary>
                            <div className="hist-detail">
                              {s.parent_note && (
                                <p className="hist-parent-note">
                                  📝 <i>„{s.parent_note}“</i>
                                </p>
                              )}
                              <SessionDetail
                                detail={s.detail}
                                scoreCorrect={s.score_correct}
                                scoreTotal={s.score_total}
                              />
                            </div>
                          </details>
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
