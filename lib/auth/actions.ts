"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth server actions. They return machine-readable error codes;
 * the client forms translate them via next-intl.
 */

export type AuthState = {
  error?: "invalid" | "unconfirmed" | "exists" | "weak_password" | "rate_limit" | "fields" | "unknown";
  sentTo?: string;
  resent?: boolean;
  /** Posledné zadané hodnoty — React po dobehnutí action resetuje formulár,
   *  formuláre ich vrátia cez defaultValue, aby chyba nezmazala vyplnené polia. */
  values?: { email?: string; fullName?: string };
} | null;

function safeNext(next: unknown): string | null {
  return typeof next === "string" && /^\/(app|therapist)(\/|$)/.test(next) ? next : null;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "fields" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const values = { email };
    if (error.code === "email_not_confirmed") return { error: "unconfirmed", sentTo: email, values };
    if (error.code === "invalid_credentials") return { error: "invalid", values };
    if (error.status === 429) return { error: "rate_limit", values };
    return { error: "unknown", values };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const home = profile?.role === "therapist" ? "/therapist" : "/app";
  const next = safeNext(formData.get("next"));
  redirect(next && next.startsWith(home) ? next : home);
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const role = formData.get("role") === "therapist" ? "therapist" : "parent";
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent") === "on";

  const values = { email, fullName };
  if (!fullName || !email || !consent) return { error: "fields", values };
  if (password.length < 8) return { error: "weak_password", values };

  const locale = await getLocale();
  const origin = await requestOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName, locale },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists")
      return { error: "exists", values };
    if (error.code === "weak_password") return { error: "weak_password", values };
    if (error.status === 429) return { error: "rate_limit", values };
    return { error: "unknown", values };
  }

  // Supabase obfuscates duplicate signups: existing users come back with no identities.
  if (data.user && (data.user.identities?.length ?? 0) === 0) return { error: "exists", values };

  // If e-mail confirmation is disabled, signUp already returns a session —
  // skip the (fragile) e-mail round-trip and go straight into the app.
  if (data.session) redirect(role === "therapist" ? "/therapist" : "/app");

  return { sentTo: email };
}

export async function resendConfirmationAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "fields" };

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { error: error.status === 429 ? "rate_limit" : "unknown" };
  return { sentTo: email, resent: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
