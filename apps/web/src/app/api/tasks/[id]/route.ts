import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TaskStatusSchema } from "@inbox/shared";
import { createServerClient } from "@/lib/supabase/server";

const PatchSchema = z
  .object({
    status: TaskStatusSchema.optional(),
    snooze_until: z.string().datetime().nullable().optional(),
  })
  .refine((v) => v.status !== undefined || v.snooze_until !== undefined, {
    message: "At least one of status or snooze_until is required.",
  });

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const paramsParsed = ParamsSchema.safeParse(resolved);
  if (!paramsParsed.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
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

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.snooze_until !== undefined) {
    if (parsed.data.snooze_until !== null && parsed.data.status === undefined) {
      update.status = "snoozed";
    }
    update.snooze_until = parsed.data.snooze_until;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", paramsParsed.data.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "update_failed", message: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolved = await params;
  const paramsParsed = ParamsSchema.safeParse(resolved);
  if (!paramsParsed.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", paramsParsed.data.id);

  if (error) {
    return NextResponse.json(
      { error: "delete_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
