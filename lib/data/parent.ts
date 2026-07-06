import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { DOMAINS, type ExerciseDomain, type ExerciseRow } from "@/lib/exercises/types";

export type Child = Database["public"]["Tables"]["children"]["Row"];
export type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
export type PlanItemRow = Database["public"]["Tables"]["plan_items"]["Row"];
export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

export const getSubscription = cache(
  async (childId: string): Promise<SubscriptionRow | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("child_id", childId)
      .maybeSingle();
    return data;
  },
);

export const ACTIVE_CHILD_COOKIE = "evolvea_child";

export const getChildren = cache(async (): Promise<Child[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
});

/** The child the parent currently works with (cookie-selected, else first). */
export async function getActiveChild(): Promise<{ child: Child | null; children: Child[] }> {
  const children = await getChildren();
  if (children.length === 0) return { child: null, children };
  const store = await cookies();
  const wanted = store.get(ACTIVE_CHILD_COOKIE)?.value;
  return { child: children.find((c) => c.id === wanted) ?? children[0], children };
}

export type PlanItemWithExercise = PlanItemRow & { exercises: ExerciseRow };
export type PlanWithItems = PlanRow & { plan_items: PlanItemWithExercise[] };

/**
 * Active plan incl. items + exercises, newest first.
 * Items whose exercise is hidden by RLS (e.g. a deactivated custom exercise)
 * come back with `exercises: null` from the embed — drop them instead of
 * letting the UI crash on a missing row.
 */
export const getActivePlan = cache(async (childId: string): Promise<PlanWithItems | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plans")
    .select("*, plan_items(*, exercises(*))")
    .eq("child_id", childId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const items = (data.plan_items as (PlanItemRow & { exercises: ExerciseRow | null })[])
    .filter((item): item is PlanItemWithExercise => item.exercises !== null)
    .sort((a, b) => a.sort_order - b.sort_order);
  return { ...data, plan_items: items };
});

/** Completed sessions for the child within the last `days`. */
export const getRecentSessions = cache(
  async (childId: string, days = 90): Promise<SessionRow[]> => {
    const supabase = await createClient();
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("child_id", childId)
      .not("completed_at", "is", null)
      .gte("started_at", since.toISOString())
      .order("started_at", { ascending: false });
    return data ?? [];
  },
);

/* ---------------- derived, pure helpers ---------------- */

/**
 * Day/week bucketing runs in a fixed app timezone, not the server's —
 * otherwise an evening session recorded on a UTC host lands on the next
 * day and breaks streaks. Slovak-first product → Europe/Bratislava.
 */
const APP_TZ = "Europe/Bratislava";

/** YYYY-MM-DD of the instant in the app timezone. */
function localDayKey(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: APP_TZ });
}

/** ISO weekday index 0 (Mon) … 6 (Sun) in the app timezone. */
function localWeekdayIndex(date: Date): number {
  const name = date.toLocaleDateString("en-US", { timeZone: APP_TZ, weekday: "short" });
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(name);
}

/** Day key shifted by n days relative to the given instant. */
function shiftedDayKey(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return localDayKey(d);
}

export interface TodayEntry {
  item: PlanItemWithExercise;
  doneThisWeek: number;
  target: number;
  doneToday: boolean;
}

export interface WeekOverview {
  /** Ordered queue for today (most urgent first). */
  today: TodayEntry[];
  /** Every plan item with weekly progress. */
  all: TodayEntry[];
  doneTotal: number;
  targetTotal: number;
}

/** Weekly recommendation queue: least-covered plan items first. */
export function buildWeekOverview(
  plan: PlanWithItems | null,
  sessions: SessionRow[],
  now = new Date(),
): WeekOverview {
  if (!plan) return { today: [], all: [], doneTotal: 0, targetTotal: 0 };

  const weekday = localWeekdayIndex(now);
  const weekKeys = new Set(
    Array.from({ length: 7 }, (_, i) => shiftedDayKey(now, i - weekday)),
  );
  const todayKey = localDayKey(now);
  const thisWeek = sessions.filter((s) => weekKeys.has(localDayKey(s.started_at)));

  const all: TodayEntry[] = plan.plan_items.map((item) => {
    // match by exercise, not plan_item id — republishing a plan creates new
    // item ids and must not wipe the family's weekly progress
    const mine = thisWeek.filter((s) => s.exercise_id === item.exercise_id);
    return {
      item,
      doneThisWeek: mine.length,
      target: item.times_per_week,
      doneToday: mine.some((s) => localDayKey(s.started_at) === todayKey),
    };
  });

  const today = all
    .filter((e) => e.doneThisWeek < e.target && !e.doneToday)
    .sort(
      (a, b) =>
        a.doneThisWeek / a.target - b.doneThisWeek / b.target ||
        a.item.sort_order - b.item.sort_order,
    )
    .slice(0, 3);

  return {
    today,
    all,
    doneTotal: all.reduce((n, e) => n + Math.min(e.doneThisWeek, e.target), 0),
    targetTotal: all.reduce((n, e) => n + e.target, 0),
  };
}

/**
 * Recommended weekly rhythm: spreads the plan across Mon–Sun so each day is a
 * short, varied batch instead of one big pile. Purely illustrative — the daily
 * "today" queue stays adaptive so a missed day never loses exercises.
 *
 * Frequent exercises claim their days first; each occurrence lands on the
 * least-loaded day, preferring days that don't yet cover its domain (variety).
 * Deterministic (stable tie-breaks, no randomness).
 */
export function buildWeeklyRhythm(entries: TodayEntry[]): PlanItemWithExercise[][] {
  const days: PlanItemWithExercise[][] = Array.from({ length: 7 }, () => []);
  const dayDomains: Set<string>[] = Array.from({ length: 7 }, () => new Set());

  const ordered = [...entries].sort(
    (a, b) =>
      b.target - a.target ||
      a.item.exercises.domain.localeCompare(b.item.exercises.domain) ||
      a.item.exercises.title.localeCompare(b.item.exercises.title),
  );

  for (const entry of ordered) {
    const domain = entry.item.exercises.domain;
    const times = Math.min(Math.max(entry.target, 1), 7);
    const chosen = [0, 1, 2, 3, 4, 5, 6]
      .sort(
        (d1, d2) =>
          days[d1].length - days[d2].length ||
          Number(dayDomains[d1].has(domain)) - Number(dayDomains[d2].has(domain)) ||
          d1 - d2,
      )
      .slice(0, times);
    for (const day of chosen) {
      days[day].push(entry.item);
      dayDomains[day].add(domain);
    }
  }
  return days;
}

export interface DomainGroup {
  domain: ExerciseDomain;
  entries: TodayEntry[];
  done: number;
  target: number;
}

/** Plan entries bucketed by therapy domain, in the canonical domain order. */
export function groupEntriesByDomain(entries: TodayEntry[]): DomainGroup[] {
  return DOMAINS.map((domain) => {
    const group = entries.filter((e) => e.item.exercises.domain === domain);
    return {
      domain,
      entries: group,
      done: group.reduce((n, e) => n + Math.min(e.doneThisWeek, e.target), 0),
      target: group.reduce((n, e) => n + e.target, 0),
    };
  }).filter((g) => g.entries.length > 0);
}

/** Consecutive practice days ending today or yesterday. */
export function computeStreak(sessions: SessionRow[], now = new Date()): number {
  const days = new Set(sessions.map((s) => localDayKey(s.started_at)));
  let offset = days.has(localDayKey(now)) ? 0 : -1;
  let streak = 0;
  while (days.has(shiftedDayKey(now, offset))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

/** Which of the current week's days (Mon..Sun) saw practice. */
export function weekDays(sessions: SessionRow[], now = new Date()): boolean[] {
  const weekday = localWeekdayIndex(now);
  const done = sessions.map((s) => localDayKey(s.started_at));
  return Array.from({ length: 7 }, (_, i) =>
    done.includes(shiftedDayKey(now, i - weekday)),
  );
}

/** Today's Mon-based weekday index in the app timezone (for UI highlighting). */
export function appWeekdayIndex(now = new Date()): number {
  return localWeekdayIndex(now);
}

export interface DomainStat {
  domain: ExerciseRow["domain"];
  sessions: number;
  /** Mean success 0–100 across scored sessions, null when nothing scored. */
  avgPct: number | null;
  lastAt: string | null;
}

/** Per-domain aggregates; needs the exercise map to resolve domains. */
export function domainStats(
  sessions: SessionRow[],
  exercisesById: Map<string, ExerciseRow>,
): DomainStat[] {
  const acc = new Map<string, { n: number; pctSum: number; pctN: number; last: string }>();
  for (const s of sessions) {
    const ex = exercisesById.get(s.exercise_id);
    if (!ex) continue;
    const entry = acc.get(ex.domain) ?? { n: 0, pctSum: 0, pctN: 0, last: s.started_at };
    entry.n += 1;
    if (s.score_total && s.score_total > 0 && s.score_correct !== null) {
      entry.pctSum += (100 * s.score_correct) / s.score_total;
      entry.pctN += 1;
    }
    if (s.started_at > entry.last) entry.last = s.started_at;
    acc.set(ex.domain, entry);
  }
  return [...acc.entries()].map(([domain, e]) => ({
    domain: domain as ExerciseRow["domain"],
    sessions: e.n,
    avgPct: e.pctN > 0 ? Math.round(e.pctSum / e.pctN) : null,
    lastAt: e.last,
  }));
}

export interface TrickyItem {
  label: string;
  domain: ExerciseRow["domain"] | null;
  kind: "speech" | "interactive";
  misses: number;
  attempts: number;
  lastMissedAt: string;
}

/**
 * Cross-session "what's tricky": folds every session's per-item results into a
 * ranked list of the items the child keeps missing — the artifact a therapist
 * wants at the monthly review. Speech items count as missed when rated below
 * "great"; interactive items when not solved on the first try. Pure aggregation
 * over data already stored in `sessions.detail` — no new query, no recording
 * change. Items without a text label (memory spans, number rounds, pairs) are
 * skipped; guided reflections carry no correctness.
 */
export function trickyItems(
  sessions: SessionRow[],
  exercisesById: Map<string, ExerciseRow>,
  limit = 8,
): TrickyItem[] {
  const acc = new Map<string, TrickyItem>();

  for (const s of sessions) {
    const detail = s.detail;
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) continue;
    const items = (detail as Record<string, unknown>).items;
    if (!Array.isArray(items)) continue;
    const domain = exercisesById.get(s.exercise_id)?.domain ?? null;

    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const it = raw as Record<string, unknown>;
      let label: string;
      let kind: "speech" | "interactive";
      let missed: boolean;

      if (typeof it.score === "string" && typeof it.text === "string") {
        label = it.text; // the spoken target / answer
        kind = "speech";
        missed = it.score !== "great";
      } else if ("firstTry" in it) {
        const l =
          (typeof it.prompt === "string" && it.prompt) ||
          (typeof it.word === "string" && it.word) ||
          (typeof it.title === "string" && it.title) ||
          "";
        if (!l) continue; // no useful text label (e.g. memory spans)
        label = l;
        kind = "interactive";
        missed = it.firstTry === false;
      } else {
        continue;
      }

      const key = `${kind}:${label}`;
      const e =
        acc.get(key) ?? { label, domain, kind, misses: 0, attempts: 0, lastMissedAt: "" };
      e.attempts += 1;
      if (missed) {
        e.misses += 1;
        if (s.started_at > e.lastMissedAt) e.lastMissedAt = s.started_at;
      }
      acc.set(key, e);
    }
  }

  return [...acc.values()]
    .filter((e) => e.misses > 0)
    .sort((a, b) => b.misses - a.misses || (a.lastMissedAt < b.lastMissedAt ? 1 : -1))
    .slice(0, limit);
}

export interface TrickyExercise {
  exerciseId: string;
  misses: number;
  /** Distinct labels of the missed items (short = words to show as chips). */
  labels: string[];
  lastAt: string;
}

/**
 * "What to work on", rolled up per EXERCISE rather than per raw item — so a
 * parent sees "Rýmovačky · 5 tricky · [practise]" instead of five long
 * multiple-choice questions they can't act on. Missed = speech rated below
 * "great", or an interactive item not solved first try.
 */
export function trickyByExercise(
  sessions: SessionRow[],
  _exercisesById?: Map<string, ExerciseRow>,
  limit = 6,
): TrickyExercise[] {
  const acc = new Map<string, { misses: number; labels: Set<string>; lastAt: string }>();
  for (const s of sessions) {
    const detail = s.detail;
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) continue;
    const items = (detail as Record<string, unknown>).items;
    if (!Array.isArray(items)) continue;
    for (const raw of items) {
      if (!raw || typeof raw !== "object") continue;
      const it = raw as Record<string, unknown>;
      let label: string;
      let missed: boolean;
      if (typeof it.score === "string" && typeof it.text === "string") {
        label = it.text;
        missed = it.score !== "great";
      } else if ("firstTry" in it) {
        const l =
          (typeof it.word === "string" && it.word) ||
          (typeof it.text === "string" && it.text) ||
          (typeof it.title === "string" && it.title) ||
          (typeof it.prompt === "string" && it.prompt) ||
          "";
        if (!l) continue;
        label = l;
        missed = it.firstTry === false;
      } else {
        continue;
      }
      if (!missed) continue;
      const e = acc.get(s.exercise_id) ?? { misses: 0, labels: new Set<string>(), lastAt: "" };
      e.misses += 1;
      e.labels.add(label);
      if (s.started_at > e.lastAt) e.lastAt = s.started_at;
      acc.set(s.exercise_id, e);
    }
  }
  return [...acc.entries()]
    .map(([exerciseId, e]) => ({ exerciseId, misses: e.misses, labels: [...e.labels], lastAt: e.lastAt }))
    .filter((e) => e.misses > 0)
    .sort((a, b) => b.misses - a.misses || (a.lastAt < b.lastAt ? 1 : -1))
    .slice(0, limit);
}

export interface ExerciseSummary {
  exerciseId: string;
  count: number;
  lastAt: string;
  latestCorrect: number | null;
  latestTotal: number | null;
  /** Improvement of the latest attempt vs the oldest one (null if <2 scored). */
  trend: "up" | "down" | "flat" | null;
}

/**
 * Roll the raw session log up per exercise — one entry each, with how many times
 * it was practised, the latest score and whether the child is improving. This is
 * what a parent actually tracks ("how is my child doing on each exercise"),
 * instead of a chronological dump. Sessions must be newest-first.
 */
export function summarizeByExercise(
  sessions: SessionRow[],
  _exercisesById?: Map<string, ExerciseRow>,
): ExerciseSummary[] {
  const acc = new Map<string, { count: number; latest: SessionRow; oldest: SessionRow }>();
  for (const s of sessions) {
    const e = acc.get(s.exercise_id);
    if (!e) acc.set(s.exercise_id, { count: 1, latest: s, oldest: s });
    else {
      e.count += 1;
      e.oldest = s; // iterating newest→oldest, so the last write is the oldest
    }
  }
  const pct = (s: SessionRow) =>
    s.score_total && s.score_total > 0 && s.score_correct !== null
      ? (100 * s.score_correct) / s.score_total
      : null;
  return [...acc.entries()]
    .map(([exerciseId, e]) => {
      const latestPct = pct(e.latest);
      const oldestPct = pct(e.oldest);
      let trend: ExerciseSummary["trend"] = null;
      if (e.count >= 2 && latestPct !== null && oldestPct !== null) {
        const d = latestPct - oldestPct;
        trend = d > 8 ? "up" : d < -8 ? "down" : "flat";
      }
      return {
        exerciseId,
        count: e.count,
        lastAt: e.latest.started_at,
        latestCorrect: e.latest.score_correct,
        latestTotal: e.latest.score_total,
        trend,
      };
    })
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

export interface DayGroup {
  dayKey: string;
  isToday: boolean;
  isYesterday: boolean;
  sessions: SessionRow[];
}

/**
 * Group already-sorted (newest-first) sessions into calendar days so the
 * history reads as "Dnes / Včera / Pondelok 30. 6." instead of a flat dump.
 */
export function groupSessionsByDay(sessions: SessionRow[], now = new Date()): DayGroup[] {
  const today = localDayKey(now);
  const yesterday = shiftedDayKey(now, -1);
  const groups: DayGroup[] = [];
  for (const s of sessions) {
    const dayKey = localDayKey(s.started_at);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) {
      last.sessions.push(s);
    } else {
      groups.push({
        dayKey,
        isToday: dayKey === today,
        isYesterday: dayKey === yesterday,
        sessions: [s],
      });
    }
  }
  return groups;
}

/** Exercises referenced by sessions (for history rendering). */
export async function getExercisesByIds(ids: string[]): Promise<Map<string, ExerciseRow>> {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((e) => [e.id, e as ExerciseRow]));
}
