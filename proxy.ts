import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

/**
 * Session-refreshing proxy (Next 16 replacement for middleware).
 *  - keeps Supabase auth cookies fresh on app routes
 *  - gates /app and /therapist behind authentication (role gating lives in
 *    the section layouts — RLS is the actual security boundary)
 *  - bounces already-authenticated users away from /login and /register
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Confirmation e-mails may land on the site root with a PKCE ?code= param —
  // forward those to the callback route that exchanges it for a session.
  if (pathname === "/") {
    if (searchParams.has("code")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /** Redirect while preserving any refreshed auth cookies. */
  function redirectTo(path: string, next?: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  const isProtected =
    pathname.startsWith("/app") || pathname.startsWith("/therapist");
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (!user && isProtected) return redirectTo("/login", pathname);
  if (user && isAuthPage) return redirectTo("/app");

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/app/:path*",
    "/therapist/:path*",
    "/login",
    "/register",
    "/auth/:path*",
  ],
};
