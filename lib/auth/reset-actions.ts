"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Password-reset server actions. Same conventions as lib/auth/actions.ts:
 * machine-readable error codes, translated by the client forms.
 *
 * requestPasswordResetAction never reveals whether an account exists —
 * an unknown e-mail returns the same success state as a known one.
 */

export type ResetRequestState = {
  error?: "fields" | "rate_limit" | "unknown";
  sent?: boolean;
} | null;

export type UpdatePasswordState = {
  error?: "weak_password" | "mismatch" | "session" | "unknown";
} | null;

export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@") || email.length > 254) return { error: "fields" };

  const origin = await siteOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // The callback exchanges the recovery code for a session, then must land
    // on /reset-password (see wiring note about the `next` param).
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // Rate limiting / infrastructure problems are real errors and are shown;
    // they don't disclose account existence (unknown e-mails succeed).
    if (error.status === 429) return { error: "rate_limit" };
    return { error: "unknown" };
  }
  return { sent: true };
}

export async function updatePasswordAction(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "weak_password" };
  if (password !== confirm) return { error: "mismatch" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // The recovery link creates the session; without it the link expired.
  if (!user) return { error: "session" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "weak_password") return { error: "weak_password" };
    return { error: "unknown" };
  }

  // Same role-home idiom as loginAction.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  redirect(profile?.role === "therapist" ? "/therapist" : "/app");
}

/** Public origin for e-mail links: env override first, then request headers. */
async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
