import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

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
    "connect-src 'self' https://*.r2.dev https://*.cloudflarestorage.com https://*.neon.tech https://login.microsoftonline.com; " +
    "frame-ancestors 'none';",
}

// Protected routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/tickets",
  "/analytics",
  "/teams",
  "/masters",
  "/settings",
  "/master-data",
  "/admin",
]

// Public routes that should redirect to dashboard if already authenticated
const publicRoutes = ["/", "/login", "/signup"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check for NextAuth session token
  let nextAuthToken = null
  try {
    nextAuthToken = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  } catch (error) {
    // NextAuth not configured or error, continue with cookie-based auth
    console.log("NextAuth token check failed, using cookie-based auth")
  }

  // Check for cookie-based auth (backward compatibility)
  const userCookie = request.cookies.get("user")?.value

  // Check if user is authenticated (either via NextAuth or cookie)
  const isAuthenticated = !!nextAuthToken || !!userCookie

  let response: NextResponse

  // If user is authenticated and trying to access public routes, redirect to dashboard
  if (isAuthenticated && publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    response = NextResponse.redirect(new URL("/dashboard", request.url))
  }
  // If user is not authenticated and trying to access protected routes, redirect to login
  else if (
    !isAuthenticated &&
    protectedRoutes.some((route) => pathname.startsWith(route))
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
