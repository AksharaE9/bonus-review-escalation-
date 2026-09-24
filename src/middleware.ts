import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Attach unique correlation request_id
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // 2. Allow public assets, health probe, and auth APIs to pass through without session checks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/static") ||
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname === "/register" ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // 3. Inspect JWT token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Not signed in -> redirect to sign-in
  if (!token) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = token.role as string;
  const mustChangePassword = Boolean(token.mustChangePassword);

  // Forced password change flow
  if (mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  if (!mustChangePassword && pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-gated section protections
  // USER role cannot access /employees, /audit, /settings
  if (role === "USER") {
    if (
      pathname.startsWith("/employees") ||
      pathname.startsWith("/audit") ||
      pathname.startsWith("/settings")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // LEAD role cannot access /audit or /settings
  if (role === "LEAD") {
    if (pathname.startsWith("/audit") || pathname.startsWith("/settings")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
