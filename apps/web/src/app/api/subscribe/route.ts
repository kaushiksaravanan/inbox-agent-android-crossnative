import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const subscribeSchema = z.object({
  email: z.string().email(),
});

// 3 marketing signups per IP per minute. A real human enters their email
// once; anything more is bot activity.
const limit = rateLimit({ bucket: "subscribe", max: 3, windowMs: 60_000 });

export async function POST(req: Request) {
  const rate = limit(req);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email" },
      { status: 400 },
    );
  }

  // For now, just log. Wire to a real ESP (Resend, ConvertKit, etc.) later.
  console.log(`[subscribe] new signup: ${parsed.data.email}`);

  return NextResponse.json({ ok: true });
}
