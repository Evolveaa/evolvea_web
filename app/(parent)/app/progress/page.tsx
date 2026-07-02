import { getFormatter, getTranslations } from "next-intl/server";
import RedeemInviteForm from "@/components/app/RedeemInviteForm";
import {
  computeStreak,
  domainStats,
  getActiveChild,
  getExercisesByIds,
  getRecentSessions,
} from "@/lib/data/parent";
import { DOMAIN_META } from "@/lib/exercises/types";

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

  const sessions = await getRecentSessions(child.id, 90);
  const exercises = await getExercisesByIds(sessions.map((s) => s.exercise_id));
  const stats = domainStats(sessions, exercises).sort((a, b) => b.sessions - a.sessions);
  const streak = computeStreak(sessions);
  const totalMinutes = Math.round(
    sessions.reduce((n, s) => n + (s.duration_seconds ?? 0), 0) / 60,
  );

  return (
    <>
      <h1 className="page-h">{t("progressTitle")}</h1>
      <p className="page-sub">{t("progressLead", { name: child.first_name })}</p>

      <div className="stat-grid">
        <div className="stat">
          <b>{sessions.length}</b>
          <span>{t("statSessions")}</span>
        </div>
        <div className="stat">
          <b>{totalMinutes}</b>
          <span>{t("statMinutes")}</span>
        </div>
        <div className="stat">
          <b>🔥 {streak}</b>
          <span>{t("statStreak")}</span>
        </div>
      </div>

      {stats.length > 0 && (
        <>
          <h2 className="section-label">{t("domainsSection")}</h2>
          <div className="card">
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {stats.map((s) => (
                <li key={s.domain}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem", gap: "0.6rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                      <span aria-hidden="true">{DOMAIN_META[s.domain].emoji}</span>{" "}
                      {td(s.domain)}
                    </span>
                    <span className="card-sub">
                      {t("domainMeta", { count: s.sessions })}
                      {s.avgPct !== null ? ` · ${s.avgPct} %` : ""}
                    </span>
                  </div>
                  <div className="pbar" aria-hidden="true">
                    <i style={{ width: `${s.avgPct ?? 12}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <h2 className="section-label">{t("historySection")}</h2>
      {sessions.length === 0 ? (
        <div className="empty">
          <span className="empty-emoji" aria-hidden="true">📈</span>
          <b>{t("noSessionsTitle")}</b>
          <p>{t("noSessionsLead")}</p>
        </div>
      ) : (
        <ul className="row-list">
          {sessions.slice(0, 25).map((s) => {
            const ex = exercises.get(s.exercise_id);
            const meta = ex ? DOMAIN_META[ex.domain] : null;
            return (
              <li key={s.id} className="row-item">
                <span
                  className={`row-ico ${meta ? `hue-${meta.hue}` : ""}`}
                  style={{ background: "var(--chip-bg)" }}
                  aria-hidden="true"
                >
                  {meta?.emoji ?? "✅"}
                </span>
                <span className="row-body">
                  <span className="row-title">{ex?.title ?? "—"}</span>
                  <span className="row-sub">
                    {format.dateTime(new Date(s.started_at), {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.parent_note ? ` · 📝 ${s.parent_note}` : ""}
                  </span>
                </span>
                <span className="row-end">
                  {s.score_total ? (
                    <b style={{ color: "var(--ink)" }}>
                      {s.score_correct}/{s.score_total}
                    </b>
                  ) : (
                    <span aria-hidden="true">✓</span>
                  )}
                  {s.duration_seconds ? (
                    <div>{tc("minutes", { count: Math.max(1, Math.round(s.duration_seconds / 60)) })}</div>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
