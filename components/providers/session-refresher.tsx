"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

/**
 * SessionRefresher - Silently refreshes NextAuth session on window focus and mount
 * 
 * This component ensures that role changes and other user data updates in the database
 * are reflected in the session without requiring the user to sign out and back in.
 * 
 * Behavior:
 * - Calls session.update() when browser window regains focus (user switches back to tab)
 * - Calls session.update() once on component mount (catches changes while tab was open)
 * - Syncs session data to localStorage for backward compatibility
 * - Only runs when user is authenticated
 * - No UI - purely behavioral component
 */
export function SessionRefresher() {
  const { data: session, status, update } = useSession()
  const hasRefreshedOnMount = useRef(false)
  const lastUserId = useRef<string | null>(null)

  // Sync session data to localStorage when session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userId = session.user.id || ""
      // Only update localStorage if user ID changed (to avoid unnecessary updates)
      if (userId !== lastUserId.current) {
        const userData = {
          id: parseInt(userId || "0"),
          email: session.user.email || "",
          full_name: session.user.name || "",
          role: session.user.role || "user",
          business_unit_group_id: session.user.business_unit_group_id || null,
          group_name: session.user.group_name || "",
          auth_provider: session.user.auth_provider || "email",
        }
        localStorage.setItem("user", JSON.stringify(userData))
        localStorage.setItem("isLoggedIn", "true")
        lastUserId.current = userId
      }
    }
  }, [status, session])

  useEffect(() => {
    // Only run when authenticated
    if (status !== "authenticated" || !session) {
      return
    }

    // Refresh session once on mount (catches role changes while tab was open)
    if (!hasRefreshedOnMount.current) {
      hasRefreshedOnMount.current = true
      update().catch((error) => {
        console.error("Session refresh error on mount:", error)
      })
    }

    // Refresh session when window regains focus (user switches back to tab)
    const handleFocus = () => {
      update().catch((error) => {
        console.error("Session refresh error on focus:", error)
      })
    }

    window.addEventListener("focus", handleFocus)

    // Cleanup
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [status, session, update])

  // This component renders nothing
  return null
}
