"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketsHeader from "@/components/tickets/tickets-header"
import TicketsFilter from "@/components/tickets/tickets-filter"
import TicketsTable from "@/components/tickets/tickets-table"
import { CheckCircle } from "lucide-react"

export default function TicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(!!searchParams.get("created"))
  const [filters, setFilters] = useState({})
  const [exportFn, setExportFn] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (showSuccess) {
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }, [showSuccess])

  const handleExportReady = (fn: () => void) => {
    setExportFn(() => fn)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {showSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-green-700 text-sm">Ticket created successfully: {searchParams.get("created")}</p>
          </div>
        )}
        <TicketsHeader />
        <TicketsFilter onFilterChange={setFilters} onExport={exportFn || undefined} />
        <TicketsTable filters={filters} onExportReady={handleExportReady} />
      </div>
    </DashboardLayout>
  )
}
