import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/data/user";
import { getChildSessions, getFamilyChild } from "@/lib/data/therapist";
import {
  computeStreak,
  domainStats,
  getExercisesByIds,
  trickyItems,
  type SessionRow,
} from "@/lib/data/parent";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/database.types";
import ReportActions from "@/components/therapist/ReportActions";
import "@/styles/report.css";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];

const WEEK_OPTIONS = [4, 8, 12];
const APP_TZ = "Europe/Bratislava";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("therapist.report");
  return { title: `${t("docTitle")} · Evolvea` };
}

/* ---------- pure helpers (report-local aggregation) ---------- */

const isObj = (v: Json | null | undefined): v is { [k: string]: Json | undefined } =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function dayKey(date: string): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: APP_TZ });
}

function sessionPct(s: SessionRow): number | null {
  return s.score_total && s.score_total > 0 && s.score_correct !== null
    ? (100 * s.score_correct) / s.score_total
    : null;
}

interface MetaSummary {
  withMeta: number;
  strategies: [string, number][];
  selfEval: { great: number; ok: number; hard: number };
  calibration: { under: number; ok: number; over: number };
}

/** Counts mirroring SessionDetail's metacognition rendering, folded per period. */
function summarizeMetacognition(sessions: SessionRow[]): MetaSummary {
  const strategies = new Map<string, number>();
  const selfEval = { great: 0, ok: 0, hard: 0 };
  const calibration = { under: 0, ok: 0, over: 0 };
  let withMeta = 0;

  for (const s of sessions) {
    if (!isObj(s.detail) || !isObj(s.detail.metacognition)) continue;
    const m = s.detail.metacognition;
    const strategy = typeof m.strategy === "string" ? m.strategy : null;
    const eva = typeof m.selfEval === "string" ? m.selfEval : null;
    if (!strategy && !eva) continue;
    withMeta += 1;
    if (strategy) strategies.set(strategy, (strategies.get(strategy) ?? 0) + 1);
    if (eva === "great" || eva === "ok" || eva === "hard") {
      selfEval[eva] += 1;
      // same thresholds as components/therapist/SessionDetail.tsx
      const pct = sessionPct(s);
      if (pct !== null) {
        if (pct >= 80 && eva === "hard") calibration.under += 1;
        else if (pct < 50 && eva === "great") calibration.over += 1;
        else calibration.ok += 1;
      }
    }
  }

  return {
    withMeta,
    strategies: [...strategies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    selfEval,
    calibration,
  };
}

function excerpt(text: string, max = 200): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/* ---------- page ---------- */

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ weeks?: string }>;
}) {
  const [{ childId }, { weeks: weeksRaw }] = await Promise.all([params, searchParams]);
  const parsed = Number.parseInt(weeksRaw ?? "", 10);
  const weeks = WEEK_OPTIONS.includes(parsed) ? parsed : 8;

  const t = await getTranslations("therapist.report");
  const tc = await getTranslations("common");
  const td = await getTranslations("domains");
  const format = await getFormatter();

  const [profile, family] = await Promise.all([
    requireRole("therapist"),
    getFamilyChild(childId),
  ]);
  if (!family) notFound();
  const { child, parentName } = family;

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - weeks * 7);

  const supabase = await createClient();
  const [sessions, goalsRes] = await Promise.all([
    getChildSessions(childId, weeks * 7),
    supabase
      .from("goals")
      .select("*")
      .eq("child_id", childId)
      .in("status", ["active", "achieved"])
      .order("created_at", { ascending: true }),
  ]);
  const goals: GoalRow[] = goalsRes.data ?? [];

  const exercises = await getExercisesByIds(sessions.map((s) => s.exercise_id));
  const stats = domainStats(sessions, exercises).sort((a, b) => b.sessions - a.sessions);
  const tricky = trickyItems(sessions, exercises, 8);
  const trickyAll = trickyItems(sessions, exercises, 1000);
  const trickyPerDomain = new Map<string, number>();
  for (const it of trickyAll) {
    if (!it.domain) continue;
    trickyPerDomain.set(it.domain, (trickyPerDomain.get(it.domain) ?? 0) + 1);
  }

  const streak = computeStreak(sessions);
  const practiceDays = new Set(sessions.map((s) => dayKey(s.started_at))).size;
  const totalMinutes = Math.round(
    sessions.reduce((n, s) => n + (s.duration_seconds ?? 0), 0) / 60,
  );
  const scored = sessions.map(sessionPct).filter((p): p is number => p !== null);
  const avgPct =
    scored.length > 0
      ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
      : null;

  // "current" per goal = mean success in that domain over the last 14 days
  // (same window the goals panel uses).
  const cutoff14 = new Date(now);
  cutoff14.setDate(cutoff14.getDate() - 14);
  const recent = sessions.filter((s) => new Date(s.started_at) >= cutoff14);
  const currentByDomain = new Map<string, number>();
  {
    const acc = new Map<string, { sum: number; n: number }>();
    for (const s of recent) {
      const domain = exercises.get(s.exercise_id)?.domain;
      const pct = sessionPct(s);
      if (!domain || pct === null) continue;
      const e = acc.get(domain) ?? { sum: 0, n: 0 };
      e.sum += pct;
      e.n += 1;
      acc.set(domain, e);
    }
    for (const [domain, e] of acc) currentByDomain.set(domain, Math.round(e.sum / e.n));
  }

  const meta = summarizeMetacognition(sessions);
  const parentNotes = sessions.filter((s) => s.parent_note).slice(0, 6);

  const fmtDay = (d: Date) =>
    format.dateTime(d, { day: "numeric", month: "long", year: "numeric" });
  const fmtShort = (d: string) => format.dateTime(new Date(d), { day: "numeric", month: "short" });
  const pctText = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : `${Math.round(v)} %`;
  const deltaText = (d: number | null) =>
    d === null ? "—" : d > 0 ? `+${d} pp` : d < 0 ? `−${Math.abs(d)} pp` : "±0 pp";

  const age = child.birth_year ? now.getFullYear() - child.birth_year : null;

  return (
    <div className="report-print-root">
      <div className="report-toolbar">
        <Link href={`/therapist/families/${childId}`} className="report-back">
          ← {t("backToChild")}
        </Link>
        <ReportActions childId={childId} weeks={weeks} />
      </div>

      <article className="report">
        {/* 1 — header */}
        <header className="report-head">
          <p className="report-brand">
            <span className="brand-dot" aria-hidden="true" /> Evolvea
          </p>
          <h1 className="report-title">{t("docTitle")}</h1>
          <dl className="report-meta">
            <div>
              <dt>{t("childLabel")}</dt>
              <dd>
                {child.first_name}
                {age !== null ? ` · ${tc("ageYears", { age })}` : ""}
              </dd>
            </div>
            <div>
              <dt>{t("periodLabel")}</dt>
              <dd>
                {fmtDay(from)} – {fmtDay(now)} ({t("weeksOption", { weeks })})
              </dd>
            </div>
            <div>
              <dt>{t("therapistLabel")}</dt>
              <dd>{profile.full_name}</dd>
            </div>
            <div>
              <dt>{t("parentLabel")}</dt>
              <dd>{parentName}</dd>
            </div>
            <div>
              <dt>{t("generatedLabel")}</dt>
              <dd>{fmtDay(now)}</dd>
            </div>
          </dl>
        </header>

        {/* 2 — summary */}
        <section className="report-section">
          <h2 className="report-h2">{t("summaryTitle")}</h2>
          <div className="report-stats">
            <div className="report-stat">
              <b>{sessions.length}</b>
              <span>{t("statSessions")}</span>
            </div>
            <div className="report-stat">
              <b>{totalMinutes}</b>
              <span>{t("statMinutes")}</span>
            </div>
            <div className="report-stat">
              <b>{practiceDays}</b>
              <span>{t("statDays")}</span>
            </div>
            <div className="report-stat">
              <b>{streak}</b>
              <span>{t("statStreak")}</span>
            </div>
            <div className="report-stat">
              <b>{avgPct !== null ? `${avgPct} %` : "—"}</b>
              <span>{t("statAvg")}</span>
            </div>
          </div>
        </section>

        {/* 3 — domains */}
        <section className="report-section">
          <h2 className="report-h2">{t("domainsTitle")}</h2>
          {stats.length === 0 ? (
            <p className="report-empty">{t("noData")}</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>{t("thDomain")}</th>
                  <th className="num">{t("thSessions")}</th>
                  <th className="num">{t("thAvg")}</th>
                  <th className="num">{t("thTrend")}</th>
                  <th className="num">{t("thTricky")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.domain}>
                    <td>{td(s.domain)}</td>
                    <td className="num">{s.sessions}</td>
                    <td className="num">{pctText(s.avgPct)}</td>
                    <td className="num" data-delta={s.delta === null ? undefined : s.delta > 0 ? "up" : s.delta < 0 ? "down" : "flat"}>
                      {deltaText(s.delta)}
                    </td>
                    <td className="num">{trickyPerDomain.get(s.domain) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 4 — goals */}
        <section className="report-section">
          <h2 className="report-h2">{t("goalsTitle")}</h2>
          {goals.length === 0 ? (
            <p className="report-empty">{t("goalsEmpty")}</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>{t("thGoal")}</th>
                  <th>{t("thDomain")}</th>
                  <th className="num">{t("goalBaseline")}</th>
                  <th className="num">{t("goalCurrent")}</th>
                  <th className="num">{t("goalTarget")}</th>
                  <th>{t("thStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => (
                  <tr key={g.id}>
                    <td>{g.title}</td>
                    <td>{td(g.domain)}</td>
                    <td className="num">{pctText(g.baseline_pct)}</td>
                    <td className="num">{pctText(currentByDomain.get(g.domain) ?? null)}</td>
                    <td className="num">{pctText(g.target_pct)}</td>
                    <td>
                      {g.status === "achieved"
                        ? t("goalAchieved", {
                            date: g.achieved_at ? fmtShort(g.achieved_at) : "—",
                          })
                        : g.target_date
                          ? t("goalActiveUntil", { date: fmtShort(g.target_date) })
                          : t("goalActive")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 5 — metacognition */}
        <section className="report-section">
          <h2 className="report-h2">{t("metaTitle")}</h2>
          {meta.withMeta === 0 ? (
            <p className="report-empty">{t("metaEmpty")}</p>
          ) : (
            <div className="report-meta-grid">
              <div>
                <h3 className="report-h3">{t("metaStrategies")}</h3>
                {meta.strategies.length === 0 ? (
                  <p className="report-empty">{t("noData")}</p>
                ) : (
                  <ul className="report-list">
                    {meta.strategies.map(([label, count]) => (
                      <li key={label}>
                        {label} <b>{count}×</b>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="report-h3">{t("metaSelfEval")}</h3>
                <ul className="report-list">
                  <li>
                    {t("selfEval.great")} <b>{meta.selfEval.great}×</b>
                  </li>
                  <li>
                    {t("selfEval.ok")} <b>{meta.selfEval.ok}×</b>
                  </li>
                  <li>
                    {t("selfEval.hard")} <b>{meta.selfEval.hard}×</b>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="report-h3">{t("metaCalibration")}</h3>
                <ul className="report-list">
                  <li>
                    {t("calib.under")} <b>{meta.calibration.under}×</b>
                  </li>
                  <li>
                    {t("calib.ok")} <b>{meta.calibration.ok}×</b>
                  </li>
                  <li>
                    {t("calib.over")} <b>{meta.calibration.over}×</b>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* 6 — tricky items */}
        <section className="report-section">
          <h2 className="report-h2">{t("trickyTitle")}</h2>
          {tricky.length === 0 ? (
            <p className="report-empty">{t("trickyEmpty")}</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>{t("thItem")}</th>
                  <th>{t("thDomain")}</th>
                  <th className="num">{t("thMisses")}</th>
                  <th className="num">{t("thAttempts")}</th>
                </tr>
              </thead>
              <tbody>
                {tricky.map((it) => (
                  <tr key={`${it.kind}:${it.label}`}>
                    <td>{it.label}</td>
                    <td>{it.domain ? td(it.domain) : "—"}</td>
                    <td className="num">{it.misses}</td>
                    <td className="num">{it.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 7 — parent notes */}
        <section className="report-section">
          <h2 className="report-h2">{t("notesTitle")}</h2>
          {parentNotes.length === 0 ? (
            <p className="report-empty">{t("notesEmpty")}</p>
          ) : (
            <ul className="report-notes">
              {parentNotes.map((s) => (
                <li key={s.id}>
                  <span className="report-note-date">{fmtShort(s.started_at)}</span>
                  <span className="report-note-text">„{excerpt(s.parent_note ?? "")}“</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 8 — therapist comment */}
        <section className="report-section report-comment">
          <h2 className="report-h2">{t("commentTitle")}</h2>
          <div className="report-lines" aria-hidden="true">
            <div className="report-line" />
            <div className="report-line" />
            <div className="report-line" />
            <div className="report-line" />
          </div>
          <div className="report-sign">
            <span className="report-sign-slot">{t("signature")}</span>
            <span className="report-sign-slot">{t("dateLabel")}</span>
          </div>
        </section>

        <footer className="report-foot">{t("brandFooter")}</footer>
      </article>
    </div>
  );
}
