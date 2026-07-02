import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { ExerciseRow } from "@/lib/exercises/types";
import type { SubscriptionRow } from "@/lib/billing";
import type { Child, SessionRow } from "@/lib/data/parent";

export type InviteRow = Database["public"]["Tables"]["invites"]["Row"];

export interface FamilyOverview {
  child: Child;
  parentName: string;
  subscription: SubscriptionRow | null;
  lastSessionAt: string | null;
  sessionsWeek: number;
  sessions30: number;
  unread: number;
}

/** Everything the dashboard table needs, aggregated client-side from 4 queries. */
export const getFamilies = cache(async (therapistId: string): Promise<FamilyOverview[]> => {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [childrenRes, subsRes, sessionsRes, unreadRes] = await Promise.all([
    supabase
      .from("children")
      .select("*, parent:profiles!children_parent_id_fkey(full_name)")
      .eq("therapist_id", therapistId)
      .order("created_at", { ascending: true }),
    supabase.from("subscriptions").select("*"),
    supabase
      .from("sessions")
      .select("id, child_id, started_at")
      .not("completed_at", "is", null)
      .gte("started_at", since.toISOString()),
    supabase
      .from("messages")
      .select("id, child_id")
      .is("read_at", null)
      .neq("sender_id", therapistId)
      .eq("kind", "message"),
  ]);

  const subs = new Map((subsRes.data ?? []).map((s) => [s.child_id, s]));
  const sessions = sessionsRes.data ?? [];
  const unread = unreadRes.data ?? [];

  return (childrenRes.data ?? []).map((row) => {
    const { parent, ...child } = row as Child & { parent: { full_name: string } | null };
    const mine = sessions.filter((s) => s.child_id === child.id);
    const last = mine.reduce<string | null>(
      (acc, s) => (acc === null || s.started_at > acc ? s.started_at : acc),
      null,
    );
    return {
      child,
      parentName: parent?.full_name ?? "—",
      subscription: subs.get(child.id) ?? null,
      lastSessionAt: last,
      sessionsWeek: mine.filter((s) => new Date(s.started_at) >= weekAgo).length,
      sessions30: mine.length,
      unread: unread.filter((m) => m.child_id === child.id).length,
    };
  });
});

/** One child with parent name — 404 guard happens at the caller. */
export const getFamilyChild = cache(async (childId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("children")
    .select("*, parent:profiles!children_parent_id_fkey(full_name)")
    .eq("id", childId)
    .maybeSingle();
  if (!data) return null;
  const { parent, ...child } = data as Child & { parent: { full_name: string } | null };
  return { child: child as Child, parentName: parent?.full_name ?? "—" };
});

/** Whole exercise library visible to this therapist (built-in + own). */
export const getLibrary = cache(async (): Promise<ExerciseRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .order("domain", { ascending: true })
    .order("difficulty", { ascending: true })
    .order("title", { ascending: true });
  return (data ?? []) as ExerciseRow[];
});

export const getInvites = cache(async (): Promise<InviteRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
});

/** Completed sessions of one child (therapist view). */
export async function getChildSessions(childId: string, days = 90): Promise<SessionRow[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("child_id", childId)
    .not("completed_at", "is", null)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false });
  return data ?? [];
}
