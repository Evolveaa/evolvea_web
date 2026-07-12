import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ExercisePlayer from "@/components/player/ExercisePlayer";
import { hasAccess } from "@/lib/billing";
import {
  buildWeekOverview,
  computeStreak,
  getActivePlan,
  getRecentSessions,
  getSubscription,
  localDayKey,
} from "@/lib/data/parent";
import { requireRole } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";
import { asSupportLevel, tryParseExerciseContent, type ExerciseRow } from "@/lib/exercises/types";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ planItemId: string }>;
}) {
  await requireRole("parent");
  const { planItemId } = await params;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("plan_items")
    .select("*, exercises(*), plans(child_id)")
    .eq("id", planItemId)
    .maybeSingle();

  if (!item || !item.exercises || !item.plans) notFound();

  // Practice is gated on a living trial or active subscription.
  const sub = await getSubscription(item.plans.child_id);
  if (!hasAccess(sub)) redirect("/app/checkout");

  // Voice recording (describe-the-picture) is opt-in per child.
  const { data: childRow } = await supabase
    .from("children")
    .select("speech_consent_at")
    .eq("id", item.plans.child_id)
    .maybeSingle();
  const speechConsent = !!childRow?.speech_consent_at;

  const exercise = item.exercises as ExerciseRow;
  const content = tryParseExerciseContent(exercise.content);

  // Session chaining: after saving, offer the next exercise from today's
  // adaptive queue instead of bouncing the parent back home between each one.
  const childId = item.plans.child_id;
  const [plan, sessions] = await Promise.all([
    getActivePlan(childId),
    getRecentSessions(childId),
  ]);
  const week = buildWeekOverview(plan, sessions);
  const nextEntry = week.today.find((e) => e.item.id !== item.id) ?? null;
  const next = nextEntry
    ? {
        href: `/app/exercise/${nextEntry.item.id}`,
        title: nextEntry.item.exercises.title,
        domain: nextEntry.item.exercises.domain,
      }
    : null;
  // Streak as it will read AFTER this session is saved (today counts) — same
  // Europe/Bratislava day bucketing as computeStreak, or the +1 goes wrong
  // between local midnight and 02:00 on a UTC host.
  const todayKey = localDayKey(new Date());
  const practisedToday = sessions.some((s) => localDayKey(s.started_at) === todayKey);
  const streakAfterSave = computeStreak(sessions) + (practisedToday ? 0 : 1);

  if (!content) {
    const t = await getTranslations("player");
    return (
      <div className="auth-main" style={{ paddingTop: "3rem" }}>
        <div className="auth-card">
          <h1 className="auth-title">{t("brokenTitle")}</h1>
          <p className="auth-lead">{t("brokenLead")}</p>
          <Link href="/app" className="btn btn-primary btn-block">
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ExercisePlayer
      exercise={exercise}
      content={content}
      supportLevel={asSupportLevel(item.support_level)}
      childId={item.plans.child_id}
      planItemId={item.id}
      mode="live"
      closeHref="/app"
      speechConsent={speechConsent}
      next={next}
      streakAfterSave={streakAfterSave}
    />
  );
}
