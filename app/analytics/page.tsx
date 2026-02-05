"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import AnalyticsHeader from "@/components/analytics/analytics-header"
import AnalyticsCharts from "@/components/analytics/analytics-charts"

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }

    const parsedUser = JSON.parse(userData)
    const userRole = parsedUser.role?.toLowerCase()

    // Only admins can access this page
    if (userRole !== "admin") {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    setIsLoading(false)
  }, [router])

  // Show loading or nothing while checking permissions
  if (isLoading || !user || user.role?.toLowerCase() !== "admin") {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AnalyticsHeader />
        <AnalyticsCharts />
      </div>
    </DashboardLayout>
  )
}
