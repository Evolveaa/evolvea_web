import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import MessageThread from "@/components/app/MessageThread";
import SessionDetail, { hasSessionDetail } from "@/components/therapist/SessionDetail";
import GoalsPanel from "@/components/therapist/GoalsPanel";
import NotesPanel from "@/components/therapist/NotesPanel";
import { getSessionProfile } from "@/lib/data/user";
import { getChildSessions, getFamilyChild } from "@/lib/data/therapist";
import { getGoals, getTherapistNotes } from "@/lib/data/clinical";
import { getThread } from "@/lib/data/messages";
import {
  computeStreak,
  domainStats,
  getActivePlan,
  getExercisesByIds,
  getSubscription,
  localDayKey,
  trickyItems,
} from "@/lib/data/parent";
import { accessState } from "@/lib/billing";
import type { ExerciseDomain } from "@/lib/exercises/types";
import {
  DomainTile,
  IconCheck,
  IconChevronDown,
  Sparkline,
  TrendPill,
} from "@/components/icons";

const STATE_HUE: Record<string, string> = {
  active: "hue-green",
  trial: "hue-sky",
  expired: "hue-amber",
  canceled: "hue-rose",
  none: "hue-navy",
};

function scoreTone(pct: number | null): "good" | "mid" | "low" | "none" {
  if (pct === null) return "none";
  if (pct >= 80) return "good";
  if (pct >= 50) return "mid";
  return "low";
}

export default async function FamilyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ history?: string }>;
}) {
  const { childId } = await params;
  const { history } = await searchParams;
  const t = await getTranslations("therapist");
  const tc = await getTranslations("common");
  const td = await getTranslations("domains");
  const tp = await getTranslations("parent");
  const format = await getFormatter();

  const [session, family] = await Promise.all([getSessionProfile(), getFamilyChild(childId)]);
  if (!session || !family) notFound();
  const { child, parentName } = family;

  const [sessions, plan, sub, thread, goals, notes] = await Promise.all([
    getChildSessions(childId),
    getActivePlan(childId),
    getSubscription(childId),
    getThread(childId),
    getGoals(childId),
    getTherapistNotes(childId),
  ]);

  const exercises = await getExercisesByIds(sessions.map((s) => s.exercise_id));

  // current 14-day mean % per domain — feeds goal progress
  const now = new Date();
  const since14 = now.getTime() - 14 * 86_400_000;
  const recent14 = sessions.filter((s) => new Date(s.started_at).getTime() >= since14);
  const domainPct: Partial<Record<ExerciseDomain, number>> = {};
  for (const st of domainStats(recent14, exercises))
    if (st.avgPct !== null) domainPct[st.domain] = st.avgPct;

  // home-practice summary since the newest clinical note (notes are newest-first);
  // noted_on is a YYYY-MM-DD date — compare via the shared app-timezone day key
  const lastNotedOn = notes[0]?.noted_on ?? null;
  let sinceLastNote: { sessions: number; avgPct: number | null; days: number } | null = null;
  if (lastNotedOn) {
    const after = sessions.filter((s) => localDayKey(s.started_at) >= lastNotedOn);
    const scoredAfter = after.filter(
      (s) => s.score_total && s.score_total > 0 && s.score_correct !== null,
    );
    const pct =
      scoredAfter.length > 0
        ? Math.round(
            scoredAfter.reduce(
              (n, s) => n + (100 * (s.score_correct ?? 0)) / (s.score_total ?? 1),
              0,
            ) / scoredAfter.length,
          )
        : null;
    sinceLastNote = {
      sessions: after.length,
      avgPct: pct,
      days: Math.max(
        0,
        Math.floor((now.getTime() - new Date(`${lastNotedOn}T00:00:00`).getTime()) / 86_400_000),
      ),
    };
  }

  const historyCount = Math.min(Math.max(Number.parseInt(history ?? "", 10) || 20, 20), 200);
  const stats = domainStats(sessions, exercises).sort((a, b) => b.sessions - a.sessions);
  const tricky = trickyItems(sessions, exercises);
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
            {child.birth_year
              ? ` · ${tc("ageYears", { age: new Date().getFullYear() - child.birth_year })}`
              : ""}
          </h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {t("parentLabel")}: {parentName} ·{" "}
            <span className={`chip chip-hue ${STATE_HUE[subState]}`}>{t(`subState.${subState}`)}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={`/therapist/families/${childId}/report`} className="btn btn-outline btn-sm">
            🖨️ {t("openReport")}
          </Link>
          <Link href={`/therapist/families/${childId}/plan`} className="btn btn-primary btn-sm">
            {plan ? t("editPlan") : t("createPlan")}
          </Link>
        </div>
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
        <div
          className="stat"
          data-tone={streak === 0 && sessions.length > 0 ? "warn" : undefined}
        >
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
          <GoalsPanel childId={childId} goals={goals} domainPct={domainPct} />

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
                    <DomainTile domain={item.exercises.domain} size={26} />
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
            <ul className="dstat-list">
              {stats.map((s) => (
                <li key={s.domain} className="dcard">
                  <div className="dcard-head">
                    <DomainTile domain={s.domain} size={34} />
                    <span className="dcard-id">
                      <span className="dcard-name">{td(s.domain)}</span>
                      <span className="dcard-meta">{tp("domainMeta", { count: s.sessions })}</span>
                    </span>
                    <span className="dcard-score">
                      <span className="dcard-pct" data-none={s.avgPct === null ? "" : undefined}>
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
                      <span className="dcard-spark-label">{tp("trendCaption")}</span>
                      <Sparkline domain={s.domain} values={s.trend} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2 className="section-label">{t("sessionsSection")}</h2>
          {sessions.length === 0 ? (
            <p className="card-sub">{t("noDataYet")}</p>
          ) : (
            <ul className="hist-list">
              {sessions.slice(0, historyCount).map((s) => {
                const ex = exercises.get(s.exercise_id);
                const scored =
                  !!s.score_total && s.score_total > 0 && s.score_correct !== null;
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
                      <span className="hist-note">
                        {format.dateTime(new Date(s.started_at), {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {t(`supportShort.${s.support_level}`)}
                        {s.hints_used > 0 ? ` · 💡 ${s.hints_used}` : ""}
                      </span>
                    </span>
                    {scored ? (
                      <span className="score-pill" data-tone={scoreTone(pct)}>
                        {s.score_correct}/{s.score_total}
                      </span>
                    ) : (
                      <span className="hist-done">
                        <IconCheck size={13} /> {tp("pathDone")}
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
                      <details className="hist-item">
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
                      <div className="hist-item">
                        <div className="hist-row">{head}</div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {sessions.length > historyCount && (
            <p style={{ textAlign: "center", marginTop: "0.8rem" }}>
              <Link
                href={`/therapist/families/${childId}?history=${historyCount + 20}`}
                className="btn btn-outline btn-sm"
                scroll={false}
              >
                {t("showMoreSessions", { count: sessions.length - historyCount })}
              </Link>
            </p>
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

          <NotesPanel childId={childId} notes={notes} sinceLastNote={sinceLastNote} />

          <h2 className="section-label" style={{ marginTop: "1.4rem" }}>{t("trickySection")}</h2>
          {tricky.length === 0 ? (
            <p className="card-sub">{t("trickyEmpty")}</p>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
