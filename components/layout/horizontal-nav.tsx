"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import {
  Home,
  TicketIcon,
  BarChart3,
  Database,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import NotificationsDropdown from "./notifications-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"

interface UserData {
  id: number
  email: string
  full_name: string
  role: string
  business_unit_group_id?: number
  group_name?: string
}

export default function HorizontalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [user, setUser] = useState<UserData | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load user data from session or localStorage
  useEffect(() => {
    try {
      // Prioritize NextAuth session data (for SSO users)
      if (status === "authenticated" && session?.user) {
        setUser({
          id: parseInt(session.user.id || "0"),
          email: session.user.email || "",
          full_name: session.user.name || "",
          role: session.user.role || "user",
          business_unit_group_id: session.user.business_unit_group_id || undefined,
          group_name: session.user.group_name || undefined,
        })
      } else {
        // Fallback to localStorage for email/password users
        const userData = localStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      }
    } catch (error) {
      console.error("Failed to parse user data:", error)
    }
  }, [status, session])

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/tickets", label: "Tickets", icon: TicketIcon },
    { href: "/analytics", label: "Reports", icon: BarChart3, adminOnly: true },
    { href: "/master-data", label: "Master Settings", icon: Database, adminOnly: true },
  ]

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role?.toLowerCase() !== "admin") {
      return false
    }
    return true
  })

  const handleLogout = async () => {
    try {
      // Sign out from NextAuth (for SSO users)
      await signOut({ redirect: false, callbackUrl: "/login" })
    } catch (error) {
      console.error("NextAuth signOut error:", error)
    }

    // Clear localStorage (for email/password users)
    localStorage.removeItem("user")
    localStorage.removeItem("isLoggedIn")

    // Clear the authentication cookie
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Redirect to login page
    router.push("/login")
    router.refresh()
  }

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50 dark:bg-gray-800 dark:shadow-gray-300">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Nav Items - Left Aligned */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/company-logo.svg"
                alt="Company Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div className="hidden sm:block">
                <h1 className="font-poppins font-bold text-foreground text-xl leading-tight dark:text-white">
                  Ticket Portal
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation - Now left-aligned next to logo */}
            <nav className="hidden lg:flex items-center gap-1">
            {filteredNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary dark:bg-gray-600 text-white"
                      : "text-foreground hover:bg-surface dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
            </nav>
          </div>

          {/* Right Section - User Info */}
          <div className="flex items-center gap-3 ">
            <ThemeToggle 
            />
            <NotificationsDropdown />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-poppins font-bold text-xs">
                    {initials}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs text-foreground-secondary leading-tight">
                    {user?.group_name || user?.role || ""}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-foreground-secondary hidden md:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 "
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-600 rounded-lg shadow-lg border border-border py-2 z-50">
                    <div className="px-4 py-2 border-b border-border md:hidden ">
                      <p className="text-sm font-medium text-foreground">
                        {user?.full_name || "User"}
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        {user?.group_name || user?.role || ""}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-surface dark:hover:bg-gray-900"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50
                      dark:hover:bg-gray-900 flex items-center gap-2 dark:text-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-surface rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {filteredNavItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
