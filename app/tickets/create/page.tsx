"use client"

import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateTicketForm from "@/components/tickets/create-ticket-form"

export default function CreateTicketPage() {
  const router = useRouter()

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
