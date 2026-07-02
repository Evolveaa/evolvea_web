import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ExercisePlayer from "@/components/player/ExercisePlayer";
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

  const exercise = item.exercises as ExerciseRow;
  const content = tryParseExerciseContent(exercise.content);

  if (!content) {
    const t = await getTranslations("player");
    return (
      <div className="auth-main" style={{ paddingTop: "3rem" }}>
        <div className="auth-card">
          <h1 className="auth-title">{t("brokenTitle")}</h1>
          <p className="auth-lead">{t("brokenLead")}</p>
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
    />
  );
}
