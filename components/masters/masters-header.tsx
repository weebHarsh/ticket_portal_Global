"use client"

import { Plus } from "lucide-react"

export default function MastersHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-poppins font-bold text-foreground">Master Data Management</h1>
        <p className="text-foreground-secondary mt-1">Configure ticket categories, teams, and system settings</p>
      </div>

      <button className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all">
        <Plus className="w-5 h-5" />
        Add New
      </button>
    </div>
  )
}
