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

export type CheckoutState = { error?: "fields" | "unknown"; ok?: boolean } | null;

/**
 * Mock payment gateway: no card data is read or stored, nothing is charged.
 * Flips the child's subscription to `active` — the DB trigger enforces
 * legal transitions and stamps `activated_at`.
 */
export async function activateSubscriptionAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const childId = String(formData.get("child_id") ?? "");
  if (!childId) return { error: "fields" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status: "active" })
    .eq("child_id", childId)
    .neq("status", "active")
    .select("id");

  if (error || !data || data.length === 0) return { error: "unknown" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function cancelSubscriptionAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("child_id") ?? "");
  if (!childId) return;
  const supabase = await createClient();
  await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("child_id", childId)
    .eq("status", "active");
  revalidatePath("/", "layout");
}

export interface SessionPayload {
  childId: string;
  exerciseId: string;
  planItemId: string | null;
  supportLevel: number;
  startedAt: string;
  scoreCorrect: number | null;
  scoreTotal: number | null;
  hintsUsed: number;
  detail: Json | null;
  parentNote: string;
  /** Recorded speech attempts to attach to this session + queue for assessment. */
  speechAttemptIds?: string[];
}

export async function completeSessionAction(
  payload: SessionPayload,
): Promise<{ ok: boolean }> {
  const detailSize = payload.detail ? JSON.stringify(payload.detail).length : 0;
  if (detailSize > 40_000 || payload.parentNote.length > 2000) return { ok: false };

  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, Math.round(n)));

  // duration derives from startedAt server-side — clients only report the start
  const startedMs = new Date(payload.startedAt).getTime();
  const durationSeconds = Number.isFinite(startedMs)
    ? (Date.now() - startedMs) / 1000
    : 0;

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      child_id: payload.childId,
      exercise_id: payload.exerciseId,
      plan_item_id: payload.planItemId,
      support_level: clamp(payload.supportLevel, 1, 3),
      started_at: new Date(payload.startedAt).toISOString(),
      completed_at: new Date().toISOString(),
      duration_seconds: clamp(durationSeconds, 0, 60 * 60 * 4),
      score_correct: payload.scoreCorrect === null ? null : clamp(payload.scoreCorrect, 0, 999),
      score_total: payload.scoreTotal === null ? null : clamp(payload.scoreTotal, 0, 999),
      hints_used: clamp(payload.hintsUsed, 0, 999),
      detail: payload.detail,
      parent_note: payload.parentNote.trim() || null,
    })
    .select("id")
    .single();

  if (error || !session) return { ok: false };

  // Attach any recorded speech attempts to this session, then queue assessment.
  const attemptIds = (payload.speechAttemptIds ?? []).filter(Boolean).slice(0, 20);
  if (attemptIds.length > 0) {
    await supabase
      .from("speech_attempts")
      .update({ session_id: session.id })
      .in("id", attemptIds)
      .is("session_id", null);
    // fire the async STT→LLM pipeline; the function returns immediately and
    // processes in the background, then writes results back into this session
    await Promise.all(
      attemptIds.map((id) =>
        supabase.functions
          .invoke("assess-speech", { body: { attempt_id: id } })
          .catch(() => null),
      ),
    );
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export interface SpeechAttemptInput {
  childId: string;
  exerciseId: string;
  itemIndex: number;
  prompt: string;
  expect: string[];
  minExpected?: number;
  audioPath: string;
  audioMime: string;
  lang: string;
}

/** Record one recorded speech attempt (audio already uploaded to storage). */
export async function createSpeechAttemptAction(
  input: SpeechAttemptInput,
): Promise<{ ok: boolean; attemptId?: string }> {
  const expect = (input.expect ?? []).map((s) => String(s)).slice(0, 40);
  if (!input.childId || !input.exerciseId || !input.audioPath || expect.length === 0)
    return { ok: false };

  const minExpected =
    typeof input.minExpected === "number" && input.minExpected >= 0
      ? Math.min(input.minExpected, expect.length)
      : Math.max(1, Math.ceil(expect.length * 0.6));
  const lang = ["sk", "en", "de"].includes(input.lang) ? input.lang : "sk";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("speech_attempts")
    .insert({
      child_id: input.childId,
      exercise_id: input.exerciseId,
      item_index: Math.max(0, Math.round(input.itemIndex)),
      prompt: input.prompt.slice(0, 1000),
      expected: expect,
      min_expected: minExpected,
      lang,
      audio_path: input.audioPath.slice(0, 400),
      audio_mime: input.audioMime.slice(0, 80),
      status: "uploaded",
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false };
  return { ok: true, attemptId: data.id };
}

/** GDPR: parent grants or withdraws consent to record this child's voice. */
export async function setSpeechConsentAction(formData: FormData): Promise<void> {
  const childId = String(formData.get("child_id") ?? "");
  const consent = String(formData.get("consent") ?? "") === "on";
  if (!childId) return;
  const supabase = await createClient();
  await supabase
    .from("children")
    .update({ speech_consent_at: consent ? new Date().toISOString() : null })
    .eq("id", childId);
  revalidatePath("/", "layout");
}
