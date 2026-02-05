"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

export default function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-poppins font-bold text-foreground">Ticket Dashboard</h1>
        <p className="text-foreground-secondary mt-1">Manage and track your work activities</p>
      </div>

      <Link
        href="/tickets/create"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Create Ticket
      </Link>
    </div>
  )
}
