import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_EMAIL = "satyamkamat4@gmail.com";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    try {
      const decoded = decodeURIComponent(session);
      const parsed = JSON.parse(decoded);
      if (parsed.email !== ADMIN_EMAIL) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const decoded = decodeURIComponent(session);
      const parsed = JSON.parse(decoded);
      if (parsed.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
