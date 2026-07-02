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

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}/app`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/app`);
  }

  return NextResponse.redirect(`${origin}/login?confirm=1`);
}
