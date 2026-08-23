import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth session refresh. Only the dashboard + auth route groups read
// Supabase cookies, so the middleware is scoped to those paths via the
// `matcher` below. Running on every public marketing page would (a) pull
// the heavy supabase-js core into the edge bundle on every visit and
// (b) trigger the @supabase/supabase-js / process.version edge-runtime
// warning at build time. Scoping is the right fix.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session cookie if present.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Auth-gated dashboard routes — need a live session.
    "/dashboard/:path*",
    "/accounts/:path*",
    "/devices/:path*",
    "/settings/:path*",
    "/tasks/:path*",
    "/welcome/:path*",
    // Auth flow itself — needs to read/write the session cookie.
    "/login",
    "/signup",
    "/forgot-password",
  ],
};
