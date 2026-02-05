"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import MastersHeader from "@/components/masters/masters-header"
import MastersTabs from "@/components/masters/masters-tabs"

export default function MastersPage() {
  const [activeTab, setActiveTab] = useState("categories")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <MastersHeader />
        <MastersTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </DashboardLayout>
  )
}
