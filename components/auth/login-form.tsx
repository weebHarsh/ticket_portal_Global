"use client"

import { useState, useEffect, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"
import { AlertCircle, LogIn } from "lucide-react"
import { useTheme } from "next-themes"

interface User {
  id: string
  name: string
  email: string
  role: string
  group: string
}

// Map NextAuth error codes to user-friendly messages
const errorMessages: Record<string, string> = {
  AccessDenied: "Authentication failed. This may be due to a database connection issue. Please try again or contact support if the problem persists.",
  Configuration: "There is a problem with the server configuration. Please contact support.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during sign-in. Please try again.",
}

export function LoginForm() {
  const router = useRouter()
  const { setTheme } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSSOLoading, setIsSSOLoading] = useState(false)

  // Force light mode on login page
  useEffect(() => {
    setTheme("light")
  }, [setTheme])

  // Check for error in URL query parameters (from NextAuth redirects)
  useEffect(() => {
    // Read error from URL search params (client-side only)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get("error")
      if (errorParam) {
        const errorMessage = errorMessages[errorParam] || errorMessages.Default
        setError(errorMessage)
        // Clean up the URL by removing the error parameter
        urlParams.delete("error")
        const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "")
        window.history.replaceState({}, "", newUrl)
      }
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError("Email and password are required")
        return
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show the actual error message from the server
        const errorMsg = data.error || data.details || "Invalid email or password"
        console.error("[LoginForm] Login failed:", errorMsg)
        setError(errorMsg)
        return
      }

      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("isLoggedIn", "true")

      // Set cookie so middleware can verify authentication
      document.cookie = `user=${JSON.stringify(data.user)}; path=/; max-age=86400`

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("[LoginForm] Network error:", err)
      const errorMessage = err instanceof Error ? err.message : "Network error"
      if (errorMessage.includes("fetch failed") || errorMessage.includes("Failed to fetch")) {
        setError("Unable to connect to the server. Please check your internet connection and try again.")
      } else {
        setError("Login failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    setError("")
    setIsSSOLoading(true)
    try {
      // Use redirect: true to let NextAuth handle the OAuth flow
      await signIn("azure-ad", {
        redirect: true,
        callbackUrl: "/dashboard",
      })
      // Note: We don't need to handle result here because redirect: true
      // will automatically redirect to Microsoft login page
    } catch (err) {
      console.error("Microsoft sign-in error:", err)
      setError("Microsoft sign-in failed. Please try again.")
      setIsSSOLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-xl shadow-2xl p-8 border border-border">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Image
            src="/company-logo.svg"
            alt="Company Logo"
            width={60}
            height={60}
            className="w-15 h-15 mx-auto mb-4"
          />
          <h1 className="text-3xl font-poppins font-bold text-foreground">Ticket Portal</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Microsoft SSO Button */}
        <button
          type="button"
          onClick={handleMicrosoftSignIn}
          disabled={isSSOLoading || isLoading}
          className="w-full mb-4 bg-card border-2 border-border text-foreground font-sans font-semibold py-3 rounded-lg hover:bg-surface hover:border-primary transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 23 23"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="0" y="0" width="11" height="11" fill="#F25022" />
            <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
            <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
            <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
          </svg>
          {isSSOLoading ? "Signing in..." : "Sign in with Microsoft"}
        </button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-gradient-to-r from-primary to-secondary text-white font-sans font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <LogIn className="w-5 h-5" />
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Signup Link */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary underline">
              Sign up
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-white text-xs mt-6 opacity-75">Internal Portal</p>
    </div>
  )
}

export default LoginForm
