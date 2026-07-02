import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ExercisePlayer from "@/components/player/ExercisePlayer";
import { requireRole } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";
import { tryParseExerciseContent, type ExerciseRow } from "@/lib/exercises/types";

/** Therapists can play any visible exercise as a no-save preview. */
export default async function ExercisePreviewPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  await requireRole("therapist");
  const { exerciseId } = await params;

  const supabase = await createClient();
  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) notFound();
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
      exercise={exercise as ExerciseRow}
      content={content}
      supportLevel={3}
      mode="preview"
      closeHref="/therapist/library"
    />
  );
}
