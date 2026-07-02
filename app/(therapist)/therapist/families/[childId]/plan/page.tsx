import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PlanBuilder, { type LibraryItem } from "@/components/therapist/PlanBuilder";
import { getFamilyChild, getLibrary } from "@/lib/data/therapist";
import { getActivePlan } from "@/lib/data/parent";

export default async function PlanBuilderPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const t = await getTranslations("therapist.builder");

  const [family, library, plan] = await Promise.all([
    getFamilyChild(childId),
    getLibrary(),
    getActivePlan(childId),
  ]);
  if (!family) notFound();

  const slim: LibraryItem[] = library
    .filter((e) => e.is_active)
    .map((e) => ({
      id: e.id,
      title: e.title,
      domain: e.domain,
      difficulty: e.difficulty,
      duration_minutes: e.duration_minutes,
      age_min: e.age_min,
      age_max: e.age_max,
      summary: e.summary,
      is_builtin: e.is_builtin,
    }));

  return (
    <>
      <p style={{ marginBottom: "0.8rem" }}>
        <Link
          href={`/therapist/families/${childId}`}
          style={{ color: "var(--accent-ink)", fontSize: "0.88rem", fontWeight: 600 }}
        >
          ← {family.child.first_name}
        </Link>
      </p>
      <h1 className="page-h">{t("pageTitle", { name: family.child.first_name })}</h1>
      <p className="page-sub">{t("pageLead")}</p>

      <PlanBuilder
        childId={childId}
        childName={family.child.first_name}
        library={slim}
        initialTitle={plan?.title ?? t("defaultTitle", { name: family.child.first_name })}
        initialNote={plan?.note ?? ""}
        initialItems={
          plan?.plan_items.map((item) => ({
            exerciseId: item.exercise_id,
            timesPerWeek: item.times_per_week,
            supportLevel: item.support_level,
          })) ?? []
        }
      />
    </>
  );
}
