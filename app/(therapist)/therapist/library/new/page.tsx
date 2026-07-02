import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ExerciseForm from "@/components/therapist/ExerciseForm";

export default async function NewExercisePage() {
  const t = await getTranslations("therapist.exerciseForm");
  return (
    <div style={{ maxWidth: 760 }}>
      <p style={{ marginBottom: "0.8rem" }}>
        <Link href="/therapist/library" style={{ color: "var(--accent-ink)", fontSize: "0.88rem", fontWeight: 600 }}>
          ← {t("backToLibrary")}
        </Link>
      </p>
      <h1 className="page-h">{t("newTitle")}</h1>
      <p className="page-sub">{t("newLead")}</p>
      <ExerciseForm />
    </div>
  );
}
