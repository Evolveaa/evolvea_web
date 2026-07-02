import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { ExerciseRow } from "@/lib/exercises/types";

export type Child = Database["public"]["Tables"]["children"]["Row"];
export type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
export type PlanItemRow = Database["public"]["Tables"]["plan_items"]["Row"];
export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

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

/** Active plan incl. items + exercises, newest first. */
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
  data.plan_items.sort((a, b) => a.sort_order - b.sort_order);
  return data as PlanWithItems;
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

/** Monday 00:00 local time of the week containing `d`. */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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

  const weekStart = startOfWeekMonday(now);
  const todayKey = localDayKey(now.toISOString());
  const thisWeek = sessions.filter((s) => new Date(s.started_at) >= weekStart);

  const all: TodayEntry[] = plan.plan_items.map((item) => {
    const mine = thisWeek.filter((s) => s.plan_item_id === item.id);
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

/** Consecutive practice days ending today or yesterday. */
export function computeStreak(sessions: SessionRow[], now = new Date()): number {
  const days = new Set(sessions.map((s) => localDayKey(s.started_at)));
  let streak = 0;
  const cursor = new Date(now);
  if (!days.has(localDayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(localDayKey(cursor.toISOString()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Which of the current week's days (Mon..Sun) saw practice. */
export function weekDays(sessions: SessionRow[], now = new Date()): boolean[] {
  const start = startOfWeekMonday(now);
  const done: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = localDayKey(d.toISOString());
    done.push(sessions.some((s) => localDayKey(s.started_at) === key));
  }
  return done;
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
