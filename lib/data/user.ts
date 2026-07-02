import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Authenticated user + profile for the current request (deduped via cache()).
 * Returns null when signed out or the profile row is missing.
 */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { user, profile } : null;
});

/**
 * Section guard: redirects signed-out users to /login and users with the
 * other role to their own home. RLS remains the actual security boundary —
 * this only keeps navigation coherent.
 */
export async function requireRole(role: Profile["role"]): Promise<Profile> {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (session.profile.role !== role)
    redirect(session.profile.role === "therapist" ? "/therapist" : "/app");
  return session.profile;
}
