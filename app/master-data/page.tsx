"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import UnifiedMasterDataV2 from "@/components/master-data/unified-master-data-v2"

export default function MasterDataPage() {
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
        <div>
          <h1 className="text-3xl font-poppins font-bold text-foreground">
            Master Data Management
          </h1>
          <p className="text-foreground-secondary mt-2">
            Manage business groups, categories, subcategories, and ticket classification mappings
          </p>
        </div>

        <UnifiedMasterDataV2 />
      </div>
    </DashboardLayout>
  )
}
