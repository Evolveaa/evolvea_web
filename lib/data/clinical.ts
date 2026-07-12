import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/database.types";

export type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
export type TherapistNoteRow = Database["public"]["Tables"]["therapist_notes"]["Row"];
export type PlanTemplateRow = Database["public"]["Tables"]["plan_templates"]["Row"];

/** One saved plan-template entry — mirrors PlanItemInput of the builder. */
export interface TemplateItem {
  exerciseId: string;
  timesPerWeek: number;
  supportLevel: number;
}

/**
 * Defensive parse of the `plan_templates.items` jsonb payload. The column is
 * written only by our own action, but jsonb carries no schema — a malformed
 * row must degrade to "template with fewer/no items", never crash the page.
 */
export function parseTemplateItems(json: Json): TemplateItem[] {
  if (!Array.isArray(json)) return [];
  const items: TemplateItem[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const it = raw as Record<string, unknown>;
    if (typeof it.exerciseId !== "string" || it.exerciseId.length === 0) continue;
    const times = typeof it.timesPerWeek === "number" ? Math.round(it.timesPerWeek) : NaN;
    const support = typeof it.supportLevel === "number" ? Math.round(it.supportLevel) : NaN;
    if (Number.isNaN(times) || times < 1 || times > 7) continue;
    if (Number.isNaN(support) || support < 1 || support > 3) continue;
    items.push({ exerciseId: it.exerciseId, timesPerWeek: times, supportLevel: support });
  }
  return items;
}

/** Therapy goals of one child, newest first (RLS: therapist CRUD, parent read). */
export const getGoals = cache(async (childId: string): Promise<GoalRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  return data ?? [];
});

/** Private clinical notes for one child (RLS: strictly therapist-only). */
export const getTherapistNotes = cache(
  async (childId: string): Promise<TherapistNoteRow[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("therapist_notes")
      .select("*")
      .eq("child_id", childId)
      .order("noted_on", { ascending: false })
      .order("created_at", { ascending: false });
    return data ?? [];
  },
);

/** The therapist's own plan templates, newest first (RLS: owner-only). */
export const getPlanTemplates = cache(async (): Promise<PlanTemplateRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("plan_templates")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
});
