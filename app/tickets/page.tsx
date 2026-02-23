"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketsHeader from "@/components/tickets/tickets-header"
import TicketsFilter from "@/components/tickets/tickets-filter"
import TicketsTable from "@/components/tickets/tickets-table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CheckCircle } from "lucide-react"

export default function TicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(!!searchParams.get("created"))
  const [activeTab, setActiveTab] = useState<"customer" | "internal">("customer")
  const [filters, setFilters] = useState({})
  const [exportFn, setExportFn] = useState<(() => void) | null>(null)
  const [currentTickets, setCurrentTickets] = useState<any[]>([])

  useEffect(() => {
    if (showSuccess) {
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }, [showSuccess])

  const handleExportReady = (fn: () => void) => {
    setExportFn(() => fn)
  }

  const handleFilterChange = (newFilters: any) => {
    // Add isInternal filter based on active tab
    setFilters({
      ...newFilters,
      isInternal: activeTab === "internal",
    })
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "customer" | "internal")
    // Reset filters and tickets when switching tabs
    setFilters({
      isInternal: value === "internal",
    })
    setCurrentTickets([])
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-card dark:bg-gray-800 p-4 shadow-lg rounded-md w-full border border-border">
        {showSuccess && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-300 text-sm">Ticket created successfully: {searchParams.get("created")}</p>
          </div>
        )}
        <TicketsHeader />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="customer">Customer Tickets</TabsTrigger>
            <TabsTrigger value="internal">Internal Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            <TicketsFilter 
              onFilterChange={handleFilterChange} 
              onExport={exportFn || undefined}
              isInternal={false}
              tickets={currentTickets}
            />
            <TicketsTable 
              filters={filters} 
              onExportReady={handleExportReady}
              onTicketsChange={setCurrentTickets}
            />
          </TabsContent>

          <TabsContent value="internal" className="space-y-4">
            <TicketsFilter 
              onFilterChange={handleFilterChange} 
              onExport={exportFn || undefined}
              isInternal={true}
              tickets={currentTickets}
            />
            <TicketsTable 
              filters={filters} 
              onExportReady={handleExportReady}
              onTicketsChange={setCurrentTickets}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
