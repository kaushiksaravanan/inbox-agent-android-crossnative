// APK download endpoint, gated behind a redeem token.
//
// The token must be a canonical invite code from /lib/invite-codes — the
// same set /api/redeem validates against. The landing/footer/redeem links
// all pass the normalized code as ?token=, so the only way through is to
// have actually redeemed.

import { NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { isValidCode } from "@/lib/invite-codes";

export const dynamic = "force-dynamic";

const APK_PATH = join(process.cwd(), "public", "downloads", "inbox-agent-android.apk");

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token || !isValidCode(token)) {
    return NextResponse.json(
      {
        ok: false,
        error: "access_required",
        message: "A valid license or invite code is required to download the APK. Visit /pricing to purchase or enter an invite code.",
      },
      { status: 403 },
    );
  }

  let size: number;
  try {
    size = statSync(APK_PATH).size;
  } catch {
    return NextResponse.json({ ok: false, error: "file_not_found" }, { status: 404 });
  }

  const body = Readable.toWeb(createReadStream(APK_PATH)) as ReadableStream<Uint8Array>;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="inbox-agent.apk"',
      "Content-Length": String(size),
      "Cache-Control": "private, no-store",
    },
  });
}
