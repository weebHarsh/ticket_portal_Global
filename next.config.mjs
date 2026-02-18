/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Security headers to protect against common web attacks
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy - Prevents XSS attacks
          // Note: 'unsafe-eval' may be needed in development mode for Next.js hot reload
          // Consider using nonce-based CSP in production for better security
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow Vercel's live feedback script in production
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://vercel.app", // Allow Vercel scripts
              "script-src-elem 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://vercel.app", // Explicitly allow script elements from Vercel
              "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' required for Tailwind CSS
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: https://vercel.live https://va.vercel-scripts.com https://vercel.app", // Allow Vercel connections
              "frame-ancestors 'none'", // Prevents embedding in iframes (clickjacking protection)
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests", // Automatically upgrade HTTP to HTTPS
            ].join('; '),
          },
          // HTTP Strict Transport Security - Forces HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // X-Frame-Options - Prevents clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // X-Content-Type-Options - Prevents MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-XSS-Protection - Legacy XSS protection (still useful for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer-Policy - Controls referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions-Policy - Restricts browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // DNS Prefetch Control - Performance optimization
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },
  // Experimental features configuration
  experimental: {
    serverActions: {
      // Limit request body size to prevent large payload attacks
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
