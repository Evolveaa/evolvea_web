import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ExerciseForm from "@/components/therapist/ExerciseForm";
import { getSessionProfile } from "@/lib/data/user";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseRow } from "@/lib/exercises/types";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const t = await getTranslations("therapist.exerciseForm");
  const session = await getSessionProfile();
  if (!session) notFound();

  const supabase = await createClient();
  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .eq("created_by", session.profile.id)
    .maybeSingle();

  if (!exercise) notFound();

  return (
    <div style={{ maxWidth: 760 }}>
      <p style={{ marginBottom: "0.8rem" }}>
        <Link href="/therapist/library" className="back-link">
          ← {t("backToLibrary")}
        </Link>
      </p>
      <h1 className="page-h">{t("editTitle")}</h1>
      <p className="page-sub">{t("editLead")}</p>
      <ExerciseForm exercise={exercise as ExerciseRow} />
    </div>
  );
}
