import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  // Same-origin POST + encrypted NextAuth cookie; the ID token never enters client session data.
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "auth.unauthorized" }, { status: 403 });
  }
  const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (typeof session?.googleIdToken !== "string") {
    return NextResponse.json({ ok: false, error: "auth.invalidCredentials" }, { status: 401 });
  }
  try {
    const { referrer } = await request.json();
    const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!base) return NextResponse.json({ ok: false, error: "auth.googleUnavailable" }, { status: 503 });
    const response = await fetch(`${base}/auth/google`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Locale": request.headers.get("X-Locale") || "pt" },
      body: JSON.stringify({ idToken: session.googleIdToken, referrer }),
      signal: AbortSignal.timeout(15_000), cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ ok: false, error: "auth.googleUnavailable" }, { status: 502 });
  }
}
