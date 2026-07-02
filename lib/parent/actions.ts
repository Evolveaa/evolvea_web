"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_CHILD_COOKIE } from "@/lib/data/parent";
import type { Json } from "@/lib/database.types";

const YEAR = 60 * 60 * 24 * 365;

export type RedeemState = { error?: "invalid_code" | "only_parent" | "fields" | "unknown" } | null;

/** Link a child to this parent account using the therapist's invite code. */
export async function redeemInviteAction(
  _prev: RedeemState,
  formData: FormData,
): Promise<RedeemState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "fields" };

  const supabase = await createClient();
  const { data: childId, error } = await supabase.rpc("redeem_invite", { p_code: code });

  if (error) {
    if (error.message.includes("invalid_code")) return { error: "invalid_code" };
    if (error.message.includes("only_parent")) return { error: "only_parent" };
    return { error: "unknown" };
  }

  const store = await cookies();
  store.set(ACTIVE_CHILD_COOKIE, childId, { path: "/", maxAge: YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
  return null;
}

export async function setActiveChildAction(childId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_CHILD_COOKIE, childId, { path: "/", maxAge: YEAR, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export type ChildUpdateState = { error?: "fields" | "unknown"; ok?: boolean } | null;

export async function updateChildAction(
  _prev: ChildUpdateState,
  formData: FormData,
): Promise<ChildUpdateState> {
  const childId = String(formData.get("child_id") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const avatar = String(formData.get("avatar") ?? "").trim() || "🦊";
  const birthYearRaw = String(formData.get("birth_year") ?? "").trim();
  const birthYear = birthYearRaw ? Number.parseInt(birthYearRaw, 10) : null;

  if (!childId || !firstName || firstName.length > 60) return { error: "fields" };
  if (birthYear !== null && (Number.isNaN(birthYear) || birthYear < 2005 || birthYear > 2030))
    return { error: "fields" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("children")
    .update({ first_name: firstName, avatar: avatar.slice(0, 8), birth_year: birthYear })
    .eq("id", childId);

  if (error) return { error: "unknown" };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** GDPR: parent may erase all of a child's data (cascades sessions, plans, messages). */
export async function deleteChildAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("child_id") ?? "");
  if (!childId) return;
  const supabase = await createClient();
  await supabase.from("children").delete().eq("id", childId);
  const store = await cookies();
  store.delete(ACTIVE_CHILD_COOKIE);
  revalidatePath("/", "layout");
}

export type MessageState = { error?: "fields" | "unknown" } | null;

export async function sendMessageAction(
  _prev: MessageState,
  formData: FormData,
): Promise<MessageState> {
  const childId = String(formData.get("child_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!childId || !body || body.length > 4000) return { error: "fields" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unknown" };

  const { error } = await supabase
    .from("messages")
    .insert({ child_id: childId, sender_id: user.id, body });

  if (error) return { error: "unknown" };
  revalidatePath("/", "layout");
  return null;
}

/** Mark everything in a child's thread that others sent as read. */
export async function markThreadReadAction(childId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("child_id", childId)
    .is("read_at", null)
    .neq("sender_id", user.id);
  revalidatePath("/", "layout");
}

export interface SessionPayload {
  childId: string;
  exerciseId: string;
  planItemId: string | null;
  supportLevel: number;
  startedAt: string;
  durationSeconds: number;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  hintsUsed: number;
  detail: Json | null;
  parentNote: string;
}

export async function completeSessionAction(
  payload: SessionPayload,
): Promise<{ ok: boolean }> {
  const detailSize = payload.detail ? JSON.stringify(payload.detail).length : 0;
  if (detailSize > 40_000 || payload.parentNote.length > 2000) return { ok: false };

  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, Math.round(n)));

  const supabase = await createClient();
  const { error } = await supabase.from("sessions").insert({
    child_id: payload.childId,
    exercise_id: payload.exerciseId,
    plan_item_id: payload.planItemId,
    support_level: clamp(payload.supportLevel, 1, 3),
    started_at: new Date(payload.startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: clamp(payload.durationSeconds, 0, 60 * 60 * 4),
    score_correct: payload.scoreCorrect === null ? null : clamp(payload.scoreCorrect, 0, 999),
    score_total: payload.scoreTotal === null ? null : clamp(payload.scoreTotal, 0, 999),
    hints_used: clamp(payload.hintsUsed, 0, 999),
    detail: payload.detail,
    parent_note: payload.parentNote.trim() || null,
  });

  if (error) return { ok: false };
  revalidatePath("/", "layout");
  return { ok: true };
}
