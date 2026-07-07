import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeStreak,
  domainStats,
  trickyByExercise,
  groupSessionsByDay,
} from "../lib/data/parent";

/* minimal fixtures shaped like the real rows the aggregations consume */
type S = Parameters<typeof computeStreak>[0][number];
const day = (d: number, extra: Partial<S> = {}): S =>
  ({
    id: `s${d}`,
    child_id: "c",
    exercise_id: "e",
    plan_item_id: null,
    support_level: 3,
    started_at: new Date(2026, 6, d, 10, 0, 0).toISOString(),
    completed_at: null,
    duration_seconds: 60,
    score_correct: 5,
    score_total: 5,
    hints_used: 0,
    detail: null,
    parent_note: null,
    ...extra,
  }) as S;

test("computeStreak: consecutive days from 'today'", () => {
  const now = new Date(2026, 6, 7, 12, 0, 0);
  const sessions = [day(7), day(6), day(5), day(3)]; // gap at 4 breaks the streak
  assert.equal(computeStreak(sessions, now), 3);
});

test("computeStreak: no session today but yesterday still counts", () => {
  const now = new Date(2026, 6, 7, 12, 0, 0);
  assert.equal(computeStreak([day(6), day(5)], now), 2);
});

test("computeStreak: stale (>1 day ago) is zero", () => {
  const now = new Date(2026, 6, 7, 12, 0, 0);
  assert.equal(computeStreak([day(4), day(3)], now), 0);
});

test("domainStats: avg %, trend and delta", () => {
  const ex = new Map<string, { id: string; domain: string }>([
    ["e1", { id: "e1", domain: "phonemic_awareness" }],
  ]);
  const sessions = [
    day(1, { exercise_id: "e1", score_correct: 4, score_total: 10 }),
    day(2, { exercise_id: "e1", score_correct: 5, score_total: 10 }),
    day(3, { exercise_id: "e1", score_correct: 9, score_total: 10 }),
    day(4, { exercise_id: "e1", score_correct: 10, score_total: 10 }),
  ];
  const [stat] = domainStats(sessions, ex as never);
  assert.equal(stat.domain, "phonemic_awareness");
  assert.equal(stat.sessions, 4);
  assert.equal(stat.avgPct, Math.round((40 + 50 + 90 + 100) / 4)); // 70
  assert.deepEqual(stat.trend, [40, 50, 90, 100]); // oldest -> newest
  // recent half (90,100=95) minus earlier half (40,50=45) = +50
  assert.equal(stat.delta, 50);
});

test("domainStats: unscored sessions give null avg and no delta", () => {
  const ex = new Map([["e1", { id: "e1", domain: "guided" }]]);
  const sessions = [day(1, { exercise_id: "e1", score_total: 0, score_correct: null })];
  const [stat] = domainStats(sessions, ex as never);
  assert.equal(stat.avgPct, null);
  assert.equal(stat.delta, null);
  assert.deepEqual(stat.trend, []);
});

test("trickyByExercise: ranks exercises by miss count", () => {
  const mk = (id: string, items: unknown[]) =>
    day(1, { exercise_id: id, detail: { items } as never });
  const sessions = [
    mk("hard", [{ text: "syr", score: "practice" }, { text: "les", score: "great" }]),
    mk("hard", [{ text: "syr", score: "almost" }]),
    mk("easy", [{ text: "ok", score: "great" }]),
  ];
  const tricky = trickyByExercise(sessions);
  assert.ok(tricky.length >= 1);
  assert.equal(tricky[0].exerciseId, "hard");
  assert.ok(tricky[0].misses >= 2);
});

test("groupSessionsByDay: groups + flags today/yesterday", () => {
  const now = new Date(2026, 6, 7, 12, 0, 0);
  const groups = groupSessionsByDay([day(7), day(7), day(6)], now);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].sessions.length, 2);
  assert.equal(groups[0].isToday, true);
  assert.equal(groups[1].isYesterday, true);
});
