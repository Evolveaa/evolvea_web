import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PlanBuilder, { type LibraryItem } from "@/components/therapist/PlanBuilder";
import { getFamilyChild, getLibrary } from "@/lib/data/therapist";
import { getPlanTemplates, parseTemplateItems } from "@/lib/data/clinical";
import { getActivePlan } from "@/lib/data/parent";
import { ageBandFor } from "@/lib/exercises/categories";

export default async function PlanBuilderPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const t = await getTranslations("therapist.builder");

  const [family, library, plan, templateRows] = await Promise.all([
    getFamilyChild(childId),
    getLibrary(),
    getActivePlan(childId),
    getPlanTemplates(),
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

  const templates = templateRows.map((row) => ({
    ...row,
    parsedItems: parseTemplateItems(row.items),
  }));

  const initialItems =
    plan?.plan_items
      .filter((item) => slim.some((e) => e.id === item.exercise_id))
      .map((item) => ({
        exerciseId: item.exercise_id,
        timesPerWeek: item.times_per_week,
        supportLevel: item.support_level,
      })) ?? [];
  // items whose exercise left the active library are dropped from the draft —
  // but the therapist must LEARN about it, not silently republish less
  const droppedCount = (plan?.plan_items.length ?? 0) - initialItems.length;

  return (
    <>
      <p style={{ marginBottom: "0.8rem" }}>
        <Link
          href={`/therapist/families/${childId}`}
          className="back-link"
        >
          ← {family.child.first_name}
        </Link>
      </p>
      <h1 className="page-h">{t("pageTitle", { name: family.child.first_name })}</h1>
      <p className="page-sub">{t("pageLead")}</p>

      {droppedCount > 0 && (
        <p className="form-error" role="alert" style={{ maxWidth: "72ch" }}>
          {t("droppedItems", { count: droppedCount })}
        </p>
      )}

      <PlanBuilder
        childId={childId}
        childName={family.child.first_name}
        library={slim}
        defaultAgeBand={ageBandFor(
          family.child.birth_year ? new Date().getFullYear() - family.child.birth_year : null,
        )}
        initialTitle={plan?.title ?? t("defaultTitle", { name: family.child.first_name })}
        initialNote={plan?.note ?? ""}
        initialItems={initialItems}
        templates={templates}
      />
    </>
  );
}
