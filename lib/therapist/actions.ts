"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseExerciseContent, type ExerciseDomain } from "@/lib/exercises/types";
import type { Json } from "@/lib/database.types";

export type InviteState = { error?: "fields" | "unknown"; code?: string } | null;

export async function createInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const firstName = String(formData.get("child_first_name") ?? "").trim();
  const birthYearRaw = String(formData.get("child_birth_year") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const birthYear = birthYearRaw ? Number.parseInt(birthYearRaw, 10) : null;

  if (!firstName || firstName.length > 60) return { error: "fields" };
  if (birthYear !== null && (Number.isNaN(birthYear) || birthYear < 2005 || birthYear > 2030))
    return { error: "fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const { data, error } = await supabase
    .from("invites")
    .insert({
      therapist_id: user.id,
      child_first_name: firstName,
      child_birth_year: birthYear,
      note: note || null,
    })
    .select("code")
    .single();

  if (error || !data) return { error: "unknown" };
  revalidatePath("/therapist/invites");
  return { code: data.code };
}

export async function deleteInviteAction(formData: FormData): Promise<void> {
  const id = String(formData.get("invite_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("invites").delete().eq("id", id);
  revalidatePath("/therapist/invites");
}

export interface PlanItemInput {
  exerciseId: string;
  timesPerWeek: number;
  supportLevel: number;
}

export type PlanState = { error?: "fields" | "unknown" } | null;

/**
 * Publishes a new active plan for the child and archives the previous one.
 * Keeping plans immutable-ish preserves an honest history for the family.
 */
export async function publishPlanAction(
  childId: string,
  title: string,
  note: string,
  items: PlanItemInput[],
): Promise<PlanState> {
  const cleanTitle = title.trim();
  const cleanNote = note.trim();
  if (!childId || !cleanTitle || cleanTitle.length > 200 || items.length === 0 || items.length > 30)
    return { error: "fields" };
  if (cleanNote.length > 2000) return { error: "fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const { data: plan, error } = await supabase
    .from("plans")
    .insert({
      child_id: childId,
      therapist_id: user.id,
      title: cleanTitle,
      note: cleanNote || null,
    })
    .select("id")
    .single();

  if (error || !plan) return { error: "unknown" };

  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, Math.round(n)));

  const { error: itemsError } = await supabase.from("plan_items").insert(
    items.map((item, i) => ({
      plan_id: plan.id,
      exercise_id: item.exerciseId,
      sort_order: i,
      times_per_week: clamp(item.timesPerWeek, 1, 7),
      support_level: clamp(item.supportLevel, 1, 3),
    })),
  );

  if (itemsError) {
    await supabase.from("plans").delete().eq("id", plan.id);
    return { error: "unknown" };
  }

  await supabase
    .from("plans")
    .update({ status: "archived" })
    .eq("child_id", childId)
    .eq("status", "active")
    .neq("id", plan.id);

  revalidatePath("/", "layout");
  redirect(`/therapist/families/${childId}`);
}

export type ExerciseFormState = { error?: "fields" | "content" | "unknown"; contentError?: string } | null;

/** Create or update a custom exercise; content is validated structurally. */
export async function saveExerciseAction(
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const id = String(formData.get("exercise_id") ?? "");
  const domain = String(formData.get("domain") ?? "") as ExerciseDomain;
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const parentGuide = String(formData.get("parent_guide") ?? "").trim();
  const difficulty = Number.parseInt(String(formData.get("difficulty") ?? "1"), 10);
  const ageMin = Number.parseInt(String(formData.get("age_min") ?? "5"), 10);
  const ageMax = Number.parseInt(String(formData.get("age_max") ?? "10"), 10);
  const duration = Number.parseInt(String(formData.get("duration_minutes") ?? "5"), 10);
  const contentRaw = String(formData.get("content") ?? "");

  const DOMAINS = [
    "phonemic_awareness",
    "working_memory",
    "attention",
    "narrative",
    "vocabulary",
    "articulation",
    "guided",
  ];
  if (
    !DOMAINS.includes(domain) ||
    !title ||
    title.length > 200 ||
    !summary ||
    summary.length > 600 ||
    parentGuide.length > 2000 ||
    ![1, 2, 3].includes(difficulty) ||
    Number.isNaN(ageMin) ||
    Number.isNaN(ageMax) ||
    ageMin < 3 ||
    ageMax > 15 ||
    ageMin > ageMax ||
    Number.isNaN(duration) ||
    duration < 1 ||
    duration > 60
  )
    return { error: "fields" };

  let content: Json;
  try {
    content = JSON.parse(contentRaw) as Json;
    parseExerciseContent(content);
  } catch (e) {
    return { error: "content", contentError: e instanceof Error ? e.message : "invalid" };
  }

  const parsed = parseExerciseContent(content);
  const modality =
    parsed.type === "speech_items"
      ? "speech"
      : parsed.type === "guided_steps"
        ? "guided"
        : "interactive";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const row = {
    domain,
    modality: modality as "interactive" | "speech" | "guided",
    title,
    summary,
    parent_guide: parentGuide,
    difficulty,
    age_min: ageMin,
    age_max: ageMax,
    duration_minutes: duration,
    content,
  };

  const { error } = id
    ? await supabase.from("exercises").update(row).eq("id", id).eq("created_by", user.id)
    : await supabase.from("exercises").insert({ ...row, created_by: user.id });

  if (error) return { error: "unknown" };
  revalidatePath("/therapist/library");
  redirect("/therapist/library?saved=1");
}

export async function toggleExerciseActiveAction(formData: FormData): Promise<void> {
  const id = String(formData.get("exercise_id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("exercises").update({ is_active: active }).eq("id", id);
  revalidatePath("/therapist/library");
}
