"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateTicketForm from "@/components/tickets/create-ticket-form"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) return <div>Loading...</div>

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-foreground mb-2">New Ticket</h1>
          <p className="text-foreground-secondary">
            Fill in the details below to create a new work ticket. Fields will auto-populate based on your selections.
          </p>
        </div>

        <CreateTicketForm />
      </div>
    </DashboardLayout>
  )
}
