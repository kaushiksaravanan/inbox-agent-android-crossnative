import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");
  const requestedNext = searchParams.get("next");

  if (errorDescription) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", errorDescription);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  if (requestedNext && requestedNext.startsWith("/")) {
    return NextResponse.redirect(new URL(requestedNext, origin));
  }

  // Local-first: account state lives in the browser. The dashboard's own
  // empty-state walks the user through connecting Gmail if none is connected.
  return NextResponse.redirect(new URL("/dashboard", origin));
}
