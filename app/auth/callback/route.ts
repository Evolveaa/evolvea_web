import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE callback — exchanges the ?code= from confirmation / recovery e-mails
 * for a session, then hands off to /app (section layouts route by role).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/app`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
