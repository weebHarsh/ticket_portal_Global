import { type NextRequest, NextResponse } from "next/server"

// OWASP: Security headers
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://*.r2.dev https://*.cloudflarestorage.com https://*.neon.tech; " +
    "frame-ancestors 'none';",
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const user = request.cookies.get("user")?.value

  let response: NextResponse

  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (user && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
    response = NextResponse.redirect(new URL("/dashboard", request.url))
  }
  // If user is not logged in and trying to access protected routes, redirect to login
  else if (
    !user &&
    ["/dashboard", "/tickets", "/analytics", "/teams", "/masters", "/settings", "/master-data", "/admin"].some((route) =>
      pathname.startsWith(route),
    )
  ) {
    response = NextResponse.redirect(new URL("/login", request.url))
  }
  else {
    response = NextResponse.next()
  }

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/tickets/:path*",
    "/analytics/:path*",
    "/teams/:path*",
    "/masters/:path*",
    "/settings/:path*",
    "/master-data/:path*",
    "/admin/:path*",
  ],
}
