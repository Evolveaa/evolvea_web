import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import MessageThread from "@/components/app/MessageThread";
import SessionDetail from "@/components/therapist/SessionDetail";
import { getSessionProfile } from "@/lib/data/user";
import { getChildSessions, getFamilyChild } from "@/lib/data/therapist";
import { getThread } from "@/lib/data/messages";
import {
  computeStreak,
  domainStats,
  getActivePlan,
  getExercisesByIds,
  getSubscription,
} from "@/lib/data/parent";
import { accessState } from "@/lib/billing";
import { DOMAIN_META } from "@/lib/exercises/types";

const STATE_HUE: Record<string, string> = {
  active: "hue-green",
  trial: "hue-sky",
  expired: "hue-amber",
  canceled: "hue-rose",
  none: "hue-navy",
};

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const t = await getTranslations("therapist");
  const td = await getTranslations("domains");
  const tp = await getTranslations("parent");
  const format = await getFormatter();

  const [session, family] = await Promise.all([getSessionProfile(), getFamilyChild(childId)]);
  if (!session || !family) notFound();
  const { child, parentName } = family;

  const [sessions, plan, sub, thread] = await Promise.all([
    getChildSessions(childId),
    getActivePlan(childId),
    getSubscription(childId),
    getThread(childId),
  ]);

  const exercises = await getExercisesByIds(sessions.map((s) => s.exercise_id));
  const stats = domainStats(sessions, exercises).sort((a, b) => b.sessions - a.sessions);
  const streak = computeStreak(sessions);
  const subState = accessState(sub);
  const scored = sessions.filter((s) => s.score_total && s.score_total > 0);
  const avgPct =
    scored.length > 0
      ? Math.round(
          scored.reduce((n, s) => n + (100 * (s.score_correct ?? 0)) / (s.score_total ?? 1), 0) /
            scored.length,
        )
      : null;
  const hasUnread = thread.some((m) => m.read_at === null && m.sender_id !== session.profile.id);

  return (
    <>
      <p style={{ marginBottom: "0.8rem" }}>
        <Link href="/therapist" style={{ color: "var(--accent-ink)", fontSize: "0.88rem", fontWeight: 600 }}>
          ← {t("backToFamilies")}
        </Link>
      </p>

      <div className="card-head">
        <div>
          <h1 className="page-h">
            <span aria-hidden="true">{child.avatar}</span> {child.first_name}
            {child.birth_year ? ` · ${new Date().getFullYear() - child.birth_year} r.` : ""}
          </h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {t("parentLabel")}: {parentName} ·{" "}
            <span className={`chip chip-hue ${STATE_HUE[subState]}`}>{t(`subState.${subState}`)}</span>
          </p>
        </div>
        <Link href={`/therapist/families/${childId}/plan`} className="btn btn-primary btn-sm">
          {plan ? t("editPlan") : t("createPlan")}
        </Link>
      </div>

      <div className="stat-grid" style={{ margin: "1.1rem 0 1.4rem" }}>
        <div className="stat">
          <b>{sessions.length}</b>
          <span>{t("statSessions90")}</span>
        </div>
        <div className="stat">
          <b>{avgPct !== null ? `${avgPct} %` : "—"}</b>
          <span>{t("statAvg")}</span>
        </div>
        <div className="stat">
          <b>🔥 {streak}</b>
          <span>{tp("statStreak")}</span>
        </div>
        <div className="stat">
          <b>{sessions.reduce((n, s) => n + s.hints_used, 0)}</b>
          <span>{t("statHints")}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.2rem", alignItems: "start" }}>
        <div>
          <h2 className="section-label">{t("planSection")}</h2>
          {!plan ? (
            <div className="empty">
              <span className="empty-emoji" aria-hidden="true">📋</span>
              <b>{t("noPlanTitle")}</b>
              <p>{t("noPlanLead")}</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-head" style={{ marginBottom: "0.6rem" }}>
                <div>
                  <h3 className="card-title">{plan.title}</h3>
                  <p className="card-sub">
                    {t("planSince", {
                      date: format.dateTime(new Date(plan.created_at), { day: "numeric", month: "long" }),
                    })}
                  </p>
                </div>
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {plan.plan_items.map((item) => (
                  <li key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.9rem" }}>
                    <span aria-hidden="true">{DOMAIN_META[item.exercises.domain].emoji}</span>
                    <span style={{ flex: 1 }}>{item.exercises.title}</span>
                    <span className="chip" style={{ fontSize: "0.7rem" }}>
                      {item.times_per_week}×/{t("week")}
                    </span>
                    <span className="chip" style={{ fontSize: "0.7rem" }}>
                      {t(`supportShort.${item.support_level}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="section-label">{t("domainsSection")}</h2>
          {stats.length === 0 ? (
            <p className="card-sub">{t("noDataYet")}</p>
          ) : (
            <div className="card">
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {stats.map((s) => (
                  <li key={s.domain}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                        <span aria-hidden="true">{DOMAIN_META[s.domain].emoji}</span> {td(s.domain)}
                      </span>
                      <span className="card-sub">
                        {tp("domainMeta", { count: s.sessions })}
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
          )}

          <h2 className="section-label">{t("sessionsSection")}</h2>
          {sessions.length === 0 ? (
            <p className="card-sub">{t("noDataYet")}</p>
          ) : (
            <ul className="row-list">
              {sessions.slice(0, 20).map((s) => {
                const ex = exercises.get(s.exercise_id);
                return (
                  <li key={s.id}>
                    <details className="card" style={{ padding: "0.85rem 1rem" }}>
                      <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.7rem", listStyle: "none" }}>
                        <span aria-hidden="true">{ex ? DOMAIN_META[ex.domain].emoji : "✅"}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span className="row-title">{ex?.title ?? "—"}</span>
                          <span className="row-sub" style={{ display: "block" }}>
                            {format.dateTime(new Date(s.started_at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            {" · "}
                            {t(`supportShort.${s.support_level}`)}
                            {s.hints_used > 0 ? ` · 💡 ${s.hints_used}` : ""}
                          </span>
                        </span>
                        <b>{s.score_total ? `${s.score_correct}/${s.score_total}` : "✓"}</b>
                      </summary>
                      <div style={{ marginTop: "0.8rem", borderTop: "1px solid var(--ink-line)", paddingTop: "0.8rem" }}>
                        {s.parent_note && (
                          <p style={{ fontSize: "0.88rem", marginBottom: "0.6rem" }}>
                            📝 <i>„{s.parent_note}“</i>
                          </p>
                        )}
                        <SessionDetail detail={s.detail} />
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="section-label">{t("messagesSection")}</h2>
          <div className="card">
            <MessageThread
              childId={childId}
              myId={session.profile.id}
              messages={thread}
              hasUnread={hasUnread}
            />
          </div>
        </div>
      </div>
    </>
  );
}
