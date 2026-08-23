// apps/web/src/app/api/settings/route.ts
//
// User-settings PATCH endpoint. Today this only handles sync_interval_minutes
// (the pill-button row on /settings), but the file is the natural home for
// any future small toggle that doesn't justify its own /api/<thing>/route.
//
// Auth: requires a Supabase session. RLS on user_settings further pins the
// upsert to the caller's uid.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Mirrors the CHECK constraint in 20260622000002_user_sync_interval.sql.
// Keeping it in lockstep on the client side gives us a 400 instead of a
// confusing DB constraint violation.
const PatchSchema = z.object({
  sync_interval_minutes: z.union([
    z.literal(5),
    z.literal(15),
    z.literal(30),
    z.literal(60),
  ]),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      sync_interval_minutes: parsed.data.sync_interval_minutes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    sync_interval_minutes: parsed.data.sync_interval_minutes,
  });
}
