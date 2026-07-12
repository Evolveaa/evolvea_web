"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DOMAINS, type ExerciseDomain } from "@/lib/exercises/types";
import type { Json } from "@/lib/database.types";
import type { TemplateItem } from "@/lib/data/clinical";

/* ------------------------------------------------------------------ *
 * Shared result shapes — every action returns a typed state so the UI
 * can always surface a failure instead of silently swallowing it.
 * ------------------------------------------------------------------ */

/** Form actions driven by useActionState. `ok` closes/resets the form. */
export type ClinicalFormState = { error?: "fields" | "unknown"; ok?: true } | null;

/** Row-level actions invoked directly from the client (delete, status). */
export type ClinicalActionState = { error: "fields" | "unknown" } | null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

/** Optional integer form field: "" → null, junk/out-of-range → undefined. */
function optionalInt(raw: string, min: number, max: number): number | null | undefined {
  if (raw === "") return null;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < min || n > max) return undefined;
  return n;
}

/** Child detail aggregates data from many tables — revalidate broadly, like publishPlanAction. */
function revalidateChildDetail(): void {
  revalidatePath("/", "layout");
}

/* ------------------------------- goals ------------------------------- */

export async function createGoalAction(
  _prev: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const childId = String(formData.get("child_id") ?? "");
  const domain = String(formData.get("domain") ?? "") as ExerciseDomain;
  const title = String(formData.get("title") ?? "").trim();
  const targetPct = optionalInt(String(formData.get("target_pct") ?? "").trim(), 1, 100);
  const baselinePct = optionalInt(String(formData.get("baseline_pct") ?? "").trim(), 0, 100);
  const targetDateRaw = String(formData.get("target_date") ?? "").trim();

  if (
    !UUID_RE.test(childId) ||
    !DOMAINS.includes(domain) ||
    !title ||
    title.length > 300 ||
    targetPct === undefined ||
    baselinePct === undefined ||
    (targetDateRaw !== "" && !isIsoDate(targetDateRaw))
  )
    return { error: "fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const { error } = await supabase.from("goals").insert({
    child_id: childId,
    therapist_id: user.id,
    domain,
    title,
    target_pct: targetPct,
    baseline_pct: baselinePct,
    target_date: targetDateRaw || null,
  });

  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return { ok: true };
}

export async function setGoalStatusAction(formData: FormData): Promise<ClinicalActionState> {
  const goalId = String(formData.get("goal_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID_RE.test(goalId) || !["active", "achieved", "archived"].includes(status))
    return { error: "fields" };

  const supabase = await createClient();
  const patch: { status: string; achieved_at?: string | null } = { status };
  // achieved stamps the moment; re-activating clears it; archiving keeps history
  if (status === "achieved") patch.achieved_at = new Date().toISOString();
  if (status === "active") patch.achieved_at = null;

  const { error } = await supabase.from("goals").update(patch).eq("id", goalId);
  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return null;
}

export async function deleteGoalAction(formData: FormData): Promise<ClinicalActionState> {
  const goalId = String(formData.get("goal_id") ?? "");
  if (!UUID_RE.test(goalId)) return { error: "fields" };
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", goalId);
  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return null;
}

/* ------------------------------- notes ------------------------------- */

export async function addNoteAction(
  _prev: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const childId = String(formData.get("child_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const notedOnRaw = String(formData.get("noted_on") ?? "").trim();

  if (
    !UUID_RE.test(childId) ||
    !body ||
    body.length > 8000 ||
    (notedOnRaw !== "" && !isIsoDate(notedOnRaw))
  )
    return { error: "fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const { error } = await supabase.from("therapist_notes").insert({
    child_id: childId,
    therapist_id: user.id,
    body,
    // omit noted_on entirely when blank → DB default (today)
    ...(notedOnRaw ? { noted_on: notedOnRaw } : {}),
  });

  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return { ok: true };
}

export async function deleteNoteAction(formData: FormData): Promise<ClinicalActionState> {
  const noteId = String(formData.get("note_id") ?? "");
  if (!UUID_RE.test(noteId)) return { error: "fields" };
  const supabase = await createClient();
  const { error } = await supabase.from("therapist_notes").delete().eq("id", noteId);
  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return null;
}

/* ----------------------------- templates ----------------------------- */

/** Parse + validate the items payload: 1–30 well-formed builder items. */
function parseItemsInput(raw: string): TemplateItem[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 30) return null;
  const items: TemplateItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const it = entry as Record<string, unknown>;
    if (typeof it.exerciseId !== "string" || !UUID_RE.test(it.exerciseId)) return null;
    if (
      typeof it.timesPerWeek !== "number" ||
      !Number.isInteger(it.timesPerWeek) ||
      it.timesPerWeek < 1 ||
      it.timesPerWeek > 7
    )
      return null;
    if (
      typeof it.supportLevel !== "number" ||
      !Number.isInteger(it.supportLevel) ||
      it.supportLevel < 1 ||
      it.supportLevel > 3
    )
      return null;
    items.push({
      exerciseId: it.exerciseId,
      timesPerWeek: it.timesPerWeek,
      supportLevel: it.supportLevel,
    });
  }
  return items;
}

export async function saveTemplateAction(
  _prev: ClinicalFormState,
  formData: FormData,
): Promise<ClinicalFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const items = parseItemsInput(String(formData.get("items") ?? ""));

  if (!title || title.length > 200 || description.length > 600 || items === null)
    return { error: "fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const { error } = await supabase.from("plan_templates").insert({
    therapist_id: user.id,
    title,
    description: description || null,
    items: items as unknown as Json,
  });

  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return { ok: true };
}

export async function deleteTemplateAction(formData: FormData): Promise<ClinicalActionState> {
  const templateId = String(formData.get("template_id") ?? "");
  if (!UUID_RE.test(templateId)) return { error: "fields" };
  const supabase = await createClient();
  const { error } = await supabase.from("plan_templates").delete().eq("id", templateId);
  if (error) return { error: "unknown" };
  revalidateChildDetail();
  return null;
}
