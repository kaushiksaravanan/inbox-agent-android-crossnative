import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  action: z.literal("create"),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = await createServiceRoleClient();
  const { data, error } = await admin.functions.invoke("pair-device", {
    body: { action: "create", user_id: user.id },
  });
  if (error) {
    return NextResponse.json(
      { error: "pair_device_failed", message: error.message },
      { status: 500 }
    );
  }

  const obj = (data ?? {}) as { code?: string; expires_at?: string };
  if (!obj.code || !obj.expires_at) {
    return NextResponse.json(
      { error: "pair_device_invalid_response" },
      { status: 500 }
    );
  }

  return NextResponse.json({ code: obj.code, expires_at: obj.expires_at });
}
