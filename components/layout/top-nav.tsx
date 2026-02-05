"use client"

import { Menu } from "lucide-react"
import { useEffect, useState } from "react"
import NotificationsDropdown from "./notifications-dropdown"

interface TopNavProps {
  onMenuClick: () => void
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const [userName, setUserName] = useState("User")

  useEffect(() => {
    try {
      const user = localStorage.getItem("user")
      if (user) {
        const userData = JSON.parse(user)
        setUserName(userData.name || userData.full_name || userData.email || "User")
      }
    } catch (error) {
      console.error("[v0] Failed to parse user data:", error)
      setUserName("User")
    }
  }, [])

  const initials = userName && typeof userName === "string" ? userName.charAt(0).toUpperCase() : "U"

  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
      <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-surface rounded-lg transition-colors">
        <Menu className="w-6 h-6 text-foreground" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <NotificationsDropdown />

        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow">
          <span className="text-white font-poppins font-bold text-sm">{initials}</span>
        </div>
      </div>
    </header>
  )
}
