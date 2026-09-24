import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSafeCallbackUrl } from "@/lib/auth-routes";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Correlation Request ID
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Helper response builder with anti-caching headers for protected routes
  const createNextResponse = (isProtected = false) => {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set("x-request-id", requestId);
    if (isProtected) {
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      );
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");
    }
    return response;
  };

  // Rule 0: Bypass static assets, Next.js internal chunks, favicons, and public API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Rule 1: Allow public root landing page through
  if (pathname === "/") {
    return createNextResponse(false);
  }

  // Inspect JWT session token (supporting both standard and __Secure- cookie variants on HTTPS)
  const isSecure =
    request.url.startsWith("https://") ||
    request.headers.get("x-forwarded-proto") === "https" ||
    process.env.NODE_ENV === "production";

  let token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecure,
  });

  if (!token) {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName: isSecure
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      secureCookie: isSecure,
    });
  }

  if (!token) {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: false,
    });
  }

  const isAuthenticated = Boolean(token);

  // Rule 2: Authenticated user hitting /sign-in -> redirect to /dashboard
  if (isAuthenticated && pathname === "/sign-in") {
    const rawCallbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const target = rawCallbackUrl ? getSafeCallbackUrl(rawCallbackUrl) : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Allow unauthenticated visitors to view /sign-in
  if (!isAuthenticated && pathname === "/sign-in") {
    return createNextResponse(false);
  }

  // Rule 3: Unauthenticated user hitting any protected path -> redirect to /sign-in with callbackUrl
  if (!isAuthenticated) {
    const originalPathWithQuery = pathname + (search || "");
    const safeOriginal = getSafeCallbackUrl(originalPathWithQuery);
    const signInUrl = new URL("/sign-in", request.url);
    if (safeOriginal && safeOriginal !== "/sign-in" && safeOriginal !== "/") {
      signInUrl.searchParams.set("callbackUrl", safeOriginal);
    }
    return NextResponse.redirect(signInUrl);
  }

  // Rule 4: Authenticated user with mustChangePassword = true
  const mustChangePassword = Boolean(token?.mustChangePassword);

  if (mustChangePassword) {
    if (pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return createNextResponse(true);
  }

  // If user completed password change and navigates to /change-password, redirect to /dashboard
  if (!mustChangePassword && pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rule 5: Pass authenticated requests to server pages/actions
  return createNextResponse(true);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|json|woff|woff2|ttf|eot)$).*)",
  ],
};
