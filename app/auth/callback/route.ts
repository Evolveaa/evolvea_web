import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Confirmation / recovery callback.
 *
 * Handles both link shapes Supabase can send:
 *  - token_hash + type  → verifyOtp (works even without the PKCE cookie)
 *  - code               → exchangeCodeForSession (PKCE)
 *
 * Confirmation links are single-use. Mail providers (Gmail…) pre-scan links,
 * so the token is frequently already consumed by the time the human clicks —
 * the very first hit confirms the account and later hits fail. When the
 * exchange fails we therefore send the user to /login with a calm "you're
 * confirmed, just sign in" notice rather than a scary error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Password-recovery links must land on the new-password form. Strict
  // allow-list — never redirect to an arbitrary query value.
  const next = searchParams.get("next");
  const safeNext =
    next === "/reset-password" || type === "recovery" ? "/reset-password" : null;
  const target = `${origin}${safeNext ?? "/app"}`;

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(target);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(target);
  }

  // Failed exchange. For recovery links the "you're confirmed, just sign in"
  // notice would be a dead end (the user forgot their password) — send them
  // to /reset-password, whose no-session branch explains the expired link.
  if (safeNext) return NextResponse.redirect(`${origin}${safeNext}`);
  return NextResponse.redirect(`${origin}/login?confirm=1`);
}
