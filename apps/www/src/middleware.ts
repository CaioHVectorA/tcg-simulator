import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("lang");
  if (!language || !["pt", "en", "es", "jp", "ja"].includes(language)) return NextResponse.next();
  const locale = language === "ja" ? "jp" : language;
  const headers = new Headers(request.headers);
  const existing = (headers.get("cookie") || "").split(";").filter((entry) => !entry.trim().startsWith("tcg_locale=")).filter(Boolean);
  headers.set("cookie", [...existing, `tcg_locale=${locale}`].join("; "));
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set("tcg_locale", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}
export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
